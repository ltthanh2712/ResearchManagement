import { Request, Response } from "express";
import { NhanVienService } from "../services/nhanvien.service";

const nhanVienService = new NhanVienService();
export class NhanVienController {
  static async getAll(req: Request, res: Response) {
    try {
      const data = await nhanVienService.getAllNhanVien();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
  static async getByMa(req: Request, res: Response) {
    try {
      const { maNV } = req.params;
      const data = await nhanVienService.getNhanVienByMa(maNV);
      if (!data)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy nhân viên" });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
  static async create(req: Request, res: Response) {
    try {
      const { HoTen, MaNhom, hoTen, maNhom } = req.body;
      const data = await nhanVienService.addNhanVien(
        MaNhom || maNhom,
        HoTen || hoTen
      );
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
  static async update(req: Request, res: Response) {
    try {
      const { maNV } = req.params;
      const { HoTen, MaNhom, hoTen, maNhom } = req.body;
      await nhanVienService.updateNhanVien(
        maNV,
        HoTen || hoTen,
        MaNhom || maNhom
      );
      res.json({ success: true, message: "Cập nhật thành công" });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { maNV } = req.params;
      await nhanVienService.deleteNhanVien(maNV);
      res.json({ success: true, message: "Xóa thành công" });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
