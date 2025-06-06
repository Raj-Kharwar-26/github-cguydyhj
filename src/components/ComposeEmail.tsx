
import React, { useState } from 'react';
import { Send, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEmails } from '@/hooks/useTempEmails';
import { useTempEmails } from '@/hooks/useTempEmails';

interface ComposeEmailProps {
  tempEmailId: string;
}

export const ComposeEmail: React.FC<ComposeEmailProps> = ({ tempEmailId }) => {
  const { tempEmails } = useTempEmails();
  const { sendEmail, isSending } = useEmails(tempEmailId);
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    body: ''
  });
  const [sent, setSent] = useState(false);

  const currentTempEmail = tempEmails.find(e => e.id === tempEmailId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentTempEmail) return;

    sendEmail({
      tempEmailId,
      to: formData.to,
      subject: formData.subject,
      body: formData.body,
      from: currentTempEmail.email_address,
    });

    setSent(true);
    setTimeout(() => {
      setSent(false);
      setFormData({ to: '', subject: '', body: '' });
    }, 3000);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (sent) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 border text-center">
        <div className="inline-flex p-4 bg-green-100 rounded-full mb-4">
          <Mail className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Sent Successfully!</h2>
        <p className="text-gray-600">Your email has been delivered from {currentTempEmail?.email_address}</p>
        <Alert className="mt-4 border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Note: This is a demonstration. In a production environment, this would integrate with a real SMTP service to send actual emails.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6">
        <h2 className="text-2xl font-bold mb-2">Compose Email</h2>
        <p className="opacity-90 font-mono">Sending from: {currentTempEmail?.email_address}</p>
      </div>

      {/* Demo Notice */}
      <div className="p-4 bg-yellow-50 border-b border-yellow-200">
        <Alert className="border-yellow-300 bg-yellow-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Demo Mode:</strong> Emails are simulated for demonstration purposes. 
            In production, this would connect to a real SMTP service to send actual emails.
          </AlertDescription>
        </Alert>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* To Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To *
          </label>
          <Input
            type="email"
            placeholder="recipient@example.com"
            value={formData.to}
            onChange={(e) => handleChange('to', e.target.value)}
            required
            className="w-full"
          />
        </div>

        {/* Subject Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject *
          </label>
          <Input
            placeholder="Enter email subject"
            value={formData.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
            required
            className="w-full"
          />
        </div>

        {/* Body Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message *
          </label>
          <Textarea
            placeholder="Type your message here..."
            value={formData.body}
            onChange={(e) => handleChange('body', e.target.value)}
            required
            rows={8}
            className="w-full resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-500">
            <span className="font-medium">{formData.body.length}</span> characters
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormData({ to: '', subject: '', body: '' })}
            >
              Clear
            </Button>
            <Button
              type="submit"
              disabled={isSending || !formData.to || !formData.subject || !formData.body}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              {isSending ? (
                <>
                  <Send className="h-4 w-4 mr-2 animate-pulse" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
