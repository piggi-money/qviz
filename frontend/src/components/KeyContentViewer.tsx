import { useState, useEffect } from 'react';
import { Loader2, Copy, Check } from 'lucide-react';
import type { ConnectionConfig, KeyInfo, RedisKeyType } from '../types';
import {
  fetchStringValue,
  fetchListValue,
  fetchHashValue,
  fetchSetValue,
  fetchZSetValue,
  fetchStreamValue,
} from '../services/api';

interface KeyContentViewerProps {
  connection: ConnectionConfig;
  keyInfo: KeyInfo;
}

export function KeyContentViewer({ connection, keyInfo }: KeyContentViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<unknown>(null);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      setError(null);

      try {
        let result;
        switch (keyInfo.type) {
          case 'string':
            result = await fetchStringValue(connection, keyInfo.name);
            break;
          case 'list':
            result = await fetchListValue(connection, keyInfo.name);
            break;
          case 'hash':
            result = await fetchHashValue(connection, keyInfo.name);
            break;
          case 'set':
            result = await fetchSetValue(connection, keyInfo.name);
            break;
          case 'zset':
            result = await fetchZSetValue(connection, keyInfo.name);
            break;
          case 'stream':
            result = await fetchStreamValue(connection, keyInfo.name);
            break;
          default:
            setError(`Tipo no soportado: ${keyInfo.type}`);
            return;
        }

        if (result.success && result.data) {
          setContent(result.data);
        } else {
          setError(result.error || 'Error al cargar contenido');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [connection, keyInfo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 text-accent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-accent-red/10 border border-accent-red/30 rounded-lg text-sm text-accent-red">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-tertiary rounded-lg border border-border overflow-hidden">
      <ContentRenderer type={keyInfo.type} content={content} />
    </div>
  );
}

interface ContentRendererProps {
  type: RedisKeyType;
  content: unknown;
}

function ContentRenderer({ type, content }: ContentRendererProps) {
  switch (type) {
    case 'string':
      return <StringContent content={content as { value: string; ttl: number }} />;
    case 'list':
      return <ListContent content={content as { items: Array<{ index: number; value: string }> }} />;
    case 'hash':
      return <HashContent content={content as { fields: Array<{ field: string; value: string }> }} />;
    case 'set':
      return <SetContent content={content as { members: string[] }} />;
    case 'zset':
      return <ZSetContent content={content as { members: Array<{ member: string; score: number }> }} />;
    case 'stream':
      return <StreamContent content={content as { messages: Array<{ id: string; timestamp: number; fields: Record<string, string> }> }} />;
    default:
      return <div className="p-3 text-secondary">Tipo no soportado</div>;
  }
}

// String Content
function StringContent({ content }: { content: { value: string; ttl: number } }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isJson = content.value.startsWith('{') || content.value.startsWith('[');
  let formattedValue = content.value;

  if (isJson) {
    try {
      formattedValue = JSON.stringify(JSON.parse(content.value), null, 2);
    } catch {
      // Not valid JSON, keep original
    }
  }

  return (
    <div className="relative">
      <pre className="p-3 text-sm font-mono text-primary overflow-x-auto whitespace-pre-wrap break-all max-h-64 overflow-y-auto">
        {formattedValue}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 bg-secondary hover:bg-border rounded transition-colors"
        title="Copiar valor"
      >
        {copied ? (
          <Check className="w-4 h-4 text-accent-green" />
        ) : (
          <Copy className="w-4 h-4 text-secondary" />
        )}
      </button>
    </div>
  );
}

// List Content
function ListContent({ content }: { content: { items: Array<{ index: number; value: string }> } }) {
  return (
    <div className="divide-y divide-border max-h-64 overflow-y-auto">
      {content.items.map((item) => (
        <div key={item.index} className="flex items-start gap-3 p-2">
          <span className="text-xs text-secondary font-mono w-8 text-right flex-shrink-0">
            {item.index}
          </span>
          <span className="text-sm font-mono text-primary break-all">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

// Hash Content
function HashContent({ content }: { content: { fields: Array<{ field: string; value: string }> } }) {
  return (
    <div className="divide-y divide-border max-h-64 overflow-y-auto">
      {content.fields.map((item) => (
        <div key={item.field} className="flex items-start gap-3 p-2">
          <span className="text-sm font-mono text-accent w-32 flex-shrink-0 truncate">
            {item.field}
          </span>
          <span className="text-sm font-mono text-primary break-all">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

// Set Content
function SetContent({ content }: { content: { members: string[] } }) {
  return (
    <div className="divide-y divide-border max-h-64 overflow-y-auto">
      {content.members.map((member, i) => (
        <div key={i} className="p-2">
          <span className="text-sm font-mono text-primary break-all">{member}</span>
        </div>
      ))}
    </div>
  );
}

// ZSet Content
function ZSetContent({ content }: { content: { members: Array<{ member: string; score: number }> } }) {
  return (
    <div className="divide-y divide-border max-h-64 overflow-y-auto">
      {content.members.map((item, i) => (
        <div key={i} className="flex items-start justify-between gap-3 p-2">
          <span className="text-sm font-mono text-primary break-all">{item.member}</span>
          <span className="text-xs font-mono text-accent-yellow flex-shrink-0">
            {item.score}
          </span>
        </div>
      ))}
    </div>
  );
}

// Stream Content
function StreamContent({ content }: { content: { messages: Array<{ id: string; timestamp: number; fields: Record<string, string> }> } }) {
  return (
    <div className="divide-y divide-border max-h-64 overflow-y-auto">
      {content.messages.map((msg) => (
        <div key={msg.id} className="p-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-accent">{msg.id}</span>
            <span className="text-xs text-secondary">
              {new Date(msg.timestamp).toLocaleString()}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(msg.fields).map(([key, value]) => (
              <div key={key} className="text-xs">
                <span className="text-secondary">{key}:</span>{' '}
                <span className="text-primary font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

