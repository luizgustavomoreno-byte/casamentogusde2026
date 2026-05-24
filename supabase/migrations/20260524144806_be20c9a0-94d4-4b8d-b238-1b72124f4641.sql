
-- 1) Hide profiles.email from other users via column privileges
REVOKE SELECT (email) ON public.profiles FROM authenticated, anon;

-- 2) Tighten storage.objects SELECT for the 'memories' bucket
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'storage.objects'::regclass
      AND polcmd = 'r'
      AND pg_get_expr(polqual, polrelid) ILIKE '%memories%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.polname);
  END LOOP;
END$$;

CREATE POLICY "memories: owner or public visible read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'memories'
  AND EXISTS (
    SELECT 1 FROM public.memories m
    WHERE m.storage_path = storage.objects.name
      AND (
        m.user_id = auth.uid()
        OR (m.visibility = 'public' AND m.hidden = false)
        OR public.has_role(auth.uid(), 'admin'::app_role)
      )
  )
);

-- 3) Realtime channel authorization: require authenticated subscribers
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated can receive realtime" ON realtime.messages;
CREATE POLICY "authenticated can receive realtime"
ON realtime.messages FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);
