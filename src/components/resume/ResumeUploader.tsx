import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Upload, Sparkles, Loader2, CheckCircle2, 
  AlertTriangle, Target, TrendingUp, Lightbulb, FileCheck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface ResumeAnalysis {
  score: number;
  strengths: string[];
  improvements: string[];
  atsOptimization: string[];
  keywords: string[];
  formatTips: string[];
  actionItems: string[];
  summary: string;
}

export const ResumeUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = async (selectedFile: File) => {
    if (!selectedFile) return;
    
    const fileName = selectedFile.name.toLowerCase();
    const validExtensions = ['.txt', '.pdf', '.docx'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PDF, Word (.docx), or text file.",
      });
      return;
    }
    
    setFile(selectedFile);
    setIsParsing(true);
    setResumeText("");
    
    try {
      let extractedText = "";
      
      if (fileName.endsWith('.txt')) {
        // Read text files directly in browser
        extractedText = await selectedFile.text();
      } else {
        // Send PDF/DOCX to edge function for parsing
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const { data, error } = await supabase.functions.invoke("parse-resume", {
          body: formData,
        });

        if (error) throw error;
        
        if (data?.text) {
          extractedText = data.text;
        } else {
          throw new Error("No text extracted from file");
        }
      }
      
      if (extractedText) {
        setResumeText(extractedText);
        toast({
          title: "Resume parsed successfully!",
          description: `Extracted ${extractedText.split(/\s+/).length} words from your resume.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Could not extract text",
          description: "The file appears to be empty or unreadable.",
        });
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      toast({
        variant: "destructive",
        title: "Parsing failed",
        description: "Could not extract text from the file. Please try a different format.",
      });
    } finally {
      setIsParsing(false);
    }
  };

  const analyzeResume = async () => {
    if (!resumeText.trim()) {
      toast({
        variant: "destructive",
        title: "No resume text",
        description: "Please paste your resume text or upload a text file.",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("analyze-resume", {
        body: { resumeText, targetRole },
      });

      if (error) throw error;
      
      if (data?.analysis) {
        setAnalysis(data.analysis);
        
        // Save to database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("resume_analysis").insert({
            user_id: user.id,
            file_name: file?.name || "pasted_resume",
            score: data.analysis.score,
            suggestions: data.analysis.actionItems,
            analysis_result: data.analysis,
          });
        }

        toast({
          title: "Analysis complete!",
          description: `Your resume scored ${data.analysis.score}/100`,
        });
      }
    } catch (error) {
      console.error("Error analyzing resume:", error);
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: "Please try again.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "bg-success/10 text-success border-success/20";
    if (score >= 60) return "bg-warning/10 text-warning border-warning/20";
    return "bg-destructive/10 text-destructive border-destructive/20";
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Upload Resume
          </CardTitle>
          <CardDescription>Upload your resume for instant AI-powered analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            {file ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  {isParsing ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <FileCheck className="w-5 h-5 text-success" />
                  )}
                  <span className="font-medium">{file.name}</span>
                </div>
                {isParsing && (
                  <p className="text-sm text-muted-foreground">Extracting text from your resume...</p>
                )}
                {!isParsing && resumeText && (
                  <p className="text-sm text-success">✓ {resumeText.split(/\s+/).length} words extracted</p>
                )}
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Change File
                </Button>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground mb-3">Drag & drop your resume or click to upload</p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Select File
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Supports PDF, Word (.docx), and text files</p>
              </>
            )}
          </div>

          {resumeText && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <Label className="text-sm font-medium">Extracted Resume Content</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                Preview of extracted text ({resumeText.split(/\s+/).length} words)
              </p>
              <div className="max-h-[200px] overflow-y-auto text-sm font-mono bg-background p-3 rounded border">
                {resumeText.slice(0, 1000)}
                {resumeText.length > 1000 && "..."}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="targetRole">Target Role (Optional)</Label>
            <Input
              id="targetRole"
              placeholder="e.g., Software Engineer, Data Scientist"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            />
          </div>

          <Button 
            className="w-full" 
            onClick={analyzeResume} 
            disabled={isAnalyzing || isParsing || !resumeText.trim()}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Resume...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Resume
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Score Card */}
            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Resume Score</h3>
                    <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-5xl font-bold ${getScoreColor(analysis.score)}`}>
                      {analysis.score}
                    </div>
                    <Badge className={getScoreBadge(analysis.score)}>
                      {analysis.score >= 80 ? "Excellent" : analysis.score >= 60 ? "Good" : "Needs Work"}
                    </Badge>
                  </div>
                </div>
                <Progress value={analysis.score} className="mt-4 h-2" />
              </CardContent>
            </Card>

            {/* Strengths & Improvements */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card variant="elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-success mt-1">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    Areas to Improve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.improvements.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-warning mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* ATS & Keywords */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card variant="elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    ATS Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.atsOptimization.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-1">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-accent" />
                    Suggested Keywords
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.keywords.map((keyword, i) => (
                      <Badge key={i} variant="secondary">{keyword}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Items */}
            <Card variant="elevated">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-warning" />
                  Priority Action Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {analysis.actionItems.map((action, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-sm">{action}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
