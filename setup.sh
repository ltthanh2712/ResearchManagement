#!/bin/bash

# Research Management System - Quick Setup Script
# Sử dụng: ./setup.sh

echo "🚀 Research Management System - Docker Setup"
echo "============================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker chưa được cài đặt. Vui lòng cài Docker trước."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose chưa được cài đặt. Vui lòng cài Docker Compose trước."
    exit 1
fi

echo "✅ Docker và Docker Compose đã sẵn sàng"

# Create .env file if not exists
if [ ! -f .env ]; then
    echo "📝 Tạo file .env..."
    cp .env.docker .env
    echo "✅ File .env đã được tạo từ .env.docker"
else
    echo "✅ File .env đã tồn tại"
fi

# Ask user what they want to do
echo ""
echo "Bạn muốn làm gì?"
echo "1) Build và chạy tất cả services (đầy đủ)"
echo "2) Chỉ chạy databases (cho development)"
echo "3) Stop tất cả services"
echo "4) Clean up (xóa tất cả containers và volumes)"
echo ""
read -p "Chọn (1-4): " choice

case $choice in
    1)
        echo "🔨 Building và starting tất cả services..."
        docker-compose up --build -d
        echo ""
        echo "✅ Hệ thống đang chạy!"
        echo "🌐 Frontend: http://localhost:3000"
        echo "🔗 Backend: http://localhost:8080"
        echo "📊 Databases:"
        echo "   - MSSQL Site A: localhost:14331"
        echo "   - MSSQL Site B: localhost:14332"
        echo "   - MSSQL Global: localhost:14334"
        echo "   - PostgreSQL Site C: localhost:5432"
        echo ""
        echo "📝 Để xem logs: docker-compose logs -f"
        echo "🛑 Để stop: docker-compose down"
        ;;
    2)
        echo "🗄️ Chỉ starting databases..."
        docker-compose up -d mssql_site_a mssql_site_b mssql_global postgres_site_c
        echo ""
        echo "✅ Databases đang chạy!"
        echo "💡 Bây giờ bạn có thể chạy backend và frontend local:"
        echo "   Backend: cd backend && npm run dev"
        echo "   Frontend: cd frontend && npm start"
        ;;
    3)
        echo "🛑 Stopping tất cả services..."
        docker-compose down
        echo "✅ Đã stop tất cả services"
        ;;
    4)
        echo "🧹 Cleaning up..."
        read -p "⚠️  Điều này sẽ xóa TẤT CẢ containers và data. Bạn có chắc không? (y/N): " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            docker-compose down -v --rmi all
            docker system prune -a --volumes -f
            echo "✅ Đã clean up hoàn toàn"
        else
            echo "❌ Đã hủy cleanup"
        fi
        ;;
    *)
        echo "❌ Lựa chọn không hợp lệ"
        exit 1
        ;;
esac

echo ""
echo "🎉 Hoàn thành!"