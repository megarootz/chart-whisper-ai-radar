
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';

const TermsPage = () => {
  return (
    <>
      <SEOHead
        title="Terms of Service - ForexRadar7 | Service Agreement"
        description="Read ForexRadar7's terms of service covering usage rights, responsibilities, and conditions for our AI forex chart analysis platform."
        keywords="terms of service, user agreement, ForexRadar7 terms, service conditions, legal terms, usage policy"
      />
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
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">2. Service Description</h2>
                <p className="text-gray-300 mb-4">
                  ForexRadar7 is an AI-powered forex chart analysis platform that provides:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Automated technical analysis of forex trading charts</li>
                  <li>Pattern recognition and trend identification</li>
                  <li>Trading insights and recommendations</li>
                  <li>Historical analysis tracking</li>
                  <li>Subscription-based premium features</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">3. User Accounts and Registration</h2>
                <p className="text-gray-300 mb-4">
                  To access certain features, you must register for an account. You agree to:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Provide accurate and complete registration information</li>
                  <li>Maintain the security of your password</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized access</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">4. Acceptable Use Policy</h2>
                <p className="text-gray-300 mb-4">You agree not to:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Use the service for any unlawful purpose</li>
                  <li>Upload malicious code, viruses, or harmful content</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt the service</li>
                  <li>Use automated tools to access the service without permission</li>
                  <li>Reverse engineer or attempt to extract our algorithms</li>
                  <li>Resell or redistribute our service without authorization</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">5. Subscription Terms</h2>
                
                <h3 className="text-lg font-medium text-white mb-3">5.1 Billing</h3>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1">
                  <li>Subscriptions are billed monthly or annually in advance</li>
                  <li>Payments are processed securely through Stripe</li>
                  <li>Prices may change with 30 days notice</li>
                </ul>

                <h3 className="text-lg font-medium text-white mb-3">5.2 Cancellation</h3>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1">
                  <li>You may cancel your subscription at any time</li>
                  <li>Cancellation takes effect at the end of the current billing period</li>
                  <li>No refunds for partial months unless required by law</li>
                </ul>

                <h3 className="text-lg font-medium text-white mb-3">5.3 Free Trial</h3>
                <p className="text-gray-300">
                  Free trial users are subject to usage limits and may be upgraded to paid plans automatically if limits are exceeded and payment information is provided.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">6. Intellectual Property</h2>
                <p className="text-gray-300 mb-4">
                  ForexRadar7 and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, and other intellectual property laws.
                </p>
                <p className="text-gray-300">
                  You retain ownership of any charts or data you upload, but grant us a license to process and analyze this content to provide our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">7. Disclaimers and Risk Warning</h2>
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-medium text-red-400 mb-2">⚠️ Trading Risk Warning</h3>
                  <p className="text-red-300 text-sm">
                    Forex trading involves substantial risk of loss and is not suitable for all investors. Our analysis and recommendations are for informational purposes only and should not be considered as financial advice. Past performance does not guarantee future results.
                  </p>
                </div>
                
                <p className="text-gray-300 mb-4">The service is provided "as is" without warranties of any kind. We specifically disclaim:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Accuracy of analysis results</li>
                  <li>Profitability of trading decisions based on our analysis</li>
                  <li>Uninterrupted or error-free service</li>
                  <li>Fitness for any particular trading strategy</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
                <p className="text-gray-300 mb-4">
                  To the maximum extent permitted by law, ForexRadar7 shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Trading losses or missed opportunities</li>
                  <li>Loss of profits or data</li>
                  <li>Business interruption</li>
                  <li>Personal injury or property damage</li>
                </ul>
                <p className="text-gray-300 mt-4">
                  Our total liability shall not exceed the amount paid by you for the service in the 12 months preceding the claim.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">9. Indemnification</h2>
                <p className="text-gray-300">
                  You agree to indemnify and hold harmless ForexRadar7 from any claims, damages, or expenses arising from your use of the service, violation of these terms, or infringement of any third-party rights.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">10. Termination</h2>
                <p className="text-gray-300 mb-4">
                  We may terminate or suspend your account and access to the service immediately, without prior notice, for conduct that we believe:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Violates these Terms of Service</li>
                  <li>Is harmful to other users or our business</li>
                  <li>Involves fraudulent or illegal activity</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">11. Privacy Policy</h2>
                <p className="text-gray-300">
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">12. Governing Law</h2>
                <p className="text-gray-300">
                  These Terms shall be interpreted and governed by the laws of [Your Jurisdiction], without regard to conflict of law provisions. Any disputes shall be resolved through binding arbitration.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">13. Changes to Terms</h2>
                <p className="text-gray-300">
                  We reserve the right to modify these terms at any time. We will provide notice of significant changes via email or through the service. Continued use after changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">14. Contact Information</h2>
                <p className="text-gray-300">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <div className="bg-gray-800 p-4 rounded-lg mt-4">
                  <p className="text-gray-300">Email: legal@forexradar7.com</p>
                  <p className="text-gray-300">Subject: Terms of Service Inquiry</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-4">15. Severability</h2>
                <p className="text-gray-300">
                  If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.
                </p>
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
