import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Play, 
  Users, 
  BarChart3, 
  Brain, 
  Video,
  Shield,
  Zap,
  Check
} from 'lucide-react';
import { Button } from '../../components/shared';

const LandingPage = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI Avatar Training',
      description: 'Train an AI avatar with your face and voice to conduct personalized interviews.',
    },
    {
      icon: Video,
      title: 'Video/Audio Interviews',
      description: 'Candidates respond via video and audio while AI avatar asks questions.',
    },
    {
      icon: Users,
      title: 'Multiple Simultaneous Interviews',
      description: 'Conduct interviews with multiple candidates at the same time.',
    },
    {
      icon: BarChart3,
      title: 'AI-Powered Analysis',
      description: 'Automatic scoring based on relevance, accuracy, and confidence.',
    },
    {
      icon: Shield,
      title: 'GDPR Compliant',
      description: 'Secure data handling with privacy-first design.',
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Get comprehensive candidate rankings and insights immediately.',
    },
  ];

  const benefits = [
    'Save 80% of interview time',
    'Eliminate scheduling conflicts',
    'Consistent evaluation criteria',
    'Compare candidates objectively',
    'Focus on top performers',
    'Reduce hiring bias',
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="font-semibold text-gray-900">Interview Pro</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900">How it Works</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
            </nav>

            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full text-primary-700 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              AI-Powered Interview Platform
            </div>
            
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight">
              Conduct Interviews at
              <span className="gradient-text"> Scale with AI</span>
            </h1>
            
            <p className="mt-6 text-xl text-gray-600 leading-relaxed">
              Train an AI avatar with your face and voice. Let it interview hundreds of candidates 
              simultaneously while you focus on what matters most.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button variant="primary" size="xl" icon={ArrowRight} iconPosition="right">
                  Start Free Trial
                </Button>
              </Link>
              <Button variant="outline" size="xl" icon={Play}>
                Watch Demo
              </Button>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                Cancel anytime
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10" />
            <div className="bg-gradient-to-br from-primary-100 to-primary-50 rounded-2xl p-8 shadow-2xl">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <Brain className="w-8 h-8 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI Interview in Progress</h3>
                    <p className="text-sm text-gray-500">3 candidates • 12 questions</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                      <Video className="w-8 h-8 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything You Need to Hire Faster
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform automates the tedious parts of interviewing so you can 
              focus on finding the perfect candidates.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 card-hover"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Get started in minutes with our simple 4-step process
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Train Your AI Avatar', desc: 'Upload your face images and voice samples' },
              { step: 2, title: 'Create Questions', desc: 'Add interview questions with evaluation criteria' },
              { step: 3, title: 'Share the Link', desc: 'Send unique interview links to candidates' },
              { step: 4, title: 'Review Results', desc: 'Get AI-analyzed scores and rankings' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-primary-600 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Why HR Teams Love Interview Pro
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
              <blockquote className="text-lg text-white italic">
                "Interview Pro reduced our time-to-hire by 60%. The AI analysis is incredibly accurate 
                and helps us focus on the best candidates."
              </blockquote>
              <div className="mt-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full" />
                <div>
                  <p className="text-white font-medium">Sarah Johnson</p>
                  <p className="text-primary-200 text-sm">HR Director, TechCorp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Hiring Process?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of companies using AI Interview Pro to find the best talent faster.
          </p>
          <Link to="/register">
            <Button variant="primary" size="xl" icon={ArrowRight} iconPosition="right">
              Get Started for Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="font-semibold text-white">Interview Pro</span>
            </div>
            <div className="flex items-center gap-8">
              <a href="#" className="text-sm text-gray-400 hover:text-white">Privacy Policy</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white">Terms of Service</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white">Contact</a>
            </div>
            <p className="text-sm text-gray-500">© 2026 Interview Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
