const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Prophit</h3>
            <p className="text-gray-400">
              Track significant movements in prediction markets connected to news events.
            </p>
          </div>
          
          <div>
            <h4 className="text-md font-medium mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/" className="hover:text-white">Markets</a></li>
              <li><a href="/about" className="hover:text-white">About</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-md font-medium mb-4">Data Source</h4>
            <p className="text-gray-400">
              Powered by Polymarket API
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Prophit. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
