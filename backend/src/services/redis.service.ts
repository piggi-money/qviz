import Redis from 'ioredis';
import type {
  ConnectionConfig,
  TestConnectionResult,
  KeyInfo,
  RedisKeyType,
  KeysListResult,
  StringValueResult,
  ListValueResult,
  HashValueResult,
  SetValueResult,
  ZSetValueResult,
  StreamValueResult,
  StreamMessage,
} from '../types/index.js';

// Connection timeout in milliseconds
const CONNECT_TIMEOUT = 5000;
const COMMAND_TIMEOUT = 10000;

/**
 * Creates a Redis client with the given configuration
 */
function createClient(config: ConnectionConfig): Redis {
  return new Redis({
    host: config.host,
    port: config.port,
    password: config.password || undefined,
    db: config.database || 0,
    tls: config.tls ? {} : undefined,
    connectTimeout: CONNECT_TIMEOUT,
    commandTimeout: COMMAND_TIMEOUT,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // No automatic retry
    lazyConnect: true,
  });
}

/**
 * Wrapper to execute operations with an ephemeral Redis connection
 */
async function withRedisConnection<T>(
  config: ConnectionConfig,
  operation: (client: Redis) => Promise<T>
): Promise<T> {
  const client = createClient(config);
  
  try {
    await client.connect();
    return await operation(client);
  } finally {
    await client.quit().catch(() => {
      // Ignore quit errors
    });
  }
}

/**
 * Maps Redis errors to user-friendly messages
 */
export function mapRedisError(error: Error): { code: string; message: string } {
  const msg = error.message.toLowerCase();
  
  if (msg.includes('econnrefused')) {
    return {
      code: 'CONNECTION_REFUSED',
      message: `No se pudo conectar al servidor Redis. Verifica que el host y puerto sean correctos.`,
    };
  }
  
  if (msg.includes('etimedout') || msg.includes('timeout')) {
    return {
      code: 'TIMEOUT',
      message: 'La conexión expiró. El servidor Redis no respondió a tiempo.',
    };
  }
  
  if (msg.includes('noauth') || msg.includes('wrongpass') || msg.includes('invalid password')) {
    return {
      code: 'AUTH_FAILED',
      message: 'Autenticación fallida. Verifica la contraseña.',
    };
  }
  
  if (msg.includes('enotfound')) {
    return {
      code: 'HOST_NOT_FOUND',
      message: 'No se pudo resolver el host. Verifica el nombre del servidor.',
    };
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message,
  };
}

/**
 * Tests connection to a Redis instance
 */
export async function testConnection(config: ConnectionConfig): Promise<TestConnectionResult> {
  return withRedisConnection(config, async (client) => {
    await client.ping();
    
    const info = await client.info('server');
    const lines = info.split('\r\n');
    
    let redisVersion = 'unknown';
    let mode = 'standalone';
    let uptimeSeconds = 0;
    
    for (const line of lines) {
      if (line.startsWith('redis_version:')) {
        redisVersion = line.split(':')[1] || 'unknown';
      } else if (line.startsWith('redis_mode:')) {
        mode = line.split(':')[1] || 'standalone';
      } else if (line.startsWith('uptime_in_seconds:')) {
        uptimeSeconds = parseInt(line.split(':')[1] || '0', 10);
      }
    }
    
    return {
      connected: true,
      redisVersion,
      mode,
      uptimeSeconds,
    };
  });
}

/**
 * Gets the type of a key
 */
async function getKeyType(client: Redis, key: string): Promise<RedisKeyType> {
  const type = await client.type(key);
  return type as RedisKeyType;
}

/**
 * Gets the size of a key based on its type
 */
async function getKeySize(client: Redis, key: string, type: RedisKeyType): Promise<number | undefined> {
  switch (type) {
    case 'string':
      return await client.strlen(key);
    case 'list':
      return await client.llen(key);
    case 'set':
      return await client.scard(key);
    case 'zset':
      return await client.zcard(key);
    case 'hash':
      return await client.hlen(key);
    case 'stream':
      return await client.xlen(key);
    default:
      return undefined;
  }
}

/**
 * Scans and lists keys matching a pattern
 */
export async function scanKeys(
  config: ConnectionConfig,
  pattern = '*',
  cursor = '0',
  count = 100
): Promise<KeysListResult> {
  return withRedisConnection(config, async (client) => {
    const [newCursor, rawKeys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', count);
    
    // Get metadata for each key
    const keys: KeyInfo[] = await Promise.all(
      rawKeys.map(async (name) => {
        const type = await getKeyType(client, name);
        const ttl = await client.ttl(name);
        const size = await getKeySize(client, name, type);
        
        return { name, type, ttl, size };
      })
    );
    
    // Sort keys by name
    keys.sort((a, b) => a.name.localeCompare(b.name));
    
    return {
      cursor: newCursor,
      keys,
      hasMore: newCursor !== '0',
    };
  });
}

/**
 * Gets the value of a string key
 */
export async function getStringValue(
  config: ConnectionConfig,
  key: string
): Promise<StringValueResult> {
  return withRedisConnection(config, async (client) => {
    const [value, ttl] = await Promise.all([
      client.get(key),
      client.ttl(key),
    ]);
    
    return {
      value: value || '',
      ttl,
    };
  });
}

/**
 * Gets elements from a list
 */
export async function getListValue(
  config: ConnectionConfig,
  key: string,
  start = 0,
  stop = 49
): Promise<ListValueResult> {
  return withRedisConnection(config, async (client) => {
    const [length, values] = await Promise.all([
      client.llen(key),
      client.lrange(key, start, stop),
    ]);
    
    const items = values.map((value, i) => ({
      index: start + i,
      value,
    }));
    
    return {
      length,
      items,
      hasMore: stop < length - 1,
    };
  });
}

/**
 * Gets fields from a hash
 */
export async function getHashValue(
  config: ConnectionConfig,
  key: string,
  cursor = '0',
  count = 50
): Promise<HashValueResult> {
  return withRedisConnection(config, async (client) => {
    const [newCursor, rawFields] = await client.hscan(key, cursor, 'COUNT', count);
    
    // HSCAN returns alternating field/value pairs
    const fields: Array<{ field: string; value: string }> = [];
    for (let i = 0; i < rawFields.length; i += 2) {
      const field = rawFields[i];
      const value = rawFields[i + 1];
      if (field !== undefined && value !== undefined) {
        fields.push({ field, value });
      }
    }
    
    return {
      cursor: newCursor,
      fields,
      hasMore: newCursor !== '0',
    };
  });
}

/**
 * Gets members from a set
 */
export async function getSetValue(
  config: ConnectionConfig,
  key: string,
  cursor = '0',
  count = 50
): Promise<SetValueResult> {
  return withRedisConnection(config, async (client) => {
    const [newCursor, members] = await client.sscan(key, cursor, 'COUNT', count);
    
    return {
      cursor: newCursor,
      members,
      hasMore: newCursor !== '0',
    };
  });
}

/**
 * Gets members from a sorted set
 */
export async function getZSetValue(
  config: ConnectionConfig,
  key: string,
  start = 0,
  stop = 49,
  order: 'asc' | 'desc' = 'desc'
): Promise<ZSetValueResult> {
  return withRedisConnection(config, async (client) => {
    const cardinality = await client.zcard(key);
    
    let rawMembers: string[];
    if (order === 'desc') {
      rawMembers = await client.zrevrange(key, start, stop, 'WITHSCORES');
    } else {
      rawMembers = await client.zrange(key, start, stop, 'WITHSCORES');
    }
    
    // ZRANGE WITHSCORES returns alternating member/score pairs
    const members: Array<{ member: string; score: number }> = [];
    for (let i = 0; i < rawMembers.length; i += 2) {
      const member = rawMembers[i];
      const score = rawMembers[i + 1];
      if (member !== undefined && score !== undefined) {
        members.push({ member, score: parseFloat(score) });
      }
    }
    
    return {
      cardinality,
      members,
      hasMore: stop < cardinality - 1,
    };
  });
}

/**
 * Gets messages from a stream
 */
export async function getStreamValue(
  config: ConnectionConfig,
  key: string,
  start = '-',
  end = '+',
  count = 50
): Promise<StreamValueResult> {
  return withRedisConnection(config, async (client) => {
    const length = await client.xlen(key);
    const rawMessages = await client.xrange(key, start, end, 'COUNT', count);
    
    const messages: StreamMessage[] = rawMessages.map(([id, fieldsArray]) => {
      // Parse timestamp from ID (format: timestamp-sequence)
      const timestamp = parseInt(id.split('-')[0] || '0', 10);
      
      // Convert fields array to object
      const fields: Record<string, string> = {};
      for (let i = 0; i < fieldsArray.length; i += 2) {
        const fieldName = fieldsArray[i];
        const fieldValue = fieldsArray[i + 1];
        if (fieldName !== undefined && fieldValue !== undefined) {
          fields[fieldName] = fieldValue;
        }
      }
      
      return { id, timestamp, fields };
    });
    
    return {
      length,
      messages,
      hasMore: messages.length === count,
    };
  });
}

