import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  getUser: vi.fn(),
  result: { data: [] as any[] | null, error: null as any },
  saved: null as any,
}));
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: { rpc: mocks.rpc, from: mocks.from, auth: { getUser: mocks.getUser } },
}));
import {
  createSupportTicket,
  getStudentSupportTickets,
  getSupportTickets,
  sendSupportTicketMessage,
  updateSupportTicket,
} from './admin.support';
import { localSupportTickets } from './localStore';
const ticket = {
  studentName: 'Learner',
  studentEmail: 'learner@example.com',
  subject: 'Help',
  issue: 'Question',
  category: 'Other' as const,
  priority: 'medium' as const,
  status: 'open' as const,
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.result = { data: [], error: null };
  mocks.saved = null;
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'learner' } }, error: null });
  mocks.from.mockImplementation(() => {
    let offset = 0;
    const q: any = {};
    for (const k of ['select', 'order', 'eq', 'update']) q[k] = vi.fn(() => q);
    q.range = vi.fn((value) => {
      offset = value;
      return q;
    });
    q.maybeSingle = vi.fn(async () => ({ data: mocks.saved, error: mocks.result.error }));
    q.then = (resolve: any) =>
      Promise.resolve(offset ? { data: [], error: null } : mocks.result).then(resolve);
    return q;
  });
});
describe('support persistence', () => {
  it('returns failure and does not create a local phantom on insert error', async () => {
    const size = localSupportTickets.length;
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'RLS denied' } });
    expect(await createSupportTicket(ticket)).toMatchObject({
      success: false,
      error: 'RLS denied',
    });
    expect(localSupportTickets).toHaveLength(size);
  });
  it('returns the actual persisted database ID and owner', async () => {
    mocks.rpc.mockResolvedValue({
      data: {
        success: true,
        ticket: {
          id: 'database-id',
          user_id: 'learner',
          student_name: 'Learner',
          student_email: ticket.studentEmail,
          subject: 'Help',
          issue: 'Question',
          category: 'Other',
          priority: 'medium',
          status: 'open',
          created_at: '2026-10-01',
          updated_at: '2026-10-01',
        },
      },
      error: null,
    });
    expect(await createSupportTicket(ticket)).toMatchObject({
      success: true,
      ticketId: 'database-id',
      ticket: { userId: 'learner' },
    });
    expect(mocks.rpc).toHaveBeenCalledWith(
      'create_support_ticket',
      expect.objectContaining({ p_user_id: null, p_student_email: ticket.studentEmail })
    );
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
  it('requires a confirmed ID, not just a success flag', async () => {
    mocks.rpc.mockResolvedValue({ data: { success: true }, error: null });
    expect((await createSupportTicket(ticket)).success).toBe(false);
  });
  it('does not report ticket-update success for zero affected rows', async () => {
    expect((await updateSupportTicket('missing', { status: 'pending' })).success).toBe(false);
  });
  it('saves status and allows resolution notes to be cleared', async () => {
    mocks.saved = { id: 't1' };
    expect(
      (await updateSupportTicket('t1', { status: 'pending', resolutionNotes: '' })).success
    ).toBe(true);
    expect(mocks.from.mock.results[0].value.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending', resolution_notes: '' })
    );
  });
  it('requires successful persistent delivery before accepting a reply', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'Message insert failed' } });
    expect((await sendSupportTicketMessage('t1', 'Answer')).success).toBe(false);
  });
  it('returns a saved internal note separately from a public reply', async () => {
    mocks.rpc.mockResolvedValue({
      data: {
        success: true,
        message: {
          id: 'm1',
          ticket_id: 't1',
          author_name: 'Support',
          author_kind: 'internal_note',
          body: 'Private',
          created_at: '2026-10-01',
        },
      },
      error: null,
    });
    expect(await sendSupportTicketMessage('t1', ' Private ', true)).toMatchObject({
      success: true,
      message: { id: 'm1', authorKind: 'internal_note' },
    });
    expect(mocks.rpc).toHaveBeenCalledWith('send_support_ticket_message', {
      p_ticket_id: 't1',
      p_body: 'Private',
      p_internal: true,
    });
  });
  it('does not silently turn a failed ticket read into an empty list', async () => {
    mocks.result.error = { message: 'Unavailable' };
    await expect(getSupportTickets()).rejects.toThrow('Unavailable');
  });
  it('blocks another student ID and filters internal notes from student responses', async () => {
    await expect(getStudentSupportTickets('other')).rejects.toThrow('own');
    mocks.result.data = [
      {
        id: 't1',
        student_name: 'Learner',
        created_at: '2026-10-01',
        support_ticket_messages: [
          { id: 'public', author_kind: 'support', created_at: '2026-10-01', body: 'Answer' },
          { id: 'private', author_kind: 'internal_note', created_at: '2026-10-01', body: 'Secret' },
        ],
      },
    ];
    expect((await getStudentSupportTickets('learner'))[0].messages?.map((m) => m.id)).toEqual([
      'public',
    ]);
  });
});
