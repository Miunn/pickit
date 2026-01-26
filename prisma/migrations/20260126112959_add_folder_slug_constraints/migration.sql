-- This is an empty migration.
-- Backfill slugs for existing rows to satisfy NOT NULL + UNIQUE
-- UPDATE "Folder"
-- SET "slug" =
-- 	COALESCE(
-- 		NULLIF(regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g'), ''),
-- 		'folder'
-- 	) || '-' || substring("id"::text, 1, 6)
-- WHERE "slug" IS NULL;

-- 1) Constraint function: ensure a folder has at least one slug at commit
CREATE OR REPLACE FUNCTION folder_must_have_slug()
RETURNS trigger AS $$
DECLARE
  fid TEXT;
BEGIN
  -- Only check for INSERT/UPDATE of Folder rows. (DELETE of Folder should be allowed.)
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    fid := NEW.id;
    IF NOT EXISTS (
      SELECT 1 FROM "FolderSlug" WHERE "folderId" = fid
    ) THEN
      RAISE EXCEPTION 'Folder % must have at least one slug', fid;
    END IF;
  END IF;

  -- Constraint triggers return NULL
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the deferrable constraint trigger on Folder.
CREATE CONSTRAINT TRIGGER trg_folder_must_have_slug
AFTER INSERT OR UPDATE ON "Folder"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION folder_must_have_slug();

-- 2) Helper trigger: touch Folder when its slugs change so the deferred constraint runs
CREATE OR REPLACE FUNCTION touch_folder_for_slug_change()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "Folder" SET "updatedAt" = now() WHERE id = NEW."folderId";
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "Folder" SET "updatedAt" = now() WHERE id = OLD."folderId";
  ELSIF TG_OP = 'UPDATE' THEN
    -- If the slug moved between folders, touch both folders
    IF (NEW."folderId" IS DISTINCT FROM OLD."folderId") THEN
      UPDATE "Folder" SET "updatedAt" = now() WHERE id IN (OLD."folderId", NEW."folderId");
    ELSE
      UPDATE "Folder" SET "updatedAt" = now() WHERE id = NEW."folderId";
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_touch_folder_for_slug_change
AFTER INSERT OR UPDATE OR DELETE ON "FolderSlug"
FOR EACH ROW
EXECUTE FUNCTION touch_folder_for_slug_change();
