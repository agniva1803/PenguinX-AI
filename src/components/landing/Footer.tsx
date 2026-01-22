import { PenguinLogo } from "@/components/PenguinLogo";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-sidebar text-sidebar-foreground py-16">
      <div className="container px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <PenguinLogo size="md" />
            <p className="mt-4 text-sidebar-foreground/70 max-w-md">
              Your AI-powered career companion. We help students and professionals 
              navigate their career journey with personalized guidance and comprehensive 
              placement preparation tools.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="text-sidebar-foreground/60 hover:text-sidebar-primary transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-sidebar-foreground/60 hover:text-sidebar-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-sidebar-foreground/60 hover:text-sidebar-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-sidebar-foreground/60 hover:text-sidebar-primary transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sidebar-foreground mb-4">Features</h4>
            <ul className="space-y-3">
              <li><Link to="/career-guidance" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">Career Guidance</Link></li>
              <li><Link to="/placement-prep" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">Placement Prep</Link></li>
              <li><Link to="/resume-builder" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">Resume Builder</Link></li>
              <li><Link to="/insights" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">Insights</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sidebar-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">About Us</a></li>
              <li><a href="#" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-sidebar-border text-center text-sidebar-foreground/60 text-sm">
          <p>© {new Date().getFullYear()} PenguinX AI. Built with ❤️ by Agniva Mukherjee</p>
        </div>
      </div>
    </footer>
  );
};
