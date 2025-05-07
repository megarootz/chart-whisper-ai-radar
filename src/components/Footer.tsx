
import React from 'react';
import { Twitter, Github, Slack, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full py-8 px-6 bg-black border-t border-gray-800">
      <div className="container mx-auto">
        <div className="flex justify-center mb-6">
          <Link to="/" className="text-xl font-bold text-primary">
            ForexRadar7
          </Link>
        </div>
        
        <div className="flex justify-center space-x-6 mb-6">
          <a href="#" className="text-gray-400 hover:text-primary transition-colors">
            <Twitter className="h-5 w-5" />
          </a>
          <a href="#" className="text-gray-400 hover:text-primary transition-colors">
            <Github className="h-5 w-5" />
          </a>
          <a href="#" className="text-gray-400 hover:text-primary transition-colors">
            <Slack className="h-5 w-5" />
          </a>
          <a href="#" className="text-gray-400 hover:text-primary transition-colors">
            <Globe className="h-5 w-5" />
          </a>
        </div>
        
        <p className="text-center text-sm text-gray-400">
          © {currentYear} ForexRadar7. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
