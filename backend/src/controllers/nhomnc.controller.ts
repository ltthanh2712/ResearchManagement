import { Request, Response } from "express";
import { NhomNCService } from "../services/nhomnc.service";

const nhomNCService = new NhomNCService();

export class NhomNCController {
  static async getAll(req: Request, res: Response) {
    try {
      const data = await nhomNCService.getAllNhomNC();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getPhongList(req: Request, res: Response) {
    try {
      const data = await nhomNCService.getPhongList();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getByMa(req: Request, res: Response) {
    try {
      const { maNhom } = req.params;
      const data = await nhomNCService.getNhomNCByMa(maNhom);
      if (!data)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy nhóm" });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { TenPhong, TenNhom, tenPhong, tenNhom } = req.body;
      const data = await nhomNCService.addNhomNC(
        TenPhong || tenPhong,
        TenNhom || tenNhom
      );
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { maNhom } = req.params;
      const { TenNhom, tenNhom, TenPhong, tenPhong } = req.body;
      const newMaNhom = await nhomNCService.updateNhomNC(
        maNhom,
        TenNhom || tenNhom,
        TenPhong || tenPhong
      );
      res.json({
        success: true,
        message: "Cập nhật thành công",
        data: { newMaNhom },
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { maNhom } = req.params;
      await nhomNCService.deleteNhomNC(maNhom);
      res.json({ success: true, message: "Xóa thành công" });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
