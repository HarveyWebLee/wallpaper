import { useState } from "react";
import { Layout, Menu, Typography } from "antd";
import {
  AppstoreOutlined,
  HomeOutlined,
  PictureOutlined,
  SettingOutlined
} from "@ant-design/icons";
import { HomePage } from "./pages/HomePage";
import { LibraryPage } from "./pages/LibraryPage";
import { ScenesPage } from "./pages/ScenesPage";
import { SettingsPage } from "./pages/SettingsPage";

const { Header, Sider, Content } = Layout;

type PageKey = "home" | "library" | "scenes" | "settings";

const menuItems = [
  { key: "home", icon: <HomeOutlined />, label: "控制中心" },
  { key: "library", icon: <PictureOutlined />, label: "壁纸库" },
  { key: "scenes", icon: <AppstoreOutlined />, label: "内置场景" },
  { key: "settings", icon: <SettingOutlined />, label: "偏好设置" }
];

function renderPage(key: PageKey) {
  switch (key) {
    case "home":
      return <HomePage />;
    case "library":
      return <LibraryPage />;
    case "scenes":
      return <ScenesPage />;
    case "settings":
      return <SettingsPage />;
    default:
      return <HomePage />;
  }
}

export function App() {
  const [page, setPage] = useState<PageKey>("home");

  return (
    <Layout className="app-shell app-shell--settings">
      <div className="app-shell__grid" aria-hidden />
      <div className="app-shell__scanline" aria-hidden />
      <div className="app-shell__vignette" aria-hidden />
      <div className="floating-orb orb-1" />
      <div className="floating-orb orb-2" />
      <div className="floating-orb orb-3" />

      <Sider width={220} className="app-sider" theme="dark">
        <div className="app-sider__brand">
          <Typography.Title level={5} className="app-sider__title">
            Wallpaper
          </Typography.Title>
          <span className="app-sider__subtitle">动态壁纸</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[page]}
          items={menuItems}
          onClick={({ key }) => setPage(key as PageKey)}
          className="app-sider__menu"
        />
      </Sider>

      <Layout>
        <Header className="dash-header app-topbar">
          <div className="dash-header__inner">
            <div className="dash-header__brand">
              <Typography.Title className="dash-header__title" level={4}>
                {menuItems.find((m) => m.key === page)?.label}
              </Typography.Title>
              <span className="dash-header__subtitle">WALLPAPER · CROSS-PLATFORM</span>
            </div>
            <div className="dash-header__accent" aria-hidden />
          </div>
        </Header>
        <Content className="main-content app-page-content">{renderPage(page)}</Content>
      </Layout>
    </Layout>
  );
}
