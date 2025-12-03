import { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useConnections } from '../hooks/useConnections';
import { useToastContext } from '../context/ToastContext';
import { testConnection } from '../services/api';
import type { TestConnectionResult } from '../types';

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

export function ConnectionModal() {
  const { state, closeModal } = useApp();
  const { createConnection, updateConnection, isNameTaken } = useConnections();
  const toast = useToastContext();

  const isEditing = !!state.editingConnection;

  // Form state
  const [name, setName] = useState('');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState('6379');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('0');
  const [tls, setTls] = useState(false);

  // Test state
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load editing data
  useEffect(() => {
    if (state.editingConnection) {
      const conn = state.editingConnection;
      setName(conn.name);
      setHost(conn.host);
      setPort(conn.port.toString());
      setPassword(conn.password || '');
      setDatabase(conn.database?.toString() || '0');
      setTls(conn.tls || false);
    }
  }, [state.editingConnection]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (isNameTaken(name, state.editingConnection?.id)) {
      newErrors.name = 'Ya existe una conexión con este nombre';
    }

    if (!host.trim()) {
      newErrors.host = 'El host es requerido';
    }

    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      newErrors.port = 'Puerto inválido (1-65535)';
    }

    const dbNum = parseInt(database, 10);
    if (isNaN(dbNum) || dbNum < 0 || dbNum > 15) {
      newErrors.database = 'Base de datos inválida (0-15)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Test connection
  const handleTest = async () => {
    setTestStatus('testing');
    setTestResult(null);
    setTestError(null);

    const result = await testConnection({
      host,
      port: parseInt(port, 10),
      password: password || undefined,
      database: parseInt(database, 10),
      tls,
    });

    if (result.success && result.data) {
      setTestStatus('success');
      setTestResult(result.data);
    } else {
      setTestStatus('error');
      setTestError(result.error || 'Error desconocido');
    }
  };

  // Save connection
  const handleSave = () => {
    if (!validate()) return;

    const connectionData = {
      name: name.trim(),
      host: host.trim(),
      port: parseInt(port, 10),
      password: password || undefined,
      database: parseInt(database, 10),
      tls,
    };

    if (isEditing && state.editingConnection) {
      updateConnection({
        ...connectionData,
        id: state.editingConnection.id,
      });
      toast.success(`Conexión "${name}" actualizada`);
    } else {
      createConnection(connectionData);
      toast.success(`Conexión "${name}" creada`);
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [closeModal]);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-secondary rounded-xl border border-border w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-primary">
            {isEditing ? 'Editar conexión' : 'Nueva conexión'}
          </h2>
          <button
            onClick={closeModal}
            className="p-1.5 hover:bg-tertiary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-secondary" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mi Redis"
              className="w-full px-3 py-2 bg-tertiary border border-border rounded-lg text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            {errors.name && (
              <p className="text-xs text-accent-red mt-1">{errors.name}</p>
            )}
          </div>

          {/* Host & Port */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-primary mb-1.5">
                Host
              </label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="localhost"
                className="w-full px-3 py-2 bg-tertiary border border-border rounded-lg text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              {errors.host && (
                <p className="text-xs text-accent-red mt-1">{errors.host}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">
                Puerto
              </label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="6379"
                className="w-full px-3 py-2 bg-tertiary border border-border rounded-lg text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              {errors.port && (
                <p className="text-xs text-accent-red mt-1">{errors.port}</p>
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">
              Contraseña <span className="text-secondary font-normal">(opcional)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-tertiary border border-border rounded-lg text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>

          {/* Database & TLS */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">
                Database
              </label>
              <input
                type="number"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                min="0"
                max="15"
                className="w-full px-3 py-2 bg-tertiary border border-border rounded-lg text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              {errors.database && (
                <p className="text-xs text-accent-red mt-1">{errors.database}</p>
              )}
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tls}
                  onChange={(e) => setTls(e.target.checked)}
                  className="w-4 h-4 rounded border-border bg-tertiary text-accent focus:ring-accent focus:ring-offset-0"
                />
                <span className="text-sm text-primary">Usar TLS/SSL</span>
              </label>
            </div>
          </div>

          {/* Test Connection */}
          <div className="pt-2">
            <button
              onClick={handleTest}
              disabled={testStatus === 'testing'}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-tertiary hover:bg-border rounded-lg text-primary transition-colors disabled:opacity-50"
            >
              {testStatus === 'testing' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Probando conexión...
                </>
              ) : (
                'Probar conexión'
              )}
            </button>

            {/* Test Result */}
            {testStatus === 'success' && testResult && (
              <div className="mt-3 p-3 bg-accent-green/10 border border-accent-green/30 rounded-lg">
                <div className="flex items-center gap-2 text-accent-green font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Conexión exitosa
                </div>
                <p className="text-xs text-secondary mt-1">
                  Redis {testResult.redisVersion} • {testResult.mode} • Uptime:{' '}
                  {Math.floor((testResult.uptimeSeconds || 0) / 3600)}h
                </p>
              </div>
            )}

            {testStatus === 'error' && (
              <div className="mt-3 p-3 bg-accent-red/10 border border-accent-red/30 rounded-lg">
                <div className="flex items-center gap-2 text-accent-red font-medium">
                  <XCircle className="w-4 h-4" />
                  Error de conexión
                </div>
                <p className="text-xs text-secondary mt-1">{testError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
          <button
            onClick={closeModal}
            className="px-4 py-2 text-secondary hover:text-primary transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-colors"
          >
            {isEditing ? 'Guardar cambios' : 'Crear conexión'}
          </button>
        </div>
      </div>
    </div>
  );
}

