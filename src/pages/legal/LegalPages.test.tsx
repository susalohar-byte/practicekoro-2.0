import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@/context/ThemeContext';
import { TermsAndConditions } from './TermsAndConditions';
import { PrivacyPolicy } from './PrivacyPolicy';
import { RefundPolicy } from './RefundPolicy';
import { ContactUs } from './ContactUs';

const insertContactInquiry = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/lib/supabase', () => ({
  supabaseRuntime: {
    from: vi.fn(() => ({
      insert: insertContactInquiry,
    })),
  },
}));

// Mock AuthContext
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAdmin: false,
  }),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </ThemeProvider>
  );
};

describe('Legal & Compliance Pages (Razorpay & Indian Statutory Compliance)', () => {
  describe('TermsAndConditions Component', () => {
    it('renders terms title, bengali description, and key compliance sections', () => {
      renderWithProviders(<TermsAndConditions />);

      expect(
        screen.getByRole('heading', { level: 1, name: /Terms and Conditions/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/General Terms & Conditions of Use/i)).toBeInTheDocument();
      expect(screen.getByText(/1\. Introduction & Acceptance of Terms/i)).toBeInTheDocument();
      expect(screen.getByText(/3\. Subscriptions, Payments & Access Rights/i)).toBeInTheDocument();
      expect(screen.getByText(/4\. Intellectual Property Rights/i)).toBeInTheDocument();
      expect(screen.getByText(/5\. Non-Affiliation Disclaimer/i)).toBeInTheDocument();
      expect(screen.getByText(/7\. Governing Law & Jurisdiction/i)).toBeInTheDocument();

      // Check jurisdiction
      expect(screen.getAllByText(/West Bengal, India/i).length).toBeGreaterThan(0);
      // Check Razorpay reference
      expect(
        screen.getByText(/All monetary transactions on PracticeKoro are securely processed via/i)
      ).toBeInTheDocument();
      expect(screen.getAllByText(/Razorpay/i).length).toBeGreaterThan(0);
      // Check official contact email
      expect(screen.getByText('support@practicekoro.online')).toBeInTheDocument();
    });
  });

  describe('PrivacyPolicy Component', () => {
    it('renders privacy policy, payment security, and grievance officer disclosure', () => {
      renderWithProviders(<PrivacyPolicy />);

      expect(
        screen.getByRole('heading', { level: 1, name: /Privacy Policy/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/Privacy & Data Protection Policy/i)).toBeInTheDocument();
      expect(
        screen.getByText(/3\. Payment Card & Financial Information Security/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/We Do NOT Store Your Financial Card or UPI MPIN Details/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/7\. Grievance Redressal Officer/i)).toBeInTheDocument();

      // Check Grievance Redressal details
      expect(screen.getByText(/Grievance Redressal & Privacy Officer/i)).toBeInTheDocument();
      expect(screen.getByText(/Acknowledgement within 24–48 hours/i)).toBeInTheDocument();
    });
  });

  describe('RefundPolicy Component', () => {
    it('renders refund policy, eligibility criteria, and 5-7 day processing window', () => {
      renderWithProviders(<RefundPolicy />);

      expect(
        screen.getByRole('heading', { level: 1, name: /Refund & Cancellation Policy/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/Refund & Subscription Cancellation Policy/i)).toBeInTheDocument();
      expect(screen.getByText(/Eligible for 100% Full Refund:/i)).toBeInTheDocument();
      expect(screen.getByText(/Non-Refundable Circumstances:/i)).toBeInTheDocument();
      expect(screen.getByText(/3\. Subscription Cancellation Policy/i)).toBeInTheDocument();
      expect(screen.getByText(/4\. Step-by-Step Refund Request Process/i)).toBeInTheDocument();
      expect(screen.getByText(/5\. Refund Turnaround & Payout Timelines/i)).toBeInTheDocument();

      // Check banking timelines
      expect(screen.getByText(/5 to 7 business working days/i)).toBeInTheDocument();
      expect(screen.getByText(/2 to 5 business working days/i)).toBeInTheDocument();
    });
  });

  describe('ContactUs Component', () => {
    it('renders merchant information, operational hours, and handles form submission', async () => {
      renderWithProviders(<ContactUs />);

      expect(
        screen.getByRole('heading', { level: 1, name: /Contact Us & Support/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/Contact & Help Center/i)).toBeInTheDocument();
      expect(screen.getByText(/Mon – Sat: 10:00 AM – 7:00 PM/i)).toBeInTheDocument();
      expect(screen.getByText(/Merchant Information/i)).toBeInTheDocument();

      // Fill out inquiry form
      const nameInput = screen.getByLabelText(/Your Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const subjectInput = screen.getByLabelText(/Subject \/ Topic/i);
      const messageInput = screen.getByPlaceholderText(/Please provide complete details/i);
      const submitBtn = screen.getByRole('button', { name: /Submit Inquiry/i });

      fireEvent.change(nameInput, { target: { value: 'Arindam Ghosh' } });
      fireEvent.change(emailInput, { target: { value: 'arindam@example.com' } });
      fireEvent.change(subjectInput, { target: { value: 'Payment verification query' } });
      fireEvent.change(messageInput, { target: { value: 'I made a payment of Rs 299 via UPI.' } });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(insertContactInquiry).toHaveBeenCalledWith(
          expect.objectContaining({
            student_name: 'Arindam Ghosh',
            student_email: 'arindam@example.com',
            subject: 'Payment verification query',
          })
        );
      });

      expect(screen.getByText(/Message Sent Successfully!/i)).toBeInTheDocument();
      expect(screen.getByText(/Thank you for contacting PracticeKoro/i)).toBeInTheDocument();
    });
  });
});
