import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodingTest } from "@/components/placement/CodingTest";
import { AptitudeTest } from "@/components/placement/AptitudeTest";
import { InterviewPractice } from "@/components/placement/InterviewPractice";
import { Code, Brain, Users } from "lucide-react";

const PlacementPrep = () => {
  const [activeTab, setActiveTab] = useState("coding");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Placement Preparation
          </h1>
          <p className="text-muted-foreground">
            Practice coding, aptitude, and interview skills to ace your placements
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="coding" className="gap-2">
                <Code className="w-4 h-4" />
                <span className="hidden sm:inline">Coding</span>
              </TabsTrigger>
              <TabsTrigger value="aptitude" className="gap-2">
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">Aptitude</span>
              </TabsTrigger>
              <TabsTrigger value="interview" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Interview</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="coding">
              <CodingTest />
            </TabsContent>
            <TabsContent value="aptitude">
              <AptitudeTest />
            </TabsContent>
            <TabsContent value="interview">
              <InterviewPractice />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default PlacementPrep;
