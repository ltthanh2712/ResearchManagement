# Research Management System Frontend

Giao diện frontend hiện đại cho hệ thống quản lý nghiên cứu, được xây dựng với React, TypeScript và Tailwind CSS.

## Tính năng

- 🏠 **Dashboard**: Tổng quan thống kê và thông tin hệ thống
- 👥 **Quản lý Nhóm Nghiên cứu**: Thêm, sửa, xóa thông tin nhóm
- 👨‍🔬 **Quản lý Nhân viên**: Quản lý thông tin nhân viên nghiên cứu
- 📋 **Quản lý Đề án**: Theo dõi và quản lý các đề án nghiên cứu
- 🔗 **Tham gia**: Xem thông tin nhân viên tham gia đề án

## Công nghệ sử dụng

- **React 18** - Thư viện UI
- **TypeScript** - Ngôn ngữ lập trình
- **Tailwind CSS** - Framework CSS
- **React Router** - Điều hướng
- **Axios** - HTTP client
- **React Hot Toast** - Thông báo
- **Heroicons** - Icons

## Cài đặt và chạy

### Yêu cầu

- Node.js (v16 hoặc cao hơn)
- npm hoặc yarn

### Cài đặt dependencies

```bash
cd frontend
npm install
```

### Chạy ở môi trường development

```bash
npm start
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

### Build cho production

```bash
npm run build
```

## Cấu trúc thư mục

```
src/
├── components/           # Các React components
│   ├── common/          # Shared components
│   ├── Dashboard/       # Dashboard components
│   ├── DeAn/           # Đề án management
│   ├── Layout/         # Layout components
│   ├── NhanVien/       # Nhân viên management
│   ├── NhomNC/         # Nhóm nghiên cứu management
│   └── ThamGia/        # Tham gia components
├── services/           # API services
├── types/              # TypeScript interfaces
├── App.tsx            # Main app component
└── index.tsx          # Entry point
```

## API Integration

Frontend kết nối với backend API qua các endpoints:

- `/dean` - Quản lý đề án
- `/nhanvien` - Quản lý nhân viên
- `/nhomnc` - Quản lý nhóm nghiên cứu
- `/thamgia` - Thông tin tham gia

## Styling

Dự án sử dụng Tailwind CSS với:

- Custom color palette (primary blue)
- Responsive design
- Hover effects và animations
- Custom component classes

## Features

### 🎨 UI/UX

- Giao diện hiện đại, responsive
- Dark mode ready
- Smooth animations
- Loading states
- Error handling

### 📱 Responsive Design

- Mobile-first approach
- Tablet và desktop optimization
- Collapsible sidebar
- Touch-friendly interface

### 🔔 Notifications

- Success/Error toasts
- Confirmation dialogs
- Loading spinners
- Empty states

## Environment Variables

Tạo file `.env` trong thư mục frontend:

```bash
REACT_APP_API_URL=http://localhost:8080
REACT_APP_APP_NAME="Research Management System"
REACT_APP_VERSION="1.0.0"
```

## Scripts

- `npm start` - Development server
- `npm build` - Production build
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
