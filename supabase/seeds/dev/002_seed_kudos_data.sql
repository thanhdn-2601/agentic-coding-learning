-- =============================================================================
-- Development Seed: Kudos module — departments, auth users, profiles, hashtags, kudos
-- Adapted from reference seed; column names match actual schema.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Departments (50 from design spec)
-- ---------------------------------------------------------------------------
INSERT INTO public.departments (id, name) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'CTO'),
  ('d0000001-0000-0000-0000-000000000002', 'SPD'),
  ('d0000001-0000-0000-0000-000000000003', 'FCOV'),
  ('d0000001-0000-0000-0000-000000000004', 'CEVC1'),
  ('d0000001-0000-0000-0000-000000000005', 'CEVC2'),
  ('d0000001-0000-0000-0000-000000000006', 'CEVC3'),
  ('d0000001-0000-0000-0000-000000000007', 'CEVC4'),
  ('d0000001-0000-0000-0000-000000000008', 'CEVEC'),
  ('d0000001-0000-0000-0000-000000000009', 'STVC'),
  ('d0000001-0000-0000-0000-000000000010', 'OPDC - HRF'),
  ('d0000001-0000-0000-0000-000000000011', 'OPDC - HRD - C&C'),
  ('d0000001-0000-0000-0000-000000000012', 'OPDC - HRF - C&B'),
  ('d0000001-0000-0000-0000-000000000013', 'OPDC - HRF - OD'),
  ('d0000001-0000-0000-0000-000000000014', 'OPDC - HRF - TA'),
  ('d0000001-0000-0000-0000-000000000015', 'OPDC - HRD - L&D'),
  ('d0000001-0000-0000-0000-000000000016', 'OPDC - HRD - TI'),
  ('d0000001-0000-0000-0000-000000000017', 'OPDC - HRD - HRBP'),
  ('d0000001-0000-0000-0000-000000000018', 'OPDC - HRD'),
  ('d0000001-0000-0000-0000-000000000019', 'FCOV - LRM'),
  ('d0000001-0000-0000-0000-000000000020', 'FCOV - F&A'),
  ('d0000001-0000-0000-0000-000000000021', 'FCOV - GA'),
  ('d0000001-0000-0000-0000-000000000022', 'FCOV - ISO'),
  ('d0000001-0000-0000-0000-000000000023', 'STVC - R&D'),
  ('d0000001-0000-0000-0000-000000000024', 'STVC - EE'),
  ('d0000001-0000-0000-0000-000000000025', 'STVC - R&D - DTR'),
  ('d0000001-0000-0000-0000-000000000026', 'STVC - R&D - DPS'),
  ('d0000001-0000-0000-0000-000000000027', 'STVC - R&D - AIR'),
  ('d0000001-0000-0000-0000-000000000028', 'STVC - R&D - SDX'),
  ('d0000001-0000-0000-0000-000000000029', 'STVC - Infra'),
  ('d0000001-0000-0000-0000-000000000030', 'CEVC1 - DSV'),
  ('d0000001-0000-0000-0000-000000000031', 'CEVC1 - DSV - UI/UX 1'),
  ('d0000001-0000-0000-0000-000000000032', 'CEVC1 - DSV - UI/UX 2'),
  ('d0000001-0000-0000-0000-000000000033', 'CEVC1 - AIE'),
  ('d0000001-0000-0000-0000-000000000034', 'CEVC2 - CySS'),
  ('d0000001-0000-0000-0000-000000000035', 'CEVC2 - System'),
  ('d0000001-0000-0000-0000-000000000036', 'CEVEC - SAPD'),
  ('d0000001-0000-0000-0000-000000000037', 'CEVEC - GSD'),
  ('d0000001-0000-0000-0000-000000000038', 'GEU'),
  ('d0000001-0000-0000-0000-000000000039', 'GEU - HUST'),
  ('d0000001-0000-0000-0000-000000000040', 'GEU - TM'),
  ('d0000001-0000-0000-0000-000000000041', 'GEU - DUT'),
  ('d0000001-0000-0000-0000-000000000042', 'GEU - UET'),
  ('d0000001-0000-0000-0000-000000000043', 'GEU - UIT'),
  ('d0000001-0000-0000-0000-000000000044', 'PAO'),
  ('d0000001-0000-0000-0000-000000000045', 'PAO - PEC'),
  ('d0000001-0000-0000-0000-000000000046', 'PAO - PAO'),
  ('d0000001-0000-0000-0000-000000000047', 'IAV'),
  ('d0000001-0000-0000-0000-000000000048', 'CPV'),
  ('d0000001-0000-0000-0000-000000000049', 'CPV - CGP'),
  ('d0000001-0000-0000-0000-000000000050', 'BDV')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Hashtags
-- ---------------------------------------------------------------------------
INSERT INTO public.hashtags (id, name) VALUES
  ('b0000001-0000-0000-0000-000000000001', '#teamwork'),
  ('b0000001-0000-0000-0000-000000000002', '#innovation'),
  ('b0000001-0000-0000-0000-000000000003', '#leadership'),
  ('b0000001-0000-0000-0000-000000000004', '#dedication'),
  ('b0000001-0000-0000-0000-000000000005', '#creativity'),
  ('b0000001-0000-0000-0000-000000000006', '#mentorship'),
  ('b0000001-0000-0000-0000-000000000007', '#quality'),
  ('b0000001-0000-0000-0000-000000000008', '#growth')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. auth.users  (required FK for profiles)
-- ---------------------------------------------------------------------------
INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token
) VALUES
  ('a0000001-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'nguyenvana@sun-asterisk.com',
   crypt('password123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Nguyen Van A"}',
   now(), now(), ''),
  ('a0000001-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'tranthib@sun-asterisk.com',
   crypt('password123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Tran Thi B"}',
   now(), now(), ''),
  ('a0000001-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'levanc@sun-asterisk.com',
   crypt('password123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Le Van C"}',
   now(), now(), ''),
  ('a0000001-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'phamthid@sun-asterisk.com',
   crypt('password123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Pham Thi D"}',
   now(), now(), ''),
  ('a0000001-0000-0000-0000-000000000005',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'hoangvane@sun-asterisk.com',
   crypt('password123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Hoang Van E"}',
   now(), now(), '')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. profiles  (actual schema: full_name, department_id UUID)
-- ---------------------------------------------------------------------------
INSERT INTO public.profiles (id, email, full_name, department_id) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'nguyenvana@sun-asterisk.com',
   'Nguyen Van A', 'd0000001-0000-0000-0000-000000000004'),  -- CEVC1
  ('a0000001-0000-0000-0000-000000000002', 'tranthib@sun-asterisk.com',
   'Tran Thi B',   'd0000001-0000-0000-0000-000000000005'),  -- CEVC2
  ('a0000001-0000-0000-0000-000000000003', 'levanc@sun-asterisk.com',
   'Le Van C',     'd0000001-0000-0000-0000-000000000009'),  -- STVC
  ('a0000001-0000-0000-0000-000000000004', 'phamthid@sun-asterisk.com',
   'Pham Thi D',   'd0000001-0000-0000-0000-000000000003'),  -- FCOV
  ('a0000001-0000-0000-0000-000000000005', 'hoangvane@sun-asterisk.com',
   'Hoang Van E',  'd0000001-0000-0000-0000-000000000004')   -- CEVC1
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. kudos  (actual schema: danh_hieu, message, image_urls)
-- ---------------------------------------------------------------------------
INSERT INTO public.kudos (
  id, sender_id, receiver_id,
  danh_hieu, message,
  hashtags, image_urls, is_anonymous, heart_count, created_at
) VALUES
  ('c0000001-0000-0000-0000-000000000001',
   'a0000001-0000-0000-0000-000000000001',
   'a0000001-0000-0000-0000-000000000002',
   'Đồng đội tuyệt vời nhất',
   '<p>Cảm ơn bạn đã hỗ trợ mình hoàn thành dự án đúng hạn. Bạn là người đồng đội tuyệt vời!</p>',
   ARRAY['#teamwork', '#dedication'], ARRAY[]::TEXT[], false, 25,
   now() - interval '2 hours'),

  ('c0000001-0000-0000-0000-000000000002',
   'a0000001-0000-0000-0000-000000000002',
   'a0000001-0000-0000-0000-000000000003',
   'Người mentor tuyệt vời nhất',
   '<p>Xin gửi lời cảm ơn đến anh vì đã hướng dẫn mình rất nhiều trong thời gian qua. Anh là người mentor tuyệt vời nhất!</p>',
   ARRAY['#mentorship', '#growth'], ARRAY[]::TEXT[], false, 18,
   now() - interval '5 hours'),

  ('c0000001-0000-0000-0000-000000000003',
   'a0000001-0000-0000-0000-000000000003',
   'a0000001-0000-0000-0000-000000000004',
   'Nhà lãnh đạo ilhám',
   '<p>Chị đã làm rất tốt trong việc triển khai chiến dịch mới. Kết quả vượt xa kỳ vọng!</p>',
   ARRAY['#leadership', '#innovation'], ARRAY[]::TEXT[], false, 32,
   now() - interval '1 day'),

  ('c0000001-0000-0000-0000-000000000004',
   'a0000001-0000-0000-0000-000000000004',
   'a0000001-0000-0000-0000-000000000005',
   'Tinh thần trách nhiệm cao',
   '<p>Cảm ơn anh đã fix bug critical vào cuối tuần. Tinh thần trách nhiệm của anh thật đáng ngợi!</p>',
   ARRAY['#dedication', '#quality'], ARRAY[]::TEXT[], false, 45,
   now() - interval '2 days'),

  ('c0000001-0000-0000-0000-000000000005',
   'a0000001-0000-0000-0000-000000000005',
   'a0000001-0000-0000-0000-000000000001',
   'Ý tưởng sáng tạo xuất sắc',
   '<p>Bạn đã có những ý tưởng sáng tạo tuyệt vời cho sản phẩm mới. Rất mong được làm việc cùng bạn nhiều hơn!</p>',
   ARRAY['#creativity', '#innovation'], ARRAY[]::TEXT[], false, 12,
   now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;
