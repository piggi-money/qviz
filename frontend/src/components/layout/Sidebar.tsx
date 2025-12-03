import { Database, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useConnections } from '../../hooks/useConnections';
import { useToastContext } from '../../context/ToastContext';
import clsx from 'clsx';

export function Sidebar() {
  const { openModal } = useApp();
  const { connections, activeConnectionId, setActiveConnection, removeConnection, getConnectionById } = useConnections();
  const toast = useToastContext();

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const conn = getConnectionById(id);
    if (confirm('¿Eliminar esta conexión?')) {
      removeConnection(id);
      toast.info(`Conexión "${conn?.name}" eliminada`);
    }
  };

  return (
    <aside className="w-72 bg-secondary border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <Database className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-primary">Q-Visualizer</h1>
            <p className="text-xs text-secondary">Redis Monitor</p>
          </div>
        </div>
      </div>

      {/* Connections List */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-secondary uppercase tracking-wide">
            Conexiones
          </span>
          <span className="text-xs text-secondary">{connections.length}</span>
        </div>

        {connections.length === 0 ? (
          <div className="text-center py-8">
            <Database className="w-10 h-10 text-secondary mx-auto mb-3 opacity-50" />
            <p className="text-sm text-secondary">Sin conexiones</p>
            <p className="text-xs text-secondary mt-1">
              Agrega una conexión Redis para comenzar
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {connections.map((conn) => (
              <button
                key={conn.id}
                onClick={() => setActiveConnection(conn.id)}
                className={clsx(
                  'w-full text-left px-3 py-2.5 rounded-lg transition-colors group',
                  activeConnectionId === conn.id
                    ? 'bg-accent/10 text-accent'
                    : 'hover:bg-tertiary text-primary'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={clsx(
                        'w-2 h-2 rounded-full flex-shrink-0',
                        activeConnectionId === conn.id ? 'bg-accent-green' : 'bg-secondary'
                      )}
                    />
                    <span className="font-medium truncate">{conn.name}</span>
                  </div>
                  <button
                    onClick={(e) => handleRemove(e, conn.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent-red/20 rounded transition-all"
                    title="Eliminar conexión"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-accent-red" />
                  </button>
                </div>
                <div className="text-xs text-secondary mt-0.5 pl-4">
                  {conn.host}:{conn.port}
                  {conn.database ? ` / db${conn.database}` : ''}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add Connection Button */}
      <div className="p-3 border-t border-border">
        <button
          onClick={() => openModal()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva conexión
        </button>
      </div>
    </aside>
  );
}

