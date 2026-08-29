-- IgniteX '26 database sync patch
-- Run this once in the Supabase SQL Editor if the migrations are not being
-- replayed on the existing project.
--
-- Team limits are aligned with src/data/eventsData.ts.
-- This patch does not modify admin authentication.

-- Existing pricing cleanup.
UPDATE public.events
SET entry_fee = 300
WHERE id IN ('tech-neural-rush', 'tech-poster-xpo');

-- Team-size constraints.
UPDATE public.events
SET
  min_team_size = v.min_team_size,
  max_team_size = v.max_team_size,
  is_team_event = v.is_team_event
FROM (
  VALUES
    ('tech-crack-the-code', 2, 2, true),
    ('tech-neural-rush', 2, 2, true),
    ('tech-poster-xpo', 2, 3, true),
    ('tech-profile-architect', 1, 1, false),
    ('tech-zero-final-key', 2, 4, true),
    ('nontech-operation-bermuda', 4, 4, true),
    ('nontech-memergency', 1, 1, false),
    ('nontech-prompt-perfect', 1, 1, false),
    ('nontech-pitch-desk', 4, 4, true)
) AS v(slug, min_team_size, max_team_size, is_team_event)
WHERE public.events.slug = v.slug;

-- Verify the result.
SELECT
  slug,
  title,
  min_team_size,
  max_team_size,
  is_team_event
FROM public.events
WHERE slug IN (
  'tech-crack-the-code',
  'tech-neural-rush',
  'tech-poster-xpo',
  'tech-profile-architect',
  'tech-zero-final-key',
  'nontech-operation-bermuda',
  'nontech-memergency',
  'nontech-prompt-perfect',
  'nontech-pitch-desk'
)
ORDER BY slug;
