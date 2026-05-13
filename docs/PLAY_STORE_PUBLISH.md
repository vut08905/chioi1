# Hướng dẫn xuất file & publish Chị Ơi! lên Google Play Store

> **Phiên bản:** 1.0 · 2026-05-14
> **App type:** TWA (Trusted Web Activity) wrap PWA `https://app.chioi.vn`
> **Build hiện tại:** debug-signed APK ở `dist/chioi-app-debug.apk` (TEST ONLY — không upload Play Store được)

---

## Tổng quan quy trình

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Chuẩn bị tài khoản Play Console + legal docs                │
│  2. Tạo PRODUCTION keystore (KHÁC debug — bảo mật cao)          │
│  3. Update twa-manifest.json + assetlinks.json với keystore mới │
│  4. Build AAB release-signed (Android App Bundle)               │
│  5. Soạn nội dung Play Store listing (mô tả, ảnh, video)        │
│  6. Trả lời Data Safety + Content Rating questionnaire          │
│  7. Tạo Internal Testing track → mời tester → kiểm tra          │
│  8. Promote → Closed/Open testing (nếu account mới)             │
│  9. Submit Production review → đợi 1-7 ngày                     │
│ 10. Post-launch: monitor vitals, update bằng versionCode mới    │
└─────────────────────────────────────────────────────────────────┘
```

**Tổng thời gian first launch:** 2-4 tuần (account mới phải qua Closed Testing 14 ngày + 12 tester active).

---

## 1. Chuẩn bị tài khoản & legal

### 1.1 Google Play Console developer account

| Item | Yêu cầu |
|------|---------|
| **Phí đăng ký** | $25 USD (one-time, lifetime) |
| **Loại account** | Cá nhân HOẶC Organization (recommend Organization cho commercial app) |
| **Verify email** | Gmail account (nên dùng email công ty riêng cho production) |
| **Tax info** | Nếu có in-app purchase / ads — phải nộp W-8BEN cho Mỹ tax |
| **Identity verification** | Account mới (sau Nov 2023) **bắt buộc** verify danh tính bằng CCCD/passport |
| **Closed testing requirement** | Account mới: phải chạy Closed Testing với **≥12 tester active trong ≥14 ngày** trước khi mở Production |

Đăng ký: https://play.google.com/console/signup

### 1.2 Privacy policy (BẮT BUỘC)

Mọi app collect data (login, location, contacts, ...) đều cần Privacy Policy URL **publicly accessible**. Không có → reject 100%.

**Cho Chị Ơi!:**
- Host tại: `https://chioi.vn/chinh-sach-bao-mat.html` hoặc `https://chioi.vn/privacy`
- Phải mention: thu thập SĐT, GPS, ảnh KYC, lịch sử giao dịch
- Có liên hệ DPO (Data Protection Officer) email
- Tham khảo template: https://www.iubenda.com/ hoặc https://www.privacypolicies.com/

**Tạo nhanh template Privacy Policy** — tôi có thể generate file `frontend/khachhang/privacy.html` nếu bạn yêu cầu.

### 1.3 Terms of Service (recommend)

Tương tự Privacy Policy. Host tại `https://chioi.vn/dieu-khoan.html`.

### 1.4 Content/Brand assets cần chuẩn bị trước

| Asset | Kích thước | Format | Mô tả |
|-------|-----------|--------|-------|
| **App icon (Play Console)** | 512x512 px | PNG, 32-bit RGBA | Icon hiển thị trong Store listing (KHÁC icon trong APK) |
| **Feature graphic** | 1024x500 px | PNG/JPG | Banner đầu trang Store listing |
| **Screenshots phone** | 320-3840 px width | PNG/JPG | **Tối thiểu 2, tối đa 8** |
| **Screenshots tablet 7"** | optional | — | Recommend nếu support tablet |
| **Screenshots tablet 10"** | optional | — | Recommend nếu support tablet |
| **Promo video** | optional | YouTube link | 30-120 giây (tăng conversion ~30%) |

**Mẹo cho screenshots:**
- Dùng 6-8 screen quan trọng: Trang chủ → Đặt dịch vụ → Theo dõi đơn → Ví → Đánh giá → Profile
- Add overlay text (vd "Đặt dịch vụ trong 30s") qua Figma / Photoshop
- Tool free tạo mockup: https://previewed.app/ hoặc https://app-mockup.com/

---

## 2. Tạo PRODUCTION keystore

⚠️ **CẢNH BÁO CỰC KỲ QUAN TRỌNG:**
- Keystore production phải **giữ kín**, **backup nhiều nơi** (3 bản: cloud, USB, password manager)
- **MẤT keystore = MẤT QUYỀN UPDATE APP** (Play Console không bao giờ recover được)
- Phải dùng **CÙNG KEYSTORE** cho mọi update sau này
- KHÔNG commit keystore vào git
- Recommend: enable **Play App Signing** (Google quản lý key cho mình — fix mất key)

### 2.1 Tạo keystore production (làm 1 lần duy nhất)

```bash
cd D:/chioi-twa  # hoặc folder secrets bạn chọn

# Sinh password mạnh trước
openssl rand -base64 24 | tr -d '/+=' | head -c 32  # vd: L4kS3M2nR9pT8qX7vC1wB6yE5zN0aH3j

# Set vào env (nhớ kỹ password — ghi password manager NGAY)
export STORE_PASS="<password vừa sinh>"
export KEY_PASS="<password tương tự, có thể giống storepass>"

# Tạo keystore (validity 25 năm)
"/c/Program Files/Microsoft/jdk-17.0.18.8-hotspot/bin/keytool" \
  -genkey -v \
  -keystore chioi-prod.keystore \
  -alias chioi-key \
  -keyalg RSA -keysize 4096 \
  -validity 9125 \
  -storepass "$STORE_PASS" \
  -keypass "$KEY_PASS" \
  -dname "CN=Chi Oi App, OU=Engineering, O=Chi Oi Co. Ltd, L=Hanoi, ST=Hanoi, C=VN"
```

**Backup ngay:**
```bash
# Copy keystore + ghi password vào password manager (1Password / Bitwarden)
cp chioi-prod.keystore ~/Backup/chioi-prod-$(date +%F).keystore
# Encrypt backup
gpg -c ~/Backup/chioi-prod-$(date +%F).keystore  # tạo .gpg file
# Upload .gpg lên Drive/iCloud
```

### 2.2 Lấy SHA256 fingerprint của keystore production

```bash
"/c/Program Files/Microsoft/jdk-17.0.18.8-hotspot/bin/keytool" \
  -list -v \
  -keystore chioi-prod.keystore \
  -alias chioi-key \
  -storepass "$STORE_PASS" \
  | grep -A 1 "SHA256:"
```

Output ví dụ:
```
SHA256: AB:12:CD:34:EF:56:78:90:...:99
```

**Lưu fingerprint này** — dùng cho `assetlinks.json`.

### 2.3 (RECOMMEND) Enable Play App Signing

Google Play Console mặc định bật **Play App Signing**:
- Bạn upload AAB ký bằng **Upload Key** (keystore của mình)
- Google sẽ resign bằng **App Signing Key** (Google quản lý) trước khi distribute
- Lợi ích: nếu mất Upload Key → request reset; còn Google Key luôn an toàn

→ Khi setup Play Console lần đầu, chọn **"Use Play App Signing"** (default).

---

## 3. Update twa-manifest.json + assetlinks.json

### 3.1 Update `D:/chioi-twa/twa-manifest.json`

Đổi version + signing key:

```json
{
  "packageId": "vn.chioi.app",
  "host": "app.chioi.vn",
  "name": "Chị Ơi! — Đặt dịch vụ giúp việc",
  "launcherName": "Chị Ơi!",
  ...
  "appVersionName": "1.0.0",
  "appVersionCode": 1,
  ...
  "signingKey": {
    "path": "D:/chioi-twa/chioi-prod.keystore",
    "alias": "chioi-key"
  },
  ...
}
```

⚠️ Lưu ý: với mỗi release sau này, **bump cả 2 field**:
- `appVersionCode`: integer, **PHẢI tăng** mỗi release (1, 2, 3, ...)
- `appVersionName`: string user thấy ("1.0.0", "1.0.1", "1.1.0", ...)

### 3.2 Update `frontend/.well-known/assetlinks.json`

Thêm fingerprint production VÀO mảng (giữ debug fingerprint nếu vẫn dùng debug build cho test):

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "vn.chioi.app",
      "sha256_cert_fingerprints": [
        "4A:BA:CC:41:33:67:52:86:C0:27:E7:2C:12:A1:8A:AE:5B:51:1A:FF:FB:07:E0:E1:29:FA:A7:CC:07:A6:63:AA",
        "AB:12:CD:34:EF:56:78:90:...:99"
      ]
    }
  }
]
```

⚠️ Nếu dùng **Play App Signing**: cần **THÊM** fingerprint của App Signing Key (lấy sau khi tạo app trong Play Console — Settings → App integrity → App signing → SHA-256 certificate fingerprint).

Cần 3 fingerprint trong production:
1. Upload key (keystore của mình)
2. App Signing Key (Google) — *bắt buộc cho TWA work với Play distributed APK*
3. (optional) Debug key — nếu vẫn build debug local

### 3.3 Commit + redeploy

```bash
cd "D:\New folder\Ch-i-App"
git add twa-manifest.json frontend/.well-known/assetlinks.json
git commit -m "Add production keystore fingerprint to assetlinks"
git push

# SSH VPS pull + redeploy assetlinks (KHÔNG cần rebuild backend)
ssh root@45.119.83.233
cd /opt/chioi
git pull
cp frontend/.well-known/assetlinks.json /var/www/chioi.vn/.well-known/
cp frontend/.well-known/assetlinks.json /var/www/app.chioi.vn/.well-known/
systemctl reload nginx

# Verify
curl https://app.chioi.vn/.well-known/assetlinks.json
```

---

## 4. Build AAB release-signed

⚠️ **AAB (Android App Bundle)** thay APK — bắt buộc cho Play Store từ 2021. Google sẽ tự generate APK optimized cho từng device.

### 4.1 Regenerate Android project với keystore production

```bash
cd D:/chioi-twa
node generate.js   # regenerate skeleton từ twa-manifest.json mới
```

### 4.2 Build AAB

```bash
cd D:/chioi-twa
export JAVA_HOME="/c/Program Files/Microsoft/jdk-17.0.18.8-hotspot"
export ANDROID_HOME="D:/android-sdk"
export TMP="D:\\gradle-tmp"
export TEMP="D:\\gradle-tmp"

# Set keystore passwords (KHÔNG hardcode trong gradle.properties cho commit!)
export TWA_KEY_STORE_PASSWORD="<STORE_PASS từ Bước 2.1>"
export TWA_KEY_PASSWORD="<KEY_PASS từ Bước 2.1>"

./gradlew.bat bundleRelease --no-daemon
```

Output: `D:/chioi-twa/app/build/outputs/bundle/release/app-release.aab` (~3-4 MB).

### 4.3 Verify AAB

```bash
# Check AAB info
"$ANDROID_HOME/build-tools/34.0.0/aapt2.exe" dump badging \
  D:/chioi-twa/app/build/outputs/bundle/release/app-release.aab

# Hoặc dùng bundletool (download từ https://github.com/google/bundletool/releases)
java -jar bundletool-all-X.X.X.jar dump manifest --bundle=app-release.aab
```

### 4.4 Test AAB local (optional nhưng RECOMMEND)

```bash
# bundletool extract APKs cho device hiện tại
java -jar bundletool-all-X.X.X.jar build-apks \
  --bundle=app-release.aab \
  --output=app-release.apks \
  --ks=chioi-prod.keystore \
  --ks-key-alias=chioi-key \
  --ks-pass=pass:$STORE_PASS

# Install lên device kết nối ADB
java -jar bundletool-all-X.X.X.jar install-apks --apks=app-release.apks
```

Test full flow: login, đặt đơn, GPS, notifications. Nếu OK → upload Play Console.

---

## 5. Tạo app trong Google Play Console

### 5.1 Create app

1. Truy cập https://play.google.com/console
2. **All apps** → **Create app**
3. Điền:
   - **App name**: `Chị Ơi! — Dịch vụ giúp việc`
   - **Default language**: Vietnamese – vi
   - **App or game**: App
   - **Free or paid**: Free
   - **Declarations** (3 checkbox):
     - [x] App tuân thủ Developer Program Policies
     - [x] App tuân thủ US export laws
4. **Create app**

### 5.2 Setup app — 6 mục bắt buộc trước khi submit

Play Console hiển thị checklist "**Set up your app**" — phải hoàn thành tất cả:

#### a. Privacy policy
- URL: `https://chioi.vn/chinh-sach-bao-mat.html`

#### b. App access
- "All functionality is available without special access" (nếu KH có thể browse mà không login)
- HOẶC "Some functionality is restricted" → cung cấp **demo account** cho Play reviewer:
  ```
  Username: 0901234567 (or test phone)
  Password: 123456
  Notes: Tài khoản demo Khách hàng. Để test Tasker dùng SĐT 0909876543, mật khẩu 123456.
  ```

#### c. Ads
- "No, my app does not contain ads" (nếu chưa có quảng cáo)

#### d. Content rating questionnaire
- Vào **Policy** → **App content** → **Content rating** → **Start questionnaire**
- Trả lời ~15 câu (vd: app có violence không, sexual content, gambling)
- Cho Chị Ơi!: PG (Everyone) hoặc 13+ tùy nội dung user-generated chat

#### e. Target audience and content
- **Target age groups**: 18+ (vì có payment + GPS)
- "Does your app appeal to children": No

#### f. News app
- "No, this isn't a news app"

#### g. **Data safety** (BẮT BUỘC, mới từ 2022)
- Liệt kê dữ liệu app collect:

| Data type | Collected? | Shared with third party? | Required? | Purpose |
|-----------|-----------|--------------------------|-----------|---------|
| Phone number | ✅ | ❌ | ✅ Required | Account, App functionality |
| Name | ✅ | ❌ | ✅ Required | Account, Personalization |
| Email | ✅ optional | ❌ | ⬜ Optional | Communication |
| Address | ✅ | ✅ Shared with Tasker | ✅ Required | App functionality (giao việc) |
| Approximate location | ✅ | ✅ Shared with Tasker | ✅ Required | Matching nearby Tasker |
| Precise location | ✅ | ✅ Shared with Tasker | ✅ Required | Navigation |
| Payment info | ✅ | ❌ | ✅ Required | App functionality |
| Photos (KYC) | ✅ Tasker | ❌ | ✅ Required (Tasker) | Identity verification |
| In-app messages | ✅ | ❌ | ⬜ Optional | App functionality |

- **Encryption in transit**: ✅ Yes (HTTPS)
- **User can request data deletion**: ✅ Yes (cung cấp mechanism — endpoint /api/users/delete hoặc support email)

#### h. Government apps
- "No"

### 5.3 Store listing

#### Main store listing
- **App name**: Chị Ơi! — Dịch vụ giúp việc (max 30 chars)
- **Short description**: "Đặt dịch vụ giúp việc, trông trẻ, mua hộ tại Vinhomes" (max 80 chars)
- **Full description** (max 4000 chars):
  ```
  Chị Ơi! — Ứng dụng đặt dịch vụ giúp việc nhanh chóng cho cư dân Vinhomes.

  ✨ DỊCH VỤ
  • Dọn dẹp nhà cửa theo giờ
  • Trông trẻ
  • Mua hộ thực phẩm, đồ dùng
  • Đặt gói gia đình theo tháng

  🚀 ĐẶT NHANH
  • Chọn dịch vụ → chọn giờ → đặt trong 30 giây
  • Tự động tìm Tasker gần nhất qua GPS
  • Theo dõi tiến độ realtime trên bản đồ

  💰 THANH TOÁN AN TOÀN
  • Ví Chị Ơi tích hợp
  • Nạp tiền qua VietQR
  • Lịch sử giao dịch minh bạch

  💬 LIÊN LẠC TRỰC TIẾP
  • Chat với Tasker realtime
  • Gọi voice qua app (WebRTC)
  • Liên hệ Admin/CSKH 24/7

  ⭐ ĐÁNH GIÁ TASKER
  • Xem rating, số đơn đã hoàn thành
  • Để lại review sau mỗi đơn

  Tải app ngay để trải nghiệm dịch vụ chuyên nghiệp!
  ```

#### Graphics
- **App icon**: 512×512 PNG (`frontend/icons/icon-512.png` đã có)
- **Feature graphic**: 1024×500 — cần thiết kế (tool: Figma free template)
- **Phone screenshots**: 2-8 ảnh (chụp từ device thật hoặc emulator)

#### Categorization
- **App category**: Lifestyle
- **Tags**: Home services, On-demand, Cleaning

---

## 6. Upload AAB + tạo testing track

### 6.1 Internal testing (làm trước Production)

1. Vào **Testing** → **Internal testing** → **Create new release**
2. **App signing**:
   - Lần đầu: chọn **"Use Google-generated key"** (Play App Signing) — recommend
   - Upload `app-release.aab` → Play tự ký lại với App Signing Key
   - **Save** SHA256 của App Signing Key (Settings → App integrity) → add vào `assetlinks.json`
3. **Release name**: `1.0.0 (1) Internal`
4. **Release notes** (tiếng Việt + English):
   ```
   <vi>
   Phiên bản đầu tiên — đặt dịch vụ giúp việc cho cư dân Vinhomes.
   </vi>
   <en>
   First release — book home service for Vinhomes residents.
   </en>
   ```
5. **Save** → **Review release** → **Start rollout to Internal testing**

#### Mời tester

- **Testers** tab → **Create email list**
- Add email Gmail của team (max 100 testers)
- Copy **opt-in URL** → gửi cho tester
- Tester click link → cài app từ Play Store (NHƯNG CHỈ test track) trong vài phút

### 6.2 Closed testing (BẮT BUỘC cho account mới)

Account đăng ký sau Nov 2023:
- Phải chạy **Closed Testing** với **≥12 unique testers** active trong **≥14 ngày liên tục** trước khi unlock Production

Setup:
- **Testing** → **Closed testing** → **Create track**
- Track name: `closed-track-1`
- Tương tự Internal: upload AAB, mời 12+ testers, đợi 14 ngày
- Chấm "Active" = mở app ít nhất 1 lần trong period

### 6.3 (Optional) Open testing

Public beta — anyone với link có thể join.
- **Testing** → **Open testing** → setup tương tự
- Useful cho beta launch trước Production

---

## 7. Production release

### 7.1 Trước khi submit Production

Checklist cuối cùng:
- [ ] App đã pass Internal/Closed testing không có crash nghiêm trọng
- [ ] Privacy Policy URL active + comprehensive
- [ ] Data Safety form hoàn thiện đúng thực tế
- [ ] Content rating obtained
- [ ] All required graphics uploaded (icon, feature graphic, ≥2 screenshots)
- [ ] Demo account hoạt động (Play reviewer sẽ login bằng nó)
- [ ] App description không vi phạm spam/keyword stuffing
- [ ] Permissions có justification rõ ràng (mỗi permission có lý do)
- [ ] HTTPS-only (no mixed content) — đã verify
- [ ] assetlinks.json có 3 fingerprints (Upload Key + App Signing Key + Debug nếu cần)

### 7.2 Submit Production

1. **Production** → **Create new release**
2. Upload AAB (hoặc **Promote from track** nếu đã có ở Internal)
3. Release name: `1.0.0 (1)`
4. Release notes (vi + en)
5. **Rollout percentage**:
   - Recommend: **Staged rollout 10%** đầu → đợi 24-48h check Vitals → **20% → 50% → 100%**
   - Hoặc 100% ngay nếu confident
6. **Review release** → **Start rollout to Production**

### 7.3 Review wait time

| Account type | Typical wait |
|--------------|--------------|
| Established account | 1-3 ngày |
| New account first app | 3-7 ngày |
| Sensitive permissions (location, SMS, camera) | +2-3 ngày |
| Reject + resubmit | +1-2 ngày mỗi lần |

---

## 8. Common rejection reasons & fixes

| Reason | Fix |
|--------|-----|
| **Webview-only / spam app** | TWA OK nếu PWA pass Lighthouse PWA audit ≥80. Run `chrome://lighthouse` trên app.chioi.vn |
| **Missing Privacy Policy** | Phải có URL active, không 404 |
| **Data Safety không khớp thực tế** | Audit lại app collect gì, fill chính xác |
| **Permission misuse** | Mỗi permission cần có chức năng tương ứng. VD: ACCESS_FINE_LOCATION → có matching tasker |
| **Sensitive permission justification missing** | Foreground location, background location, SMS — cần video demo gửi Play |
| **Inappropriate content rating** | Tăng age rating nếu có user-generated chat (13+) |
| **Crash on first launch** | Test kỹ trên emulator API 21+ và 30+ trước upload |
| **assetlinks.json fail** | Verify fingerprint match (Upload + App Signing key) |
| **App Bundle missing language resource** | Đảm bảo `defaultLocale` trong AndroidManifest |

---

## 9. Post-launch monitoring

### 9.1 Vitals dashboard

**Quality** → **Android vitals**:
- Crash rate (target <2%)
- ANR (Application Not Responding) rate (target <0.47%)
- Slow rendering, slow startup
- Battery drain
- Permission denial

Chrome có thể flag TWA nếu crash rate cao → giảm visibility trong Search.

### 9.2 Release & monitor

- **Statistics** → daily installs, uninstalls, ratings
- **Reviews** → reply user reviews (tăng rating)
- **Subscriptions/IAP** → revenue (sau khi setup)

### 9.3 Update releases

Mỗi update:
1. Bump `appVersionCode` (1 → 2 → 3) trong `twa-manifest.json`
2. Bump `appVersionName` (1.0.0 → 1.0.1) — semver
3. `node generate.js` → regenerate
4. `gradlew.bat bundleRelease` → AAB mới
5. Upload Play Console → Production → New release
6. Release notes (vi + en) — what's changed
7. Rollout staged

---

## 10. Specific commands cho project Chị Ơi!

### 10.1 First production build script

Tạo file `D:/chioi-twa/build-production.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Đọc passwords từ env hoặc password manager (KHÔNG hardcode)
[[ -z "${TWA_KEY_STORE_PASSWORD:-}" ]] && { echo "Set TWA_KEY_STORE_PASSWORD first"; exit 1; }
[[ -z "${TWA_KEY_PASSWORD:-}" ]] && { echo "Set TWA_KEY_PASSWORD first"; exit 1; }

cd /d/chioi-twa

export JAVA_HOME="/c/Program Files/Microsoft/jdk-17.0.18.8-hotspot"
export ANDROID_HOME="D:/android-sdk"
export TMP="D:\\gradle-tmp" TEMP="D:\\gradle-tmp"

echo "[1/3] Regenerating Android skeleton..."
node generate.js

echo "[2/3] Building release AAB..."
./gradlew.bat bundleRelease --no-daemon

AAB="app/build/outputs/bundle/release/app-release.aab"
[[ -f "$AAB" ]] || { echo "AAB not generated"; exit 1; }

echo "[3/3] Copying to dist/"
mkdir -p "/d/New folder/Ch-i-App/dist"
VERSION=$(grep -oP '"appVersionName":\s*"\K[^"]+' twa-manifest.json)
CODE=$(grep -oP '"appVersionCode":\s*\K\d+' twa-manifest.json)
DEST="/d/New folder/Ch-i-App/dist/chioi-${VERSION}-${CODE}.aab"
cp "$AAB" "$DEST"

echo "✅ Output: $DEST ($(du -h "$DEST" | cut -f1))"
echo ""
echo "Next: upload AAB to Play Console → Internal testing → release"
```

### 10.2 Privacy Policy template

Generate template:
```bash
# Tôi có thể tạo file `frontend/khachhang/privacy.html` nếu yêu cầu
```

### 10.3 Update assetlinks sau khi có App Signing Key của Google

Khi Play Console tạo App Signing Key:
1. Settings → **App integrity** → **App signing**
2. Copy **SHA-256 certificate fingerprint** (App signing key)
3. Edit `frontend/.well-known/assetlinks.json` → add fingerprint vào mảng
4. Commit + push + redeploy assetlinks lên VPS
5. Verify `https://app.chioi.vn/.well-known/assetlinks.json` đầy đủ 3 fingerprints

---

## 📅 Timeline ước tính (account mới)

| Tuần | Việc làm |
|------|----------|
| **Tuần 0** | Đăng ký Play Console ($25), verify identity (1-2 ngày) |
| **Tuần 1** | Soạn Privacy Policy + Terms, chuẩn bị graphics, build AAB production, internal testing |
| **Tuần 2-3** | Closed Testing với 12+ tester (account mới yêu cầu 14 ngày) |
| **Tuần 4** | Submit Production review (1-7 ngày) |
| **Tuần 4+** | Approved → live trên Play Store |

**Account đã có lịch sử**: bỏ qua Closed Testing requirement → có thể publish trong 3-7 ngày.

---

## 🔗 Tài liệu chính thức Google

- Play Console: https://play.google.com/console/
- Submit checklist: https://support.google.com/googleplay/android-developer/answer/9859152
- TWA quickstart: https://developer.chrome.com/docs/android/trusted-web-activity/quick-start
- Closed testing requirement: https://support.google.com/googleplay/android-developer/answer/14151465
- Data Safety form: https://support.google.com/googleplay/android-developer/answer/10787469
- Bundletool: https://developer.android.com/tools/bundletool
- Play Asset Delivery: https://developer.android.com/guide/playcore/asset-delivery

---

## 🆘 Hỗ trợ tiếp

Nếu gặp vấn đề trong quá trình submit:
1. Read full error message từ Play Console (rất chi tiết, có link "Learn more")
2. Search Stack Overflow / Google Play Help Center
3. Liên hệ Play Console support qua **Help → Contact us** (priority email)
4. Reddit r/androiddev rất active

Quay lại task này hỏi tôi nếu cần:
- Generate Privacy Policy / Terms HTML
- Build AAB script automation
- Resolve specific rejection
- Setup CI/CD auto-deploy lên Play (vd qua Fastlane)
