-- Development seed: opened secret boxes for "10 SUNNER NHẬN QUÀ MỚI NHẤT"
INSERT INTO public.secret_boxes (id, user_id, is_opened, gift_title, created_at) VALUES
  ('bb000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', true, 'Khăn Root Further',        now() - interval '3 hours'),
  ('bb000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', true, 'Lót chuột Root Further',  now() - interval '6 hours'),
  ('bb000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', true, 'Ly sứ Root Further',      now() - interval '12 hours'),
  ('bb000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', true, 'Magnet Root Further',     now() - interval '1 day'),
  ('bb000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', true, 'Bộ quà tặng Root Further',now() - interval '2 days'),
  ('bb000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000001', true, 'Túi vải Root Further',    now() - interval '3 days'),
  ('bb000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000002', true, 'Bút Root Further',        now() - interval '4 days'),
  ('bb000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000003', true, 'Sổ tay Root Further',     now() - interval '5 days'),
  ('bb000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000004', true, 'Khăn Root Further',       now() - interval '6 days'),
  ('bb000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000005', true, 'Lắc tay Root Further',    now() - interval '7 days')
ON CONFLICT (id) DO NOTHING;
