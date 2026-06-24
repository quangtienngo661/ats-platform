-- Ensure only one AI config can be default at a time.
CREATE UNIQUE INDEX IF NOT EXISTS "ai_configs_only_one_default_idx"
ON "ai_configs" ("is_default")
WHERE "is_default" = true;
