import { Card, Col, Row, Space, Typography, Button, message } from "antd";
import { useDesktopApi, useSettings } from "../hooks/useDesktopApi";
import { RetirementCountdown } from "../components/retirement/RetirementCountdown";

export function ScenesPage() {
  const api = useDesktopApi();
  const { settings, patch } = useSettings();

  if (!settings) return null;

  const handleBirthChange = async (value: string) => {
    await patch({ birthDate: value });
    await api.applyWallpapers();
    message.success("出生日期已同步到壁纸");
  };

  const handleAgeChange = async (age: number) => {
    await patch({ retirementAge: age });
    await api.applyWallpapers();
  };

  return (
    <div className="page-scenes">
      <div className="page-header">
        <Typography.Title level={3} className="page-header__title">
          内置场景
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          退休倒计时等动态场景，可作为桌面壁纸直接应用
        </Typography.Paragraph>
      </div>

      <Row gutter={[20, 20]}>
        <Col span={24}>
          <Card className="glass-card scene-editor-card" bordered={false}>
            <Space orientation="vertical" size={16} style={{ width: "100%" }}>
              <div className="dash-section__head">
                <Typography.Title level={4} style={{ margin: 0 }}>
                  退休倒计时场景
                </Typography.Title>
                <Button
                  type="primary"
                  onClick={async () => {
                    await patch({ activeWallpaperId: "builtin-retirement" });
                    await api.applyWallpapers();
                    message.success("退休场景已应用为壁纸");
                  }}
                >
                  应用为壁纸
                </Button>
              </div>
              <RetirementCountdown
                birthDate={settings.birthDate}
                retirementAge={settings.retirementAge}
                editable
                onBirthDateChange={handleBirthChange}
              />
              <Space wrap>
                {[55, 60, 65].map((age) => (
                  <Button
                    key={age}
                    type={settings.retirementAge === age ? "primary" : "default"}
                    onClick={() => handleAgeChange(age)}
                  >
                    {age} 周岁
                  </Button>
                ))}
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
