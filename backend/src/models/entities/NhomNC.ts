import { INhomNC } from "../interfaces/INhomNC";

export class NhomNC implements INhomNC {
  MaNhom: string;
  TenNhom: string;
  TenPhong: string;

  constructor(data: INhomNC) {
    this.MaNhom = data.MaNhom;
    this.TenNhom = data.TenNhom;
    this.TenPhong = data.TenPhong;
  }
}
