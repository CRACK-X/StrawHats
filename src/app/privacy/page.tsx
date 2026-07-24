import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | Straw Hats Robotics',
  description: 'Privacy Policy for the Straw Hats Robotics website and platform.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <img src="/New_LOGO.png" alt="Straw Hats Robotics" className="h-8 w-auto" />
            <span className="text-xl font-bold text-white">Straw Hats Robotics</span>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-3xl">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Privacy Policy</h1>
            <p className="text-sm text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3">
              <strong>Disclaimer:</strong> This is placeholder privacy policy text and
              does not constitute legal advice. We recommend having this reviewed by a
              parent, school advisor, or legal counsel before treating it as binding,
              especially since some team members may be minors.
            </p>

            <div className="space-y-4 text-slate-300 text-sm sm:text-base">
              <h2 className="text-lg sm:text-xl font-semibold text-white">1. Data We Collect</h2>
              <p>
                When you create an account and use the Straw Hats Robotics website, we
                collect the following personal information:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Full name</li>
                <li>Email address</li>
                <li>Member ID (admin-issued)</li>
                <li>Attendance timestamps (when you scan in at meetings)</li>
                <li>QR code token (a random, non-identifying token used for check-in)</li>
                <li>Chat messages, voice messages, and file uploads you send through the platform</li>
                <li>Device and browser information for security logging</li>
              </ul>

              <h2 className="text-lg sm:text-xl font-semibold text-white">2. How We Use Your Data</h2>
              <p>
                We use your data solely to operate the team&apos;s attendance tracking
                system, member management, and internal communication. Specifically:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Authentication and account management</li>
                <li>Attendance tracking and reporting</li>
                <li>Internal team chat and file sharing</li>
                <li>Security logging and abuse prevention</li>
                <li>We do not sell, share, or use your data for advertising or any purpose beyond team operations.</li>
              </ul>

              <h2 className="text-lg sm:text-xl font-semibold text-white">3. Chat and Message Data</h2>
              <p>
                Messages you send through the chat system, including text messages,
                voice recordings, images, videos, and file attachments, are stored
                securely in our database. This data is:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Only accessible to authenticated team members</li>
                <li>Subject to administrative review for moderation purposes</li>
                <li>Stored with the same encryption and security as all other platform data</li>
                <li>Retained for the duration of your account unless you request deletion</li>
              </ul>
              <p>
                Voice messages are uploaded as audio files and stored in secure cloud
                storage. They are accessible only through the authenticated chat interface.
              </p>

              <h2 className="text-lg sm:text-xl font-semibold text-white">4. How Your Data Is Stored</h2>
              <p>
                Your data is stored in a Supabase (PostgreSQL) database with encryption
                at rest. File uploads (images, voice messages, documents) are stored in
                Supabase Storage with access controls. The website is served via
                Cloudflare, which provides HTTPS encryption in transit. Access to your
                data is restricted through Row Level Security (RLS) policies — only you
                can view your own profile, and only admin accounts can view member data.
              </p>

              <h2 className="text-lg sm:text-xl font-semibold text-white">5. Who Can Access Your Data</h2>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>You:</strong> Can view and update your own profile, messages, and uploads.</li>
                <li><strong>Team Members:</strong> Can see your display name and Member ID in the chat system and team directory.</li>
                <li><strong>Admins:</strong> Can view all member profiles and attendance records for team management purposes. Admins can also moderate chat content.</li>
                <li><strong>No one else:</strong> We do not share data with third parties.</li>
              </ul>
              <p>
                All admin actions (viewing profiles, marking attendance, moderating content)
                are logged in an audit trail for accountability.
              </p>

              <h2 className="text-lg sm:text-xl font-semibold text-white">6. Data Retention</h2>
              <p>
                We retain your data for as long as your account is active. Chat messages
                and file uploads are retained alongside your account. If you leave
                the team or request deletion, your personal data will be removed from our
                systems within a reasonable timeframe. Messages you sent may persist in
                other users&apos; conversation history.
              </p>

              <h2 className="text-lg sm:text-xl font-semibold text-white">7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Request a copy of all data we hold about you.</li>
                <li>Request correction of inaccurate data.</li>
                <li>Request deletion of your account and associated data.</li>
                <li>Request deletion of specific messages or uploads you have sent.</li>
              </ul>
              <p>
                To exercise any of these rights, contact the team admin through the
                website or email.
              </p>

              <h2 className="text-lg sm:text-xl font-semibold text-white">8. Children&apos;s Privacy</h2>
              <p>
                Some team members may be under 18. We take extra care to protect minors&apos;
                data. We do not knowingly collect data beyond what is necessary for team
                operations. Parents or guardians may contact us to review or delete their
                child&apos;s data.
              </p>

              <h2 className="text-lg sm:text-xl font-semibold text-white">9. Security</h2>
              <p>
                We implement industry-standard security measures including:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Encrypted data storage and transmission (HTTPS/TLS)</li>
                <li>Row Level Security (RLS) policies on all database tables</li>
                <li>Rate limiting on authentication and API endpoints</li>
                <li>Admin action audit logging</li>
                <li>Cloudflare Turnstile CAPTCHA protection on login/signup</li>
              </ul>
              <p>
                While we strive to protect your data, no method of electronic storage
                or transmission is 100% secure. We cannot guarantee absolute security.
              </p>

              <h2 className="text-lg sm:text-xl font-semibold text-white">10. Changes to This Policy</h2>
              <p>
                We may update this policy from time to time. Changes will be posted on
                this page with an updated date. Continued use of the site after changes
                constitutes acceptance of the updated policy.
              </p>

              <p className="text-sm text-slate-500 pt-4">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
