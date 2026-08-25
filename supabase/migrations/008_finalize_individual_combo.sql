-- Finalize the individual combo: ₹350 for exactly Profile Architect, Prompt Perfect, and Memergency.
UPDATE event_combos
SET
  name = '3-Event Individual Access Pass',
  description = 'One single all-access pass for ₹350 that grants complete official entry to three individual events across both days: Profile Architect, Prompt Perfect, and Memergency.',
  price = 350.00,
  original_price = 450.00,
  savings = 100.00,
  is_active = true
WHERE slug = 'combo-individual-all-access';

DELETE FROM combo_events
WHERE combo_id = (SELECT id FROM event_combos WHERE slug = 'combo-individual-all-access');

INSERT INTO combo_events (combo_id, event_id)
SELECT c.id, e.id
FROM event_combos c
JOIN events e ON e.slug IN ('tech-profile-architect', 'nontech-prompt-perfect', 'nontech-memergency')
WHERE c.slug = 'combo-individual-all-access'
ON CONFLICT (combo_id, event_id) DO NOTHING;
