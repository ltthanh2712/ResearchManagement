import { INhanVien } from "../interfaces/INhanVien";

export class NhanVien implements INhanVien {
  MaNV: string;
  HoTen: string;
  MaNhom: string;

  constructor(data: INhanVien) {
    this.MaNV = data.MaNV;
    this.HoTen = data.HoTen;
    this.MaNhom = data.MaNhom;
  }
}
