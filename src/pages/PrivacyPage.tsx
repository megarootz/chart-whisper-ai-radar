
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';

const PrivacyPage = () => {
  return (
    <>
      <SEOHead />
      <div className="min-h-screen bg-chart-bg">
        <Header />
        
        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="bg-chart-card border border-gray-700 rounded-lg p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
            <p className="text-gray-400 mb-8">Last updated: December 2024</p>
            
            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
                <p className="text-gray-300 mb-4">
                  ForexRadar7 ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered forex chart analysis service.
                </p>
                <p className="text-gray-300">
                  By using ForexRadar7, you consent to the data practices described in this policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">2. Information We Collect</h2>
                
                <h3 className="text-lg font-medium text-white mb-3">2.1 Personal Information</h3>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1">
                  <li>Email address and username for account creation</li>
                  <li>Payment information for subscription services</li>
                  <li>Profile information you choose to provide</li>
                </ul>

                <h3 className="text-lg font-medium text-white mb-3">2.2 Usage Data</h3>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1">
                  <li>Chart images you upload for analysis</li>
                  <li>Analysis results and history</li>
                  <li>Usage statistics and feature interactions</li>
                  <li>Device information and browser type</li>
                  <li>IP address and location data</li>
                </ul>

                <h3 className="text-lg font-medium text-white mb-3">2.3 Cookies and Tracking</h3>
                <p className="text-gray-300">
                  We use cookies and similar technologies to enhance your experience, remember your preferences, and analyze usage patterns.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Provide and improve our AI chart analysis services</li>
                  <li>Process your subscription and manage your account</li>
                  <li>Communicate with you about service updates and support</li>
                  <li>Analyze usage patterns to enhance our platform</li>
                  <li>Ensure security and prevent fraud</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">4. Information Sharing and Disclosure</h2>
                <p className="text-gray-300 mb-4">
                  We do not sell, trade, or rent your personal information. We may share your information in the following circumstances:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li><strong>Service Providers:</strong> With trusted third-party services (Supabase, payment processors) that help us operate our platform</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                  <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
                  <li><strong>Consent:</strong> With your explicit consent for other purposes</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">5. Data Security</h2>
                <p className="text-gray-300 mb-4">
                  We implement industry-standard security measures to protect your information:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication</li>
                  <li>Secure cloud infrastructure</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">6. Data Retention</h2>
                <p className="text-gray-300 mb-4">
                  We retain your information for as long as necessary to provide our services and comply with legal obligations:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Account data: Until account deletion</li>
                  <li>Chart analysis history: Up to 2 years or until deletion requested</li>
                  <li>Usage logs: Up to 1 year for security and analytics</li>
                  <li>Payment records: As required by financial regulations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">7. Your Rights</h2>
                <p className="text-gray-300 mb-4">
                  You have the following rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your data</li>
                  <li><strong>Portability:</strong> Receive your data in a structured format</li>
                  <li><strong>Restriction:</strong> Limit how we process your data</li>
                  <li><strong>Objection:</strong> Object to certain processing activities</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">8. International Data Transfers</h2>
                <p className="text-gray-300">
                  Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this privacy policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">9. Children's Privacy</h2>
                <p className="text-gray-300">
                  Our service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children under 18.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">10. Changes to This Policy</h2>
                <p className="text-gray-300">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">11. Contact Us</h2>
                <p className="text-gray-300">
                  If you have any questions about this Privacy Policy or our data practices, please contact us at:
                </p>
                <div className="bg-gray-800 p-4 rounded-lg mt-4">
                  <p className="text-gray-300">Email: privacy@forexradar7.com</p>
                  <p className="text-gray-300">Subject: Privacy Policy Inquiry</p>
                </div>
              </section>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default PrivacyPage;
