import { Metadata } from 'next';
import Link from 'next/link';
import { Bot } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | Straw Hats Robotics',
  description: 'Privacy Policy for the Straw Hats Robotics website.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Bot className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold text-white">Straw Hats Robotics</span>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16 max-w-3xl">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 space-y-6">
            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
            <p className="text-sm text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3">
              <strong>Disclaimer:</strong> This is placeholder privacy policy text and
              does not constitute legal advice. We recommend having this reviewed by a
              parent, school advisor, or legal counsel before treating it as binding,
              especially since some team members may be minors.
            </p>

            <div className="space-y-4 text-slate-300">
              <h2 className="text-xl font-semibold text-white">1. Data We Collect</h2>
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
              </ul>

              <h2 className="text-xl font-semibold text-white">2. How We Use Your Data</h2>
              <p>
                We use your data solely to operate the team&apos;s attendance tracking
                system and member management. We do not sell, share, or use your data
                for advertising or any purpose beyond team operations.
              </p>

              <h2 className="text-xl font-semibold text-white">3. How Your Data Is Stored</h2>
              <p>
                Your data is stored in a Supabase (PostgreSQL) database with encryption
                at rest. The website is served via Cloudflare, which provides HTTPS
                encryption in transit. Access to your data is restricted through Row Level
                Security (RLS) policies — only you can view your own profile, and only
                admin accounts can view member data.
              </p>

              <h2 className="text-xl font-semibold text-white">4. Who Can Access Your Data</h2>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>You:</strong> Can view and update your own profile information.</li>
                <li><strong>Admins:</strong> Can view all member profiles and attendance records for team management purposes.</li>
                <li><strong>No one else:</strong> We do not share data with third parties.</li>
              </ul>
              <p>
                All admin actions (viewing profiles, marking attendance) are logged in an
                audit trail for accountability.
              </p>

              <h2 className="text-xl font-semibold text-white">5. Data Retention</h2>
              <p>
                We retain your data for as long as your account is active. If you leave
                the team or request deletion, your personal data will be removed from our
                systems within a reasonable timeframe.
              </p>

              <h2 className="text-xl font-semibold text-white">6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Request a copy of all data we hold about you.</li>
                <li>Request correction of inaccurate data.</li>
                <li>Request deletion of your account and associated data.</li>
              </ul>
              <p>
                To exercise any of these rights, contact the team admin through the
                website or email.
              </p>

              <h2 className="text-xl font-semibold text-white">7. Children&apos;s Privacy</h2>
              <p>
                Some team members may be under 18. We take extra care to protect minors&apos;
                data. We do not knowingly collect data beyond what is necessary for team
                operations. Parents or guardians may contact us to review or delete their
                child&apos;s data.
              </p>

              <h2 className="text-xl font-semibold text-white">8. Changes to This Policy</h2>
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
