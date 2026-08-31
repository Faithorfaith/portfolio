-- Add hero image columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS hero_image_1 text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS hero_image_2 text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS hero_image_3 text DEFAULT NULL;
