import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Play
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  expectedPoints: string[];
  difficulty: string;
}

interface QuestionFeedback {
  score: number;
  strengths: string[];
  improvements: string[];
  suggestion: string;
}

interface InterviewResult {
  overallScore: number;
  feedback: {
    communication: string;
    content: string;
    structure: string;
    overallRecommendation: string;
  };
  questionFeedback: Record<string, QuestionFeedback>;
}

const INTERVIEW_TYPES = [
  { 
    id: "technical", 
    title: "Technical Interview", 
    description: "Data structures, algorithms, and system design",
    icon: "💻",
    duration: 60
  },
  { 
    id: "hr", 
    title: "HR Interview", 
    description: "Behavioral questions and cultural fit",
    icon: "🤝",
    duration: 60
  },
  { 
    id: "group-discussion", 
    title: "Group Discussion", 
    description: "Leadership and teamwork assessment",
    icon: "👥",
    duration: 60
  },
];

export const InterviewPractice = () => {
  const [activeInterview, setActiveInterview] = useState<string | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(3600); // 60 minutes in seconds
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Cleanup media stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [stream]);

  const toggleVideo = async () => {
    if (isVideoOn) {
      if (stream) {
        stream.getVideoTracks().forEach(track => track.stop());
      }
      setIsVideoOn(false);
    } else {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: isAudioOn 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setIsVideoOn(true);
      } catch (error) {
        console.error("Error accessing camera:", error);
        toast({
          variant: "destructive",
          title: "Camera access denied",
          description: "Please allow camera access to practice with video.",
        });
      }
    }
  };

  const toggleAudio = async () => {
    if (isAudioOn) {
      if (stream) {
        stream.getAudioTracks().forEach(track => track.stop());
      }
      setIsAudioOn(false);
    } else {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: isVideoOn, 
          audio: true 
        });
        setStream(mediaStream);
        if (videoRef.current && isVideoOn) {
          videoRef.current.srcObject = mediaStream;
        }
        setIsAudioOn(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        toast({
          variant: "destructive",
          title: "Microphone access denied",
          description: "Please allow microphone access to practice speaking.",
        });
      }
    }
  };

  const startInterview = async (type: string) => {
    setIsLoading(true);
    setActiveInterview(type);
    setAnswers({});
    setResult(null);
    setCurrentIndex(0);
    setTimeRemaining(3600); // Reset to 60 minutes

    try {
      const { data, error } = await supabase.functions.invoke("interview-practice", {
        body: {
          action: "generate",
          interviewType: type,
          questionCount: 5,
        },
      });

      if (error) throw error;

      if (data?.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error generating interview:", error);
      toast({
        variant: "destructive",
        title: "Failed to start interview",
        description: "Please try again.",
      });
      setActiveInterview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAnswer = useCallback(() => {
    if (currentAnswer.trim() && questions[currentIndex]) {
      setAnswers(prev => ({
        ...prev,
        [questions[currentIndex].id]: currentAnswer,
      }));
    }
  }, [currentAnswer, questions, currentIndex]);

  const goToQuestion = (index: number) => {
    saveAnswer();
    setCurrentIndex(index);
    setCurrentAnswer(answers[questions[index]?.id] || "");
  };

  const handleSubmitInterview = useCallback(async () => {
    saveAnswer();
    setIsSubmitting(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    try {
      const finalAnswers = { 
        ...answers, 
        ...(questions[currentIndex] && currentAnswer ? { [questions[currentIndex].id]: currentAnswer } : {})
      };

      const { data, error } = await supabase.functions.invoke("interview-practice", {
        body: {
          action: "evaluate",
          interviewType: activeInterview,
          questions,
          answers: finalAnswers,
        },
      });

      if (error) throw error;

      setResult(data);

      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("interview_results").insert({
          user_id: user.id,
          interview_type: activeInterview!,
          questions: JSON.parse(JSON.stringify(questions)),
          answers: JSON.parse(JSON.stringify(finalAnswers)),
          feedback: JSON.parse(JSON.stringify(data.feedback)),
          overall_score: data.overallScore,
        });
      }

      // Stop media streams
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
        setIsVideoOn(false);
        setIsAudioOn(false);
      }

      toast({
        title: "Interview completed!",
        description: `Your overall score: ${data.overallScore}%`,
      });
    } catch (error) {
      console.error("Error evaluating interview:", error);
      toast({
        variant: "destructive",
        title: "Failed to evaluate interview",
        description: "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, currentAnswer, currentIndex, questions, activeInterview, stream, toast, saveAnswer]);

  // Timer effect
  useEffect(() => {
    if (activeInterview && questions.length > 0 && !result) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeInterview, questions.length, result, handleSubmitInterview]);

  const exitInterview = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setActiveInterview(null);
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setCurrentIndex(0);
    setIsVideoOn(false);
    setIsAudioOn(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Show interview type selection
  if (!activeInterview) {
    return (
      <div className="space-y-6">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              Mock Interviews
            </CardTitle>
            <CardDescription>Practice with AI-powered mock interviews and get real-time feedback</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {INTERVIEW_TYPES.map((interview) => (
              <Card key={interview.id} variant="interactive" className="p-4">
                <div className="text-center space-y-4">
                  <div className="text-4xl">{interview.icon}</div>
                  <div>
                    <h3 className="font-semibold text-foreground">{interview.title}</h3>
                    <p className="text-sm text-muted-foreground">{interview.description}</p>
                    <Badge variant="outline" className="mt-2">
                      <Clock className="w-3 h-3 mr-1" />
                      {interview.duration} min
                    </Badge>
                  </div>
                  <Button className="w-full" onClick={() => startInterview(interview.id)}>
                    <Play className="w-4 h-4 mr-2" />
                    Start Interview
                  </Button>
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card variant="elevated" className="p-12">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Preparing Interview</h3>
          <p className="text-muted-foreground">Setting up your mock interview session...</p>
        </div>
      </Card>
    );
  }

  // Show results
  if (result) {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
            Interview Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Summary */}
          <div className="text-center p-6 bg-muted rounded-lg">
            <div className="text-5xl font-bold text-primary mb-2">{result.overallScore}%</div>
            <p className="text-muted-foreground">Overall Performance Score</p>
          </div>

          <Progress value={result.overallScore} className="h-3" />

          {/* Feedback Categories */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Communication</h4>
              <p className="text-sm text-muted-foreground">{result.feedback.communication}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Content Quality</h4>
              <p className="text-sm text-muted-foreground">{result.feedback.content}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Answer Structure</h4>
              <p className="text-sm text-muted-foreground">{result.feedback.structure}</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg">
              <h4 className="font-semibold mb-2">Recommendation</h4>
              <p className="text-sm">{result.feedback.overallRecommendation}</p>
            </div>
          </div>

          {/* Question-wise Feedback */}
          <div>
            <h4 className="font-semibold mb-3">Question-wise Feedback</h4>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {questions.map((q, i) => {
                  const qFeedback = result.questionFeedback?.[q.id];
                  return (
                    <div key={q.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-sm">Q{i + 1}: {q.question}</span>
                        {qFeedback && (
                          <Badge variant={qFeedback.score >= 70 ? "default" : "secondary"}>
                            {qFeedback.score}%
                          </Badge>
                        )}
                      </div>
                      {qFeedback && (
                        <div className="text-xs space-y-1">
                          {qFeedback.strengths.length > 0 && (
                            <p className="text-success">✓ {qFeedback.strengths.join(", ")}</p>
                          )}
                          {qFeedback.improvements.length > 0 && (
                            <p className="text-warning">↑ {qFeedback.improvements.join(", ")}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <Button className="w-full" onClick={exitInterview}>
            Back to Interviews
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Active interview
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).filter(k => answers[k]?.trim()).length + (currentAnswer.trim() ? 1 : 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Video Panel */}
      <Card variant="elevated" className="lg:col-span-1">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Your Camera</CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span className={timeRemaining < 300 ? "text-destructive" : ""}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Video Preview */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {isVideoOn ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <VideoOff className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            
            {/* Recording indicator */}
            {(isVideoOn || isAudioOn) && (
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-destructive/90 text-destructive-foreground px-2 py-1 rounded text-xs">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Recording
              </div>
            )}
          </div>

          {/* Media Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isVideoOn ? "default" : "outline"}
              size="icon"
              onClick={toggleVideo}
            >
              {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </Button>
            <Button
              variant={isAudioOn ? "default" : "outline"}
              size="icon"
              onClick={toggleAudio}
            >
              {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </Button>
          </div>

          {/* Question Navigator */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Questions</p>
            <div className="flex flex-wrap gap-2">
              {questions.map((_, i) => (
                <Button
                  key={i}
                  variant={i === currentIndex ? "default" : answers[questions[i]?.id] ? "secondary" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => goToQuestion(i)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          </div>

          <Button variant="outline" size="sm" className="w-full" onClick={exitInterview}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Exit Interview
          </Button>
        </CardContent>
      </Card>

      {/* Question & Answer Panel */}
      <Card variant="elevated" className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline">
              Question {currentIndex + 1} of {questions.length}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {currentQuestion?.category}
            </Badge>
          </div>
          <Progress value={((currentIndex + 1) / questions.length) * 100} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Question */}
              <div className="p-4 bg-muted rounded-lg mb-4">
                <p className="font-medium text-lg">{currentQuestion?.question}</p>
              </div>

              {/* Expected Points Hint */}
              {currentQuestion?.expectedPoints && (
                <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Tip: Consider covering these points:</p>
                  <div className="flex flex-wrap gap-1">
                    {currentQuestion.expectedPoints.slice(0, 3).map((point, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {point}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Answer Input */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Type your answer here... (Use STAR method: Situation, Task, Action, Result)"
                  value={currentAnswer || answers[currentQuestion?.id] || ""}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {(currentAnswer || answers[currentQuestion?.id] || "").length} characters
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => goToQuestion(currentIndex - 1)}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            {currentIndex === questions.length - 1 ? (
              <Button
                onClick={handleSubmitInterview}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Interview
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={() => goToQuestion(currentIndex + 1)}>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          {answeredCount < questions.length && (
            <div className="flex items-center gap-2 text-sm text-warning">
              <AlertCircle className="w-4 h-4" />
              <span>{questions.length - answeredCount} questions remaining</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
