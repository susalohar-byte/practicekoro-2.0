import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localSupportTickets } from '@/services/domains/localStore';
import { loadAllPages } from '@/utils/loadAllPages';
import type { SupportTicketItem, SupportTicketMessage } from '@/types';
export const mapSupportMessage = (d: any): SupportTicketMessage => ({
  id: d.id,
  ticketId: d.ticket_id,
  authorName: d.author_name,
  authorKind: d.author_kind,
  body: d.body,
  createdAt: d.created_at,
});
export const mapSupportTicket = (d: any): SupportTicketItem => ({
  id: d.id,
  userId: d.user_id || undefined,
  studentName: d.student_name || 'Student',
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
  messages: (d.support_ticket_messages || [])
    .map(mapSupportMessage)
    .sort((a: SupportTicketMessage, b: SupportTicketMessage) =>
      a.createdAt.localeCompare(b.createdAt)
    ),
});
export async function getSupportTickets(): Promise<SupportTicketItem[]> {
  if (!isSupabaseConfigured) return [...localSupportTickets];
  return loadAllPages(async (limit, offset) => {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*, support_ticket_messages(*)')
      .order('created_at', { ascending: false })
      .order('id')
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return (data || []).map(mapSupportTicket);
  });
}
export async function updateSupportTicket(
  id: string,
  updates: Partial<SupportTicketItem>
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured) {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.resolutionNotes !== undefined) payload.resolution_notes = updates.resolutionNotes;
    if (updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo || null;
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update(payload)
        .eq('id', id)
        .select('id')
        .maybeSingle();
      if (error || data?.id !== id)
        return { success: false, error: error?.message || 'Ticket update was not confirmed.' };
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Update failed.' };
    }
  }
  const index = localSupportTickets.findIndex((t) => t.id === id);
  if (index < 0) return { success: false, error: 'Ticket not found.' };
  localSupportTickets[index] = {
    ...localSupportTickets[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return { success: true };
}
export async function createSupportTicket(
  ticket: Omit<SupportTicketItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; error?: string; ticketId?: string; ticket?: SupportTicketItem }> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc('create_support_ticket', {
        p_student_name: ticket.studentName,
        p_student_email: ticket.studentEmail,
        p_subject: ticket.subject,
        p_issue: ticket.issue,
        p_category: ticket.category || 'Other',
        p_priority: ticket.priority || 'medium',
        p_user_id: ticket.userId || null,
      });
      if (error || data?.success !== true || !data?.ticket?.id)
        return {
          success: false,
          error: error?.message || data?.error || 'Ticket creation was not confirmed.',
        };
      const saved = mapSupportTicket(data.ticket);
      return { success: true, ticketId: saved.id, ticket: saved };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Ticket creation failed.',
      };
    }
  }
  const saved: SupportTicketItem = {
    ...ticket,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  localSupportTickets.unshift(saved);
  return { success: true, ticketId: saved.id, ticket: saved };
}
export async function sendSupportTicketMessage(
  ticketId: string,
  body: string,
  internal = false
): Promise<{ success: boolean; error?: string; message?: SupportTicketMessage }> {
  if (!body.trim()) return { success: false, error: 'A message is required.' };
  if (!isSupabaseConfigured)
    return { success: false, error: 'Message delivery requires a configured backend.' };
  try {
    const { data, error } = await supabase.rpc('send_support_ticket_message', {
      p_ticket_id: ticketId,
      p_body: body.trim(),
      p_internal: internal,
    });
    if (error || data?.success !== true || !data?.message?.id)
      return {
        success: false,
        error: error?.message || data?.error || 'Message save was not confirmed.',
      };
    return { success: true, message: mapSupportMessage(data.message) };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Message delivery failed.',
    };
  }
}
export async function getStudentSupportTickets(userId?: string): Promise<SupportTicketItem[]> {
  if (!isSupabaseConfigured) return localSupportTickets.filter((t) => t.userId === userId);
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user?.id) throw new Error('Sign in to view your tickets.');
  const actorId = authData.user.id;
  if (userId && userId !== actorId) throw new Error('You can only view your own support tickets.');
  return loadAllPages(async (limit, offset) => {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*, support_ticket_messages(*)')
      .eq('user_id', actorId)
      .order('created_at', { ascending: false })
      .order('id')
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return (data || []).map((d) => {
      const ticket = mapSupportTicket(d);
      return {
        ...ticket,
        messages: ticket.messages?.filter((m) => m.authorKind !== 'internal_note'),
      };
    });
  });
}
export const adminSupportApi = {
  getSupportTickets,
  updateSupportTicket,
  createSupportTicket,
  getStudentSupportTickets,
  sendSupportTicketMessage,
};
