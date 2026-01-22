import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MessageSquare, 
  FileText, 
  Code, 
  Brain, 
  Users, 
  BarChart3,
  Sparkles,
  Target,
  GraduationCap
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "AI Career Counselor",
    description: "Get personalized career advice from an AI mentor that understands your goals and guides your journey.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: FileText,
    title: "Resume Analyzer",
    description: "Upload your resume for instant AI feedback, improvement suggestions, and ATS optimization tips.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Code,
    title: "Coding Practice",
    description: "Solve coding challenges across difficulty levels with real-time execution and AI evaluation.",
    color: "bg-success/10 text-success",
  },
  {
    icon: Brain,
    title: "Aptitude Tests",
    description: "Practice quantitative, logical, and verbal reasoning with timed assessments and instant results.",
    color: "bg-warning/10 text-warning",
  },
  {
    icon: Users,
    title: "Mock Interviews",
    description: "Experience AI-powered interview simulations with real-time feedback and performance scoring.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description: "Track your preparation journey with detailed insights, statistics, and personalized recommendations.",
    color: "bg-accent/10 text-accent",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export const FeaturesSection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Powerful Features</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            Everything You Need to{" "}
            <span className="text-gradient">Succeed</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From career guidance to placement preparation, our AI-powered platform 
            has all the tools you need to land your dream job.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card variant="feature" className="h-full">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-4 p-6 rounded-2xl bg-secondary">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-primary" />
              <div className="text-left">
                <div className="font-display font-semibold text-foreground">Ready to start?</div>
                <div className="text-sm text-muted-foreground">Join thousands of successful candidates</div>
              </div>
            </div>
            <Target className="w-6 h-6 text-accent animate-pulse" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
