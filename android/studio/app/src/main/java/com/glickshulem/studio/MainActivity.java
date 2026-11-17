package com.glickshulem.studio;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

// Development shell: the editor screen lives on GitHub Pages (fast updates, no reinstall).
// The heavy work (cutting, cropping, MP3) is done here on the tablet by Engine, through the "Studio" bridge.
public class MainActivity extends Activity {
    private static final String SITE = "https://glickshulem-stack.github.io/apps/";
    private static final String URL = SITE + "apps/studio/";
    private static final int PICK = 1;
    private WebView web;
    private ValueCallback<Uri[]> pending;
    private Engine engine;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        engine = new Engine(this);
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setUserAgentString(s.getUserAgentString() + " GlickApp");
        web.addJavascriptInterface(new Bridge(), "Studio");
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                return !r.getUrl().toString().startsWith(SITE);
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (pending != null) pending.onReceiveValue(null);
                pending = cb;
                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                String[] types = p.getAcceptTypes();
                if (types != null && types.length > 0 && types[0] != null && !types[0].isEmpty()) {
                    String[] list = types[0].split(",");
                    for (int k = 0; k < list.length; k++) list[k] = list[k].trim();
                    i.setType(list.length == 1 ? list[0] : "*/*");
                    if (list.length > 1) i.putExtra(Intent.EXTRA_MIME_TYPES, list);
                } else i.setType("*/*");
                try { startActivityForResult(i, PICK); } catch (Exception e) { pending = null; return false; }
                return true;
            }
        });
        if (Build.VERSION.SDK_INT < 29 && checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED)
            requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, 2);
        web.loadUrl(URL);
        setContentView(web);
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req != PICK) { super.onActivityResult(req, res, data); return; }
        Uri u = (res == RESULT_OK && data != null) ? data.getData() : null;
        if (u != null) engine.setSource(u);
        if (pending != null) pending.onReceiveValue(u == null ? null : new Uri[]{u});
        pending = null;
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }

    class Bridge {
        @JavascriptInterface public int bridge() { return 1; }
        @JavascriptInterface public String version() {
            try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionName; } catch (Exception e) { return ""; }
        }
        /** Name, size and type of the file picked last. */
        @JavascriptInterface public String source() { return engine.sourceInfo(); }
        /** Start saving: {kind:"video"|"mp3", start:ms, end:ms, crop:{l,t,r,b} (0..1, optional), name}. */
        @JavascriptInterface public String export(String json) {
            try { return engine.start(new JSONObject(json)); } catch (Exception e) { return "error: " + e.getMessage(); }
        }
        /** {state:"idle|working|done|error|cancelled", pct, msg, name, folder} */
        @JavascriptInterface public String job() { return engine.job(); }
        @JavascriptInterface public void cancel() { engine.cancel(); }
        @JavascriptInterface public void openResult() { runOnUiThread(() -> engine.openResult(MainActivity.this)); }
        @JavascriptInterface public void shareResult() { runOnUiThread(() -> engine.shareResult(MainActivity.this)); }
    }
}
