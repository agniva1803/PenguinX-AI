 import { useEffect, useState } from "react";
 import { Navigate } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 
 interface ProtectedRouteProps {
   children: React.ReactNode;
 }
 
 export function ProtectedRoute({ children }: ProtectedRouteProps) {
   const [loading, setLoading] = useState(true);
   const [authenticated, setAuthenticated] = useState(false);
 
   useEffect(() => {
     // Set up auth state listener first
     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
       setAuthenticated(!!session?.user);
       setLoading(false);
     });
 
     // Then check current session
     supabase.auth.getSession().then(({ data: { session } }) => {
       setAuthenticated(!!session?.user);
       setLoading(false);
     });
 
     return () => subscription.unsubscribe();
   }, []);
 
   if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-background">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
       </div>
     );
   }
 
   if (!authenticated) {
     return <Navigate to="/auth" replace />;
   }
 
   return <>{children}</>;
 }