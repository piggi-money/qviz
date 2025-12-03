import { useState, useCallback } from 'react';
import type {
  ConnectionConfig,
  KeyInfo,
  KeysByType,
  RedisKeyType,
  StringValueResult,
  ListValueResult,
  HashValueResult,
  SetValueResult,
  ZSetValueResult,
  StreamValueResult,
} from '../types';
import {
  fetchAllKeys,
  fetchStringValue,
  fetchListValue,
  fetchHashValue,
  fetchSetValue,
  fetchZSetValue,
  fetchStreamValue,
} from '../services/api';

type KeyContentResult =
  | StringValueResult
  | ListValueResult
  | HashValueResult
  | SetValueResult
  | ZSetValueResult
  | StreamValueResult;

interface UseRedisDataReturn {
  // Keys state
  keys: KeyInfo[];
  keysByType: KeysByType;
  keysLoading: boolean;
  keysError: string | null;
  loadKeys: (connection: ConnectionConfig, pattern?: string) => Promise<void>;
  refreshKeys: () => Promise<void>;

  // Key content state
  keyContent: KeyContentResult | null;
  contentLoading: boolean;
  contentError: string | null;
  loadKeyContent: (
    connection: ConnectionConfig,
    key: string,
    type: RedisKeyType
  ) => Promise<void>;
  clearKeyContent: () => void;
}

/**
 * Hook for fetching and managing Redis data
 */
export function useRedisData(): UseRedisDataReturn {
  // Keys state
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keysError, setKeysError] = useState<string | null>(null);
  const [lastConnection, setLastConnection] = useState<ConnectionConfig | null>(null);
  const [lastPattern, setLastPattern] = useState('*');

  // Key content state
  const [keyContent, setKeyContent] = useState<KeyContentResult | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  // Group keys by type
  const keysByType: KeysByType = {
    string: keys.filter((k) => k.type === 'string'),
    list: keys.filter((k) => k.type === 'list'),
    set: keys.filter((k) => k.type === 'set'),
    zset: keys.filter((k) => k.type === 'zset'),
    hash: keys.filter((k) => k.type === 'hash'),
    stream: keys.filter((k) => k.type === 'stream'),
  };

  // Load keys from Redis
  const loadKeys = useCallback(async (connection: ConnectionConfig, pattern = '*') => {
    setKeysLoading(true);
    setKeysError(null);
    setLastConnection(connection);
    setLastPattern(pattern);

    try {
      const result = await fetchAllKeys(connection, pattern);

      if (result.success && result.data) {
        setKeys(result.data.keys);
      } else {
        setKeysError(result.error || 'Error desconocido al cargar keys');
        setKeys([]);
      }
    } catch (error) {
      setKeysError(error instanceof Error ? error.message : 'Error de conexión');
      setKeys([]);
    } finally {
      setKeysLoading(false);
    }
  }, []);

  // Refresh keys with last connection/pattern
  const refreshKeys = useCallback(async () => {
    if (lastConnection) {
      await loadKeys(lastConnection, lastPattern);
    }
  }, [lastConnection, lastPattern, loadKeys]);

  // Load content of a specific key
  const loadKeyContent = useCallback(
    async (connection: ConnectionConfig, key: string, type: RedisKeyType) => {
      setContentLoading(true);
      setContentError(null);

      try {
        let result;

        switch (type) {
          case 'string':
            result = await fetchStringValue(connection, key);
            break;
          case 'list':
            result = await fetchListValue(connection, key);
            break;
          case 'hash':
            result = await fetchHashValue(connection, key);
            break;
          case 'set':
            result = await fetchSetValue(connection, key);
            break;
          case 'zset':
            result = await fetchZSetValue(connection, key);
            break;
          case 'stream':
            result = await fetchStreamValue(connection, key);
            break;
          default:
            setContentError(`Tipo de key no soportado: ${type}`);
            return;
        }

        if (result.success && result.data) {
          setKeyContent(result.data);
        } else {
          setContentError(result.error || 'Error al cargar contenido');
          setKeyContent(null);
        }
      } catch (error) {
        setContentError(error instanceof Error ? error.message : 'Error de conexión');
        setKeyContent(null);
      } finally {
        setContentLoading(false);
      }
    },
    []
  );

  // Clear key content
  const clearKeyContent = useCallback(() => {
    setKeyContent(null);
    setContentError(null);
  }, []);

  return {
    // Keys
    keys,
    keysByType,
    keysLoading,
    keysError,
    loadKeys,
    refreshKeys,

    // Key content
    keyContent,
    contentLoading,
    contentError,
    loadKeyContent,
    clearKeyContent,
  };
}

