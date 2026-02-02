import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CodeEditor } from "./CodeEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, 
  Send, 
  RotateCcw, 
  ChevronLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Lightbulb,
  Loader2 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TestCase {
  input: Record<string, unknown>;
  expected: unknown;
}

interface CodingQuestion {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  testCases: TestCase[];
  hints?: string[];
}

interface TestResult {
  testCase: number;
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
}

interface EvaluationResult {
  passed: boolean;
  score: number;
  testResults: TestResult[];
  timeComplexity: string;
  spaceComplexity: string;
  feedback: {
    correctness: string;
    efficiency: string;
    codeQuality: string;
    improvements: string[];
  };
  summary: string;
}

interface CodingWorkspaceProps {
  question: CodingQuestion;
  onBack: () => void;
}

const LANGUAGES = [
  { value: "python", label: "Python", template: "def solution():\n    # Write your code here\n    pass" },
  { value: "javascript", label: "JavaScript", template: "function solution() {\n  // Write your code here\n}" },
  { value: "typescript", label: "TypeScript", template: "function solution(): void {\n  // Write your code here\n}" },
  { value: "java", label: "Java", template: "class Solution {\n    public void solution() {\n        // Write your code here\n    }\n}" },
  { value: "cpp", label: "C++", template: "#include <iostream>\nusing namespace std;\n\nvoid solution() {\n    // Write your code here\n}" },
  { value: "c", label: "C", template: "#include <stdio.h>\n\nvoid solution() {\n    // Write your code here\n}" },
  { value: "go", label: "Go", template: "package main\n\nfunc solution() {\n    // Write your code here\n}" },
  { value: "rust", label: "Rust", template: "fn solution() {\n    // Write your code here\n}" },
];

export function CodingWorkspace({ question, onBack }: CodingWorkspaceProps) {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(LANGUAGES[0].template);
  const [activeTab, setActiveTab] = useState("description");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [showHints, setShowHints] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const lang = LANGUAGES.find(l => l.value === language);
    if (lang) {
      setCode(lang.template);
    }
  }, [language]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setEvaluation(null);

    try {
      const { data, error } = await supabase.functions.invoke("evaluate-code", {
        body: {
          code,
          language,
          question: {
            title: question.title,
            description: question.description,
          },
          testCases: question.testCases,
        },
      });

      if (error) throw error;

      setEvaluation(data.evaluation);
      setActiveTab("results");

      // Save attempt to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("coding_attempts").insert({
          user_id: user.id,
          question_id: question.id,
          question_title: question.title,
          difficulty: question.difficulty,
          language,
          code,
          passed: data.evaluation.passed,
          score: data.evaluation.score,
          feedback: data.evaluation.summary,
        });
      }

      toast({
        title: data.evaluation.passed ? "All tests passed! 🎉" : "Some tests failed",
        description: data.evaluation.summary,
        variant: data.evaluation.passed ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Evaluation error:", error);
      toast({
        variant: "destructive",
        title: "Evaluation failed",
        description: "Failed to evaluate your code. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    const lang = LANGUAGES.find(l => l.value === language);
    if (lang) {
      setCode(lang.template);
    }
    setEvaluation(null);
  };

  const difficultyColor = {
    easy: "bg-success/10 text-success border-success/20",
    medium: "bg-warning/10 text-warning border-warning/20",
    hard: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <h2 className="font-semibold text-lg">{question.title}</h2>
            <Badge className={difficultyColor[question.difficulty]}>
              {question.difficulty}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Left Panel - Problem Description */}
        <Card className="flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <CardHeader className="pb-0">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="hints">Hints</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden pt-4">
              <ScrollArea className="h-full">
                <TabsContent value="description" className="mt-0 space-y-4">
                  <div className="prose prose-sm dark:prose-invert">
                    <p>{question.description}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Examples:</h4>
                    {question.examples.map((example, i) => (
                      <div key={i} className="bg-muted p-3 rounded-lg mb-2 text-sm">
                        <div><strong>Input:</strong> {example.input}</div>
                        <div><strong>Output:</strong> {example.output}</div>
                        {example.explanation && (
                          <div className="text-muted-foreground mt-1">
                            <strong>Explanation:</strong> {example.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Constraints:</h4>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                      {question.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="hints" className="mt-0">
                  {question.hints && question.hints.length > 0 ? (
                    <div className="space-y-2">
                      {showHints ? (
                        question.hints.map((hint, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-2 p-3 bg-muted rounded-lg"
                          >
                            <Lightbulb className="w-4 h-4 text-warning mt-0.5" />
                            <p className="text-sm">{hint}</p>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">
                            Need some help? Reveal hints to guide you.
                          </p>
                          <Button variant="outline" onClick={() => setShowHints(true)}>
                            Show Hints
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No hints available for this problem.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="results" className="mt-0">
                  <AnimatePresence mode="wait">
                    {evaluation ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                      >
                        {/* Score Summary */}
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            {evaluation.passed ? (
                              <CheckCircle2 className="w-8 h-8 text-success" />
                            ) : (
                              <XCircle className="w-8 h-8 text-destructive" />
                            )}
                            <div>
                              <p className="font-semibold">
                                {evaluation.passed ? "Accepted" : "Wrong Answer"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Score: {evaluation.score}/100
                              </p>
                            </div>
                          </div>
                          <Progress value={evaluation.score} className="w-24" />
                        </div>

                        {/* Complexity */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground">Time Complexity</p>
                            <p className="font-mono font-semibold">{evaluation.timeComplexity}</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground">Space Complexity</p>
                            <p className="font-mono font-semibold">{evaluation.spaceComplexity}</p>
                          </div>
                        </div>

                        {/* Test Results */}
                        <div>
                          <h4 className="font-semibold mb-2">Test Cases</h4>
                          <div className="space-y-2">
                            {evaluation.testResults.map((result, i) => (
                              <div
                                key={i}
                                className={`p-3 rounded-lg border ${
                                  result.passed
                                    ? "border-success/20 bg-success/5"
                                    : "border-destructive/20 bg-destructive/5"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {result.passed ? (
                                    <CheckCircle2 className="w-4 h-4 text-success" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-destructive" />
                                  )}
                                  <span className="text-sm font-medium">
                                    Test Case {result.testCase}
                                  </span>
                                </div>
                                {!result.passed && (
                                  <div className="mt-2 text-xs">
                                    <p><strong>Expected:</strong> {result.expectedOutput}</p>
                                    <p><strong>Actual:</strong> {result.actualOutput}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Feedback */}
                        <div>
                          <h4 className="font-semibold mb-2">AI Feedback</h4>
                          <div className="space-y-2 text-sm">
                            <p><strong>Correctness:</strong> {evaluation.feedback.correctness}</p>
                            <p><strong>Efficiency:</strong> {evaluation.feedback.efficiency}</p>
                            <p><strong>Code Quality:</strong> {evaluation.feedback.codeQuality}</p>
                            {evaluation.feedback.improvements.length > 0 && (
                              <div>
                                <strong>Suggestions:</strong>
                                <ul className="list-disc pl-5 mt-1">
                                  {evaluation.feedback.improvements.map((imp, i) => (
                                    <li key={i}>{imp}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Clock className="w-12 h-12 mx-auto mb-4" />
                        <p>Submit your code to see results</p>
                      </div>
                    )}
                  </AnimatePresence>
                </TabsContent>
              </ScrollArea>
            </CardContent>
          </Tabs>
        </Card>

        {/* Right Panel - Code Editor */}
        <div className="flex flex-col gap-4">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={language}
            className="flex-1"
          />
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleSubmit}
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
                  Submit
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
