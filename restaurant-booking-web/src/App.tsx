import { Routes, Route } from 'react-router-dom';
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Home from './pages/Home';
import BookingPage from './pages/Booking';
import AdminPage from './pages/Admin';
import LoginPage from './pages/Login';

const App = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="booking" element={<BookingPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="admin" element={<AdminPage />} />
        </Route>
        <Route path="login" element={<LoginPage />} />
      </Route>
    </Routes>
  );
};

export default App;
