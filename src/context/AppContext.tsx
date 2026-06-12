import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { uploadProfileImage } from '../services/auth';
import { buildIncidentStats, getIncidents } from '../services/incidents';
import { getNotifications, markNotificationAsRead } from '../services/notifications';
import { savePushToken } from '../services/pushToken';
import { getTasks, updateTaskStatus } from '../services/tasks';

const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

type AppUser = any;
type IncidentItem = any;
type TaskItem = any;
type NotificationItem = any;

interface IncidentStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

export interface AppContextValue {
  user: AppUser | null;
  token: string | null;
  updateProfileImage: (image: any) => Promise<any>;
  incidents: IncidentItem[];
  incidentsLoaded: boolean;
  refreshIncidents: () => Promise<IncidentItem[]>;
  tasks: TaskItem[];
  tasksLoaded: boolean;
  refreshTasks: () => Promise<TaskItem[]>;
  updateTaskState: (taskId: string | number, status: string) => Promise<TaskItem>;
  notifications: NotificationItem[];
  notificationsLoaded: boolean;
  refreshNotifications: () => Promise<NotificationItem[]>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  unreadNotificationsCount: number;
  stats: IncidentStats;
  login: (userData: AppUser, userToken: string) => void;
  logout: () => void;
  isLoading: boolean;
  isAuthHydrated: boolean;
  isAuthenticated: boolean;
}

const AUTH_STORAGE_KEY = 'sgm.auth';

export const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthHydrated, setIsAuthHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [incidentsLoaded, setIncidentsLoaded] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrateAuth = async () => {
      try {
        const rawAuth = await AsyncStorage.getItem(AUTH_STORAGE_KEY);

        if (!rawAuth) {
          return;
        }

        const parsedAuth = JSON.parse(rawAuth) as {
          user?: AppUser | null;
          token?: string | null;
        };

        if (!isMounted) {
          return;
        }

        const restoredToken = parsedAuth?.token || null;
        setUser(parsedAuth?.user || null);
        setToken(restoredToken);

        if (restoredToken) {
          registerPushToken(restoredToken);
          getNotifications(restoredToken)
            .then((next) => {
              if (!isMounted) return;
              setNotifications(next);
              setNotificationsLoaded(true);
            })
            .catch(() => {});
        }
      } catch (error) {
        console.error('No se pudo restaurar la sesión:', error);
      } finally {
        if (isMounted) {
          setIsAuthHydrated(true);
        }
      }
    };

    hydrateAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isExpoGo || !token) return;

    const sub = Notifications.addNotificationReceivedListener(() => {
      getNotifications(token)
        .then((next) => { setNotifications(next); setNotificationsLoaded(true); })
        .catch(() => {});
    });

    return () => sub.remove();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        getNotifications(token)
          .then((next) => { setNotifications(next); setNotificationsLoaded(true); })
          .catch(() => {});
      }
    });

    return () => sub.remove();
  }, [token]);

  const registerPushToken = async (userToken: string) => {
    if (Platform.OS === 'web' || isExpoGo) return;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2D3FE0',
        });
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;
      const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      await savePushToken(userToken, expoPushToken, platform);
    } catch (error) {
      console.error('No se pudo registrar el push token:', error);
    }
  };

  const login = (userData: AppUser, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    setIncidentsLoaded(false);
    setTasksLoaded(false);
    setNotificationsLoaded(false);

    AsyncStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ user: userData, token: userToken })
    ).catch((error) => {
      console.error('No se pudo guardar la sesión:', error);
    });

    registerPushToken(userToken);

    getNotifications(userToken)
      .then((next) => {
        setNotifications(next);
        setNotificationsLoaded(true);
      })
      .catch(() => {});
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIncidents([]);
    setIncidentsLoaded(false);
    setTasks([]);
    setTasksLoaded(false);
    setNotifications([]);
    setNotificationsLoaded(false);

    AsyncStorage.removeItem(AUTH_STORAGE_KEY).catch((error) => {
      console.error('No se pudo limpiar la sesión:', error);
    });
  };

  const updateProfileImage = async (image: any) => {
    if (!user || !token) {
      return undefined;
    }

    const result = await uploadProfileImage(token, image);

    if (result?.user) {
      setUser(result.user);
    }

    return result;
  };

  const refreshIncidents = async () => {
    if (!token) {
      throw new Error('No hay una sesión activa.');
    }

    setIsLoading(true);

    try {
      const nextIncidents = await getIncidents(token);
      setIncidents(nextIncidents);
      setIncidentsLoaded(true);
      return nextIncidents;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTasks = async () => {
    if (!token) {
      throw new Error('No hay una sesión activa.');
    }

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

  const updateTaskState = async (taskId: string | number, status: string) => {
    if (!token) {
      throw new Error('No hay una sesión activa.');
    }

    setIsLoading(true);

    try {
      const updatedTask = await updateTaskStatus(token, taskId, status);

      setTasks((current) =>
        current.map((item) => (String(item.id) === String(updatedTask.id) ? updatedTask : item))
      );

      return updatedTask;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshNotifications = async () => {
    if (!token) {
      throw new Error('No hay una sesión activa.');
    }

    setIsLoading(true);

    try {
      const nextNotifications = await getNotifications(token);
      setNotifications(nextNotifications);
      setNotificationsLoaded(true);
      return nextNotifications;
    } finally {
      setIsLoading(false);
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    if (!token) {
      throw new Error('No hay una sesión activa.');
    }

    await markNotificationAsRead(token, notificationId);

    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId
          ? { ...item, isRead: true, readAt: item.readAt || new Date().toISOString() }
          : item
      )
    );
  };

  const stats = useMemo<IncidentStats>(() => buildIncidentStats(incidents), [incidents]);
  const unreadNotificationsCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const value: AppContextValue = {
    user,
    token,
    updateProfileImage,
    incidents,
    incidentsLoaded,
    refreshIncidents,
    tasks,
    tasksLoaded,
    refreshTasks,
    updateTaskState,
    notifications,
    notificationsLoaded,
    refreshNotifications,
    markNotificationRead,
    unreadNotificationsCount,
    stats,
    login,
    logout,
    isLoading,
    isAuthHydrated,
    isAuthenticated: !!token,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext debe usarse dentro de AppProvider.');
  }

  return context;
}
