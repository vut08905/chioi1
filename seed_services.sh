#!/bin/bash
# Seed services data for Chị Ơi! production database
sudo -u postgres psql -d chioi_db <<'EOF'

-- Insert core services
INSERT INTO services (name, description, base_price, icon_url, is_active) VALUES
('Dọn nhà', 'Dọn dẹp vệ sinh nhà cửa theo giờ. Bao gồm lau sàn, hút bụi, lau kính, dọn phòng.', 150000, '🏠', true),
('Nấu ăn', 'Nấu ăn tại nhà theo bữa hoặc theo giờ. Thực đơn đa dạng, nguyên liệu tươi sạch.', 200000, '🍳', true),
('Giặt ủi', 'Giặt, ủi quần áo tại nhà. Phân loại vải, giặt tay hoặc máy theo yêu cầu.', 120000, '👔', true),
('Trông trẻ', 'Trông giữ trẻ em tại nhà, chơi cùng bé, cho bé ăn. Nhân viên có kinh nghiệm.', 180000, '👶', true),
('Chăm sóc người già', 'Chăm sóc người cao tuổi tại nhà. Hỗ trợ sinh hoạt, theo dõi sức khỏe.', 250000, '👴', true),
('Dọn nhà theo tháng', 'Gói dọn dẹp vệ sinh định kỳ hàng tháng (8-12 buổi/tháng). Tiết kiệm hơn đặt lẻ.', 2500000, '📅', true),
('Mua hộ', 'Mua sắm hộ thực phẩm, đồ dùng và giao tận nhà. Tiện lợi, nhanh chóng.', 80000, '🛒', true),
('Vệ sinh máy lạnh', 'Vệ sinh, bảo trì máy lạnh, máy giặt. Kỹ thuật viên chuyên nghiệp.', 300000, '❄️', true);

-- Verify
SELECT service_id, name, base_price, is_active FROM services ORDER BY service_id;
EOF
echo "DONE seeding services!"
