import React, { createContext, useState, useContext } from 'react';

export const AppContext = createContext({});

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AppContext.Provider 
      value={{ 
        user, 
        token, 
        login, 
        logout, 
        isLoading,
        isAuthenticated: !!token 
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext  = () => useContext(AppContext);