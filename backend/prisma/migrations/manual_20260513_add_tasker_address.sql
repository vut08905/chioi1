-- Migration: Thêm cột address vào bảng taskers
-- Bug 5.1+6.3 — Tasker submit địa chỉ nhưng không lưu được vì model thiếu column
-- Ngày: 2026-05-13
-- Cách chạy:
--   1. Đảm bảo DATABASE_URL trong .env trỏ đúng PostgreSQL
--   2. psql $DATABASE_URL -f prisma/migrations/manual_20260513_add_tasker_address.sql
--   HOẶC chạy qua Prisma (recommended): npx prisma migrate dev --name add_tasker_address
-- Sau khi chạy: npx prisma generate

ALTER TABLE taskers ADD COLUMN IF NOT EXISTS address TEXT;

-- Verify:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name='taskers' AND column_name='address';
