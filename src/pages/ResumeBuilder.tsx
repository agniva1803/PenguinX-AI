import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Sparkles } from "lucide-react";

const ResumeBuilder = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Resume Builder & Analyzer</h1>
          <p className="text-muted-foreground">Get AI-powered feedback on your resume</p>
        </div>
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />Upload Resume</CardTitle>
            <CardDescription>Upload your resume for instant AI analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Drag & drop your resume or click to upload</p>
              <Button><Upload className="w-4 h-4 mr-2" />Upload Resume</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ResumeBuilder;
