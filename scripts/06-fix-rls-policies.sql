-- Fix RLS policies to work with both authenticated users and service role
-- This ensures all tables are properly secured but still accessible via APIs

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "profiles_are_public" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "portfolio_works_are_public" ON public.portfolio_works;
DROP POLICY IF EXISTS "users_can_manage_own_works" ON public.portfolio_works;
DROP POLICY IF EXISTS "users_can_update_own_works" ON public.portfolio_works;
DROP POLICY IF EXISTS "users_can_delete_own_works" ON public.portfolio_works;
DROP POLICY IF EXISTS "projects_are_public" ON public.projects;
DROP POLICY IF EXISTS "users_can_manage_own_projects" ON public.projects;
DROP POLICY IF EXISTS "users_can_update_own_projects" ON public.projects;
DROP POLICY IF EXISTS "users_can_delete_own_projects" ON public.projects;
DROP POLICY IF EXISTS "writing_is_public" ON public.writing;
DROP POLICY IF EXISTS "users_can_manage_own_writing" ON public.writing;
DROP POLICY IF EXISTS "users_can_update_own_writing" ON public.writing;
DROP POLICY IF EXISTS "users_can_delete_own_writing" ON public.writing;
DROP POLICY IF EXISTS "case_studies_are_public" ON public.case_studies;
DROP POLICY IF EXISTS "users_can_manage_own_case_studies" ON public.case_studies;
DROP POLICY IF EXISTS "users_can_update_own_case_studies" ON public.case_studies;
DROP POLICY IF EXISTS "users_can_delete_own_case_studies" ON public.case_studies;
DROP POLICY IF EXISTS "portfolio_tools_are_public" ON public.portfolio_tools;
DROP POLICY IF EXISTS "users_can_manage_own_tools" ON public.portfolio_tools;
DROP POLICY IF EXISTS "users_can_update_own_tools" ON public.portfolio_tools;
DROP POLICY IF EXISTS "users_can_delete_own_tools" ON public.portfolio_tools;

-- Profiles: Public read, authenticated write
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Portfolio Works: Public read, authenticated write
CREATE POLICY "portfolio_works_select" ON public.portfolio_works FOR SELECT USING (true);
CREATE POLICY "portfolio_works_insert" ON public.portfolio_works FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "portfolio_works_update" ON public.portfolio_works FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "portfolio_works_delete" ON public.portfolio_works FOR DELETE USING (auth.uid() = user_id);

-- Projects: Public read, authenticated write
CREATE POLICY "projects_select" ON public.projects FOR SELECT USING (true);
CREATE POLICY "projects_insert" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_update" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "projects_delete" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Writing: Public read, authenticated write
CREATE POLICY "writing_select" ON public.writing FOR SELECT USING (true);
CREATE POLICY "writing_insert" ON public.writing FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "writing_update" ON public.writing FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "writing_delete" ON public.writing FOR DELETE USING (auth.uid() = user_id);

-- Case Studies: Published case studies public read, authenticated write
CREATE POLICY "case_studies_select" ON public.case_studies FOR SELECT USING (published = true OR auth.uid() = user_id);
CREATE POLICY "case_studies_insert" ON public.case_studies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "case_studies_update" ON public.case_studies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "case_studies_delete" ON public.case_studies FOR DELETE USING (auth.uid() = user_id);

-- Portfolio Tools: Public read, authenticated write
CREATE POLICY "portfolio_tools_select" ON public.portfolio_tools FOR SELECT USING (true);
CREATE POLICY "portfolio_tools_insert" ON public.portfolio_tools FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "portfolio_tools_update" ON public.portfolio_tools FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "portfolio_tools_delete" ON public.portfolio_tools FOR DELETE USING (auth.uid() = user_id);
