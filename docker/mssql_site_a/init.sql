  -- Site A init: MaNhom 1..100
  IF DB_ID('ResearchManagement') IS NULL
    CREATE DATABASE ResearchManagement;
  GO
  USE ResearchManagement;
  GO

  IF OBJECT_ID('dbo.NhomNC') IS NULL
  BEGIN
  CREATE TABLE dbo.NhomNC (
    MaNhom NVARCHAR(10) PRIMARY KEY,
    TenNhom NVARCHAR(200),
    TenPhong NVARCHAR(200)
  );
  END
  GO

  IF OBJECT_ID('dbo.NhanVien') IS NULL
  BEGIN
  CREATE TABLE dbo.NhanVien (
    MaNV NVARCHAR(10) PRIMARY KEY,
    HoTen NVARCHAR(200),
    MaNhom NVARCHAR(10)
  );
  END
  GO

  IF OBJECT_ID('dbo.DeAn') IS NULL
  BEGIN
  CREATE TABLE dbo.DeAn (
    MaDA NVARCHAR(10) PRIMARY KEY,
    TenDA NVARCHAR(200),
    MaNhom NVARCHAR(10)
  );
  END
  GO

  IF OBJECT_ID('dbo.ThamGia') IS NULL
  BEGIN
  CREATE TABLE dbo.ThamGia (
    MaNV NVARCHAR(10),
    MaDA NVARCHAR(10),
    PRIMARY KEY (MaNV, MaDA)
  );
  END
  GO

-- Foreign keys (an toàn, không cascade)
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
-- Seed dữ liệu mẫu Site A
-- ============================
  -- BEGIN TRY
  --   INSERT INTO NhomNC VALUES ('P1N1',N'Nhom 1',N'P1');
  --   INSERT INTO NhomNC VALUES ('P1N2',N'Nhom 2',N'P1');
  --   INSERT INTO NhanVien VALUES ('P1N1NV1',N'Nguyen Van A','P1N1');
  --   INSERT INTO NhanVien VALUES ('P1N2NV2',N'Tran Thi B','P1N2');
  --   INSERT INTO DeAn VALUES ('P1N1DA1',N'DeAn A1','P1N1');
  --   INSERT INTO ThamGia VALUES ('P1N1NV1','P1N1DA1');
  -- END TRY
  -- BEGIN CATCH
  --   -- ignore duplicates on re-run
  -- END CATCH
  -- GO