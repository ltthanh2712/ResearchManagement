import React from "react";
import { Bars3Icon, BellIcon } from "@heroicons/react/24/outline";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-white/90 backdrop-blur-xl shadow-sm border-b border-gray-200/30 h-20 flex items-center justify-between px-6 lg:px-8 flex-shrink-0 z-40">
      {/* Left side - Menu button and title */}
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-3 rounded-2xl text-gray-600 hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        <div className="ml-4 lg:ml-0">
          <div className="flex items-center gap-3">
            <div className="hidden md:block w-2 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Research Management
              </h1>
              <p className="text-xs text-gray-500 font-medium -mt-1">
                Enterprise Dashboard
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Center - Quick Stats */}
      <div className="hidden lg:flex items-center gap-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-700">
            System Active
          </span>
        </div>
      </div>

      {/* Right side - User actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button className="p-3 text-gray-600 hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-sm hover:shadow-lg relative group">
            <BellIcon className="h-6 w-6" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center animate-bounce">
              <span className="text-xs text-white font-bold">3</span>
            </span>
          </button>

          {/* Notification tooltip */}
          <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Thông báo mới
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Có 2 đề án mới được thêm
                  </span>
                </div>
                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    1 nhóm nghiên cứu được cập nhật
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User menu */}
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-3 hover:shadow-lg transition-all duration-300 group">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-gray-800">Administrator</p>
            <p className="text-xs text-blue-600 font-medium">Super Admin</p>
          </div>
          <div className="relative">
            <button className="p-1 text-gray-600 hover:text-blue-600 transition-all duration-300 transform hover:scale-110 group">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                AD
              </div>
            </button>

            {/* User dropdown */}
            <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                    AD
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Administrator</p>
                    <p className="text-xs text-gray-500">admin@research.com</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    Thông tin cá nhân
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    Cài đặt hệ thống
                  </button>
                  <hr className="my-2" />
                  <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
