import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
  AcademicCapIcon,
  LinkIcon,
  XMarkIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: HomeIcon,
      description: "Tổng quan hệ thống",
    },
    {
      name: "Nhóm Nghiên cứu",
      href: "/nhomnc",
      icon: UserGroupIcon,
      description: "Quản lý nhóm",
    },
    {
      name: "Nhân viên",
      href: "/nhanvien",
      icon: UsersIcon,
      description: "Quản lý nhân viên",
    },
    {
      name: "Đề án",
      href: "/dean",
      icon: AcademicCapIcon,
      description: "Quản lý đề án",
    },
    {
      name: "Tham gia",
      href: "/thamgia",
      icon: LinkIcon,
      description: "Danh sách tham gia",
    },
    {
      name: "System Health",
      href: "/health",
      icon: HeartIcon,
      description: "Trạng thái hệ thống",
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 lg:hidden z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        lg:flex lg:flex-col lg:h-full lg:w-72 lg:bg-white/95 lg:backdrop-blur-2xl lg:shadow-2xl lg:border-r lg:border-gray-200/50 lg:relative
        fixed top-0 left-0 z-50 h-full w-72 bg-white/95 backdrop-blur-2xl shadow-2xl border-r border-gray-200/50 transform transition-all duration-300 ease-in-out lg:transform-none
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-20 px-8 border-b border-gray-200/50 bg-gradient-to-r from-white to-gray-50/50">
          <div className="flex items-center">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-xl">
                <AcademicCapIcon className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div className="ml-4">
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Research Hub
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Management System v2.0
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-6">
          <div className="space-y-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    group relative flex items-center px-5 py-4 text-sm font-medium rounded-2xl transition-all duration-300 transform
                    ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-105"
                        : "text-gray-600 hover:bg-white hover:text-gray-800 hover:shadow-md hover:scale-105"
                    }
                  `}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                  )}

                  <div className="flex items-center w-full">
                    <div
                      className={`
                      w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300
                      ${
                        isActive
                          ? "bg-white/20"
                          : "bg-gray-100 group-hover:bg-blue-50"
                      }
                    `}
                    >
                      <Icon
                        className={`
                          h-6 w-6 transition-all duration-300
                          ${
                            isActive
                              ? "text-white"
                              : "text-gray-500 group-hover:text-blue-600"
                          }
                        `}
                      />
                    </div>

                    <div className="ml-4 flex-1">
                      <div
                        className={`font-semibold text-sm ${
                          isActive
                            ? "text-white"
                            : "text-gray-800 group-hover:text-gray-900"
                        }`}
                      >
                        {item.name}
                      </div>
                      <div
                        className={`text-xs mt-0.5 ${
                          isActive ? "text-white/70" : "text-gray-500"
                        }`}
                      >
                        {item.description}
                      </div>
                    </div>

                    {!isActive && (
                      <div className="w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </div>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Research Hub
                </p>
                <p className="text-xs text-gray-500">Enterprise Edition</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-600">
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
