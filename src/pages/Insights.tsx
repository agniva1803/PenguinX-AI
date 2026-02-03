import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, TrendingUp, Target, Trophy, Code, Brain, 
  Users, FileText, CheckCircle2, XCircle, Clock, Calendar
} from "lucide-react";
import { useInsightsData } from "@/hooks/useInsightsData";
import { motion } from "framer-motion";
import { format } from "date-fns";

const Insights = () => {
  const { 
    codingAttempts, 
    aptitudeResults, 
    interviewResults, 
    resumeAnalyses,
    stats, 
    isLoading 
  } = useInsightsData();

  const overallScore = Math.round(
    (stats.avgAptitudeScore + stats.avgInterviewScore + (stats.latestResumeScore || 0)) / 
    (stats.latestResumeScore ? 3 : 2) || 0
  );

  const difficultyColor: Record<string, string> = {
    easy: "bg-success/10 text-success border-success/20",
    medium: "bg-warning/10 text-warning border-warning/20",
    hard: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Insights & Analytics
          </h1>
          <p className="text-muted-foreground">
            Track your progress across coding, aptitude, and interview preparation
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} variant="elevated">
                <CardContent className="p-6">
                  <Skeleton className="w-8 h-8 rounded-full mb-3" />
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card variant="elevated">
                <CardContent className="p-6 text-center">
                  <Code className="w-8 h-8 mx-auto text-primary mb-3" />
                  <div className="text-2xl font-bold text-foreground">
                    {stats.codingPassed}/{stats.totalCodingAttempts}
                  </div>
                  <div className="text-sm text-muted-foreground">Problems Passed</div>
                </CardContent>
              </Card>
              <Card variant="elevated">
                <CardContent className="p-6 text-center">
                  <Brain className="w-8 h-8 mx-auto text-warning mb-3" />
                  <div className="text-2xl font-bold text-foreground">
                    {stats.avgAptitudeScore}%
                  </div>
                  <div className="text-sm text-muted-foreground">Aptitude Score</div>
                </CardContent>
              </Card>
              <Card variant="elevated">
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 mx-auto text-accent mb-3" />
                  <div className="text-2xl font-bold text-foreground">
                    {stats.avgInterviewScore}%
                  </div>
                  <div className="text-sm text-muted-foreground">Interview Score</div>
                </CardContent>
              </Card>
              <Card variant="elevated">
                <CardContent className="p-6 text-center">
                  <Trophy className="w-8 h-8 mx-auto text-success mb-3" />
                  <div className="text-2xl font-bold text-foreground">
                    {overallScore}%
                  </div>
                  <div className="text-sm text-muted-foreground">Overall Score</div>
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>

        {/* Detailed Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs defaultValue="coding" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="coding" className="gap-2">
                <Code className="w-4 h-4" />
                <span className="hidden sm:inline">Coding</span>
              </TabsTrigger>
              <TabsTrigger value="aptitude" className="gap-2">
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">Aptitude</span>
              </TabsTrigger>
              <TabsTrigger value="interview" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Interview</span>
              </TabsTrigger>
              <TabsTrigger value="resume" className="gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Resume</span>
              </TabsTrigger>
            </TabsList>

            {/* Coding Tab */}
            <TabsContent value="coding">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-primary" />
                    Coding Attempts
                  </CardTitle>
                  <CardDescription>Your recent coding challenge submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array(3).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : codingAttempts.length === 0 ? (
                    <div className="text-center py-8">
                      <Code className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No coding attempts yet</p>
                      <p className="text-sm text-muted-foreground">Start solving problems to track your progress!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {codingAttempts.map((attempt) => (
                        <div
                          key={attempt.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                        >
                          <div className="flex items-center gap-4">
                            {attempt.passed ? (
                              <CheckCircle2 className="w-5 h-5 text-success" />
                            ) : (
                              <XCircle className="w-5 h-5 text-destructive" />
                            )}
                            <div>
                              <div className="font-medium">{attempt.question_title}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <span>{attempt.language}</span>
                                <span>•</span>
                                <span>{format(new Date(attempt.created_at), "MMM d, yyyy")}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={difficultyColor[attempt.difficulty] || difficultyColor.medium}>
                              {attempt.difficulty}
                            </Badge>
                            {attempt.score !== null && (
                              <span className="text-sm font-medium">{attempt.score}%</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aptitude Tab */}
            <TabsContent value="aptitude">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-warning" />
                    Aptitude Test Results
                  </CardTitle>
                  <CardDescription>Your performance across aptitude tests</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array(3).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : aptitudeResults.length === 0 ? (
                    <div className="text-center py-8">
                      <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No aptitude tests completed yet</p>
                      <p className="text-sm text-muted-foreground">Take a test to see your results here!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {aptitudeResults.map((result) => (
                        <div
                          key={result.id}
                          className="p-4 rounded-lg bg-secondary/50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="capitalize">
                                {result.test_type}
                              </Badge>
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(result.created_at), "MMM d, yyyy")}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">{result.score}%</div>
                              <div className="text-xs text-muted-foreground">
                                {result.correct_answers}/{result.total_questions} correct
                              </div>
                            </div>
                          </div>
                          <Progress value={result.score} className="h-2" />
                          {result.time_taken_seconds && (
                            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {Math.floor(result.time_taken_seconds / 60)}m {result.time_taken_seconds % 60}s
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Interview Tab */}
            <TabsContent value="interview">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent" />
                    Mock Interview Results
                  </CardTitle>
                  <CardDescription>Your interview practice sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array(3).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : interviewResults.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No interviews completed yet</p>
                      <p className="text-sm text-muted-foreground">Practice mock interviews to improve!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {interviewResults.map((result) => (
                        <div
                          key={result.id}
                          className="p-4 rounded-lg bg-secondary/50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="capitalize">
                                {result.interview_type}
                              </Badge>
                              {result.round && (
                                <span className="text-sm text-muted-foreground">
                                  Round {result.round}
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">
                                {result.overall_score || 0}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(result.created_at), "MMM d, yyyy")}
                              </div>
                            </div>
                          </div>
                          <Progress value={result.overall_score || 0} className="h-2 mb-2" />
                          {result.feedback && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {result.feedback.overallRecommendation || result.feedback.communication}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resume Tab */}
            <TabsContent value="resume">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Resume Analysis History
                  </CardTitle>
                  <CardDescription>Your resume improvement journey</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array(3).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : resumeAnalyses.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No resume analyses yet</p>
                      <p className="text-sm text-muted-foreground">Upload your resume to get AI feedback!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {resumeAnalyses.map((analysis) => (
                        <div
                          key={analysis.id}
                          className="p-4 rounded-lg bg-secondary/50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="font-medium">{analysis.file_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(analysis.created_at), "MMM d, yyyy 'at' h:mm a")}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${
                                (analysis.score || 0) >= 80 ? 'text-success' : 
                                (analysis.score || 0) >= 60 ? 'text-warning' : 'text-destructive'
                              }`}>
                                {analysis.score || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">score</div>
                            </div>
                          </div>
                          <Progress value={analysis.score || 0} className="h-2 mb-2" />
                          {analysis.analysis_result?.summary && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {analysis.analysis_result.summary}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Insights;
