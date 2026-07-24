import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service | Straw Hats Robotics',
  description: 'Terms of Service for the Straw Hats Robotics website and platform.',
};

export default function TermsPage() {
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
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Terms of Service</h1>
            <p className="text-sm text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3">
              <strong>Disclaimer:</strong> This is placeholder terms of service text
              and does not constitute legal advice. We recommend having this reviewed
              by a parent, school advisor, or legal counsel before treating it as
              binding, especially since some team members may be minors.
            </p>

            <div className="space-y-4 text-slate-300 text-sm sm:text-base">
              <h2 className="text-lg sm:text-xl font-semibold text-white">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the Straw Hats Robotics website, you agree to be
                bound by these Terms of Service. If you do not agree, please do not use
                the website.
              </p>

              <h2 className="text-lg sm:text-xl font-semibold text-white">2. Account Responsibilities</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account
                credentials. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide accurate information when creating your account.</li>
                <li>Not share your account credentials with others.</li>
                <li>Not use another person&apos;s account or Member ID without authorization.</li>
                <li>Notify an admin immediately if you suspect unauthorized access.</li>
              </ul>

              <h2 className="text-lg sm:text-xl font-semibold text-white">3. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Use the website for any unlawful purpose.</li>
                <li>Attempt to circumvent security measures or access controls.</li>
                <li>Upload malicious code or attempt to disrupt the service.</li>
                <li>Impersonate another team member or administrator.</li>
                <li>Share your QR attendance code with non-members.</li>
                <li>Send spam, harassing, or abusive messages through the chat system.</li>
                <li>Upload files containing malware, inappropriate content, or content that infringes on intellectual property rights.</li>
              </ul>

              <h2 className="text-lg sm:text-xl font-semibold text-white">4. Attendance System</h2>
              <p>
                The QR-based attendance system is provided as a convenience for team
                tracking. Your QR code is linked to your account and should be kept
                private. Scanning someone else&apos;s QR code or attempting to fraudulently
                mark attendance is grounds for account suspension.
              </p>

              <h2 className="text-lg sm:text-xl font-semibold text-white">5. Chat and Messaging</h2>
              <p>
                The chat system is provided for team communication. By using the chat
                system, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Keep conversations respectful and on-topic for team operations.</li>
                <li>Not share confidential team strategies, code, or proprietary information with non-members.</li>
                <li>Understand that chat messages may be reviewed by administrators for moderation and security purposes.</li>
                <li>Not use the chat system to distribute unauthorized files or media.</li>
              </ul>

              <h2 className="text-lg sm:text-xl font-semibold text-white">6. Voice Messages and Media Uploads</h2>
              <p>
                You may record voice messages and upload images, videos, and files
                through the chat system. By uploading media, you confirm that:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>You have the right to share the content you upload.</li>
                <li>Content does not violate applicable laws or these Terms.</li>
                <li>Administrators reserve the right to remove any content that violates these Terms.</li>
                <li>Voice recordings are stored securely and are only accessible to team members.</li>
              </ul>

              <h2 className="text-lg sm:text-xl font-semibold text-white">7. Termination</h2>
              <p>
                Admins reserve the right to suspend or terminate accounts that violate
                these terms. If your account is terminated, you may request deletion of
                your data as outlined in our Privacy Policy.
              </p>

              <h2 className="text-lg sm:text-xl font-semibold text-white">8. Limitation of Liability</h2>
              <p>
                The Straw Hats Robotics website is provided &quot;as is&quot; without
                warranties of any kind. We are not liable for any damages arising from
                the use or inability to use the website, including but not limited to
                loss of data, service interruptions, or unauthorized access to your account.
              </p>

              <h2 className="text-lg sm:text-xl font-semibold text-white">9. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Changes will be
                effective immediately upon posting. Your continued use of the site
                constitutes acceptance of the modified terms.
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
