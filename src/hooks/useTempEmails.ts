
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface TempEmail {
  id: string;
  email_address: string;
  display_name?: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export interface Email {
  id: string;
  from_address: string;
  to_address: string;
  subject?: string;
  body_text?: string;
  body_html?: string;
  is_read: boolean;
  received_at: string;
  temporary_email_id: string;
  email_type: string;
  is_sent: boolean;
}

export const useTempEmails = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's temporary emails
  const { data: tempEmails = [], isLoading: tempEmailsLoading } = useQuery({
    queryKey: ['temp-emails', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('temporary_emails')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TempEmail[];
    },
    enabled: !!user,
  });

  // Fetch available domains
  const { data: domains = [] } = useQuery({
    queryKey: ['email-domains'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_domains')
        .select('domain')
        .eq('is_active', true);

      if (error) throw error;
      return data.map(d => d.domain);
    },
  });

  // Create temporary email mutation
  const createTempEmailMutation = useMutation({
    mutationFn: async ({ username, domain }: { username: string; domain: string }) => {
      if (!user) throw new Error('User not authenticated');

      const email_address = `${username}@${domain}`;
      const expires_at = new Date();
      expires_at.setHours(expires_at.getHours() + 24); // 24 hour expiry

      const { data, error } = await supabase
        .from('temporary_emails')
        .insert({
          user_id: user.id,
          email_address,
          expires_at: expires_at.toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temp-emails'] });
      toast({
        title: "Success",
        description: "Temporary email created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create temporary email",
        variant: "destructive",
      });
    },
  });

  // Simulate incoming email for testing
  const simulateEmailMutation = useMutation({
    mutationFn: async (tempEmailAddress: string) => {
      const { data, error } = await supabase.functions.invoke('simulate-incoming-email', {
        body: { tempEmailAddress }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      toast({
        title: "Test Email Received",
        description: "A simulated email has been added to your inbox!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to simulate incoming email",
        variant: "destructive",
      });
    },
  });

  return {
    tempEmails,
    tempEmailsLoading,
    domains,
    createTempEmail: createTempEmailMutation.mutate,
    isCreating: createTempEmailMutation.isPending,
    simulateEmail: simulateEmailMutation.mutate,
    isSimulating: simulateEmailMutation.isPending,
  };
};

export const useEmails = (tempEmailId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch emails for a specific temporary email
  const { data: emails = [], isLoading: emailsLoading, refetch } = useQuery({
    queryKey: ['emails', tempEmailId],
    queryFn: async () => {
      if (!tempEmailId) return [];
      
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('temporary_email_id', tempEmailId)
        .order('received_at', { ascending: false });

      if (error) throw error;
      return data as Email[];
    },
    enabled: !!tempEmailId,
    refetchInterval: 5000, // Refetch every 5 seconds for demo purposes
  });

  // Set up real-time subscription for new emails
  useEffect(() => {
    if (!tempEmailId) return;

    console.log('Setting up realtime subscription for emails:', tempEmailId);

    const channel = supabase
      .channel(`emails-${tempEmailId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'emails',
          filter: `temporary_email_id=eq.${tempEmailId}`,
        },
        (payload) => {
          console.log('New email received via realtime:', payload);
          queryClient.invalidateQueries({ queryKey: ['emails', tempEmailId] });
          toast({
            title: "New Email Received!",
            description: `From: ${payload.new.from_address}`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'emails',
          filter: `temporary_email_id=eq.${tempEmailId}`,
        },
        (payload) => {
          console.log('Email updated via realtime:', payload);
          queryClient.invalidateQueries({ queryKey: ['emails', tempEmailId] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [tempEmailId, queryClient, toast]);

  // Mark email as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const { error } = await supabase
        .from('emails')
        .update({ is_read: true })
        .eq('id', emailId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });

  // Send email mutation using edge function
  const sendEmailMutation = useMutation({
    mutationFn: async ({
      tempEmailId,
      to,
      subject,
      body,
      from
    }: {
      tempEmailId: string;
      to: string;
      subject: string;
      body: string;
      from: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { tempEmailId, to, subject, body, from }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      toast({
        title: "Success",
        description: "Email sent successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    },
  });

  return {
    emails,
    emailsLoading,
    markAsRead: markAsReadMutation.mutate,
    sendEmail: sendEmailMutation.mutate,
    isSending: sendEmailMutation.isPending,
    refetchEmails: refetch,
  };
};
