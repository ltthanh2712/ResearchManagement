import { Request, Response } from "express";
import { ThamGiaService } from "../services/thamgia.service";

const thamGiaService = new ThamGiaService();

export class ThamGiaController {
  static async getAll(req: Request, res: Response) {
    try {
      const data = await thamGiaService.getAllThamGia();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { maNV, maDA } = req.params;
      const data = await thamGiaService.getThamGia(maNV, maDA);

      if (!data) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy quan hệ tham gia",
        });
      }

      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { MaNV, MaDA } = req.body;

      if (!MaNV || !MaDA) {
        return res.status(400).json({
          success: false,
          message: "MaNV và MaDA là bắt buộc",
        });
      }

      const success = await thamGiaService.addThamGia(MaNV, MaDA);

      if (success) {
        const data = await thamGiaService.getThamGia(MaNV, MaDA);
        res.status(201).json({
          success: true,
          message: "Thêm quan hệ tham gia thành công",
          data,
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Thêm quan hệ tham gia thất bại",
        });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { maNV: oldMaNV, maDA: oldMaDA } = req.params;
      const { MaNV: newMaNV, MaDA: newMaDA } = req.body;

      if (!newMaNV || !newMaDA) {
        return res.status(400).json({
          success: false,
          message: "MaNV và MaDA mới là bắt buộc",
        });
      }

      const success = await thamGiaService.updateThamGia(
        oldMaNV,
        oldMaDA,
        newMaNV,
        newMaDA
      );

      if (success) {
        const data = await thamGiaService.getThamGia(newMaNV, newMaDA);
        res.json({
          success: true,
          message: "Cập nhật quan hệ tham gia thành công",
          data,
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Cập nhật quan hệ tham gia thất bại",
        });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { maNV, maDA } = req.params;

      const success = await thamGiaService.deleteThamGia(maNV, maDA);

      if (success) {
        res.json({
          success: true,
          message: "Xóa quan hệ tham gia thành công",
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Xóa quan hệ tham gia thất bại",
        });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
