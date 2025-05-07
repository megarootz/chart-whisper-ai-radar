
import React from 'react';
import { ChartCandlestick } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#' },
        { label: 'Pricing', href: '#' },
        { label: 'Documentation', href: '#' },
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' },
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy', href: '#' },
        { label: 'Terms', href: '#' },
        { label: 'Cookie Policy', href: '#' },
      ]
    }
  ];

  return (
    <footer className="w-full py-12 px-6 bg-chart-card border-t border-gray-800">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-primary/10 p-2 rounded-xl">
                <ChartCandlestick className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-white">
                ForexRadar<span className="text-primary">7</span>
              </h1>
            </div>
            <p className="text-chart-text text-sm max-w-xs">
              AI-powered chart analysis for forex, commodities, indices, and cryptocurrency markets.
            </p>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-white font-medium">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href}
                      className="text-chart-text hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-800 mt-10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-chart-text text-sm">
            © {currentYear} ForexRadar7. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-chart-text hover:text-primary transition-colors duration-200">
              Twitter
            </a>
            <a href="#" className="text-chart-text hover:text-primary transition-colors duration-200">
              LinkedIn
            </a>
            <a href="#" className="text-chart-text hover:text-primary transition-colors duration-200">
              Discord
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
