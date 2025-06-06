
import React, { useState } from 'react';
import { Mail, Copy, RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTempEmails } from '@/hooks/useTempEmails';

interface EmailGeneratorProps {
  onEmailGenerated: (tempEmailId: string) => void;
}

export const EmailGenerator: React.FC<EmailGeneratorProps> = ({ onEmailGenerated }) => {
  const [customUsername, setCustomUsername] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [copied, setCopied] = useState(false);
  
  const { tempEmails, domains, createTempEmail, isCreating, simulateEmail, isSimulating } = useTempEmails();

  const generateRandomUsername = () => {
    const adjectives = ['quick', 'temp', 'fast', 'secure', 'anon', 'private'];
    const nouns = ['mail', 'box', 'user', 'temp', 'guest', 'visitor'];
    const numbers = Math.floor(Math.random() * 999);
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adj}${noun}${numbers}`;
  };

  const handleGenerate = (useCustom = false) => {
    const username = useCustom && customUsername ? customUsername : generateRandomUsername();
    const domain = selectedDomain || domains[Math.floor(Math.random() * domains.length)];
    
    createTempEmail({ username, domain });
  };

  const copyToClipboard = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateEmail = (emailAddress: string) => {
    simulateEmail(emailAddress);
  };

  return (
    <div className="space-y-6">
      {/* Email Generator Card */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-blue-100 rounded-full mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate Temporary Email</h2>
          <p className="text-gray-600">Create a secure, temporary email address that expires automatically</p>
        </div>

        <div className="space-y-6">
          {/* Custom Username Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Username (Optional)
            </label>
            <div className="flex space-x-2">
              <Input
                placeholder="Enter custom username"
                value={customUsername}
                onChange={(e) => setCustomUsername(e.target.value)}
                className="flex-1"
              />
              <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  {domains.map((domain) => (
                    <SelectItem key={domain} value={domain}>
                      @{domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => handleGenerate(true)}
                disabled={isCreating || !customUsername}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isCreating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  'Generate'
                )}
              </Button>
            </div>
          </div>

          {/* Or Divider */}
          <div className="flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Random Generation */}
          <div className="text-center">
            <Button
              onClick={() => handleGenerate(false)}
              disabled={isCreating}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3"
            >
              {isCreating ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Mail className="h-5 w-5 mr-2" />
                  Generate Random Email
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Active Emails */}
      {tempEmails.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Active Temporary Emails</h3>
          <div className="space-y-3">
            {tempEmails.map((email) => (
              <div
                key={email.id}
                className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-mono text-lg text-gray-900 mb-2">
                      {email.email_address}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600 flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Active until {new Date(email.expires_at).toLocaleString()}
                      </span>
                      <span className="text-gray-500">
                        Created {new Date(email.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleSimulateEmail(email.email_address)}
                      disabled={isSimulating}
                      variant="outline"
                      size="sm"
                      className="text-purple-600 border-purple-300 hover:bg-purple-50"
                    >
                      {isSimulating ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-1" />
                          Test Email
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => copyToClipboard(email.email_address)}
                      variant="outline"
                      size="sm"
                      className={copied ? 'bg-green-500 text-white' : ''}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button
                      onClick={() => onEmailGenerated(email.id)}
                      size="sm"
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      View Inbox
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
