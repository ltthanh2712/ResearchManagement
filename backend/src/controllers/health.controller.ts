// src/controllers/health.controller.ts
import { Request, Response } from "express";
import { faultTolerance } from "../config/fault-tolerance";
import { NhanVienService } from "../services/nhanvien.service";

export class HealthController {
  // Kiểm tra trạng thái tất cả các sites
  static async getSiteHealth(req: Request, res: Response) {
    try {
      const siteStatuses = faultTolerance.getSiteStatuses();

      const healthReport = {
        timestamp: new Date().toISOString(),
        totalSites: siteStatuses.length,
        availableSites: siteStatuses.filter((s) => s.isAvailable).length,
        unavailableSites: siteStatuses.filter((s) => !s.isAvailable).length,
        sites: siteStatuses.map((site) => ({
          site: site.site,
          status: site.isAvailable ? "UP" : "DOWN",
          lastChecked: site.lastChecked,
          error: site.error || null,
        })),
      };

      const httpStatus = healthReport.availableSites > 0 ? 200 : 503;
      res.status(httpStatus).json(healthReport);
    } catch (error) {
      res.status(500).json({
        error: "Không thể kiểm tra trạng thái sites",
        details: (error as Error).message,
      });
    }
  }

  // Test fault tolerance bằng cách tắt một site
  static async testFaultTolerance(req: Request, res: Response) {
    try {
      const nhanVienService = new NhanVienService();

      // Thử lấy tất cả nhân viên với fault tolerance
      console.log("🧪 Testing fault tolerance...");
      const employees = await nhanVienService.getAllNhanVien();

      const siteStatuses = nhanVienService.getSiteHealthStatus();

      res.json({
        message: "Fault tolerance test completed",
        employeesFound: employees.length,
        siteStatuses: siteStatuses.map((site) => ({
          site: site.site,
          status: site.isAvailable ? "UP" : "DOWN",
          lastChecked: site.lastChecked,
        })),
        availableSites: siteStatuses.filter((s) => s.isAvailable).length,
        employees: employees.slice(0, 5), // Chỉ hiển thị 5 nhân viên đầu để test
      });
    } catch (error) {
      res.status(500).json({
        error: "Test fault tolerance thất bại",
        details: (error as Error).message,
      });
    }
  }

  // Thử tìm một nhân viên cụ thể với fault tolerance
  static async testEmployeeSearch(req: Request, res: Response) {
    try {
      const { maNV } = req.params;
      if (!maNV) {
        return res.status(400).json({ error: "Thiếu mã nhân viên" });
      }

      const nhanVienService = new NhanVienService();
      console.log(`🔍 Testing search for employee: ${maNV}`);

      const employee = await nhanVienService.getNhanVienByMa(maNV);
      const siteStatuses = nhanVienService.getSiteHealthStatus();

      res.json({
        message: `Search test completed for ${maNV}`,
        employee: employee,
        found: employee !== null,
        siteStatuses: siteStatuses.map((site) => ({
          site: site.site,
          status: site.isAvailable ? "UP" : "DOWN",
        })),
      });
    } catch (error) {
      res.status(500).json({
        error: "Test search thất bại",
        details: (error as Error).message,
      });
    }
  }

  // Kiểm tra overall system health
  static async getSystemHealth(req: Request, res: Response) {
    try {
      const siteStatuses = faultTolerance.getSiteStatuses();
      const availableSites = siteStatuses.filter((s) => s.isAvailable);

      let systemStatus = "HEALTHY";
      let message = "Tất cả sites hoạt động bình thường";

      if (availableSites.length === 0) {
        systemStatus = "CRITICAL";
        message = "Tất cả sites đều down!";
      } else if (availableSites.length < siteStatuses.length) {
        systemStatus = "DEGRADED";
        message = `${
          siteStatuses.length - availableSites.length
        } site(s) down, nhưng hệ thống vẫn hoạt động`;
      }

      const response = {
        status: systemStatus,
        message: message,
        timestamp: new Date().toISOString(),
        sites: {
          total: siteStatuses.length,
          available: availableSites.length,
          unavailable: siteStatuses.length - availableSites.length,
        },
        faultTolerant: availableSites.length > 0,
      };

      const httpStatus = systemStatus === "CRITICAL" ? 503 : 200;
      res.status(httpStatus).json(response);
    } catch (error) {
      res.status(500).json({
        status: "ERROR",
        message: "Không thể kiểm tra system health",
        error: (error as Error).message,
      });
    }
  }
}
