CREATE TABLE journal_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  symbol        text REFERENCES tickers(symbol) ON DELETE SET NULL,
  direction     text CHECK (direction IN ('long', 'short', 'call', 'put')),
  status        text NOT NULL DEFAULT 'watching' CHECK (status IN ('watching', 'open', 'closed')),
  entry_price   numeric,
  exit_price    numeric,
  shares        numeric,
  thesis        text NOT NULL,
  outcome_notes text,
  tags          text[] NOT NULL DEFAULT '{}'
);

CREATE INDEX journal_entries_symbol_idx ON journal_entries (symbol);
CREATE INDEX journal_entries_created_at_idx ON journal_entries (created_at DESC);
