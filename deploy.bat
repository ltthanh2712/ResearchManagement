@echo off
echo 🚀 Bắt đầu build và deploy Research Management System
echo ==================================================

REM Kiểm tra Docker
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker không chạy. Vui lòng khởi động Docker trước!
    pause
    exit /b 1
)

REM Stop và remove containers cũ
echo 🛑 Dừng containers cũ...
docker-compose down --remove-orphans

REM Remove old images
echo 🗑️ Xóa images cũ...
docker image prune -f
docker rmi research-management_frontend 2>nul
docker rmi research-management_api_node 2>nul

REM Build và start
echo 🔨 Build và start containers...
docker-compose up --build -d

REM Đợi containers khởi động
echo ⏳ Đang đợi containers khởi động...
timeout /t 30 /nobreak > nul

REM Kiểm tra trạng thái
echo 📊 Kiểm tra trạng thái containers:
docker-compose ps

echo.
echo 🔍 Kiểm tra logs backend:
docker logs api_node --tail 10

echo.
echo 🔍 Kiểm tra logs frontend:
docker logs frontend_react --tail 10

echo.
echo ✅ Deployment hoàn tất!
echo ==================================================
echo 🌐 Frontend: http://localhost:3000
echo 🔗 Backend API: http://localhost:8080
echo 📊 Database Ports:
echo    - MSSQL Site A: localhost:14331
echo    - MSSQL Site B: localhost:14332
echo    - MSSQL Global: localhost:14334
echo    - PostgreSQL Site C: localhost:5432
echo ==================================================

echo.
echo 🧪 Testing endpoints...
timeout /t 5 /nobreak > nul

curl -s http://localhost:8080/nhanvien >nul 2>&1 && echo ✅ Backend API: OK || echo ❌ Backend API: Failed
curl -s http://localhost:3000 >nul 2>&1 && echo ✅ Frontend: OK || echo ❌ Frontend: Failed

echo.
echo 🎉 Hoàn tất! Mở trình duyệt và truy cập http://localhost:3000
pause