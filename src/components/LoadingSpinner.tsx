const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-gray-800 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-purple-500 rounded-full animate-spin mx-auto" style={{ animationDelay: '0.15s' }}></div>
        </div>
        <h2 className="text-white text-xl font-semibold mb-2">Loading...</h2>
        <p className="text-gray-400">Fetching market movements...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
