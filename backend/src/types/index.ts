// Connection configuration sent from client
export interface ConnectionConfig {
  name: string;
  host: string;
  port: number;
  password?: string;
  database?: number;
  tls?: boolean;
}

// Key types supported by Redis
export type RedisKeyType = 'string' | 'list' | 'set' | 'zset' | 'hash' | 'stream' | 'none';

// Key information with metadata
export interface KeyInfo {
  name: string;
  type: RedisKeyType;
  ttl: number; // -1 = no expiry, -2 = key doesn't exist
  size?: number; // Length or cardinality depending on type
}

// Generic API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// Test connection result
export interface TestConnectionResult {
  connected: boolean;
  redisVersion?: string;
  mode?: string;
  uptimeSeconds?: number;
}

// Keys list result
export interface KeysListResult {
  cursor: string;
  keys: KeyInfo[];
  hasMore: boolean;
}

// String value result
export interface StringValueResult {
  value: string;
  ttl: number;
}

// List value result
export interface ListValueResult {
  length: number;
  items: Array<{ index: number; value: string }>;
  hasMore: boolean;
}

// Hash value result
export interface HashValueResult {
  cursor: string;
  fields: Array<{ field: string; value: string }>;
  hasMore: boolean;
}

// Set value result
export interface SetValueResult {
  cursor: string;
  members: string[];
  hasMore: boolean;
}

// Sorted set value result
export interface ZSetValueResult {
  cardinality: number;
  members: Array<{ member: string; score: number }>;
  hasMore: boolean;
}

// Stream message
export interface StreamMessage {
  id: string;
  timestamp: number;
  fields: Record<string, string>;
}

// Stream value result
export interface StreamValueResult {
  length: number;
  messages: StreamMessage[];
  hasMore: boolean;
}

// Request bodies
export interface TestConnectionRequest {
  host: string;
  port: number;
  password?: string;
  database?: number;
  tls?: boolean;
}

export interface KeysRequest {
  connection: ConnectionConfig;
  pattern?: string;
  cursor?: string;
  count?: number;
}

export interface KeyValueRequest {
  connection: ConnectionConfig;
  key: string;
}

export interface ListValueRequest extends KeyValueRequest {
  start?: number;
  stop?: number;
}

export interface HashValueRequest extends KeyValueRequest {
  cursor?: string;
  count?: number;
}

export interface SetValueRequest extends KeyValueRequest {
  cursor?: string;
  count?: number;
}

export interface ZSetValueRequest extends KeyValueRequest {
  start?: number;
  stop?: number;
  order?: 'asc' | 'desc';
}

export interface StreamValueRequest extends KeyValueRequest {
  start?: string;
  end?: string;
  count?: number;
}

