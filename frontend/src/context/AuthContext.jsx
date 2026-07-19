import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, guestService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Derived state
  const isAuthenticated = !!user;
  const isGuest = !user;

  useEffect(() => {
    // Restore user from localStorage on page load
    const savedUser = authService.getCurrentUser();
    if (savedUser && authService.isAuthenticated()) {
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    const userData = await authService.login(username, password);
    setUser(userData);
    // Clear guest state when logging in
    guestService.clear();
    return userData;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const userData = await authService.register(username, email, password);
    setUser(userData);
    guestService.clear();
    return userData;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const value = {
    user,
    isAuthenticated,
    isGuest,
    isLoading,
    login,
    register,
    logout,
    // Guest helpers
    guestMessageCount: guestService.getMessageCount(),
    guestRemainingMessages: guestService.getRemainingMessages(),
    guestHasReachedLimit: guestService.hasReachedLimit(),
    guestHasDocument: guestService.hasUploadedDocument(),
    refreshGuestState: () => {
      // Force re-render to update guest counters
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
