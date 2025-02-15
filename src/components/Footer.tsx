import React from 'react';
import { Github, Twitter, Disc as Discord, Heart } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="bg-gray-800/50 backdrop-blur-sm border-t border-gray-700">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* About Section */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <Logo />
            <p className="text-gray-400 text-xs sm:text-sm">
              Advanced crypto analytics powered by artificial intelligence. Real-time market insights and sentiment analysis.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm sm:text-base">Quick Links</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Dashboard</a></li>
              <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Market Analysis</a></li>
              <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">News Feed</a></li>
              <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">API Docs</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm sm:text-base">Resources</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Trading Guide</a></li>
              <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Market Updates</a></li>
              <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Community</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <h4 className="font-semibold text-sm sm:text-base">Stay Updated</h4>
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-gray-400">Subscribe to our newsletter for daily insights</p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-gray-700 text-xs sm:text-sm rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow"
                />
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-r-lg transition-colors text-xs sm:text-sm whitespace-nowrap">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-400 text-center sm:text-left">
              <span>© 2025 CryptoSense AI.</span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center">
                Made with <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-red-400 mx-1" /> by Crypto Enthusiasts
              </span>
            </div>
            
            <div className="flex items-center space-x-4 sm:space-x-6">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Github className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Discord className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}