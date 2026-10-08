import type { ReactNode } from "react";
import { Layout, Typography } from "antd";

const { Header, Content } = Layout;

export type AppShellProps = {
  /** 顶栏右侧插槽：屏保页放实时时钟，配置页放返回入口 */
  headerExtra?: ReactNode;
  /** 背景层：屏保图片轮播等，渲染于内容之下、基础渐变之上 */
  backdrop?: ReactNode;
  /** 沉浸模式：隐藏网格/扫描线/光斑等装饰，让背景图片更干净 */
  immersive?: boolean;
  /** 隐藏顶栏（纯图片屏保） */
  hideHeader?: boolean;
  children: ReactNode;
};

/** 两个页面共享的大屏外壳：深空背景 + 光斑 + 顶栏品牌，保证视觉一致 */
export default function AppShell({
  headerExtra,
  backdrop,
  immersive = false,
  hideHeader = false,
  children
}: AppShellProps) {
  return (
    <Layout className={`app-shell${immersive ? " app-shell--immersive" : ""}`}>
      {/* 大屏底纹：科技网格 + 光斑；有图片背景时隐藏以免干扰 */}
      {immersive ? null : (
        <>
          <div className="app-shell__grid" aria-hidden />
          <div className="app-shell__scanline" aria-hidden />
          <div className="floating-orb orb-1" />
          <div className="floating-orb orb-2" />
          <div className="floating-orb orb-3" />
        </>
      )}
      {backdrop ? <div className="app-shell__backdrop">{backdrop}</div> : null}
      <div className="app-shell__vignette" aria-hidden />
      {hideHeader ? null : (
        <Header className="dash-header">
          <div className="dash-header__inner">
            <div className="dash-header__brand">
              <Typography.Title className="dash-header__title" level={4}>
                退休倒计时
              </Typography.Title>
              <span className="dash-header__subtitle">RETIREMENT · DESKTOP VISUALIZATION</span>
            </div>
            {headerExtra}
          </div>
        </Header>
      )}
      <Content className="main-content">{children}</Content>
    </Layout>
  );
}
