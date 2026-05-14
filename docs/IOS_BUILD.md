# Build iOS qua Codemagic + Upload App Store Connect

> Phiên bản: 1.0 · 2026-05-14
> App: Chị Ơi! iOS (Bundle ID `vn.chioi.app`)
> Stack: Capacitor 6 wrapper PWA `https://app.chioi.vn` + Codemagic CI/CD

---

## 🎯 Tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Tạo Apple Developer account ($99/năm) + verify identity     │
│  2. Tạo App ID 'vn.chioi.app' trong Apple Dev Portal            │
│  3. Tạo App Store Connect API key (.p8) — Codemagic dùng        │
│  4. Tạo Codemagic account + connect GitHub repo                 │
│  5. Setup Codemagic env vars + integration App Store Connect    │
│  6. Push tag 'v1.0.0' → trigger build → IPA → TestFlight        │
│  7. Test trên TestFlight beta → submit Production review        │
│  8. Apple review 1-3 ngày → approved → live App Store           │
└─────────────────────────────────────────────────────────────────┘
```

**Tổng thời gian first launch:** 2-4 tuần (Apple Dev verify + review).

---

## 1. Apple Developer Program

### 1.1 Đăng ký
1. Truy cập https://developer.apple.com/programs/enroll/
2. Sign in với Apple ID (nên tạo Apple ID mới riêng cho công ty)
3. Chọn:
   - **Individual** — đăng ký bằng tên cá nhân, phí $99 (D-U-N-S không cần)
   - **Organization** — đăng ký theo công ty, cần **D-U-N-S Number** (free apply 1-2 tuần) + Legal entity name match
4. Verify identity:
   - Individual: chụp ảnh CMND/Passport + selfie
   - Organization: D-U-N-S verification + email verify từ official company email
5. Trả $99 USD (annual)
6. Account active sau 24-48 giờ (Individual) hoặc 1-2 tuần (Organization)

### 1.2 Renewal
Account hết hạn → mọi app bị remove khỏi App Store. Phải renew thủ công trước khi expire.

---

## 2. App ID trong Apple Developer Portal

### 2.1 Tạo App ID
1. https://developer.apple.com/account → **Certificates, Identifiers & Profiles**
2. **Identifiers** → ➕ → chọn **App IDs** → **App**
3. Description: `Chi Oi Mobile`
4. Bundle ID: **Explicit** → `vn.chioi.app`
5. Capabilities (check những cái app dùng):
   - ✅ **Push Notifications** (cần cho realtime order alerts)
   - ✅ **Associated Domains** (cho Universal Links với chioi.vn)
   - ✅ **Sign in with Apple** (optional — cần để pass review nếu có Google/Facebook login)
   - ✅ **App Groups** (nếu sau này có widget)
6. **Continue** → **Register**

### 2.2 Associated Domains (Universal Links)
Sau khi tạo App ID:
1. Bật **Associated Domains** capability
2. Trên VPS chioi.vn, đảm bảo file `/var/www/chioi.vn/.well-known/apple-app-site-association` tồn tại:
   ```json
   {
     "applinks": {
       "apps": [],
       "details": [
         {
           "appID": "TEAMID.vn.chioi.app",
           "paths": ["/khachhang/*", "/giupviec/*", "/admin/*", "/api/*"]
         }
       ]
     }
   }
   ```
   (Thay `TEAMID` bằng Apple Team ID 10 chars — xem trong Apple Dev Portal → Membership)
3. Serve qua HTTPS với `Content-Type: application/json` (không cần `.json` extension theo Apple spec)
4. Tôi sẽ tạo file này sau khi user cung cấp Team ID.

---

## 3. App Store Connect API Key (cho Codemagic)

### 3.1 Tạo .p8 key
1. https://appstoreconnect.apple.com/access/integrations/api → **Generate API Key**
2. Name: `Codemagic CI/CD`
3. Access: **App Manager** (đủ quyền upload TestFlight + submit review)
4. **Generate** → download file `AuthKey_XXXXXXX.p8`

⚠️ **Chỉ download được 1 lần!** Lưu vào password manager + backup.

### 3.2 Note 3 giá trị quan trọng
- **Key ID**: 10 chars (vd `ABCD1234EF`) — hiển thị trên bảng API keys
- **Issuer ID**: UUID (vd `12345678-aaaa-bbbb-cccc-dddddddddddd`) — hiển thị top page API keys
- **Private Key file**: `AuthKey_XXXXXXX.p8` — nội dung text

---

## 4. Codemagic Setup

### 4.1 Tạo account + connect repo
1. https://codemagic.io/signup → đăng ký (free 500 phút Mac build/tháng)
2. **Add application** → chọn **GitHub** → authorize → chọn `nathanha2808-hub/Ch-i-App`
3. Codemagic detect `codemagic.yaml` ở root → auto-use config đó

### 4.2 Connect Apple Developer Account (Integrations)
1. **Teams** → ➕ create team (hoặc dùng personal)
2. **Integrations** → **App Store Connect** → **Add integration**
3. Fill:
   - Integration name: `chioi-app-store-key` (matches `integrations:` trong codemagic.yaml)
   - **Key ID**: từ bước 3.2
   - **Issuer ID**: từ bước 3.2
   - **API key**: paste nội dung file `.p8` (3-4 dòng base64)
4. **Save**

### 4.3 Add environment variables
1. App settings → **Environment variables** → tạo **group** `app_store_credentials`
2. Add variables:

| Variable | Value | Secure? |
|----------|-------|---------|
| `CERTIFICATE_PRIVATE_KEY` | Private key (.p12 password hoặc file content) — auto-fetched từ API key | ✅ Secure |
| `APP_STORE_APPLE_ID` | App's numeric Apple ID (10-digit, lấy từ App Store Connect → App Info → General) | No |

⚠️ Codemagic có thể auto-manage signing certs khi connect Apple Dev qua integration. KHÔNG cần upload .p12 thủ công với new yaml.

### 4.4 Update `codemagic.yaml`
Mở file `codemagic.yaml` ở repo root → sửa:
- Line `integrations: app_store_connect: chioi-app-store-key` → matches tên integration ở bước 4.2
- Line `APP_STORE_APPLE_ID: 0000000000` → thay bằng Apple ID number của app

Commit + push.

---

## 5. Tạo App trong App Store Connect

### 5.1 Create app
1. https://appstoreconnect.apple.com → **My Apps** → ➕ → **New App**
2. Fill:
   - **Platforms**: iOS
   - **Name**: `Chị Ơi! — Dịch vụ giúp việc` (max 30 chars)
   - **Primary language**: Vietnamese
   - **Bundle ID**: chọn `vn.chioi.app` (từ App ID đã tạo)
   - **SKU**: `CHIOI-IOS-001` (unique identifier riêng cho mình)
   - **User Access**: Full Access
3. **Create**

### 5.2 Note Apple ID (numeric)
Sau khi tạo app:
- **App Information** → **General Information** → **Apple ID**: numeric 10-digit (vd `6740000000`)
- → Paste vào `codemagic.yaml` field `APP_STORE_APPLE_ID`

### 5.3 Setup metadata (làm trước khi submit)
Tab **App Information**:
- **Subtitle**: `Đặt dịch vụ giúp việc tại Vinhomes` (max 30 chars)
- **Category**: Primary `Lifestyle`, Secondary `Utilities`
- **Content rights**: confirm không vi phạm copyright
- **Age rating**: làm questionnaire (4+, 9+, 12+, 17+)

Tab **Pricing and Availability**:
- **Price**: Free
- **Availability**: Vietnam (sau có thể mở rộng)

Tab **App Privacy**:
- **Privacy Policy URL**: `https://chioi.vn/privacy.html` (BẮT BUỘC)
- **Data types collected** — fill chính xác (tương tự Android Data Safety):
  - Phone number, name, address: Linked to user, App functionality
  - Location: Linked, App functionality
  - Photos (KYC): Linked, App functionality
  - Payment info: Linked, App functionality

---

## 6. Trigger build từ Codemagic

### 6.1 Push tag để trigger
```bash
cd "D:\New folder\Ch-i-App"
git tag -a v1.0.0 -m "iOS first release"
git push origin v1.0.0
```

Codemagic detect tag `v*` → trigger workflow `ios-release`.

### 6.2 Monitor build
1. https://codemagic.io/app/<your-app-id>/builds
2. Theo dõi 5 steps: Setup signing → Install deps → Sync iOS → Bump version → Build IPA
3. Build ~10-15 phút trên Mac Mini M2 (free tier)

### 6.3 Output
- IPA file: `mobile-ios/ios/App/build/ios/ipa/App.ipa`
- dSYM symbols: cho crash reporting Apple
- Build log: debug nếu fail

### 6.4 Auto upload TestFlight
codemagic.yaml có `submit_to_testflight: true` → IPA auto-uploaded sau build success.

Vào App Store Connect → **TestFlight** tab → thấy build 1.0.0 (1) → status **Processing** (~30 phút) → **Ready to Test**.

---

## 7. TestFlight Beta Testing

### 7.1 Internal testers (max 100, không cần Apple review)
1. **TestFlight** → **Internal Testing** → ➕ **Create Group** → `Internal Testers`
2. Add tester emails (phải có Apple ID)
3. Tester nhận email → cài **TestFlight app** từ App Store → mở app `Chị Ơi!` → cài

### 7.2 External testers (max 10,000, cần Apple beta review ~1 ngày)
1. **TestFlight** → **External Testing** → ➕ **Create Group**
2. Setup **What to Test** + **Test Information**
3. Submit for **Beta App Review** (1 ngày)
4. Approved → invite testers bằng email hoặc public link

### 7.3 Mỗi build mới
Push tag mới (vd `v1.0.1`) → Codemagic build → auto upload TestFlight → testers nhận update.

---

## 8. Submit Production review

### 8.1 Chuẩn bị final
Trước khi submit:
- [ ] App icon 1024x1024 PNG (Apple sẽ tự resize cho các size)
- [ ] Screenshots cho từng device size:
  - **iPhone 6.7" (Pro Max)**: 1290×2796 — bắt buộc, 1-10 ảnh
  - **iPhone 6.5" (Plus)**: 1242×2688 — tự động dùng 6.7" nếu thiếu
  - **iPhone 5.5" (8 Plus)**: 1242×2208 — bắt buộc cho support old devices
  - **iPad 12.9" Pro**: 2048×2732 — nếu support iPad
- [ ] App preview video (optional, max 30s)
- [ ] Promotional text (170 chars) — show ở đầu store listing
- [ ] Description (4000 chars)
- [ ] Keywords (100 chars, dấu phẩy ngăn cách): "giúp việc, dịch vụ, dọn nhà, trông trẻ, mua hộ, vinhomes"
- [ ] Support URL: `https://chioi.vn/support`
- [ ] Marketing URL (optional)

### 8.2 Submit
1. App Store Connect → app → **iOS App** → version `1.0.0`
2. Trong **Build** → chọn TestFlight build mới nhất
3. **Save** → **Add for Review** → **Submit for Review**
4. Apple review **24-48 giờ** (sometimes lên đến 7 ngày)

### 8.3 Common rejection reasons
| Reason | Fix |
|--------|-----|
| **4.2 Minimum functionality** — pure WebView | Đảm bảo có ≥3 native features: Push notification, Geolocation, Camera. Capacitor plugins đã ready trong project |
| **5.1.1 Privacy** — Privacy policy không khớp permission | Update privacy.html liệt kê chính xác |
| **2.3 Accurate metadata** — screenshot không match app | Chụp screenshot từ device thực, không generic mockup |
| **4.5.4 Spam** — keywords stuffing | Keywords tự nhiên, không lặp |
| **3.1.1 In-App Purchase** — VietQR payment | Phải dùng Apple IAP cho digital goods. Dịch vụ vật lý OK dùng external payment |
| **5.5 Developer Code of Conduct** — fake reviews | Không seed reviews giả |

### 8.4 Sau khi approved
- Auto release theo schedule trong **Pricing and Availability** → **App Availability**
- Hoặc manual release
- ~2-4 giờ propagate global → app live trên App Store

---

## 9. Update sau này

### 9.1 Update code (không cần build mới)
PWA logic ở `app.chioi.vn` — update FE/BE qua git push → user app auto-load latest. KHÔNG cần resubmit iOS.

### 9.2 Update wrapper (cần build mới)
Khi:
- Đổi `capacitor.config.ts` (icon, splash, plugin)
- Add/remove Capacitor plugins
- Update permissions trong Info.plist
- Đổi App Store metadata

Process:
```bash
# Bump version trong codemagic.yaml hoặc commit tag mới
git tag -a v1.0.1 -m "Update splash + push notification"
git push origin v1.0.1
```

Codemagic auto-bump build number → upload TestFlight → submit Production trong App Store Connect (manual).

### 9.3 Force update prompt
Khi cần force user update (vd security):
- App Store Connect → **App Information** → **Notes for Review**
- Hoặc qua remote config FE check `appVersion`, hiện modal "Vui lòng cập nhật"

---

## 10. Pricing Codemagic

| Plan | Mac build minutes/tháng | Cost |
|------|-------------------------|------|
| Free | 500 phút | $0 |
| Standard | 1500 phút | $28/tháng |
| Pro | unlimited | $99/tháng |

Mỗi iOS build ~15 phút → Free tier đủ cho ~33 builds/tháng.

---

## 11. Troubleshooting

### Build fail "No matching provisioning profiles"
- Verify Integration App Store Connect đã link đúng team
- Bundle ID phải match: `vn.chioi.app` cả trong Apple Dev Portal + capacitor.config.ts + Xcode project
- Codemagic UI → Teams → Code signing identities → re-fetch

### Build fail "CocoaPods could not find compatible versions"
- `cd mobile-ios/ios/App && pod update` local → commit Podfile.lock → push

### TestFlight build stuck "Processing"
- Đợi 30-60 phút (đôi khi 24h cho lần đầu)
- Apple sẽ email nếu reject (kèm lý do)

### App Store reject "4.2 Minimum functionality"
- Bật thêm Capacitor plugins (Camera, Geolocation, Push) — đã có sẵn trong package.json
- Submit again với note: "Added native camera/location/push features"

### Universal Links không hoạt động
- Check `/.well-known/apple-app-site-association` accessible qua HTTPS
- Verify Apple Team ID trong file đúng
- iOS có thể cache 24h — uninstall + reinstall app

---

## 12. Checklist tổng

### Bạn cần làm
- [ ] Đăng ký Apple Developer Program ($99) + verify
- [ ] Tạo App ID `vn.chioi.app` với Push Notifications + Associated Domains
- [ ] Generate App Store Connect API key (.p8)
- [ ] Tạo Codemagic account + connect GitHub repo + setup integration
- [ ] Tạo app trong App Store Connect + note Apple ID number
- [ ] Update `codemagic.yaml`: `APP_STORE_APPLE_ID` + integration name
- [ ] Privacy Policy HTML tại `https://chioi.vn/privacy.html`
- [ ] Tạo `/.well-known/apple-app-site-association` (cần Team ID)
- [ ] Chuẩn bị app icon 1024×1024 + 6-10 screenshots
- [ ] Push tag `v1.0.0` → trigger build
- [ ] Test TestFlight build trên iPhone thực
- [ ] Submit App Store review

### Code đã sẵn sàng
- ✅ `mobile-ios/` Capacitor iOS project skeleton
- ✅ `mobile-ios/ios/` Xcode project file
- ✅ `mobile-ios/capacitor.config.ts` config trỏ về app.chioi.vn
- ✅ `mobile-ios/ios/App/App/Info.plist` permissions + ATS
- ✅ `codemagic.yaml` workflow build IPA + auto upload TestFlight
- ✅ 5 native plugins: App, Browser, Geolocation, PushNotifications, SplashScreen

---

## 13. Tài liệu tham khảo

- Apple Developer Program: https://developer.apple.com/programs/
- App Store Connect API: https://developer.apple.com/documentation/appstoreconnectapi
- Codemagic iOS docs: https://docs.codemagic.io/yaml-quick-start/building-a-native-ios-app/
- Capacitor iOS: https://capacitorjs.com/docs/ios
- App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Universal Links: https://developer.apple.com/documentation/xcode/supporting-associated-domains
- TestFlight: https://developer.apple.com/testflight/

---

## 🆘 Hỗ trợ tiếp

Tôi có thể giúp thêm:
- Generate `apple-app-site-association` khi có Team ID
- Tạo `privacy.html` template
- Setup CI/CD cho cả Android + iOS song song (Codemagic supports both)
- Fix Codemagic build error nếu fail
- Generate App Store assets (icon variants, splash screens)

Cứ ping khi tới bước cần action.
