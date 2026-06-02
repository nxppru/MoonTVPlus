# MoonTVPlus Android TV

这是一个极简 Android TV WebView 壳工程，用于打开 MoonTVPlus Web TV 页面。

## 构建参数

- `BASE_URL`: 服务端 Base URL，不需要带 `/tv`，例如 `https://example.com` 或 `http://192.168.1.10:3000`
- `APP_NAME`: Android TV 桌面显示名称
- `VERSION_NAME`: APK 版本名
- `VERSION_CODE`: APK 版本号，整数
- `MIN_SDK`: 最低 Android API，标准版为 `23`（Android 6+），兼容版为 `21`（Android 5+）

App 启动时会自动打开：

```text
BASE_URL 去掉末尾 / 后 + /tv
```

## 特性

- GitHub Actions 默认构建两个版本：`android6plus` 标准版和 `android5plus` 兼容版
- 锁定横屏
- 支持 Android TV Launcher
- 允许 HTTP 明文访问
- 允许 HTTPS 页面加载 HTTP 视频/图片等混合内容
- 使用 `public/logo.png` 作为图标来源
- User-Agent 追加 `MoonTVPlusAndroidTV`
