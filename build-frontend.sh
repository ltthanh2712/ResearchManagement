#!/bin/bash

echo "🌐 Build Frontend React Container"
echo "================================="

# Build frontend image
echo "🔨 Building frontend image..."
docker build -t research-management-frontend ./frontend

# Stop frontend container nếu đang chạy
echo "🛑 Stopping existing frontend container..."
docker stop frontend_react 2>/dev/null || true
docker rm frontend_react 2>/dev/null || true

# Run frontend container
echo "🚀 Starting frontend container..."
docker run -d \
  --name frontend_react \
  --network research-management_backend \
  -p 3000:80 \
  -e REACT_APP_API_URL=http://localhost:8080 \
  research-management-frontend

echo "⏳ Waiting for container to start..."
sleep 10

# Check status
echo "📊 Container status:"
docker ps | grep frontend_react

# Test
echo ""
echo "🧪 Testing frontend..."
curl -s http://localhost:3000 > /dev/null 2>&1 && echo "✅ Frontend: OK" || echo "❌ Frontend: Failed"

echo ""
echo "✅ Frontend deployed at: http://localhost:3000"