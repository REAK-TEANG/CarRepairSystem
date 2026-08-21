import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // We mock a user for now. By default, they are an 'admin'
  const [user, setUser] = useState({
    name: 'Jane Doe',
    role: 'admin', // roles: 'admin', 'mechanic', 'customer'
  });

  const toggleRole = () => {
    setUser((prev) => ({
      ...prev,
      role: prev.role === 'admin' ? 'mechanic' : 'admin',
    }));
  };

  return (
    <AuthContext.Provider value={{ user, toggleRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
