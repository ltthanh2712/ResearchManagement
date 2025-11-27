import React, { useState, useEffect } from "react";
import {
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { INhomNC, ApiResponse } from "../../types";
import { nhomNCApi } from "../../services/api";
import LoadingSpinner from "../common/LoadingSpinner";

interface PhongInfo {
  TenPhong: string;
  SiteName: string;
}

const Form2UpdateRoomAndMoveFragment: React.FC = () => {
  const [nhomNCList, setNhomNCList] = useState<INhomNC[]>([]);
  const [phongList, setPhongList] = useState<PhongInfo[]>([]);
  const [selectedNhom, setSelectedNhom] = useState<string>("");
  const [tenPhongMoi, setTenPhongMoi] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load danh sách nhóm NC và phòng khi component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);

        // Load danh sách nhóm NC
        const nhomResponse: ApiResponse<INhomNC[]> = await nhomNCApi.getAll();
        if (nhomResponse.success && nhomResponse.data) {
          setNhomNCList(nhomResponse.data);
        } else {
          toast.error("Không thể tải danh sách nhóm nghiên cứu");
        }

        // Load danh sách phòng
        const phongResponse: ApiResponse<PhongInfo[]> =
          await nhomNCApi.getPhongList();
        if (phongResponse.success && phongResponse.data) {
          setPhongList(phongResponse.data);
        } else {
          toast.error("Không thể tải danh sách phòng");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Lỗi khi tải dữ liệu");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedNhom.trim()) {
      toast.error("Vui lòng chọn nhóm nghiên cứu");
      return;
    }

    if (!tenPhongMoi.trim()) {
      toast.error("Vui lòng chọn tên phòng mới");
      return;
    }

    // Kiểm tra phòng có tồn tại trong danh sách không
    const isValidPhong = phongList.some((p) => p.TenPhong === tenPhongMoi);
    if (!isValidPhong) {
      toast.error("Tên phòng không hợp lệ");
      return;
    }

    try {
      setLoading(true);

      // Tìm thông tin nhóm hiện tại
      const currentNhom = nhomNCList.find((n) => n.MaNhom === selectedNhom);
      if (!currentNhom) {
        toast.error("Không tìm thấy thông tin nhóm");
        return;
      }

      if (currentNhom.TenPhong === tenPhongMoi) {
        toast.error("Tên phòng mới giống tên phòng hiện tại");
        return;
      }

      // Gọi API cập nhật - Service sẽ tự động di chuyển mảnh
      const updateData = {
        TenNhom: currentNhom.TenNhom,
        TenPhong: tenPhongMoi,
      };
      const response = await nhomNCApi.update(selectedNhom, updateData);

      if (response.success) {
        const targetSite = phongList.find(
          (p) => p.TenPhong === tenPhongMoi
        )?.SiteName;
        toast.success(
          `Đã cập nhật phòng của nhóm ${selectedNhom} từ ${currentNhom.TenPhong} sang ${tenPhongMoi}`
        );
        toast.success(`Toàn bộ dữ liệu đã được di chuyển sang ${targetSite}`, {
          duration: 5000,
        });

        // Hiển thị MaNhom mới nếu có trong response
        if (response.data && typeof response.data === "string") {
          toast.success(`Mã nhóm mới: ${response.data}`, { duration: 7000 });
        }

        // Refresh danh sách nhóm
        const refreshResponse: ApiResponse<INhomNC[]> =
          await nhomNCApi.getAll();
        if (refreshResponse.success && refreshResponse.data) {
          setNhomNCList(refreshResponse.data);
        }

        // Reset form
        setSelectedNhom("");
        setTenPhongMoi("");
      } else {
        toast.error(response.message || "Không thể cập nhật tên phòng");
      }
    } catch (error) {
      console.error("Error updating room:", error);
      toast.error("Lỗi khi cập nhật tên phòng");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedNhom("");
    setTenPhongMoi("");
  };

  const selectedNhomInfo = nhomNCList.find((n) => n.MaNhom === selectedNhom);

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <PencilIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Form 2: Cập nhật tên phòng và di chuyển mảnh
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Cập nhật tên phòng của nhóm nghiên cứu (dữ liệu sẽ được di chuyển
              tự động)
            </p>
          </div>
        </div>
      </div>

      {/* Update Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chọn nhóm */}
            <div>
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
                required
              >
                <option value="">-- Chọn nhóm nghiên cứu --</option>
                {nhomNCList.map((nhom) => (
                  <option key={nhom.MaNhom} value={nhom.MaNhom}>
                    {nhom.MaNhom} - {nhom.TenNhom} (Phòng: {nhom.TenPhong})
                  </option>
                ))}
              </select>
            </div>

            {/* Tên phòng mới */}
            <div>
              <label
                htmlFor="tenPhong-select"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Tên phòng mới
              </label>
              <select
                id="tenPhong-select"
                value={tenPhongMoi}
                onChange={(e) => setTenPhongMoi(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading}
                required
              >
                <option value="">-- Chọn tên phòng mới --</option>
                {phongList
                  .filter(
                    (phong) =>
                      // Loại bỏ phòng hiện tại khỏi danh sách
                      !selectedNhomInfo ||
                      phong.TenPhong !== selectedNhomInfo.TenPhong
                  )
                  .map((phong) => (
                    <option key={phong.TenPhong} value={phong.TenPhong}>
                      {phong.TenPhong} (Site: {phong.SiteName})
                    </option>
                  ))}
              </select>
              {selectedNhomInfo && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Phòng hiện tại:{" "}
                  <span className="font-medium">
                    {selectedNhomInfo.TenPhong}
                  </span>{" "}
                  sẽ được loại bỏ khỏi danh sách
                </p>
              )}
            </div>
          </div>

          {/* Thông tin hiện tại */}
          {selectedNhomInfo && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 border border-gray-200 dark:border-gray-600">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Thông tin hiện tại
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Mã nhóm:
                  </span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedNhomInfo.MaNhom}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Tên nhóm:
                  </span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedNhomInfo.TenNhom}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Phòng hiện tại:
                  </span>
                  <p className="font-medium text-red-600 dark:text-red-400">
                    {selectedNhomInfo.TenPhong}
                  </p>
                </div>
              </div>
              {tenPhongMoi && tenPhongMoi !== selectedNhomInfo.TenPhong && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-700">
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    <strong>Sẽ thay đổi thành:</strong> {tenPhongMoi}
                    {(() => {
                      const targetSite = phongList.find(
                        (p) => p.TenPhong === tenPhongMoi
                      );
                      return targetSite
                        ? ` (Site: ${targetSite.SiteName})`
                        : "";
                    })()}
                  </p>
                  <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                    * Toàn bộ nhân viên, đề án và dữ liệu tham gia sẽ được di
                    chuyển sang mảnh mới
                  </p>
                  <p className="text-blue-600 dark:text-blue-400 text-xs">
                    * Mã nhóm sẽ được cập nhật tự động theo định dạng{" "}
                    {tenPhongMoi}N[số]
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading || !selectedNhom.trim() || !tenPhongMoi.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Cập nhật và di chuyển</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium transition-colors duration-200 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <XCircleIcon className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Form2UpdateRoomAndMoveFragment;
