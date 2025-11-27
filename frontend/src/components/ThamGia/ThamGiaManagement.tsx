import React, { useState, useEffect, useMemo } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  LinkIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { IThamGia, INhanVien, IDeAn } from "../../types";
import { thamGiaApi, nhanVienApi, deAnApi } from "../../services/api";
import LoadingSpinner from "../common/LoadingSpinner";
import EmptyState from "../common/EmptyState";
import Modal from "../common/Modal";
import ConfirmDialog from "../common/ConfirmDialog";
import SearchAndFilter from "../common/SearchAndFilter";
import Pagination from "../common/Pagination";

interface IThamGiaWithDetails extends IThamGia {
  TenNV?: string;
  TenDA?: string;
  MaNhom?: string;
  Site?: string;
}

interface IThamGiaForm {
  MaNV: string;
  MaDA: string;
}

const ThamGiaManagement: React.FC = () => {
  const [thamGiaList, setThamGiaList] = useState<IThamGiaWithDetails[]>([]);
  const [nhanVienList, setNhanVienList] = useState<INhanVien[]>([]);
  const [deAnList, setDeAnList] = useState<IDeAn[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedThamGia, setSelectedThamGia] =
    useState<IThamGiaWithDetails | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<IThamGiaForm>({
    MaNV: "",
    MaDA: "",
  });

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSite, setSelectedSite] = useState("");
  const [sortField, setSortField] = useState("MaNV");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showUnassignedProjects, setShowUnassignedProjects] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchNhanVienList(),
        fetchDeAnList(),
        fetchThamGiaList(),
      ]);
    };
    loadData();
  }, []);

  const fetchThamGiaList = async () => {
    try {
      const response = await thamGiaApi.getAll();
      if (response.success && response.data) {
        setThamGiaList(response.data);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách tham gia");
      console.error("Error fetching tham gia:", error);
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
    } finally {
      setLoading(false);
    }
  };

  // Enhanced data with details
  const enhancedThamGiaList = useMemo(() => {
    return thamGiaList.map((tg) => {
      const nhanVien = nhanVienList.find((nv) => nv.MaNV === tg.MaNV);
      const deAn = deAnList.find((da) => da.MaDA === tg.MaDA);
      const site = tg.MaDA.match(/^(P\d+)/)?.[1] || "";

      return {
        ...tg,
        TenNV: nhanVien?.HoTen,
        TenDA: deAn?.TenDA,
        MaNhom: nhanVien?.MaNhom,
        Site: site,
      };
    });
  }, [thamGiaList, nhanVienList, deAnList]);

  // Unassigned projects (projects without any participation)
  const unassignedProjects = useMemo(() => {
    const assignedProjectIds = new Set(thamGiaList.map((tg) => tg.MaDA));
    return deAnList.filter((da) => !assignedProjectIds.has(da.MaDA));
  }, [deAnList, thamGiaList]);

  // Filtered and sorted data
  const filteredAndSortedData = useMemo(() => {
    let filtered = enhancedThamGiaList;

    // Show unassigned projects
    if (showUnassignedProjects) {
      return unassignedProjects.map((da) => ({
        MaNV: "",
        MaDA: da.MaDA,
        TenNV: "Chưa có nhân viên",
        TenDA: da.TenDA,
        MaNhom: da.MaNhom,
        Site: da.MaDA.match(/^(P\d+)/)?.[1] || "",
      }));
    }

    // Apply filters
    filtered = enhancedThamGiaList.filter((tg) => {
      const matchesSearch =
        tg.TenNV?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tg.TenDA?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tg.MaNV.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tg.MaDA.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSite = !selectedSite || tg.Site === selectedSite;

      return matchesSearch && matchesSite;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue: string = "";
      let bValue: string = "";

      switch (sortField) {
        case "TenNV":
          aValue = a.TenNV || "";
          bValue = b.TenNV || "";
          break;
        case "TenDA":
          aValue = a.TenDA || "";
          bValue = b.TenDA || "";
          break;
        case "MaNV":
          aValue = a.MaNV;
          bValue = b.MaNV;
          break;
        case "MaDA":
          aValue = a.MaDA;
          bValue = b.MaDA;
          break;
        default:
          aValue = a.MaNV;
          bValue = b.MaNV;
      }

      if (sortDirection === "asc") {
        return aValue.localeCompare(bValue, "vi", { numeric: true });
      } else {
        return bValue.localeCompare(aValue, "vi", { numeric: true });
      }
    });

    return filtered;
  }, [
    enhancedThamGiaList,
    searchQuery,
    selectedSite,
    sortField,
    sortDirection,
    showUnassignedProjects,
    unassignedProjects,
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
    const siteSet = new Set(enhancedThamGiaList.map((tg) => tg.Site));
    const sites = Array.from(siteSet);
    return sites.sort();
  }, [enhancedThamGiaList]);

  const sortOptions = [
    { value: "MaNV", label: "Mã nhân viên" },
    { value: "TenNV", label: "Tên nhân viên" },
    { value: "MaDA", label: "Mã đề án" },
    { value: "TenDA", label: "Tên đề án" },
  ];

  const handleSortChange = (field: string, direction: "asc" | "desc") => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handleOpenModal = (thamGia?: IThamGiaWithDetails) => {
    if (thamGia && thamGia.MaNV) {
      setEditMode(true);
      setSelectedThamGia(thamGia);
      setFormData({
        MaNV: thamGia.MaNV,
        MaDA: thamGia.MaDA,
      });
    } else {
      setEditMode(false);
      setSelectedThamGia(null);
      setFormData({
        MaNV: "",
        MaDA: showUnassignedProjects && thamGia ? thamGia.MaDA : "",
      });
    }
    setIsModalOpen(true);
  };

  // Get filtered lists - now shows all options but highlights room compatibility
  const getFilteredLists = () => {
    // Show all employees and projects, but validate on submit
    return {
      filteredNhanVien: nhanVienList,
      filteredDeAn: deAnList,
    };
  };

  const { filteredNhanVien, filteredDeAn } = getFilteredLists();

  // Check room compatibility
  const getRoomCompatibility = () => {
    if (!formData.MaNV || !formData.MaDA) return null;

    const empRoom = formData.MaNV.match(/^(P\d+)/)?.[1];
    const projRoom = formData.MaDA.match(/^(P\d+)/)?.[1];

    return {
      isCompatible: empRoom === projRoom,
      empRoom,
      projRoom,
    };
  };

  const roomCompatibility = getRoomCompatibility();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // THAY ĐỔI: Cho phép cross-group participation
    // Hiển thị thông báo thông tin thay vì ngăn cản
    if (roomCompatibility && !roomCompatibility.isCompatible) {
      console.log(
        `Cross-group collaboration: Nhân viên phòng ${roomCompatibility.empRoom} tham gia đề án phòng ${roomCompatibility.projRoom}`
      );
    }

    try {
      if (editMode && selectedThamGia) {
        const response = await thamGiaApi.update(
          selectedThamGia.MaNV,
          selectedThamGia.MaDA,
          formData.MaNV,
          formData.MaDA
        );

        if (response.success) {
          toast.success("Cập nhật thành công");
          await fetchThamGiaList();
          setIsModalOpen(false);
        } else {
          toast.error(response.message || "Cập nhật thất bại");
        }
      } else {
        const response = await thamGiaApi.add(formData.MaNV, formData.MaDA);

        if (response.success) {
          toast.success("Thêm mới thành công");
          await fetchThamGiaList();
          setIsModalOpen(false);
        } else {
          toast.error(response.message || "Thêm mới thất bại");
        }
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
      console.error("Error submitting form:", error);
    }
  };

  const handleDelete = (thamGia: IThamGiaWithDetails) => {
    setSelectedThamGia(thamGia);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedThamGia) return;

    try {
      const response = await thamGiaApi.delete(
        selectedThamGia.MaNV,
        selectedThamGia.MaDA
      );

      if (response.success) {
        toast.success("Xóa thành công");
        await fetchThamGiaList();
        setIsDeleteDialogOpen(false);
        setSelectedThamGia(null);
      } else {
        toast.error(response.message || "Xóa thất bại");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xóa");
      console.error("Error deleting:", error);
    }
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
              <LinkIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Quản lý Tham gia
              </h1>
              <p className="text-gray-600 mt-1 text-lg">
                Quản lý quan hệ tham gia giữa nhân viên và đề án
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-purple-50 border border-purple-200 rounded-2xl px-4 py-3">
              <div className="text-sm text-purple-600 font-medium">
                Tổng quan hệ
              </div>
              <div className="text-2xl font-bold text-purple-700">
                {thamGiaList.length}
              </div>
            </div>

            {unassignedProjects.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3">
                <div className="text-sm text-orange-600 font-medium">
                  Đề án chưa có nhóm
                </div>
                <div className="text-2xl font-bold text-orange-700">
                  {unassignedProjects.length}
                </div>
              </div>
            )}

            <button
              onClick={() => handleOpenModal()}
              className="btn-primary flex items-center gap-2 px-6 py-3 text-base"
            >
              <PlusIcon className="h-5 w-5" />
              Thêm tham gia
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <SearchAndFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Tìm kiếm theo tên nhân viên, đề án, mã..."
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        sortOptions={sortOptions}
        selectedSite={selectedSite}
        onSiteChange={setSelectedSite}
        sites={availableSites}
      >
        {/* Additional filter for unassigned projects */}
        <button
          onClick={() => setShowUnassignedProjects(!showUnassignedProjects)}
          className={`px-4 py-3 rounded-xl border transition-all duration-200 ${
            showUnassignedProjects
              ? "bg-orange-500 text-white border-orange-500"
              : "bg-white/5 text-white border-white/10 hover:bg-white/10"
          }`}
        >
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4" />
            <span className="text-sm font-medium">
              Đề án chưa có nhóm ({unassignedProjects.length})
            </span>
          </div>
        </button>
      </SearchAndFilter>

      {thamGiaList.length === 0 ? (
        <EmptyState
          title="Chưa có quan hệ tham gia nào"
          description="Bắt đầu bằng cách thêm quan hệ tham gia đầu tiên của bạn."
          action={
            <button
              onClick={() => handleOpenModal()}
              className="btn-primary flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Thêm tham gia
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Results summary */}
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Hiển thị{" "}
              <span className="font-semibold text-purple-600">
                {filteredAndSortedData.length}
              </span>{" "}
              /{" "}
              <span className="font-semibold">
                {showUnassignedProjects
                  ? unassignedProjects.length
                  : thamGiaList.length}
              </span>{" "}
              {showUnassignedProjects
                ? "đề án chưa có nhóm"
                : "quan hệ tham gia"}
            </p>
          </div>

          {totalItems === 0 ? (
            <EmptyState
              title="Không tìm thấy kết quả nào"
              description="Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedData.map((thamGia, index) => (
                <div
                  key={`${thamGia.MaNV}-${thamGia.MaDA}`}
                  className={`group backdrop-blur-sm border rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in relative overflow-hidden ${
                    showUnassignedProjects
                      ? "bg-orange-50/70 border-orange-200/50"
                      : "bg-white/70 border-white/20"
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Background Pattern */}
                  <div
                    className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 transition-transform duration-500 group-hover:scale-150 ${
                      showUnassignedProjects
                        ? "bg-gradient-to-br from-orange-400/20 to-red-500/20"
                        : "bg-gradient-to-br from-purple-400/20 to-pink-600/20"
                    }`}
                  ></div>

                  <div className="relative">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                          showUnassignedProjects
                            ? "bg-gradient-to-br from-orange-500 to-red-600"
                            : "bg-gradient-to-br from-purple-500 to-pink-600"
                        }`}
                      >
                        {showUnassignedProjects ? (
                          <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                        ) : (
                          <LinkIcon className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3
                          className={`font-bold transition-colors duration-300 ${
                            showUnassignedProjects
                              ? "text-orange-800 group-hover:text-orange-600"
                              : "text-gray-800 group-hover:text-purple-600"
                          }`}
                        >
                          {showUnassignedProjects
                            ? "Đề án chưa có nhóm"
                            : "Quan hệ tham gia"}
                        </h3>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <UserGroupIcon className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600">
                          Nhân viên:
                        </span>
                        <span className="font-medium text-gray-800">
                          {thamGia.TenNV || "Chưa có"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <AcademicCapIcon className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">Đề án:</span>
                        <span className="font-medium text-gray-800">
                          {thamGia.TenDA || thamGia.MaDA}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>ID:</span>
                        <span className="font-mono">
                          {thamGia.MaNV || "N/A"} ↔ {thamGia.MaDA}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            showUnassignedProjects
                              ? "bg-orange-100 text-orange-600"
                              : "bg-purple-100 text-purple-600"
                          }`}
                        >
                          {thamGia.Site}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleOpenModal(thamGia)}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          showUnassignedProjects
                            ? "hover:bg-orange-100 text-orange-600"
                            : "hover:bg-purple-100 text-purple-600"
                        }`}
                        title={
                          showUnassignedProjects
                            ? "Thêm nhân viên"
                            : "Chỉnh sửa"
                        }
                      >
                        {showUnassignedProjects ? (
                          <PlusIcon className="w-4 h-4" />
                        ) : (
                          <PencilIcon className="w-4 h-4" />
                        )}
                      </button>

                      {!showUnassignedProjects && (
                        <button
                          onClick={() => handleDelete(thamGia)}
                          className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors duration-200"
                          title="Xóa"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editMode ? "Chỉnh sửa quan hệ tham gia" : "Thêm quan hệ tham gia mới"
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Information notice */}
          {/* Room compatibility warning */}
          {roomCompatibility && !roomCompatibility.isCompatible ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium text-blue-800">
                  Cross-group collaboration: Nhân viên phòng{" "}
                  {roomCompatibility.empRoom}
                  tham gia đề án phòng {roomCompatibility.projRoom}
                </span>
              </div>
            </div>
          ) : roomCompatibility && roomCompatibility.isCompatible ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm font-medium text-green-800">
                  Hợp lệ: Cùng phòng {roomCompatibility.empRoom}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium text-blue-800">
                  Lưu ý: Nhân viên chỉ có thể tham gia đề án cùng phòng
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="form-label flex items-center gap-2">
              <UserGroupIcon className="w-4 h-4 text-purple-600" />
              Nhân viên *
            </label>
            <select
              value={formData.MaNV}
              onChange={(e) => {
                const newMaNV = e.target.value;
                setFormData((prev) => {
                  // Only clear project if we had an employee before and switching to different room
                  const oldPhong = prev.MaNV
                    ? prev.MaNV.match(/^(P\d+)/)?.[1]
                    : null;
                  const newPhong = newMaNV
                    ? newMaNV.match(/^(P\d+)/)?.[1]
                    : null;

                  const shouldClearProject =
                    prev.MaNV &&
                    prev.MaDA &&
                    oldPhong &&
                    newPhong &&
                    oldPhong !== newPhong;

                  return {
                    MaNV: newMaNV,
                    MaDA: shouldClearProject ? "" : prev.MaDA,
                  };
                });
              }}
              className="form-input"
              required
            >
              <option value="">Chọn nhân viên</option>
              {filteredNhanVien.map((nv) => (
                <option key={nv.MaNV} value={nv.MaNV}>
                  {nv.HoTen} ({nv.MaNV}) - Phòng {nv.MaNV.match(/^(P\d+)/)?.[1]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label flex items-center gap-2">
              <AcademicCapIcon className="w-4 h-4 text-purple-600" />
              Đề án *
            </label>
            <select
              value={formData.MaDA}
              onChange={(e) => {
                const newMaDA = e.target.value;
                setFormData((prev) => {
                  // Only clear employee if we had a project before and switching to different room
                  const oldPhong = prev.MaDA
                    ? prev.MaDA.match(/^(P\d+)/)?.[1]
                    : null;
                  const newPhong = newMaDA
                    ? newMaDA.match(/^(P\d+)/)?.[1]
                    : null;

                  const shouldClearEmployee =
                    prev.MaDA &&
                    prev.MaNV &&
                    oldPhong &&
                    newPhong &&
                    oldPhong !== newPhong;

                  return {
                    MaDA: newMaDA,
                    MaNV: shouldClearEmployee ? "" : prev.MaNV,
                  };
                });
              }}
              className="form-input"
              required
            >
              <option value="">Chọn đề án</option>
              {filteredDeAn.map((da) => (
                <option key={da.MaDA} value={da.MaDA}>
                  {da.TenDA || da.MaDA} ({da.MaDA}) - Phòng{" "}
                  {da.MaDA.match(/^(P\d+)/)?.[1]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary" disabled={false}>
              {editMode ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </Modal>

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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedThamGia(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa quan hệ tham gia giữa "${selectedThamGia?.TenNV}" và đề án "${selectedThamGia?.TenDA}"? Hành động này không thể hoàn tác.`}
        type="danger"
      />
    </div>
  );
};

export default ThamGiaManagement;
