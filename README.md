# Q-Visualizer

Dashboard web para monitoreo en tiempo real de instancias Redis usadas como colas de procesamiento.

## 🚀 Características

- ✅ Conexión a múltiples instancias Redis
- ✅ Test de conexión antes de guardar
- ✅ Visualización de keys agrupadas por tipo
- ✅ Exploración de contenido: strings, lists, sets, sorted sets, hashes, streams
- ✅ Interfaz dark theme profesional
- ✅ Docker multi-arquitectura (amd64, arm64, arm/v7)

## 📋 Requisitos

- Node.js >= 20.0.0
- npm >= 10.0.0
- Docker (opcional, para despliegue)

## 🛠️ Desarrollo Local

### 1. Instalar dependencias

```bash
# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install
```

### 2. Ejecutar en modo desarrollo

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

El frontend estará disponible en `http://localhost:5173/dashboard`  
El backend estará disponible en `http://localhost:3000`

### 3. Redis de prueba (opcional)

```bash
docker run -d --name redis-test -p 6379:6379 redis:7-alpine
```

## 🐳 Docker

### Build y ejecución

```bash
# Build
docker build -t q-visualizer .

# Run
docker run -p 3000:3000 q-visualizer
```

### Docker Compose (incluye Redis de prueba)

```bash
docker-compose up -d
```

Accede al dashboard en: `http://localhost:3000/dashboard`

### Build multi-arquitectura

```bash
# Crear builder
docker buildx create --name multiarch --driver docker-container --use

# Build para múltiples arquitecturas
docker buildx build \
  --platform linux/amd64,linux/arm64,linux/arm/v7 \
  --tag q-visualizer:latest \
  --push \
  .
```

## 📁 Estructura del Proyecto

```
q-visualizer/
├── frontend/           # React + TypeScript + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/ # Componentes React
│   │   ├── hooks/      # Custom hooks
│   │   ├── services/   # API client
│   │   └── types/      # TypeScript types
│   └── ...
├── backend/            # Node.js + TypeScript + Express
│   ├── src/
│   │   ├── routes/     # API routes
│   │   ├── services/   # Business logic
│   │   └── types/      # TypeScript types
│   └── ...
├── Dockerfile          # Multi-stage build
├── docker-compose.yml  # Dev environment
└── README.md
```

## 🔌 API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/redis/test` | Probar conexión Redis |
| POST | `/api/redis/keys` | Listar keys |
| POST | `/api/redis/key/string` | Obtener valor string |
| POST | `/api/redis/key/list` | Obtener elementos de lista |
| POST | `/api/redis/key/hash` | Obtener campos de hash |
| POST | `/api/redis/key/set` | Obtener miembros de set |
| POST | `/api/redis/key/zset` | Obtener miembros de sorted set |
| POST | `/api/redis/key/stream` | Obtener mensajes de stream |

## 🎨 Paleta de Colores

| Variable | Color | Uso |
|----------|-------|-----|
| `--bg-primary` | `#0d1117` | Fondo principal |
| `--bg-secondary` | `#161b22` | Tarjetas, sidebar |
| `--bg-tertiary` | `#21262d` | Hover, inputs |
| `--border` | `#30363d` | Bordes |
| `--text-primary` | `#e6edf3` | Texto principal |
| `--text-secondary` | `#8b949e` | Texto secundario |
| `--accent` | `#58a6ff` | Acciones primarias |
| `--accent-green` | `#3fb950` | Éxito |
| `--accent-red` | `#f85149` | Error |

## 📄 Licencia

Uso interno — Piggi Money

