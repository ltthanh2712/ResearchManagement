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
    // Từ MaNV → xác định TenPhong → xác định site
    const phongPrefix = maNV.match(/^P\d+/)?.[0];
    if (!phongPrefix) throw new Error("MaNV không hợp lệ");

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

    if (!siteName) throw new Error("Không tìm thấy site cho nhân viên này");
    if (!isValidSite(siteName))
      throw new Error(`Site không hợp lệ: ${siteName}`);

    const { conn, type } = await getConnection(siteName);

    if (type === "mssql") {
      const res = await conn
        .request()
        .input("MaNV", maNV)
        .input("MaDA", maDA)
        .query(
          `SELECT MaNV, MaDA FROM ThamGia WHERE MaNV = @MaNV AND MaDA = @MaDA`
        );
      return res.recordset[0] || null;
    } else {
      const res = await conn.query(
        `SELECT "MaNV", "MaDA" FROM "ThamGia" WHERE "MaNV" = $1 AND "MaDA" = $2`,
        [maNV, maDA]
      );
      return res.rows[0] || null;
    }
  }

  // ============================================================
  private async ensureEmployeeExists(
    maNV: string,
    targetSiteName: SiteName,
    targetType: "mssql" | "postgres"
  ): Promise<void> {
    const { conn: targetConn } = await getConnection(targetSiteName);

    // Kiểm tra nhân viên đã tồn tại ở site đích chưa
    let exists = false;
    if (targetType === "mssql") {
      const res = await targetConn
        .request()
        .input("MaNV", maNV)
        .query(`SELECT MaNV FROM NhanVien WHERE MaNV = @MaNV`);
      exists = res.recordset.length > 0;
    } else {
      const res = await targetConn.query(
        `SELECT "MaNV" FROM "NhanVien" WHERE "MaNV" = $1`,
        [maNV]
      );
      exists = res.rows.length > 0;
    }

    if (exists) {
      console.log(`✓ Nhân viên ${maNV} đã tồn tại ở ${targetSiteName}`);
      return;
    }

    // Tìm nhân viên ở site gốc
    const nvPhongPrefix = maNV.match(/^(P\d+)/)?.[1];
    if (!nvPhongPrefix) throw new Error("MaNV không hợp lệ");

    const { conn: globalConn, type: globalType } = await getConnection(
      "global"
    );
    let sourceSiteName: string | null = null;

    if (globalType === "mssql") {
      const res = await globalConn
        .request()
        .input("TenPhong", nvPhongPrefix)
        .query(`SELECT SiteName FROM SiteRouting WHERE TenPhong = @TenPhong`);
      sourceSiteName = res.recordset[0]?.SiteName || null;
    } else {
      const res = await globalConn.query(
        `SELECT "SiteName" FROM "SiteRouting" WHERE "TenPhong" = $1`,
        [nvPhongPrefix]
      );
      sourceSiteName = res.rows[0]?.SiteName || null;
    }

    if (!sourceSiteName || !isValidSite(sourceSiteName)) {
      throw new Error(`Không tìm thấy site gốc cho nhân viên ${maNV}`);
    }

    // Lấy thông tin nhân viên từ site gốc
    const { conn: sourceConn, type: sourceType } = await getConnection(
      sourceSiteName
    );
    let employee: any = null;

    if (sourceType === "mssql") {
      const res = await sourceConn
        .request()
        .input("MaNV", maNV)
        .query(`SELECT * FROM NhanVien WHERE MaNV = @MaNV`);
      employee = res.recordset[0];
    } else {
      const res = await sourceConn.query(
        `SELECT * FROM "NhanVien" WHERE "MaNV" = $1`,
        [maNV]
      );
      employee = res.rows[0];
    }

    if (!employee) {
      throw new Error(
        `Không tìm thấy nhân viên ${maNV} ở site gốc ${sourceSiteName}`
      );
    }

    // Đồng bộ nhóm trước (nếu chưa tồn tại)
    await this.ensureGroupExists(
      employee.MaNhom,
      targetSiteName,
      targetType,
      sourceConn,
      sourceType
    );

    // Copy nhân viên sang site đích
    console.log(
      `🔄 Đồng bộ nhân viên ${maNV} từ ${sourceSiteName} sang ${targetSiteName}`
    );

    if (targetType === "mssql") {
      await targetConn
        .request()
        .input("MaNV", employee.MaNV)
        .input("HoTen", employee.HoTen)
        .input("MaNhom", employee.MaNhom)
        .query(
          `INSERT INTO NhanVien (MaNV, HoTen, MaNhom) VALUES (@MaNV, @HoTen, @MaNhom)`
        );
    } else {
      await targetConn.query(
        `INSERT INTO "NhanVien" ("MaNV", "HoTen", "MaNhom") VALUES ($1, $2, $3)`,
        [employee.MaNV, employee.HoTen, employee.MaNhom]
      );
    }

    console.log(`✅ Đã đồng bộ nhân viên ${maNV} sang ${targetSiteName}`);
  }

  // ============================================================
  // HELPER: Đảm bảo nhóm tồn tại ở site đích
  // ============================================================
  private async ensureGroupExists(
    maNhom: string,
    targetSiteName: SiteName,
    targetType: "mssql" | "postgres",
    sourceConn: any,
    sourceType: "mssql" | "postgres"
  ): Promise<void> {
    const { conn: targetConn } = await getConnection(targetSiteName);

    // Kiểm tra nhóm đã tồn tại ở site đích chưa
    let exists = false;
    if (targetType === "mssql") {
      const res = await targetConn
        .request()
        .input("MaNhom", maNhom)
        .query(`SELECT MaNhom FROM NhomNC WHERE MaNhom = @MaNhom`);
      exists = res.recordset.length > 0;
    } else {
      const res = await targetConn.query(
        `SELECT "MaNhom" FROM "NhomNC" WHERE "MaNhom" = $1`,
        [maNhom]
      );
      exists = res.rows.length > 0;
    }

    if (exists) {
      console.log(`✓ Nhóm ${maNhom} đã tồn tại ở ${targetSiteName}`);
      return;
    }

    // Lấy thông tin nhóm từ site gốc
    let group: any = null;
    if (sourceType === "mssql") {
      const res = await sourceConn
        .request()
        .input("MaNhom", maNhom)
        .query(`SELECT * FROM NhomNC WHERE MaNhom = @MaNhom`);
      group = res.recordset[0];
    } else {
      const res = await sourceConn.query(
        `SELECT * FROM "NhomNC" WHERE "MaNhom" = $1`,
        [maNhom]
      );
      group = res.rows[0];
    }

    if (!group) {
      throw new Error(`Không tìm thấy nhóm ${maNhom} ở site gốc`);
    }

    // Copy nhóm sang site đích
    console.log(`🔄 Đồng bộ nhóm ${maNhom} sang ${targetSiteName}`);

    if (targetType === "mssql") {
      await targetConn
        .request()
        .input("MaNhom", group.MaNhom)
        .input("TenPhong", group.TenPhong)
        .input("TenNhom", group.TenNhom)
        .query(
          `INSERT INTO NhomNC (MaNhom, TenPhong, TenNhom) VALUES (@MaNhom, @TenPhong, @TenNhom)`
        );
    } else {
      await targetConn.query(
        `INSERT INTO "NhomNC" ("MaNhom", "TenPhong", "TenNhom") VALUES ($1, $2, $3)`,
        [group.MaNhom, group.TenPhong, group.TenNhom]
      );
    }

    console.log(`✅ Đã đồng bộ nhóm ${maNhom} sang ${targetSiteName}`);
  }

  // ============================================================
  // ADD (Thêm quan hệ MaNV – MaDA)
  // ============================================================
  async addThamGia(maNV: string, maDA: string): Promise<boolean> {
    // Xác định phòng của nhân viên và đề án (cho log)
    const nvPhongPrefix = maNV.match(/^(P\d+)/)?.[1];
    const daPhongPrefix = maDA.match(/^(P\d+)/)?.[1];

    if (!nvPhongPrefix || !daPhongPrefix) {
      throw new Error("MaNV hoặc MaDA không hợp lệ");
    }

    // THAY ĐỔI: Cho phép nhân viên từ phòng khác tham gia đề án
    // Xác định site dựa trên đề án (data sẽ được lưu ở site của đề án)
    const phongPrefix = daPhongPrefix;

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

    if (!siteName) throw new Error(`Không tìm thấy site cho đề án ${maDA}`);
    if (!isValidSite(siteName))
      throw new Error(`Site không hợp lệ: ${siteName}`);

    const { conn, type } = await getConnection(siteName);

    // INSERT (chỉ lưu references, không cần foreign key constraints)
    try {
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
        `Đã thêm tham gia NV=${maNV} (phòng ${nvPhongPrefix}) vào DA=${maDA} (phòng ${daPhongPrefix}) tại site ${siteName}`
      );
      return true;
    } catch (err: any) {
      console.error("Lỗi thêm ThamGia:", err);

      // Kiểm tra lỗi duplicate key
      if (
        err.code === 2627 ||
        err.code === "23505" ||
        err.message?.includes("duplicate") ||
        err.message?.includes("UNIQUE")
      ) {
        throw new Error(
          `Quan hệ tham gia giữa nhân viên ${maNV} và đề án ${maDA} đã tồn tại`
        );
      }

      // Kiểm tra lỗi foreign key
      if (err.code === 547 || err.code === "23503") {
        throw new Error(
          `Nhân viên ${maNV} hoặc đề án ${maDA} không tồn tại trong hệ thống`
        );
      }

      throw new Error(`Lỗi thêm quan hệ tham gia: ${err.message}`);
    }
  }

  // ============================================================
  // UPDATE (Sửa MaDA của 1 nhân viên)
  // ============================================================
  async updateThamGia(
    oldMaNV: string,
    oldMaDA: string,
    newMaNV: string,
    newMaDA: string
  ): Promise<boolean> {
    // Kiểm tra ràng buộc: nhân viên mới và đề án mới phải cùng phòng
    const nvPhongPrefix = newMaNV.match(/^(P\d+)/)?.[1];
    const daPhongPrefix = newMaDA.match(/^(P\d+)/)?.[1];

    if (!nvPhongPrefix || !daPhongPrefix) {
      throw new Error("MaNV hoặc MaDA mới không hợp lệ");
    }

    if (nvPhongPrefix !== daPhongPrefix) {
      throw new Error(
        `Nhân viên ${newMaNV} (phòng ${nvPhongPrefix}) không thể tham gia đề án ${newMaDA} (phòng ${daPhongPrefix}). Chỉ có thể tham gia đề án cùng phòng.`
      );
    }

    // Lấy đúng bản ghi
    const oldRecord = await this.getThamGia(oldMaNV, oldMaDA);
    if (!oldRecord) throw new Error("Không tìm thấy bản ghi cần sửa");

    // Lấy site từ MaNV
    const phongPrefix = oldMaNV.match(/^P\d+/)?.[0];
    if (!phongPrefix) throw new Error("MaNV không hợp lệ");

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

    if (!siteName) throw new Error("Không tìm thấy site cho nhân viên này");
    if (!isValidSite(siteName))
      throw new Error(`Site không hợp lệ: ${siteName}`);

    const { conn, type } = await getConnection(siteName);

    try {
      if (type === "mssql") {
        await conn
          .request()
          .input("OldMaNV", oldMaNV)
          .input("OldMaDA", oldMaDA)
          .input("NewMaNV", newMaNV)
          .input("NewMaDA", newMaDA)
          .query(
            `UPDATE ThamGia
             SET MaNV = @NewMaNV, MaDA = @NewMaDA
             WHERE MaNV = @OldMaNV AND MaDA = @OldMaDA`
          );
      } else {
        await conn.query(
          `UPDATE "ThamGia"
           SET "MaNV" = $1, "MaDA" = $2
           WHERE "MaNV" = $3 AND "MaDA" = $4`,
          [newMaNV, newMaDA, oldMaNV, oldMaDA]
        );
      }

      console.log(`Đã cập nhật tham gia tại site ${siteName}`);
      return true;
    } catch (err) {
      console.error("Lỗi update ThamGia:", err);
      return false;
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

    if (!siteName) throw new Error("Không tìm thấy site cho nhân viên này");
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
    } catch (err) {
      console.error("Lỗi xóa ThamGia:", err);
      return false;
    }
  }
}
