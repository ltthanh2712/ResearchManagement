// API interfaces matching backend models
export interface IDeAn {
  MaDA: string;
  TenDA: string;
  MaNhom: string;
}

export interface INhanVien {
  MaNV: string;
  HoTen: string;
  MaNhom: string;
}

export interface INhomNC {
  MaNhom: string;
  TenNhom: string;
  TenPhong: string;
}

export interface IThamGia {
  MaNV: string;
  MaDA: string;
}

// Extended interfaces for frontend display
export interface IDeAnWithDetails extends IDeAn {
  TenNhom?: string;
  SoThanhVien?: number;
}

export interface INhanVienWithDetails extends INhanVien {
  TenNhom?: string;
  TenPhong?: string;
  SoDeAn?: number;
}

export interface IThamGiaWithDetails extends IThamGia {
  TenNV?: string;
  TenDA?: string;
}

// Form interfaces
export interface IDeAnForm {
  TenDA: string;
  MaNhom: string;
}

export interface INhanVienForm {
  HoTen: string;
  MaNhom: string;
}

export interface INhomNCForm {
  TenNhom: string;
  TenPhong: string;
}

// API Response interface
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
