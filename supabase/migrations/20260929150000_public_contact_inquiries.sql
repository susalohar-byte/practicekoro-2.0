-- Allow the public Contact Us form to create a tightly constrained support ticket.
-- Visitors (signed out or signed in) can only insert new, unassigned,
-- medium-priority "Other" tickets with no user_id. This policy does not grant
-- read, update, or delete access.

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit contact inquiries" ON public.support_tickets;
CREATE POLICY "Public can submit contact inquiries"
  ON public.support_tickets
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id IS NULL
    AND assigned_to IS NULL
    AND resolution_notes IS NULL
    AND category = 'Other'
    AND priority = 'medium'
    AND status = 'open'
    AND length(trim(coalesce(student_name, ''))) BETWEEN 2 AND 120
    AND length(trim(coalesce(student_email, ''))) BETWEEN 5 AND 254
    AND length(trim(subject)) BETWEEN 3 AND 200
    AND length(trim(issue)) BETWEEN 10 AND 5000
  );

GRANT INSERT ON public.support_tickets TO anon, authenticated;