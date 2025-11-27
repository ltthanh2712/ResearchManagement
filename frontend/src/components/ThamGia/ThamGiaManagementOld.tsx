import React, { useState, useEffect } from "react";
import {
  LinkIcon,
  UserGroupIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { IThamGiaWithDetails, INhanVien, IDeAn } from "../../types";
import { thamGiaApi, nhanVienApi, deAnApi } from "../../services/api";
import LoadingSpinner from "../common/LoadingSpinner";
import EmptyState from "../common/EmptyState";

const ThamGiaManagement: React.FC = () => {
  const [thamGiaList, setThamGiaList] = useState<IThamGiaWithDetails[]>([]);
  const [nhanVienList, setNhanVienList] = useState<INhanVien[]>([]);
  const [deAnList, setDeAnList] = useState<IDeAn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchThamGiaList(),
        fetchNhanVienList(),
        fetchDeAnList(),
      ]);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchThamGiaList = async () => {
    try {
      setLoading(true);
      const response = await thamGiaApi.getAll();
      if (response.success && response.data) {
        // Enhance data with nhan vien and de an info
        const enhancedData = response.data.map((tg) => ({
          ...tg,
          TenNV: nhanVienList.find((nv) => nv.MaNV === tg.MaNV)?.HoTen,
          TenDA: deAnList.find((da) => da.MaDA === tg.MaDA)?.TenDA,
        }));
        setThamGiaList(enhancedData);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách tham gia");
      console.error("Error fetching tham gia:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNhanVienList = async () => {
    try {
      const response = await nhanVienApi.getAll();
      if (response.success && response.data) {
        setNhanVienList(response.data);
      }
    } catch (error) {
      console.error("Error fetching nhan vien:", error);
    }
  };

  const fetchDeAnList = async () => {
    try {
      const response = await deAnApi.getAll();
      if (response.success && response.data) {
        setDeAnList(response.data);
      }
    } catch (error) {
      console.error("Error fetching de an:", error);
    }
  };

  // Group tham gia by project
  const groupedThamGia = thamGiaList.reduce((acc, tg) => {
    const deAnId = tg.MaDA;
    if (!acc[deAnId]) {
      acc[deAnId] = {
        deAn: deAnList.find((da) => da.MaDA === deAnId),
        participants: [],
      };
    }
    acc[deAnId].participants.push(tg);
    return acc;
  }, {} as Record<string, { deAn?: IDeAn; participants: IThamGiaWithDetails[] }>);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-xl">
              <LinkIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Danh sách Tham gia
              </h1>
              <p className="text-gray-600 mt-1 text-lg">
                Xem thông tin nhân viên tham gia các đề án nghiên cứu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3">
              <div className="text-sm text-orange-600 font-medium">
                Tổng kết nối
              </div>
              <div className="text-2xl font-bold text-orange-700">
                {Object.keys(groupedThamGia).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {Object.keys(groupedThamGia).length === 0 ? (
        <EmptyState
          title="Chưa có thông tin tham gia nào"
          description="Hiện tại chưa có nhân viên nào tham gia vào các đề án nghiên cứu."
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedThamGia).map(([deAnId, group], index) => (
            <div
              key={deAnId}
              className="group bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 animate-fade-in relative overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-red-600/20 rounded-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150"></div>

              <div className="relative">
                {/* Project Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <AcademicCapIcon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-400 rounded-full border-2 border-white"></div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors duration-300">
                      {group.deAn?.TenDA || "Đề án không xác định"}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">
                      Mã đề án: {deAnId}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <UserGroupIcon className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-orange-600 font-medium">
                        {group.participants.length} nhân viên tham gia
                      </span>
                    </div>
                  </div>
                </div>

                {/* Participants Section */}
                <div className="bg-orange-50/30 border border-orange-200/50 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <UserGroupIcon className="w-5 h-5 text-orange-600" />
                    Danh sách nhân viên tham gia
                  </h4>

                  {group.participants.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserGroupIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 italic">
                        Chưa có nhân viên nào tham gia đề án này
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.participants.map((participant, pIndex) => (
                        <div
                          key={`${participant.MaNV}-${participant.MaDA}`}
                          className="group/participant bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-slide-in-right"
                          style={{
                            animationDelay: `${index * 100 + pIndex * 50}ms`,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-md group-hover/participant:shadow-lg transition-all duration-300">
                                <span className="text-sm font-bold text-white">
                                  {(participant.TenNV || "N")
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate group-hover/participant:text-emerald-600 transition-colors duration-300">
                                {participant.TenNV || "Tên không xác định"}
                              </p>
                              <p className="text-xs text-gray-500 font-medium">
                                {participant.MaNV}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <LinkIcon className="w-4 h-4 text-orange-400 group-hover/participant:text-orange-600 transition-colors duration-300" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistics Cards */}
      {thamGiaList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="group bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-8 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-bounce-in">
            <div className="relative mx-auto mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <AcademicCapIcon className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-400 rounded-full border-2 border-white"></div>
            </div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              {Object.keys(groupedThamGia).length}
            </h3>
            <p className="text-gray-600 font-medium">
              Đề án có nhân viên tham gia
            </p>
          </div>

          <div
            className="group bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-8 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-bounce-in"
            style={{ animationDelay: "100ms" }}
          >
            <div className="relative mx-auto mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <UserGroupIcon className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white"></div>
            </div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
              {new Set(thamGiaList.map((tg) => tg.MaNV)).size}
            </h3>
            <p className="text-gray-600 font-medium">Nhân viên tham gia</p>
          </div>

          <div
            className="group bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-8 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-bounce-in"
            style={{ animationDelay: "200ms" }}
          >
            <div className="relative mx-auto mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <LinkIcon className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-orange-400 rounded-full border-2 border-white"></div>
            </div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              {thamGiaList.length}
            </h3>
            <p className="text-gray-600 font-medium">Tổng số liên kết</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThamGiaManagement;
