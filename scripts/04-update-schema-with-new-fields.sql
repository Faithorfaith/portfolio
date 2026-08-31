-- Update portfolio_works table to add type and name fields
ALTER TABLE portfolio_works
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Untitled',
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'Design',
ADD COLUMN IF NOT EXISTS brief_info TEXT;

-- Update case_studies table to add sections for page builder
ALTER TABLE case_studies
ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS nav_items JSONB DEFAULT '[]'::jsonb;

-- Update writing table to add sections similar to case studies
ALTER TABLE writing
ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS nav_items JSONB DEFAULT '[]'::jsonb;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolio_works_order ON portfolio_works(order_index);
CREATE INDEX IF NOT EXISTS idx_case_studies_published ON case_studies(published);
CREATE INDEX IF NOT EXISTS idx_writing_order ON writing(order_index);

-- Update RLS policies if needed (should already be in place)
-- Portfolio works should be public readable
ALTER TABLE portfolio_works ENABLE ROW LEVEL SECURITY;

-- Case studies should be public readable when published
ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;

-- Writing should be public readable
ALTER TABLE writing ENABLE ROW LEVEL SECURITY;
