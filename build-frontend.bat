@echo off
echo 🌐 Build Frontend React Container
echo =================================

REM Build frontend image
echo 🔨 Building frontend image...
docker build -t research-management-frontend ./frontend

REM Stop frontend container nếu đang chạy
echo 🛑 Stopping existing frontend container...
docker stop frontend_react 2>nul
docker rm frontend_react 2>nul

REM Run frontend container
echo 🚀 Starting frontend container...
docker run -d ^
  --name frontend_react ^
  --network research-management_backend ^
  -p 3000:80 ^
  -e REACT_APP_API_URL=http://localhost:8080 ^
  research-management-frontend

echo ⏳ Waiting for container to start...
timeout /t 10 /nobreak > nul

REM Check status
echo 📊 Container status:
docker ps | findstr frontend_react

REM Test
echo.
echo 🧪 Testing frontend...
curl -s http://localhost:3000 >nul 2>&1 && echo ✅ Frontend: OK || echo ❌ Frontend: Failed

echo.
echo ✅ Frontend deployed at: http://localhost:3000
pause