import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Type,
  List,
  Hash,
  Layers,
  GitBranch,
  Radio,
} from 'lucide-react';
import clsx from 'clsx';
import type { ConnectionConfig, KeysByType, KeyInfo, RedisKeyType } from '../types';
import { KeyContentViewer } from './KeyContentViewer';

interface KeyExplorerProps {
  connection: ConnectionConfig;
  keysByType: KeysByType;
}

interface KeyTypeConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const TYPE_CONFIG: Record<RedisKeyType, KeyTypeConfig> = {
  string: { label: 'Strings', icon: Type, color: 'text-green-400' },
  list: { label: 'Lists', icon: List, color: 'text-blue-400' },
  hash: { label: 'Hashes', icon: Hash, color: 'text-purple-400' },
  set: { label: 'Sets', icon: Layers, color: 'text-yellow-400' },
  zset: { label: 'Sorted Sets', icon: GitBranch, color: 'text-orange-400' },
  stream: { label: 'Streams', icon: Radio, color: 'text-pink-400' },
  none: { label: 'None', icon: Type, color: 'text-gray-400' },
};

export function KeyExplorer({ connection, keysByType }: KeyExplorerProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<RedisKeyType>>(new Set());
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const toggleGroup = (type: RedisKeyType) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const toggleKey = (keyName: string) => {
    setExpandedKey((prev) => (prev === keyName ? null : keyName));
  };

  // Get types that have keys
  const typesWithKeys = (Object.keys(keysByType) as Array<keyof KeysByType>).filter(
    (type) => keysByType[type] && keysByType[type].length > 0
  );

  if (typesWithKeys.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {typesWithKeys.map((type) => {
        const config = TYPE_CONFIG[type];
        const keys = keysByType[type];
        const isGroupExpanded = expandedGroups.has(type);
        const Icon = config.icon;

        return (
          <div key={type} className="bg-secondary rounded-lg border border-border overflow-hidden">
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(type)}
              className="w-full flex items-center justify-between p-3 hover:bg-tertiary transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className={clsx('w-4 h-4', config.color)} />
                <span className="font-medium text-primary">{config.label}</span>
                <span className="text-xs text-secondary bg-tertiary px-2 py-0.5 rounded-full">
                  {keys.length}
                </span>
              </div>
              {isGroupExpanded ? (
                <ChevronDown className="w-4 h-4 text-secondary" />
              ) : (
                <ChevronRight className="w-4 h-4 text-secondary" />
              )}
            </button>

            {/* Keys List */}
            {isGroupExpanded && (
              <div className="border-t border-border">
                {keys.map((key) => (
                  <KeyItem
                    key={key.name}
                    keyInfo={key}
                    connection={connection}
                    isExpanded={expandedKey === key.name}
                    onToggle={() => toggleKey(key.name)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface KeyItemProps {
  keyInfo: KeyInfo;
  connection: ConnectionConfig;
  isExpanded: boolean;
  onToggle: () => void;
}

function KeyItem({ keyInfo, connection, isExpanded, onToggle }: KeyItemProps) {
  return (
    <div className="border-b border-border last:border-b-0">
      {/* Key Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 pl-10 hover:bg-tertiary transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
          )}
          <span className="font-mono text-sm text-primary truncate">{keyInfo.name}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {keyInfo.size !== undefined && (
            <span className="text-xs text-secondary">{keyInfo.size} items</span>
          )}
          {keyInfo.ttl > 0 && (
            <span className="text-xs text-accent-yellow">TTL: {keyInfo.ttl}s</span>
          )}
          {keyInfo.ttl === -1 && (
            <span className="text-xs text-secondary">Sin expiración</span>
          )}
        </div>
      </button>

      {/* Key Content */}
      {isExpanded && (
        <div className="px-3 pb-3 pl-14">
          <KeyContentViewer connection={connection} keyInfo={keyInfo} />
        </div>
      )}
    </div>
  );
}

