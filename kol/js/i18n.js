export const LANGUAGE_KEY = "kol_language";
const TC_REGIONS = /^(zh-(hant|tw|hk|mo))\b/i;

export const messages = {
  en: {
    loading: "Loading your campaign task…", secure: "Secure test portal", openTitle: "Open your KOL task",
    openIntro: "Select your assigned X account and enter the private token you received. The token stays in this browser and is never shown on this page.",
    selectKol: "1. Select a test KOL", enterToken: "2. Enter your private task token", tokenPlaceholder: "Paste token here",
    tokenNote: "Do not share this token or send it in screenshots.", openTask: "Open Task", how: "How it works",
    step1: "Select the X account assigned to you.", step2: "Paste the private token sent by the campaign team.",
    step3: "Open the task, copy the approved post, download assets and submit your published X URL.", adminNeed: "Need campaign administration? ", adminOpen: "Open Admin", privacy: "Privacy",
    schedule: "Publishing schedule", calendar: "Add to Calendar", approved: "Approved Post Copy", copyPost: "Copy Post", campaign: "Your campaign link", copyLink: "Copy Link", openPage: "Open Landing Page", assets: "Assets", downloadAll: "Download All", requirements: "Publishing requirements", submitTitle: "Submit your published post", postLabel: "Paste your published X post URL", submit: "Submit Published Post", received: "Submission Received", monitored: "Your post is now being monitored. No screenshots are required.", waiting: "Data status: Waiting for public metrics",
    selectError: "Select your assigned KOL account.", tokenError: "Enter your private task token.", unavailable: "Task unavailable", incomplete: "This task link is incomplete or invalid.", copied: "Copied.", localTime: "Your local time: {value}", publishes: "Publishes in {d}d {h}h {m}m", windowOpen: "Publishing window is open", download: "Download",
    invalidPost: "Enter a valid x.com or twitter.com post URL containing /status/ and a numeric Post ID.", wrongHandle: "This post belongs to @{user}, not {handle}.", submitted: "A post has already been submitted for this task.", confirmSubmit: "Submit {url}? This cannot be changed.",
    signInTitle: "Admin sign in", signInNote: "Production uses Supabase Auth. Demo access is local-only.", email: "Email", password: "Password", signIn: "Sign in", setPassword: "Set your admin password", choosePassword: "Choose a password for this MAGNE.AI KOL Admin account.", newPassword: "New password", confirmPassword: "Confirm password", invalidLink: "This link is invalid or expired", back: "Back to sign in", manager: "Task content manager", managerNote: "Edit copy, schedule and campaign assets. Changes are audited.", refresh: "Refresh", task: "Task", title: "Title", status: "Status", angle: "Primary angle", postCopy: "Approved post copy", publishAt: "Publish at", reqLines: "Requirements (one per line)", prohibited: "Prohibited claims (one per line)", enableLink: "Enable campaign link", baseUrl: "Campaign base URL", generated: "Generated URL", save: "Save content", media: "Images and videos", mediaNote: "PNG/JPG/WebP ≤ 5 MB · MP4/WebM ≤ 18 MB · up to 10 active assets.", search: "Search KOL", allWaves: "All waves", allStatuses: "All statuses", export: "Export CSV", signOut: "Sign out", close: "Close", action: "Action", view: "View",
  },
  tc: {
    loading: "正在載入你的活動任務…", secure: "安全測試入口", openTitle: "開啟你的 KOL 任務", openIntro: "選擇獲指派的 X 帳號，並輸入收到的私人權杖。權杖只會保留在此瀏覽器中，不會顯示於頁面。", selectKol: "1. 選擇測試 KOL", enterToken: "2. 輸入私人任務權杖", tokenPlaceholder: "在此貼上權杖", tokenNote: "請勿分享此權杖或將其放入截圖。", openTask: "開啟任務", how: "使用方式", step1: "選擇指派給你的 X 帳號。", step2: "貼上活動團隊傳送的私人權杖。", step3: "開啟任務、複製核准貼文、下載素材並提交已發布的 X 網址。", adminNeed: "需要管理活動？", adminOpen: "開啟管理後台", privacy: "隱私權",
    schedule: "發布時程", calendar: "加入行事曆", approved: "核准貼文文案", copyPost: "複製貼文", campaign: "你的活動連結", copyLink: "複製連結", openPage: "開啟著陸頁", assets: "素材", downloadAll: "全部下載", requirements: "發布要求", submitTitle: "提交已發布貼文", postLabel: "貼上已發布的 X 貼文網址", submit: "提交已發布貼文", received: "已收到提交", monitored: "系統正在監測你的貼文，無需提供截圖。", waiting: "資料狀態：等待公開指標", selectError: "請選擇獲指派的 KOL 帳號。", tokenError: "請輸入私人任務權杖。", unavailable: "任務無法使用", incomplete: "此任務連結不完整或無效。", copied: "已複製。", localTime: "你的當地時間：{value}", publishes: "距離發布還有 {d}天 {h}小時 {m}分鐘", windowOpen: "發布時段已開始", download: "下載", invalidPost: "請輸入有效的 x.com 或 twitter.com 貼文網址，且須包含 /status/ 與數字貼文 ID。", wrongHandle: "此貼文屬於 @{user}，而非 {handle}。", submitted: "此任務已提交過貼文。", confirmSubmit: "提交 {url}？提交後無法更改。",
    signInTitle: "管理員登入", signInNote: "正式環境使用 Supabase Auth；示範存取僅限本機。", email: "電子郵件", password: "密碼", signIn: "登入", setPassword: "設定管理員密碼", choosePassword: "請為此 MAGNE.AI KOL 管理帳號設定密碼。", newPassword: "新密碼", confirmPassword: "確認密碼", invalidLink: "此連結無效或已過期", back: "返回登入", manager: "任務內容管理", managerNote: "編輯文案、時程與活動素材；所有變更均會稽核。", refresh: "重新整理", task: "任務", title: "標題", status: "狀態", angle: "主要角度", postCopy: "核准貼文文案", publishAt: "發布時間", reqLines: "要求（每行一項）", prohibited: "禁止聲稱（每行一項）", enableLink: "啟用活動連結", baseUrl: "活動基礎網址", generated: "產生的網址", save: "儲存內容", media: "圖片與影片", mediaNote: "PNG/JPG/WebP ≤ 5 MB · MP4/WebM ≤ 18 MB · 最多 10 個啟用素材。", search: "搜尋 KOL", allWaves: "所有波次", allStatuses: "所有狀態", export: "匯出 CSV", signOut: "登出", close: "關閉", action: "操作", view: "查看",
  },
};
Object.assign(messages.en, {
  postUrlPlaceholder: "https://x.com/username/status/123…",
  demoPassword: "Demo: demo-admin", setPasswordButton: "Set password", recoveryHelp: "Request a new Supabase password recovery email, then open only the newest link.",
  draft: "Draft", ready: "Ready to Publish", published: "Published", paused: "Paused", archived: "Archived", utmCampaign: "UTM campaign", utmContent: "UTM content",
  wave: "Wave", postUrl: "Post URL", views24: "24h Views", views7: "7d Views", likes: "Likes", replies: "Replies", reposts: "Reposts", source: "Source",
  totalKol: "Total KOL", readyStat: "Ready", overdue: "Overdue", complete24: "24h complete", complete7: "7d complete", totalViews: "Total Views", engagement: "Total engagement", clicks: "UTM clicks", manualReview: "Manual review",
  mockSource: "Mock (excluded from official totals)", liveSource: "Live", waitingSource: "Waiting", unableVerify: "Unable to Verify",
  invalidCredentials: "Invalid demo credentials.", passwordSuccess: "Password set successfully. Sign in with your email and new password.", adminDenied: "Admin access denied", selectTask: "Select a task…", characters: "{count} characters", validUrl: "Enter a valid HTTP(S) URL.", validBase: "Enter a valid campaign base URL.", saved: "Saved.", requestFailed: "Request failed.", unsupported: "Unsupported file type.", imageLarge: "Image exceeds 5 MB.", videoLarge: "Video exceeds 18 MB.", signature: "File signature does not match its declared type.", selectFirst: "Select a task first.", maxAssets: "This task already has 10 active assets.", uploading: "Uploading…", uploadFailed: "Upload failed.", uploaded: "Asset uploaded.", active: "active", inactive: "inactive", replace: "Replace", deactivate: "Deactivate", delete: "Delete", deleteConfirm: "Permanently delete this asset?", errorPrefix: "Error: {detail}", unknownError: "Something went wrong. Please try again.",
});
Object.assign(messages.tc, {
  postUrlPlaceholder: "https://x.com/使用者名稱/status/123…",
  demoPassword: "示範：demo-admin", setPasswordButton: "設定密碼", recoveryHelp: "請申請新的 Supabase 密碼復原郵件，並只開啟最新連結。",
  draft: "草稿", ready: "準備發布", published: "已發布", paused: "已暫停", archived: "已封存", utmCampaign: "UTM 活動", utmContent: "UTM 內容",
  wave: "波次", postUrl: "貼文網址", views24: "24 小時瀏覽", views7: "7 天瀏覽", likes: "喜歡", replies: "回覆", reposts: "轉發", source: "來源",
  totalKol: "KOL 總數", readyStat: "待發布", overdue: "已逾期", complete24: "24 小時完成率", complete7: "7 天完成率", totalViews: "總瀏覽量", engagement: "總互動", clicks: "UTM 點擊", manualReview: "人工審核",
  mockSource: "Mock（不計入正式總數）", liveSource: "Live（正式）", waitingSource: "等待中", unableVerify: "無法驗證",
  invalidCredentials: "示範帳號或密碼無效。", passwordSuccess: "密碼設定成功，請使用電子郵件與新密碼登入。", adminDenied: "管理員存取遭拒", selectTask: "選擇任務…", characters: "{count} 個字元", validUrl: "請輸入有效的 HTTP(S) 網址。", validBase: "請輸入有效的活動基礎網址。", saved: "已儲存。", requestFailed: "要求失敗。", unsupported: "不支援此檔案類型。", imageLarge: "圖片超過 5 MB。", videoLarge: "影片超過 18 MB。", signature: "檔案特徵與宣告類型不符。", selectFirst: "請先選擇任務。", maxAssets: "此任務已有 10 個啟用素材。", uploading: "上傳中…", uploadFailed: "上傳失敗。", uploaded: "素材已上傳。", active: "啟用", inactive: "停用", replace: "替換", deactivate: "停用", delete: "刪除", deleteConfirm: "永久刪除此素材？", errorPrefix: "錯誤：{detail}", unknownError: "發生問題，請再試一次。",
});
export function detectLanguage(value = globalThis.navigator?.language) { return TC_REGIONS.test(value || "") ? "tc" : "en"; }
export function getLanguage(storage = globalThis.localStorage) { const v = storage?.getItem(LANGUAGE_KEY); return v === "tc" || v === "en" ? v : detectLanguage(); }
export function t(key, vars = {}) { let s = messages[getLanguage()]?.[key] || messages.en[key] || key; return Object.entries(vars).reduce((v, [k, x]) => v.replaceAll(`{${k}}`, x), s); }
export function applyLanguage(root = document) {
  const lang = getLanguage(); document.documentElement.lang = lang === "tc" ? "zh-Hant" : "en";
  root.querySelectorAll("[data-i18n]").forEach((el) => el.textContent = messages[lang][el.dataset.i18n] || messages.en[el.dataset.i18n]);
  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => el.placeholder = messages[lang][el.dataset.i18nPlaceholder] || messages.en[el.dataset.i18nPlaceholder]);
  root.querySelectorAll("[data-lang]").forEach((el) => { el.setAttribute("aria-pressed", String(el.dataset.lang === lang)); });
  document.dispatchEvent(new CustomEvent("kol:language", { detail: lang }));
}
export function setupLanguageSwitcher() {
  document.querySelectorAll("[data-lang]").forEach((el) => el.addEventListener("click", () => { localStorage.setItem(LANGUAGE_KEY, el.dataset.lang); applyLanguage(); }));
  applyLanguage();
}
