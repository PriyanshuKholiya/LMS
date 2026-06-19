import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'ADMIN' | 'FACULTY' | 'STUDENT';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);

  // Initialize with a default mock Student profile to simplify instant testing
  useEffect(() => {
    setUser({
      id: 'student-id-123',
      name: 'Alex Mercer',
      email: 'alex@student.lms.com',
      role: 'STUDENT'
    });
  }, []);

  const login = (email: string, role: UserRole) => {
    setUser({
      id: `${role.toLowerCase()}-id-999`,
      name: `Demo ${role.charAt(0) + role.slice(1).toLowerCase()}`,
      email,
      role
    });
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (role: UserRole) => {
    if (user) {
      setUser({
        ...user,
        id: `${role.toLowerCase()}-id-temp`,
        name: `Demo ${role.charAt(0) + role.slice(1).toLowerCase()}`,
        role
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
