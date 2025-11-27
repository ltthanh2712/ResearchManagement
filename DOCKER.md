# Research Management System - Docker Setup

Hệ thống quản lý nghiên cứu được đóng gói hoàn chỉnh với Docker để team có thể triển khai dễ dàng.

## 🚀 Quick Start

### 1. Clone repository và setup

```bash
git clone <repository-url>
cd ResearchManagement
cp .env.docker .env
```

### 2. Build và chạy tất cả services

```bash
docker-compose up --build
```

### 3. Truy cập ứng dụng

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Databases**:
  - MSSQL Site A: localhost:14331
  - MSSQL Site B: localhost:14332
  - MSSQL Global: localhost:14334
  - PostgreSQL Site C: localhost:5432

## 🏗️ Cấu trúc Docker

### Services

- **frontend**: React app với Nginx (Port 3000)
- **backend**: Node.js API (Port 8080)
- **mssql_site_a**: SQL Server cho Site A (Port 14331)
- **mssql_site_b**: SQL Server cho Site B (Port 14332)
- **mssql_global**: SQL Server Global (Port 14334)
- **postgres_site_c**: PostgreSQL cho Site C (Port 5432)

### Networks

- **app_network**: Kết nối frontend và backend
- **backend**: Kết nối backend với databases

## 📝 Commands

### Chạy toàn bộ hệ thống

```bash
# Build và chạy tất cả
docker-compose up --build

# Chạy background
docker-compose up -d --build

# Chỉ chạy mà không build lại
docker-compose up -d
```

### Quản lý containers

```bash
# Xem logs
docker-compose logs -f

# Xem logs của service cụ thể
docker-compose logs -f frontend
docker-compose logs -f backend

# Stop tất cả
docker-compose down

# Stop và xóa volumes
docker-compose down -v

# Restart service cụ thể
docker-compose restart frontend
```

### Development mode

```bash
# Chỉ chạy databases
docker-compose up -d mssql_site_a mssql_site_b mssql_global postgres_site_c

# Chạy backend local
cd backend
npm run dev

# Chạy frontend local
cd frontend
npm start
```

## 🔧 Configuration

### Environment Variables (.env)

```bash
# Database passwords
MSSQL_SA_PASSWORD=YourStrong@Password123
POSTGRES_PASSWORD=postgres123

# Application settings
NODE_ENV=production
REACT_APP_API_URL=http://localhost:8080
```

### Custom Configuration

- **Frontend**: Sửa `frontend/nginx.conf` để custom Nginx
- **Backend**: Sửa `backend/Dockerfile` để custom Node.js setup
- **Databases**: Thêm init scripts trong `docker/*/init.sql`

## 🚀 Production Deployment

### Build production images

```bash
# Build riêng từng service
docker build -t research-frontend ./frontend
docker build -t research-backend ./backend

# Tag for registry
docker tag research-frontend your-registry/research-frontend:latest
docker tag research-backend your-registry/research-backend:latest

# Push to registry
docker push your-registry/research-frontend:latest
docker push your-registry/research-backend:latest
```

### Production docker-compose

Tạo `docker-compose.prod.yml`:

```yaml
version: "3.9"
services:
  frontend:
    image: your-registry/research-frontend:latest
    ports:
      - "80:80"
  backend:
    image: your-registry/research-backend:latest
    ports:
      - "8080:8080"
```

## 🔍 Monitoring & Health Checks

### Health Check Endpoints

- Frontend: http://localhost:3000/health
- Backend: http://localhost:8080/health

### Check container health

```bash
docker-compose ps
docker inspect --format='{{.State.Health}}' research_frontend
docker inspect --format='{{.State.Health}}' research_backend
```

## 📊 Database Management

### Connect to databases

```bash
# MSSQL
docker exec -it mssql_global /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrong@Password123

# PostgreSQL
docker exec -it postgres_site_c psql -U postgres -d ResearchManagement
```

### Backup & Restore

```bash
# Backup volumes
docker run --rm -v research_mssql_data:/data -v $(pwd):/backup alpine tar czf /backup/mssql_backup.tar.gz /data

# Restore
docker run --rm -v research_mssql_data:/data -v $(pwd):/backup alpine tar xzf /backup/mssql_backup.tar.gz -C /
```

## 🛠️ Troubleshooting

### Common Issues

1. **Port conflicts**

   ```bash
   # Check ports
   netstat -tulpn | grep :3000

   # Kill process using port
   kill -9 $(lsof -t -i:3000)
   ```

2. **Memory issues**

   ```bash
   # Increase Docker memory limit
   docker system prune -a

   # Check memory usage
   docker stats
   ```

3. **Database connection issues**

   ```bash
   # Check database logs
   docker-compose logs mssql_global

   # Test connection
   docker exec backend curl -f http://localhost:8080/health
   ```

### Reset everything

```bash
# Complete reset
docker-compose down -v --rmi all
docker system prune -a --volumes
docker-compose up --build
```

## 📋 Team Usage

### For team members:

1. **First time setup:**

   ```bash
   git clone <repo>
   cd ResearchManagement
   cp .env.docker .env
   docker-compose up --build
   ```

2. **Daily usage:**

   ```bash
   # Start working
   docker-compose up -d

   # Stop when done
   docker-compose down
   ```

3. **Update code:**
   ```bash
   git pull
   docker-compose up --build
   ```

## 🔐 Security Notes

- Change default passwords trong `.env`
- Không commit `.env` file
- Sử dụng Docker secrets cho production
- Enable SSL/TLS cho production deployment

## 📞 Support

- Logs: `docker-compose logs -f`
- Health checks: http://localhost:3000/health
- API docs: http://localhost:8080/docs (nếu có)
