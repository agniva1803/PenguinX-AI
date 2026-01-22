import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Clock, Trophy } from "lucide-react";

export const AptitudeTest = () => {
  const tests = [
    { title: "Quantitative Reasoning", questions: 20, time: "30 min", completed: false },
    { title: "Logical Reasoning", questions: 15, time: "25 min", completed: false },
    { title: "Verbal Ability", questions: 25, time: "20 min", completed: false },
  ];

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-warning" />
            Aptitude Tests
          </CardTitle>
          <CardDescription>Practice reasoning and analytical skills</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {tests.map((test, index) => (
            <Card key={index} variant="interactive" className="p-4">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-xl bg-warning/10 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{test.title}</h3>
                  <p className="text-sm text-muted-foreground">{test.questions} questions • {test.time}</p>
                </div>
                <Button className="w-full" variant="outline">Start Test</Button>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
