import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

interface SiteStatus {
  site: string;
  status: "UP" | "DOWN";
  lastChecked: string;
  error?: string;
}

interface HealthData {
  status: string;
  message: string;
  timestamp: string;
  sites: {
    total: number;
    available: number;
    unavailable: number;
  };
  faultTolerant: boolean;
  siteStatuses?: SiteStatus[];
}

const SystemHealth: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<any>(null);

  const fetchHealth = async () => {
    try {
      const response = await axios.get("http://localhost:8080/health/system");
      setHealthData(response.data);
    } catch (error) {
      console.error("Error fetching health:", error);
      toast.error("Không thể lấy thông tin trạng thái hệ thống");
    } finally {
      setLoading(false);
    }
  };

  const fetchSiteDetails = async () => {
    try {
      const response = await axios.get("http://localhost:8080/health/sites");
      if (healthData) {
        setHealthData({
          ...healthData,
          siteStatuses: response.data.sites,
        });
      }
    } catch (error) {
      console.error("Error fetching site details:", error);
    }
  };

  const testFaultTolerance = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8080/health/test");
      setTestResults(response.data);
      toast.success("Test fault tolerance hoàn thành!");
    } catch (error) {
      console.error("Error testing fault tolerance:", error);
      toast.error("Test fault tolerance thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "HEALTHY":
        return "text-green-600";
      case "DEGRADED":
        return "text-yellow-600";
      case "CRITICAL":
        return "text-red-600";
      case "UP":
        return "text-green-600";
      case "DOWN":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "HEALTHY":
        return "bg-green-100";
      case "DEGRADED":
        return "bg-yellow-100";
      case "CRITICAL":
        return "bg-red-100";
      case "UP":
        return "bg-green-50";
      case "DOWN":
        return "bg-red-50";
      default:
        return "bg-gray-100";
    }
  };

  if (loading && !healthData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🔧 System Health Monitor
          </h1>
          <p className="text-gray-600">
            Theo dõi trạng thái hệ thống phân tán và test fault tolerance
          </p>
        </div>

        {healthData && (
          <div
            className={`rounded-2xl p-6 mb-6 shadow-lg ${getStatusBg(
              healthData.status
            )}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  System Status
                </h2>
                <p className="text-gray-600">
                  Cập nhật: {new Date(healthData.timestamp).toLocaleString()}
                </p>
              </div>
              <div
                className={`text-2xl font-bold ${getStatusColor(
                  healthData.status
                )}`}
              >
                {healthData.status}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-lg text-gray-700">{healthData.message}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {healthData.sites.total}
                </div>
                <div className="text-sm text-gray-600">Total Sites</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {healthData.sites.available}
                </div>
                <div className="text-sm text-gray-600">Available</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {healthData.sites.unavailable}
                </div>
                <div className="text-sm text-gray-600">Unavailable</div>
              </div>
            </div>

            <div className="flex items-center">
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  healthData.faultTolerant
                    ? "bg-green-200 text-green-800"
                    : "bg-red-200 text-red-800"
                }`}
              >
                {healthData.faultTolerant
                  ? "✅ Fault Tolerant"
                  : "❌ Not Fault Tolerant"}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            🧪 Fault Tolerance Testing
          </h3>

          <div className="flex gap-4 mb-6">
            <button
              onClick={testFaultTolerance}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Testing..." : "Test Fault Tolerance"}
            </button>

            <button
              onClick={fetchHealth}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">
              💡 Hướng dẫn test:
            </h4>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Dừng một container: docker stop postgres_site_c</li>
              <li>
                2. Click "Test Fault Tolerance" để xem hệ thống vẫn hoạt động
              </li>
              <li>3. Dừng thêm container để test với nhiều site down</li>
              <li>4. Khởi động lại container: docker start postgres_site_c</li>
            </ol>
          </div>
        </div>

        {testResults && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              📊 Test Results
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">
                  Data Retrieved:
                </h4>
                <div className="bg-gray-50 rounded p-3">
                  <div>
                    Employees Found:{" "}
                    <span className="font-bold text-blue-600">
                      {testResults.employeesFound}
                    </span>
                  </div>
                  <div>
                    Available Sites:{" "}
                    <span className="font-bold text-green-600">
                      {testResults.availableSites}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">
                  Site Status:
                </h4>
                <div className="space-y-2">
                  {testResults.siteStatuses?.map((site: any) => (
                    <div
                      key={site.site}
                      className="flex justify-between items-center bg-gray-50 rounded px-3 py-2"
                    >
                      <span>{site.site}</span>
                      <span
                        className={`font-semibold ${getStatusColor(
                          site.status
                        )}`}
                      >
                        {site.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemHealth;
