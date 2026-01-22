import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, Play, Clock } from "lucide-react";

export const CodingTest = () => {
  const problems = [
    { title: "Two Sum", difficulty: "Easy", category: "Arrays", solved: false },
    { title: "Valid Parentheses", difficulty: "Easy", category: "Stack", solved: false },
    { title: "Merge Intervals", difficulty: "Medium", category: "Arrays", solved: false },
  ];

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            Coding Challenges
          </CardTitle>
          <CardDescription>Practice DSA problems with real-time code execution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {problems.map((problem, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Code className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">{problem.title}</div>
                  <div className="text-sm text-muted-foreground">{problem.category}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={problem.difficulty === "Easy" ? "secondary" : "outline"}>
                  {problem.difficulty}
                </Badge>
                <Button size="sm">
                  <Play className="w-4 h-4 mr-1" /> Solve
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
