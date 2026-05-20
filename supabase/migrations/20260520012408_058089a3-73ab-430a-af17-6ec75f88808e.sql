ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS drive_file_id TEXT,
  ADD COLUMN IF NOT EXISTS drive_view_url TEXT,
  ADD COLUMN IF NOT EXISTS drive_thumbnail_url TEXT,
  ALTER COLUMN storage_path DROP NOT NULL;