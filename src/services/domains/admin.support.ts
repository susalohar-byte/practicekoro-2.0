import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localSupportTickets } from '@/services/domains/localStore';
import type { SupportTicketItem } from '@/types';

/** Section of the admin API: support (split from domains/admin.ts, same behaviour). */
// --------------------------------------------------------------------------
// SUPPORT TICKETS API
// --------------------------------------------------------------------------
export async function getSupportTickets(): Promise<SupportTicketItem[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          userId: d.user_id || undefined,
          studentName: d.student_name || 'Student Aspirant',
          studentEmail: d.student_email || '',
          subject: d.subject,
          issue: d.issue,
          category: d.category,
          priority: d.priority,
          status: d.status,
          assignedTo: d.assigned_to || undefined,
          resolutionNotes: d.resolution_notes || undefined,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
      }
    } catch (err) {
      console.warn('Failed to load support tickets from Supabase:', err);
    }
    return [];
  }

  return [...localSupportTickets];
}

export async function updateSupportTicket(
  id: string,
  updates: Partial<SupportTicketItem>
): Promise<{ success: boolean; error?: string }> {
  const idx = localSupportTickets.findIndex((t) => t.id === id);
  if (idx !== -1) {
    localSupportTickets[idx] = {
      ...localSupportTickets[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  }

  if (isSupabaseConfigured) {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.status) payload.status = updates.status;
    if (updates.priority) payload.priority = updates.priority;
    if (updates.resolutionNotes !== undefined) payload.resolution_notes = updates.resolutionNotes;
    if (updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo;

    try {
      const { error } = await supabase.from('support_tickets').update(payload).eq('id', id);
      if (error) return { success: false, error: error.message };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Update failed' };
    }
  }

  return { success: true };
}

export async function createSupportTicket(
  ticket: Omit<SupportTicketItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; error?: string; ticketId?: string }> {
  const generatedId = `tkt_${Date.now()}`;
  const newTicket: SupportTicketItem = {
    id: generatedId,
    userId: ticket.userId,
    studentName: ticket.studentName || 'Student Candidate',
    studentEmail: ticket.studentEmail || '',
    subject: ticket.subject,
    issue: ticket.issue,
    category: ticket.category || 'Other',
    priority: ticket.priority || 'medium',
    status: ticket.status || 'open',
    resolutionNotes: ticket.resolutionNotes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  localSupportTickets.unshift(newTicket);

  if (isSupabaseConfigured) {
    let resolvedUserId = ticket.userId || null;
    if (!resolvedUserId) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        resolvedUserId = authData?.user?.id || null;
      } catch {
        // ignore auth error
      }
    }

    try {
      const { error } = await supabase.from('support_tickets').insert({
        user_id: resolvedUserId,
        student_name: ticket.studentName || 'Student Candidate',
        student_email: ticket.studentEmail || '',
        subject: ticket.subject,
        issue: ticket.issue,
        category: ticket.category || 'Other',
        priority: ticket.priority || 'medium',
        status: ticket.status || 'open',
        resolution_notes: ticket.resolutionNotes || null,
      });
      if (error) {
        console.warn('Supabase support_tickets insert notice (stored locally):', error.message);
      }
    } catch (err: any) {
      console.warn('Supabase support_tickets exception (stored locally):', err?.message || err);
    }
  }

  return { success: true, ticketId: generatedId };
}

export async function getStudentSupportTickets(userId?: string): Promise<SupportTicketItem[]> {
  if (isSupabaseConfigured) {
    let targetUserId = userId;
    if (!targetUserId) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        targetUserId = authData?.user?.id;
      } catch {
        // ignore
      }
    }

    if (targetUserId) {
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            userId: d.user_id || undefined,
            studentName: d.student_name || 'Student Candidate',
            studentEmail: d.student_email || '',
            subject: d.subject,
            issue: d.issue,
            category: d.category,
            priority: d.priority,
            status: d.status,
            assignedTo: d.assigned_to || undefined,
            resolutionNotes: d.resolution_notes || undefined,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Failed to load student support tickets from Supabase:', err);
      }
    }
    return [];
  }

  if (userId) {
    const filtered = localSupportTickets.filter((t) => !t.userId || t.userId === userId);
    return filtered.length > 0 ? filtered : [...localSupportTickets];
  }
  return [...localSupportTickets];
}

export const adminSupportApi = {
  getSupportTickets,
  updateSupportTicket,
  createSupportTicket,
  getStudentSupportTickets,
};
