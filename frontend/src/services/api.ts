import axios, { AxiosResponse, AxiosError } from "axios";
import {
  IDeAn,
  INhanVien,
  INhomNC,
  IThamGia,
  IDeAnForm,
  INhanVienForm,
  INhomNCForm,
  ApiResponse,
} from "../types";

// Base API URL - adjust according to your backend port
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: any) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("[API Response]", response.data);
    return response;
  },
  (error: AxiosError) => {
    console.error("[API Error]", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// De An APIs
export const deAnApi = {
  getAll: (): Promise<ApiResponse<IDeAn[]>> =>
    api
      .get("/dean")
      .then((res: AxiosResponse) => res.data as ApiResponse<IDeAn[]>),

  getByMa: (maDA: string): Promise<ApiResponse<IDeAn>> =>
    api
      .get(`/dean/${maDA}`)
      .then((res: AxiosResponse) => res.data as ApiResponse<IDeAn>),

  create: (data: IDeAnForm): Promise<ApiResponse<IDeAn>> =>
    api
      .post("/dean", data)
      .then((res: AxiosResponse) => res.data as ApiResponse<IDeAn>),

  update: (maDA: string, data: IDeAnForm): Promise<ApiResponse<IDeAn>> =>
    api
      .put(`/dean/${maDA}`, data)
      .then((res: AxiosResponse) => res.data as ApiResponse<IDeAn>),

  delete: (maDA: string): Promise<ApiResponse<void>> =>
    api
      .delete(`/dean/${maDA}`)
      .then((res: AxiosResponse) => res.data as ApiResponse<void>),

  // Form 1 - Lấy đề án có nhân viên nhóm khác tham gia
  getWithOtherGroupEmployees: (maNhom: string): Promise<ApiResponse<IDeAn[]>> =>
    api
      .get(`/dean/other-group/${maNhom}`)
      .then((res: AxiosResponse) => res.data as ApiResponse<IDeAn[]>),

  // Form 3 - Lấy đề án chưa có nhân viên tham gia
  getEmpty: (): Promise<ApiResponse<IDeAn[]>> =>
    api
      .get("/dean/empty")
      .then((res: AxiosResponse) => res.data as ApiResponse<IDeAn[]>),
};

// Nhan Vien APIs
export const nhanVienApi = {
  getAll: (): Promise<ApiResponse<INhanVien[]>> =>
    api
      .get("/nhanvien")
      .then((res: AxiosResponse) => res.data as ApiResponse<INhanVien[]>),

  getByMa: (maNV: string): Promise<ApiResponse<INhanVien>> =>
    api
      .get(`/nhanvien/${maNV}`)
      .then((res: AxiosResponse) => res.data as ApiResponse<INhanVien>),

  create: (data: INhanVienForm): Promise<ApiResponse<INhanVien>> =>
    api
      .post("/nhanvien", data)
      .then((res: AxiosResponse) => res.data as ApiResponse<INhanVien>),

  update: (
    maNV: string,
    data: INhanVienForm
  ): Promise<ApiResponse<INhanVien>> =>
    api
      .put(`/nhanvien/${maNV}`, data)
      .then((res: AxiosResponse) => res.data as ApiResponse<INhanVien>),

  delete: (maNV: string): Promise<ApiResponse<void>> =>
    api
      .delete(`/nhanvien/${maNV}`)
      .then((res: AxiosResponse) => res.data as ApiResponse<void>),
};

// Nhom NC APIs
export const nhomNCApi = {
  getAll: (): Promise<ApiResponse<INhomNC[]>> =>
    api
      .get("/nhomnc")
      .then((res: AxiosResponse) => res.data as ApiResponse<INhomNC[]>),

  getByMa: (maNhom: string): Promise<ApiResponse<INhomNC>> =>
    api
      .get(`/nhomnc/${maNhom}`)
      .then((res: AxiosResponse) => res.data as ApiResponse<INhomNC>),

  getPhongList: (): Promise<
    ApiResponse<Array<{ TenPhong: string; SiteName: string }>>
  > =>
    api
      .get("/nhomnc/phong/list")
      .then(
        (res: AxiosResponse) =>
          res.data as ApiResponse<Array<{ TenPhong: string; SiteName: string }>>
      ),

  create: (data: INhomNCForm): Promise<ApiResponse<INhomNC>> =>
    api
      .post("/nhomnc", data)
      .then((res: AxiosResponse) => res.data as ApiResponse<INhomNC>),

  update: (maNhom: string, data: INhomNCForm): Promise<ApiResponse<INhomNC>> =>
    api
      .put(`/nhomnc/${maNhom}`, data)
      .then((res: AxiosResponse) => res.data as ApiResponse<INhomNC>),

  delete: (maNhom: string): Promise<ApiResponse<void>> =>
    api
      .delete(`/nhomnc/${maNhom}`)
      .then((res: AxiosResponse) => res.data as ApiResponse<void>),
};

// Tham Gia APIs
export const thamGiaApi = {
  getAll: (): Promise<ApiResponse<IThamGia[]>> =>
    api
      .get("/thamgia")
      .then((res: AxiosResponse) => res.data as ApiResponse<IThamGia[]>),

  getById: (maNV: string, maDA: string): Promise<ApiResponse<IThamGia>> =>
    api
      .get(`/thamgia/${maNV}/${maDA}`)
      .then((res: AxiosResponse) => res.data as ApiResponse<IThamGia>),

  add: (maNV: string, maDA: string): Promise<ApiResponse<IThamGia>> =>
    api
      .post("/thamgia", { MaNV: maNV, MaDA: maDA })
      .then((res: AxiosResponse) => res.data as ApiResponse<IThamGia>),

  update: (
    oldMaNV: string,
    oldMaDA: string,
    newMaNV: string,
    newMaDA: string
  ): Promise<ApiResponse<IThamGia>> =>
    api
      .put(`/thamgia/${oldMaNV}/${oldMaDA}`, { MaNV: newMaNV, MaDA: newMaDA })
      .then((res: AxiosResponse) => res.data as ApiResponse<IThamGia>),

  delete: (maNV: string, maDA: string): Promise<ApiResponse<void>> =>
    api
      .delete(`/thamgia/${maNV}/${maDA}`)
      .then((res: AxiosResponse) => res.data as ApiResponse<void>),
};

export default api;
