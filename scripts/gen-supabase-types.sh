#!/bin/bash
# Regenerate Supabase TypeScript types from the remote project schema.
# Usage: bash scripts/gen-supabase-types.sh
set -e
PROJECT_ID="cfovebJxuhvznlselmvu"
npx supabase gen types typescript --project-id "$PROJECT_ID" --schema public \
  > src/lib/supabase/database.types.ts
echo "Types written to src/lib/supabase/database.types.ts"
