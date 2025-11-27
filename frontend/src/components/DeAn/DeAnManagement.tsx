import React, { useState, useEffect, useMemo } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  AcademicCapIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import {
  IDeAn,
  IDeAnForm,
  INhomNC,
  IDeAnWithDetails,
  IThamGia,
} from "../../types";
import { deAnApi, nhomNCApi, thamGiaApi } from "../../services/api";
import LoadingSpinner from "../common/LoadingSpinner";
import EmptyState from "../common/EmptyState";
import Modal from "../common/Modal";
import ConfirmDialog from "../common/ConfirmDialog";
import SearchAndFilter from "../common/SearchAndFilter";
import Pagination from "../common/Pagination";

const DeAnManagement: React.FC = () => {
  const [deAnList, setDeAnList] = useState<IDeAnWithDetails[]>([]);
  const [nhomNCList, setNhomNCList] = useState<INhomNC[]>([]);
  const [thamGiaList, setThamGiaList] = useState<IThamGia[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDeAn, setSelectedDeAn] = useState<IDeAn | null>(null);
  const [formData, setFormData] = useState<IDeAnForm>({
    TenDA: "",
    MaNhom: "",
  });
  const [editMode, setEditMode] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [sortField, setSortField] = useState("TenDA");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showUnassignedProjects, setShowUnassignedProjects] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    const loadData = async () => {
      await fetchNhomNCList();
      await fetchThamGiaList();
      await fetchDeAnList();
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDeAnList = async () => {
    try {
      setLoading(true);
      const response = await deAnApi.getAll();
      if (response.success && response.data) {
        // Enhance data with nhom info
        const enhancedData = response.data.map((da) => ({
          ...da,
          TenNhom: nhomNCList.find((nhom) => nhom.MaNhom === da.MaNhom)
            ?.TenNhom,
        }));
        setDeAnList(enhancedData);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách đề án");
      console.error("Error fetching de an:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchThamGiaList = async () => {
    try {
      const response = await thamGiaApi.getAll();
      if (response.success && response.data) {
        setThamGiaList(response.data);
      }
    } catch (error) {
      console.error("Error fetching tham gia:", error);
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

  // Get unassigned projects
  const unassignedProjects = useMemo(() => {
    const assignedProjectIds = new Set(thamGiaList.map((tg) => tg.MaDA));
    return deAnList.filter((da) => !assignedProjectIds.has(da.MaDA));
  }, [deAnList, thamGiaList]);

  // Filtered and sorted data
  const filteredAndSortedData = useMemo(() => {
    let filtered = showUnassignedProjects ? unassignedProjects : deAnList;

    filtered = filtered.filter((deAn) => {
      const matchesSearch =
        (deAn.TenDA &&
          deAn.TenDA.toLowerCase().includes(searchQuery.toLowerCase())) ||
        deAn.MaDA.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (deAn.TenNhom &&
          deAn.TenNhom.toLowerCase().includes(searchQuery.toLowerCase()));

      const nhom = nhomNCList.find((n) => n.MaNhom === deAn.MaNhom);
      const matchesSite =
        !selectedSite || (nhom && nhom.TenPhong === selectedSite);

      return matchesSearch && matchesSite;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue: string = "";
      let bValue: string = "";

      switch (sortField) {
        case "TenDA":
          aValue = a.TenDA || "";
          bValue = b.TenDA || "";
          break;
        case "MaDA":
          aValue = a.MaDA;
          bValue = b.MaDA;
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
          aValue = a.TenDA || "";
          bValue = b.TenDA || "";
      }

      if (sortDirection === "asc") {
        return aValue.localeCompare(bValue, "vi", { numeric: true });
      } else {
        return bValue.localeCompare(aValue, "vi", { numeric: true });
      }
    });

    return filtered;
  }, [
    deAnList,
    unassignedProjects,
    nhomNCList,
    searchQuery,
    selectedSite,
    sortField,
    sortDirection,
    showUnassignedProjects,
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
  }, [
    searchQuery,
    selectedSite,
    sortField,
    sortDirection,
    showUnassignedProjects,
  ]);

  // Get unique sites for filter
  const availableSites = useMemo(() => {
    const siteSet = new Set(nhomNCList.map((nhom) => nhom.TenPhong));
    const sites = Array.from(siteSet);
    return sites.sort();
  }, [nhomNCList]);

  const sortOptions = [
    { value: "TenDA", label: "Tên đề án" },
    { value: "MaDA", label: "Mã đề án" },
    { value: "TenNhom", label: "Tên nhóm" },
    { value: "TenPhong", label: "Phòng/Site" },
  ];

  const handleSortChange = (field: string, direction: "asc" | "desc") => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handleOpenModal = (deAn?: IDeAn) => {
    if (deAn) {
      setEditMode(true);
      setSelectedDeAn(deAn);
      setFormData({
        TenDA: deAn.TenDA,
        MaNhom: deAn.MaNhom,
      });
    } else {
      setEditMode(false);
      setSelectedDeAn(null);
      setFormData({
        TenDA: "",
        MaNhom: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditMode(false);
    setSelectedDeAn(null);
    setFormData({
      TenDA: "",
      MaNhom: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.TenDA.trim() || !formData.MaNhom.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      if (editMode && selectedDeAn) {
        await deAnApi.update(selectedDeAn.MaDA, formData);
        toast.success("Cập nhật đề án thành công");
      } else {
        await deAnApi.create(formData);
        toast.success("Thêm đề án thành công");
      }

      handleCloseModal();
      fetchDeAnList();
    } catch (error) {
      toast.error(
        editMode ? "Không thể cập nhật đề án" : "Không thể thêm đề án"
      );
      console.error("Error saving de an:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDeAn) return;

    try {
      await deAnApi.delete(selectedDeAn.MaDA);
      toast.success("Xóa đề án thành công");
      fetchDeAnList();
    } catch (error) {
      toast.error("Không thể xóa đề án");
      console.error("Error deleting de an:", error);
    }
    setIsDeleteDialogOpen(false);
    setSelectedDeAn(null);
  };

  const handleDeleteClick = (deAn: IDeAn) => {
    setSelectedDeAn(deAn);
    setIsDeleteDialogOpen(true);
  };

  // Get available groups based on edit mode and current project's site
  const getAvailableGroups = () => {
    if (!editMode || !selectedDeAn) {
      return nhomNCList; // Show all groups when creating new project
    }

    // When editing, only show groups from the same site
    const currentPrefix = selectedDeAn.MaNhom.match(/^P\d+/)?.[0];
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
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
              <AcademicCapIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Quản lý Đề án
              </h1>
              <p className="text-gray-600 mt-1 text-lg">
                Quản lý thông tin các đề án nghiên cứu trong hệ thống
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-purple-50 border border-purple-200 rounded-2xl px-4 py-3">
              <div className="text-sm text-purple-600 font-medium">
                Tổng đề án
              </div>
              <div className="text-2xl font-bold text-purple-700">
                {deAnList.length}
              </div>
            </div>

            {unassignedProjects.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3">
                <div className="text-sm text-orange-600 font-medium">
                  Chưa có tham gia
                </div>
                <div className="text-2xl font-bold text-orange-700">
                  {unassignedProjects.length}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowUnassignedProjects(!showUnassignedProjects)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                showUnassignedProjects
                  ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {showUnassignedProjects ? "Hiện tất cả" : "Chỉ chưa có tham gia"}
            </button>

            <button
              onClick={() => handleOpenModal()}
              className="btn-primary flex items-center gap-2 px-6 py-3 text-base"
            >
              <PlusIcon className="h-5 w-5" />
              Thêm đề án mới
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <SearchAndFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Tìm kiếm theo tên đề án, mã đề án hoặc nhóm..."
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        sortOptions={sortOptions}
        selectedSite={selectedSite}
        onSiteChange={setSelectedSite}
        sites={availableSites}
      />

      {deAnList.length === 0 ? (
        <EmptyState
          title="Chưa có đề án nào"
          description="Bắt đầu bằng cách thêm đề án nghiên cứu đầu tiên của bạn."
          action={
            <button
              onClick={() => handleOpenModal()}
              className="btn-primary flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Thêm đề án mới
            </button>
          }
        />
      ) : (
        <>
          {/* Dynamic header */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    showUnassignedProjects ? "bg-orange-400" : "bg-purple-400"
                  }`}
                ></div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {showUnassignedProjects
                    ? `Đề án chưa có nhân viên tham gia (${totalItems})`
                    : `Danh sách đề án (${totalItems})`}
                </h3>
              </div>
            </div>
          </div>

          {totalItems === 0 ? (
            <EmptyState
              title={
                showUnassignedProjects
                  ? "Tất cả đề án đều đã có người tham gia"
                  : "Không tìm thấy kết quả nào"
              }
              description={
                showUnassignedProjects
                  ? "Điều này thật tuyệt vời! Tất cả đề án đều đã có nhân viên tham gia."
                  : "Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc."
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {paginatedData.map((deAn, index) => (
                <div
                  key={deAn.MaDA}
                  className="group bg-white/70 backdrop-blur-sm border border-white/20 rounded-3xl p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-fade-in relative overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Background Pattern */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150"></div>

                  <div className="relative">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <span className="text-xl font-bold text-white">
                            {deAn.TenDA
                              ? deAn.TenDA.charAt(0).toUpperCase()
                              : "?"}
                          </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-400 rounded-full border-2 border-white"></div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors duration-300">
                            {deAn.TenDA || "Chưa có tên"}
                          </h3>
                          {!showUnassignedProjects && (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                thamGiaList.some((tg) => tg.MaDA === deAn.MaDA)
                                  ? "bg-green-100 text-green-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              {thamGiaList.some((tg) => tg.MaDA === deAn.MaDA)
                                ? "Có tham gia"
                                : "Chưa có"}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 font-medium">
                          Mã ĐA: {deAn.MaDA}
                        </p>
                        <p className="text-xs text-purple-600 font-medium mt-1">
                          Nhóm: {deAn.MaNhom}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200/50">
                      <div className="text-xs text-gray-500">
                        Cập nhật: Hôm nay
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(deAn)}
                          className="flex items-center gap-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          <PencilIcon className="h-4 w-4" />
                          <span className="text-sm font-medium">Sửa</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(deAn)}
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
        </>
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
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
              <AcademicCapIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {editMode ? "Chỉnh sửa đề án" : "Thêm đề án mới"}
              </h3>
              <p className="text-sm text-gray-500">
                {editMode
                  ? "Cập nhật thông tin đề án"
                  : "Điền thông tin đề án mới"}
              </p>
            </div>
          </div>
        }
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="bg-purple-50/50 border border-purple-200/50 rounded-2xl p-6">
            <div className="space-y-5">
              <div>
                <label className="form-label flex items-center gap-2">
                  <AcademicCapIcon className="w-4 h-4 text-purple-600" />
                  Tên đề án *
                </label>
                <input
                  type="text"
                  className="form-input mt-2 text-lg font-medium"
                  value={formData.TenDA}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, TenDA: e.target.value }))
                  }
                  placeholder="Nhập tên đề án nghiên cứu"
                  required
                />
              </div>

              <div>
                <label className="form-label flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4 text-purple-600" />
                  Nhóm thực hiện *
                </label>
                <select
                  className="form-input mt-2 text-lg"
                  value={formData.MaNhom}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, MaNhom: e.target.value }))
                  }
                  required
                >
                  <option value="">-- Chọn nhóm thực hiện --</option>
                  {getAvailableGroups().map((nhom) => (
                    <option key={nhom.MaNhom} value={nhom.MaNhom}>
                      {nhom.TenNhom} ({nhom.TenPhong})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  {editMode
                    ? "Có thể thay đổi nhóm trong cùng site hiện tại"
                    : "Chọn nhóm nghiên cứu sẽ thực hiện đề án này"}
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
              className="btn-primary px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              {editMode ? "Cập nhật thông tin" : "Thêm đề án"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedDeAn(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa đề án "${selectedDeAn?.TenDA}"? Hành động này không thể hoàn tác.`}
        type="danger"
      />
    </div>
  );
};

export default DeAnManagement;
