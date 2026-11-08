-- Rebrand GoHackerz -> RepoRally in stored (database) content.
-- Run in the Supabase dashboard: SQL Editor. Run STEP 1 first and look at the counts,
-- then run STEP 2. It only touches brand mentions, nothing else in the text.
-- Table names are Prisma's defaults (see prisma/schema.prisma).

-- ── STEP 1: dry run — how many rows mention the old brand ──────────────────
SELECT 'Article' AS tbl, count(*) AS rows_to_change FROM "Article"
  WHERE content::text ~* 'gohackerz' OR title ~* 'gohackerz' OR dek ~* 'gohackerz'
     OR "seoTitle" ~* 'gohackerz' OR "seoDescription" ~* 'gohackerz'
UNION ALL SELECT 'User', count(*) FROM "User"
  WHERE bio ~* 'gohackerz' OR name ~* 'gohackerz' OR company ~* 'gohackerz'
UNION ALL SELECT 'Hackathon', count(*) FROM "Hackathon"
  WHERE concat_ws(' ', title, tagline, description, tracks::text, rules::text,
                  faqs::text, sponsors::text) ~* 'gohackerz'
UNION ALL SELECT 'HackathonCertificate', count(*) FROM "HackathonCertificate"
  WHERE concat_ws(' ', title, "awardTitle") ~* 'gohackerz'
UNION ALL SELECT 'Comment', count(*) FROM "Comment" WHERE body ~* 'gohackerz'
UNION ALL SELECT 'WallNote', count(*) FROM "WallNote" WHERE msg ~* 'gohackerz' OR name ~* 'gohackerz';

-- ── STEP 2: apply (runs as one transaction; if anything errors nothing changes) ──
BEGIN;

-- order matters: the domain first, then the brand name in its two spellings
CREATE OR REPLACE FUNCTION pg_temp.rb(t text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT replace(replace(replace(replace(t,
    'gohackerz.com', 'reporally.com'),
    'GoHackerZ', 'RepoRally'),
    'GoHackerz', 'RepoRally'),
    'gohackerz', 'reporally')
$$;

UPDATE "Article" SET
  title = pg_temp.rb(title),
  dek = pg_temp.rb(dek),
  "seoTitle" = pg_temp.rb("seoTitle"),
  "seoDescription" = pg_temp.rb("seoDescription"),
  content = pg_temp.rb(content::text)::jsonb
WHERE content::text ~* 'gohackerz' OR title ~* 'gohackerz' OR dek ~* 'gohackerz'
   OR "seoTitle" ~* 'gohackerz' OR "seoDescription" ~* 'gohackerz';

UPDATE "User" SET bio = pg_temp.rb(bio), name = pg_temp.rb(name), company = pg_temp.rb(company)
WHERE bio ~* 'gohackerz' OR name ~* 'gohackerz' OR company ~* 'gohackerz';

UPDATE "Hackathon" SET
  title = pg_temp.rb(title), tagline = pg_temp.rb(tagline), description = pg_temp.rb(description),
  tracks = pg_temp.rb(tracks::text)::jsonb, rules = pg_temp.rb(rules::text)::jsonb,
  faqs = pg_temp.rb(faqs::text)::jsonb, sponsors = pg_temp.rb(sponsors::text)::jsonb
WHERE concat_ws(' ', title, tagline, description, tracks::text, rules::text,
                faqs::text, sponsors::text) ~* 'gohackerz';

UPDATE "HackathonCertificate" SET title = pg_temp.rb(title), "awardTitle" = pg_temp.rb("awardTitle")
WHERE concat_ws(' ', title, "awardTitle") ~* 'gohackerz';

UPDATE "Comment" SET body = pg_temp.rb(body) WHERE body ~* 'gohackerz';
UPDATE "WallNote" SET msg = pg_temp.rb(msg), name = pg_temp.rb(name)
WHERE msg ~* 'gohackerz' OR name ~* 'gohackerz';

COMMIT;

-- ── STEP 3: check — every count should now be 0 (re-run STEP 1) ────────────
