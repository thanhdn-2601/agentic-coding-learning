-- =============================================================================
-- Migration: Viết Kudo feature — add new fields to kudos table + RPC + Storage
-- Reference: 00003_add_kudos_modal_fields pattern
-- =============================================================================

-- 1. Add columns to kudos table
ALTER TABLE public.kudos
  ADD COLUMN IF NOT EXISTS danh_hieu      text    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_anonymous   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anonymous_name text,
  ADD COLUMN IF NOT EXISTS image_urls     text[]  NOT NULL DEFAULT '{}';

-- 2. danh_hieu max-length constraint
ALTER TABLE public.kudos
  ADD CONSTRAINT kudos_danh_hieu_max_length CHECK (char_length(danh_hieu) <= 200);

COMMENT ON COLUMN public.kudos.danh_hieu      IS 'Danh hiệu — tiêu đề của Kudo, hiển thị nổi bật; bắt buộc cho row mới';
COMMENT ON COLUMN public.kudos.is_anonymous   IS 'Nếu true, ẩn thông tin sender trong API và UI';
COMMENT ON COLUMN public.kudos.anonymous_name IS 'Tên hiển thị thay thế khi gửi ẩn danh (nullable — chỉ có value khi is_anonymous = true)';
COMMENT ON COLUMN public.kudos.image_urls     IS 'Mảng public URL ảnh đính kèm từ Supabase Storage (tối đa 5)';

-- 3. Atomic RPC function: insert kudos (similar to reference create_kudos pattern)
--    Handles: auth check, self-send guard, department denormalization
CREATE OR REPLACE FUNCTION public.create_kudos(
  p_receiver_id    UUID,
  p_danh_hieu      TEXT,
  p_message        TEXT,
  p_hashtags       TEXT[]  DEFAULT ARRAY[]::TEXT[],
  p_image_urls     TEXT[]  DEFAULT ARRAY[]::TEXT[],
  p_is_anonymous   BOOLEAN DEFAULT false,
  p_anonymous_name TEXT    DEFAULT NULL
)
RETURNS public.kudos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id     UUID;
  v_department_id UUID;
  v_kudos         public.kudos;
BEGIN
  v_sender_id := auth.uid();

  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_sender_id = p_receiver_id THEN
    RAISE EXCEPTION 'Cannot send kudos to yourself';
  END IF;

  -- Denormalize receiver department at time of sending
  SELECT department_id INTO v_department_id
  FROM public.profiles
  WHERE id = p_receiver_id;

  INSERT INTO public.kudos (
    sender_id,
    receiver_id,
    danh_hieu,
    message,
    hashtags,
    image_urls,
    is_anonymous,
    anonymous_name,
    department_id,
    heart_count
  ) VALUES (
    v_sender_id,
    p_receiver_id,
    p_danh_hieu,
    p_message,
    COALESCE(p_hashtags, ARRAY[]::TEXT[]),
    COALESCE(p_image_urls, ARRAY[]::TEXT[]),
    p_is_anonymous,
    CASE WHEN p_is_anonymous THEN p_anonymous_name ELSE NULL END,
    v_department_id,
    0
  )
  RETURNING * INTO v_kudos;

  RETURN v_kudos;
END;
$$;

-- 4. Allow authenticated users to read all profiles (needed for recipient search)
CREATE POLICY "profiles: read all (authenticated)"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- 6. Create kudo-images Storage bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('kudo-images', 'kudo-images', true)
ON CONFLICT (id) DO NOTHING;

-- 7. RLS: authenticated users can upload to kudo-images
CREATE POLICY "Authenticated users can upload kudo images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'kudo-images');

-- 8. RLS: public read for kudo-images
CREATE POLICY "Public can view kudo images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'kudo-images');

-- 9. RLS: users can delete their own uploads
CREATE POLICY "Users can delete own kudo images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'kudo-images' AND (storage.foldername(name))[1] = auth.uid()::text);
