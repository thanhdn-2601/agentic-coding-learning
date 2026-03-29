#!/usr/bin/env python3
"""Seed script: insert 10 opened secret boxes into local Supabase DB."""
import psycopg2

DSN = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

rows = [
    ("bb000001-0000-0000-0000-000000000001", "a0000001-0000-0000-0000-000000000001", "Khăn Root Further",         "2026-03-28 20:00:00+00"),
    ("bb000001-0000-0000-0000-000000000002", "a0000001-0000-0000-0000-000000000002", "Lót chuột Root Further",    "2026-03-28 17:00:00+00"),
    ("bb000001-0000-0000-0000-000000000003", "a0000001-0000-0000-0000-000000000003", "Ly sứ Root Further",        "2026-03-28 11:00:00+00"),
    ("bb000001-0000-0000-0000-000000000004", "a0000001-0000-0000-0000-000000000004", "Magnet Root Further",       "2026-03-27 23:00:00+00"),
    ("bb000001-0000-0000-0000-000000000005", "a0000001-0000-0000-0000-000000000005", "Bộ quà tặng Root Further",  "2026-03-26 23:00:00+00"),
    ("bb000001-0000-0000-0000-000000000006", "a0000001-0000-0000-0000-000000000001", "Túi vải Root Further",      "2026-03-25 23:00:00+00"),
    ("bb000001-0000-0000-0000-000000000007", "a0000001-0000-0000-0000-000000000002", "Bút Root Further",          "2026-03-24 23:00:00+00"),
    ("bb000001-0000-0000-0000-000000000008", "a0000001-0000-0000-0000-000000000003", "Sổ tay Root Further",       "2026-03-23 23:00:00+00"),
    ("bb000001-0000-0000-0000-000000000009", "a0000001-0000-0000-0000-000000000004", "Khăn Root Further",         "2026-03-22 23:00:00+00"),
    ("bb000001-0000-0000-0000-000000000010", "a0000001-0000-0000-0000-000000000005", "Lắc tay Root Further",      "2026-03-21 23:00:00+00"),
]

sql = """
INSERT INTO public.secret_boxes (id, user_id, is_opened, gift_title, created_at)
VALUES (%s, %s, true, %s, %s)
ON CONFLICT (id) DO NOTHING
"""

with psycopg2.connect(DSN) as conn:
    with conn.cursor() as cur:
        for row in rows:
            cur.execute(sql, row)
    conn.commit()

print(f"Inserted {len(rows)} secret box rows.")
