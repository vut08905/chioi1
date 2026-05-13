# dist/ — Built artifacts (gitignored)

Folder này chứa file build output, **KHÔNG commit lên git**.

## chioi-app-debug.apk
TWA (Trusted Web Activity) APK wrap PWA `https://app.chioi.vn`.

| Item | Value |
|------|-------|
| Package ID | `vn.chioi.app` |
| Version | 1.0.0 (versionCode 1) |
| Size | ~5.3 MB |
| Min SDK | 21 (Android 5.0+) |
| Target SDK | 35 |
| Signing | debug-signed (keystore `D:\chioi-twa\android.keystore`, password `android`) |
| SHA256 fingerprint | `4A:BA:CC:41:33:67:52:86:C0:27:E7:2C:12:A1:8A:AE:5B:51:1A:FF:FB:07:E0:E1:29:FA:A7:CC:07:A6:63:AA` |
| Permissions | POST_NOTIFICATIONS, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION |

## Cách install lên điện thoại Android

### Cách 1: ADB (USB cable + USB debugging)
```bash
adb install -r "D:\New folder\Ch-i-App\dist\chioi-app-debug.apk"
```

### Cách 2: Copy file qua USB / cloud / messaging
1. Copy `chioi-app-debug.apk` lên điện thoại (qua USB, Drive, Telegram, Zalo...)
2. Mở file → "Cài đặt" → cấp quyền cài app từ nguồn không xác định
3. Icon "Chị Ơi!" sẽ xuất hiện trên màn hình chính

### Cách 3: Host APK trên web server tạm
```bash
# Trên máy local (cùng WiFi với điện thoại):
cd "D:\New folder\Ch-i-App\dist"
npx http-server -p 9090
# Trên điện thoại Chrome → http://<PC_IP>:9090/chioi-app-debug.apk
```

## TWA verification (fullscreen, không URL bar)

APK này là TWA — sẽ chạy fullscreen NẾU domain `app.chioi.vn` serve đúng `/.well-known/assetlinks.json` matching SHA256 fingerprint trên.

Verify:
```
curl https://app.chioi.vn/.well-known/assetlinks.json
```
Phải trả về JSON chứa `vn.chioi.app` + fingerprint trên.

Nếu chưa có → APK fallback **Custom Tabs** (vẫn dùng được, có address bar).

## Rebuild

```bash
cd D:/chioi-twa
export JAVA_HOME="/c/Program Files/Microsoft/jdk-17.0.18.8-hotspot"
export ANDROID_HOME="D:/android-sdk"
export TMP="D:\\gradle-tmp" TEMP="D:\\gradle-tmp"
./gradlew.bat assembleDebug --no-daemon
# Output: D:/chioi-twa/app/build/outputs/apk/debug/app-debug.apk
```

Chỉnh sửa metadata: `D:/chioi-twa/twa-manifest.json`, sau đó chạy `node /d/chioi-twa/generate.js` để regenerate Android skeleton, rồi build lại.

## Production build (cho Google Play Store)

Cần tạo keystore production riêng (không dùng `android/android` debug):
```bash
keytool -genkey -v -keystore chioi-prod.keystore -alias chioi -keyalg RSA -keysize 2048 -validity 10000
```
Cập nhật `twa-manifest.json` → `signingKey.path` → run `gradlew.bat assembleRelease`.
