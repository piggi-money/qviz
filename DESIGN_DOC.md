# Q-Visualizer: Documento de Diseño

## Dashboard de Monitoreo de Redis Queue

**Versión:** 1.0  
**Fecha:** Diciembre 2024  
**Estado:** Draft  

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Objetivos y Alcance](#2-objetivos-y-alcance)
3. [Requisitos Funcionales](#3-requisitos-funcionales)
4. [Requisitos No Funcionales](#4-requisitos-no-funcionales)
5. [Arquitectura Propuesta](#5-arquitectura-propuesta)
6. [Diseño de Componentes Frontend](#6-diseño-de-componentes-frontend)
7. [Diseño de las APIs Backend](#7-diseño-de-las-apis-backend)
8. [Interacción con Redis](#8-interacción-con-redis)
9. [Docker y Despliegue](#9-docker-y-despliegue)
10. [Futuras Extensiones](#10-futuras-extensiones)

---

## 1. Resumen Ejecutivo

### 1.1 Problema

Los equipos de desarrollo utilizan Redis como sistema de colas (queues) para procesar trabajos en background. Actualmente no existe una herramienta interna unificada para inspeccionar el estado de estas colas en tiempo real, lo que dificulta el debugging y monitoreo del sistema.

### 1.2 Solución Propuesta

**Q-Visualizer** es un dashboard web ligero y stateless que permite a los desarrolladores:
- Conectarse a múltiples instancias de Redis simultáneamente
- Visualizar y explorar las estructuras de datos (listas, streams, sorted sets, etc.)
- Inspeccionar el contenido de las colas en tiempo real

### 1.3 Público Objetivo

Desarrolladores internos del equipo que necesitan monitorear y debuggear las colas de procesamiento en sus ambientes de desarrollo, staging y producción.

---

## 2. Objetivos y Alcance

### 2.1 Objetivos de la V1

| ID | Objetivo | Prioridad |
|----|----------|-----------|
| O1 | Permitir conexión a múltiples instancias de Redis | Alta |
| O2 | Visualizar keys y colecciones por tipo | Alta |
| O3 | Explorar contenido de estructuras de datos | Alta |
| O4 | Validar conexiones antes de usarlas | Alta |
| O5 | Proporcionar una experiencia de usuario limpia y profesional | Media |

### 2.2 Dentro del Alcance (In Scope)

- Dashboard montado en `/dashboard`
- Formulario para configurar conexiones Redis (host, port, password, database)
- Botón "Test Connection" con feedback visual
- Gestión de múltiples conexiones Redis en memoria
- Visualización de keys agrupadas por tipo
- Componentes colapsables para cada colección
- Lectura del contenido de: Strings, Lists, Sets, Sorted Sets, Hashes, Streams
- Docker multi-stage con soporte ARM
- Dark theme profesional

### 2.3 Fuera del Alcance (Out of Scope)

| Funcionalidad | Razón de Exclusión |
|---------------|-------------------|
| Persistencia de configuraciones | V1 es stateless, sin base de datos propia |
| Autenticación/Autorización | Herramienta interna, se asume red segura |
| Modificación/eliminación de keys | Solo lectura en V1 para evitar riesgos |
| WebSockets para tiempo real | V1 usa polling manual; WebSockets en V2 |
| Gráficos y métricas históricas | Fuera de alcance para MVP |
| Soporte Redis Cluster | Solo instancias standalone en V1 |

---

## 3. Requisitos Funcionales

### 3.1 RF01 - Configuración de Conexiones Redis

**Descripción:** El usuario puede agregar configuraciones de conexión a instancias Redis mediante un formulario.

**Campos del formulario:**
| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|------------|
| Nombre (alias) | string | Sí | Único, 1-50 caracteres |
| Host | string | Sí | Hostname o IP válida |
| Puerto | number | Sí | 1-65535, default: 6379 |
| Password | string | No | - |
| Database | number | No | 0-15, default: 0 |
| TLS/SSL | boolean | No | default: false |

**Flujo:**
1. Usuario abre modal de "Nueva Conexión"
2. Completa el formulario
3. Opcionalmente presiona "Test Connection"
4. Presiona "Guardar"
5. La conexión aparece en la lista del sidebar

### 3.2 RF02 - Test Connection

**Descripción:** Antes de guardar una conexión, el usuario puede probar si los parámetros son correctos.

**Comportamiento:**
- Al presionar "Test Connection", el backend intenta conectar a Redis con los parámetros proporcionados
- Se muestra un indicador de loading durante el proceso
- Resultado exitoso: badge verde con "Conexión exitosa"
- Resultado fallido: badge rojo con mensaje de error descriptivo (timeout, auth failed, host unreachable, etc.)

**Timeout:** 5 segundos máximo para el test.

### 3.3 RF03 - Gestión de Múltiples Conexiones

**Descripción:** El dashboard permite tener varias conexiones Redis configuradas simultáneamente.

**Comportamiento:**
- Las conexiones se listan en un sidebar o panel lateral
- Cada conexión muestra: nombre, host:port, indicador de estado
- El usuario puede seleccionar una conexión para explorar su contenido
- El usuario puede eliminar conexiones de la lista
- Las conexiones se mantienen solo en memoria del navegador (localStorage para persistencia local)

### 3.4 RF04 - Visualización de Keys y Colecciones

**Descripción:** Una vez conectado a una instancia Redis, se muestran todas las keys agrupadas por tipo.

**Tipos soportados:**
| Tipo Redis | Icono Sugerido | Información Mostrada |
|------------|----------------|---------------------|
| string | `Aa` | Valor (truncado si > 100 chars) |
| list | `≡` | Longitud (LLEN) |
| set | `{ }` | Cardinalidad (SCARD) |
| zset | `#` | Cardinalidad (ZCARD) |
| hash | `{ : }` | Número de campos (HLEN) |
| stream | `→` | Longitud (XLEN) |

**Agrupación:**
```
▼ Lists (5)
  ├── queue:emails
  ├── queue:notifications
  └── ...

▼ Sorted Sets (3)
  ├── delayed:jobs
  └── ...

▼ Streams (2)
  └── events:user
```

### 3.5 RF05 - Contenido Colapsable

**Descripción:** Cada grupo de tipos y cada key individual puede expandirse/colapsarse.

**Comportamiento:**
- Por defecto, los grupos están colapsados
- Al expandir un grupo, se listan las keys de ese tipo
- Al expandir una key, se muestra su contenido (lazy loading)
- Animación suave de expand/collapse (150-200ms)

### 3.6 RF06 - Inspección de Contenido

**Descripción:** Al expandir una key, se muestra su contenido según el tipo.

**Formato de visualización por tipo:**

| Tipo | Visualización |
|------|---------------|
| string | Valor completo, con opción de copiar |
| list | Tabla con índice y valor, paginada (50 items) |
| set | Lista de miembros, paginada |
| zset | Tabla con score y member, paginada |
| hash | Tabla con field y value |
| stream | Tabla con ID, timestamp y campos del mensaje |

---

## 4. Requisitos No Funcionales

### 4.1 Docker y Compatibilidad ARM

**Imagen Base:** `node:20-alpine`

**Arquitecturas soportadas:**
- `linux/amd64` (x86_64)
- `linux/arm64` (Raspberry Pi 4, Apple Silicon, AWS Graviton)
- `linux/arm/v7` (Raspberry Pi 3 y anteriores)

**Estrategia:** Uso de `docker buildx` para builds multi-arch.

### 4.2 Performance

| Métrica | Objetivo |
|---------|----------|
| Tiempo de carga inicial | < 2 segundos |
| Respuesta de Test Connection | < 5 segundos |
| Listado de keys (< 10k keys) | < 3 segundos |
| Tamaño del bundle frontend | < 500KB gzipped |
| Memoria del contenedor | < 256MB |

### 4.3 Seguridad

**Principios mínimos:**

1. **Credenciales nunca en el cliente:**
   - Las passwords de Redis viajan en el request pero NO se almacenan en logs
   - Las conexiones se realizan exclusivamente desde el backend

2. **Configuración en memoria:**
   - Las configuraciones viven en el estado del cliente (localStorage opcional)
   - El servidor no persiste ninguna credencial

3. **Sanitización:**
   - Validar inputs antes de usarlos en comandos Redis
   - Escapar outputs para prevenir XSS

4. **Headers de seguridad:**
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Content-Security-Policy` básico

5. **Red interna:**
   - Se asume que el dashboard corre en red interna confiable
   - No exponer a internet sin VPN o autenticación adicional

### 4.4 UX/UI

**Tema Visual:**
- Dark theme como único tema en V1
- Paleta de colores basada en tonos oscuros con acentos en cyan/teal
- Inspiración: terminales modernas, VS Code Dark+

**Paleta de Colores:**
```css
:root {
  --bg-primary: #0d1117;      /* Fondo principal */
  --bg-secondary: #161b22;    /* Tarjetas, sidebars */
  --bg-tertiary: #21262d;     /* Hover states, inputs */
  --border: #30363d;          /* Bordes sutiles */
  --text-primary: #e6edf3;    /* Texto principal */
  --text-secondary: #8b949e;  /* Texto secundario */
  --accent: #58a6ff;          /* Links, acciones primarias */
  --accent-green: #3fb950;    /* Éxito, conexión OK */
  --accent-red: #f85149;      /* Error, desconexión */
  --accent-yellow: #d29922;   /* Warning */
}
```

**Tipografía:**
- Font principal: `Inter` o `system-ui`
- Font monospace (para valores): `JetBrains Mono` o `Fira Code`

**Principios de diseño:**
- Densidad de información alta (herramienta para desarrolladores)
- Feedback visual inmediato para todas las acciones
- Iconografía minimalista y consistente
- Espaciado generoso entre secciones, compacto dentro de listas

---

## 5. Arquitectura Propuesta

### 5.1 Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                         NAVEGADOR                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    React SPA                               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐  │  │
│  │  │  Dashboard  │  │   Config    │  │   Key Explorer   │  │  │
│  │  │   Layout    │  │   Modal     │  │    Component     │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────────────┘  │  │
│  │                         │                                  │  │
│  │                    localStorage                            │  │
│  │                 (conexiones guardadas)                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                         HTTP/JSON
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      NODE.JS SERVER                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Express.js                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐  │  │
│  │  │   Static    │  │    API      │  │   Redis          │  │  │
│  │  │   Files     │  │   Routes    │  │   Service        │  │  │
│  │  │  /dashboard │  │   /api/*    │  │                  │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                         TCP/Redis
                              │
          ┌───────────────────┴───────────────────┐
          ▼                   ▼                   ▼
    ┌──────────┐        ┌──────────┐        ┌──────────┐
    │  Redis   │        │  Redis   │        │  Redis   │
    │ Instance │        │ Instance │        │ Instance │
    │    #1    │        │    #2    │        │    #n    │
    └──────────┘        └──────────┘        └──────────┘
```

### 5.2 Estructura del Proyecto

```
q-visualizer/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   ├── Sidebar/
│   │   │   ├── ConnectionModal/
│   │   │   ├── KeyExplorer/
│   │   │   └── common/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── redis.routes.ts
│   │   ├── services/
│   │   │   └── redis.service.ts
│   │   ├── middleware/
│   │   ├── types/
│   │   ├── utils/
│   │   └── index.ts
│   ├── tsconfig.json
│   └── package.json
│
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
└── README.md
```

### 5.3 Flujo de Datos

**Conexión Stateless:**

El servidor NO mantiene estado de conexiones. Cada request del cliente incluye los parámetros de conexión necesarios:

```
1. Cliente envía request con credenciales Redis
2. Servidor abre conexión efímera a Redis
3. Servidor ejecuta comando(s)
4. Servidor cierra conexión
5. Servidor responde al cliente
```

**Optimización con Connection Pooling (opcional V1.1):**
- Pool de conexiones por combinación host:port:db
- TTL de conexiones inactivas: 30 segundos
- Máximo 10 conexiones por instancia

### 5.4 Rutas del Servidor

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/dashboard` | GET | Sirve la SPA de React |
| `/dashboard/*` | GET | Catch-all para client-side routing |
| `/api/redis/test` | POST | Prueba conexión Redis |
| `/api/redis/keys` | POST | Lista keys por patrón |
| `/api/redis/key/:type` | POST | Obtiene contenido de una key |
| `/api/health` | GET | Health check del servidor |

---

## 6. Diseño de Componentes Frontend

### 6.1 Árbol de Componentes

```
App
└── DashboardLayout
    ├── Sidebar
    │   ├── ConnectionList
    │   │   └── ConnectionItem (×n)
    │   └── AddConnectionButton
    │
    ├── MainContent
    │   ├── Header
    │   │   ├── ConnectionInfo
    │   │   └── RefreshButton
    │   │
    │   └── KeyExplorer
    │       ├── KeyTypeGroup (×n tipos)
    │       │   ├── GroupHeader (colapsable)
    │       │   └── KeyList
    │       │       └── KeyItem (×n keys)
    │       │           ├── KeyHeader
    │       │           └── KeyContent (expandible)
    │       │               └── DataViewer
    │       └── EmptyState
    │
    └── ConnectionModal (condicional)
        ├── ModalHeader
        ├── ConnectionForm
        ├── TestConnectionButton
        ├── TestResult
        └── ModalActions
```

### 6.2 Descripción de Componentes Principales

#### 6.2.1 DashboardLayout

**Responsabilidad:** Contenedor principal que define la estructura de 2 columnas.

```tsx
interface DashboardLayoutProps {
  children: React.ReactNode;
}

// CSS Grid: sidebar fijo (280px) + contenido flexible
```

#### 6.2.2 Sidebar

**Responsabilidad:** Lista de conexiones configuradas y acceso a agregar nuevas.

**Estado:**
- `connections: Connection[]` - Lista de conexiones
- `activeConnectionId: string | null` - Conexión seleccionada

#### 6.2.3 ConnectionModal

**Responsabilidad:** Formulario para agregar/editar conexiones Redis.

**Estado interno:**
- `formData: ConnectionConfig` - Datos del formulario
- `testStatus: 'idle' | 'testing' | 'success' | 'error'`
- `testError: string | null`

**Props:**
```tsx
interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ConnectionConfig) => void;
  initialData?: ConnectionConfig; // Para edición
}
```

#### 6.2.4 KeyExplorer

**Responsabilidad:** Visualización jerárquica de keys agrupadas por tipo.

**Props:**
```tsx
interface KeyExplorerProps {
  connection: Connection;
}
```

**Estado:**
- `keys: KeyInfo[]` - Keys recuperadas
- `loading: boolean`
- `error: string | null`
- `expandedGroups: Set<string>` - Tipos expandidos
- `expandedKeys: Set<string>` - Keys expandidas

#### 6.2.5 DataViewer

**Responsabilidad:** Renderizar el contenido de una key según su tipo.

**Props:**
```tsx
interface DataViewerProps {
  keyName: string;
  keyType: RedisKeyType;
  connection: Connection;
}
```

**Subcomponentes:**
- `StringViewer` - Muestra valor con syntax highlighting si es JSON
- `ListViewer` - Tabla con índice y valor
- `SetViewer` - Lista de miembros
- `ZSetViewer` - Tabla con score y member
- `HashViewer` - Tabla key-value
- `StreamViewer` - Tabla de mensajes con timeline

### 6.3 Manejo de Estado

**Estrategia:** React Context + useReducer para estado global, hooks locales para componentes.

#### Context Principal

```tsx
interface AppState {
  connections: Connection[];
  activeConnectionId: string | null;
  modalOpen: boolean;
  editingConnection: Connection | null;
}

type Action =
  | { type: 'ADD_CONNECTION'; payload: Connection }
  | { type: 'REMOVE_CONNECTION'; payload: string }
  | { type: 'SET_ACTIVE'; payload: string }
  | { type: 'OPEN_MODAL'; payload?: Connection }
  | { type: 'CLOSE_MODAL' };
```

#### Hooks Personalizados

```tsx
// Persistencia en localStorage
const useConnections = () => {
  // Carga inicial desde localStorage
  // Sincroniza cambios
};

// Comunicación con API
const useRedisApi = (connection: Connection) => {
  // testConnection()
  // fetchKeys()
  // fetchKeyContent()
};
```

### 6.4 Librerías Frontend

| Librería | Propósito | Versión |
|----------|-----------|---------|
| react | UI Library | ^18.2 |
| react-dom | DOM Bindings | ^18.2 |
| typescript | Type Safety | ^5.0 |
| tailwindcss | Estilos | ^3.4 |
| lucide-react | Iconos | ^0.300 |
| clsx | Class merging | ^2.0 |

**Sin dependencias adicionales:** No usar React Query, Zustand, ni otras librerías de estado/fetching en V1.

---

## 7. Diseño de las APIs Backend

### 7.1 Tipos Compartidos

```typescript
// types/redis.ts

interface ConnectionConfig {
  name: string;
  host: string;
  port: number;
  password?: string;
  database?: number;
  tls?: boolean;
}

interface KeyInfo {
  name: string;
  type: 'string' | 'list' | 'set' | 'zset' | 'hash' | 'stream';
  ttl: number; // -1 si no expira, -2 si no existe
  size?: number; // Longitud o cardinalidad según tipo
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### 7.2 Endpoints

#### POST /api/redis/test

Prueba la conexión a una instancia Redis.

**Request:**
```json
{
  "host": "localhost",
  "port": 6379,
  "password": "secret",
  "database": 0,
  "tls": false
}
```

**Response (éxito):**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "redisVersion": "7.2.3",
    "mode": "standalone",
    "uptimeSeconds": 86400
  }
}
```

**Response (error):**
```json
{
  "success": false,
  "error": "ECONNREFUSED: Connection refused to localhost:6379"
}
```

#### POST /api/redis/keys

Lista keys filtradas por patrón.

**Request:**
```json
{
  "connection": {
    "host": "localhost",
    "port": 6379,
    "password": "secret",
    "database": 0
  },
  "pattern": "*",
  "cursor": "0",
  "count": 100
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cursor": "128",
    "keys": [
      { "name": "queue:emails", "type": "list", "ttl": -1, "size": 42 },
      { "name": "cache:users:123", "type": "hash", "ttl": 3600, "size": 5 },
      { "name": "events:stream", "type": "stream", "ttl": -1, "size": 1024 }
    ],
    "hasMore": true
  }
}
```

#### POST /api/redis/key/string

Obtiene el valor de una key tipo string.

**Request:**
```json
{
  "connection": { /* ... */ },
  "key": "config:app"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "value": "{\"theme\": \"dark\", \"version\": \"1.0.0\"}",
    "ttl": -1
  }
}
```

#### POST /api/redis/key/list

Obtiene elementos de una lista.

**Request:**
```json
{
  "connection": { /* ... */ },
  "key": "queue:emails",
  "start": 0,
  "stop": 49
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "length": 142,
    "items": [
      { "index": 0, "value": "{\"to\": \"user@example.com\"}" },
      { "index": 1, "value": "{\"to\": \"other@example.com\"}" }
    ],
    "hasMore": true
  }
}
```

#### POST /api/redis/key/hash

Obtiene campos de un hash.

**Request:**
```json
{
  "connection": { /* ... */ },
  "key": "user:123",
  "cursor": "0",
  "count": 50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cursor": "0",
    "fields": [
      { "field": "name", "value": "John Doe" },
      { "field": "email", "value": "john@example.com" }
    ],
    "hasMore": false
  }
}
```

#### POST /api/redis/key/set

Obtiene miembros de un set.

**Request:**
```json
{
  "connection": { /* ... */ },
  "key": "tags:popular",
  "cursor": "0",
  "count": 50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cursor": "24",
    "members": ["javascript", "typescript", "react"],
    "hasMore": true
  }
}
```

#### POST /api/redis/key/zset

Obtiene miembros de un sorted set con scores.

**Request:**
```json
{
  "connection": { /* ... */ },
  "key": "leaderboard",
  "start": 0,
  "stop": 49,
  "order": "desc"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cardinality": 1000,
    "members": [
      { "member": "player:42", "score": 9850 },
      { "member": "player:17", "score": 9200 }
    ],
    "hasMore": true
  }
}
```

#### POST /api/redis/key/stream

Obtiene mensajes de un stream.

**Request:**
```json
{
  "connection": { /* ... */ },
  "key": "events:orders",
  "start": "-",
  "end": "+",
  "count": 50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "length": 5000,
    "messages": [
      {
        "id": "1701234567890-0",
        "timestamp": 1701234567890,
        "fields": {
          "action": "created",
          "orderId": "ORD-123"
        }
      }
    ],
    "hasMore": true
  }
}
```

#### GET /api/health

Health check del servidor.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-03T10:30:00Z",
  "version": "1.0.0"
}
```

### 7.3 Manejo de Errores

**Códigos HTTP:**
| Código | Uso |
|--------|-----|
| 200 | Operación exitosa |
| 400 | Request inválido (validación) |
| 408 | Timeout de conexión Redis |
| 500 | Error interno del servidor |
| 502 | Error de conexión a Redis |

**Formato de error:**
```json
{
  "success": false,
  "error": "Mensaje descriptivo del error",
  "code": "REDIS_CONNECTION_FAILED",
  "details": {
    "host": "localhost",
    "port": 6379
  }
}
```

---

## 8. Interacción con Redis

### 8.1 Cliente Redis

**Librería:** `ioredis` (soporta todas las estructuras de datos y tiene mejor TypeScript support que `redis`).

```typescript
import Redis from 'ioredis';

interface RedisClientOptions {
  host: string;
  port: number;
  password?: string;
  db?: number;
  tls?: boolean;
  connectTimeout: number; // 5000ms default
  commandTimeout: number; // 10000ms default
}
```

### 8.2 Estrategia de Conexión

**Modelo Stateless:**

Cada request crea una conexión, ejecuta comandos, y cierra la conexión:

```typescript
async function withRedisConnection<T>(
  config: ConnectionConfig,
  operation: (client: Redis) => Promise<T>
): Promise<T> {
  const client = new Redis({
    host: config.host,
    port: config.port,
    password: config.password,
    db: config.database,
    tls: config.tls ? {} : undefined,
    connectTimeout: 5000,
    commandTimeout: 10000,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // No retry automático
  });

  try {
    await client.ping(); // Verificar conexión
    return await operation(client);
  } finally {
    await client.quit();
  }
}
```

### 8.3 Comandos por Tipo

| Tipo | Comandos Utilizados |
|------|---------------------|
| Metadata | `TYPE`, `TTL`, `MEMORY USAGE` (si disponible) |
| Escaneo | `SCAN` (con cursor) |
| string | `GET` |
| list | `LLEN`, `LRANGE` |
| set | `SCARD`, `SSCAN` |
| zset | `ZCARD`, `ZRANGE` con WITHSCORES |
| hash | `HLEN`, `HSCAN` |
| stream | `XLEN`, `XRANGE` |

### 8.4 Manejo de Errores

```typescript
enum RedisErrorCode {
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  AUTH_FAILED = 'AUTH_FAILED',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN_COMMAND = 'UNKNOWN_COMMAND',
  KEY_NOT_FOUND = 'KEY_NOT_FOUND',
  WRONG_TYPE = 'WRONG_TYPE',
}

function mapRedisError(error: Error): { code: RedisErrorCode; message: string } {
  if (error.message.includes('ECONNREFUSED')) {
    return { code: RedisErrorCode.CONNECTION_REFUSED, message: 'No se pudo conectar al servidor Redis' };
  }
  if (error.message.includes('NOAUTH') || error.message.includes('ERR AUTH')) {
    return { code: RedisErrorCode.AUTH_FAILED, message: 'Autenticación fallida' };
  }
  // ... más mapeos
}
```

### 8.5 Límites y Protecciones

| Límite | Valor | Razón |
|--------|-------|-------|
| Keys por request | 1000 | Evitar bloquear Redis |
| Items por colección | 100 | UI manejable |
| Tamaño máximo de valor | 1MB | Evitar OOM en browser |
| Timeout de conexión | 5s | UX responsiva |
| Timeout de comando | 10s | Operaciones complejas |

### 8.6 Soporte Multi-Instancia

El cliente soporta conexiones simultáneas porque cada request es independiente:

```
Request A (Redis 1) ──┐
Request B (Redis 2) ──┼──▶ [Servidor] ──┬──▶ Redis 1
Request C (Redis 1) ──┘                 └──▶ Redis 2
```

No hay estado compartido ni pools en V1. Cada request abre y cierra su conexión.

---

## 9. Docker y Despliegue

### 9.1 Dockerfile Multi-Stage

```dockerfile
# ==========================================
# Stage 1: Build Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Instalar dependencias primero (cache layer)
COPY frontend/package*.json ./
RUN npm ci --silent

# Copiar código y compilar
COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Build Backend
# ==========================================
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Instalar dependencias
COPY backend/package*.json ./
RUN npm ci --silent

# Copiar código y compilar TypeScript
COPY backend/ ./
RUN npm run build

# Eliminar devDependencies
RUN npm prune --production

# ==========================================
# Stage 3: Runtime
# ==========================================
FROM node:20-alpine AS runtime

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copiar backend compilado + node_modules
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/dist ./dist
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/node_modules ./node_modules
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/package.json ./

# Copiar frontend compilado
COPY --from=frontend-builder --chown=nodejs:nodejs /app/frontend/dist ./public

# Metadata
LABEL org.opencontainers.image.title="Q-Visualizer"
LABEL org.opencontainers.image.description="Redis Queue Monitoring Dashboard"
LABEL org.opencontainers.image.version="1.0.0"

# Cambiar a usuario no-root
USER nodejs

# Puerto
EXPOSE 3000

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Comando de inicio
CMD ["node", "dist/index.js"]
```

### 9.2 Docker Compose para Desarrollo

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - ./backend/src:/app/src:ro  # Hot reload en dev (requiere setup adicional)
    depends_on:
      - redis-test

  # Redis de prueba para desarrollo
  redis-test:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

### 9.3 Build Multi-Arquitectura

**Script de build:**

```bash
#!/bin/bash
# build-multiarch.sh

VERSION=${1:-latest}
REGISTRY="ghcr.io/piggi-money"
IMAGE_NAME="q-visualizer"

# Crear builder si no existe
docker buildx create --name multiarch --driver docker-container --use 2>/dev/null || true

# Build y push para múltiples arquitecturas
docker buildx build \
  --platform linux/amd64,linux/arm64,linux/arm/v7 \
  --tag ${REGISTRY}/${IMAGE_NAME}:${VERSION} \
  --tag ${REGISTRY}/${IMAGE_NAME}:latest \
  --push \
  .
```

### 9.4 Variables de Entorno

| Variable | Descripción | Default | Requerida |
|----------|-------------|---------|-----------|
| `PORT` | Puerto del servidor HTTP | `3000` | No |
| `NODE_ENV` | Ambiente (development/production) | `production` | No |
| `LOG_LEVEL` | Nivel de logging (debug/info/warn/error) | `info` | No |
| `CORS_ORIGIN` | Origen permitido para CORS | `*` | No |

### 9.5 .dockerignore

```
# Dependencies
node_modules
*/node_modules

# Build outputs
dist
*/dist
build
*/build

# Development
.git
.gitignore
*.md
.env*
.vscode
.idea

# Test
coverage
*.test.ts
*.spec.ts
__tests__

# Docker
Dockerfile*
docker-compose*
.docker*
```

### 9.6 Tamaños Esperados

| Stage | Tamaño Aproximado |
|-------|-------------------|
| frontend-builder | ~300MB |
| backend-builder | ~400MB |
| runtime (final) | ~150MB |

---

## 10. Futuras Extensiones

### 10.1 V1.1 - Quick Wins

| Feature | Descripción | Esfuerzo |
|---------|-------------|----------|
| Connection pooling | Reutilizar conexiones Redis | Bajo |
| Tema claro | Toggle light/dark theme | Bajo |
| Búsqueda de keys | Filtro por nombre/patrón | Bajo |
| Export JSON | Descargar contenido de keys | Bajo |

### 10.2 V1.2 - Mejoras UX

| Feature | Descripción | Esfuerzo |
|---------|-------------|----------|
| Auto-refresh | Polling configurable (5s, 10s, 30s) | Bajo |
| WebSocket | Actualizaciones en tiempo real | Medio |
| Favoritos | Marcar keys de interés | Bajo |
| Breadcrumbs | Navegación mejorada | Bajo |

### 10.3 V2.0 - Features Avanzados

| Feature | Descripción | Esfuerzo |
|---------|-------------|----------|
| Autenticación | Login básico o integración OIDC | Medio |
| Persistencia | Guardar conexiones en SQLite/PostgreSQL | Medio |
| Gráficos | Métricas históricas (queue length, throughput) | Alto |
| Alertas | Notificaciones cuando queue > threshold | Alto |
| Redis Cluster | Soporte para modo cluster | Alto |
| Operaciones write | CRUD de keys (con confirmación) | Medio |
| Multi-tenant | Múltiples usuarios con sus propias conexiones | Alto |

### 10.4 Consideraciones Técnicas Futuras

- **Caché de metadata:** Cachear tipo y TTL de keys para reducir round-trips
- **Virtual scrolling:** Para listas con miles de elementos
- **Keyboard shortcuts:** Navegación rápida para power users
- **Plugin system:** Extensiones para formatos específicos de datos

---

## Apéndices

### A. Glosario

| Término | Definición |
|---------|------------|
| Key | Identificador único en Redis |
| TTL | Time To Live, tiempo restante antes de expiración |
| SCAN | Comando iterativo para listar keys sin bloquear |
| Stream | Estructura de datos tipo log/append-only de Redis |
| Sorted Set | Set ordenado por score numérico |

### B. Referencias

- [Redis Commands](https://redis.io/commands/)
- [ioredis Documentation](https://github.com/redis/ioredis)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Docker Multi-platform builds](https://docs.docker.com/build/building/multi-platform/)

---

**Documento preparado por:** Q-Visualizer Team  
**Fecha de última actualización:** Diciembre 2024

