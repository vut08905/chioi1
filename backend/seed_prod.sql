-- Seed data for Chi Oi! Production VPS
-- Admin user
INSERT INTO users (phone, password_hash, full_name, role, status) VALUES
('0666666666', '$2b$10$4OhVmU9.4ghYysln/7qdJeRJvG4.taI/mfcmxeYMfH2KcyjFrmGO.', 'Admin Quan Tri', 'ADMIN', 'ACTIVE')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO admins (admin_id, department, access_level)
SELECT user_id, 'Ban Giam Doc', 'SUPER_ADMIN' FROM users WHERE phone = '0666666666'
ON CONFLICT (admin_id) DO NOTHING;

-- Customer
INSERT INTO users (phone, password_hash, full_name, role, status) VALUES
('0901234567', '$2b$10$wT3gioGqFNQT98QFw3.ByOtp2jpZpjnfjZIZTS.NvlMDaP89pb7nO', 'Khach Hang VIP', 'CUSTOMER', 'ACTIVE')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO customers (customer_id, default_address, loyalty_points)
SELECT user_id, 'Vinhomes Central Park, Binh Thanh', 150 FROM users WHERE phone = '0901234567'
ON CONFLICT (customer_id) DO NOTHING;

INSERT INTO wallets (user_id, balance)
SELECT user_id, 5000000 FROM users WHERE phone = '0901234567'
ON CONFLICT (user_id) DO NOTHING;

-- Tasker
INSERT INTO users (phone, password_hash, full_name, role, status) VALUES
('0909876543', '$2b$10$wT3gioGqFNQT98QFw3.ByOtp2jpZpjnfjZIZTS.NvlMDaP89pb7nO', 'Chi Lan Don Nha', 'TASKER', 'ACTIVE')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO taskers (tasker_id, bio, kyc_status, average_rating, total_jobs, is_online)
SELECT user_id, 'Kinh nghiem 5 nam', 'VERIFIED', 4.9, 120, true FROM users WHERE phone = '0909876543'
ON CONFLICT (tasker_id) DO NOTHING;

INSERT INTO wallets (user_id, balance)
SELECT user_id, 2000000 FROM users WHERE phone = '0909876543'
ON CONFLICT (user_id) DO NOTHING;

-- Services
INSERT INTO services (name, description, base_price, icon_url) VALUES
('Don dep nha cua', 'Don dep tieu chuan 2 gio', 150000, 'icon_cleaning.png'),
('Trong tre', 'Giu tre so sinh va tre nho', 200000, 'icon_babysitting.png'),
('Nau an', 'Nau an gia dinh 3-4 nguoi', 180000, 'icon_cooking.png'),
('Di cho', 'Mua ho thuc pham theo yeu cau', 100000, 'icon_shopping.png'),
('Mua ho WinMart', 'Mua ho hang hoa tai WinMart', 120000, 'icon_winmart.png')
ON CONFLICT (name) DO NOTHING;

-- Tasker services
INSERT INTO tasker_services (tasker_id, service_id, status)
SELECT t.tasker_id, s.service_id, 'APPROVED'
FROM taskers t, services s WHERE t.tasker_id = (SELECT user_id FROM users WHERE phone = '0909876543')
ON CONFLICT DO NOTHING;
