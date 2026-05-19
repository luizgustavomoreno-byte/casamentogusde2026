
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.memory_type AS ENUM ('image', 'video');
CREATE TYPE public.memory_moment AS ENUM ('ceremonia', 'festa', 'pista');
CREATE TYPE public.memory_visibility AS ENUM ('public', 'private');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles visíveis para autenticados"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "usuário atualiza próprio profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "usuário vê próprios papéis"
  ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin vê todos papéis"
  ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ MEMORIES ============
CREATE TABLE public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.memory_type NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  moment public.memory_moment NOT NULL DEFAULT 'ceremonia',
  visibility public.memory_visibility NOT NULL DEFAULT 'public',
  message TEXT,
  hidden BOOLEAN NOT NULL DEFAULT false,
  flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_memories_created ON public.memories (created_at DESC);
CREATE INDEX idx_memories_user ON public.memories (user_id);
CREATE INDEX idx_memories_moment ON public.memories (moment);
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ver públicas visíveis"
  ON public.memories FOR SELECT TO authenticated
  USING (visibility = 'public' AND hidden = false);
CREATE POLICY "ver próprias"
  ON public.memories FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "admin vê tudo"
  ON public.memories FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "criar próprias"
  ON public.memories FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "editar próprias"
  ON public.memories FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "admin edita tudo"
  ON public.memories FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin deleta tudo"
  ON public.memories FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ LIKES ============
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (memory_id, user_id)
);
CREATE INDEX idx_likes_memory ON public.likes (memory_id);
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ver likes de fotos visíveis"
  ON public.likes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memories m
      WHERE m.id = memory_id
        AND (
          (m.visibility = 'public' AND m.hidden = false)
          OR m.user_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );
CREATE POLICY "curtir requer login"
  ON public.likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "deletar própria curtida"
  ON public.likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============ COMMENTS ============
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) <= 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_memory ON public.comments (memory_id, created_at);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ver comentários de fotos visíveis"
  ON public.comments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memories m
      WHERE m.id = memory_id
        AND (
          (m.visibility = 'public' AND m.hidden = false)
          OR m.user_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );
CREATE POLICY "comentar requer login"
  ON public.comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "deletar próprio comentário"
  ON public.comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ============ TRIGGER: sincroniza profile + auto-admin ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  admin_emails TEXT[] := ARRAY['luiz@bildennegocios.com.br'];
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        email = EXCLUDED.email,
        avatar_url = EXCLUDED.avatar_url;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;

  IF NEW.email = ANY(admin_emails) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public) VALUES ('memories', 'memories', false);

CREATE POLICY "autenticados leem memories"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'memories');
CREATE POLICY "autenticados sobem para própria pasta"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'memories'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "deletar próprios arquivos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'memories'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- ============ REALTIME ============
ALTER TABLE public.memories REPLICA IDENTITY FULL;
ALTER TABLE public.likes REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.memories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
