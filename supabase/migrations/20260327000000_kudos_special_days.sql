-- ============================================================
-- Migration: kudos special days, hearts_received, tier timestamp
-- ============================================================

-- 1. special_days table (admin-configurable double-heart days)
CREATE TABLE public.special_days (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE        NOT NULL UNIQUE,
  created_by  uuid        REFERENCES public.profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.special_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage special_days"
  ON public.special_days FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated can read special_days"
  ON public.special_days FOR SELECT
  USING (auth.role() = 'authenticated');

-- 2. kudos_likes — track whether like happened on a special day
ALTER TABLE public.kudos_likes
  ADD COLUMN IF NOT EXISTS is_special_day BOOLEAN NOT NULL DEFAULT false;

-- 3. profiles — hearts_received + tier timestamp
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hearts_received          INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kudos_star_tier_updated_at timestamptz;

-- 3a. Backfill hearts_received: 1 like on a kudos = +1 heart for that kudos's sender
UPDATE public.profiles p
SET hearts_received = (
  SELECT COUNT(*)::INTEGER
  FROM public.kudos_likes kl
  JOIN public.kudos k ON k.id = kl.kudos_id
  WHERE k.sender_id = p.id
);

-- 3b. Backfill kudos_star_tier_updated_at for profiles that already have a tier
UPDATE public.profiles
SET kudos_star_tier_updated_at = now()
WHERE kudos_star_tier IS NOT NULL
  AND kudos_star_tier_updated_at IS NULL;

-- 4. Performance indexes
CREATE INDEX IF NOT EXISTS idx_kudos_sender_id
  ON public.kudos(sender_id);

CREATE INDEX IF NOT EXISTS idx_kudos_receiver_id
  ON public.kudos(receiver_id);

CREATE INDEX IF NOT EXISTS idx_kudos_receiver_created
  ON public.kudos(receiver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_kudos_heart_count
  ON public.kudos(heart_count DESC);

-- 5. toggle_kudos_like(p_kudos_id, p_user_id) — atomic like/unlike
--    Handles: self-like guard, special-day double-heart, heart_count update,
--             hearts_received update for the kudo sender.
CREATE OR REPLACE FUNCTION public.toggle_kudos_like(
  p_kudos_id UUID,
  p_user_id  UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_id       UUID;
  v_is_special_day  BOOLEAN;
  v_existing_like   public.kudos_likes%ROWTYPE;
  v_new_count       INTEGER;
  v_liked           BOOLEAN;
  v_heart_delta     INTEGER;
BEGIN
  -- Fetch kudos sender (lock row to prevent race)
  SELECT sender_id INTO v_sender_id
    FROM public.kudos
    WHERE id = p_kudos_id
    FOR NO KEY UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'KUDOS_NOT_FOUND';
  END IF;

  -- Self-like guard
  IF v_sender_id = p_user_id THEN
    RAISE EXCEPTION 'SELF_LIKE_NOT_ALLOWED';
  END IF;

  -- Check if today is a special day
  SELECT EXISTS(
    SELECT 1 FROM public.special_days WHERE date = CURRENT_DATE
  ) INTO v_is_special_day;

  -- Check for existing like
  SELECT * INTO v_existing_like
    FROM public.kudos_likes
    WHERE kudos_id = p_kudos_id AND user_id = p_user_id;

  IF FOUND THEN
    -- Unlike: reverse the delta using the STORED is_special_day value
    v_heart_delta := CASE WHEN v_existing_like.is_special_day THEN -2 ELSE -1 END;
    DELETE FROM public.kudos_likes
      WHERE kudos_id = p_kudos_id AND user_id = p_user_id;
    v_liked := false;
  ELSE
    -- Like: insert with current special-day flag
    v_heart_delta := CASE WHEN v_is_special_day THEN 2 ELSE 1 END;
    INSERT INTO public.kudos_likes (kudos_id, user_id, is_special_day)
      VALUES (p_kudos_id, p_user_id, v_is_special_day);
    v_liked := true;
  END IF;

  -- Update kudos.heart_count
  UPDATE public.kudos
    SET heart_count = heart_count + v_heart_delta
    WHERE id = p_kudos_id
    RETURNING heart_count INTO v_new_count;

  -- Update sender's hearts_received (floor at 0)
  UPDATE public.profiles
    SET hearts_received = GREATEST(0, hearts_received + v_heart_delta)
    WHERE id = v_sender_id;

  RETURN json_build_object('liked', v_liked, 'count', v_new_count);
END;
$$;

-- 6. get_kudos_stats(p_user_id) — replaces broken PostgREST join in /api/me/kudos-stats
CREATE OR REPLACE FUNCTION public.get_kudos_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'kudos_received',     (SELECT COUNT(*) FROM public.kudos       WHERE receiver_id = p_user_id),
    'kudos_sent',         (SELECT COUNT(*) FROM public.kudos       WHERE sender_id   = p_user_id),
    'hearts_received',    (SELECT hearts_received FROM public.profiles WHERE id = p_user_id),
    'secret_box_opened',  (SELECT COUNT(*) FROM public.secret_boxes WHERE user_id = p_user_id AND is_opened = true),
    'secret_box_unopened',(SELECT COUNT(*) FROM public.secret_boxes WHERE user_id = p_user_id AND is_opened = false)
  );
$$;

-- 7. Extend existing update_kudos_star_tier trigger function
--    (trigger already exists from 20260323000001; only the FUNCTION needs replacing)
--    Adds: kudos_star_tier_updated_at is set only when tier actually changes.
CREATE OR REPLACE FUNCTION public.update_kudos_star_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_tier  INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
    FROM public.kudos
    WHERE receiver_id = NEW.receiver_id;

  v_tier := CASE
    WHEN v_count >= 50 THEN 3
    WHEN v_count >= 20 THEN 2
    WHEN v_count >= 10 THEN 1
    ELSE NULL
  END;

  UPDATE public.profiles
    SET
      kudos_star_tier             = v_tier,
      kudos_star_tier_updated_at  = CASE
        WHEN v_tier IS DISTINCT FROM kudos_star_tier THEN now()
        ELSE kudos_star_tier_updated_at
      END
    WHERE id = NEW.receiver_id;

  RETURN NEW;
END;
$$;
-- The trigger binding (AFTER INSERT ON kudos) already exists; replacing the function is sufficient.
