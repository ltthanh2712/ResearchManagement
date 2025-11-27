# Research Management System

A distributed research management system built with React TypeScript frontend and Node.js Express backend, supporting multiple database sites (MSSQL and PostgreSQL).

## 🚀 Features

- **Multi-site Database Architecture**: Supports distributed databases across different sites
- **Complete CRUD Operations**: Full management for employees, research groups, projects, and participation
- **Site Migration**: Dynamic data migration between different database sites
- **Business Rule Validation**: Enforces room-based participation rules
- **Modern UI**: Glass-morphism design with Tailwind CSS
- **Pagination**: 12 items per page across all management interfaces
- **Room Dropdown**: Dynamic room selection from global database
- **Docker Support**: Full containerization with multi-stage builds

## 🏗️ Architecture

### Frontend

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Heroicons** for icons
- **React Hot Toast** for notifications
- **Nginx** for production serving

### Backend

- **Node.js** with Express and TypeScript
- **MSSQL** for Site A and Site B
- **PostgreSQL** for Site C
- **Global Database** for routing and configuration

### Database Sites

- **Site A (P1)**: MSSQL Server (Port 14331)
- **Site B (P2)**: MSSQL Server (Port 14332)
- **Site C (P3)**: PostgreSQL (Port 5432)
- **Global**: MSSQL Server (Port 14334)

## 📦 Installation & Setup

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)

### Using Docker (Recommended)

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd ResearchManagement
```

2. **Create environment file**

```bash
cp .env.example .env
```

3. **Start all services**

```bash
docker-compose up -d
```

4. **Access the application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

### Local Development

1. **Backend Setup**

```bash
cd backend
npm install
npm run dev
```

2. **Frontend Setup**

```bash
cd frontend
npm install
npm start
```

## 🐳 Docker Services

- `frontend`: React app served via Nginx (Port 3000)
- `api_node`: Node.js Express API (Port 8080)
- `mssql_site_a`: MSSQL for Site A (Port 14331)
- `mssql_site_b`: MSSQL for Site B (Port 14332)
- `postgres_site_c`: PostgreSQL for Site C (Port 5432)
- `mssql_global`: Global routing database (Port 14334)

## 📋 API Endpoints

### NhanVien (Employees)

- `GET /nhanvien` - Get all employees
- `POST /nhanvien` - Create employee
- `PUT /nhanvien/:id` - Update employee
- `DELETE /nhanvien/:id` - Delete employee

### NhomNC (Research Groups)

- `GET /nhomnc` - Get all research groups
- `GET /nhomnc/phong/list` - Get room list for dropdown
- `POST /nhomnc` - Create research group
- `PUT /nhomnc/:id` - Update research group
- `DELETE /nhomnc/:id` - Delete research group

### DeAn (Projects)

- `GET /dean` - Get all projects
- `POST /dean` - Create project
- `PUT /dean/:id` - Update project
- `DELETE /dean/:id` - Delete project

### ThamGia (Participation)

- `GET /thamgia` - Get all participations
- `POST /thamgia` - Create participation (with room validation)
- `DELETE /thamgia/:empId/:projId` - Delete participation

## 🎨 UI Features

- **Glass-morphism Design**: Modern translucent interface
- **Responsive Layout**: Works on desktop and mobile
- **Search & Filter**: Advanced filtering by site/room
- **Sorting**: Multi-field sorting with Vietnamese locale support
- **Pagination**: 12 items per page with navigation
- **Room Dropdown**: Dynamic room selection across all components
- **Real-time Validation**: Business rule enforcement
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages

## 🔧 Development

### Building for Production

1. docker-compose up -d --build

2. - docker exec -it mssql_site_a bash
   - /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrongPassw0rd123" -i /usr/script/init.sql -C
    
3. - docker exec -it mssql_site_b bash
   - /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrongPassw0rd123" -i /usr/script/init.sql -C
  
4. - docker exec -it postgres_site_c bash
   - psql -U postgres -d ResearchManagement -f /docker-entrypoint-initdb.d/init.sql
  
5. - docker exec -it mssql_global bash
   - /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrongPassw0rd123" -i /usr/script/init.sql -C -v SA_PASSWORD="YourStrongPassw0rd123"
  
### Running Tests

```bash
# Frontend tests
localhost:3000

# Backend tests
localhost:8080
```

## 📝 Business Rules

1. **Room Compatibility**: Employees can only participate in projects from the same room
2. **Site Distribution**: Data is automatically distributed based on room assignments
3. **ID Generation**: Sequential ID generation per site (P1N1, P2N1, etc.)
4. **Site Migration**: Automatic data migration when room assignments change

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**LtThanh**

- Email: lamtanthanh2005@gmail.com
- GitHub: [Your GitHub Profile]

---

## 🔄 Recent Updates

- ✅ Implemented room dropdown for all interfaces
- ✅ Added comprehensive pagination system
- ✅ Enhanced business rule validation
- ✅ Full Docker containerization
- ✅ Site migration functionality
- ✅ Glass-morphism UI design
