// src/config/fault-tolerance.ts
import { getConnection, siteConfig } from "./db";

interface SiteStatus {
  site: string;
  isAvailable: boolean;
  lastChecked: Date;
  error?: string;
}

class FaultToleranceManager {
  private siteStatuses: Map<string, SiteStatus> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 30000; // 30 giây

  constructor() {
    this.initializeSiteStatuses();
    this.startHealthCheck();
  }

  private initializeSiteStatuses() {
    const sites = ["siteA", "siteB", "siteC", "global"];
    sites.forEach((site) => {
      this.siteStatuses.set(site, {
        site,
        isAvailable: true,
        lastChecked: new Date(),
      });
    });
  }

  private startHealthCheck() {
    this.healthCheckInterval = setInterval(() => {
      this.checkAllSites();
    }, this.CHECK_INTERVAL);

    // Kiểm tra ngay lập tức
    this.checkAllSites();
  }

  private async checkAllSites() {
    const sites = ["siteA", "siteB", "siteC", "global"] as const;

    for (const site of sites) {
      try {
        const connection = await getConnection(site);

        // Test query để kiểm tra kết nối
        if (connection.type === "mssql") {
          await connection.conn.query("SELECT 1");
        } else {
          await connection.conn.query("SELECT 1");
        }

        this.updateSiteStatus(site, true);
        console.log(`✅ Site ${site} is healthy`);
      } catch (error) {
        this.updateSiteStatus(site, false, error as Error);
        console.log(`❌ Site ${site} is down:`, (error as Error).message);
      }
    }
  }

  private updateSiteStatus(site: string, isAvailable: boolean, error?: Error) {
    this.siteStatuses.set(site, {
      site,
      isAvailable,
      lastChecked: new Date(),
      error: error?.message,
    });
  }

  public isSiteAvailable(site: string): boolean {
    const status = this.siteStatuses.get(site);
    return status?.isAvailable || false;
  }

  public getAvailableSites(): string[] {
    return Array.from(this.siteStatuses.entries())
      .filter(([_, status]) => status.isAvailable)
      .map(([site, _]) => site);
  }

  public getAlternateSite(preferredSite: string): string | null {
    if (this.isSiteAvailable(preferredSite)) {
      return preferredSite;
    }

    // Logic failover: tìm site thay thế
    const availableSites = this.getAvailableSites().filter(
      (s) => s !== "global"
    );

    if (availableSites.length > 0) {
      // Ưu tiên theo thứ tự: siteA -> siteB -> siteC
      const priority = ["siteA", "siteB", "siteC"];
      for (const site of priority) {
        if (availableSites.includes(site)) {
          return site;
        }
      }
      return availableSites[0];
    }

    return null;
  }

  public getSiteStatuses(): SiteStatus[] {
    return Array.from(this.siteStatuses.values());
  }

  public async getAvailableConnection(preferredSite: string) {
    const alternateSite = this.getAlternateSite(preferredSite);

    if (!alternateSite) {
      throw new Error("No available database sites found");
    }

    if (alternateSite !== preferredSite) {
      console.log(
        `⚠️  Failover: Using ${alternateSite} instead of ${preferredSite}`
      );
    }

    return getConnection(alternateSite as any);
  }

  public stop() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

export const faultTolerance = new FaultToleranceManager();

// Graceful shutdown
process.on("SIGTERM", () => {
  faultTolerance.stop();
});

process.on("SIGINT", () => {
  faultTolerance.stop();
});
