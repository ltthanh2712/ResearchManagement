import { getConnection } from "../config/db";
import { IDeAn } from "../types";

const allowedSites = ["siteA", "siteB", "siteC", "global"] as const;
type SiteName = (typeof allowedSites)[number];

function isValidSite(site: string): site is SiteName {
  return allowedSites.includes(site as SiteName);
}

export class DeAnService {
  // ----------------------
  // Lấy tất cả đề án từ tất cả site dựa vào Global DB
  async getAllDeAn(): Promise<IDeAn[]> {
    const { conn: globalConn, type: globalType } = await getConnection(
      "global"
    );

    // Lấy danh sách routing
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
        `SELECT "TenPhong", "SiteName", "DatabaseType" FROM "SiteRouting"`
      );
      routingRows = res.rows.map((r: any) => ({
        TenPhong: r.TenPhong,
        SiteName: r.SiteName,
        DatabaseType: r.DatabaseType.toLowerCase() as "mssql" | "postgres",
      }));
    }

    // Lấy dữ liệu từ từng site hợp lệ
    let results: IDeAn[] = [];

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
            .query(`SELECT MaDA, TenDA, MaNhom FROM DeAn`);
          results.push(...res.recordset);
        } else {
          const res = await conn.query(
            `SELECT "MaDA", "TenDA", "MaNhom" FROM "DeAn"`
          );
          results.push(...res.rows);
        }
      } catch (err) {
        console.error(
          `Không thể kết nối hoặc truy vấn site ${route.SiteName}:`,
          err
        );
        continue;
      }
    }

    return results;
  }

  // ----------------------
  // Lấy đề án theo MaDA
  async getDeAnByMa(maDA: string): Promise<IDeAn | null> {
    const prefix = maDA.match(/^P\d+/)?.[0];
    if (!prefix) throw new Error("MaDA không hợp lệ");

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

    if (!siteName) throw new Error("Không tìm thấy site cho đề án này");
    if (!isValidSite(siteName))
      throw new Error(`Site không hợp lệ: ${siteName}`);

    const { conn, type } = await getConnection(siteName);

    if (type === "mssql") {
      const res = await conn
        .request()
        .input("MaDA", maDA)
        .query(`SELECT MaDA, TenDA, MaNhom FROM DeAn WHERE MaDA=@MaDA`);
      return res.recordset[0] || null;
    } else {
      const res = await conn.query(
        `SELECT "MaDA", "TenDA", "MaNhom" FROM "DeAn" WHERE "MaDA"=$1`,
        [maDA]
      );
      return res.rows[0] || null;
    }
  }
  // ----------------------
  // Lấy đề án chưa có nhân viên tham gia
  async getEmptyDeAn(): Promise<IDeAn[]> {
    const { conn: globalConn, type: globalType } = await getConnection(
      "global"
    );

    // Lấy danh sách routing
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
        `SELECT "TenPhong", "SiteName", "DatabaseType" FROM "SiteRouting"`
      );
      routingRows = res.rows.map((r: any) => ({
        TenPhong: r.TenPhong,
        SiteName: r.SiteName,
        DatabaseType: r.DatabaseType.toLowerCase() as "mssql" | "postgres",
      }));
    }

    let results: IDeAn[] = [];

    for (const route of routingRows) {
      if (!isValidSite(route.SiteName)) {
        console.warn(`Site không hợp lệ: ${route.SiteName}, bỏ qua`);
        continue;
      }

      try {
        const { conn, type } = await getConnection(route.SiteName);

        if (type === "mssql") {
          const res = await conn.request().query(`
            SELECT d.MaDA, d.TenDA, d.MaNhom
            FROM DeAn d
            LEFT JOIN ThamGia t ON d.MaDA = t.MaDA
            WHERE t.MaDA IS NULL
          `);
          results.push(...res.recordset);
        } else {
          const res = await conn.query(`
          SELECT d."MaDA", d."TenDA", d."MaNhom"
          FROM "DeAn" d
          LEFT JOIN "ThamGia" t ON d."MaDA" = t."MaDA"
          WHERE t."MaDA" IS NULL
        `);
          results.push(...res.rows);
        }
      } catch (err) {
        console.error(
          `Không thể kết nối hoặc truy vấn site ${route.SiteName}:`,
          err
        );
        continue;
      }
    }

    return results;
  }

  // ----------------------
  // Thêm đề án mới
  async addDeAn(maNhom: string, tenDA: string): Promise<IDeAn> {
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
        .query(`SELECT SiteName FROM SiteRouting WHERE TenPhong=@TenPhong`);
      siteName = res.recordset[0]?.SiteName || null;
    } else {
      const res = await globalConn.query(
        `SELECT "SiteName" FROM "SiteRouting" WHERE "TenPhong"=$1`,
        [prefix]
      );
      siteName = res.rows[0]?.SiteName || null;
    }

    if (!siteName) throw new Error("Không tìm thấy site cho nhóm này");
    if (!isValidSite(siteName))
      throw new Error(`Site không hợp lệ: ${siteName}`);

    const { conn, type } = await getConnection(siteName);

    let nextId = 1;
    const maDAPrefix = `${maNhom}DA`;

    if (type === "mssql") {
      // Tìm số thứ tự tiếp theo chưa được sử dụng
      const res = await conn
        .request()
        .input("Prefix", `${maDAPrefix}%`)
        .query(`SELECT MaDA FROM DeAn WHERE MaDA LIKE @Prefix ORDER BY MaDA`);

      const existingIds = res.recordset
        .map((row: any) => parseInt(row.MaDA.replace(maDAPrefix, "")))
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

      const maDA = `${maDAPrefix}${nextId}`;
      await conn
        .request()
        .input("MaDA", maDA)
        .input("TenDA", tenDA)
        .input("MaNhom", maNhom)
        .query(
          `INSERT INTO DeAn (MaDA, TenDA, MaNhom) VALUES (@MaDA, @TenDA, @MaNhom)`
        );

      return { MaDA: maDA, TenDA: tenDA, MaNhom: maNhom };
    } else {
      // Tìm số thứ tự tiếp theo chưa được sử dụng cho PostgreSQL
      const res = await conn.query(
        `SELECT "MaDA" FROM "DeAn" WHERE "MaDA" LIKE $1 ORDER BY "MaDA"`,
        [`${maDAPrefix}%`]
      );

      const existingIds = res.rows
        .map((row: any) => parseInt(row.MaDA.replace(maDAPrefix, "")))
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

      const maDA = `${maDAPrefix}${nextId}`;

      await conn.query(
        `INSERT INTO "DeAn" ("MaDA", "TenDA", "MaNhom") VALUES ($1, $2, $3)`,
        [maDA, tenDA, maNhom]
      );

      return { MaDA: maDA, TenDA: tenDA, MaNhom: maNhom };
    }
  }

  // ----------------------
  // Cập nhật đề án
  async updateDeAn(
    maDA: string,
    tenDA: string,
    maNhomMoi?: string
  ): Promise<void> {
    const maNhomCu = maDA.substring(0, maDA.indexOf("DA"));
    if (!maNhomCu) throw new Error("Không tách được MaNhom từ MaDA");

    // Lấy prefix phòng từ MaNhom cũ để xác định site
    const prefix = maNhomCu.match(/^P\d+/)?.[0];
    if (!prefix) throw new Error("Không tách được mã phòng từ MaNhom");

    const { conn: globalConn, type: globalType } = await getConnection(
      "global"
    );
    let siteName: string | null = null;

    if (globalType === "mssql") {
      const res = await globalConn
        .request()
        .input("TenPhong", prefix)
        .query(`SELECT SiteName FROM SiteRouting WHERE TenPhong=@TenPhong`);
      siteName = res.recordset[0]?.SiteName || null;
    } else {
      const res = await globalConn.query(
        `SELECT "SiteName" FROM "SiteRouting" WHERE "TenPhong"=$1`,
        [prefix]
      );
      siteName = res.rows[0]?.SiteName || null;
    }

    if (!siteName) throw new Error("Không tìm thấy site cho đề án này");
    if (!isValidSite(siteName))
      throw new Error(`Site không hợp lệ: ${siteName}`);

    const { conn, type } = await getConnection(siteName);

    let maNhomFinal = maNhomCu; // mặc định giữ nguyên nếu không đổi

    if (maNhomMoi) {
      // Lấy danh sách tất cả MaNhom từ bảng NhomNC trong site hiện tại
      let danhSachMaNhom: string[] = [];

      if (type === "mssql") {
        const res = await conn.query(`SELECT DISTINCT MaNhom FROM NhomNC`);
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

    // Cập nhật DeAn
    if (type === "mssql") {
      await conn
        .request()
        .input("MaDA", maDA)
        .input("TenDA", tenDA)
        .input("MaNhom", maNhomFinal)
        .query(`UPDATE DeAn SET TenDA=@TenDA, MaNhom=@MaNhom WHERE MaDA=@MaDA`);
    } else {
      await conn.query(
        `UPDATE "DeAn" SET "TenDA"=$1, "MaNhom"=$2 WHERE "MaDA"=$3`,
        [tenDA, maNhomFinal, maDA]
      );
    }
  }

  // ----------------------
  // Xóa đề án
  async deleteDeAn(maDA: string): Promise<void> {
    const deAn = await this.getDeAnByMa(maDA);
    if (!deAn) throw new Error(`Đề án ${maDA} không tồn tại`);

    const maNhom = deAn.MaNhom;
    const prefix = maNhom.match(/^P\d+/)?.[0];
    if (!prefix) throw new Error("Không tách được mã phòng từ MaNhom");

    const { conn: globalConn, type: globalType } = await getConnection(
      "global"
    );
    let siteName: string | null = null;

    if (globalType === "mssql") {
      const res = await globalConn
        .request()
        .input("TenPhong", prefix)
        .query(`SELECT SiteName FROM SiteRouting WHERE TenPhong=@TenPhong`);
      siteName = res.recordset[0]?.SiteName || null;
    } else {
      const res = await globalConn.query(
        `SELECT "SiteName" FROM "SiteRouting" WHERE "TenPhong"=$1`,
        [prefix]
      );
      siteName = res.rows[0]?.SiteName || null;
    }

    if (!siteName) throw new Error("Không tìm thấy site của đề án này");
    if (!isValidSite(siteName))
      throw new Error(`Site không hợp lệ: ${siteName}`);

    const { conn, type } = await getConnection(siteName);

    if (type === "mssql") {
      await conn
        .request()
        .input("MaDA", maDA)
        .query(`DELETE FROM DeAn WHERE MaDA=@MaDA`);
    } else {
      await conn.query(`DELETE FROM "DeAn" WHERE "MaDA"=$1`, [maDA]);
    }
  }
}
