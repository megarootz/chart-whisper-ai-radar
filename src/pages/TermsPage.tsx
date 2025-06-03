
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';

const TermsPage = () => {
  return (
    <>
      <SEOHead />
      <div className="min-h-screen bg-chart-bg">
        <Header />
        
        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="bg-chart-card border border-gray-700 rounded-lg p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
            <p className="text-gray-400 mb-8">Last updated: December 2024</p>
            
            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-300 mb-4">
                  By accessing and using ForexRadar7 ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
                <p className="text-gray-300">
                  These Terms of Service govern your use of our AI-powered forex chart analysis platform and related services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">2. Service Description</h2>
                <p className="text-gray-300 mb-4">
                  ForexRadar7 provides AI-powered technical analysis of forex trading charts, including but not limited to:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Chart pattern recognition and analysis</li>
                  <li>Support and resistance level identification</li>
                  <li>Entry and exit point recommendations</li>
                  <li>Risk assessment and management suggestions</li>
                  <li>Trading signal generation</li>
                  <li>Historical analysis tracking</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">3. User Responsibilities</h2>
                <h3 className="text-lg font-medium text-white mb-3">3.1 Account Security</h3>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1">
                  <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                  <li>You must notify us immediately of any unauthorized use of your account</li>
                  <li>You are responsible for all activities that occur under your account</li>
                </ul>

                <h3 className="text-lg font-medium text-white mb-3">3.2 Acceptable Use</h3>
                <p className="text-gray-300 mb-4">You agree not to:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Use the service for any illegal or unauthorized purpose</li>
                  <li>Upload malicious content or attempt to compromise system security</li>
                  <li>Reverse engineer, decompile, or attempt to extract our algorithms</li>
                  <li>Share your account credentials with others</li>
                  <li>Use automated systems to access the service beyond normal usage</li>
                  <li>Violate any laws in your jurisdiction</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">4. Subscription and Billing</h2>
                <h3 className="text-lg font-medium text-white mb-3">4.1 Subscription Plans</h3>
                <p className="text-gray-300 mb-4">
                  We offer various subscription tiers with different features and usage limits. Subscription fees are charged in advance on a monthly or annual basis.
                </p>

                <h3 className="text-lg font-medium text-white mb-3">4.2 Payment Terms</h3>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1">
                  <li>All fees are non-refundable unless required by law</li>
                  <li>We reserve the right to change our pricing with 30 days notice</li>
                  <li>Failed payments may result in service suspension</li>
                  <li>You may cancel your subscription at any time</li>
                </ul>

                <h3 className="text-lg font-medium text-white mb-3">4.3 Cancellation</h3>
                <p className="text-gray-300">
                  You may cancel your subscription at any time. Upon cancellation, your access to premium features will continue until the end of your current billing period.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">5. Trading Disclaimer</h2>
                <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4 mb-4">
                  <p className="text-red-400 font-semibold mb-2">IMPORTANT TRADING DISCLAIMER</p>
                  <p className="text-gray-300 text-sm">
                    ForexRadar7 provides educational and analytical tools only. Our AI analysis and recommendations are for informational purposes and do not constitute financial advice.
                  </p>
                </div>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Trading forex involves substantial risk of loss and is not suitable for all investors</li>
                  <li>Past performance does not guarantee future results</li>
                  <li>You should carefully consider your investment objectives and risk tolerance</li>
                  <li>Never invest money you cannot afford to lose</li>
                  <li>Seek independent financial advice if needed</li>
                  <li>We are not responsible for trading losses incurred using our analysis</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">6. Intellectual Property</h2>
                <p className="text-gray-300 mb-4">
                  All content, features, and functionality of ForexRadar7, including but not limited to algorithms, software, text, displays, images, and the design, are owned by us and are protected by copyright, trademark, and other intellectual property laws.
                </p>
                <p className="text-gray-300">
                  You may not reproduce, distribute, modify, or create derivative works of our content without explicit written permission.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">7. Service Availability</h2>
                <p className="text-gray-300 mb-4">
                  While we strive to maintain high availability, we do not guarantee uninterrupted access to our services. We may:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Perform scheduled maintenance with advance notice</li>
                  <li>Experience temporary outages due to technical issues</li>
                  <li>Modify or discontinue features with reasonable notice</li>
                  <li>Suspend service for security or legal reasons</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
                <p className="text-gray-300 mb-4">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, FOREXRADAR7 SHALL NOT BE LIABLE FOR:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Any trading losses or financial damages</li>
                  <li>Indirect, incidental, or consequential damages</li>
                  <li>Loss of profits, data, or business opportunities</li>
                  <li>Service interruptions or technical failures</li>
                  <li>Third-party actions or content</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">9. Indemnification</h2>
                <p className="text-gray-300">
                  You agree to indemnify and hold harmless ForexRadar7 from any claims, damages, or expenses arising from your use of the service, violation of these terms, or infringement of any rights of another party.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">10. Termination</h2>
                <p className="text-gray-300 mb-4">
                  We may terminate or suspend your account and access to the service at our sole discretion, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
                </p>
                <p className="text-gray-300">
                  Upon termination, your right to use the service will cease immediately.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">11. Governing Law</h2>
                <p className="text-gray-300">
                  These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Any disputes shall be resolved in the appropriate courts of the United States.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">12. Changes to Terms</h2>
                <p className="text-gray-300">
                  We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the service after such modifications constitutes acceptance of the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">13. Contact Information</h2>
                <p className="text-gray-300">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <div className="bg-gray-800 p-4 rounded-lg mt-4">
                  <p className="text-gray-300">Email: legal@forexradar7.com</p>
                  <p className="text-gray-300">Subject: Terms of Service Inquiry</p>
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

export default TermsPage;
