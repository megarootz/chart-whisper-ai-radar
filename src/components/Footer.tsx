
import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full py-4 px-6 text-center text-chart-text border-t border-gray-800 mt-auto">
      <div className="container mx-auto">
        <p>© {new Date().getFullYear()} ForexRadar7. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
