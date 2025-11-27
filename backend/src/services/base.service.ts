// src/services/base.service.ts
import { faultTolerance } from "../config/fault-tolerance";

export interface QueryResult {
  recordset?: any[];
  rowsAffected?: number[];
  rows?: any[];
}

export class BaseService {
  /**
   * Thực thi query với fault tolerance
   */
  protected async executeQuery(
    preferredSite: string,
    query: string,
    params: any[] = []
  ): Promise<QueryResult> {
    try {
      const connection = await faultTolerance.getAvailableConnection(
        preferredSite
      );

      if (connection.type === "mssql") {
        const request = connection.conn.request();

        // Bind parameters
        params.forEach((param, index) => {
          request.input(`param${index}`, param);
        });

        // Replace ? with @param0, @param1, etc.
        let parameterizedQuery = query;
        params.forEach((_, index) => {
          parameterizedQuery = parameterizedQuery.replace(
            "?",
            `@param${index}`
          );
        });

        const result = await request.query(parameterizedQuery);
        return {
          recordset: result.recordset,
          rowsAffected: result.rowsAffected,
        };
      } else {
        // PostgreSQL
        const result = await connection.conn.query(query, params);
        return { rows: result.rows, rowsAffected: [result.rowCount] };
      }
    } catch (error) {
      console.error(`Query failed on ${preferredSite}:`, error);
      throw error;
    }
  }

  /**
   * Thực thi query trên tất cả các site khả dụng (để backup/sync data)
   */
  protected async executeOnAllAvailableSites(
    query: string,
    params: any[] = [],
    excludeSites: string[] = []
  ): Promise<{ site: string; result: QueryResult | Error }[]> {
    const availableSites = faultTolerance
      .getAvailableSites()
      .filter((site) => site !== "global" && !excludeSites.includes(site));

    const results = [];

    for (const site of availableSites) {
      try {
        const result = await this.executeQuery(site, query, params);
        results.push({ site, result });
        console.log(`✅ Query executed successfully on ${site}`);
      } catch (error) {
        results.push({ site, result: error as Error });
        console.log(`❌ Query failed on ${site}:`, (error as Error).message);
      }
    }

    return results;
  }

  /**
   * Tìm kiếm dữ liệu trên nhiều site (khi không biết data ở đâu)
   */
  protected async findDataAcrossSites<T>(
    query: string,
    params: any[] = []
  ): Promise<{ site: string; data: T[] }[]> {
    const availableSites = faultTolerance
      .getAvailableSites()
      .filter((site) => site !== "global");

    const results = [];

    for (const site of availableSites) {
      try {
        const result = await this.executeQuery(site, query, params);
        const data = result.recordset || result.rows || [];

        if (data.length > 0) {
          results.push({ site, data });
        }
      } catch (error) {
        console.log(`Search failed on ${site}:`, (error as Error).message);
      }
    }

    return results;
  }

  /**
   * Backup dữ liệu từ một site sang các site khác
   */
  protected async backupDataToOtherSites(
    sourceSite: string,
    tableName: string,
    data: any[]
  ): Promise<void> {
    if (!data.length) return;

    const availableSites = faultTolerance
      .getAvailableSites()
      .filter((site) => site !== "global" && site !== sourceSite);

    for (const targetSite of availableSites) {
      try {
        // Tạo backup table nếu chưa có
        const createBackupTable = `
          CREATE TABLE IF NOT EXISTS ${tableName}_backup AS 
          SELECT * FROM ${tableName} WHERE 1=0
        `;

        await this.executeQuery(targetSite, createBackupTable);

        // Insert backup data
        const columns = Object.keys(data[0]).join(", ");
        const placeholders = Object.keys(data[0])
          .map((_, i) => "?")
          .join(", ");

        for (const row of data) {
          const insertQuery = `
            INSERT INTO ${tableName}_backup (${columns}) 
            VALUES (${placeholders})
          `;
          const values = Object.values(row);

          await this.executeQuery(targetSite, insertQuery, values);
        }

        console.log(`✅ Backup completed: ${tableName} -> ${targetSite}`);
      } catch (error) {
        console.log(
          `❌ Backup failed: ${tableName} -> ${targetSite}:`,
          (error as Error).message
        );
      }
    }
  }

  /**
   * Lấy thông tin trạng thái các site
   */
  public getSiteHealthStatus() {
    return faultTolerance.getSiteStatuses();
  }
}
