import { useApp } from '../context/AppContext';
import type { ConnectionConfig } from '../types';

/**
 * Hook for managing Redis connections
 * Provides a simplified interface to the app context
 */
export function useConnections() {
  const {
    state,
    addConnection,
    updateConnection,
    removeConnection,
    setActiveConnection,
    getActiveConnection,
  } = useApp();

  // Generate a unique ID for new connections
  const generateId = (): string => {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Add a new connection with auto-generated ID
  const createConnection = (config: Omit<ConnectionConfig, 'id'>): ConnectionConfig => {
    const connection: ConnectionConfig = {
      ...config,
      id: generateId(),
    };
    addConnection(connection);
    return connection;
  };

  // Check if a connection name already exists
  const isNameTaken = (name: string, excludeId?: string): boolean => {
    return state.connections.some(
      (conn) => conn.name.toLowerCase() === name.toLowerCase() && conn.id !== excludeId
    );
  };

  // Get connection by ID
  const getConnectionById = (id: string): ConnectionConfig | undefined => {
    return state.connections.find((conn) => conn.id === id);
  };

  return {
    // State
    connections: state.connections,
    activeConnectionId: state.activeConnectionId,
    activeConnection: getActiveConnection(),

    // Actions
    createConnection,
    updateConnection,
    removeConnection,
    setActiveConnection,

    // Utilities
    generateId,
    isNameTaken,
    getConnectionById,
  };
}

