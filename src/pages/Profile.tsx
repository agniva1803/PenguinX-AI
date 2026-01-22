import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Mail, Briefcase, GraduationCap } from "lucide-react";

const Profile = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>
        <Card variant="elevated">
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Full Name</Label><Input placeholder="Your name" /></div>
              <div className="space-y-2"><Label>Email</Label><Input placeholder="you@example.com" type="email" /></div>
              <div className="space-y-2"><Label>Institution</Label><Input placeholder="Your college/university" /></div>
              <div className="space-y-2"><Label>Target Role</Label><Input placeholder="Software Engineer" /></div>
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
