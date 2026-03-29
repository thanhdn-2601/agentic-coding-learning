-- ============================================================
-- Migration: Re-point kudos.sender_id and receiver_id FKs
--            from auth.users → public.profiles
--            so PostgREST can join kudos → profiles via the same
--            FK hint names already used in all API routes.
--
-- Cascade chain is preserved:
--   auth.users (delete) → profiles (cascade) → kudos (cascade)
-- ============================================================

-- 1. Drop existing FKs that point to auth.users
ALTER TABLE public.kudos DROP CONSTRAINT IF EXISTS kudos_sender_id_fkey;
ALTER TABLE public.kudos DROP CONSTRAINT IF EXISTS kudos_receiver_id_fkey;

-- 2. Re-add with the SAME names, now referencing public.profiles
--    profiles.id = auth.users.id (1-to-1), so cascade integrity is unchanged.
ALTER TABLE public.kudos
  ADD CONSTRAINT kudos_sender_id_fkey
    FOREIGN KEY (sender_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.kudos
  ADD CONSTRAINT kudos_receiver_id_fkey
    FOREIGN KEY (receiver_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
