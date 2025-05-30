import { createConnection, Connection, RowDataPacket, OkPacket, ResultSetHeader } from 'mysql2/promise';
import { dbConfig } from '~/config';

// MySQL连接实例
let connection: Connection | null = null;
let lastConnectionTime = 0;
const CONNECTION_TIMEOUT = 28800000; // 8小时超时（MySQL默认wait_timeout）
const RECONNECT_TIMEOUT = 5000; // 重连间隔
let isReconnecting = false;

/**
 * 检查连接是否有效
 * @param conn 连接实例
 * @returns 连接是否有效
 */
async function isConnectionAlive(conn: Connection): Promise<boolean> {
  try {
    await conn.ping();
    return true;
  } catch (error) {
    console.warn('[MySQL] Connection ping failed:', error);
    return false;
  }
}

/**
 * 创建新的MySQL连接
 * @returns 新的连接实例
 */
async function createNewConnection(): Promise<Connection> {
  console.log('[MySQL] Creating new connection...');
  try {
    const newConnection = await createConnection(dbConfig.mysql);
    
    // 设置连接事件监听
    newConnection.on('error', (err: any) => {
      console.error('[MySQL] Connection error:', err);
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || 
          err.code === 'ECONNRESET' || 
          err.code === 'ETIMEDOUT') {
        console.log('[MySQL] Connection lost, will reconnect on next query');
        connection = null;
        lastConnectionTime = 0;
      }
    });

    lastConnectionTime = Date.now();
    console.log('[MySQL] New connection created successfully');
    return newConnection;
  } catch (error) {
    console.error('[MySQL] Failed to create connection:', error);
    throw error;
  }
}

/**
 * 获取MySQL连接（支持断线重连）
 * @returns MySQL连接实例
 */
export const getMysqlConnection = async (): Promise<Connection> => {
  // 检查是否需要重新连接
  const needReconnect = !connection || 
    !lastConnectionTime || 
    (Date.now() - lastConnectionTime > CONNECTION_TIMEOUT);

  if (needReconnect) {
    if (isReconnecting) {
      // 如果正在重连，等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getMysqlConnection();
    }

    isReconnecting = true;
    try {
      // 关闭旧连接
      if (connection) {
        try {
          await connection.end();
        } catch (error) {
          console.warn('[MySQL] Error closing old connection:', error);
        }
        connection = null;
      }

      // 创建新连接
      connection = await createNewConnection();
    } catch (error) {
      console.error('[MySQL] Reconnection failed:', error);
      throw error;
    } finally {
      isReconnecting = false;
    }
  } else if (connection) {
    // 检查现有连接是否仍然有效
    const isAlive = await isConnectionAlive(connection);
    if (!isAlive) {
      console.log('[MySQL] Connection is dead, creating new connection');
      connection = null;
      return getMysqlConnection(); // 递归调用以创建新连接
    }
  }

  if (!connection) {
    throw new Error('Failed to establish MySQL connection');
  }

  return connection;
};

/**
 * 执行MySQL查询（支持断线重连）
 * @param sql SQL语句
 * @param params 查询参数
 * @param retryCount 重试次数
 * @returns 查询结果
 */
export const query = async <T = RowDataPacket[]>(
  sql: string, 
  params: any[] = [], 
  retryCount = 0
): Promise<T> => {
  const maxRetries = 3;
  
  try {
    console.log(`[MySQL] Executing query: ${sql}`);
    console.log(`[MySQL] Query parameters:`, params);
    console.log(`[MySQL] Parameter types:`, params.map(p => `${typeof p}: ${p === null ? 'null' : p}`));
    
    const conn = await getMysqlConnection();
    const [rows] = await conn.execute(sql, params);
    
    console.log(`[MySQL] Query returned ${Array.isArray(rows) ? rows.length : 1} row(s)`);
    return rows as T;
  } catch (error: any) {
    console.error('[MySQL] Query Error:', error);
    console.error(`[MySQL] SQL: ${sql}`);
    console.error(`[MySQL] Parameters:`, params);
    console.error(`[MySQL] Parameter types:`, params.map(p => `${typeof p}: ${p === null ? 'null' : p}`));
    
    // 检查是否是连接相关错误且还有重试次数
    if (retryCount < maxRetries && 
        (error.code === 'PROTOCOL_CONNECTION_LOST' || 
         error.code === 'ECONNRESET' || 
         error.code === 'ETIMEDOUT' ||
         error.code === 'CONNECTION_LOST')) {
      
      console.log(`[MySQL] Connection error detected, retrying... (${retryCount + 1}/${maxRetries})`);
      
      // 清除当前连接
      connection = null;
      lastConnectionTime = 0;
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, RECONNECT_TIMEOUT));
      
      // 递归重试
      return query<T>(sql, params, retryCount + 1);
    }
    
    throw error;
  }
};

/**
 * 执行插入操作（支持断线重连）
 * @param table 表名
 * @param data 要插入的数据对象
 * @param retryCount 重试次数
 * @returns 插入结果
 */
export const insert = async (
  table: string, 
  data: Record<string, any>, 
  retryCount = 0
): Promise<OkPacket> => {
  const maxRetries = 3;
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => '?').join(', ');
  
  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
  
  try {
    console.log(`[MySQL] Executing INSERT to ${table}:`, { keys, values });
    const conn = await getMysqlConnection();
    const [result] = await conn.execute(sql, values);
    console.log(`[MySQL] Insert successful, result:`, result);
    return result as OkPacket;
  } catch (error: any) {
    console.error(`[MySQL] Insert Error on table ${table}:`, error);
    console.error(`[MySQL] SQL: ${sql}`);
    console.error(`[MySQL] Parameters:`, values);
    console.error(`[MySQL] Parameter types:`, values.map(v => `${typeof v}: ${v === null ? 'null' : v}`));
    
    // 检查是否是连接相关错误且还有重试次数
    if (retryCount < maxRetries && 
        (error.code === 'PROTOCOL_CONNECTION_LOST' || 
         error.code === 'ECONNRESET' || 
         error.code === 'ETIMEDOUT' ||
         error.code === 'CONNECTION_LOST')) {
      
      console.log(`[MySQL] Connection error detected, retrying INSERT... (${retryCount + 1}/${maxRetries})`);
      
      // 清除当前连接
      connection = null;
      lastConnectionTime = 0;
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, RECONNECT_TIMEOUT));
      
      // 递归重试
      return insert(table, data, retryCount + 1);
    }
    
    throw error;
  }
};

/**
 * 执行更新操作（支持断线重连）
 * @param table 表名
 * @param data 要更新的数据对象
 * @param where WHERE条件
 * @param whereParams WHERE条件参数
 * @param retryCount 重试次数
 * @returns 更新结果
 */
export const update = async (
  table: string, 
  data: Record<string, any>, 
  where: string, 
  whereParams: any[] = [],
  retryCount = 0
): Promise<ResultSetHeader> => {
  const maxRetries = 3;
  const keys = Object.keys(data);
  const values = Object.values(data);
  
  const setClause = keys.map(key => `${key} = ?`).join(', ');
  const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
  
  try {
    const conn = await getMysqlConnection();
    const [result] = await conn.execute(sql, [...values, ...whereParams]);
    return result as ResultSetHeader;
  } catch (error: any) {
    console.error('MySQL Update Error:', error);
    
    // 检查是否是连接相关错误且还有重试次数
    if (retryCount < maxRetries && 
        (error.code === 'PROTOCOL_CONNECTION_LOST' || 
         error.code === 'ECONNRESET' || 
         error.code === 'ETIMEDOUT' ||
         error.code === 'CONNECTION_LOST')) {
      
      console.log(`[MySQL] Connection error detected, retrying UPDATE... (${retryCount + 1}/${maxRetries})`);
      
      // 清除当前连接
      connection = null;
      lastConnectionTime = 0;
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, RECONNECT_TIMEOUT));
      
      // 递归重试
      return update(table, data, where, whereParams, retryCount + 1);
    }
    
    throw error;
  }
};

/**
 * 执行删除操作（支持断线重连）
 * @param table 表名
 * @param where WHERE条件
 * @param params 条件参数
 * @param retryCount 重试次数
 * @returns 删除结果
 */
export const remove = async (
  table: string, 
  where: string, 
  params: any[] = [],
  retryCount = 0
): Promise<ResultSetHeader> => {
  const maxRetries = 3;
  const sql = `DELETE FROM ${table} WHERE ${where}`;
  
  try {
    const conn = await getMysqlConnection();
    const [result] = await conn.execute(sql, params);
    return result as ResultSetHeader;
  } catch (error: any) {
    console.error('MySQL Delete Error:', error);
    
    // 检查是否是连接相关错误且还有重试次数
    if (retryCount < maxRetries && 
        (error.code === 'PROTOCOL_CONNECTION_LOST' || 
         error.code === 'ECONNRESET' || 
         error.code === 'ETIMEDOUT' ||
         error.code === 'CONNECTION_LOST')) {
      
      console.log(`[MySQL] Connection error detected, retrying DELETE... (${retryCount + 1}/${maxRetries})`);
      
      // 清除当前连接
      connection = null;
      lastConnectionTime = 0;
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, RECONNECT_TIMEOUT));
      
      // 递归重试
      return remove(table, where, params, retryCount + 1);
    }
    
    throw error;
  }
};

/**
 * 关闭MySQL连接
 */
export const closeMysqlConnection = async (): Promise<void> => {
  if (connection) {
    try {
      console.log('[MySQL] Closing connection...');
      await connection.end();
      console.log('[MySQL] Connection closed successfully');
    } catch (error) {
      console.warn('[MySQL] Error closing connection:', error);
    } finally {
      connection = null;
      lastConnectionTime = 0;
    }
  }
}; 