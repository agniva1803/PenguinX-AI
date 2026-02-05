-- Add DELETE policies for user data tables (GDPR compliance)

-- Aptitude test results
CREATE POLICY "Users can delete their own aptitude results" 
ON public.aptitude_test_results 
FOR DELETE 
USING (auth.uid() = user_id);

-- Interview results
CREATE POLICY "Users can delete their own interview results" 
ON public.interview_results 
FOR DELETE 
USING (auth.uid() = user_id);

-- Coding attempts
CREATE POLICY "Users can delete their own coding attempts" 
ON public.coding_attempts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Chat history
CREATE POLICY "Users can delete their own chat history" 
ON public.chat_history 
FOR DELETE 
USING (auth.uid() = user_id);