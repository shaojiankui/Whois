import { query, insert, update, remove } from '../database/mysql';
import { User, UserPreference, QueryHistory, ResetToken } from '../models/user';
import { RowDataPacket, OkPacket } from 'mysql2';

// ---------------------------------------------------------------
// User related methods
// ---------------------------------------------------------------

/**
 * Create a new user
 */
export const createUser = async (user: User): Promise<number> => {
  const result = await insert('users', {
    username: user.username,
    name: user.name || user.username,
    email: user.email,
    password: user.password,
    gen_secret: user.gen_secret || null,
    secret: user.secret || null,
    reg_time: new Date(),
    update_time: new Date(),
    reg_ip: user.reg_ip || null,
    last_ip: user.last_ip || null
  });
  return result.insertId;
};

/**
 * Find user by email
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  const result = await query<(User & RowDataPacket)[]>(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  
  if (result.length === 0) {
    return null;
  }
  
  return {
    id: result[0].id,
    username: result[0].username,
    name: result[0].name,
    email: result[0].email,
    password: result[0].password,
    gen_secret: result[0].gen_secret,
    secret: result[0].secret,
    reg_time: result[0].reg_time,
    update_time: result[0].update_time,
    reg_ip: result[0].reg_ip,
    last_ip: result[0].last_ip
  };
};

/**
 * Find user by ID
 */
export const findUserById = async (id: number): Promise<User | null> => {
  const result = await query<(User & RowDataPacket)[]>(
    'SELECT * FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  
  if (result.length === 0) {
    return null;
  }
  
  return {
    id: result[0].id,
    username: result[0].username,
    name: result[0].name,
    email: result[0].email,
    password: result[0].password,
    gen_secret: result[0].gen_secret,
    secret: result[0].secret,
    reg_time: result[0].reg_time,
    update_time: result[0].update_time,
    reg_ip: result[0].reg_ip,
    last_ip: result[0].last_ip
  };
};

/**
 * Update user
 */
export const updateUser = async (id: number, userData: Partial<User>): Promise<boolean> => {
  const updateData: Record<string, any> = {
    ...userData,
    update_time: new Date()
  };
  
  delete updateData.id;
  delete updateData.reg_time;
  
  const result = await update('users', updateData, 'id = ?', [id]);
  return result.affectedRows > 0;
};

/**
 * Update user last IP
 */
export const updateUserLastIp = async (id: number, ip: string): Promise<boolean> => {
  const result = await update(
    'users',
    { last_ip: ip, update_time: new Date() },
    'id = ?',
    [id]
  );
  
  return result.affectedRows > 0;
};

// ---------------------------------------------------------------
// User preferences methods
// ---------------------------------------------------------------

/**
 * Get user preferences
 */
export const getUserPreferences = async (userId: number): Promise<UserPreference[]> => {
  const result = await query<(UserPreference & RowDataPacket)[]>(
    'SELECT * FROM user_preferences WHERE user_id = ?',
    [userId]
  );
  
  return result.map(row => ({
    id: row.id,
    user_id: row.user_id,
    preference_key: row.preference_key,
    preference_value: row.preference_value,
    add_time: row.add_time,
    update_time: row.update_time
  }));
};

/**
 * Set user preference
 */
export const setUserPreference = async (
  userId: number, 
  key: string, 
  value: string
): Promise<void> => {
  // Check if preference already exists
  const existing = await query<RowDataPacket[]>(
    'SELECT id FROM user_preferences WHERE user_id = ? AND preference_key = ?',
    [userId, key]
  );
  
  if (existing.length > 0) {
    // Update existing preference
    await update(
      'user_preferences',
      { preference_value: value, update_time: new Date() },
      'id = ?',
      [existing[0].id]
    );
  } else {
    // Create new preference
    await insert('user_preferences', {
      user_id: userId,
      preference_key: key,
      preference_value: value,
      add_time: new Date(),
      update_time: new Date()
    });
  }
};

// ---------------------------------------------------------------
// Query history methods
// ---------------------------------------------------------------

/**
 * Save query history
 */
export const saveQueryHistory = async (queryHistory: QueryHistory): Promise<number> => {
  // Create a new object with explicitly converted types to match the database schema
  // This prevents type mismatch errors in MySQL prepared statements
  try {
    console.log('Saving query history with data:', queryHistory);
    
    // Ensure all fields have proper types to prevent MySQL errors
    const insertData = {
      user_id: Number(queryHistory.user_id),
      domain: String(queryHistory.domain),
      tag: queryHistory.tag ? String(queryHistory.tag) : null,
      premium: queryHistory.premium !== undefined ? Number(queryHistory.premium) : 0,
      reg_price: queryHistory.reg_price !== undefined ? Number(queryHistory.reg_price) : null,
      renew_price: queryHistory.renew_price !== undefined ? Number(queryHistory.renew_price) : null,
      flag: queryHistory.flag !== undefined ? Number(queryHistory.flag) : 0,
      add_time: new Date(),
      update_time: new Date(),
      uuid: queryHistory.uuid ? String(queryHistory.uuid) : null
    };
    
    console.log('Converted insert data:', insertData);
    
    const result = await insert('query_history', insertData);
    
    console.log('Query history saved with ID:', result.insertId);
    return result.insertId;
  } catch (error) {
    console.error('Error saving query history:', error);
    throw error;
  }
};

/**
 * Get user query history
 */
export const getUserQueryHistory = async (
  userId: number, 
  limit: number = 20, 
  offset: number = 0
): Promise<QueryHistory[]> => {
  try {
    console.log('Getting query history with params:', { userId, limit, offset });
    
    // Convert parameters to ensure correct types
    const userIdNum = Number(userId);
    const limitNum = Number(limit);
    const offsetNum = Number(offset);
    
    // Use a direct query with hardcoded limit and offset to avoid prepared statement issues
    const sql = `SELECT * FROM query_history WHERE user_id = ? ORDER BY add_time DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
    
    console.log('Using SQL query:', sql);
    console.log('With parameters:', [userIdNum]);
    
    const result = await query<(QueryHistory & RowDataPacket)[]>(
      sql,
      [userIdNum]
    );
    
    console.log(`Retrieved ${result.length} history records`);
    
    return result.map(row => ({
      id: row.id,
      user_id: row.user_id,
      domain: row.domain,
      tag: row.tag,
      premium: row.premium,
      reg_price: row.reg_price,
      renew_price: row.renew_price,
      flag: row.flag,
      add_time: row.add_time,
      update_time: row.update_time,
      uuid: row.uuid
    }));
  } catch (error) {
    console.error('Error retrieving user query history:', error);
    throw error;
  }
};

/**
 * Delete query history
 */
export const deleteQueryHistory = async (id: number, userId: number): Promise<boolean> => {
  const result = await remove(
    'query_history',
    'id = ? AND user_id = ?',
    [id, userId]
  );
  
  return result.affectedRows > 0;
};

// ---------------------------------------------------------------
// Password reset methods
// ---------------------------------------------------------------

/**
 * Create password reset token
 */
export const createResetToken = async (userId: number, token: string, expiresAt: Date): Promise<number> => {
  // Remove any existing tokens for this user
  await remove('reset_tokens', 'user_id = ?', [userId]);
  
  // Create new token
  const result = await insert('reset_tokens', {
    user_id: userId,
    token,
    expires_at: expiresAt,
    add_time: new Date()
  });
  
  return result.insertId;
};

/**
 * Find reset token
 */
export const findResetToken = async (token: string): Promise<ResetToken | null> => {
  const result = await query<(ResetToken & RowDataPacket)[]>(
    'SELECT * FROM reset_tokens WHERE token = ? AND expires_at > NOW() LIMIT 1',
    [token]
  );
  
  if (result.length === 0) {
    return null;
  }
  
  return {
    id: result[0].id,
    user_id: result[0].user_id,
    token: result[0].token,
    expires_at: result[0].expires_at,
    add_time: result[0].add_time
  };
};

/**
 * Delete reset token
 */
export const deleteResetToken = async (token: string): Promise<boolean> => {
  const result = await remove('reset_tokens', 'token = ?', [token]);
  return result.affectedRows > 0;
}; 