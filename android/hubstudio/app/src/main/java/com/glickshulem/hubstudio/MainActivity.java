package com.glickshulem.hubstudio;

import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.provider.MediaStore;
import android.app.PendingIntent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageInstaller;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceError;
import android.webkit.WebResourceResponse;
import android.database.Cursor;
import android.provider.OpenableColumns;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.FileInputStream;
import java.io.OutputStream;
import java.lang.ref.WeakReference;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class MainActivity extends Activity {
    private static final String SITE = "https://glickshulem-stack.github.io/apps/";
    private WebView web;
    /** The open Studio screen, so install results (which arrive in InstallResult) can reach the page. */
    static WeakReference<MainActivity> current = new WeakReference<>(null);

    /** One running download per app. Lives as long as App Hub's process, so the page can reload without losing it. */
    static class Job {
        volatile String version, state = "downloading", error = "";
        volatile long done, total;
        volatile boolean cancel;
    }
    private static final Map<String, Job> jobs = new ConcurrentHashMap<>();
    /** App whose install is waiting for the "Install unknown apps" permission. */
    private static String waitingForPermission = null;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        current = new WeakReference<>(this);
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        web.addJavascriptInterface(new Bridge(), "Hub");
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                // Only our own pages load inside Studio (they can use the install bridge).
                // Other links (like GitHub's "make a key" page) open in the tablet's browser.
                if (r.getUrl().toString().startsWith(SITE)) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, r.getUrl())); } catch (Exception e) { }
                return true;
            }
            // The page reads an APK that was opened with / shared to Studio from this made-up address.
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                Uri u = incoming;
                if (u == null || !r.getUrl().toString().startsWith(SITE + "studio/__incoming/")) return null;
                try {
                    WebResourceResponse res = new WebResourceResponse("application/vnd.android.package-archive", null, getContentResolver().openInputStream(u));
                    java.util.Map<String, String> h = new java.util.HashMap<>(); h.put("Access-Control-Allow-Origin", "*");
                    res.setResponseHeaders(h);
                    return res;
                } catch (Exception e) { return null; }
            }
            @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (r.isForMainFrame()) v.loadUrl("file:///android_asset/index.html");
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            // File picker for the Studio page: app files (APKs), and in Messages photos, any file, or the camera (Studio app 0.6.0).
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (picking != null) picking.onReceiveValue(null);
                picking = cb; shot = null;
                String type = "*/*";
                if (p != null && p.getAcceptTypes() != null && p.getAcceptTypes().length > 0 && p.getAcceptTypes()[0] != null && !p.getAcceptTypes()[0].isEmpty()
                    && p.getAcceptTypes()[0].startsWith("image")) type = "image/*";
                try {
                    if (p != null && p.isCaptureEnabled()) {   // "Take photo": open the camera, it saves into our cache
                        File dir = new File(getCacheDir(), "camera"); dir.mkdirs();
                        File[] old = dir.listFiles(); if (old != null) for (File f : old) f.delete();
                        File f = new File(dir, "shot-" + System.currentTimeMillis() + ".jpg");
                        shot = FileProvider.getUriForFile(MainActivity.this, "com.glickshulem.hubstudio.files", f); shotFile = f;
                        Intent c = new Intent(MediaStore.ACTION_IMAGE_CAPTURE).putExtra(MediaStore.EXTRA_OUTPUT, shot)
                            .addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        startActivityForResult(c, PICK);
                        return true;
                    }
                    Intent i = new Intent(Intent.ACTION_GET_CONTENT).addCategory(Intent.CATEGORY_OPENABLE).setType(type);
                    if (p != null && p.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                    startActivityForResult(Intent.createChooser(i, type.startsWith("image") ? "Choose a photo" : "Choose a file"), PICK);
                } catch (Exception e) { picking = null; shot = null; cb.onReceiveValue(null); return false; }
                return true;
            }
        });
        takeIncoming(getIntent());
        pendingOpen = getIntent() == null ? null : getIntent().getStringExtra("open");
        web.loadUrl(SITE + "studio/");
        setContentView(web);
    }

    /** A tapped notification ("open" extra: "chat:<uid>", "chat" or "people") waits here until the page asks for it. */
    static volatile String pendingOpen = null;
    private void takeOpen(Intent i) {
        String o = i == null ? null : i.getStringExtra("open");
        if (o == null) return;
        pendingOpen = o;
        if (web != null) web.evaluateJavascript("window.onNotice && onNotice()", null);
    }

    @Override
    protected void onPause() { super.onPause(); Notifier.visible = false; }

    @Override
    protected void onResume() {
        super.onResume();
        Notifier.visible = true;
        if (web != null) web.evaluateJavascript("window.onHubResume && onHubResume()", null);
        // Came back from the "allow installs" screen: carry on with the install if it is now allowed.
        if (waitingForPermission != null && canInstall()) {
            String id = waitingForPermission; waitingForPermission = null;
            new Thread(() -> openInstaller(id)).start();   // copying a big app into the installer must not freeze the screen
        }
        if (web != null) web.evaluateJavascript("window.refresh && refresh()", null);
    }

    /** APK handed to Studio by "Open with" or "Share", waiting for the page to pick it up. */
    private volatile Uri incoming; private volatile String incomingName; private volatile boolean incomingNew;

    private void takeIncoming(Intent i) {
        if (i == null) return;
        Uri u = null;
        if (Intent.ACTION_VIEW.equals(i.getAction())) u = i.getData();
        else if (Intent.ACTION_SEND.equals(i.getAction())) u = i.getParcelableExtra(Intent.EXTRA_STREAM);
        if (u == null) return;
        String name = "app.apk";
        try (Cursor c = getContentResolver().query(u, new String[]{ OpenableColumns.DISPLAY_NAME }, null, null, null)) {
            if (c != null && c.moveToFirst() && c.getString(0) != null) name = c.getString(0);
        } catch (Exception e) { }
        incoming = u; incomingName = name; incomingNew = true;
    }

    @Override
    protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        takeOpen(i);
        takeIncoming(i);
        if (web != null && incomingNew) web.evaluateJavascript("window.onIncoming && onIncoming()", null);
    }

    private static final int PICK = 41;
    private ValueCallback<Uri[]> picking;
    private Uri shot; private File shotFile;   // camera photo being taken

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req != PICK || picking == null) { super.onActivityResult(req, res, data); return; }
        Uri[] out = null;
        if (shot != null) { if (res == RESULT_OK && shotFile != null && shotFile.length() > 0) out = new Uri[]{ shot }; }
        else if (res == RESULT_OK && data != null) {
            ClipData c = data.getClipData();
            if (c != null && c.getItemCount() > 0) { out = new Uri[c.getItemCount()]; for (int k = 0; k < out.length; k++) out[k] = c.getItemAt(k).getUri(); }
            else if (data.getData() != null) out = new Uri[]{ data.getData() };
        }
        picking.onReceiveValue(out);
        picking = null; shot = null;
    }

    @Override
    public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }

    private void js(String code) { runOnUiThread(() -> web.evaluateJavascript(code, null)); }

    // ---- kept downloads: files/apks/<id>-<version>.apk (finished) and .part (unfinished, resumed next time) ----
    private File dir() { File d = new File(getFilesDir(), "apks"); d.mkdirs(); return d; }
    private File apk(String id, String ver) { return new File(dir(), id + "-" + ver + ".apk"); }
    private File part(String id, String ver) { return new File(dir(), id + "-" + ver + ".part"); }

    /** Finished, valid download for this app that is newer than what is installed, or null. Old leftovers are deleted. */
    private File readyFile(String id) {
        File[] fs = dir().listFiles();
        if (fs == null) return null;
        File best = null;
        for (File f : fs) {
            String n = f.getName();
            if (!n.startsWith(id + "-") || !n.endsWith(".apk")) continue;
            PackageInfo a = getPackageManager().getPackageArchiveInfo(f.getPath(), 0);
            if (a == null) { f.delete(); continue; }                      // broken file
            long have = installedCode(a.packageName);
            if (have >= code(a)) { f.delete(); continue; }                  // already installed: no longer needed
            best = f;
        }
        return best;
    }
    private void forgetOthers(String id, String keepVer) {
        File[] fs = dir().listFiles();
        if (fs == null) return;
        for (File f : fs) {
            String n = f.getName();
            if (n.startsWith(id + "-") && !n.equals(id + "-" + keepVer + ".apk") && !n.equals(id + "-" + keepVer + ".part")) f.delete();
        }
    }
    private static long code(PackageInfo p) { return Build.VERSION.SDK_INT >= 28 ? p.getLongVersionCode() : p.versionCode; }
    private long installedCode(String pkg) {
        try { return code(getPackageManager().getPackageInfo(pkg, 0)); }
        catch (PackageManager.NameNotFoundException e) { return -1; }
    }
    private boolean canInstall() { return Build.VERSION.SDK_INT < 26 || getPackageManager().canRequestPackageInstalls(); }

    /** Install the kept file. App Vault hands it to Android's package installer itself (like a store does).
     *  On Android 12+ it asks for no confirm tap when App Vault is the app's installer (or the app is App Vault itself);
     *  otherwise Android shows its usual Install screen once. If anything goes wrong, fall back to the classic Install screen. */
    private void openInstaller(String id) {
        File f = readyFile(id);
        if (f == null) { js("window.hubEvent && hubEvent(" + q(id) + ",'missing')"); return; }
        if (!canInstall()) { classicInstall(id); return; }
        try { sessionInstall(id, f); }
        catch (Exception e) { classicInstall(id); }
    }

    private void sessionInstall(String id, File f) throws Exception {
        PackageInfo info = getPackageManager().getPackageArchiveInfo(f.getPath(), 0);
        if (info == null) throw new Exception("broken");
        PackageInstaller pi = getPackageManager().getPackageInstaller();
        PackageInstaller.SessionParams sp = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
        sp.setAppPackageName(info.packageName);
        sp.setSize(f.length());
        if (Build.VERSION.SDK_INT >= 31) sp.setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_NOT_REQUIRED);
        int sid = pi.createSession(sp);
        PackageInstaller.Session session = pi.openSession(sid);
        try {
            js("window.hubEvent && hubEvent(" + q(id) + ",'installing')");
            try (FileInputStream in = new FileInputStream(f); OutputStream out = session.openWrite("base.apk", 0, f.length())) {
                byte[] buf = new byte[65536]; int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                session.fsync(out);
            }
            Intent cb = new Intent(this, InstallResult.class).putExtra("id", id);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
            PendingIntent done = PendingIntent.getBroadcast(this, sid, cb, flags);
            session.commit(done.getIntentSender());
        } catch (Exception e) {
            session.abandon();
            throw e;
        } finally {
            session.close();
        }
    }

    /** Called by InstallResult with what Android said about an install. */
    void installResult(String id, int status, Intent confirm) {
        if (status == PackageInstaller.STATUS_PENDING_USER_ACTION && confirm != null) {
            // Android wants one tap this time (e.g. the app was first put on by something else): show its Install screen.
            js("window.hubEvent && hubEvent(" + q(id) + ",'installer')");
            confirm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            runOnUiThread(() -> startActivity(confirm));
        } else if (status == PackageInstaller.STATUS_SUCCESS) {
            readyFile(id);   // removes the kept file now that it is installed
            js("window.hubEvent && hubEvent(" + q(id) + ",'installed')");
        } else if (status == PackageInstaller.STATUS_FAILURE_ABORTED) {
            js("window.hubEvent && hubEvent(" + q(id) + ",'back')");
        } else {
            js("window.hubEvent && hubEvent(" + q(id) + ",'failed')");
        }
    }

    /** The classic way: open Android's Install screen for the kept file (always one confirm tap). */
    private void classicInstall(String id) {
        File f = readyFile(id);
        if (f == null) { js("window.hubEvent && hubEvent(" + q(id) + ",'missing')"); return; }
        if (!canInstall()) {
            waitingForPermission = id;
            js("window.hubEvent && hubEvent(" + q(id) + ",'permission')");
            runOnUiThread(() -> startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName()))));
            return;
        }
        Uri uri = FileProvider.getUriForFile(this, "com.glickshulem.hubstudio.files", f);
        Intent i = new Intent(Intent.ACTION_VIEW);
        i.setDataAndType(uri, "application/vnd.android.package-archive");
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        js("window.hubEvent && hubEvent(" + q(id) + ",'installer')");
        runOnUiThread(() -> startActivity(i));
    }

    private void download(String id, String url, String ver, boolean thenInstall) {
        Job running = jobs.get(id);
        if (running != null && "downloading".equals(running.state)) return;   // already on its way
        Job j = new Job(); j.version = ver; jobs.put(id, j);
        new Thread(() -> {
            try {
                forgetOthers(id, ver);
                File p = part(id, ver);
                for (int attempt = 0; ; attempt++) {
                    try { fetch(url, p, j); break; }
                    catch (Exception e) { if (j.cancel || attempt >= 2) throw e; Thread.sleep(2000); }  // short hiccup: try again by itself
                }
                File f = apk(id, ver);
                if (!p.renameTo(f)) throw new Exception("save");
                if (getPackageManager().getPackageArchiveInfo(f.getPath(), 0) == null) { f.delete(); throw new Exception("broken"); }
                j.state = "ready";
                if (thenInstall) openInstaller(id);
            } catch (Exception e) {
                j.state = j.cancel ? "cancelled" : "failed";
                j.error = String.valueOf(e.getMessage());
                if (j.cancel) part(id, ver).delete();
            }
            js("window.refresh && refresh()");
        }).start();
    }

    /** Download url into p, continuing from where an earlier try stopped. */
    private void fetch(String url, File p, Job j) throws Exception {
        long have = p.exists() ? p.length() : 0;
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setInstanceFollowRedirects(true);
        c.setConnectTimeout(20000); c.setReadTimeout(30000);
        if (have > 0) c.setRequestProperty("Range", "bytes=" + have + "-");
        int rc = c.getResponseCode();
        if (rc == 416) { c.disconnect(); p.delete(); have = 0; c = (HttpURLConnection) new URL(url).openConnection(); c.setInstanceFollowRedirects(true); rc = c.getResponseCode(); }
        if (rc != 200 && rc != 206) throw new Exception("HTTP " + rc);
        boolean append = rc == 206;
        if (!append) have = 0;
        long len = c.getContentLengthLong();
        j.total = len > 0 ? have + len : 0;
        j.done = have;
        try (InputStream in = c.getInputStream(); FileOutputStream out = new FileOutputStream(p, append)) {
            byte[] buf = new byte[65536]; int n;
            while ((n = in.read(buf)) > 0) {
                if (j.cancel) throw new Exception("cancelled");
                out.write(buf, 0, n); j.done += n;
            }
        }
        if (j.total > 0 && j.done < j.total) throw new Exception("cut off");
    }

    class Bridge {
        // Notifications (Studio app 0.7.0 / App Vault app 0.14.0): the page hands over its sign-in so Notifier can check every ~5 minutes.
        @JavascriptInterface public void notifySetup(String apiKey, String refresh, String uid, String mode) { Notifier.setup(MainActivity.this, apiKey, refresh, uid, mode); }
        @JavascriptInterface public void notifyStop() { Notifier.stop(MainActivity.this); }
        @JavascriptInterface public boolean notifyAllowed() {
            android.app.NotificationManager nm = (android.app.NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            return nm != null && nm.areNotificationsEnabled();
        }
        @JavascriptInterface public void askNotify() {
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED)
                    requestPermissions(new String[]{ "android.permission.POST_NOTIFICATIONS" }, 52);
                else try {
                    if (Build.VERSION.SDK_INT >= 26) startActivity(new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, getPackageName()));
                    else startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName())));
                } catch (Exception e) { }
            });
        }
        @JavascriptInterface public String takeOpen() { String o = pendingOpen; pendingOpen = null; return o == null ? "" : o; }
        /** Android's share menu with a text/link. */
        @JavascriptInterface public void share(String title, String text) {
            Intent i = new Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text).putExtra(Intent.EXTRA_SUBJECT, title);
            runOnUiThread(() -> { try { startActivity(Intent.createChooser(i, title)); } catch (Exception e) { } });
        }
        /** Download a file (e.g. the App Vault APK) and open Android's share menu with it, so Quick Share, Bluetooth,
         *  WhatsApp, Gmail, Drive… can send the file itself. The page hears back through shareReady(ok). */
        @JavascriptInterface public void shareFile(String url, String name, String text) {
            new Thread(() -> {
                try {
                    File d = new File(getCacheDir(), "apks"); d.mkdirs();
                    File f = new File(d, name.replaceAll("[^A-Za-z0-9._-]", ""));
                    HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                    c.setInstanceFollowRedirects(true); c.setConnectTimeout(20000); c.setReadTimeout(30000);
                    if (c.getResponseCode() != 200) throw new Exception("HTTP " + c.getResponseCode());
                    try (InputStream in = c.getInputStream(); FileOutputStream out = new FileOutputStream(f)) {
                        byte[] buf = new byte[65536]; int n;
                        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                    }
                    Uri u = FileProvider.getUriForFile(MainActivity.this, "com.glickshulem.hubstudio.files", f);
                    Intent i = new Intent(Intent.ACTION_SEND).setType("application/vnd.android.package-archive")
                        .putExtra(Intent.EXTRA_STREAM, u).putExtra(Intent.EXTRA_TEXT, text)
                        .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    i.setClipData(android.content.ClipData.newRawUri("", u));
                    Intent ch = Intent.createChooser(i, "Share App Vault").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    runOnUiThread(() -> startActivity(ch));
                    js("window.shareReady && shareReady(true)");
                } catch (Exception e) {
                    js("window.shareReady && shareReady(false)");
                }
            }).start();
        }
        /** {"name","url"} of an APK opened with / shared to Studio that the page has not taken yet, or "". */
        @JavascriptInterface public String incoming() {
            if (!incomingNew || incoming == null) return "";
            incomingNew = false;
            return "{\"name\":" + jq(incomingName) + ",\"url\":" + jq(SITE + "studio/__incoming/" + System.currentTimeMillis() + ".apk") + "}";
        }
        @JavascriptInterface public String hubVersion() { return installedVersion(getPackageName()); }
        @JavascriptInterface public String installedVersion(String pkg) {
            try { return getPackageManager().getPackageInfo(pkg, 0).versionName; }
            catch (PackageManager.NameNotFoundException e) { return ""; }
        }
        @JavascriptInterface public void open(String pkg) {
            Intent i = getPackageManager().getLaunchIntentForPackage(pkg);
            if (i != null) startActivity(i);
        }
        /** Bridge level, so the page knows which features this App Hub has. 2 = kept downloads + progress. */
        @JavascriptInterface public int bridge() { return 5; }   // 5 = notifications (notifySetup/notifyStop/notifyAllowed/askNotify/takeOpen); 4 = camera in the Messages picker (Studio app 0.6.0); 3 = installs by itself (hubEvent 'installing' / 'installed' / 'failed')
        /** Start (or continue) downloading; opens the installer when finished. */
        @JavascriptInterface public void download(String id, String url, String ver) { MainActivity.this.download(id, url, ver, true); }
        /** Open the installer for a download that is already kept. */
        @JavascriptInterface public void installKept(String id) { new Thread(() -> openInstaller(id)).start(); }
        @JavascriptInterface public void cancel(String id) { Job j = jobs.get(id); if (j != null) j.cancel = true; }
        /** Version of a finished download kept for this app, or "". */
        @JavascriptInterface public String kept(String id) {
            File f = readyFile(id);
            if (f == null) return "";
            String n = f.getName();
            return n.substring(id.length() + 1, n.length() - 4);
        }
        /** {"state":"downloading|ready|failed|cancelled","version","done","total"} for the latest download of this app, or "". */
        @JavascriptInterface public String job(String id) {
            Job j = jobs.get(id);
            if (j == null) return "";
            return "{\"state\":\"" + j.state + "\",\"version\":" + jq(j.version) + ",\"done\":" + j.done + ",\"total\":" + j.total + "}";
        }
        @JavascriptInterface public void clearJob(String id) { Job j = jobs.get(id); if (j != null && !"downloading".equals(j.state)) jobs.remove(id); }

        /** Old App Hub pages call this: download then install, same as download(). */
        @JavascriptInterface public void install(String id, String url) {
            String ver = url.replaceAll(".*/" + java.util.regex.Pattern.quote(id) + "-v([^/]+)/.*", "$1");
            MainActivity.this.download(id, url, ver, true);
        }
    }

    private static String q(String s) { return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"; }
    private static String jq(String s) { return "\"" + (s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\"")) + "\""; }
}
