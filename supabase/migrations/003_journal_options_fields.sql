ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS expiry date,
  ADD COLUMN IF NOT EXISTS strike numeric;
