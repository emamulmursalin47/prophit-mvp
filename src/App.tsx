import { BrowserRouter } from 'react-router-dom';
import Navbar from './components/Navbar';
import MarketsNavbar from './components/MarketsNavbar';
import Footer from './components/Footer';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#0B0E14] text-white">
        <Navbar />
        <MarketsNavbar />
        <main className="flex-1">
          <AppRoutes />
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
