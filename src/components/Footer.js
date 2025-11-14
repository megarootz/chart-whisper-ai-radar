import React from 'react';
import { useLocation } from 'react-router-dom';

const Footer = () => {
  const location = useLocation();
  const isPrivacyPage = location.pathname === '/privacy';

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>ForexRadar7</h4>
            <p>Your smart trading companion for USDJPY signals with advanced risk management. 100% free app with no registration required.</p>
          </div>

          <div className="footer-section">
            <h4>App Information</h4>
            <p>ForexRadar7 is completely free to download and use. No registration required, no personal data collected.</p>
            <p>Available on Google Play Store for immediate download and use.</p>
          </div>

          {!isPrivacyPage && (
            <div className="footer-section">
              <h4>Privacy & Terms</h4>
              <div className="legal-content">
                <h5>Privacy Policy</h5>
                <p>ForexRadar7 does not collect, store, or process any personal data. The app works completely offline regarding personal information and does not require user registration or account creation.</p>

                <h5>Terms of Service</h5>
                <p>By using ForexRadar7, you agree that:</p>
                <ul>
                  <li>This app is provided for educational and informational purposes</li>
                  <li>Trading signals are not financial advice</li>
                  <li>You trade at your own risk and responsibility</li>
                  <li>Past performance does not guarantee future results</li>
                  <li>The app is free to use with no hidden charges</li>
                </ul>

                <h5>Disclaimer</h5>
                <p>ForexRadar7 provides trading signals for educational purposes only. Trading forex involves substantial risk of loss and is not suitable for all investors. You should carefully consider your financial situation and consult with financial advisors before trading. The developers of ForexRadar7 are not responsible for any trading losses incurred.</p>
              </div>
            </div>
          )}
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 ForexRadar7. All rights reserved.</p>
          <p className="disclaimer-text">
            ⚠️ Trading involves substantial risk of loss. Past performance does not guarantee future results.
          </p>
          <p className="privacy-notice">
            🔒 This app does not collect any personal data and requires no registration.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
