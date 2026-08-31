-- Add video_url column to case_studies table
ALTER TABLE case_studies 
ADD COLUMN IF NOT EXISTS video_url text;

-- Add media_type column to track whether it's image or video
ALTER TABLE case_studies 
ADD COLUMN IF NOT EXISTS media_type text DEFAULT 'image';
