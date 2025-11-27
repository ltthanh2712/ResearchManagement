import React, { useState, useEffect } from "react";
import {
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
  AcademicCapIcon,
  LinkIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../common/LoadingSpinner";
import {
  nhomNCApi,
  nhanVienApi,
  deAnApi,
  thamGiaApi,
} from "../../services/api";

interface DashboardStats {
  totalNhomNC: number;
  totalNhanVien: number;
  totalDeAn: number;
  totalThamGia: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalNhomNC: 0,
    totalNhanVien: 0,
    totalDeAn: 0,
    totalThamGia: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const [nhomNCResponse, nhanVienResponse, deAnResponse, thamGiaResponse] =
        await Promise.all([
          nhomNCApi.getAll(),
          nhanVienApi.getAll(),
          deAnApi.getAll(),
          thamGiaApi.getAll(),
        ]);

      setStats({
        totalNhomNC: nhomNCResponse.data?.length || 0,
        totalNhanVien: nhanVienResponse.data?.length || 0,
        totalDeAn: deAnResponse.data?.length || 0,
        totalThamGia: thamGiaResponse.data?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Nhóm Nghiên cứu",
      value: stats.totalNhomNC,
      icon: UserGroupIcon,
      color: "blue",
      description: "Tổng số nhóm nghiên cứu",
    },
    {
      title: "Nhân viên",
      value: stats.totalNhanVien,
      icon: UsersIcon,
      color: "green",
      description: "Tổng số nhân viên nghiên cứu",
    },
    {
      title: "Đề án",
      value: stats.totalDeAn,
      icon: AcademicCapIcon,
      color: "purple",
      description: "Tổng số đề án nghiên cứu",
    },
    {
      title: "Tham gia",
      value: stats.totalThamGia,
      icon: LinkIcon,
      color: "orange",
      description: "Tổng số liên kết tham gia",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
              <HomeIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-600 mt-1 text-lg">
                Tổng quan về hệ thống quản lý nghiên cứu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">
                System Active
              </span>
            </div>
          </div>
        </div>
        <p className="text-gray-600 text-lg">
          Tổng quan về hệ thống quản lý nghiên cứu của bạn
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group animate-fade-in relative overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background gradient overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${
                  card.color === "blue"
                    ? "from-blue-500/10 to-cyan-500/10"
                    : card.color === "green"
                    ? "from-green-500/10 to-emerald-500/10"
                    : card.color === "purple"
                    ? "from-purple-500/10 to-pink-500/10"
                    : "from-orange-500/10 to-red-500/10"
                } opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              ></div>

              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                      card.color === "blue"
                        ? "bg-gradient-to-br from-blue-500 to-cyan-600"
                        : card.color === "green"
                        ? "bg-gradient-to-br from-green-500 to-emerald-600"
                        : card.color === "purple"
                        ? "bg-gradient-to-br from-purple-500 to-pink-600"
                        : "bg-gradient-to-br from-orange-500 to-red-600"
                    } group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-800 group-hover:scale-105 transition-transform duration-300">
                      {card.value.toLocaleString()}
                    </div>
                    <div className="text-xs text-green-600 font-medium flex items-center justify-end gap-1 mt-1">
                      <ArrowTrendingUpIcon className="w-3 h-3" />
                      +12%
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-800 mb-1">
                    {card.title}
                  </p>
                  <p className="text-sm text-gray-600">{card.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Welcome Section */}
      <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-400/20 to-blue-600/20 rounded-full blur-3xl"></div>

        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 via-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <ChartBarIcon className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  Chào mừng đến với Research Hub
                </h2>
                <p className="text-gray-600 text-lg">
                  Quản lý hiệu quả các nhóm nghiên cứu, nhân viên và đề án của
                  bạn
                </p>
              </div>
            </div>
            <div className="lg:ml-auto">
              <div className="flex flex-col gap-2">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Tổng số hoạt động</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {(
                      stats.totalNhomNC +
                      stats.totalNhanVien +
                      stats.totalDeAn
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50/80 to-cyan-50/80 backdrop-blur-sm border border-blue-200/50 p-6 rounded-2xl hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-blue-900">
                  Quản lý Nhóm & Nhân viên
                </h3>
              </div>
              <p className="text-blue-700 mb-4 leading-relaxed">
                Tổ chức và theo dõi thông tin các nhóm nghiên cứu và nhân viên
                trong hệ thống một cách hiệu quả
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-blue-600">
                  <span className="text-lg font-bold">
                    {stats.totalNhomNC} nhóm • {stats.totalNhanVien} nhân viên
                  </span>
                </div>
                <ArrowTrendingUpIcon className="w-5 h-5 text-blue-500" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50/80 to-green-50/80 backdrop-blur-sm border border-emerald-200/50 p-6 rounded-2xl hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <AcademicCapIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-emerald-900">
                  Quản lý Đề án
                </h3>
              </div>
              <p className="text-emerald-700 mb-4 leading-relaxed">
                Theo dõi tiến độ và quản lý các đề án nghiên cứu đang được thực
                hiện một cách chuyên nghiệp
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-emerald-600">
                  <span className="text-lg font-bold">
                    {stats.totalDeAn} đề án • {stats.totalThamGia} tham gia
                  </span>
                </div>
                <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
            <ArrowTrendingUpIcon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Thao tác nhanh</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="group p-6 text-left bg-gradient-to-br from-blue-50/80 to-cyan-50/80 hover:from-blue-100/80 hover:to-cyan-100/80 border border-blue-200/50 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <UserGroupIcon className="w-7 h-7 text-white" />
            </div>
            <h4 className="text-lg font-bold text-blue-900 mb-2">
              Thêm nhóm mới
            </h4>
            <p className="text-sm text-blue-700 leading-relaxed">
              Tạo và quản lý nhóm nghiên cứu mới
            </p>
            <div className="mt-4 flex items-center text-blue-600">
              <span className="text-xs font-medium">Tạo ngay</span>
              <ArrowTrendingUpIcon className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </button>

          <button className="group p-6 text-left bg-gradient-to-br from-emerald-50/80 to-green-50/80 hover:from-emerald-100/80 hover:to-green-100/80 border border-emerald-200/50 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <UsersIcon className="w-7 h-7 text-white" />
            </div>
            <h4 className="text-lg font-bold text-emerald-900 mb-2">
              Thêm nhân viên
            </h4>
            <p className="text-sm text-emerald-700 leading-relaxed">
              Tạo hồ sơ nhân viên nghiên cứu
            </p>
            <div className="mt-4 flex items-center text-emerald-600">
              <span className="text-xs font-medium">Tạo ngay</span>
              <ArrowTrendingUpIcon className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </button>

          <button className="group p-6 text-left bg-gradient-to-br from-purple-50/80 to-pink-50/80 hover:from-purple-100/80 hover:to-pink-100/80 border border-purple-200/50 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <AcademicCapIcon className="w-7 h-7 text-white" />
            </div>
            <h4 className="text-lg font-bold text-purple-900 mb-2">
              Thêm đề án
            </h4>
            <p className="text-sm text-purple-700 leading-relaxed">
              Tạo và theo dõi đề án mới
            </p>
            <div className="mt-4 flex items-center text-purple-600">
              <span className="text-xs font-medium">Tạo ngay</span>
              <ArrowTrendingUpIcon className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </button>

          <button className="group p-6 text-left bg-gradient-to-br from-orange-50/80 to-red-50/80 hover:from-orange-100/80 hover:to-red-100/80 border border-orange-200/50 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <ChartBarIcon className="w-7 h-7 text-white" />
            </div>
            <h4 className="text-lg font-bold text-orange-900 mb-2">
              Xem báo cáo
            </h4>
            <p className="text-sm text-orange-700 leading-relaxed">
              Thống kê và phân tích dữ liệu
            </p>
            <div className="mt-4 flex items-center text-orange-600">
              <span className="text-xs font-medium">Xem ngay</span>
              <ArrowTrendingUpIcon className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
