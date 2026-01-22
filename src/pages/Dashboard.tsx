import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  FileText,
  Code,
  Brain,
  Users,
  TrendingUp,
  ArrowRight,
  Target,
  Trophy,
  Clock,
} from "lucide-react";

const Dashboard = () => {
  const quickActions = [
    { icon: MessageSquare, label: "Career Guidance", path: "/career-guidance", color: "bg-primary/10 text-primary" },
    { icon: Code, label: "Coding Practice", path: "/placement-prep?tab=coding", color: "bg-success/10 text-success" },
    { icon: Brain, label: "Aptitude Test", path: "/placement-prep?tab=aptitude", color: "bg-warning/10 text-warning" },
    { icon: Users, label: "Mock Interview", path: "/placement-prep?tab=interview", color: "bg-accent/10 text-accent" },
  ];

  const stats = [
    { label: "Questions Solved", value: "0", icon: Target, change: "+0 this week" },
    { label: "Tests Completed", value: "0", icon: Trophy, change: "+0 this week" },
    { label: "Hours Practiced", value: "0", icon: Clock, change: "+0 this week" },
    { label: "Skill Score", value: "0%", icon: TrendingUp, change: "+0% improvement" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            Continue your journey to placement success. Here's your progress overview.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((stat, index) => (
            <Card key={index} variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="font-display text-2xl md:text-3xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
                <div className="text-xs text-success mt-2">{stat.change}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.path}>
                <Card variant="interactive" className="h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className={`w-14 h-14 rounded-xl ${action.color} flex items-center justify-center mb-4`}>
                      <action.icon className="w-7 h-7" />
                    </div>
                    <span className="font-medium text-foreground">{action.label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Progress Overview */}
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Skill Progress</CardTitle>
                <CardDescription>Track your improvement across different areas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { skill: "Data Structures", progress: 0 },
                  { skill: "Algorithms", progress: 0 },
                  { skill: "Aptitude", progress: 0 },
                  { skill: "Communication", progress: 0 },
                ].map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground font-medium">{item.skill}</span>
                      <span className="text-muted-foreground">{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Recommended For You</CardTitle>
                <CardDescription>Based on your progress and goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: "Complete your profile", description: "Help us personalize your experience", path: "/profile" },
                  { title: "Start Career Guidance", description: "Get AI-powered career recommendations", path: "/career-guidance" },
                  { title: "Analyze your resume", description: "Get feedback and improvement tips", path: "/resume-builder" },
                ].map((item, index) => (
                  <Link key={index} to={item.path}>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group">
                      <div>
                        <div className="font-medium text-foreground">{item.title}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
