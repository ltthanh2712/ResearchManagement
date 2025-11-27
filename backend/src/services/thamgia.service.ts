import { getConnection } from "../config/db";
import { IThamGia } from "../types";

const allowedSites = ["siteA", "siteB", "siteC", "global"] as const;
type SiteName = (typeof allowedSites)[number];

function isValidSite(site: string): site is SiteName {
  return allowedSites.includes(site as SiteName);
}

export class ThamGiaService {
  // ============================================================
  // GET ALL
  // ============================================================
  async getAllThamGia(): Promise<IThamGia[]> {
    const { conn: globalConn, type: globalType } = await getConnection(
      "global"
    );

    let routingRows: {
      TenPhong: string;
      SiteName: string;
      DatabaseType: "mssql" | "postgres";
    }[] = [];

    // Lấy routing từ Global
    if (globalType === "mssql") {
      const res = await globalConn
        .request()
        .query(`SELECT TenPhong, SiteName, DatabaseType FROM SiteRouting`);
      routingRows = res.recordset;
    } else {
      const res = await globalConn.query(
        `SELECT "TenPhong", "SiteName", "DatabaseType" FROM "SiteRouting"`
      );
      routingRows = res.rows.map((r: any) => ({
        TenPhong: r.TenPhong,
        SiteName: r.SiteName,
        DatabaseType: r.DatabaseType.toLowerCase() as "mssql" | "postgres",
      }));
    }

    let results: IThamGia[] = [];

    // Lấy dữ liệu từ từng site
    for (const route of routingRows) {
      if (!isValidSite(route.SiteName)) {
        console.warn(`Site không hợp lệ: ${route.SiteName}, bỏ qua`);
        continue;
      }

      try {
        const { conn, type } = await getConnection(route.SiteName);

        if (type === "mssql") {
          const res = await conn
            .request()
            .query(`SELECT MaNV, MaDA FROM ThamGia`);
          results.push(...res.recordset);
        } else {
          const res = await conn.query(`SELECT "MaNV", "MaDA" FROM "ThamGia"`);
          results.push(...res.rows);
        }
      } catch (err) {
        console.error(`Không thể truy vấn site ${route.SiteName}:`, err);
      }
    }

    return results;
  }

  // ============================================================
  // GET BY PRIMARY KEY (MaNV + MaDA)
  // ============================================================
  async getThamGia(maNV: string, maDA: string): Promise<IThamGia | null> {
    // Từ MaDA → xác định TenPhong → xác định site
    const phongPrefix = maDA.match(/^P\d+/)?.[0];
    if (!phongPrefix) throw new Error("MaDA không hợp lệ");

    const { conn: globalConn, type: globalType } = await getConnection(
      "global"
    );

    let siteName: string | null = null;

    if (globalType === "mssql") {
      const res = await globalConn
        .request()
        .input("TenPhong", phongPrefix)
        .query(`SELECT SiteName FROM SiteRouting WHERE TenPhong = @TenPhong`);
      siteName = res.recordset[0]?.SiteName || null;
    } else {
      const res = await globalConn.query(
        `SELECT "SiteName" FROM "SiteRouting" WHERE "TenPhong" = $1`,
        [phongPrefix]
      );
      siteName = res.rows[0]?.SiteName || null;
    }

    if (!siteName) throw new Error("Không tìm thấy site cho đề án này");
    if (!isValidSite(siteName))
      throw new Error(`Site không hợp lệ: ${siteName}`);

    const { conn, type } = await getConnection(siteName);

    if (type === "mssql") {
      const res = await conn
        .request()
        .input("MaNV", maNV)
        .input("MaDA", maDA)
        .query(
          `SELECT MaNV, MaDA FROM ThamGia WHERE MaNV=@MaNV AND MaDA=@MaDA`
        );
      return res.recordset[0] || null;
    } else {
      const res = await conn.query(
        `SELECT "MaNV", "MaDA" FROM "ThamGia" WHERE "MaNV"=$1 AND "MaDA"=$2`,
        [maNV, maDA]
      );
      return res.rows[0] || null;
    }
  }

  // ============================================================
  // ADD (Thêm quan hệ MaNV – MaDA) - CROSS-SITE SUPPORT
  // ============================================================
  async addThamGia(maNV: string, maDA: string): Promise<boolean> {
    console.log(`DEBUG: addThamGia called with MaNV: ${maNV}, MaDA: ${maDA}`);

    // Xác định site dựa trên đề án
    const daPhongPrefix = maDA.match(/^(P\d+)/)?.[1];
    if (!daPhongPrefix) {
      throw new Error("MaDA không hợp lệ");
    }

    // Lấy site từ Global DB dựa trên phòng của đề án
    const { conn: globalConn, type: globalType } = await getConnection(
      "global"
    );
    let siteName: string | null = null;

    if (globalType === "mssql") {
      const res = await globalConn
        .request()
        .input("TenPhong", daPhongPrefix)
        .query(`SELECT SiteName FROM SiteRouting WHERE TenPhong = @TenPhong`);
      siteName = res.recordset[0]?.SiteName || null;
    } else {
      const res = await globalConn.query(
        `SELECT "SiteName" FROM "SiteRouting" WHERE "TenPhong" = $1`,
        [daPhongPrefix]
      );
      siteName = res.rows[0]?.SiteName || null;
    }

    if (!siteName || !isValidSite(siteName)) {
      throw new Error(`Không tìm thấy site hợp lệ cho đề án ${maDA}`);
    }

    // Insert vào site của đề án
    try {
      const { conn, type } = await getConnection(siteName);
      console.log(`DEBUG: Inserting to ${siteName} for project ${maDA}`);

      if (type === "mssql") {
        await conn
          .request()
          .input("MaNV", maNV)
          .input("MaDA", maDA)
          .query(`INSERT INTO ThamGia (MaNV, MaDA) VALUES (@MaNV, @MaDA)`);
      } else {
        await conn.query(
          `INSERT INTO "ThamGia" ("MaNV", "MaDA") VALUES ($1, $2)`,
          [maNV, maDA]
        );
      }

      console.log(
        `DEBUG: Successfully added ${maNV} to ${maDA} at ${siteName}`
      );
      return true;
    } catch (err: any) {
      console.error("DEBUG: Error:", err);
      throw new Error(`Lỗi thêm quan hệ tham gia: ${err.message}`);
    }
  }

  // ============================================================
  // DELETE
  // ============================================================
  async deleteThamGia(maNV: string, maDA: string): Promise<boolean> {
    const record = await this.getThamGia(maNV, maDA);
    if (!record) throw new Error("Không tìm thấy bản ghi để xóa");

    const phongPrefix = maDA.match(/^P\d+/)?.[0];
    if (!phongPrefix) throw new Error("MaDA không hợp lệ");

    const { conn: globalConn, type: globalType } = await getConnection(
      "global"
    );

    let siteName: string | null = null;

    if (globalType === "mssql") {
      const res = await globalConn
        .request()
        .input("TenPhong", phongPrefix)
        .query(`SELECT SiteName FROM SiteRouting WHERE TenPhong = @TenPhong`);
      siteName = res.recordset[0]?.SiteName || null;
    } else {
      const res = await globalConn.query(
        `SELECT "SiteName" FROM "SiteRouting" WHERE "TenPhong" = $1`,
        [phongPrefix]
      );
      siteName = res.rows[0]?.SiteName || null;
    }

    if (!siteName) throw new Error("Không tìm thấy site cho đề án này");
    if (!isValidSite(siteName))
      throw new Error(`Site không hợp lệ: ${siteName}`);

    const { conn, type } = await getConnection(siteName);

    try {
      if (type === "mssql") {
        await conn
          .request()
          .input("MaNV", maNV)
          .input("MaDA", maDA)
          .query(`DELETE FROM ThamGia WHERE MaNV = @MaNV AND MaDA = @MaDA`);
      } else {
        await conn.query(
          `DELETE FROM "ThamGia" WHERE "MaNV" = $1 AND "MaDA" = $2`,
          [maNV, maDA]
        );
      }

      console.log(
        `Đã xóa tham gia NV=${maNV}, DA=${maDA} tại site ${siteName}`
      );
      return true;
    } catch (err: any) {
      console.error("Lỗi xóa ThamGia:", err);
      throw new Error(`Lỗi xóa quan hệ tham gia: ${err.message}`);
    }
  }

  // ============================================================
  // GET BY MaNV
  // ============================================================
  async getThamGiaByNV(maNV: string): Promise<IThamGia[]> {
    const results: IThamGia[] = [];

    const { conn: globalConn, type: globalType } = await getConnection(
      "global"
    );
    let routingRows: {
      TenPhong: string;
      SiteName: string;
      DatabaseType: "mssql" | "postgres";
    }[] = [];

    if (globalType === "mssql") {
      const res = await globalConn
        .request()
        .query(`SELECT TenPhong, SiteName, DatabaseType FROM SiteRouting`);
      routingRows = res.recordset;
    } else {
      const res = await globalConn.query(
        `SELECT "TenPhong","SiteName","DatabaseType" FROM "SiteRouting"`
      );
      routingRows = res.rows.map((r: any) => ({
        TenPhong: r.TenPhong,
        SiteName: r.SiteName,
        DatabaseType: r.DatabaseType.toLowerCase() as "mssql" | "postgres",
      }));
    }

    for (const route of routingRows) {
      if (!isValidSite(route.SiteName)) continue;

      try {
        const { conn, type } = await getConnection(route.SiteName);

        if (type === "mssql") {
          const res = await conn
            .request()
            .input("MaNV", maNV)
            .query(`SELECT MaNV, MaDA FROM ThamGia WHERE MaNV = @MaNV`);
          results.push(...res.recordset);
        } else {
          const res = await conn.query(
            `SELECT "MaNV", "MaDA" FROM "ThamGia" WHERE "MaNV" = $1`,
            [maNV]
          );
          results.push(...res.rows);
        }
      } catch (err) {
        console.error(`Không thể truy vấn site ${route.SiteName}:`, err);
      }
    }

    return results;
  }

  // ============================================================
  // UPDATE
  // ============================================================
  async updateThamGia(
    oldMaNV: string,
    oldMaDA: string,
    newMaNV: string,
    newMaDA: string
  ): Promise<boolean> {
    // Xóa bản ghi cũ
    await this.deleteThamGia(oldMaNV, oldMaDA);

    // Thêm bản ghi mới
    await this.addThamGia(newMaNV, newMaDA);

    console.log(
      `Đã cập nhật tham gia từ ${oldMaNV}-${oldMaDA} thành ${newMaNV}-${newMaDA}`
    );
    return true;
  }

  // ============================================================
  // UPDATE MaNV in ThamGia (direct update without delete/insert)
  // ============================================================
  async updateMaNVInThamGia(
    oldMaNV: string,
    maDA: string,
    newMaNV: string
  ): Promise<boolean> {
    console.log(
      `DEBUG: Updating MaNV from ${oldMaNV} to ${newMaNV} for project ${maDA}`
    );

    // Xác định site dựa trên đề án
    const daPhongPrefix = maDA.match(/^(P\d+)/)?.[1];
    if (!daPhongPrefix) {
      throw new Error("MaDA không hợp lệ");
    }

    // Lấy site từ Global DB dựa trên phòng của đề án
    const { conn: globalConn, type: globalType } = await getConnection(
      "global"
    );
    let siteName: string | null = null;

    if (globalType === "mssql") {
      const res = await globalConn
        .request()
        .input("TenPhong", daPhongPrefix)
        .query(`SELECT SiteName FROM SiteRouting WHERE TenPhong = @TenPhong`);
      siteName = res.recordset[0]?.SiteName || null;
    } else {
      const res = await globalConn.query(
        `SELECT "SiteName" FROM "SiteRouting" WHERE "TenPhong" = $1`,
        [daPhongPrefix]
      );
      siteName = res.rows[0]?.SiteName || null;
    }

    if (!siteName || !isValidSite(siteName)) {
      throw new Error(`Không tìm thấy site hợp lệ cho đề án ${maDA}`);
    }

    // Kiểm tra xem record với oldMaNV có tồn tại không
    const existingRecord = await this.getThamGia(oldMaNV, maDA);
    if (!existingRecord) {
      throw new Error(`Không tìm thấy quan hệ tham gia ${oldMaNV}-${maDA}`);
    }

    // Update MaNV trong site của đề án
    try {
      const { conn, type } = await getConnection(siteName);
      console.log(`DEBUG: Updating MaNV in ${siteName} for project ${maDA}`);

      if (type === "mssql") {
        await conn
          .request()
          .input("OldMaNV", oldMaNV)
          .input("NewMaNV", newMaNV)
          .input("MaDA", maDA)
          .query(
            `UPDATE ThamGia SET MaNV = @NewMaNV WHERE MaNV = @OldMaNV AND MaDA = @MaDA`
          );
      } else {
        await conn.query(
          `UPDATE "ThamGia" SET "MaNV" = $1 WHERE "MaNV" = $2 AND "MaDA" = $3`,
          [newMaNV, oldMaNV, maDA]
        );
      }

      console.log(
        `DEBUG: Successfully updated MaNV from ${oldMaNV} to ${newMaNV} for project ${maDA}`
      );
      return true;
    } catch (err: any) {
      console.error("DEBUG: Error updating MaNV:", err);
      throw new Error(`Lỗi cập nhật MaNV trong tham gia: ${err.message}`);
    }
  }

  // ============================================================
  // GET BY MaDA
  // ============================================================
  async getThamGiaByDA(maDA: string): Promise<IThamGia[]> {
    const phongPrefix = maDA.match(/^P\d+/)?.[0];
    if (!phongPrefix) throw new Error("MaDA không hợp lệ");

    const { conn: globalConn, type: globalType } = await getConnection(
      "global"
    );

    let siteName: string | null = null;

    if (globalType === "mssql") {
      const res = await globalConn
        .request()
        .input("TenPhong", phongPrefix)
        .query(`SELECT SiteName FROM SiteRouting WHERE TenPhong = @TenPhong`);
      siteName = res.recordset[0]?.SiteName || null;
    } else {
      const res = await globalConn.query(
        `SELECT "SiteName" FROM "SiteRouting" WHERE "TenPhong" = $1`,
        [phongPrefix]
      );
      siteName = res.rows[0]?.SiteName || null;
    }

    if (!siteName) throw new Error("Không tìm thấy site cho đề án này");
    if (!isValidSite(siteName))
      throw new Error(`Site không hợp lệ: ${siteName}`);

    const { conn, type } = await getConnection(siteName);

    if (type === "mssql") {
      const res = await conn
        .request()
        .input("MaDA", maDA)
        .query(`SELECT MaNV, MaDA FROM ThamGia WHERE MaDA = @MaDA`);
      return res.recordset;
    } else {
      const res = await conn.query(
        `SELECT "MaNV", "MaDA" FROM "ThamGia" WHERE "MaDA" = $1`,
        [maDA]
      );
      return res.rows;
    }
  }

  // ============================================================
  // MOVE THAMGIA TO NEW SITE (with MaNV migration)
  // ============================================================
  async moveThamGiaToSite(
    maNV: string,
    maDA: string,
    targetSite: SiteName
  ): Promise<boolean> {
    console.log(`DEBUG: Moving ThamGia ${maNV}-${maDA} to site ${targetSite}`);

    // 1. Lấy thông tin ThamGia hiện tại
    const currentThamGia = await this.getThamGia(maNV, maDA);
    if (!currentThamGia) {
      throw new Error(`Quan hệ tham gia ${maNV}-${maDA} không tồn tại`);
    }

    // 2. Lấy thông tin NhanVien từ site hiện tại
    const nvPrefix = maNV.match(/^(P\d+)/)?.[1];
    if (!nvPrefix) throw new Error("MaNV không hợp lệ");

    const { conn: globalConn, type: globalType } = await getConnection(
      "global"
    );
    let currentNVSite: string | null = null;

    if (globalType === "mssql") {
      const res = await globalConn
        .request()
        .input("TenPhong", nvPrefix)
        .query(`SELECT SiteName FROM SiteRouting WHERE TenPhong = @TenPhong`);
      currentNVSite = res.recordset[0]?.SiteName || null;
    } else {
      const res = await globalConn.query(
        `SELECT "SiteName" FROM "SiteRouting" WHERE "TenPhong" = $1`,
        [nvPrefix]
      );
      currentNVSite = res.rows[0]?.SiteName || null;
    }

    if (!currentNVSite || !isValidSite(currentNVSite)) {
      throw new Error(`Không tìm thấy site hợp lệ cho nhân viên ${maNV}`);
    }

    // 3. Lấy dữ liệu NhanVien từ site hiện tại
    const { conn: currentNVConn, type: currentNVType } = await getConnection(
      currentNVSite
    );
    let nhanVienData: any = null;

    if (currentNVType === "mssql") {
      const res = await currentNVConn
        .request()
        .input("MaNV", maNV)
        .query(`SELECT MaNV, TenNV, MaNhom FROM NhanVien WHERE MaNV = @MaNV`);
      nhanVienData = res.recordset[0];
    } else {
      const res = await currentNVConn.query(
        `SELECT "MaNV", "TenNV", "MaNhom" FROM "NhanVien" WHERE "MaNV" = $1`,
        [maNV]
      );
      nhanVienData = res.rows[0];
    }

    if (!nhanVienData) {
      throw new Error(`Không tìm thấy nhân viên ${maNV}`);
    }

    // 4. Kiểm tra xem NhanVien đã tồn tại ở target site chưa
    const { conn: targetConn, type: targetType } = await getConnection(
      targetSite
    );
    let nvExists = false;

    if (targetType === "mssql") {
      const res = await targetConn
        .request()
        .input("MaNV", maNV)
        .query(`SELECT COUNT(*) as count FROM NhanVien WHERE MaNV = @MaNV`);
      nvExists = res.recordset[0].count > 0;
    } else {
      const res = await targetConn.query(
        `SELECT COUNT(*) as count FROM "NhanVien" WHERE "MaNV" = $1`,
        [maNV]
      );
      nvExists = parseInt(res.rows[0].count) > 0;
    }

    // 5. Nếu NhanVien chưa tồn tại ở target site, copy sang
    if (!nvExists) {
      console.log(`DEBUG: Copying NhanVien ${maNV} to ${targetSite}`);

      if (targetType === "mssql") {
        await targetConn
          .request()
          .input("MaNV", nhanVienData.MaNV)
          .input("TenNV", nhanVienData.TenNV)
          .input("MaNhom", nhanVienData.MaNhom)
          .query(
            `INSERT INTO NhanVien (MaNV, TenNV, MaNhom) VALUES (@MaNV, @TenNV, @MaNhom)`
          );
      } else {
        await targetConn.query(
          `INSERT INTO "NhanVien" ("MaNV", "TenNV", "MaNhom") VALUES ($1, $2, $3)`,
          [nhanVienData.MaNV, nhanVienData.TenNV, nhanVienData.MaNhom]
        );
      }
      console.log(
        `DEBUG: Successfully copied NhanVien ${maNV} to ${targetSite}`
      );
    }

    // 6. Thêm ThamGia vào target site
    if (targetType === "mssql") {
      await targetConn
        .request()
        .input("MaNV", maNV)
        .input("MaDA", maDA)
        .query(`INSERT INTO ThamGia (MaNV, MaDA) VALUES (@MaNV, @MaDA)`);
    } else {
      await targetConn.query(
        `INSERT INTO "ThamGia" ("MaNV", "MaDA") VALUES ($1, $2)`,
        [maNV, maDA]
      );
    }

    // 7. Xóa ThamGia từ site cũ
    await this.deleteThamGia(maNV, maDA);

    console.log(
      `DEBUG: Successfully moved ThamGia ${maNV}-${maDA} to ${targetSite}`
    );
    return true;
  }

  // ============================================================
  // MOVE ALL THAMGIA OF A PROJECT TO NEW SITE
  // ============================================================
  async moveThamGiaOfProjectToSite(
    maDA: string,
    targetSite: SiteName
  ): Promise<boolean> {
    console.log(
      `DEBUG: Moving all ThamGia of project ${maDA} to site ${targetSite}`
    );

    // Lấy tất cả ThamGia của đề án
    const thamGiaList = await this.getThamGiaByDA(maDA);

    if (thamGiaList.length === 0) {
      console.log(`DEBUG: No ThamGia found for project ${maDA}`);
      return true;
    }

    // Di chuyển từng ThamGia
    for (const thamGia of thamGiaList) {
      await this.moveThamGiaToSite(thamGia.MaNV, thamGia.MaDA, targetSite);
    }

    console.log(
      `DEBUG: Successfully moved ${thamGiaList.length} ThamGia records for project ${maDA} to ${targetSite}`
    );
    return true;
  }
}
