export interface INhomNC {
  MaNhom: string;
  TenNhom: string;
  TenPhong: string;
}

export interface INhanVien {
  MaNV: string;
  HoTen: string;
  MaNhom: string;
}

export interface IDeAn {
  MaDA: string;
  TenDA: string;
  MaNhom: string;
}

export interface IThamGia {
  MaNV: string;
  MaDA: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export type SiteType = "A" | "B" | "C";
