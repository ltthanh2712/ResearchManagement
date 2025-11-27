import React, { useState, useEffect } from "react";
import {
  AcademicCapIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { IDeAn, INhomNC, ApiResponse } from "../../types";
import { deAnApi, nhomNCApi } from "../../services/api";
import LoadingSpinner from "../common/LoadingSpinner";
import EmptyState from "../common/EmptyState";

interface FormOneResult {
  maNhom: string;
  tenNhom: string;
  deAnList: IDeAn[];
}

const Form1CrossGroupProjects: React.FC = () => {
  const [nhomNCList, setNhomNCList] = useState<INhomNC[]>([]);
  const [selectedNhom, setSelectedNhom] = useState<string>("");
  const [results, setResults] = useState<FormOneResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSearched, setIsSearched] = useState(false);

  // Load danh sách nhóm NC khi component mount
  useEffect(() => {
    const fetchNhomNCList = async () => {
      try {
        setInitialLoading(true);
        const response: ApiResponse<INhomNC[]> = await nhomNCApi.getAll();

        if (response.success && response.data) {
          setNhomNCList(response.data);
        } else {
          toast.error("Không thể tải danh sách nhóm nghiên cứu");
        }
      } catch (error) {
        console.error("Error fetching nhom NC:", error);
        toast.error("Lỗi khi tải danh sách nhóm nghiên cứu");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchNhomNCList();
  }, []);

  const handleSearch = async () => {
    if (!selectedNhom.trim()) {
      toast.error("Vui lòng chọn nhóm nghiên cứu");
      return;
    }

    try {
      setLoading(true);
      setIsSearched(true);

      const response: ApiResponse<IDeAn[]> =
        await deAnApi.getWithOtherGroupEmployees(selectedNhom);

      if (response.success && response.data) {
        const selectedNhomData = nhomNCList.find(
          (n) => n.MaNhom === selectedNhom
        );

        setResults({
          maNhom: selectedNhom,
          tenNhom: selectedNhomData?.TenNhom || selectedNhom,
          deAnList: response.data,
        });

        if (response.data.length === 0) {
          toast.success(
            "Tìm kiếm hoàn tất - Không có đề án nào có nhân viên nhóm khác tham gia"
          );
        } else {
          toast.success(
            `Tìm thấy ${response.data.length} đề án có nhân viên nhóm khác tham gia`
          );
        }
      } else {
        toast.error(response.message || "Không thể tải dữ liệu");
        setResults(null);
      }
    } catch (error) {
      console.error("Error searching cross-group projects:", error);
      toast.error("Lỗi khi tìm kiếm đề án");
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedNhom("");
    setResults(null);
    setIsSearched(false);
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <DocumentTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Form 1: Đề án có nhân viên nhóm khác tham gia
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Tìm kiếm các đề án có sự tham gia của nhân viên từ nhóm nghiên cứu
              khác
            </p>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <MagnifyingGlassIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Tìm kiếm theo nhóm nghiên cứu
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label
                htmlFor="nhom-select"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Chọn nhóm nghiên cứu
              </label>
              <select
                id="nhom-select"
                value={selectedNhom}
                onChange={(e) => setSelectedNhom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading}
              >
                <option value="">-- Chọn nhóm nghiên cứu --</option>
                {nhomNCList.map((nhom) => (
                  <option key={nhom.MaNhom} value={nhom.MaNhom}>
                    {nhom.MaNhom} - {nhom.TenNhom}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleSearch}
                disabled={loading || !selectedNhom.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Tìm kiếm...</span>
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="w-4 h-4" />
                    <span>Tìm kiếm</span>
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                disabled={loading}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium transition-colors duration-200 disabled:cursor-not-allowed"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {isSearched && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserGroupIcon className="w-6 h-6 text-blue-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Kết quả tìm kiếm
                </h3>
              </div>
              {results && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Nhóm: <span className="font-medium">{results.tenNhom}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            ) : results ? (
              results.deAnList.length === 0 ? (
                <EmptyState
                  icon="warning"
                  title="Không tìm thấy kết quả"
                  description={`Nhóm "${results.tenNhom}" không có đề án nào có nhân viên từ nhóm khác tham gia.`}
                />
              ) : (
                <div className="space-y-4">
                  <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
                    <div className="flex items-center space-x-2">
                      <AcademicCapIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-green-800 dark:text-green-200 font-medium">
                        Tìm thấy {results.deAnList.length} đề án có nhân viên
                        nhóm khác tham gia
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.deAnList.map((deAn, index) => (
                      <div
                        key={deAn.MaDA}
                        className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm font-medium">
                            #{index + 1}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded font-mono">
                            {deAn.MaDA}
                          </span>
                        </div>

                        <h4
                          className="font-bold text-gray-900 dark:text-white mb-4 text-lg leading-tight overflow-hidden group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300"
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
                            <div className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-md">
                              <UserGroupIcon className="w-5 h-5 text-white" />
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
                          <div className="text-blue-500 dark:text-blue-400 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-xl">
                            →
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Form1CrossGroupProjects;
