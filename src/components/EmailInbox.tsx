
import React, { useState } from 'react';
import { Mail, Trash, MailOpen, RefreshCw, Eye, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEmails } from '@/hooks/useTempEmails';
import { useTempEmails } from '@/hooks/useTempEmails';

interface EmailInboxProps {
  tempEmailId: string;
}

export const EmailInbox: React.FC<EmailInboxProps> = ({ tempEmailId }) => {
  const { emails, emailsLoading, markAsRead, refetchEmails } = useEmails(tempEmailId);
  const { tempEmails } = useTempEmails();
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  const currentTempEmail = tempEmails.find(e => e.id === tempEmailId);

  const handleEmailClick = (email: any) => {
    setSelectedEmail(email);
    if (!email.is_read) {
      markAsRead(email.id);
    }
  };

  const handleRefresh = () => {
    refetchEmails();
  };

  const unreadCount = emails.filter(e => !e.is_read).length;
  const receivedEmails = emails.filter(e => e.email_type === 'received');
  const sentEmails = emails.filter(e => e.email_type === 'sent');

  if (emailsLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading emails...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Email Inbox</h2>
            <p className="opacity-90 font-mono">{currentTempEmail?.email_address}</p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="secondary"
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-4">
            <Badge variant="secondary" className="bg-white/20 text-white">
              <Mail className="h-3 w-3 mr-1" />
              {receivedEmails.length} received
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white">
              <Eye className="h-3 w-3 mr-1" />
              {unreadCount} unread
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white">
              <MailOpen className="h-3 w-3 mr-1" />
              {sentEmails.length} sent
            </Badge>
          </div>
          <div className="flex items-center text-sm opacity-75">
            <Clock className="h-4 w-4 mr-1" />
            Expires: {currentTempEmail && new Date(currentTempEmail.expires_at).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex h-96">
        {/* Email List */}
        <div className="w-1/2 border-r bg-gray-50">
          {emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Mail className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No emails yet</p>
              <p className="text-sm text-center px-4">
                Your emails will appear here when they arrive. 
                <br />Try the "Test Email" button to simulate receiving an email!
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto h-full">
              {emails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => handleEmailClick(email)}
                  className={`p-4 border-b cursor-pointer transition-colors ${
                    selectedEmail?.id === email.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-100'
                  } ${!email.is_read && email.email_type === 'received' ? 'font-semibold bg-blue-25' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {email.email_type === 'sent' ? `To: ${email.to_address}` : `From: ${email.from_address}`}
                      </span>
                      {email.email_type === 'sent' && (
                        <Badge variant="outline" className="text-xs">Sent</Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(email.received_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center mb-1">
                    {!email.is_read && email.email_type === 'received' && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    )}
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {email.subject || 'No Subject'}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-600 truncate">
                    {email.body_text?.substring(0, 100) || 'No preview available'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email Content */}
        <div className="w-1/2 bg-white">
          {selectedEmail ? (
            <div className="h-full flex flex-col">
              {/* Email Header */}
              <div className="p-6 border-b bg-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {selectedEmail.subject || 'No Subject'}
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>From:</strong> {selectedEmail.from_address}</p>
                      <p><strong>To:</strong> {selectedEmail.to_address}</p>
                      <p><strong>Date:</strong> {new Date(selectedEmail.received_at).toLocaleString()}</p>
                      <p><strong>Type:</strong> 
                        <Badge variant={selectedEmail.email_type === 'sent' ? 'default' : 'secondary'} className="ml-2">
                          {selectedEmail.email_type}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <MailOpen className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="prose max-w-none">
                  {selectedEmail.body_html ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                      {selectedEmail.body_text || 'No content available'}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MailOpen className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Select an email to view</p>
              <p className="text-sm text-center">Choose an email from the list to read its content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
