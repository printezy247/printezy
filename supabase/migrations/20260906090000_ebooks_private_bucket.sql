-- Private storage bucket for the ebook PDFs (created in production on
-- 2026-09-06 via Lovable Cloud). No storage.objects policies are added on
-- purpose: only the service-role server client reads it, handing signed
-- URLs to signed-in users whose ebook_claims row is approved
-- (src/lib/ebook-claims.functions.ts getEbookDownloadUrl).
--
-- Objects expected (upload through Lovable Cloud -> Storage -> ebooks):
--   mapping-like-a-pro.pdf
--   technical-analysis.pdf
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ebooks', 'ebooks', false, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;
