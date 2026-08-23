-- Full-text search: GIN index over title + dek so searchArticles can
-- use websearch_to_tsquery with relevance ranking instead of naive ILIKE.
-- NOTE: expressions must be IMMUTABLE — to_tsvector needs an explicit ::regconfig
-- cast and array_to_string is only STABLE, so tags are excluded from the index
-- (they are still matched via the query's tag-fallback clause).
CREATE INDEX IF NOT EXISTS "Article_fts_idx"
  ON "Article"
  USING gin (
    to_tsvector(
      'english'::regconfig,
      "title" || ' ' || coalesce("dek", '')
    )
  );

-- Prefix-matching aid: lowercase title index for ILIKE 'q%' style lookups.
CREATE INDEX IF NOT EXISTS "Article_title_lower_idx"
  ON "Article" (lower("title"));
