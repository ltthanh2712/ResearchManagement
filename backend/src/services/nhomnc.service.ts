import { getConnection } from "../config/db";
import { INhomNC } from "../types";

const allowedSites = ["siteA", "siteB", "siteC", "global"] as const;
type SiteName = (typeof allowedSites)[number];

function isValidSite(site: string): site is SiteName {
  return allowedSites.includes(site as SiteName);
}

export class NhomNCService {
  private idMappings: {
    nhanVien: Record<string, string>;
    deAn: Record<string, string>;
  } = {
    nhanVien: {},
    deAn: {},
  };

  // ----------------------
  // Lấy danh sách phòng từ SiteRouting
  async getPhongList(): Promise<{ TenPhong: string; SiteName: string }[]> {
    const { conn: globalConn, type: globalType } = await getConnection(
      "global"
    );

    if (globalType === "mssql") {
      const res = await globalConn
        .request()
        .query(
          `SELECT DISTINCT TenPhong, SiteName FROM SiteRouting ORDER BY TenPhong`
        );
      return res.recordset;
    } else {
      const res = await globalConn.query(
        `SELECT DISTINCT "TenPhong", "SiteName" FROM "SiteRouting" ORDER BY "TenPhong"`
      );
      return res.rows.map((row: any) => ({
        TenPhong: row.TenPhong,
        SiteName: row.SiteName,
      }));
    }
  }

  // ----------------------
  // Lấy site dựa vào TenPhong từ Global DB
  private async getSiteByPhong(tenPhong: string): Promise<SiteName | null> {
    const { conn: globalConn, type: globalType } = await getConnection(
      "global"
    );

    if (globalType === "mssql") {
      const res = await globalConn
        .request()
        .input("TenPhong", tenPhong)
        .query(`SELECT SiteName FROM SiteRouting WHERE TenPhong=@TenPhong`);
      const site = res.recordset[0]?.SiteName;
      return isValidSite(site) ? site : null;
    } else {
      const res = await globalConn.query(
        `SELECT "SiteName" FROM "SiteRouting" WHERE "TenPhong"=$1`,
        [tenPhong]
      );
      const site = res.rows[0]?.SiteName;
      return isValidSite(site) ? site : null;
    }
  }

  // ----------------------
  // Tạo ID duy nhất cho đề án tại site mới
  private async generateUniqueDeAnId(
    conn: any,
    type: "mssql" | "postgres",
    maNhom: string,
    suffix: string = "DA"
  ): Promise<string> {
    const baseId = `${maNhom}${suffix}`;
    let counter = 1;

    while (true) {
      const candidateId = `${baseId}${counter}`;
      let exists = false;

      if (type === "mssql") {
        const res = await conn
          .request()
          .input("MaDA", candidateId)
          .query(`SELECT MaDA FROM DeAn WHERE MaDA=@MaDA`);
        exists = res.recordset.length > 0;
      } else {
        const res = await conn.query(
          `SELECT "MaDA" FROM "DeAn" WHERE "MaDA"=$1`,
          [candidateId]
        );
        exists = res.rows.length > 0;
      }

      if (!exists) {
        return candidateId;
      }
      counter++;
    }
  }

  // ----------------------
  // Tạo ID duy nhất cho nhân viên tại site mới
  private async generateUniqueNhanVienId(
    conn: any,
    type: "mssql" | "postgres",
    maNhom: string,
    suffix: string = "NV"
  ): Promise<string> {
    const baseId = `${maNhom}${suffix}`;
    let counter = 1;

    while (true) {
      const candidateId = `${baseId}${counter}`;
      let exists = false;

      if (type === "mssql") {
        const res = await conn
          .request()
          .input("MaNV", candidateId)
          .query(`SELECT MaNV FROM NhanVien WHERE MaNV=@MaNV`);
        exists = res.recordset.length > 0;
      } else {
        const res = await conn.query(
          `SELECT "MaNV" FROM "NhanVien" WHERE "MaNV"=$1`,
          [candidateId]
        );
        exists = res.rows.length > 0;
      }

      if (!exists) {
        return candidateId;
      }
      counter++;
    }
  }

  // ----------------------
  // Di chuyển dữ liệu từ site cũ sang site mới (theo MaNhom cụ thể)
  private async moveTableData(
    oldConn: any,
    newConn: any,
    oldType: "mssql" | "postgres",
    newType: "mssql" | "postgres",
    table: string,
    oldMaNhom: string,
    newMaNhom: string
  ) {
    let rows: any[] = [];

    // Lấy dữ liệu từ site cũ
    if (table === "ThamGia") {
      // ThamGia cần lấy từ tất cả sites vì có cross-site participation
      rows = await this.getAllThamGiaRelatedToGroup(oldMaNhom);
    } else {
      // Các bảng khác có cột MaNhom
      if (oldType === "mssql") {
        const res = await oldConn
          .request()
          .input("MaNhom", oldMaNhom)
          .query(`SELECT * FROM ${table} WHERE MaNhom=@MaNhom`);
        rows = res.recordset;
      } else {
        const res = await oldConn.query(
          `SELECT * FROM "${table}" WHERE "MaNhom"=$1`,
          [oldMaNhom]
        );
        rows = res.rows;
      }
    }

    console.log(`  📋 Tìm thấy ${rows.length} bản ghi trong bảng ${table}`);

    if (rows.length === 0) {
      console.log(`  ⚠️ Không có dữ liệu để di chuyển trong bảng ${table}`);
      return;
    }

    // Chèn dữ liệu vào site mới với xử lý đặc biệt
    for (const row of rows) {
      const newRow = { ...row };

      // Cập nhật MaNhom cho tất cả các bảng
      newRow.MaNhom = newMaNhom;

      // Tất cả database đều dùng MaDA, không cần mapping

      // Xử lý đặc biệt cho từng bảng
      if (table === "NhanVien") {
        // Tạo MaNV mới để tránh trùng lặp
        console.log(
          `    🔍 Debug NhanVien: MaNV=${row.MaNV}, oldMaNhom=${oldMaNhom}, newMaNhom=${newMaNhom}`
        );
        if (row.MaNV) {
          const newMaNV = await this.generateUniqueNhanVienId(
            newConn,
            newType,
            newMaNhom
          );
          newRow.MaNV = newMaNV;
          console.log(`    👤 NhanVien: ${row.MaNV} → ${newRow.MaNV}`);

          // Lưu mapping để cập nhật ThamGia sau
          if (!this.idMappings) this.idMappings = { nhanVien: {}, deAn: {} };
          this.idMappings.nhanVien[row.MaNV] = newMaNV;
        }
      } else if (table === "DeAn") {
        // DeAn: Tất cả database đều dùng MaDA
        const MaDAField = row.MaDA;
        console.log(
          `    🔍 Debug DeAn: MaDA=${row.MaDA}, oldMaNhom=${oldMaNhom}, newMaNhom=${newMaNhom}`
        );

        if (MaDAField) {
          const newMaDA = await this.generateUniqueDeAnId(
            newConn,
            newType,
            newMaNhom
          );

          // Cập nhật MaDA cho cả MSSQL và PostgreSQL
          newRow.MaDA = newMaDA;

          console.log(`    📊 DeAn: ${MaDAField} → ${newMaDA}`);

          // Lưu mapping để cập nhật ThamGia sau
          if (!this.idMappings) this.idMappings = { nhanVien: {}, deAn: {} };
          this.idMappings.deAn[MaDAField] = newMaDA;
        }
      } else if (table === "ThamGia") {
        // ThamGia: cập nhật MaNV và MaDA dựa trên mapping (bao gồm cross-group)
        let hasMapping = false;

        // Cập nhật MaNV nếu có mapping (nhân viên thuộc nhóm)
        if (row.MaNV && this.idMappings.nhanVien[row.MaNV]) {
          newRow.MaNV = this.idMappings.nhanVien[row.MaNV];
          hasMapping = true;
          console.log(`    👤 ThamGia MaNV: ${row.MaNV} → ${newRow.MaNV}`);
        } else if (row.MaNV) {
          // Giữ nguyên MaNV cross-group
          newRow.MaNV = row.MaNV;
          console.log(`    🔗 Giữ nguyên cross-group MaNV: ${row.MaNV}`);
        }

        // Cập nhật MaDA nếu có mapping (đề án thuộc nhóm)
        if (row.MaDA && this.idMappings.deAn[row.MaDA]) {
          newRow.MaDA = this.idMappings.deAn[row.MaDA];
          hasMapping = true;
          console.log(`    📊 ThamGia MaDA: ${row.MaDA} → ${newRow.MaDA}`);
        } else if (row.MaDA) {
          // Giữ nguyên MaDA cross-group
          newRow.MaDA = row.MaDA;
          console.log(`    🔗 Giữ nguyên cross-group MaDA: ${row.MaDA}`);
        }

        // Chỉ skip nếu không có mapping nào (tức là hoàn toàn không liên quan đến nhóm)
        if (!hasMapping) {
          console.log(
            `    ⏭️ Bỏ qua ThamGia không liên quan: MaNV=${row.MaNV}, MaDA=${row.MaDA}`
          );
          continue;
        }

        console.log(
          `    🔗 ThamGia: MaNV ${row.MaNV} → ${newRow.MaNV}, MaDA ${row.MaDA} → ${newRow.MaDA}`
        );

        // Xóa MaNhom khỏi newRow vì ThamGia không có cột này
        delete newRow.MaNhom;
      } else if (table === "NhomNC") {
        // Cập nhật TenPhong cho nhóm
        const newTenPhong = newMaNhom.match(/^(.*)N\d+$/)?.[1];
        if (newTenPhong) {
          newRow.TenPhong = newTenPhong;
          console.log(`    🏢 NhomNC: TenPhong → ${newTenPhong}`);
        }
      }

      // Tạo câu lệnh INSERT
      const cols = Object.keys(newRow);
      const colNames = cols.join(",");
      const colNamesQuoted = cols.map((c) => `"${c}"`).join(",");

      try {
        if (newType === "mssql") {
          const request = newConn.request();
          cols.forEach((col, index) => {
            request.input(`param${index}`, newRow[col]);
          });
          const placeholders = cols
            .map((_, index) => `@param${index}`)
            .join(",");
          await request.query(
            `INSERT INTO ${table} (${colNames}) VALUES (${placeholders})`
          );
        } else {
          const placeholders = cols
            .map((_, index) => `$${index + 1}`)
            .join(",");
          const values = cols.map((col) => newRow[col]);
          await newConn.query(
            `INSERT INTO "${table}" (${colNamesQuoted}) VALUES (${placeholders})`,
            values
          );
        }
      } catch (error) {
        console.error(`❌ Lỗi khi chèn dữ liệu vào ${table}:`, error);
        throw error;
      }
    }

    console.log(`  ✅ Đã di chuyển ${rows.length} bản ghi từ bảng ${table}`);
  }

  // ----------------------
  // Di chuyển toàn bộ dữ liệu của một phòng từ site cũ sang site mới
  private async moveDepartmentData(
    oldConn: any,
    newConn: any,
    oldType: "mssql" | "postgres",
    newType: "mssql" | "postgres",
    table: string,
    oldTenPhong: string,
    newTenPhong: string
  ) {
    let rows: any[] = [];

    // Lấy tất cả dữ liệu có MaNhom bắt đầu với TenPhong cũ
    if (oldType === "mssql") {
      const res = await oldConn
        .request()
        .query(`SELECT * FROM ${table} WHERE MaNhom LIKE '${oldTenPhong}%'`);
      rows = res.recordset;
    } else {
      const res = await oldConn.query(
        `SELECT * FROM "${table}" WHERE "MaNhom" LIKE $1`,
        [`${oldTenPhong}%`]
      );
      rows = res.rows;
    }

    // Chèn dữ liệu vào site mới với MaNhom được cập nhật
    for (const row of rows) {
      // Thay đổi MaNhom từ TenPhong cũ sang TenPhong mới
      let newMaNhom = row.MaNhom;
      if (row.MaNhom && row.MaNhom.startsWith(oldTenPhong)) {
        newMaNhom = row.MaNhom.replace(oldTenPhong, newTenPhong);
      }

      const newRow = { ...row, MaNhom: newMaNhom };
      const cols = Object.keys(newRow).join(",");
      const vals = Object.values(newRow)
        .map((v) =>
          v === null || v === undefined
            ? "NULL"
            : `'${v.toString().replace(/'/g, "''")}'`
        )
        .join(",");

      if (newType === "mssql") {
        await newConn
          .request()
          .query(`INSERT INTO ${table} (${cols}) VALUES (${vals})`);
      } else {
        await newConn.query(
          `INSERT INTO "${table}" (${cols}) VALUES (${vals})`
        );
      }
    }
  }

  // ----------------------
  // Lấy tất cả nhóm từ tất cả site
  async getAllNhomNC(): Promise<INhomNC[]> {
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

    const results: INhomNC[] = [];
    for (const route of routingRows) {
      if (!isValidSite(route.SiteName)) continue;
      try {
        const { conn, type } = await getConnection(route.SiteName);
        if (type === "mssql") {
          const res = await conn
            .request()
            .query(`SELECT MaNhom, TenPhong, TenNhom FROM NhomNC`);
          results.push(...res.recordset);
        } else {
          const res = await conn.query(
            `SELECT "MaNhom","TenPhong","TenNhom" FROM "NhomNC"`
          );
          results.push(...res.rows);
        }
      } catch (err) {
        console.error(`Không thể truy vấn site ${route.SiteName}:`, err);
      }
    }

    return results;
  }

  // ----------------------
  // Lấy nhóm theo MaNhom
  async getNhomNCByMa(maNhom: string): Promise<INhomNC | null> {
    // Lấy TenPhong từ MaNhom
    const match = maNhom.match(/^(.*)N\d+$/);
    if (!match) throw new Error("MaNhom không hợp lệ");

    const tenPhong = match[1];

    const siteName = await this.getSiteByPhong(tenPhong);
    if (!siteName) throw new Error("Site không hợp lệ");

    const { conn, type } = await getConnection(siteName);
    if (type === "mssql") {
      const res = await conn
        .request()
        .input("MaNhom", maNhom)
        .query(
          `SELECT MaNhom, TenPhong, TenNhom FROM NhomNC WHERE MaNhom=@MaNhom`
        );
      return res.recordset[0] || null;
    } else {
      const res = await conn.query(
        `SELECT "MaNhom","TenPhong","TenNhom" FROM "NhomNC" WHERE "MaNhom"=$1`,
        [maNhom]
      );
      return res.rows[0] || null;
    }
  }

  // ----------------------
  // Thêm nhóm mới
  async addNhomNC(tenPhong: string, tenNhom: string): Promise<INhomNC> {
    const siteName = await this.getSiteByPhong(tenPhong);
    if (!siteName) throw new Error(`Site không hợp lệ`);

    const { conn, type } = await getConnection(siteName);

    const maNhomBase = `${tenPhong}N`;
    let nextId = 1;

    if (type === "mssql") {
      // Tìm số thứ tự tiếp theo chưa được sử dụng
      const res = await conn
        .request()
        .input("Prefix", `${maNhomBase}%`)
        .query(
          `SELECT MaNhom FROM NhomNC WHERE MaNhom LIKE @Prefix ORDER BY MaNhom`
        );

      const existingIds = res.recordset
        .map((row: any) => parseInt(row.MaNhom.replace(maNhomBase, "")))
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
    } else {
      // Tìm số thứ tự tiếp theo chưa được sử dụng cho PostgreSQL
      const res = await conn.query(
        `SELECT "MaNhom" FROM "NhomNC" WHERE "MaNhom" LIKE $1 ORDER BY "MaNhom"`,
        [`${maNhomBase}%`]
      );

      const existingIds = res.rows
        .map((row: any) => parseInt(row.MaNhom.replace(maNhomBase, "")))
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
    }

    const maNhomFull = `${maNhomBase}${nextId}`;

    if (type === "mssql") {
      await conn
        .request()
        .input("MaNhom", maNhomFull)
        .input("TenPhong", tenPhong)
        .input("TenNhom", tenNhom)
        .query(
          `INSERT INTO NhomNC(MaNhom,TenPhong,TenNhom) VALUES(@MaNhom,@TenPhong,@TenNhom)`
        );
    } else {
      await conn.query(
        `INSERT INTO "NhomNC"("MaNhom","TenPhong","TenNhom") VALUES($1,$2,$3)`,
        [maNhomFull, tenPhong, tenNhom]
      );
    }

    return { MaNhom: maNhomFull, TenPhong: tenPhong, TenNhom: tenNhom };
  }

  // ----------------------
  // Cập nhật nhóm, di chuyển dữ liệu nếu đổi TenPhong
  async updateNhomNC(
    maNhom: string,
    tenNhom: string,
    newTenPhong?: string
  ): Promise<string> {
    const nhom = await this.getNhomNCByMa(maNhom);
    if (!nhom) throw new Error("Nhóm không tồn tại");

    const oldTenPhong = nhom.TenPhong;
    const oldSite = await this.getSiteByPhong(oldTenPhong);
    if (!oldSite) throw new Error("Site cũ không hợp lệ");

    const { conn: oldConn, type: oldType } = await getConnection(oldSite);

    // Không đổi phòng → chỉ update tên
    if (!newTenPhong || newTenPhong === oldTenPhong) {
      if (oldType === "mssql") {
        await oldConn
          .request()
          .input("MaNhom", maNhom)
          .input("TenNhom", tenNhom)
          .query(`UPDATE NhomNC SET TenNhom=@TenNhom WHERE MaNhom=@MaNhom`);
      } else {
        await oldConn.query(
          `UPDATE "NhomNC" SET "TenNhom"=$1 WHERE "MaNhom"=$2`,
          [tenNhom, maNhom]
        );
      }
      return maNhom;
    }

    // Đổi phòng → lấy site mới và tạo MaNhom mới
    const newSite = await this.getSiteByPhong(newTenPhong);
    if (!newSite) throw new Error("Site mới không hợp lệ");

    const { conn: newConn, type: newType } = await getConnection(newSite);

    // Luôn tìm số thứ tự tiếp theo chưa được sử dụng tại site mới
    const maNhomBase = `${newTenPhong}N`;
    let nextId = 1;

    if (newType === "mssql") {
      const res = await newConn
        .request()
        .input("Prefix", `${maNhomBase}%`)
        .query(
          `SELECT MaNhom FROM NhomNC WHERE MaNhom LIKE @Prefix ORDER BY MaNhom`
        );

      const existingIds = res.recordset
        .map((row: any) => parseInt(row.MaNhom.replace(maNhomBase, "")))
        .filter((id: number) => !isNaN(id))
        .sort((a: number, b: number) => a - b);

      for (let i = 0; i < existingIds.length; i++) {
        if (existingIds[i] !== i + 1) {
          nextId = i + 1;
          break;
        }
      }
      if (nextId === 1 && existingIds.length > 0 && existingIds[0] === 1) {
        nextId = existingIds.length + 1;
      }
    } else {
      const res = await newConn.query(
        `SELECT "MaNhom" FROM "NhomNC" WHERE "MaNhom" LIKE $1 ORDER BY "MaNhom"`,
        [`${maNhomBase}%`]
      );

      const existingIds = res.rows
        .map((row: any) => parseInt(row.MaNhom.replace(maNhomBase, "")))
        .filter((id: number) => !isNaN(id))
        .sort((a: number, b: number) => a - b);

      for (let i = 0; i < existingIds.length; i++) {
        if (existingIds[i] !== i + 1) {
          nextId = i + 1;
          break;
        }
      }
      if (nextId === 1 && existingIds.length > 0 && existingIds[0] === 1) {
        nextId = existingIds.length + 1;
      }
    }

    const newMaNhom = `${maNhomBase}${nextId}`;
    console.log(`✨ Sử dụng MaNhom mới: ${newMaNhom}`);
    console.log(
      `🔄 Di chuyển nhóm ${maNhom} từ ${oldSite} (${oldTenPhong}) sang ${newSite} (${newTenPhong}) → ${newMaNhom}`
    );

    // Reset ID mappings trước khi di chuyển
    this.idMappings = { nhanVien: {}, deAn: {} };

    // Di chuyển dữ liệu theo thứ tự: NhomNC → NhanVien → DeAn → ThamGia
    const tables = ["NhomNC", "NhanVien", "DeAn", "ThamGia"];
    for (const table of tables) {
      console.log(`📦 Di chuyển bảng ${table}: ${maNhom} → ${newMaNhom}`);
      await this.moveTableData(
        oldConn,
        newConn,
        oldType,
        newType,
        table,
        maNhom, // MaNhom cũ
        newMaNhom // MaNhom mới
      );
    }

    // Cập nhật TenNhom và TenPhong trong bản ghi nhóm mới
    console.log(`📝 Cập nhật thông tin nhóm ${newMaNhom}`);
    if (newType === "mssql") {
      await newConn
        .request()
        .input("MaNhom", newMaNhom)
        .input("TenNhom", tenNhom)
        .input("TenPhong", newTenPhong)
        .query(
          `UPDATE NhomNC SET TenNhom=@TenNhom, TenPhong=@TenPhong WHERE MaNhom=@MaNhom`
        );
    } else {
      await newConn.query(
        `UPDATE "NhomNC" SET "TenNhom"=$1, "TenPhong"=$2 WHERE "MaNhom"=$3`,
        [tenNhom, newTenPhong, newMaNhom]
      );
    }

    // Xóa dữ liệu cũ (theo thứ tự ngược lại để tránh foreign key constraint)
    console.log(`🗑️ Xóa dữ liệu cũ của nhóm ${maNhom} tại ${oldSite}`);
    for (const table of ["ThamGia", "DeAn", "NhanVien", "NhomNC"]) {
      if (table === "ThamGia") {
        // ThamGia cần xóa theo MaNV và MaDA
        if (oldType === "mssql") {
          await oldConn.request().input("MaNhom", maNhom).query(`
              DELETE FROM ThamGia 
              WHERE MaNV IN (SELECT MaNV FROM NhanVien WHERE MaNhom=@MaNhom)
              OR MaDA IN (SELECT MaDA FROM DeAn WHERE MaNhom=@MaNhom)
            `);
        } else {
          await oldConn.query(
            `
            DELETE FROM "ThamGia" 
            WHERE "MaNV" IN (SELECT "MaNV" FROM "NhanVien" WHERE "MaNhom"=$1)
            OR "MaDA" IN (SELECT "MaDA" FROM "DeAn" WHERE "MaNhom"=$1)
          `,
            [maNhom]
          );
        }
      } else {
        // Các bảng khác có cột MaNhom
        if (oldType === "mssql") {
          await oldConn
            .request()
            .input("MaNhom", maNhom)
            .query(`DELETE FROM ${table} WHERE MaNhom=@MaNhom`);
        } else {
          await oldConn.query(`DELETE FROM "${table}" WHERE "MaNhom"=$1`, [
            maNhom,
          ]);
        }
      }
      console.log(`✅ Đã xóa ${table} với MaNhom=${maNhom}`);
    }

    console.log(
      `✨ Hoàn thành di chuyển nhóm: ${maNhom} (${oldTenPhong}) → ${newMaNhom} (${newTenPhong})`
    );
    return newMaNhom;
  }

  // ----------------------
  // Xóa nhóm
  async deleteNhomNC(maNhom: string): Promise<void> {
    const nhom = await this.getNhomNCByMa(maNhom);
    if (!nhom) throw new Error("Nhóm không tồn tại");

    const siteName = await this.getSiteByPhong(nhom.TenPhong);
    if (!siteName) throw new Error("Site không hợp lệ");

    const { conn, type } = await getConnection(siteName);

    if (type === "mssql") {
      await conn
        .request()
        .input("MaNhom", maNhom)
        .query(`DELETE FROM NhomNC WHERE MaNhom=@MaNhom`);
    } else {
      await conn.query(`DELETE FROM "NhomNC" WHERE "MaNhom"=$1`, [maNhom]);
    }

    console.log(`Đã xóa nhóm ${maNhom} tại site ${siteName}`);
  }

  // Helper method: Lấy tất cả ThamGia liên quan đến một nhóm từ tất cả sites
  private async getAllThamGiaRelatedToGroup(maNhom: string): Promise<any[]> {
    const { conn: globalConn, type: globalType } = await getConnection(
      "global"
    );

    // Lấy danh sách tất cả sites
    let routingRows: any[] = [];
    if (globalType === "mssql") {
      const res = await globalConn
        .request()
        .query(`SELECT SiteName FROM SiteRouting`);
      routingRows = res.recordset;
    } else {
      const res = await globalConn.query(
        `SELECT "SiteName" FROM "SiteRouting"`
      );
      routingRows = res.rows;
    }

    let allThamGiaRows: any[] = [];

    // Query từng site để lấy ThamGia liên quan
    for (const route of routingRows) {
      if (!isValidSite(route.SiteName)) continue;

      try {
        const { conn, type } = await getConnection(route.SiteName);

        if (type === "mssql") {
          const res = await conn.request().input("MaNhom", maNhom).query(`
            SELECT t.* FROM ThamGia t 
            WHERE t.MaNV IN (SELECT MaNV FROM NhanVien WHERE MaNhom=@MaNhom)
            OR t.MaDA IN (SELECT MaDA FROM DeAn WHERE MaNhom=@MaNhom)
          `);
          allThamGiaRows.push(...res.recordset);
        } else {
          const res = await conn.query(
            `
            SELECT t.* FROM "ThamGia" t 
            WHERE t."MaNV" IN (SELECT "MaNV" FROM "NhanVien" WHERE "MaNhom"=$1)
            OR t."MaDA" IN (SELECT "MaDA" FROM "DeAn" WHERE "MaNhom"=$1)
          `,
            [maNhom]
          );
          allThamGiaRows.push(...res.rows);
        }
      } catch (err) {
        console.error(
          `Không thể query ThamGia từ site ${route.SiteName}:`,
          err
        );
      }
    }

    console.log(
      `  📋 Tìm thấy ${allThamGiaRows.length} bản ghi ThamGia liên quan đến nhóm ${maNhom} từ tất cả sites`
    );
    return allThamGiaRows;
  }
}
