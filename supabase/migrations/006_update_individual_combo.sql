-- Update the individual combo to include only Profile Architect, Prompt Perfect, and Memergency at ₹350.
UPDATE event_combos
SET
  name = '3-Event Individual Access Pass',
    description = 'One single all-access pass for ₹350 that grants complete official entry to three individual events across both days: Profile Architect, Prompt Perfect, and Memergency.',
    price = 350.00,
    original_price = 450.00,
    savings = 100.00
WHERE slug = 'combo-individual-all-access';

DELETE FROM combo_events
WHERE combo_id = (SELECT id FROM event_combos WHERE slug = 'combo-individual-all-access')
  AND event_id IN (SELECT id FROM events WHERE slug = 'tech-neural-rush');

INSERT INTO combo_events (combo_id, event_id)
SELECT c.id, e.id
FROM event_combos c, events e
WHERE c.slug = 'combo-individual-all-access'
  AND e.slug IN ('tech-profile-architect', 'nontech-prompt-perfect', 'nontech-memergency')
ON CONFLICT (combo_id, event_id) DO NOTHING;