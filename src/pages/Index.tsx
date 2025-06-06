
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { EmailGenerator } from '@/components/EmailGenerator';
import { EmailInbox } from '@/components/EmailInbox';
import { ComposeEmail } from '@/components/ComposeEmail';
import { EmailStats } from '@/components/EmailStats';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTempEmails } from '@/hooks/useTempEmails';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('generator');
  const [selectedTempEmail, setSelectedTempEmail] = useState<string | null>(null);
  const { tempEmails } = useTempEmails();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Temporary Email Hub
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Generate secure, temporary email addresses instantly. Receive emails, send messages, and protect your privacy online.
            </p>
            <Button 
              onClick={() => navigate('/auth')}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Get Started
            </Button>
          </div>

          <EmailStats />
        </main>
      </div>
    );
  }

  const handleEmailGenerated = (tempEmailId: string) => {
    setSelectedTempEmail(tempEmailId);
    setActiveTab('inbox');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Welcome back!
          </h1>
          <p className="text-xl text-gray-600">
            Manage your temporary emails
          </p>
        </div>

        <EmailStats />

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-lg border">
            <button
              onClick={() => setActiveTab('generator')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'generator'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-500'
              }`}
            >
              Generate Email
            </button>
            <button
              onClick={() => setActiveTab('inbox')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'inbox'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-500'
              }`}
              disabled={!selectedTempEmail}
            >
              Inbox
            </button>
            <button
              onClick={() => setActiveTab('compose')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'compose'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-500'
              }`}
              disabled={!selectedTempEmail}
            >
              Compose
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'generator' && (
            <EmailGenerator onEmailGenerated={handleEmailGenerated} />
          )}
          
          {activeTab === 'inbox' && selectedTempEmail && (
            <EmailInbox tempEmailId={selectedTempEmail} />
          )}
          
          {activeTab === 'compose' && selectedTempEmail && (
            <ComposeEmail tempEmailId={selectedTempEmail} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
