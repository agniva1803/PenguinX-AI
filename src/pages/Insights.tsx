import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Target, Trophy } from "lucide-react";

const Insights = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Insights & Analytics</h1>
          <p className="text-muted-foreground">Track your progress and performance</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Target, label: "Problems Solved", value: "0" },
            { icon: Trophy, label: "Tests Passed", value: "0" },
            { icon: TrendingUp, label: "Skill Score", value: "0%" },
            { icon: BarChart3, label: "Rank", value: "-" },
          ].map((stat, i) => (
            <Card key={i} variant="elevated">
              <CardContent className="p-6 text-center">
                <stat.icon className="w-8 h-8 mx-auto text-primary mb-3" />
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Insights;
