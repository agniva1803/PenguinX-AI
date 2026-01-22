import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Video, MessageSquare } from "lucide-react";

export const InterviewPractice = () => {
  const interviews = [
    { title: "Technical Round", description: "DSA & problem-solving questions", icon: MessageSquare },
    { title: "HR Round", description: "Behavioral & situational questions", icon: Users },
    { title: "Mock Interview", description: "Full interview simulation", icon: Video },
  ];

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            Mock Interviews
          </CardTitle>
          <CardDescription>Practice with AI-powered interview simulations</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {interviews.map((item, index) => (
            <Card key={index} variant="interactive" className="p-4">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-xl bg-accent/10 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Button className="w-full">Start Practice</Button>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
