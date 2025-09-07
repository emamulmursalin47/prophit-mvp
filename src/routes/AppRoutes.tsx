import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import MarketDetail from '../pages/MarketDetail';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/market/:id" element={<MarketDetail />} />
    </Routes>
  );
};

export default AppRoutes;
