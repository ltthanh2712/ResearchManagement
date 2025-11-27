#!/bin/bash

echo "🚀 Bắt đầu build và deploy Research Management System"
echo "=================================================="

# Kiểm tra Docker có chạy không
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker không chạy. Vui lòng khởi động Docker trước!"
    exit 1
fi

# Stop và remove containers cũ
echo "🛑 Dừng containers cũ..."
docker-compose down --remove-orphans

# Remove old images để build fresh
echo "🗑️  Xóa images cũ..."
docker image prune -f
docker rmi research-management_frontend 2>/dev/null || true
docker rmi research-management_api_node 2>/dev/null || true

# Build và start tất cả services
echo "🔨 Build và start containers..."
docker-compose up --build -d

# Đợi containers khởi động
echo "⏳ Đang đợi containers khởi động..."
sleep 30

# Kiểm tra trạng thái containers
echo "📊 Kiểm tra trạng thái containers:"
docker-compose ps

# Kiểm tra logs nếu có lỗi
echo ""
echo "🔍 Kiểm tra logs backend:"
docker logs api_node --tail 10

echo ""
echo "🔍 Kiểm tra logs frontend:"
docker logs frontend_react --tail 10

# URLs
echo ""
echo "✅ Deployment hoàn tất!"
echo "=================================================="
echo "🌐 Frontend: http://localhost:3000"
echo "🔗 Backend API: http://localhost:8080"
echo "📊 Database Ports:"
echo "   - MSSQL Site A: localhost:14331"
echo "   - MSSQL Site B: localhost:14332" 
echo "   - MSSQL Global: localhost:14334"
echo "   - PostgreSQL Site C: localhost:5432"
echo "=================================================="

# Test endpoints
echo ""
echo "🧪 Testing endpoints..."
sleep 5

echo "Testing Backend Health:"
curl -s http://localhost:8080/nhanvien > /dev/null 2>&1 && echo "✅ Backend API: OK" || echo "❌ Backend API: Failed"

echo "Testing Frontend:"
curl -s http://localhost:3000 > /dev/null 2>&1 && echo "✅ Frontend: OK" || echo "❌ Frontend: Failed"

echo ""
echo "🎉 Hoàn tất! Mở trình duyệt và truy cập http://localhost:3000"