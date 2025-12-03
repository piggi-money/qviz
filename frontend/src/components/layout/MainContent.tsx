import { RefreshCw, Database, Keyboard } from 'lucide-react';
import { useConnections } from '../../hooks/useConnections';
import { useRedisData } from '../../hooks/useRedisData';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useApp } from '../../context/AppContext';
import { KeyExplorer } from '../../components/KeyExplorer';
import { useEffect } from 'react';

export function MainContent() {
  const { activeConnection } = useConnections();
  const { openModal, closeModal, state } = useApp();
  const { keys, keysByType, keysLoading, keysError, loadKeys, refreshKeys } = useRedisData();

  // Load keys when connection changes
  useEffect(() => {
    if (activeConnection) {
      loadKeys(activeConnection);
    }
  }, [activeConnection, loadKeys]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onRefresh: () => {
      if (activeConnection && !keysLoading) {
        refreshKeys();
      }
    },
    onEscape: () => {
      if (state.modalOpen) {
        closeModal();
      }
    },
    onNewConnection: () => {
      if (!state.modalOpen) {
        openModal();
      }
    },
  });

  // No connection selected
  if (!activeConnection) {
    return (
      <main className="flex-1 flex items-center justify-center bg-primary">
        <div className="text-center max-w-md">
          <Database className="w-16 h-16 text-secondary mx-auto mb-4 opacity-30" />
          <h2 className="text-xl font-semibold text-primary mb-2">
            Selecciona una conexión
          </h2>
          <p className="text-secondary mb-6">
            Elige una conexión Redis del panel lateral o agrega una nueva para comenzar a
            explorar las keys.
          </p>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-colors"
          >
            Nueva conexión
          </button>
          
          {/* Keyboard shortcuts hint */}
          <div className="mt-8 flex items-center justify-center gap-4 text-xs text-secondary">
            <div className="flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5" />
              <span>Atajos:</span>
            </div>
            <kbd className="px-1.5 py-0.5 bg-tertiary rounded text-xs">N</kbd>
            <span>Nueva conexión</span>
            <kbd className="px-1.5 py-0.5 bg-tertiary rounded text-xs">R</kbd>
            <span>Refrescar</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-secondary border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
          <div>
            <h2 className="font-medium text-primary">{activeConnection.name}</h2>
            <p className="text-xs text-secondary">
              {activeConnection.host}:{activeConnection.port}
              {activeConnection.database ? ` / db${activeConnection.database}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-secondary">
            {keys.length} key{keys.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={refreshKeys}
            disabled={keysLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-tertiary hover:bg-border rounded-lg text-sm transition-colors disabled:opacity-50"
            title="Refrescar (R)"
          >
            <RefreshCw className={`w-4 h-4 ${keysLoading ? 'animate-spin' : ''}`} />
            Refrescar
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {keysError ? (
          <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-4 animate-fade-in">
            <p className="text-accent-red font-medium">Error al cargar keys</p>
            <p className="text-sm text-secondary mt-1">{keysError}</p>
            <button
              onClick={refreshKeys}
              className="mt-3 text-sm text-accent hover:underline"
            >
              Reintentar
            </button>
          </div>
        ) : keysLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <Database className="w-12 h-12 text-secondary mx-auto mb-3 opacity-30" />
            <p className="text-secondary">No se encontraron keys</p>
            <p className="text-xs text-secondary mt-1">
              La base de datos está vacía o el patrón no coincide con ninguna key
            </p>
          </div>
        ) : (
          <div className="animate-fade-in">
            <KeyExplorer
              connection={activeConnection}
              keysByType={keysByType}
            />
          </div>
        )}
      </div>
    </main>
  );
}
