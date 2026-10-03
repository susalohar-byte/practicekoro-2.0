import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Headphones,
  Building2,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Navbar } from '@/pages/landing/sections/Navbar';
import { Footer } from '@/pages/landing/sections/Footer';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { supabaseRuntime } from '@/lib/supabase';

export const ContactUs: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const { error } = await supabaseRuntime.from('support_tickets').insert({
        user_id: null,
        student_name: name.trim(),
        student_email: email.trim(),
        subject: subject.trim(),
        issue: message.trim(),
        category: 'Other',
        priority: 'medium',
        status: 'open',
        assigned_to: null,
        resolution_notes: null,
      });
      if (error) throw error;
      setIsSubmitting(false);
      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Contact inquiry submission failed:', error);
      setSubmitError('Your message could not be sent. Please retry or email support directly.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-pk-primary selection:text-white">
      {/* Global Navbar */}
      <Navbar />

      {/* Hero Header */}
      <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-16 overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50 dark:from-slate-900/80 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800">
        <div
          aria-hidden="true"
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-pk-primary/10 rounded-full blur-3xl pointer-events-none"
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-pk-primary dark:text-blue-300 text-xs font-semibold">
            <Headphones className="w-3.5 h-3.5" />
            <span>Customer Support & Inquiries</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Contact Us & Support
          </h1>

          <p className="text-base sm:text-lg font-semibold text-pk-primary dark:text-blue-400">
            Contact &amp; Help Center
          </p>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Have questions regarding our mock tests, PYQ solutions, Pro Pass subscription, or need
            technical help? Send us a message or reach out through our official channels.
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10">
          {/* Left Column: Direct Channels & Merchant Disclosure (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Official Support Channels
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Connect directly with our operational team for fast query resolution.
              </p>
            </div>

            {/* Email Channel */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-pk-primary flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Email Us</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Response within 24–48 business hours
                </p>
                <a
                  href="mailto:support@practicekoro.online"
                  className="text-sm font-semibold text-pk-primary hover:underline inline-block pt-1"
                >
                  support@practicekoro.online
                </a>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Support Working Hours
                </h3>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mon – Sat: 10:00 AM – 7:00 PM (IST)
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Closed on Sundays & National / West Bengal Gazetted Holidays.
                </p>
              </div>
            </div>

            {/* Physical Location & Jurisdiction */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Operational Presence
                </h3>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  West Bengal, India
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Registered operating state & exclusive legal jurisdiction.
                </p>
              </div>
            </div>

            {/* Merchant Information Card */}
            <div className="p-5 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Building2 className="w-4 h-4 text-pk-primary" />
                <span>Merchant Information</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <p>
                  <strong>Business Entity:</strong> PracticeKoro EdTech Services
                </p>
                <p>
                  <strong>Operational Website:</strong> practicekoro.online
                </p>
                <p>
                  <strong>Payment Aggregator:</strong> Razorpay Software Private Limited (RBI
                  Authorized)
                </p>
              </div>
            </div>

            {/* Student Helpdesk CTA */}
            <div className="p-5 bg-blue-50/80 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/60 space-y-2">
              <div className="flex items-center gap-2 text-pk-primary dark:text-blue-300 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Enrolled Students</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Need urgent assistance with an active test or payment? Access our dedicated in-app
                Student Helpdesk for ticket tracking.
              </p>
              <Link
                to="/support"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-pk-primary hover:underline pt-1"
              >
                <span>Go to Student Helpdesk</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Inquiry Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-10 shadow-sm space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Send us a Message
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Please provide your details below and our team will get back to you shortly.
                </p>
              </div>

              {submitted ? (
                <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-emerald-900 dark:text-emerald-200">
                    Message Sent Successfully!
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
                    Thank you for contacting PracticeKoro. Our support team will review your inquiry
                    and respond within 24 business hours to your registered email.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSubmitted(false)}
                    className="mt-2 text-xs font-semibold"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {submitError && (
                    <div
                      role="alert"
                      className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                    >
                      {submitError}
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Your Full Name
                    </label>
                    <Input
                      id="contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Mukherjee"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Email Address
                    </label>
                    <Input
                      id="contact-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. rahul@example.com"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Subject / Topic
                    </label>
                    <Input
                      id="contact-subject"
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Pro Pass Subscription or Technical Issue"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Message / Details
                    </label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please provide complete details regarding your query or payment ID..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-pk-primary"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-pk-primary hover:bg-pk-primary-interactive text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    {isSubmitting ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Inquiry</span>
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Quick FAQ Strip */}
        <div className="mt-16 pt-10 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center space-y-1 mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <HelpCircle className="w-4 h-4 text-pk-primary" />
              <span>Frequently Asked Inquiries</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quick answers before reaching out to support
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                When is my Pro Pass activated?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Immediately! Once payment is verified via Razorpay, your account is upgraded
                instantly. If delayed, click &quot;Check Payment Status&quot; on your subscription
                page.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                How do I request a refund?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                If you encountered a duplicate deduction or technical error, email us with your
                Razorpay Payment ID within 7 days as detailed in our Refund Policy.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                How do I report a wrong answer?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                You can flag any question directly during the test or from the Solution review
                screen using the &quot;Report Question&quot; button.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};
