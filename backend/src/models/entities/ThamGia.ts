import { IThamGia } from "../interfaces/IThamGia";

export class ThamGia implements IThamGia {
  MaNV: string;
  MaDA: string;

  constructor(data: IThamGia) {
    this.MaNV = data.MaNV;
    this.MaDA = data.MaDA;
  }
}
