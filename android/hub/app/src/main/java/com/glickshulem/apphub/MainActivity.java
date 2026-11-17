package com.glickshulem.apphub;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceError;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class MainActivity extends Activity {
    private static final String SITE = "https://glickshulem-stack.github.io/apps/";
    private WebView web;

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
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        web.addJavascriptInterface(new Bridge(), "Hub");
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                // Only our own pages may load inside App Hub (they can use the install bridge).
                return !r.getUrl().toString().startsWith(SITE);
            }
            @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (r.isForMainFrame()) v.loadUrl("file:///android_asset/index.html");
            }
        });
        web.loadUrl(SITE + "hub/");
        setContentView(web);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.evaluateJavascript("window.onHubResume && onHubResume()", null);
        // Came back from the "allow installs" screen: carry on with the install if it is now allowed.
        if (waitingForPermission != null && canInstall()) {
            String id = waitingForPermission; waitingForPermission = null;
            openInstaller(id);
        }
        if (web != null) web.evaluateJavascript("window.refresh && refresh()", null);
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

    /** Hand the kept file to Android's installer. Android always asks for one confirm tap; a sideloaded store can't skip that. */
    private void openInstaller(String id) {
        File f = readyFile(id);
        if (f == null) { js("window.hubEvent && hubEvent(" + q(id) + ",'missing')"); return; }
        if (!canInstall()) {
            waitingForPermission = id;
            js("window.hubEvent && hubEvent(" + q(id) + ",'permission')");
            runOnUiThread(() -> startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName()))));
            return;
        }
        Uri uri = FileProvider.getUriForFile(this, "com.glickshulem.apphub.files", f);
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
        @JavascriptInterface public int bridge() { return 2; }
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
