import React from 'react';
import './Home.css';

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        {/* Animated Background */}
        <div className="hero-background">
          <div className="floating-particles">
            {[...Array(20)].map((_, i) => (
              <div key={i} className={`particle particle-${i + 1}`}></div>
            ))}
          </div>
          <div className="radar-waves">
            <div className="radar-wave wave-1"></div>
            <div className="radar-wave wave-2"></div>
            <div className="radar-wave wave-3"></div>
          </div>
          <div className="grid-overlay"></div>
        </div>

        <div className="container">
          <div className="hero-content">
            <div className="hero-title-container">
              <h1 className="animated-title">
                <span className="title-word">Forex</span>
                <span className="title-word highlight">Radar</span>
                <span className="title-word">7</span>
              </h1>
              <div className="title-underline"></div>
            </div>
            <p className="hero-subtitle">
              <span className="subtitle-line">Your smart trading companion for USDJPY signals</span>
              <span className="subtitle-line">with advanced risk management and real-time notifications</span>
            </p>
            <div className="free-app-notice">
              <h3>🎉 Completely FREE App!</h3>
              <p>No registration required • No personal data collected • Download and use immediately</p>
            </div>
            <div className="cta-container">
              <a href="#how-to-use" className="cta-button">
                <span className="button-text">Learn How to Use</span>
                <div className="button-glow"></div>
              </a>
              <div className="disclaimer-notice">
                <p>⚠️ Trading involves substantial risk of loss. Past performance does not guarantee future results.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section id="how-to-use" className="how-to-use-section">
        <div className="container">
          <h2 className="section-title">How to Use ForexRadar7</h2>
          <p className="section-subtitle">
            Download for free from Play Store and start using immediately - no registration required!
          </p>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">📱</div>
              <h3>Download & Open</h3>
              <p>Download ForexRadar7 from Google Play Store completely free. Open the app and start using immediately - no account creation needed.</p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">💰</div>
              <h3>Set Your Account Balance</h3>
              <p>Enter your trading account balance in USD. This helps the app calculate optimal lot sizes for your trades based on your available capital.</p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">🛡️</div>
              <h3>Configure Risk Percentage</h3>
              <p>Set your risk percentage per trade (recommended 1-2%). The app will automatically calculate lot sizes to limit your maximum loss per trade.</p>
            </div>

            <div className="step-card">
              <div className="step-number">4</div>
              <div className="step-icon">📱</div>
              <h3>Join Telegram Notifications</h3>
              <p>Connect to our Telegram channel for instant real-time trading signal alerts. Never miss a profitable entry opportunity.</p>
            </div>

            <div className="step-card">
              <div className="step-number">5</div>
              <div className="step-icon">📈</div>
              <h3>Follow Trading Signals</h3>
              <p>Receive USDJPY buy/sell signals with precise entry points, stop loss levels, and profit targets using our recommended broker.</p>
            </div>

            <div className="step-card">
              <div className="step-number">6</div>
              <div className="step-icon">📊</div>
              <h3>Track Your Performance</h3>
              <p>Monitor your trading history, profit/loss, and overall performance. View detailed trade analysis and results in real-time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <h2 className="section-title">Key Features</h2>
          <p className="section-subtitle">
            Everything you need for successful USDJPY trading in one powerful app
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Live USDJPY Signals</h3>
              <p>Receive real-time buy and sell signals for USDJPY with precise entry points, stop loss, and take profit levels.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🧮</div>
              <h3>Automatic Lot Calculation</h3>
              <p>Smart lot size calculation based on your account balance and risk percentage to optimize your trading strategy.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Telegram Integration</h3>
              <p>Instant push notifications through Telegram ensure you never miss a trading opportunity, even when away from the app.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Profit/Loss Tracking</h3>
              <p>Real-time tracking of your trading performance with detailed profit/loss calculations and percentage returns.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Risk Management</h3>
              <p>Built-in risk management tools with customizable risk percentage settings to protect your trading capital.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h3>Trade History</h3>
              <p>Complete trading history with detailed trade information including entry/exit times, profit/loss, and trade duration.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🆓</div>
              <h3>100% Free</h3>
              <p>No hidden fees, no subscriptions, no registration required. Download from Play Store and start using immediately.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Privacy First</h3>
              <p>No personal data collection - your privacy is completely protected. The app works without requiring any personal information.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section className="download-section">
        <div className="container">
          <h2 className="section-title">Download ForexRadar7</h2>
          <p className="section-subtitle">
            Start receiving professional USDJPY trading signals today - completely free!
          </p>
          <div className="free-highlights">
            <div className="highlight-item">✅ No registration required</div>
            <div className="highlight-item">✅ No personal data collected</div>
            <div className="highlight-item">✅ Use immediately after download</div>
            <div className="highlight-item">✅ 100% free forever</div>
          </div>
          <div className="download-buttons">
            <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" className="download-btn">
              <img src="/api/placeholder/150/50" alt="Download on Google Play" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
