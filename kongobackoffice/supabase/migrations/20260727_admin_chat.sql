-- ============================================================
-- Migration KONGO : Chat Agence & Superuser (Contacts & Sépation Stricte)
-- ============================================================
-- 1. Le Superuser ne communique qu'avec l'Admin d'Agence ('agency').
-- 2. L'Admin d'Agence ('agency') communique avec le Superuser ET avec les membres de son agence (chef, cashier).
-- 3. Les Chefs et Caissiers communiquent uniquement avec les membres de leur agence,
--    et ne voient JAMAIS les échanges avec le Superuser.
-- ============================================================

-- ---------------------------------------------------------------------------
-- 1. TABLE admin_chat_messages (avec recipient_id & recipient_role)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_chat_messages (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id        uuid        NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  sender_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role      text        NOT NULL CHECK (sender_role IN ('agency', 'superuser', 'chef', 'cashier')),
  sender_name      text        NOT NULL DEFAULT '',
  recipient_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_role   text        CHECK (recipient_role IN ('superuser', 'agency', 'chef', 'cashier', 'agency_internal')),
  message          text,
  attachment_url   text,
  attachment_type  text        CHECK (attachment_type IN ('image', 'document')),
  attachment_name  text,
  is_read          boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT admin_chat_check_content CHECK (
    message IS NOT NULL OR attachment_url IS NOT NULL
  )
);

-- Ajouter les colonnes destinataires si la table existait déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_chat_messages' AND column_name = 'recipient_id'
  ) THEN
    ALTER TABLE public.admin_chat_messages ADD COLUMN recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_chat_messages' AND column_name = 'recipient_role'
  ) THEN
    ALTER TABLE public.admin_chat_messages ADD COLUMN recipient_role text CHECK (recipient_role IN ('superuser', 'agency', 'chef', 'cashier', 'agency_internal'));
  END IF;
END $$;

-- Mettre à jour les contraintes CHECK
DO $$
BEGIN
  ALTER TABLE public.admin_chat_messages DROP CONSTRAINT IF EXISTS admin_chat_messages_sender_role_check;
  ALTER TABLE public.admin_chat_messages ADD CONSTRAINT admin_chat_messages_sender_role_check
    CHECK (sender_role IN ('agency', 'superuser', 'chef', 'cashier'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Index performance
CREATE INDEX IF NOT EXISTS admin_chat_agency_id_idx
  ON public.admin_chat_messages (agency_id, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_chat_recipient_idx
  ON public.admin_chat_messages (agency_id, recipient_id, sender_id);

CREATE INDEX IF NOT EXISTS admin_chat_unread_idx
  ON public.admin_chat_messages (agency_id, recipient_id, is_read)
  WHERE is_read = false;

-- ---------------------------------------------------------------------------
-- 2. AJOUT DE LA COLONNE agency_id DANS PROFILES (si absent)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'agency_id'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN agency_id uuid REFERENCES public.agencies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------------------
ALTER TABLE public.admin_chat_messages ENABLE ROW LEVEL SECURITY;

-- ---- SELECT ----------------------------------------------------------------
DROP POLICY IF EXISTS "admin_chat_select" ON public.admin_chat_messages;
CREATE POLICY "admin_chat_select"
  ON public.admin_chat_messages FOR SELECT
  TO authenticated
  USING (
    -- Superuser : voit uniquement les messages destinés ou envoyés par le superuser
    (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'superuser'
      )
      AND (sender_role = 'superuser' OR recipient_role = 'superuser')
    )
    OR
    -- Admin d'Agence ('agency') : voit TOUS les messages de son agence
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'agency'
        AND p.agency_id = admin_chat_messages.agency_id
    )
    OR
    -- Chef et Caissier ('chef', 'cashier') : voient les messages de leur agence SANS ceux du superuser
    (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('chef', 'cashier')
          AND p.agency_id = admin_chat_messages.agency_id
      )
      AND sender_role != 'superuser'
      AND (recipient_role != 'superuser' OR recipient_role IS NULL)
    )
  );

-- ---- INSERT ----------------------------------------------------------------
DROP POLICY IF EXISTS "admin_chat_insert" ON public.admin_chat_messages;
CREATE POLICY "admin_chat_insert"
  ON public.admin_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Superuser : écrit avec sender_role = 'superuser'
    (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'superuser'
      )
      AND sender_role = 'superuser'
      AND sender_id = auth.uid()
    )
    OR
    -- Admin d'Agence ('agency') : écrit dans son agence (vers superuser ou membres internes)
    (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'agency'
          AND p.agency_id = admin_chat_messages.agency_id
      )
      AND sender_role = 'agency'
      AND sender_id = auth.uid()
    )
    OR
    -- Chef et Caissier ('chef', 'cashier') : écrivent dans leur agence SANS destination superuser
    (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role IN ('chef', 'cashier')
          AND p.agency_id = admin_chat_messages.agency_id
      )
      AND sender_role IN ('chef', 'cashier')
      AND sender_id = auth.uid()
      AND (recipient_role != 'superuser' OR recipient_role IS NULL)
    )
  );

-- ---- UPDATE (marquage is_read) ---------------------------------------------
DROP POLICY IF EXISTS "admin_chat_update_read" ON public.admin_chat_messages;
CREATE POLICY "admin_chat_update_read"
  ON public.admin_chat_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (
          p.role = 'superuser'
          OR p.agency_id = admin_chat_messages.agency_id
        )
    )
  )
  WITH CHECK (is_read = true);

-- ---------------------------------------------------------------------------
-- 4. REALTIME PUBLICATION
-- ---------------------------------------------------------------------------
ALTER TABLE public.admin_chat_messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'admin_chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_chat_messages;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5. STORAGE BUCKET — kongo-chat-attachments
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kongo-chat-attachments',
  'kongo-chat-attachments',
  true,
  10485760, -- 10 MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "kongo_chat_attach_select" ON storage.objects;
CREATE POLICY "kongo_chat_attach_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kongo-chat-attachments');

DROP POLICY IF EXISTS "kongo_chat_attach_insert" ON storage.objects;
CREATE POLICY "kongo_chat_attach_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'kongo-chat-attachments'
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'superuser'
      )
      OR
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND (storage.foldername(name))[1] = p.agency_id::text
      )
    )
  );

DROP POLICY IF EXISTS "kongo_chat_attach_delete" ON storage.objects;
CREATE POLICY "kongo_chat_attach_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'kongo-chat-attachments'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'superuser'
    )
  );
