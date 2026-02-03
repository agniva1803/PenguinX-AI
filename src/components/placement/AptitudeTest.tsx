import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Brain, Clock, Trophy, ChevronLeft, ChevronRight, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
}

interface TestResult {
  score: number;
  correct: number;
  total: number;
  timeTaken: number;
  feedback: string;
  questionResults: {
    questionId: string;
    correct: boolean;
    userAnswer: number;
    correctAnswer: number;
  }[];
}

const TEST_TYPES = [
  { id: "quantitative", title: "Quantitative Reasoning", questions: 20, time: 30, icon: "📊" },
  { id: "logical", title: "Logical Reasoning", questions: 15, time: 25, icon: "🧩" },
  { id: "verbal", title: "Verbal Ability", questions: 25, time: 20, icon: "📝" },
];

export const AptitudeTest = () => {
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const { toast } = useToast();

  const startTest = async (testType: string) => {
    setIsLoading(true);
    setActiveTest(testType);
    setAnswers({});
    setResult(null);
    setCurrentIndex(0);

    try {
      const test = TEST_TYPES.find(t => t.id === testType);
      const { data, error } = await supabase.functions.invoke("generate-aptitude-test", {
        body: {
          testType,
          questionCount: test?.questions || 10,
        },
      });

      if (error) throw error;

      if (data?.questions && Array.isArray(data.questions)) {
        // Transform API response to match component's expected format
        const transformedQuestions: Question[] = data.questions.map((q: {
          id: number;
          question: string;
          options: Record<string, string>;
          correctAnswer: string;
          explanation: string;
          difficulty?: string;
        }) => {
          const optionKeys = ['A', 'B', 'C', 'D'];
          const optionsArray = optionKeys.map(key => q.options[key] || '');
          const correctIndex = optionKeys.indexOf(q.correctAnswer);
          
          return {
            id: String(q.id),
            question: q.question,
            options: optionsArray,
            correctAnswer: correctIndex >= 0 ? correctIndex : 0,
            explanation: q.explanation,
            topic: q.difficulty || 'medium',
          };
        });
        
        setQuestions(transformedQuestions);
        setStartTime(Date.now());
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error generating test:", error);
      toast({
        variant: "destructive",
        title: "Failed to generate test",
        description: "Please try again.",
      });
      setActiveTest(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (answer: number) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentIndex].id]: answer,
    }));
  };

  const submitTest = async () => {
    setIsSubmitting(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    try {
      // Calculate results
      let correct = 0;
      const questionResults = questions.map(q => {
        const userAnswer = answers[q.id];
        const isCorrect = userAnswer === q.correctAnswer;
        if (isCorrect) correct++;
        return {
          questionId: q.id,
          correct: isCorrect,
          userAnswer: userAnswer ?? -1,
          correctAnswer: q.correctAnswer,
        };
      });

      const score = Math.round((correct / questions.length) * 100);

      // Generate AI feedback
      let feedback = "";
      if (score >= 90) {
        feedback = "Excellent performance! You've demonstrated strong aptitude skills. Keep up the great work!";
      } else if (score >= 70) {
        feedback = "Good job! You're on the right track. Focus on the areas where you made mistakes to improve further.";
      } else if (score >= 50) {
        feedback = "Fair performance. Review the concepts and practice more to strengthen your skills.";
      } else {
        feedback = "Keep practicing! Focus on understanding the fundamentals and work on improving step by step.";
      }

      const testResult: TestResult = {
        score,
        correct,
        total: questions.length,
        timeTaken,
        feedback,
        questionResults,
      };

      setResult(testResult);

      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("aptitude_test_results").insert({
          user_id: user.id,
          test_type: activeTest!,
          score,
          correct_answers: correct,
          total_questions: questions.length,
          time_taken_seconds: timeTaken,
        });
      }

      toast({
        title: `Test completed! Score: ${score}%`,
        description: `You got ${correct} out of ${questions.length} correct.`,
      });
    } catch (error) {
      console.error("Error submitting test:", error);
      toast({
        variant: "destructive",
        title: "Failed to submit test",
        description: "Your results may not have been saved.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const exitTest = () => {
    setActiveTest(null);
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setCurrentIndex(0);
  };

  // Show test selection
  if (!activeTest) {
    return (
      <div className="space-y-6">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-warning" />
              Aptitude Tests
            </CardTitle>
            <CardDescription>Practice reasoning and analytical skills with AI-generated questions</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {TEST_TYPES.map((test) => (
              <Card key={test.id} variant="interactive" className="p-4">
                <div className="text-center space-y-4">
                  <div className="text-4xl">{test.icon}</div>
                  <div>
                    <h3 className="font-semibold text-foreground">{test.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {test.questions} questions • {test.time} min
                    </p>
                  </div>
                  <Button className="w-full" onClick={() => startTest(test.id)}>
                    Start Test
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
          <h3 className="text-lg font-semibold mb-2">Generating Questions</h3>
          <p className="text-muted-foreground">Preparing your aptitude test...</p>
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
            <Trophy className="w-5 h-5 text-warning" />
            Test Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Summary */}
          <div className="text-center p-6 bg-muted rounded-lg">
            <div className="text-5xl font-bold text-primary mb-2">{result.score}%</div>
            <p className="text-muted-foreground">
              {result.correct} correct out of {result.total} questions
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Time taken: {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
            </p>
          </div>

          {/* Progress Bar */}
          <Progress value={result.score} className="h-3" />

          {/* AI Feedback */}
          <div className="p-4 bg-primary/10 rounded-lg">
            <h4 className="font-semibold mb-2">AI Feedback</h4>
            <p className="text-sm">{result.feedback}</p>
          </div>

          {/* Question Review */}
          <div>
            <h4 className="font-semibold mb-3">Question Review</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {questions.map((q, i) => {
                const qResult = result.questionResults.find(r => r.questionId === q.id);
                return (
                  <div
                    key={q.id}
                    className={`p-3 rounded-lg border ${
                      qResult?.correct
                        ? "border-success/20 bg-success/5"
                        : "border-destructive/20 bg-destructive/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {qResult?.correct ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                      <span className="text-sm font-medium">Q{i + 1}: {q.question.slice(0, 60)}...</span>
                    </div>
                    {!qResult?.correct && (
                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                        Correct answer: {q.options[q.correctAnswer]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Button className="w-full" onClick={exitTest}>
            Back to Tests
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Active test
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  // Guard: wait for questions to load with valid options
  if (!currentQuestion || !Array.isArray(currentQuestion.options)) {
    return (
      <Card variant="elevated" className="p-12">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
          <h3 className="text-lg font-semibold mb-2">Loading Question</h3>
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={exitTest}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Exit
            </Button>
            <Badge variant="outline">
              Question {currentIndex + 1} of {questions.length}
            </Badge>
          </div>
          <Badge variant="secondary">
            {answeredCount} answered
          </Badge>
        </div>
        <Progress value={progress} className="mt-4" />
      </CardHeader>
      <CardContent className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 bg-muted rounded-lg mb-6">
              <p className="font-medium">{currentQuestion?.question}</p>
            </div>

            <RadioGroup
              value={answers[currentQuestion?.id]?.toString() || ""}
              onValueChange={(value) => handleAnswer(parseInt(value))}
            >
              <div className="space-y-3">
                {currentQuestion?.options.map((option, i) => (
                  <div
                    key={i}
                    className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${
                      answers[currentQuestion?.id] === i
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value={i.toString()} id={`option-${i}`} />
                    <Label htmlFor={`option-${i}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          {currentIndex === questions.length - 1 ? (
            <Button
              onClick={submitTest}
              disabled={isSubmitting || answeredCount < questions.length}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Test
                  <Trophy className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {answeredCount < questions.length && currentIndex === questions.length - 1 && (
          <p className="text-sm text-warning text-center">
            Please answer all questions before submitting ({questions.length - answeredCount} remaining)
          </p>
        )}
      </CardContent>
    </Card>
  );
};
