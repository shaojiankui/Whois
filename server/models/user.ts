export interface User {
  id?: number;
  username: string;
  name?: string;
  password: string; // Will be stored as a hash
  gen_secret?: string;
  secret?: string;
  email: string;
  reg_time?: Date;
  update_time?: Date;
  reg_ip?: string;
  last_ip?: string;
}

export interface UserPreference {
  id?: number;
  user_id: number;
  preference_key: string;
  preference_value: string;
  add_time?: Date;
  update_time?: Date;
}

export interface QueryHistory {
  id?: number;
  user_id: number;
  domain: string;
  tag?: string;
  premium?: number;
  reg_price?: number;
  renew_price?: number;
  flag?: number;
  update_time?: Date;
  add_time?: Date;
  uuid?: string;
}

export interface ResetToken {
  id?: number;
  user_id: number;
  token: string;
  expires_at: Date;
  add_time?: Date;
} 