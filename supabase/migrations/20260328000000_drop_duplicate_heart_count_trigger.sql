-- ============================================================
-- Migration: drop duplicate heart_count trigger
-- ============================================================
-- The kudos_likes_sync_heart_count trigger (from 20260323000001) always
-- increments/decrements heart_count by ±1 on every INSERT/DELETE to
-- kudos_likes. The toggle_kudos_like RPC (from 20260327000000) ALSO
-- manually updates heart_count — causing a double-increment on normal
-- days and a triple-increment on special days.
--
-- Since the RPC handles the count update atomically (and must, to support
-- special-day double-heart logic where delta=2), we drop the trigger.
-- ============================================================

DROP TRIGGER IF EXISTS kudos_likes_sync_heart_count ON public.kudos_likes;
DROP FUNCTION IF EXISTS public.sync_kudos_heart_count();
