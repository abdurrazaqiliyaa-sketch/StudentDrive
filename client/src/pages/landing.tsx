import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Award, TrendingUp, Users, CheckCircle, BarChart3, Sparkles, Zap, Target } from "lucide-react";
import heroBackground from "@assets/stock_images/modern_university_st_7d2562c7.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                <BookOpen className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-heading font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">StudentDrive</span>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                asChild 
                data-testid="button-login" 
                variant="ghost"
                className="text-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200 font-semibold"
              >
                <a href="/login">Sign In</a>
              </Button>
              <Button 
                asChild 
                data-testid="button-get-started-header" 
                className="bg-[#f59e0b] hover:bg-[#d97706] text-white shadow-md hover:shadow-lg transition-all duration-200 font-semibold px-6"
              >
                <a href="/register">Get Started</a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 overflow-hidden min-h-[600px] md:min-h-[700px] flex items-center">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBackground})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/90 to-[#0ea5e9]/85"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]"></div>
        </div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6 text-white/90 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>Trusted by 10,000+ students worldwide</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-6 leading-tight">
              Empowering Students.<br />
              <span className="text-white/90">Enhancing Learning.</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed max-w-2xl">
              Transform how you study, access educational materials, and measure progress with StudentDrive's intelligent learning platform.
            </p>
            <div className="flex flex-wrap gap-5">
              <Button 
                size="lg" 
                className="bg-[#f59e0b] hover:bg-[#d97706] text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-200 text-lg px-10 py-7 h-auto font-semibold rounded-lg" 
                asChild 
                data-testid="button-get-started"
              >
                <a href="/register">Get Started Free</a>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white/80 text-white hover:bg-white/10 backdrop-blur-sm text-lg px-10 py-7 h-auto font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg" 
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-[#0ea5e9]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="text-4xl font-bold text-foreground mb-2">10,000+</div>
              <div className="text-muted-foreground font-medium">Active Students</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#f59e0b]/10 mb-4">
                <BookOpen className="h-8 w-8 text-[#f59e0b]" />
              </div>
              <div className="text-4xl font-bold text-foreground mb-2">50,000+</div>
              <div className="text-muted-foreground font-medium">Study Materials</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0ea5e9]/10 mb-4">
                <Target className="h-8 w-8 text-[#0ea5e9]" />
              </div>
              <div className="text-4xl font-bold text-foreground mb-2">98%</div>
              <div className="text-muted-foreground font-medium">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 mb-4">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Powerful Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A comprehensive platform designed for students, instructors, institutions, and administrators
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="group hover-elevate border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-8">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <BookOpen className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Resource Library</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Access verified lecture notes, textbooks, study guides, and past questions organized by course and topic.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover-elevate border-2 hover:border-[#f59e0b]/50 transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-8">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Award className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Interactive Quizzes</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Practice with self-paced quizzes, get instant feedback, and track your improvement over time.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover-elevate border-2 hover:border-[#0ea5e9]/50 transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-8">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Performance Analytics</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Visualize your academic performance with detailed charts and identify areas for improvement.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Role-Based Benefits */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 mb-4">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">For Everyone</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              Built for Every Learning Role
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group border-2 border-role-student/20 hover:border-role-student/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-role-student to-role-student/80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-3">Students</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-role-student mt-0.5 flex-shrink-0" />
                    <span>Access learning materials anytime</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-role-student mt-0.5 flex-shrink-0" />
                    <span>Track progress and achievements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-role-student mt-0.5 flex-shrink-0" />
                    <span>Bookmark favorite resources</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="group border-2 border-role-instructor/20 hover:border-role-instructor/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-role-instructor to-role-instructor/80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-3">Instructors</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-role-instructor mt-0.5 flex-shrink-0" />
                    <span>Upload and share materials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-role-instructor mt-0.5 flex-shrink-0" />
                    <span>Create custom quizzes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-role-instructor mt-0.5 flex-shrink-0" />
                    <span>Monitor student performance</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="group border-2 border-role-institution/20 hover:border-role-institution/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-role-institution to-role-institution/80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-3">Institutions</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-role-institution mt-0.5 flex-shrink-0" />
                    <span>Manage students and instructors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-role-institution mt-0.5 flex-shrink-0" />
                    <span>Track departmental analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-role-institution mt-0.5 flex-shrink-0" />
                    <span>Custom branding options</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-[#0ea5e9]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6 text-white/90 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            <span>Start Learning Today</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Join thousands of students and educators already using StudentDrive to achieve their academic goals
          </p>
          <div className="flex flex-wrap gap-5 justify-center">
            <Button 
              size="lg" 
              className="bg-[#f59e0b] hover:bg-[#d97706] text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-200 text-lg px-10 py-7 h-auto font-semibold rounded-lg" 
              asChild 
              data-testid="button-cta"
            >
              <a href="/register">Start Your Journey</a>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white/80 text-white hover:bg-white/10 backdrop-blur-sm text-lg px-10 py-7 h-auto font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg"
            >
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                <BookOpen className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-lg font-heading font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">StudentDrive</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              © 2025 StudentDrive. Empowering students everywhere.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
