import { useMemo } from 'react';
import { useAuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const { user, login, logout, isAuthenticated } = useAuthContext();

  return useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthenticated
    }),
    [user, login, logout, isAuthenticated]
  );
};
