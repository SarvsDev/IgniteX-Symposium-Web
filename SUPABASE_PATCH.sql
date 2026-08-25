-- IgniteX '26 pricing + event timing cleanup
-- Run this in Supabase SQL Editor.
UPDATE public.events
SET entry_fee = 300
WHERE id IN ('tech-neural-rush', 'tech-poster-xpo');

-- Optional verification:
SELECT id, title, entry_fee
FROM public.events
WHERE id IN ('tech-neural-rush', 'tech-poster-xpo');
