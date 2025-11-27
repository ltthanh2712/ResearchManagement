import { Request, Response } from "express";
import { DeAnService } from "../services/dean.service";

const deAnService = new DeAnService();

export class DeAnController {
  static async getAll(req: Request, res: Response) {
    try {
      const data = await deAnService.getAllDeAn();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async getByMa(req: Request, res: Response) {
    try {
      const { maDA } = req.params;
      const data = await deAnService.getDeAnByMa(maDA);
      if (!data)
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy đề án" });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
  static async getEmpty(req: Request, res: Response) {
    try {
      const data = await deAnService.getEmptyDeAn();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { MaNhom, TenDA, maNhom, tenDA } = req.body;
      const data = await deAnService.addDeAn(MaNhom || maNhom, TenDA || tenDA);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { maDA } = req.params;
      const { TenDA, tenDA, MaNhom, maNhom } = req.body;
      await deAnService.updateDeAn(maDA, TenDA || tenDA, MaNhom || maNhom);
      res.json({ success: true, message: "Cập nhật thành công" });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { maDA } = req.params;
      await deAnService.deleteDeAn(maDA);
      res.json({ success: true, message: "Xóa thành công" });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
