-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  skills TEXT[],
  experience_years INTEGER DEFAULT 0,
  target_role TEXT,
  education TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resume_analysis table
CREATE TABLE public.resume_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  analysis_result JSONB,
  score INTEGER,
  suggestions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coding_attempts table
CREATE TABLE public.coding_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT NOT NULL,
  question_title TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  language TEXT NOT NULL,
  code TEXT NOT NULL,
  passed BOOLEAN DEFAULT false,
  score INTEGER,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create aptitude_test_results table
CREATE TABLE public.aptitude_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  test_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  time_taken_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create interview_results table
CREATE TABLE public.interview_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  interview_type TEXT NOT NULL,
  round INTEGER DEFAULT 1,
  questions JSONB,
  answers JSONB,
  feedback JSONB,
  overall_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_history table for career guidance
CREATE TABLE public.chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aptitude_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Resume analysis RLS policies
CREATE POLICY "Users can view their own resume analysis" ON public.resume_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own resume analysis" ON public.resume_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own resume analysis" ON public.resume_analysis FOR DELETE USING (auth.uid() = user_id);

-- Coding attempts RLS policies
CREATE POLICY "Users can view their own coding attempts" ON public.coding_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own coding attempts" ON public.coding_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Aptitude test results RLS policies
CREATE POLICY "Users can view their own aptitude results" ON public.aptitude_test_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own aptitude results" ON public.aptitude_test_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Interview results RLS policies
CREATE POLICY "Users can view their own interview results" ON public.interview_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own interview results" ON public.interview_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat history RLS policies
CREATE POLICY "Users can view their own chat history" ON public.chat_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own chat history" ON public.chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own chat history" ON public.chat_history FOR UPDATE USING (auth.uid() = user_id);

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-creating profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chat_history_updated_at BEFORE UPDATE ON public.chat_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();