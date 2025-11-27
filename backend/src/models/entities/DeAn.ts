import { IDeAn } from "../interfaces/IDeAn";

export class DeAn implements IDeAn {
  MaDA: string;
  TenDA: string;
  MaNhom: string;

  constructor(data: IDeAn) {
    this.MaDA = data.MaDA;
    this.TenDA = data.TenDA;
    this.MaNhom = data.MaNhom;
  }
}
