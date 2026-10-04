import React from 'react';
import { Link } from 'react-router-dom';

const CandidateLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="font-semibold text-white">Interview Pro</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">AI-Powered Interview</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-16 min-h-screen">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-black/20 border-t border-white/10 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2026 Interview Pro. Your data is securely stored and processed in accordance with GDPR.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CandidateLayout;
