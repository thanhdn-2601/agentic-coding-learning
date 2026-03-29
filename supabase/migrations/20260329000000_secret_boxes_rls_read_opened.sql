-- Allow all authenticated users to see opened secret boxes
-- (needed for the "10 SUNNER NHẬN QUÀ MỚI NHẤT" sidebar leaderboard)
create policy "secret_boxes: read opened (authenticated)"
  on public.secret_boxes for select
  using (auth.uid() is not null and is_opened = true);
