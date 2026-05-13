---
trigger: always_on
---

Trước khi bắt đầu, hãy:
1. Đọc RULES.md
2. Đọc docs/ARCHITECTURE.md 
3. Đọc docs/CRITICAL_PATHS.md

Nhiệm vụ: [mô tả cụ thể, ví dụ: "Tạo API CRUD cho module Partner"]
File liên quan: [liệt kê rõ, ví dụ: "src/app/api/partners/route.ts, prisma/schema.prisma"]
KHÔNG được sửa file nào khác ngoài danh sách trên.

YÊU CẦU BẢO MẬT:
- Input validation bằng Zod schema
- Chỉ dùng Prisma ORM — không raw SQL
- Auth check trên mọi endpoint
- Error handling không expose stack trace
