#!/bin/bash

echo "=== FAULT TOLERANCE DEMO ==="
echo ""

echo "1. Kiểm tra trạng thái ban đầu:"
curl -s "http://localhost:8080/health/system" | grep -o '"status":"[^"]*"'
echo ""

echo "2. Test hoạt động bình thường:"
curl -s "http://localhost:8080/health/test" | grep -o '"employeesFound":[0-9]*'
echo ""

echo "3. Tắt PostgreSQL Site C..."
docker stop postgres_site_c
sleep 2
echo ""

echo "4. Kiểm tra trạng thái sau khi tắt 1 site:"
curl -s "http://localhost:8080/health/system" | grep -o '"status":"[^"]*"'
echo ""

echo "5. Test fault tolerance - hệ thống vẫn hoạt động:"
curl -s "http://localhost:8080/health/test" | grep -o '"employeesFound":[0-9]*'
echo ""

echo "6. Khởi động lại PostgreSQL Site C..."
docker start postgres_site_c
sleep 3
echo ""

echo "7. Kiểm tra trạng thái sau khi khôi phục:"
curl -s "http://localhost:8080/health/system" | grep -o '"status":"[^"]*"'
echo ""

echo "=== DEMO HOÀN THÀNH ==="