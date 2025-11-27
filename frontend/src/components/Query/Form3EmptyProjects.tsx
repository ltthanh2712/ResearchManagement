import React, { useState } from "react";
import {
  ExclamationTriangleIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { IDeAn, ApiResponse } from "../../types";
import { deAnApi } from "../../services/api";
import LoadingSpinner from "../common/LoadingSpinner";
import EmptyState from "../common/EmptyState";

const Form3EmptyProjects: React.FC = () => {
  const [results, setResults] = useState<IDeAn[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearched, setIsSearched] = useState(false);

  const handleSearch = async () => {
    try {
      setLoading(true);
      setIsSearched(true);

      const response: ApiResponse<IDeAn[]> = await deAnApi.getEmpty();

      if (response.success && response.data) {
        setResults(response.data);

        if (response.data.length === 0) {
          toast.success(
            "Tìm kiếm hoàn tất - Không có đề án nào chưa có nhân viên tham gia"
          );
        } else {
          toast.success(
            `Tìm thấy ${response.data.length} đề án chưa có nhân viên tham gia`
          );
        }
      } else {
        toast.error(response.message || "Không thể tải dữ liệu");
        setResults([]);
      }
    } catch (error) {
      console.error("Error searching empty projects:", error);
      toast.error("Lỗi khi tìm kiếm đề án");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResults([]);
    setIsSearched(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
            <ExclamationTriangleIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Form 3: Đề án chưa có nhân viên tham gia
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Tìm kiếm các đề án chưa có bất kỳ nhân viên nào tham gia
            </p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <MagnifyingGlassIcon className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Tìm kiếm đề án trống
            </h2>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-6 border-2 border-blue-200 dark:border-gray-500">
            <div className="flex items-center space-x-3">
              <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-blue-800 dark:text-blue-200 font-semibold">
                  Truy vấn toàn cục - Không cần tham số đầu vào
                </p>
                <p className="text-blue-600 dark:text-blue-300 text-sm mt-1">
                  Hệ thống sẽ tìm kiếm tất cả các đề án chưa có nhân viên tham
                  gia trên toàn bộ các site
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-3 text-lg"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Đang tìm kiếm...</span>
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="w-6 h-6" />
                  <span>Tìm đề án trống</span>
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:cursor-not-allowed disabled:transform-none text-lg"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {isSearched && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 p-8 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg">
                  <ExclamationTriangleIcon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Kết quả tìm kiếm
                </h3>
              </div>
              {results.length > 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Tìm thấy {results.length} đề án
                </div>
              )}
            </div>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            ) : results.length === 0 ? (
              <EmptyState
                icon="success"
                title="Không có đề án trống"
                description="Tất cả các đề án đều đã có nhân viên tham gia. Hệ thống hoạt động tốt!"
              />
            ) : (
              <div className="space-y-4">
                <div className="mb-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-2xl shadow-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg animate-pulse">
                      <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <span className="text-yellow-800 dark:text-yellow-200 font-bold text-lg">
                        ⚠️ Phát hiện {results.length} đề án cần được xử lý!
                      </span>
                      <p className="text-yellow-600 dark:text-yellow-300 text-sm mt-1">
                        Các đề án này chưa có nhân viên nào tham gia và cần được
                        theo dõi
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {results.map((deAn, index) => (
                    <div
                      key={deAn.MaDA}
                      className="group bg-gradient-to-br from-white via-yellow-50/30 to-orange-50/30 dark:from-gray-700 dark:via-gray-700 dark:to-gray-800 border-2 border-yellow-200 dark:border-gray-600 rounded-2xl p-6 hover:shadow-2xl hover:shadow-yellow-500/20 dark:hover:shadow-yellow-500/10 transition-all duration-500 hover:border-yellow-400 dark:hover:border-yellow-500 hover:scale-105 transform"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg group-hover:shadow-xl transform group-hover:scale-110 transition-all duration-300">
                          ⚠️ #{index + 1}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-500 px-3 py-2 rounded-lg font-mono font-bold shadow-sm">
                          {deAn.MaDA}
                        </div>
                      </div>

                      <h4
                        className="font-bold text-gray-900 dark:text-white mb-4 text-lg leading-tight overflow-hidden group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors duration-300"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical" as any,
                        }}
                      >
                        {deAn.TenDA}
                      </h4>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-1.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg shadow-md">
                            <AcademicCapIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                              Nhóm quản lý
                            </span>
                            <p className="text-gray-800 dark:text-gray-200 font-bold">
                              {deAn.MaNhom}
                            </p>
                          </div>
                        </div>
                        <div className="text-red-500 dark:text-red-400 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-xl">
                          ⚠️
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Form3EmptyProjects;
