import * as sql from "mssql";
import { Pool as PgPool } from "pg";

interface MSSQLConfigType {
  type: "mssql";
  config: {
    user: string;
    password?: string;
    server: string;
    port?: number;
    database: string;
    options?: {
      encrypt?: boolean;
      trustServerCertificate?: boolean;
    };
  };
}

interface PostgresConfig {
  type: "postgres";
  config: {
    user: string;
    password?: string;
    host: string;
    port: number;
    database: string;
  };
}

type SiteConfigType = MSSQLConfigType | PostgresConfig;

export const siteConfig: Record<
  "siteA" | "siteB" | "siteC" | "global",
  SiteConfigType
> = {
  siteA: {
    type: "mssql",
    config: {
      user: "sa",
      password: process.env.MSSQL_SA_PASSWORD,
      server: "mssql_site_a",
      port: 1433,
      database: "ResearchManagement",
      options: { encrypt: true, trustServerCertificate: true },
    },
  },
  siteB: {
    type: "mssql",
    config: {
      user: "sa",
      password: process.env.MSSQL_SA_PASSWORD,
      server: "mssql_site_b",
      port: 1433,
      database: "ResearchManagement",
      options: { encrypt: true, trustServerCertificate: true },
    },
  },
  siteC: {
    type: "postgres",
    config: {
      user: "postgres",
      password: process.env.POSTGRES_PASSWORD,
      host: "postgres_site_c",
      port: 5432,
      database: "ResearchManagement",
    },
  },
  global: {
    type: "mssql",
    config: {
      user: "sa",
      password: process.env.MSSQL_SA_PASSWORD,
      server: "mssql_global",
      port: 1433,
      database: "ResearchManagement",
      options: { encrypt: true, trustServerCertificate: true },
    },
  },
};

const pools: Record<string, any> = {};
export const getConnection = async (
  site: "siteA" | "siteB" | "siteC" | "global"
) => {
  if (pools[site]) return pools[site];

  const siteInfo = siteConfig[site];
  if (siteInfo.type === "mssql") {
    const pool = new sql.ConnectionPool(siteInfo.config);
    await pool.connect();
    pools[site] = { type: "mssql", conn: pool };
  } else {
    const pool = new PgPool(siteInfo.config);
    pools[site] = { type: "postgres", conn: pool };
  }
  return pools[site];
};
