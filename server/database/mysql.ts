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
    const conn = await getMysqlConnection();
    const [rows] = await conn.execute(sql, params);
    return rows as T;
  } catch (error) {
    console.error('MySQL Query Error:', error);
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
    const conn = await getMysqlConnection();
    const [result] = await conn.execute(sql, values);
    return result as OkPacket;
  } catch (error) {
    console.error('MySQL Insert Error:', error);
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