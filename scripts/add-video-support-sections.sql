-- Add video_url column to case_studies sections JSONB
-- This allows each section to have an optional video field

-- Since sections is a JSONB array, we'll document the schema change
-- Each section can now include:
-- {
--   "id": "uuid",
--   "label": "string",
--   "title": "string",
--   "body": "string",
--   "toc": "string",
--   "image": "string",
--   "video_url": "string (optional)",
--   "blocks": "array (optional)"
-- }

-- No database schema change needed - just update application code to support video_url field in sections
-- Videos will be stored as URLs in the sections JSONB structure
