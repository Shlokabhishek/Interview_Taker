import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Clock, 
  MessageSquare,
  Home,
  Mail
} from 'lucide-react';
import { CandidateLayout } from '../../components/layouts';
import { Card, CardContent, Button } from '../../components/shared';

const InterviewComplete = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { candidateName, sessionTitle, questionsAnswered } = location.state || {};

  return (
    <CandidateLayout>
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <Card className="shadow-2xl overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Interview Complete!
              </h1>
              <p className="text-green-100">
                Thank you for your time, {candidateName || 'Candidate'}
              </p>
            </div>

            <CardContent className="p-8">
              {/* Summary */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Session</p>
                    <p className="font-medium text-gray-900">
                      {sessionTitle || 'Interview Session'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Questions Answered</p>
                    <p className="font-medium text-gray-900">
                      {questionsAnswered || 0} questions completed
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium text-gray-900">
                      Submitted for Review
                    </p>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-8">
                <h3 className="font-medium text-blue-900 mb-2">What's Next?</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      The hiring team will review your responses and may contact you 
                      via email for next steps.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Response time typically takes 3-5 business days.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Action */}
              <Button 
                variant="primary" 
                className="w-full"
                icon={Home}
                onClick={() => navigate('/')}
              >
                Return to Home
              </Button>
            </CardContent>
          </Card>

          {/* Footer Note */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Need help? Contact the hiring team directly for any questions 
            about your application.
          </p>
        </div>
      </div>
    </CandidateLayout>
  );
};

export default InterviewComplete;
