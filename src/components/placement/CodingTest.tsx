import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Code, Play, Loader2, RefreshCw } from "lucide-react";
import { CodingWorkspace } from "@/components/coding/CodingWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CodingQuestion {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  testCases: { input: Record<string, unknown>; expected: unknown }[];
  hints?: string[];
}

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const TOPIC_OPTIONS = [
  { value: "", label: "All Topics" },
  { value: "arrays", label: "Arrays" },
  { value: "strings", label: "Strings" },
  { value: "linked-lists", label: "Linked Lists" },
  { value: "trees", label: "Trees" },
  { value: "dynamic-programming", label: "Dynamic Programming" },
  { value: "graphs", label: "Graphs" },
  { value: "sorting", label: "Sorting" },
  { value: "searching", label: "Searching" },
];

export const CodingTest = () => {
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<CodingQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [difficulty, setDifficulty] = useState("easy");
  const [topic, setTopic] = useState("");
  const { toast } = useToast();

  const generateQuestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-coding-questions", {
        body: {
          difficulty,
          topic: topic || undefined,
          count: 5,
        },
      });

      if (error) throw error;

      if (data?.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      toast({
        variant: "destructive",
        title: "Failed to generate questions",
        description: "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateQuestions();
  }, []);

  const difficultyColor = {
    easy: "bg-success/10 text-success border-success/20",
    medium: "bg-warning/10 text-warning border-warning/20",
    hard: "bg-destructive/10 text-destructive border-destructive/20",
  };

  if (selectedQuestion) {
    return (
      <CodingWorkspace
        question={selectedQuestion}
        onBack={() => setSelectedQuestion(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" />
                Coding Challenges
              </CardTitle>
              <CardDescription>Practice DSA problems with real-time AI evaluation</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  {TOPIC_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={generateQuestions} disabled={isLoading} variant="outline">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
                <p className="text-muted-foreground">Generating coding challenges...</p>
              </div>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <Code className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No questions available</p>
              <Button onClick={generateQuestions}>Generate Questions</Button>
            </div>
          ) : (
            questions.map((problem) => (
              <div
                key={problem.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Code className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{problem.title}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {problem.description.slice(0, 80)}...
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={difficultyColor[problem.difficulty]}>
                    {problem.difficulty}
                  </Badge>
                  <Button size="sm" onClick={() => setSelectedQuestion(problem)}>
                    <Play className="w-4 h-4 mr-1" /> Solve
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
