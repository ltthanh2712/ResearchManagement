import React, { useState, useEffect } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { nhomNCApi } from "../../services/api";

interface IPhongOption {
  TenPhong: string;
  SiteName: string;
}

interface RoomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

const RoomDropdown: React.FC<RoomDropdownProps> = ({
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = "Chọn phòng làm việc",
  className = "",
  label = "Tên phòng",
  showLabel = true,
}) => {
  const [phongOptions, setPhongOptions] = useState<IPhongOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPhongOptions();
  }, []);

  const fetchPhongOptions = async () => {
    try {
      setLoading(true);
      const response = await nhomNCApi.getPhongList();
      if (response.success && response.data) {
        setPhongOptions(response.data);
      } else {
        setPhongOptions([]);
        toast.error("Không thể tải danh sách phòng");
      }
    } catch (error) {
      console.error("Error fetching phong options:", error);
      setPhongOptions([]);
      toast.error("Không thể tải danh sách phòng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {showLabel && (
        <label className="form-label flex items-center gap-2">
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
          {label} {required && "*"}
        </label>
      )}
      <div className={`relative ${showLabel ? "mt-2" : ""}`}>
        <select
          className={`form-input text-lg appearance-none bg-white pr-10 cursor-pointer ${className}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled || loading}
        >
          <option value="" disabled>
            {loading ? "Đang tải danh sách phòng..." : placeholder}
          </option>
          {phongOptions.map((phong, index) => (
            <option key={index} value={phong.TenPhong}>
              {phong.TenPhong} ({phong.SiteName})
            </option>
          ))}
        </select>
        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      </div>
      {showLabel && (
        <p className="text-xs text-gray-500 mt-2">
          Chọn phòng từ danh sách có sẵn trong hệ thống
        </p>
      )}
    </div>
  );
};

export default RoomDropdown;
