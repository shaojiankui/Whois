import { createConnection, Connection, RowDataPacket, OkPacket, ResultSetHeader } from 'mysql2/promise';
import { dbConfig } from '~/config';

// MySQL连接池
let connection: Connection | null = null;

/**
 * 获取MySQL连接
 * @returns MySQL连接实例
 */
export const getMysqlConnection = async (): Promise<Connection> => {
  if (!connection) {
    connection = await createConnection(dbConfig.mysql);
  }
  return connection;
};

/**
 * 执行MySQL查询
 * @param sql SQL语句
 * @param params 查询参数
 * @returns 查询结果
 */
export const query = async <T = RowDataPacket[]>(sql: string, params: any[] = []): Promise<T> => {
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
    throw error;
  }
};

/**
 * 执行插入操作
 * @param table 表名
 * @param data 要插入的数据对象
 * @returns 插入结果
 */
export const insert = async (table: string, data: Record<string, any>): Promise<OkPacket> => {
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
    throw error;
  }
};

/**
 * 执行更新操作
 * @param table 表名
 * @param data 要更新的数据对象
 * @param where WHERE条件
 * @returns 更新结果
 */
export const update = async (
  table: string, 
  data: Record<string, any>, 
  where: string, 
  whereParams: any[] = []
): Promise<ResultSetHeader> => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  
  const setClause = keys.map(key => `${key} = ?`).join(', ');
  const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
  
  try {
    const conn = await getMysqlConnection();
    const [result] = await conn.execute(sql, [...values, ...whereParams]);
    return result as ResultSetHeader;
  } catch (error) {
    console.error('MySQL Update Error:', error);
    throw error;
  }
};

/**
 * 执行删除操作
 * @param table 表名
 * @param where WHERE条件
 * @param params 条件参数
 * @returns 删除结果
 */
export const remove = async (
  table: string, 
  where: string, 
  params: any[] = []
): Promise<ResultSetHeader> => {
  const sql = `DELETE FROM ${table} WHERE ${where}`;
  
  try {
    const conn = await getMysqlConnection();
    const [result] = await conn.execute(sql, params);
    return result as ResultSetHeader;
  } catch (error) {
    console.error('MySQL Delete Error:', error);
    throw error;
  }
};

/**
 * 关闭MySQL连接
 */
export const closeMysqlConnection = async (): Promise<void> => {
  if (connection) {
    await connection.end();
    connection = null;
  }
}; 