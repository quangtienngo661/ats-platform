-- One default AI config per ORGANIZATION, replacing the global "one default in the whole
-- system" index from 20260321101500_ai_config_default_partial_unique.
--
-- Since GĐ1 Tuần 2 the default is per organization: screening falls back to the default
-- of the application's organization, and every new organization is created with its own.
-- The global index made that impossible — creating a second organization failed on its
-- default config. Prisma cannot express a partial index, so it lives only here, not in
-- schema.prisma.

CREATE UNIQUE INDEX "ai_configs_one_default_per_organization_idx"
    ON "ai_configs" ("organization_id")
    WHERE "is_default" = true;

DROP INDEX IF EXISTS "ai_configs_only_one_default_idx";
