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

public class MainActivity extends Activity {
    private static final String SITE = "https://glickshulem-stack.github.io/apps/";
    private WebView web;

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
        if (web != null) web.evaluateJavascript("window.refresh && refresh()", null);
    }

    @Override
    public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }

    private void js(String code) { runOnUiThread(() -> web.evaluateJavascript(code, null)); }

    class Bridge {
        @JavascriptInterface public String hubVersion() {
            return installedVersion(getPackageName());
        }
        @JavascriptInterface public String installedVersion(String pkg) {
            try {
                PackageInfo p = getPackageManager().getPackageInfo(pkg, 0);
                return p.versionName;
            } catch (PackageManager.NameNotFoundException e) { return ""; }
        }
        @JavascriptInterface public void open(String pkg) {
            Intent i = getPackageManager().getLaunchIntentForPackage(pkg);
            if (i != null) startActivity(i);
        }
        @JavascriptInterface public void install(String id, String url) {
            if (Build.VERSION.SDK_INT >= 26 && !getPackageManager().canRequestPackageInstalls()) {
                js("onStatus(" + q(id) + ", 'Allow App Hub to install apps, then tap again')");
                startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName())));
                return;
            }
            new Thread(() -> {
                try {
                    File dir = new File(getCacheDir(), "apks"); dir.mkdirs();
                    File f = new File(dir, id + ".apk");
                    HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                    c.setInstanceFollowRedirects(true);
                    int total = c.getContentLength();
                    try (InputStream in = c.getInputStream(); FileOutputStream out = new FileOutputStream(f)) {
                        byte[] buf = new byte[65536]; int n; long done = 0; int last = -1;
                        while ((n = in.read(buf)) > 0) {
                            out.write(buf, 0, n); done += n;
                            if (total > 0) { int pct = (int) (done * 100 / total); if (pct != last) { last = pct; js("onStatus(" + q(id) + ", 'Downloading " + pct + "%')"); } }
                        }
                    }
                    js("onStatus(" + q(id) + ", '')");
                    Uri uri = FileProvider.getUriForFile(MainActivity.this, "com.glickshulem.apphub.files", f);
                    Intent i = new Intent(Intent.ACTION_VIEW);
                    i.setDataAndType(uri, "application/vnd.android.package-archive");
                    i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(i);
                } catch (Exception e) {
                    js("onStatus(" + q(id) + ", 'Download failed, check internet and try again')");
                }
            }).start();
        }
    }

    private static String q(String s) { return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"; }
}
