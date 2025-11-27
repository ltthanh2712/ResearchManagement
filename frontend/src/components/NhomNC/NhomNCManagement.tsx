import React, { useState, useEffect, useMemo } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { INhomNC, INhomNCForm } from "../../types";
import { nhomNCApi } from "../../services/api";
import LoadingSpinner from "../common/LoadingSpinner";
import EmptyState from "../common/EmptyState";
import Modal from "../common/Modal";
import ConfirmDialog from "../common/ConfirmDialog";
import SearchAndFilter from "../common/SearchAndFilter";
import Pagination from "../common/Pagination";
import RoomDropdown from "../common/RoomDropdown";

const NhomNCManagement: React.FC = () => {
  const [nhomNCList, setNhomNCList] = useState<INhomNC[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNhomNC, setSelectedNhomNC] = useState<INhomNC | null>(null);
  const [formData, setFormData] = useState<INhomNCForm>({
    TenNhom: "",
    TenPhong: "",
  });
  const [editMode, setEditMode] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [sortField, setSortField] = useState("TenNhom");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchNhomNCList();
  }, []);

  // Filtered and sorted data
  const filteredAndSortedData = useMemo(() => {
    let filtered = nhomNCList.filter((nhom) => {
      const matchesSearch =
        nhom.TenNhom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nhom.MaNhom.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSite = !selectedSite || nhom.TenPhong === selectedSite;

      return matchesSearch && matchesSite;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue: string = "";
      let bValue: string = "";

      switch (sortField) {
        case "TenNhom":
          aValue = a.TenNhom;
          bValue = b.TenNhom;
          break;
        case "TenPhong":
          aValue = a.TenPhong;
          bValue = b.TenPhong;
          break;
        case "MaNhom":
          aValue = a.MaNhom;
          bValue = b.MaNhom;
          break;
        default:
          aValue = a.TenNhom;
          bValue = b.TenNhom;
      }

      if (sortDirection === "asc") {
        return aValue.localeCompare(bValue, "vi", { numeric: true });
      } else {
        return bValue.localeCompare(aValue, "vi", { numeric: true });
      }
    });

    return filtered;
  }, [nhomNCList, searchQuery, selectedSite, sortField, sortDirection]);

  // Pagination logic
  const totalItems = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSite, sortField, sortDirection]);

  // Get unique sites for filter
  const availableSites = useMemo(() => {
    const siteSet = new Set(nhomNCList.map((nhom) => nhom.TenPhong));
    const sites = Array.from(siteSet);
    return sites.sort();
  }, [nhomNCList]);

  const sortOptions = [
    { value: "TenNhom", label: "Tên nhóm" },
    { value: "TenPhong", label: "Phòng/Site" },
    { value: "MaNhom", label: "Mã nhóm" },
  ];

  const handleSortChange = (field: string, direction: "asc" | "desc") => {
    setSortField(field);
    setSortDirection(direction);
  };

  const fetchNhomNCList = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching nhom NC list...");
      const response = await nhomNCApi.getAll();
      console.log("📦 Response received:", response);
      console.log("✅ Response.success:", response.success);
      console.log("📋 Response.data:", response.data);

      if (response.success && response.data) {
        setNhomNCList(response.data);
        console.log("🎉 NhomNC list set successfully:", response.data);
      } else {
        console.log("❌ Response validation failed:", response);
        toast.error("Dữ liệu không hợp lệ");
      }
    } catch (error) {
      toast.error("Không thể tải danh sách nhóm nghiên cứu");
      console.error("💥 Error fetching nhom NC:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (nhomNC?: INhomNC) => {
    if (nhomNC) {
      setEditMode(true);
      setSelectedNhomNC(nhomNC);
      setFormData({
        TenNhom: nhomNC.TenNhom,
        TenPhong: nhomNC.TenPhong,
      });
    } else {
      setEditMode(false);
      setSelectedNhomNC(null);
      setFormData({
        TenNhom: "",
        TenPhong: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditMode(false);
    setSelectedNhomNC(null);
    setFormData({
      TenNhom: "",
      TenPhong: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.TenNhom.trim() || !formData.TenPhong.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      if (editMode && selectedNhomNC) {
        await nhomNCApi.update(selectedNhomNC.MaNhom, formData);
        toast.success("Cập nhật nhóm nghiên cứu thành công");
      } else {
        await nhomNCApi.create(formData);
        toast.success("Thêm nhóm nghiên cứu thành công");
      }

      handleCloseModal();
      fetchNhomNCList();
    } catch (error) {
      toast.error(
        editMode
          ? "Không thể cập nhật nhóm nghiên cứu"
          : "Không thể thêm nhóm nghiên cứu"
      );
      console.error("Error saving nhom NC:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedNhomNC) return;

    try {
      await nhomNCApi.delete(selectedNhomNC.MaNhom);
      toast.success("Xóa nhóm nghiên cứu thành công");
      fetchNhomNCList();
    } catch (error) {
      toast.error("Không thể xóa nhóm nghiên cứu");
      console.error("Error deleting nhom NC:", error);
    }
    setIsDeleteDialogOpen(false);
    setSelectedNhomNC(null);
  };

  const handleDeleteClick = (nhomNC: INhomNC) => {
    setSelectedNhomNC(nhomNC);
    setIsDeleteDialogOpen(true);
  };

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
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
              <UserGroupIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Quản lý Nhóm Nghiên cứu
              </h1>
              <p className="text-gray-600 mt-1 text-lg">
                Quản lý thông tin các nhóm nghiên cứu trong hệ thống
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
              <div className="text-sm text-blue-600 font-medium">Tổng nhóm</div>
              <div className="text-2xl font-bold text-blue-700">
                {nhomNCList.length}
              </div>
            </div>

            <button
              onClick={() => handleOpenModal()}
              className="btn-primary flex items-center gap-2 px-6 py-3 text-base"
            >
              <PlusIcon className="h-5 w-5" />
              Thêm nhóm mới
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <SearchAndFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Tìm kiếm theo tên nhóm hoặc mã nhóm..."
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        sortOptions={sortOptions}
        selectedSite={selectedSite}
        onSiteChange={setSelectedSite}
        sites={availableSites}
      />

      {nhomNCList.length === 0 ? (
        <EmptyState
          title="Chưa có nhóm nghiên cứu nào"
          description="Bắt đầu bằng cách thêm nhóm nghiên cứu đầu tiên của bạn."
          action={
            <button
              onClick={() => handleOpenModal()}
              className="btn-primary flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Thêm nhóm mới
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Results summary */}
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Hiển thị{" "}
              <span className="font-semibold text-blue-600">{totalItems}</span>{" "}
              / <span className="font-semibold">{nhomNCList.length}</span> nhóm
            </p>
          </div>

          {totalItems === 0 ? (
            <EmptyState
              title="Không tìm thấy kết quả nào"
              description="Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {paginatedData.map((nhomNC, index) => (
                <div
                  key={nhomNC.MaNhom}
                  className="group bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-fade-in relative overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Background Pattern */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150"></div>

                  <div className="relative">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <UserGroupIcon className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-400 rounded-full border-2 border-white"></div>
                      </div>

                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                          {nhomNC.TenNhom}
                        </h3>
                        <p className="text-sm text-gray-500 font-medium">
                          {nhomNC.MaNhom}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span className="text-xs text-blue-600 font-medium">
                            Đang hoạt động
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Info Cards */}
                    <div className="space-y-4 mb-6">
                      <div className="bg-blue-50/50 border border-blue-200/50 rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m5 0v-4a1 1 0 011-1h2a1 1 0 011 1v4M7 7h10M7 11h10m-5 4h2"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                              Phòng làm việc
                            </p>
                            <p className="text-sm font-semibold text-gray-800">
                              {nhomNC.TenPhong}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200/50">
                      <div className="text-xs text-gray-500">
                        Cập nhật: Hôm nay
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(nhomNC)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          <PencilIcon className="h-4 w-4" />
                          <span className="text-sm font-medium">Chỉnh sửa</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(nhomNC)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          <TrashIcon className="h-4 w-4" />
                          <span className="text-sm font-medium">Xóa</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {editMode ? "Chỉnh sửa nhóm NC" : "Thêm nhóm NC mới"}
              </h3>
              <p className="text-sm text-gray-500">
                {editMode
                  ? "Cập nhật thông tin nhóm nghiên cứu"
                  : "Điền thông tin nhóm nghiên cứu mới"}
              </p>
            </div>
          </div>
        }
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="bg-blue-50/50 border border-blue-200/50 rounded-2xl p-6">
            <div className="space-y-5">
              <div>
                <label className="form-label flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4 text-blue-600" />
                  Tên nhóm nghiên cứu *
                </label>
                <input
                  type="text"
                  className="form-input mt-2 text-lg font-medium"
                  value={formData.TenNhom}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      TenNhom: e.target.value,
                    }))
                  }
                  placeholder="Nhập tên nhóm nghiên cứu"
                  required
                />
              </div>

              <RoomDropdown
                value={formData.TenPhong}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    TenPhong: value,
                  }))
                }
                required
                label="Tên phòng"
                placeholder="Chọn phòng làm việc"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCloseModal}
              className="btn-secondary px-6 py-3"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="btn-primary px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              {editMode ? "Cập nhật thông tin" : "Thêm nhóm NC"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedNhomNC(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa nhóm nghiên cứu "${selectedNhomNC?.TenNhom}"? Hành động này không thể hoàn tác.`}
        type="danger"
      />
    </div>
  );
};

export default NhomNCManagement;
