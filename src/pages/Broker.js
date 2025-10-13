import React from 'react';
import './Broker.css';

const Broker = () => {
  return (
    <div className="broker-page">
      {/* Hero Section */}
      <section className="broker-hero">
        <div className="container">
          <div className="broker-hero-content">
            <h1 className="broker-title">Trading Platform</h1>
            <p className="broker-subtitle">
              Why we chose this broker for optimal ForexRadar7 performance
            </p>
          </div>
        </div>
      </section>

      {/* Broker Info Section */}
      <section className="broker-info-section">
        <div className="container">
          <div className="broker-card">
            <div className="broker-description">
              <h3>Why This Broker?</h3>
              <p>
                ForexRadar7 requires precise timing and fast execution for USDJPY signals.
                We selected our trading partner based on these critical performance factors:
              </p>

              <div className="broker-reasons">
                <div className="reason-item">
                  <span className="reason-icon">⚡</span>
                  <div>
                    <h4>Ultra-Fast Execution</h4>
                    <p>Sub-millisecond order execution ensures you never miss a signal</p>
                  </div>
                </div>

                <div className="reason-item">
                  <span className="reason-icon">🎯</span>
                  <div>
                    <h4>Precise Server Timing</h4>
                    <p>Perfect synchronization with ForexRadar7's signal generation</p>
                  </div>
                </div>

                <div className="reason-item">
                  <span className="reason-icon">💰</span>
                  <div>
                    <h4>Competitive Spreads</h4>
                    <p>Low USDJPY spreads maximize your profit potential</p>
                  </div>
                </div>
              </div>

              <div className="start-trading-section">
                <h4>Ready to Start Trading?</h4>
                <p>Access the same trading environment ForexRadar7 is optimized for</p>
                <a
                  href="https://tickmill.link/3Ix111M"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="start-trading-btn"
                >
                  Start Trading Now
                </a>
              </div>
            </div>
          </div>


        </div>
      </section>
    </div>
  );
};

export default Broker;
