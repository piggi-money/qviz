import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { AppState, AppAction, ConnectionConfig } from '../types';

const STORAGE_KEY = 'q-visualizer-connections';

// Initial state
const initialState: AppState = {
  connections: [],
  activeConnectionId: null,
  modalOpen: false,
  editingConnection: null,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_CONNECTION':
      return {
        ...state,
        connections: [...state.connections, action.payload],
        modalOpen: false,
        editingConnection: null,
      };

    case 'UPDATE_CONNECTION':
      return {
        ...state,
        connections: state.connections.map((conn) =>
          conn.id === action.payload.id ? action.payload : conn
        ),
        modalOpen: false,
        editingConnection: null,
      };

    case 'REMOVE_CONNECTION':
      return {
        ...state,
        connections: state.connections.filter((conn) => conn.id !== action.payload),
        activeConnectionId:
          state.activeConnectionId === action.payload ? null : state.activeConnectionId,
      };

    case 'SET_ACTIVE':
      return {
        ...state,
        activeConnectionId: action.payload,
      };

    case 'OPEN_MODAL':
      return {
        ...state,
        modalOpen: true,
        editingConnection: action.payload || null,
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        modalOpen: false,
        editingConnection: null,
      };

    case 'LOAD_CONNECTIONS':
      return {
        ...state,
        connections: action.payload,
      };

    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Helper functions
  addConnection: (connection: ConnectionConfig) => void;
  updateConnection: (connection: ConnectionConfig) => void;
  removeConnection: (id: string) => void;
  setActiveConnection: (id: string | null) => void;
  openModal: (connection?: ConnectionConfig) => void;
  closeModal: () => void;
  getActiveConnection: () => ConnectionConfig | undefined;
}

const AppContext = createContext<AppContextType | null>(null);

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load connections from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const connections = JSON.parse(stored) as ConnectionConfig[];
        dispatch({ type: 'LOAD_CONNECTIONS', payload: connections });
      }
    } catch (error) {
      console.error('Error loading connections from localStorage:', error);
    }
  }, []);

  // Save connections to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.connections));
    } catch (error) {
      console.error('Error saving connections to localStorage:', error);
    }
  }, [state.connections]);

  // Helper functions
  const addConnection = (connection: ConnectionConfig) => {
    dispatch({ type: 'ADD_CONNECTION', payload: connection });
  };

  const updateConnection = (connection: ConnectionConfig) => {
    dispatch({ type: 'UPDATE_CONNECTION', payload: connection });
  };

  const removeConnection = (id: string) => {
    dispatch({ type: 'REMOVE_CONNECTION', payload: id });
  };

  const setActiveConnection = (id: string | null) => {
    dispatch({ type: 'SET_ACTIVE', payload: id });
  };

  const openModal = (connection?: ConnectionConfig) => {
    dispatch({ type: 'OPEN_MODAL', payload: connection });
  };

  const closeModal = () => {
    dispatch({ type: 'CLOSE_MODAL' });
  };

  const getActiveConnection = () => {
    return state.connections.find((conn) => conn.id === state.activeConnectionId);
  };

  const value: AppContextType = {
    state,
    dispatch,
    addConnection,
    updateConnection,
    removeConnection,
    setActiveConnection,
    openModal,
    closeModal,
    getActiveConnection,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

