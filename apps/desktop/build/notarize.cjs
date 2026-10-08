/**
 * electron-builder afterSign 钩子：macOS 公证（notarization）。
 *
 * 设计为「有凭据才执行，无凭据自动跳过」，因此：
 * - 非 macOS 构建（Windows/Linux）直接跳过；
 * - 未注入 Apple 凭据时跳过（仍可产出未公证/未签名安装包，CI 不会因此失败）。
 *
 * 需要的环境变量（通常来自 CI Secrets）：
 *   APPLE_ID                     Apple 账号
 *   APPLE_APP_SPECIFIC_PASSWORD  App 专用密码
 *   APPLE_TEAM_ID                开发者团队 ID
 *
 * 仅依赖 macOS 自带的 ditto / xcrun notarytool / stapler，不引入额外 npm 依赖。
 */
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

module.exports = async function notarize(context) {
  if (context.electronPlatformName !== "darwin") return;

  const appleId = process.env.APPLE_ID;
  const applePassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;
  if (!appleId || !applePassword || !teamId) {
    console.log("[notarize] 未检测到 Apple 凭据，跳过公证（产出未公证安装包）。");
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${appName}.app`);
  if (!fs.existsSync(appPath)) {
    console.warn(`[notarize] 未找到 ${appPath}，跳过。`);
    return;
  }

  const zipPath = path.join(os.tmpdir(), `${appName}-${Date.now()}.zip`);
  console.log(`[notarize] 打包并提交公证：${appPath}`);
  try {
    execFileSync("ditto", ["-c", "-k", "--keepParent", appPath, zipPath], { stdio: "inherit" });
    execFileSync(
      "xcrun",
      [
        "notarytool",
        "submit",
        zipPath,
        "--apple-id",
        appleId,
        "--password",
        applePassword,
        "--team-id",
        teamId,
        "--wait"
      ],
      { stdio: "inherit" }
    );
    execFileSync("xcrun", ["stapler", "staple", appPath], { stdio: "inherit" });
    console.log("[notarize] 公证完成并已装订（staple）。");
  } finally {
    fs.rmSync(zipPath, { force: true });
  }
};
