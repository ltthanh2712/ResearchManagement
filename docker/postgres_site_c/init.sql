-- ============================
-- KẾT NỐI VÀ CHỌN DATABASE
-- ============================
\c ResearchManagement;

-- ============================
-- TẠO BẢNG (VỚI KIỂU VARCHAR CHO MÃ)
-- ============================
CREATE TABLE IF NOT EXISTS "NhomNC" (
    "MaNhom" VARCHAR(10) PRIMARY KEY,
    "TenNhom" VARCHAR(200),
    "TenPhong" VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS "NhanVien" (
    "MaNV" VARCHAR(10) PRIMARY KEY,
    "HoTen" VARCHAR(200),
    "MaNhom" VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS "DeAn" (
    "MaDA" VARCHAR(10) PRIMARY KEY,
    "TenDA" VARCHAR(200),
    "MaNhom" VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS "ThamGia" (
    "MaNV" VARCHAR(10),
    "MaDA" VARCHAR(10),
    PRIMARY KEY ("MaNV", "MaDA")
);

-- ============================
-- TẠO FOREIGN KEY
-- ============================
DO $$
BEGIN
    -- FK NhanVien -> NhomNC (an toàn)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_nv_nhom') THEN
        ALTER TABLE "NhanVien"
        ADD CONSTRAINT fk_nv_nhom FOREIGN KEY ("MaNhom")
        REFERENCES "NhomNC"("MaNhom")
        ON DELETE NO ACTION
        ON UPDATE NO ACTION;
    END IF;

    -- FK DeAn -> NhomNC (an toàn)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_da_nhom') THEN
        ALTER TABLE "DeAn"
        ADD CONSTRAINT fk_da_nhom FOREIGN KEY ("MaNhom")
        REFERENCES "NhomNC"("MaNhom")
        ON DELETE NO ACTION
        ON UPDATE NO ACTION;
    END IF;

    -- FK ThamGia -> DeAn (an toàn)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_thamgia_da') THEN
        ALTER TABLE "ThamGia"
        ADD CONSTRAINT fk_thamgia_da FOREIGN KEY ("MaDA")
        REFERENCES "DeAn"("MaDA")
        ON DELETE NO ACTION
        ON UPDATE NO ACTION;
    END IF;
END
$$;



-- ============================
-- CHÈN DỮ LIỆU MẪU SITE C
-- ============================
-- DO $$
-- BEGIN
--     -- NhomNC
--     INSERT INTO "NhomNC" ("MaNhom", "TenNhom", "TenPhong")
--     VALUES ('P3N1','Nhom 301','P3')
--     ON CONFLICT DO NOTHING;

--     INSERT INTO "NhomNC" ("MaNhom", "TenNhom", "TenPhong")
--     VALUES ('P3N2','Nhom 302','P3')
--     ON CONFLICT DO NOTHING;

--     -- NhanVien
--     INSERT INTO "NhanVien" ("MaNV", "HoTen", "MaNhom")
--     VALUES ('P3N1NV1','Pham Thi D','P3N1')
--     ON CONFLICT DO NOTHING;

--     INSERT INTO "NhanVien" ("MaNV", "HoTen", "MaNhom")
--     VALUES ('P3N2NV1','Nguyen Van E','P3N2')
--     ON CONFLICT DO NOTHING;

--     -- DeAn
--     INSERT INTO "DeAn" ("MaDA", "TenDA", "MaNhom")
--     VALUES ('P3N1DA1','DeAn C1','P3N1')
--     ON CONFLICT DO NOTHING;

--     INSERT INTO "DeAn" ("MaDA", "TenDA", "MaNhom")
--     VALUES ('P3N2DA1','DeAn C2','P3N2')
--     ON CONFLICT DO NOTHING;

--     -- ThamGia
--     INSERT INTO "ThamGia" ("MaNV", "MaDA")
--     VALUES ('P3N2NV1','P3N2DA1')
--     ON CONFLICT DO NOTHING;

--     INSERT INTO "ThamGia" ("MaNV", "MaDA")
--     VALUES ('P3N1NV1','P3N2DA1')
--     ON CONFLICT DO NOTHING;
-- END
-- $$;
