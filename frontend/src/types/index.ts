// Connection configuration
export interface ConnectionConfig {
  id: string;
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
  ttl: number;
  size?: number;
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

// App state
export interface AppState {
  connections: ConnectionConfig[];
  activeConnectionId: string | null;
  modalOpen: boolean;
  editingConnection: ConnectionConfig | null;
}

// App actions
export type AppAction =
  | { type: 'ADD_CONNECTION'; payload: ConnectionConfig }
  | { type: 'UPDATE_CONNECTION'; payload: ConnectionConfig }
  | { type: 'REMOVE_CONNECTION'; payload: string }
  | { type: 'SET_ACTIVE'; payload: string | null }
  | { type: 'OPEN_MODAL'; payload?: ConnectionConfig }
  | { type: 'CLOSE_MODAL' }
  | { type: 'LOAD_CONNECTIONS'; payload: ConnectionConfig[] };

// Keys grouped by type
export interface KeysByType {
  string: KeyInfo[];
  list: KeyInfo[];
  set: KeyInfo[];
  zset: KeyInfo[];
  hash: KeyInfo[];
  stream: KeyInfo[];
}

