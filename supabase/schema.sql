-- 1. Profiles Table
CREATE TABLE public.Profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    total_points INTEGER DEFAULT 0 NOT NULL,
    streak_count INTEGER DEFAULT 0 NOT NULL,
    best_streak INTEGER DEFAULT 0 NOT NULL,
    last_attempt_date DATE,
    company_health_tier TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Quizzes Table
-- This table stores the secret answers, so it is strictly protected by RLS.
CREATE TABLE public.Quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('market_shift', 'product_failure', 'competitor_move')),
    prompt TEXT NOT NULL,
    option_best TEXT NOT NULL,
    option_better TEXT NOT NULL,
    option_good TEXT NOT NULL,
    option_worst TEXT NOT NULL,
    active_date DATE NOT NULL,
    created_by UUID
);

-- 3. User_Scores Table
CREATE TABLE public.User_Scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.Profiles(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES public.Quizzes(id) ON DELETE CASCADE,
    chosen_option TEXT NOT NULL CHECK (chosen_option IN ('best', 'better', 'good', 'worst')),
    points_awarded INTEGER NOT NULL CHECK (points_awarded IN (0, 10, 30, 60)),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (user_id, quiz_id)
);

-- 4. Indexes (from PRD scaling notes)
CREATE INDEX user_scores_user_id_created_at_idx ON public.User_Scores (user_id, created_at);
CREATE INDEX user_scores_created_at_idx ON public.User_Scores (created_at);
CREATE INDEX quizzes_active_date_idx ON public.Quizzes (active_date);

-- 5. Row Level Security (RLS)
ALTER TABLE public.Profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.User_Scores ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only read and update their own profile.
CREATE POLICY "Users can view own profile" ON public.Profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.Profiles FOR UPDATE USING (auth.uid() = id);

-- Quizzes: NO CLIENT POLICIES! 
-- To prevent client-side cheating, Quizzes can only be queried by Edge Functions using the Service Role key.

-- User_Scores: Users can read their own scores. 
-- Submissions are insert-only via Edge Functions, so no insert/update policies are provided to the client.
CREATE POLICY "Users can view own scores" ON public.User_Scores FOR SELECT USING (auth.uid() = user_id);

-- 6. Trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.Profiles (id, display_name)
  VALUES (new.id, new.raw_user_meta_data->>'display_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
