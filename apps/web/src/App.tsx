import { useEffect } from "react";
import { ConfigProvider } from "antd";
import { dashboardTheme } from "./lib/theme";
import { useHashRoute } from "./hooks";
import ScreensaverPage from "./pages/ScreensaverPage";
import AdminPage from "./pages/AdminPage";

/** 顶层路由：#/admin → 后台配置页；其余 → 屏保展示页。配置与展示完全分离 */
export default function App() {
  const hash = useHashRoute();
  const isAdmin = hash.startsWith("#/admin");

  // Electron 托盘「后台配置」等主进程导航
  useEffect(() => {
    const api = window.desktopApi;
    if (!api?.onNavigate) return;
    return api.onNavigate((nextHash) => {
      window.location.hash = nextHash;
    });
  }, []);

  return (
    <ConfigProvider theme={dashboardTheme}>
      {isAdmin ? <AdminPage /> : <ScreensaverPage />}
    </ConfigProvider>
  );
}
