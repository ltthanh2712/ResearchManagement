import React, { useState, useEffect, useMemo } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import {
  INhanVien,
  INhanVienForm,
  INhomNC,
  INhanVienWithDetails,
} from "../../types";
import { nhanVienApi, nhomNCApi } from "../../services/api";
import LoadingSpinner from "../common/LoadingSpinner";
import EmptyState from "../common/EmptyState";
import Modal from "../common/Modal";
import ConfirmDialog from "../common/ConfirmDialog";
import SearchAndFilter from "../common/SearchAndFilter";
import Pagination from "../common/Pagination";

const NhanVienManagement: React.FC = () => {
  const [nhanVienList, setNhanVienList] = useState<INhanVienWithDetails[]>([]);
  const [nhomNCList, setNhomNCList] = useState<INhomNC[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNhanVien, setSelectedNhanVien] = useState<INhanVien | null>(
    null
  );
  const [formData, setFormData] = useState<INhanVienForm>({
    HoTen: "",
    MaNhom: "",
  });
  const [editMode, setEditMode] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [sortField, setSortField] = useState("HoTen");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    const loadData = async () => {
      await fetchNhomNCList();
      await fetchNhanVienList();
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNhanVienList = async () => {
    try {
      setLoading(true);
      const response = await nhanVienApi.getAll();
      if (response.success && response.data) {
        // Enhance data with nhom info
        const enhancedData = response.data.map((nv) => ({
          ...nv,
          TenNhom: nhomNCList.find((nhom) => nhom.MaNhom === nv.MaNhom)
            ?.TenNhom,
          TenPhong: nhomNCList.find((nhom) => nhom.MaNhom === nv.MaNhom)
            ?.TenPhong,
        }));
        setNhanVienList(enhancedData);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách nhân viên");
      console.error("Error fetching nhan vien:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNhomNCList = async () => {
    try {
      const response = await nhomNCApi.getAll();
      if (response.success && response.data) {
        setNhomNCList(response.data);
      }
    } catch (error) {
      console.error("Error fetching nhom NC:", error);
    }
  };

  // Filtered and sorted data
  const filteredAndSortedData = useMemo(() => {
    let filtered = nhanVienList.filter((nhanVien) => {
      const matchesSearch =
        nhanVien.HoTen.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nhanVien.MaNV.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (nhanVien.TenNhom &&
          nhanVien.TenNhom.toLowerCase().includes(searchQuery.toLowerCase()));

      const nhom = nhomNCList.find((n) => n.MaNhom === nhanVien.MaNhom);
      const matchesSite =
        !selectedSite || (nhom && nhom.TenPhong === selectedSite);

      return matchesSearch && matchesSite;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue: string = "";
      let bValue: string = "";

      switch (sortField) {
        case "HoTen":
          aValue = a.HoTen;
          bValue = b.HoTen;
          break;
        case "MaNV":
          aValue = a.MaNV;
          bValue = b.MaNV;
          break;
        case "TenNhom":
          aValue = a.TenNhom || "";
          bValue = b.TenNhom || "";
          break;
        case "TenPhong":
          const nhomA = nhomNCList.find((n) => n.MaNhom === a.MaNhom);
          const nhomB = nhomNCList.find((n) => n.MaNhom === b.MaNhom);
          aValue = nhomA?.TenPhong || "";
          bValue = nhomB?.TenPhong || "";
          break;
        default:
          aValue = a.HoTen;
          bValue = b.HoTen;
      }

      if (sortDirection === "asc") {
        return aValue.localeCompare(bValue, "vi", { numeric: true });
      } else {
        return bValue.localeCompare(aValue, "vi", { numeric: true });
      }
    });

    return filtered;
  }, [
    nhanVienList,
    nhomNCList,
    searchQuery,
    selectedSite,
    sortField,
    sortDirection,
  ]);

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
    { value: "HoTen", label: "Họ tên" },
    { value: "MaNV", label: "Mã nhân viên" },
    { value: "TenNhom", label: "Tên nhóm" },
    { value: "TenPhong", label: "Phòng/Site" },
  ];

  const handleSortChange = (field: string, direction: "asc" | "desc") => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handleOpenModal = (nhanVien?: INhanVien) => {
    if (nhanVien) {
      setEditMode(true);
      setSelectedNhanVien(nhanVien);
      setFormData({
        HoTen: nhanVien.HoTen,
        MaNhom: nhanVien.MaNhom,
      });
    } else {
      setEditMode(false);
      setSelectedNhanVien(null);
      setFormData({
        HoTen: "",
        MaNhom: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditMode(false);
    setSelectedNhanVien(null);
    setFormData({
      HoTen: "",
      MaNhom: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.HoTen.trim() || !formData.MaNhom.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      if (editMode && selectedNhanVien) {
        await nhanVienApi.update(selectedNhanVien.MaNV, formData);
        toast.success("Cập nhật nhân viên thành công");
      } else {
        await nhanVienApi.create(formData);
        toast.success("Thêm nhân viên thành công");
      }

      handleCloseModal();
      fetchNhanVienList();
    } catch (error) {
      toast.error(
        editMode ? "Không thể cập nhật nhân viên" : "Không thể thêm nhân viên"
      );
      console.error("Error saving nhan vien:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedNhanVien) return;

    try {
      await nhanVienApi.delete(selectedNhanVien.MaNV);
      toast.success("Xóa nhân viên thành công");
      fetchNhanVienList();
    } catch (error) {
      toast.error("Không thể xóa nhân viên");
      console.error("Error deleting nhan vien:", error);
    }
    setIsDeleteDialogOpen(false);
    setSelectedNhanVien(null);
  };

  const handleDeleteClick = (nhanVien: INhanVien) => {
    setSelectedNhanVien(nhanVien);
    setIsDeleteDialogOpen(true);
  };

  // Get available groups based on edit mode and current employee's site
  const getAvailableGroups = () => {
    if (!editMode || !selectedNhanVien) {
      return nhomNCList; // Show all groups when creating new employee
    }

    // When editing, only show groups from the same site
    const currentPrefix = selectedNhanVien.MaNhom.match(/^P\d+/)?.[0];
    if (!currentPrefix) return nhomNCList;

    return nhomNCList.filter((nhom) => nhom.MaNhom.startsWith(currentPrefix));
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
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-xl">
              <UserGroupIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Quản lý Nhân viên
              </h1>
              <p className="text-gray-600 mt-1 text-lg">
                Quản lý thông tin các nhân viên nghiên cứu trong hệ thống
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
              <div className="text-sm text-emerald-600 font-medium">
                Tổng nhân viên
              </div>
              <div className="text-2xl font-bold text-emerald-700">
                {totalItems}
              </div>
            </div>

            <button
              onClick={() => handleOpenModal()}
              className="btn-primary flex items-center gap-2 px-6 py-3 text-base"
            >
              <PlusIcon className="h-5 w-5" />
              Thêm nhân viên
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <SearchAndFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Tìm kiếm theo tên, mã nhân viên, nhóm..."
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        sortOptions={sortOptions}
        selectedSite={selectedSite}
        onSiteChange={setSelectedSite}
        sites={availableSites}
      />

      {totalItems === 0 ? (
        <EmptyState
          title="Chưa có nhân viên nào"
          description="Bắt đầu bằng cách thêm nhân viên đầu tiên của bạn."
          action={
            <button
              onClick={() => handleOpenModal()}
              className="btn-primary flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Thêm nhân viên
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {paginatedData.map((nhanVien, index) => (
            <div
              key={nhanVien.MaNV}
              className="group bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-fade-in relative overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-green-600/20 rounded-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150"></div>

              <div className="relative">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <span className="text-xl font-bold text-white">
                        {nhanVien.HoTen.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-emerald-600 transition-colors duration-300">
                      {nhanVien.HoTen}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">
                      Mã NV: {nhanVien.MaNV}
                    </p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">
                      Nhóm: {nhanVien.MaNhom}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200/50">
                  <div className="text-xs text-gray-500">Cập nhật: Hôm nay</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(nhanVien)}
                      className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">Sửa</span>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(nhanVien)}
                      className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
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
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {editMode ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
              </h3>
              <p className="text-sm text-gray-500">
                {editMode
                  ? "Cập nhật thông tin nhân viên"
                  : "Điền thông tin nhân viên mới"}
              </p>
            </div>
          </div>
        }
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="bg-emerald-50/50 border border-emerald-200/50 rounded-2xl p-6">
            <div className="space-y-5">
              <div>
                <label className="form-label flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Họ và tên *
                </label>
                <input
                  type="text"
                  className="form-input mt-2 text-lg font-medium"
                  value={formData.HoTen}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, HoTen: e.target.value }))
                  }
                  placeholder="Nhập họ và tên đầy đủ"
                  required
                />
              </div>

              <div>
                <label className="form-label flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4 text-emerald-600" />
                  Nhóm nghiên cứu *
                </label>
                <select
                  className="form-input mt-2 text-lg"
                  value={formData.MaNhom}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, MaNhom: e.target.value }))
                  }
                  required
                >
                  <option value="">-- Chọn nhóm nghiên cứu --</option>
                  {getAvailableGroups().map((nhom) => (
                    <option key={nhom.MaNhom} value={nhom.MaNhom}>
                      {nhom.TenNhom} ({nhom.TenPhong})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  {editMode
                    ? "Có thể thay đổi nhóm trong cùng site hiện tại"
                    : "Nhân viên sẽ được phân vào nhóm nghiên cứu này"}
                </p>
              </div>
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
              className="btn-primary px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
            >
              {editMode ? "Cập nhật thông tin" : "Thêm nhân viên"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedNhanVien(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa nhân viên "${selectedNhanVien?.HoTen}"? Hành động này không thể hoàn tác.`}
        type="danger"
      />
    </div>
  );
};

export default NhanVienManagement;
