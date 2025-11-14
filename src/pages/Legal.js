import React from 'react';
import './Legal.css';

const Legal = () => {
  return (
    <div className="legal-page">
      <div className="container">
        <div className="legal-content">
          <h1>Privacy Policy & Terms of Service</h1>
          <p className="last-updated">Last Updated: November 2024</p>

          <div className="legal-section">
            <h2>Privacy Policy</h2>
            <h3>No Data Collection</h3>
            <p>
              ForexRadar7 is committed to protecting your privacy. We want to be completely transparent: 
              <strong> we do not collect, store, or process any personal data whatsoever.</strong>
            </p>
            
            <h3>What This Means</h3>
            <ul>
              <li>No user registration or account creation required</li>
              <li>No personal information collected (name, email, phone number, etc.)</li>
              <li>No tracking of your trading activity or behavior</li>
              <li>No cookies or tracking technologies used</li>
              <li>No data shared with third parties</li>
              <li>No analytics or usage statistics collected</li>
            </ul>

            <h3>App Functionality</h3>
            <p>
              The app works completely offline regarding personal information. All settings and preferences 
              are stored locally on your device only. Your account balance and risk settings never leave your device.
            </p>

            <h3>Telegram Integration</h3>
            <p>
              If you choose to join our Telegram channel for signal notifications, you will be subject to 
              Telegram's privacy policy. We do not have access to your Telegram personal information.
            </p>
          </div>

          <div className="legal-section">
            <h2>Terms of Service</h2>
            <h3>Acceptance of Terms</h3>
            <p>
              By downloading, installing, or using ForexRadar7, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use the app.
            </p>

            <h3>Service Description</h3>
            <p>
              ForexRadar7 is a free mobile application that provides:
            </p>
            <ul>
              <li>USDJPY trading signals for educational purposes</li>
              <li>Automatic lot size calculation based on risk management principles</li>
              <li>Real-time notifications via Telegram integration</li>
              <li>Trading signal history and performance tracking</li>
            </ul>

            <h3>Educational Purpose Only</h3>
            <p>
              <strong>ForexRadar7 is provided for educational and informational purposes only.</strong> 
              The signals and information provided by the app do not constitute financial advice, investment advice, 
              trading advice, or any other sort of advice.
            </p>

            <h3>User Responsibilities</h3>
            <p>By using ForexRadar7, you agree that:</p>
            <ul>
              <li>You are solely responsible for your own trading decisions</li>
              <li>You will not rely solely on the app's signals for trading decisions</li>
              <li>You understand that trading involves substantial risk of loss</li>
              <li>You will conduct your own research and due diligence</li>
              <li>You will consult with qualified financial advisors before trading</li>
              <li>You are of legal age to trade forex in your jurisdiction</li>
              <li>You comply with all applicable laws and regulations</li>
            </ul>

            <h3>No Guarantees</h3>
            <p>
              We make no representations or warranties regarding:
            </p>
            <ul>
              <li>The accuracy or reliability of trading signals</li>
              <li>The profitability of following the signals</li>
              <li>The app's availability or uninterrupted operation</li>
              <li>Future performance based on past results</li>
            </ul>

            <h3>Free Service</h3>
            <p>
              ForexRadar7 is completely free to download and use. There are:
            </p>
            <ul>
              <li>No subscription fees</li>
              <li>No hidden charges</li>
              <li>No in-app purchases</li>
              <li>No premium features requiring payment</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>Risk Disclaimer</h2>
            <h3>Trading Risks</h3>
            <p>
              <strong>Forex trading carries a high level of risk and may not be suitable for all investors.</strong> 
              Before deciding to trade forex, you should carefully consider your investment objectives, level of 
              experience, and risk appetite.
            </p>

            <h3>Possibility of Loss</h3>
            <p>
              There is a possibility that you could sustain a loss of some or all of your initial investment. 
              Therefore, you should not invest money that you cannot afford to lose. You should be aware of all 
              the risks associated with forex trading and seek advice from an independent financial advisor if 
              you have any doubts.
            </p>

            <h3>Past Performance</h3>
            <p>
              Past performance is not indicative of future results. Any historical returns, expected returns, 
              or probability projections may not reflect actual future performance.
            </p>
          </div>

          <div className="legal-section">
            <h2>Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, the developers and operators of ForexRadar7 shall not be
              liable for any direct, indirect, incidental, special, consequential, or punitive damages, including
              but not limited to:
            </p>
            <ul>
              <li>Trading losses or lost profits</li>
              <li>Loss of data or information</li>
              <li>Business interruption</li>
              <li>Any other commercial damages or losses</li>
            </ul>
            <p>
              This limitation applies whether the claim is based on warranty, contract, tort, or any other legal theory.
            </p>
          </div>

          <div className="legal-section">
            <h2>Final Warning</h2>
            <p>
              You acknowledge that you are using ForexRadar7 at your own risk. The app is provided "as is"
              without any warranties. You are solely responsible for any trading decisions and their consequences.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Legal;

