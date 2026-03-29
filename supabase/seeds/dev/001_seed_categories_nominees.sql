-- =============================================================================
-- SAA 2025 — Development Seed: Award Categories & Nominees
-- Seed file for local development only (supabase/seeds/dev/)
-- =============================================================================

-- Award Categories -----------------------------------------------------------
insert into public.award_categories (id, slug, name_vi, name_en, description_vi, description_en, display_order, is_active) values
  (
    'a1000000-0000-0000-0000-000000000001',
    'best-contributor',
    'Đóng góp xuất sắc',
    'Best Contributor',
    'Dành cho cá nhân có đóng góp nổi bật nhất cho tổ chức trong năm qua.',
    'Awarded to the individual with the most outstanding contributions to the organization in the past year.',
    1, true
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'best-teamwork',
    'Tinh thần đồng đội',
    'Best Teamwork',
    'Dành cho cá nhân thể hiện tinh thần hợp tác và hỗ trợ đồng nghiệp tốt nhất.',
    'Awarded to the individual who best demonstrates collaboration and support for their teammates.',
    2, true
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'best-innovation',
    'Sáng tạo đột phá',
    'Best Innovation',
    'Dành cho cá nhân mang lại giải pháp sáng tạo, cải tiến quy trình hoặc sản phẩm.',
    'Awarded to the individual who brings creative solutions, improves processes, or delivers innovative products.',
    3, true
  ),
  (
    'a1000000-0000-0000-0000-000000000004',
    'rising-star',
    'Ngôi sao mới nổi',
    'Rising Star',
    'Dành cho thành viên mới nhưng thể hiện tiềm năng phát triển vượt bậc.',
    'Awarded to a newer member who shows exceptional growth potential.',
    4, true
  )
on conflict (id) do nothing;

-- Nominees -------------------------------------------------------------------
insert into public.nominees (id, category_id, name, department, position, bio_vi, bio_en, display_order) values
  -- Best Contributor
  (
    'b1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Nguyễn Văn An',
    'Engineering',
    'Senior Software Engineer',
    'An đã dẫn dắt thành công 3 dự án lớn trong năm, được khách hàng đánh giá cao.',
    'An successfully led 3 major projects this year, highly praised by clients.',
    1
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'Trần Thị Bình',
    'Product',
    'Product Manager',
    'Bình đã định hướng sản phẩm và giúp team tăng 40% hiệu suất giao hàng.',
    'Binh defined product direction and helped the team improve delivery efficiency by 40%.',
    2
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'Lê Minh Cường',
    'Engineering',
    'Tech Lead',
    'Cường xây dựng nền tảng kỹ thuật mới, giảm thời gian build 50%.',
    'Cuong built a new technical foundation, reducing build time by 50%.',
    3
  ),
  -- Best Teamwork
  (
    'b1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000002',
    'Phạm Thị Dung',
    'Design',
    'UI/UX Designer',
    'Dung luôn hỗ trợ các thành viên khác và tạo ra môi trường làm việc tích cực.',
    'Dung always supports other members and creates a positive work environment.',
    1
  ),
  (
    'b1000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000002',
    'Hoàng Văn Em',
    'Engineering',
    'Software Engineer',
    'Em chia sẻ kiến thức, tổ chức mentoring và giúp đỡ đồng nghiệp liên tục.',
    'Em shares knowledge, organizes mentoring sessions, and continuously helps colleagues.',
    2
  ),
  -- Best Innovation
  (
    'b1000000-0000-0000-0000-000000000006',
    'a1000000-0000-0000-0000-000000000003',
    'Vũ Thị Phương',
    'Engineering',
    'AI Engineer',
    'Phương giới thiệu quy trình AI-assisted code review, tiết kiệm 30% thời gian review.',
    'Phuong introduced an AI-assisted code review workflow, saving 30% of review time.',
    1
  ),
  (
    'b1000000-0000-0000-0000-000000000007',
    'a1000000-0000-0000-0000-000000000003',
    'Đỗ Quang Huy',
    'Product',
    'Business Analyst',
    'Huy đề xuất mô hình phân tích dữ liệu mới giúp dự đoán rủi ro dự án chính xác hơn.',
    'Huy proposed a new data analysis model for more accurate project risk prediction.',
    2
  ),
  -- Rising Star
  (
    'b1000000-0000-0000-0000-000000000008',
    'a1000000-0000-0000-0000-000000000004',
    'Ngô Thị Lan',
    'Engineering',
    'Junior Software Engineer',
    'Lan gia nhập Sun* 6 tháng nhưng đã đóng góp vào 2 tính năng quan trọng.',
    'Lan joined Sun* 6 months ago but has already contributed to 2 key features.',
    1
  ),
  (
    'b1000000-0000-0000-0000-000000000009',
    'a1000000-0000-0000-0000-000000000004',
    'Bùi Văn Mạnh',
    'Design',
    'Junior UI Designer',
    'Mạnh học hỏi nhanh, thiết kế đã được triển khai thực tế sau 3 tháng.',
    'Manh learned quickly; his designs were deployed to production after just 3 months.',
    2
  )
on conflict (id) do nothing;
