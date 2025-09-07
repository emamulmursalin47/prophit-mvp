import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-[#0B0E14] border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Prophit</span>
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link 
              to="/" 
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Markets
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400">Live</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
