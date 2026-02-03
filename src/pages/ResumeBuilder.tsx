import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ResumeUploader } from "@/components/resume/ResumeUploader";
import { motion } from "framer-motion";

const ResumeBuilder = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Resume Builder & Analyzer
          </h1>
          <p className="text-muted-foreground">
            Get AI-powered feedback to optimize your resume for your target role
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <ResumeUploader />
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ResumeBuilder;
