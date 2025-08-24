import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { theme } from 'antd';
import { LOCAL_STORAGE_KEYS } from '@/utils/constants';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  collapsed: boolean;
}

interface ThemeActions {
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

type ThemeStore = ThemeState & ThemeActions;

export const useTheme = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // State
      mode: 'light',
      collapsed: false,

      // Actions
      toggleTheme: () => {
        const newMode = get().mode === 'light' ? 'dark' : 'light';
        set({ mode: newMode });
        
        // Update document attribute for CSS
        document.documentElement.setAttribute('data-theme', newMode);
      },

      setTheme: (mode: ThemeMode) => {
        set({ mode });
        document.documentElement.setAttribute('data-theme', mode);
      },

      toggleSidebar: () => {
        set({ collapsed: !get().collapsed });
      },

      setSidebarCollapsed: (collapsed: boolean) => {
        set({ collapsed });
      },
    }),
    {
      name: 'admin-theme-storage',
      partialize: (state) => ({
        mode: state.mode,
        collapsed: state.collapsed,
      }),
    }
  )
);

// Ant Design theme configuration
export const getAntdTheme = (mode: ThemeMode) => {
  const { darkAlgorithm, defaultAlgorithm } = theme;
  
  return {
    algorithm: mode === 'dark' ? darkAlgorithm : defaultAlgorithm,
    token: {
      colorPrimary: mode === 'dark' ? '#177ddc' : '#1890ff',
      borderRadius: 6,
      colorBgContainer: mode === 'dark' ? '#141414' : '#ffffff',
      colorBgElevated: mode === 'dark' ? '#1f1f1f' : '#ffffff',
      colorBgLayout: mode === 'dark' ? '#000000' : '#f5f5f5',
      colorBorder: mode === 'dark' ? '#303030' : '#d9d9d9',
      colorBorderSecondary: mode === 'dark' ? '#262626' : '#f0f0f0',
      colorText: mode === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
      colorTextSecondary: mode === 'dark' ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)',
      colorTextTertiary: mode === 'dark' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)',
      colorFillAlter: mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
      colorFillContent: mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
      colorFillContentHover: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    },
    components: {
      Layout: {
        siderBg: mode === 'dark' ? '#001529' : '#001529', // Keep sidebar dark in both themes
        triggerBg: mode === 'dark' ? '#002140' : '#002140',
        triggerColor: '#fff',
      },
      Menu: {
        darkItemBg: 'transparent',
        darkItemSelectedBg: '#1890ff',
        darkItemHoverBg: 'rgba(255, 255, 255, 0.08)',
        darkSubMenuItemBg: 'transparent',
        darkItemColor: 'rgba(255, 255, 255, 0.65)',
        darkItemSelectedColor: '#fff',
        darkItemHoverColor: '#fff',
      },
      Card: {
        colorBgContainer: mode === 'dark' ? '#141414' : '#ffffff',
      },
      Table: {
        colorBgContainer: mode === 'dark' ? '#141414' : '#ffffff',
        headerBg: mode === 'dark' ? '#1f1f1f' : '#fafafa',
      },
    },
  };
};

// Initialize theme on app start
export const initializeTheme = () => {
  const storedTheme = localStorage.getItem('admin-theme-storage');
  
  if (storedTheme) {
    try {
      const parsed = JSON.parse(storedTheme);
      const mode = parsed.state?.mode || 'light';
      document.documentElement.setAttribute('data-theme', mode);
    } catch (error) {
      console.error('Failed to parse stored theme:', error);
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
};
