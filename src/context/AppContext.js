import React, { createContext, useState, useContext, useMemo } from 'react';
import { uploadProfileImage } from '../services/auth';
import { buildIncidentStats, getIncidents } from '../services/incidents';
import { getTasks } from '../services/tasks';

export const AppContext = createContext({});

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [incidentsLoaded, setIncidentsLoaded] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIncidents([]);
    setIncidentsLoaded(false);
    setTasks([]);
    setTasksLoaded(false);
  };

  const updateProfileImage = async (image) => {
    if (!user || !token) {
      return;
    }

    const result = await uploadProfileImage(token, image);

    if (result?.user) {
      setUser(result.user);
    }

    return result;
  };

  const refreshIncidents = async () => {
    setIsLoading(true);

    try {
      console.log('refreshIncidents token present:', !!token);
      const nextIncidents = await getIncidents(token);
      setIncidents(nextIncidents);
      setIncidentsLoaded(true);
      return nextIncidents;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTasks = async () => {
    setIsLoading(true);

    try {
      const nextTasks = await getTasks(token);
      setTasks(nextTasks);
      setTasksLoaded(true);
      return nextTasks;
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => buildIncidentStats(incidents), [incidents]);

  return (
    <AppContext.Provider 
      value={{ 
        user, 
        token, 
        updateProfileImage,
        incidents,
        incidentsLoaded,
        refreshIncidents,
        tasks,
        tasksLoaded,
        refreshTasks,
        stats,
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
