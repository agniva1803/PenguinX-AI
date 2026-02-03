import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

interface CodingAttempt {
  id: string;
  question_title: string;
  difficulty: string;
  language: string;
  passed: boolean | null;
  score: number | null;
  created_at: string;
}

interface AptitudeResult {
  id: string;
  test_type: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  time_taken_seconds: number | null;
  created_at: string;
}

interface InterviewFeedback {
  communication?: string;
  content?: string;
  structure?: string;
  overallRecommendation?: string;
}

interface InterviewResult {
  id: string;
  interview_type: string;
  overall_score: number | null;
  round: number | null;
  feedback: InterviewFeedback | null;
  created_at: string;
}

interface ResumeAnalysisResult {
  score?: number;
  strengths?: string[];
  improvements?: string[];
  summary?: string;
}

interface ResumeAnalysis {
  id: string;
  file_name: string;
  score: number | null;
  suggestions: string[] | null;
  analysis_result: ResumeAnalysisResult | null;
  created_at: string;
}

interface InsightsStats {
  totalCodingAttempts: number;
  codingPassed: number;
  totalAptitudeTests: number;
  avgAptitudeScore: number;
  totalInterviews: number;
  avgInterviewScore: number;
  latestResumeScore: number | null;
}

export function useInsightsData() {
  const [codingAttempts, setCodingAttempts] = useState<CodingAttempt[]>([]);
  const [aptitudeResults, setAptitudeResults] = useState<AptitudeResult[]>([]);
  const [interviewResults, setInterviewResults] = useState<InterviewResult[]>([]);
  const [resumeAnalyses, setResumeAnalyses] = useState<ResumeAnalysis[]>([]);
  const [stats, setStats] = useState<InsightsStats>({
    totalCodingAttempts: 0,
    codingPassed: 0,
    totalAptitudeTests: 0,
    avgAptitudeScore: 0,
    totalInterviews: 0,
    avgInterviewScore: 0,
    latestResumeScore: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Fetch all data in parallel
      const [codingRes, aptitudeRes, interviewRes, resumeRes] = await Promise.all([
        supabase
          .from("coding_attempts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("aptitude_test_results")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("interview_results")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("resume_analysis")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const coding = (codingRes.data || []) as CodingAttempt[];
      const aptitude = (aptitudeRes.data || []) as AptitudeResult[];
      const interviews = (interviewRes.data || []).map((item) => ({
        ...item,
        feedback: item.feedback as InterviewFeedback | null,
      })) as InterviewResult[];
      const resumes = (resumeRes.data || []).map((item) => ({
        ...item,
        analysis_result: item.analysis_result as ResumeAnalysisResult | null,
      })) as ResumeAnalysis[];

      setCodingAttempts(coding);
      setAptitudeResults(aptitude);
      setInterviewResults(interviews);
      setResumeAnalyses(resumes);

      // Calculate stats
      const codingPassed = coding.filter(c => c.passed).length;
      const avgAptitude = aptitude.length > 0 
        ? Math.round(aptitude.reduce((sum, a) => sum + a.score, 0) / aptitude.length)
        : 0;
      const avgInterview = interviews.length > 0
        ? Math.round(interviews.reduce((sum, i) => sum + (i.overall_score || 0), 0) / interviews.length)
        : 0;
      const latestResume = resumes.length > 0 ? resumes[0].score : null;

      setStats({
        totalCodingAttempts: coding.length,
        codingPassed,
        totalAptitudeTests: aptitude.length,
        avgAptitudeScore: avgAptitude,
        totalInterviews: interviews.length,
        avgInterviewScore: avgInterview,
        latestResumeScore: latestResume,
      });
    } catch (error) {
      console.error("Error fetching insights data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    codingAttempts,
    aptitudeResults,
    interviewResults,
    resumeAnalyses,
    stats,
    isLoading,
    refetch: fetchAllData,
  };
}
