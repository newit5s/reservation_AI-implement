import { Routes, Route } from 'react-router-dom';
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import TestCrash from './components/common/TestCrash';
import Home from './pages/Home';
import BookingPage from './pages/Booking';
import AdminPage from './pages/Admin';
import LoginPage from './pages/Login';

const App = () => {
  const enableTestRoutes = import.meta.env.MODE !== 'production';

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="booking" element={<BookingPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="admin" element={<AdminPage />} />
        </Route>
        <Route path="login" element={<LoginPage />} />
        {enableTestRoutes && <Route path="test/crash" element={<TestCrash />} />}
      </Route>
    </Routes>
  );
};

export default App;
