-- Site B init
IF DB_ID('ResearchManagement') IS NULL
    CREATE DATABASE ResearchManagement;
GO
USE ResearchManagement;
GO

-- Tạo bảng NhomNC
IF OBJECT_ID('dbo.NhomNC') IS NULL
BEGIN
    CREATE TABLE dbo.NhomNC (
        MaNhom NVARCHAR(10) PRIMARY KEY,
        TenNhom NVARCHAR(200),
        TenPhong NVARCHAR(10)
    );
END
GO

-- Tạo bảng NhanVien
IF OBJECT_ID('dbo.NhanVien') IS NULL
BEGIN
    CREATE TABLE dbo.NhanVien (
        MaNV NVARCHAR(10) PRIMARY KEY,
        HoTen NVARCHAR(200),
        MaNhom NVARCHAR(10)
    );
END
GO

-- Tạo bảng DeAn
IF OBJECT_ID('dbo.DeAn') IS NULL
BEGIN
    CREATE TABLE dbo.DeAn (
        MaDA NVARCHAR(10) PRIMARY KEY,
        TenDA NVARCHAR(200),
        MaNhom NVARCHAR(10)
    );
END
GO

-- Tạo bảng ThamGia
IF OBJECT_ID('dbo.ThamGia') IS NULL
BEGIN
    CREATE TABLE dbo.ThamGia (
        MaNV NVARCHAR(10),
        MaDA NVARCHAR(10),
        PRIMARY KEY (MaNV, MaDA)
    );
END
GO

-- Foreign keys (an toàn)
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_NV_Nhom')
    ALTER TABLE dbo.NhanVien 
    ADD CONSTRAINT FK_NV_Nhom FOREIGN KEY (MaNhom) 
    REFERENCES dbo.NhomNC(MaNhom) 
    ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_DA_Nhom')
    ALTER TABLE dbo.DeAn 
    ADD CONSTRAINT FK_DA_Nhom FOREIGN KEY (MaNhom) 
    REFERENCES dbo.NhomNC(MaNhom) 
    ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

-- Comment out FK constraint cho MaNV để cho phép cross-site participation
-- IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ThamGia_NV')
--     ALTER TABLE dbo.ThamGia 
--     ADD CONSTRAINT FK_ThamGia_NV FOREIGN KEY (MaNV) 
--     REFERENCES dbo.NhanVien(MaNV) 
--     ON DELETE NO ACTION ON UPDATE NO ACTION;
-- GO

-- Giữ lại FK constraint cho MaDA
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ThamGia_DA')
BEGIN
    ALTER TABLE dbo.ThamGia 
    ADD CONSTRAINT FK_ThamGia_DA FOREIGN KEY (MaDA) 
    REFERENCES dbo.DeAn(MaDA) 
    ON DELETE NO ACTION 
    ON UPDATE NO ACTION;
END
GO

-- ============================
-- Seed dữ liệu mẫu Site B
-- ============================
-- BEGIN TRY
--     -- Nhóm
--     INSERT INTO NhomNC (MaNhom, TenNhom, TenPhong) VALUES ('P2N1', N'Nhom 201', N'P2');
--     INSERT INTO NhomNC (MaNhom, TenNhom, TenPhong) VALUES ('P2N2', N'Nhom 202', N'P2');

--     -- Nhân viên
--     INSERT INTO NhanVien (MaNV, HoTen, MaNhom) VALUES ('P2N1NV1', N'Le Van C', 'P2N1');
--     INSERT INTO NhanVien (MaNV, HoTen, MaNhom) VALUES ('P2N2NV2', N'Pham Thi D', 'P2N2');

--     -- Đề án
--     INSERT INTO DeAn (MaDA, TenDA, MaNhom) VALUES ('P2N1DA1', N'DeAn B1', 'P2N1');

--     -- Tham gia
--     INSERT INTO ThamGia (MaNV, MaDA) VALUES ('P2N1NV1', 'P2N1DA1');
-- END TRY
-- BEGIN CATCH
--     -- ignore duplicates on re-run
-- END CATCH
-- GO
