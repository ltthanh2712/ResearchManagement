@echo off
REM Research Management System - Quick Setup Script for Windows
REM Usage: setup.bat

echo 🚀 Research Management System - Docker Setup
echo =============================================

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker chưa được cài đặt. Vui lòng cài Docker Desktop trước.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose chưa được cài đặt. Vui lòng cài Docker Desktop trước.
    pause
    exit /b 1
)

echo ✅ Docker và Docker Compose đã sẵn sàng

REM Create .env file if not exists
if not exist .env (
    echo 📝 Tạo file .env...
    copy .env.docker .env >nul
    echo ✅ File .env đã được tạo từ .env.docker
) else (
    echo ✅ File .env đã tồn tại
)

REM Ask user what they want to do
echo.
echo Bạn muốn làm gì?
echo 1^) Build và chạy tất cả services ^(đầy đủ^)
echo 2^) Chỉ chạy databases ^(cho development^)
echo 3^) Stop tất cả services
echo 4^) Clean up ^(xóa tất cả containers và volumes^)
echo.
set /p choice="Chọn (1-4): "

if "%choice%"=="1" (
    echo 🔨 Building và starting tất cả services...
    docker-compose up --build -d
    echo.
    echo ✅ Hệ thống đang chạy!
    echo 🌐 Frontend: http://localhost:3000
    echo 🔗 Backend: http://localhost:8080
    echo 📊 Databases:
    echo    - MSSQL Site A: localhost:14331
    echo    - MSSQL Site B: localhost:14332
    echo    - MSSQL Global: localhost:14334
    echo    - PostgreSQL Site C: localhost:5432
    echo.
    echo 📝 Để xem logs: docker-compose logs -f
    echo 🛑 Để stop: docker-compose down
) else if "%choice%"=="2" (
    echo 🗄️ Chỉ starting databases...
    docker-compose up -d mssql_site_a mssql_site_b mssql_global postgres_site_c
    echo.
    echo ✅ Databases đang chạy!
    echo 💡 Bây giờ bạn có thể chạy backend và frontend local:
    echo    Backend: cd backend ^&^& npm run dev
    echo    Frontend: cd frontend ^&^& npm start
) else if "%choice%"=="3" (
    echo 🛑 Stopping tất cả services...
    docker-compose down
    echo ✅ Đã stop tất cả services
) else if "%choice%"=="4" (
    echo 🧹 Cleaning up...
    set /p confirm="⚠️  Điều này sẽ xóa TẤT CẢ containers và data. Bạn có chắc không? (y/N): "
    if /i "%confirm%"=="y" (
        docker-compose down -v --rmi all
        docker system prune -a --volumes -f
        echo ✅ Đã clean up hoàn toàn
    ) else (
        echo ❌ Đã hủy cleanup
    )
) else (
    echo ❌ Lựa chọn không hợp lệ
    pause
    exit /b 1
)

echo.
echo 🎉 Hoàn thành!
pause