# TypeScript Express Boilerplate

A production-ready, modern TypeScript Express.js boilerplate with Prisma ORM, MongoDB, JWT authentication, and comprehensive tooling for rapid API development.

> 💡 **Feel free to fork this project or provide suggestions to improve it further!**

## ✨ Features

### 🔐 Authentication & Security
- **JWT Authentication** with access & refresh tokens
- **Password hashing** with bcryptjs
- **Role-based access control** (extensible)
- **Rate limiting** with express-rate-limit
- **CORS** configuration
- **Helmet** security headers

### 🗄️ Database & ORM
- **Prisma ORM** with MongoDB
- **Type-safe database operations**
- **MongoDB replica set** support
- **Database migrations** with Prisma
- **Connection pooling**

### 🛠️ Development Tools
- **TypeScript** with strict configuration
- **ESLint** + **Prettier** for code quality
- **Jest** testing framework
- **Husky** + **lint-staged** for pre-commit hooks
- **Docker** containerization
- **Path aliases** for clean imports
- **Winston** structured logging
- **Prometheus metrics** for monitoring

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    HTTP Layer (Routes)                          │
│  • URL mapping and routing                                      │
│  • Middleware application (auth, validation, rate limiting)     │
│  • Route organization and grouping                              │
│  • Direct HTTP request/response handling                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Service Layer (Business Logic)                  │
│  • Business rules and validation                                │
│  • Data transformation and processing                           │
│  • External integrations (APIs, email, etc.)                    │
│  • Orchestration of multiple repositories                       │
│  • Complex operations and workflows                             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              Repository Layer (Data Access)                     │
│  • Pure database operations (CRUD)                              │
│  • Query mapping and data transformation                        │
│  • Prisma query execution                                       │
│  • No business logic, just data access                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Model Layer (Type Definitions)                  │
│  • Type definitions and interfaces                              │
│  • Data structure definitions                                   │
│  • Pure TypeScript types                                        │
│  • No business logic, just types                                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Database Layer (Prisma + MongoDB)               │
│  • Type-safe database operations                                │
│  • Connection management                                        │
│  • Query optimization and caching                               │
└─────────────────────────────────────────────────────────────────┘
```

### 📋 Layer Responsibilities

| Layer | Responsibilities | What Goes Here |
|-------|------------------|----------------|
| **Routes** | HTTP handling, validation | Request/response logic, input validation |
| **Services** | Business logic, orchestration | Business rules, data processing, integrations |
| **Repositories** | Data access abstraction | Database queries, data mapping |
| **Models** | Pure data structures | Type definitions, interfaces |
| **Database** | Data persistence | Prisma, MongoDB, connections |

## 📁 Project Structure

```
src/
├── config/                 # Environment configurations
│   ├── config.ts          # Main config interface
│   └── environments/      # Environment-specific configs
├── models/               # Type definitions
│   ├── User.ts           # User type definitions
│   └── index.ts          # Model exports
├── repositories/         # Data access layer
│   ├── userRepository.ts # User database operations
│   └── index.ts          # Repository exports
├── services/            # Business logic
│   └── userService.ts   # User business logic
├── routes/               # API routes (HTTP handling)
│   ├── auth.ts          # Authentication endpoints
│   ├── users.ts         # User endpoints
│   ├── health.ts        # Health check
│   ├── metrics.ts       # Prometheus metrics
│   └── docs.ts          # API documentation
├── middleware/            # Express middleware
│   ├── auth.ts           # JWT authentication
│   └── rateLimiter.ts    # Rate limiting
├── errors/               # Error handling
│   ├── AppError.ts       # Custom error classes
│   └── errorHandler.ts   # Global error handler
├── validation/           # Modern validation
│   ├── schemas.ts        # Zod validation schemas
│   └── middleware.ts     # Zod validation middleware
├── utils/               # Utility functions
│   ├── database.ts      # Database connection
│   ├── jwt.ts          # JWT utilities
│   ├── logger.ts       # Winston logging utility
│   └── metrics.ts      # Prometheus metrics
└── index.ts            # Application entry point
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 20.0.0
- **npm** >= 10.0.0  
- **Docker** and **Docker Compose** (for database)

### ⚡ Quick Start (3 Steps)

1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd typescript-express-boilerplate
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration (optional for development)
   ```

3. **Start Everything**
   ```bash
   # Start MongoDB with Docker
   npm run docker:up
   
   # Setup database schema
   npm run setup
   
   # Start development server
   npm run dev
   ```

🎉 **That's it!** Your API will be running at `http://localhost:3000`

## 🧪 Test the API

### 1. Create Your First User (Development Bypass)
For development, you can bypass authentication using the admin key:

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "x-admin-key: your-super-secret-jwt-key-change-in-production" \
  -d '{"email":"admin@example.com","name":"Admin User","password":"password123"}'
```

### 2. Login with Your User
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

### 3. Create Additional Users (using token)
```bash
# First, get the token from login response, then:
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"email":"user@example.com","name":"Test User","password":"password123"}'
```

## 🛠️ Additional Commands

### Database Management
```bash
# Reset database (⚠️ deletes all data)
npm run prisma:reset

# View database in Prisma Studio
npm run prisma:studio

# Generate Prisma client
npm run prisma:generate
```

### Development Tools
```bash
# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

## 🔧 Environment Variables

Key environment variables in `.env`:

```env
# Database
DATABASE_URL="mongodb://localhost:27017/boilerplate"

# JWT Secrets (generate strong secrets for production)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"

# Server
PORT=3000
NODE_ENV=development
```

## 🐳 Docker Setup

### First Time Setup
```bash
# 1. Start MongoDB and Mongo Express
npm run docker:up

# 2. Wait for MongoDB to be ready (10-15 seconds)
sleep 10

# 3. Setup database schema
npm run setup

# 4. Start your application
npm run dev
```

### Docker Commands
```bash
# Start all services
npm run docker:up

# Stop all services  
npm run docker:down

# View logs
npm run docker:logs

# Restart services
npm run docker:restart

# Clean up everything (when stuck)
npm run docker:clean

# Complete reset (when nothing works)
npm run docker:reset

# Check container status
docker ps
```

### What's Running
- **MongoDB**: `localhost:27017` (database)
- **Mongo Express**: `localhost:8081` (web interface)
- **Your API**: `localhost:3000` (after `npm run dev`)

### Expected Output
When you run `npm run docker:up`, you should see:
```bash
Creating network "typescript-express-boilerplate_typescript-express-boilerplate-network" with driver "bridge"
Creating volume "typescript-express-boilerplate_mongodb_data" with default driver
Creating typescript-express-boilerplate-mongodb ... done
Creating typescript-express-boilerplate-mongo-express ... done
```

✅ **Success indicators:**
- No error messages
- Both containers created successfully
- You can access Mongo Express at `http://localhost:8081`

## 🚨 Troubleshooting

### Docker Issues

**1. "Container name already in use"**
```bash
# Stop and remove existing containers
npm run docker:down
docker system prune -f
npm run docker:up
```

**2. "Cannot connect to MongoDB"**
```bash
# Check if MongoDB is running
docker ps | grep typescript-express-boilerplate-mongodb

# Restart MongoDB
npm run docker:down
npm run docker:up

# Wait 10 seconds for MongoDB to fully start
sleep 10
npm run setup
```

**3. "MongoDB authentication failed"**
```bash
# Reset MongoDB data (⚠️ This will delete all data)
npm run docker:down
docker volume rm typescript-express-boilerplate_mongodb_data
npm run docker:up
npm run setup
```

**4. "Port 27017 already in use"**
```bash
# Find what's using the port
lsof -i :27017

# Stop any existing MongoDB containers
docker ps | grep mongo
docker stop $(docker ps -q --filter ancestor=mongo)
docker rm $(docker ps -aq --filter ancestor=mongo)

# Or stop our specific containers
docker stop typescript-express-boilerplate-mongodb typescript-express-boilerplate-mongo-express
docker rm typescript-express-boilerplate-mongodb typescript-express-boilerplate-mongo-express

# Or use a different port
# Edit docker-compose.yml to use port 27018:27017
```

### Application Issues

**5. "Port 3000 already in use"**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Or use a different port: PORT=3001 npm run dev
```

**6. "Prisma client not found"**
```bash
npm run prisma:generate
```

**7. "User creation failed"**
```bash
# Reset database and try again
npm run prisma:reset
npm run prisma:push
```

### Nuclear Reset (Everything)
```bash
# Complete reset - use when nothing else works
npm run docker:down
docker system prune -f
docker volume prune -f
rm -rf node_modules
npm install
npm run docker:up
sleep 10  # Wait for MongoDB
npm run setup
npm run dev
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Profile (Protected)
```http
GET /api/v1/auth/profile
Authorization: Bearer <your-jwt-token>
```

#### Update Profile (Protected)
```http
PUT /api/v1/auth/profile
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "newemail@example.com"
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<your-refresh-token>"
}
```

### User Management Endpoints

#### Get All Users (with pagination)
```http
GET /api/v1/users?page=1&limit=10
```

#### Get User by ID
```http
GET /api/v1/users/:id
```

#### Create User (Admin only)
```http
POST /api/v1/users
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "name": "New User",
  "password": "password123"
}
```

#### Update User (Admin only)
```http
PUT /api/v1/users/:id
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

#### Delete User (Admin only)
```http
DELETE /api/v1/users/:id
Authorization: Bearer <admin-jwt-token>
```

### System Endpoints

#### Health Check
```http
GET /health
```

#### Metrics (Prometheus)
```http
GET /metrics
```

#### API Documentation
```http
GET /api/v1
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🐳 Docker

```bash
# Start with Docker Compose
npm run docker:up

# Stop Docker containers
npm run docker:down

# Build Docker image
npm run docker:build
```

## 📊 Monitoring

The application includes built-in monitoring with:

- **Prometheus metrics** at `/metrics`
- **Structured logging** with Winston
- **Request ID tracking**
- **Performance monitoring**

## 🔧 Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

## 📦 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run lint` | Lint code |
| `npm run format` | Format code |
| `npm run type-check` | TypeScript type checking |
| `npm run docker:up` | Start Docker containers |
| `npm run docker:down` | Stop Docker containers |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:push` | Push schema to database |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/) - Web framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [MongoDB](https://www.mongodb.com/) - Database
- [Jest](https://jestjs.io/) - Testing framework
- [Winston](https://github.com/winstonjs/winston) - Logging
- [Prometheus](https://prometheus.io/) - Monitoring