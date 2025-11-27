import { getConnection } from "../config/db";
import { INhanVien } from "../types";
import { BaseService } from "./base.service";
import { faultTolerance } from "../config/fault-tolerance";

const allowedSites = ["siteA", "siteB", "siteC", "global"] as const;
type SiteName = (typeof allowedSites)[number];

function isValidSite(site: string): site is SiteName {
  return allowedSites.includes(site as SiteName);
}

export class NhanVienService extends BaseService {
  // ----------------------
  // Lấy tất cả nhân viên từ tất cả site dựa vào Global DB với fault tolerance
  async getAllNhanVien(): Promise<INhanVien[]> {
    // Lấy routing info từ Global DB
    let routingRows: {
      TenPhong: string;
      SiteName: string;
      DatabaseType: "mssql" | "postgres";
    }[] = [];

    try {
      const globalResult = await this.executeQuery(
        "global",
        `SELECT TenPhong, SiteName, DatabaseType FROM SiteRouting`
      );
      routingRows = globalResult.recordset || globalResult.rows || [];
    } catch (error) {
      console.error("Không thể lấy routing info từ Global DB:", error);
      // Fallback: tìm kiếm trên tất cả sites
      return this.getAllNhanVienFallback();
    }

    let results: INhanVien[] = [];

    for (const route of routingRows) {
      if (!isValidSite(route.SiteName)) {
        console.warn(`Site không hợp lệ: ${route.SiteName}, bỏ qua`);
        continue;
      }

      // Kiểm tra site có khả dụng không
      if (!faultTolerance.isSiteAvailable(route.SiteName)) {
        console.warn(`⚠️  Site ${route.SiteName} không khả dụng, bỏ qua`);
        continue;
      }

      try {
        const result = await this.executeQuery(
          route.SiteName,
          `SELECT MaNV, HoTen, MaNhom FROM NhanVien`
        );

        const data = result.recordset || result.rows || [];
        results.push(...data);
      } catch (err) {
        console.error(`Không thể truy vấn site ${route.SiteName}:`, err);
        // tiếp tục site tiếp theo
        continue;
      }
    }

    return results;
  }

  // ----------------------
  // Fallback: tìm kiếm nhân viên theo MaNV trên tất cả sites
  private async getNhanVienByMaFallback(
    maNV: string
  ): Promise<INhanVien | null> {
    console.log(`🔄 Sử dụng fallback mode - tìm ${maNV} trên tất cả sites`);

    const results = await this.findDataAcrossSites<INhanVien>(
      `SELECT MaNV, HoTen, MaNhom FROM NhanVien WHERE MaNV = ?`,
      [maNV]
    );

    for (const { site, data } of results) {
      if (data.length > 0) {
        console.log(`✅ Tìm thấy nhân viên ${maNV} trên ${site}`);
        return data[0];
      }
    }

    return null;
  }

  // ----------------------
  // Fallback: tìm kiếm nhân viên trên tất cả site khả dụng
  private async getAllNhanVienFallback(): Promise<INhanVien[]> {
    console.log("🔄 Sử dụng fallback mode - tìm kiếm trên tất cả sites");

    const results = await this.findDataAcrossSites<INhanVien>(
      `SELECT MaNV, HoTen, MaNhom FROM NhanVien`
    );

    let allData: INhanVien[] = [];
    results.forEach(({ site, data }) => {
      console.log(`✅ Tìm thấy ${data.length} nhân viên trên ${site}`);
      allData.push(...data);
    });

    return allData;
  }

  // ----------------------
  // Lấy nhân viên theo MaNV với fault tolerance
  async getNhanVienByMa(maNV: string): Promise<INhanVien | null> {
    // Xác định TenPhong từ MaNV (ví dụ: "P1N1..." -> "P1")
    const prefix = maNV.match(/^P\d+/)?.[0];
    if (!prefix) throw new Error("MaNV không hợp lệ");

    let siteName: string | null = null;

    try {
      // Tra Global DB để lấy site
      const globalResult = await this.executeQuery(
        "global",
        `SELECT SiteName FROM SiteRouting WHERE TenPhong = ?`,
        [prefix]
      );

      const routes = globalResult.recordset || globalResult.rows || [];
      siteName = routes[0]?.SiteName || null;
    } catch (error) {
      console.error("Không thể truy vấn Global DB:", error);
      // Fallback: tìm kiếm trên tất cả sites
      return this.getNhanVienByMaFallback(maNV);
    }

    if (!siteName) {
      // Thử fallback nếu không tìm thấy trong Global DB
      return this.getNhanVienByMaFallback(maNV);
    }

    if (!isValidSite(siteName)) {
      throw new Error(`Site không hợp lệ: ${siteName}`);
    }

    try {
      const result = await this.executeQuery(
        siteName,
        `SELECT MaNV, HoTen, MaNhom FROM NhanVien WHERE MaNV = ?`,
        [maNV]
      );

      const data = result.recordset || result.rows || [];
      return data[0] || null;
    } catch (error) {
      console.error(`Không thể truy vấn site ${siteName}:`, error);
      // Fallback: tìm kiếm trên tất cả sites
      return this.getNhanVienByMaFallback(maNV);
    }
  }

  // ----------------------
  // Thêm nhân viên mới
  async addNhanVien(maNhom: string, hoTen: string): Promise<INhanVien> {
    // Tra site từ Global DB
    const prefix = maNhom.match(/^P\d+/)?.[0];
    if (!prefix) throw new Error("MaNhom không hợp lệ");

    const { conn: globalConn, type: globalType } = await getConnection(
      "global"
    );

    let siteName: string | null = null;
    if (globalType === "mssql") {
      const res = await globalConn
        .request()
        .input("TenPhong", prefix)
        .query(`SELECT SiteName FROM SiteRouting WHERE TenPhong = @TenPhong`);
      siteName = res.recordset[0]?.SiteName || null;
    } else {
      const res = await globalConn.query(
        `SELECT "SiteName" FROM "SiteRouting" WHERE "TenPhong" = $1`,
        [prefix]
      );
      siteName = res.rows[0]?.SiteName || null;
    }

    if (!siteName) throw new Error("Không tìm thấy site cho nhóm này");
    if (!isValidSite(siteName))
      throw new Error(`Site không hợp lệ: ${siteName}`);

    const { conn, type } = await getConnection(siteName);

    // Lấy số thứ tự tiếp theo
    let nextId = 1;
    const maNVPrefix = `${maNhom}NV`;

    if (type === "mssql") {
      // Tìm số thứ tự tiếp theo chưa được sử dụng
      const res = await conn
        .request()
        .input("Prefix", `${maNVPrefix}%`)
        .query(
          `SELECT MaNV FROM NhanVien WHERE MaNV LIKE @Prefix ORDER BY MaNV`
        );

      const existingIds = res.recordset
        .map((row: any) => parseInt(row.MaNV.replace(maNVPrefix, "")))
        .filter((id: number) => !isNaN(id))
        .sort((a: number, b: number) => a - b);

      // Tìm ID đầu tiên chưa được sử dụng
      for (let i = 0; i < existingIds.length; i++) {
        if (existingIds[i] !== i + 1) {
          nextId = i + 1;
          break;
        }
      }
      if (nextId === 1 && existingIds.length > 0 && existingIds[0] === 1) {
        nextId = existingIds.length + 1;
      }

      const maNV = `${maNVPrefix}${nextId}`;

      await conn
        .request()
        .input("MaNV", maNV)
        .input("HoTen", hoTen)
        .input("MaNhom", maNhom)
        .query(
          `INSERT INTO NhanVien (MaNV, HoTen, MaNhom) VALUES (@MaNV, @HoTen, @MaNhom)`
        );

      return { MaNV: maNV, HoTen: hoTen, MaNhom: maNhom };
    } else {
      // Tìm số thứ tự tiếp theo chưa được sử dụng cho PostgreSQL
      const res = await conn.query(
        `SELECT "MaNV" FROM "NhanVien" WHERE "MaNV" LIKE $1 ORDER BY "MaNV"`,
        [`${maNVPrefix}%`]
      );

      const existingIds = res.rows
        .map((row: any) => parseInt(row.MaNV.replace(maNVPrefix, "")))
        .filter((id: number) => !isNaN(id))
        .sort((a: number, b: number) => a - b);

      // Tìm ID đầu tiên chưa được sử dụng
      for (let i = 0; i < existingIds.length; i++) {
        if (existingIds[i] !== i + 1) {
          nextId = i + 1;
          break;
        }
      }
      if (nextId === 1 && existingIds.length > 0 && existingIds[0] === 1) {
        nextId = existingIds.length + 1;
      }

      const maNV = `${maNVPrefix}${nextId}`;

      await conn.query(
        `INSERT INTO "NhanVien" ("MaNV", "HoTen", "MaNhom") VALUES ($1, $2, $3)`,
        [maNV, hoTen, maNhom]
      );

      return { MaNV: maNV, HoTen: hoTen, MaNhom: maNhom };
    }
  }

  // ----------------------
  // Cập nhật nhân viên
  async updateNhanVien(
    maNV: string,
    hoTen: string,
    maNhomMoi?: string
  ): Promise<void> {
    const nhanvien = await this.getNhanVienByMa(maNV);
    if (!nhanvien) throw new Error("Nhân viên không tồn tại");

    // Tra site từ Global DB dựa trên MaNhom hiện tại
    const maNhomCu = nhanvien.MaNhom;
    const prefix = maNhomCu.match(/^P\d+/)?.[0];
    if (!prefix) throw new Error("MaNhom không hợp lệ");

    const { conn: globalConn, type: globalType } = await getConnection(
      "global"
    );

    let siteName: string | null = null;
    if (globalType === "mssql") {
      const res = await globalConn
        .request()
        .input("TenPhong", prefix)
        .query(`SELECT SiteName FROM SiteRouting WHERE TenPhong = @TenPhong`);
      siteName = res.recordset[0]?.SiteName || null;
    } else {
      const res = await globalConn.query(
        `SELECT "SiteName" FROM "SiteRouting" WHERE "TenPhong" = $1`,
        [prefix]
      );
      siteName = res.rows[0]?.SiteName || null;
    }

    if (!siteName) throw new Error("Không tìm thấy site cho nhóm này");
    if (!isValidSite(siteName))
      throw new Error(`Site không hợp lệ: ${siteName}`);

    const { conn, type } = await getConnection(siteName);

    let maNhomFinal = maNhomCu; // mặc định giữ nguyên nếu không đổi

    if (maNhomMoi) {
      // Lấy danh sách tất cả MaNhom từ bảng NhomNC trong site hiện tại
      let danhSachMaNhom: string[] = [];

      if (type === "mssql") {
        const res = await conn
          .request()
          .query(`SELECT DISTINCT MaNhom FROM NhomNC`);
        danhSachMaNhom = res.recordset.map((r: { MaNhom: string }) => r.MaNhom);
      } else {
        const res = await conn.query(`SELECT DISTINCT "MaNhom" FROM "NhomNC"`);
        danhSachMaNhom = res.rows.map((r: { MaNhom: string }) => r.MaNhom);
      }

      if (!danhSachMaNhom.includes(maNhomMoi)) {
        throw new Error(`MaNhom mới không tồn tại trong site: ${maNhomMoi}`);
      }

      maNhomFinal = maNhomMoi;
    }

    // Cập nhật NhanVien
    if (type === "mssql") {
      await conn
        .request()
        .input("MaNV", maNV)
        .input("HoTen", hoTen)
        .input("MaNhom", maNhomFinal)
        .query(
          `UPDATE NhanVien SET HoTen = @HoTen, MaNhom = @MaNhom WHERE MaNV = @MaNV`
        );
    } else {
      await conn.query(
        `UPDATE "NhanVien" SET "HoTen" = $1, "MaNhom" = $2 WHERE "MaNV" = $3`,
        [hoTen, maNhomFinal, maNV]
      );
    }
  }

  // ----------------------
  // Xóa nhân viên
  async deleteNhanVien(maNV: string): Promise<void> {
    const nhanvien = await this.getNhanVienByMa(maNV);
    if (!nhanvien) throw new Error("Nhân viên không tồn tại");

    // Tra site từ Global DB dựa trên MaNhom
    const prefix = nhanvien.MaNhom.match(/^P\d+/)?.[0];
    if (!prefix) throw new Error("MaNhom không hợp lệ");

    const { conn: globalConn, type: globalType } = await getConnection(
      "global"
    );

    let siteName: string | null = null;
    if (globalType === "mssql") {
      const res = await globalConn
        .request()
        .input("TenPhong", prefix)
        .query(`SELECT SiteName FROM SiteRouting WHERE TenPhong = @TenPhong`);
      siteName = res.recordset[0]?.SiteName || null;
    } else {
      const res = await globalConn.query(
        `SELECT "SiteName" FROM "SiteRouting" WHERE "TenPhong" = $1`,
        [prefix]
      );
      siteName = res.rows[0]?.SiteName || null;
    }

    if (!siteName) throw new Error("Không tìm thấy site cho nhóm này");
    if (!isValidSite(siteName))
      throw new Error(`Site không hợp lệ: ${siteName}`);

    const { conn, type } = await getConnection(siteName);

    if (type === "mssql") {
      await conn
        .request()
        .input("MaNV", maNV)
        .query(`DELETE FROM NhanVien WHERE MaNV = @MaNV`);
    } else {
      await conn.query(`DELETE FROM "NhanVien" WHERE "MaNV" = $1`, [maNV]);
    }
  }
}
