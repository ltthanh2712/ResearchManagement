-- Global Database - Chỉ tạo bảng đơn giản để lưu metadata
CREATE DATABASE ResearchManagement;
GO

USE ResearchManagement;
GO

-- Bảng để track routing của dữ liệu
CREATE TABLE SiteRouting (
    TenPhong NVARCHAR(200) PRIMARY KEY,
    SiteName NVARCHAR(50) NOT NULL,
    DatabaseType NVARCHAR(50) NOT NULL,
    ConnectionInfo NVARCHAR(500) NOT NULL
);

INSERT INTO SiteRouting (TenPhong, SiteName, DatabaseType, ConnectionInfo) VALUES
('P1', 'siteA', 'MSSQL', 'mssql_site_a:1433'),
('P2', 'siteB', 'MSSQL', 'mssql_site_b:1433'),
('P3', 'siteC', 'POSTGRES', 'postgres_site_c:5432');

-- Bảng để track fragment distribution
CREATE TABLE FragmentDistribution (
    TableName NVARCHAR(100),
    TenPhong NVARCHAR(200),
    SiteName NVARCHAR(50),
    RecordCount INT DEFAULT 0,
    LastUpdated DATETIME DEFAULT GETDATE()
);

PRINT 'Global database initialized successfully';