package com.glickshulem.chess;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

// Whole package: Gambit's screens are inside this APK (copied from apps/chess/ at build time).
// New versions arrive as a new APK that Play Hub installs.
public class MainActivity extends Activity {
    private WebView web;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setUserAgentString(s.getUserAgentString() + " GlickApp");
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                return LocalFiles.serve(MainActivity.this, r.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                if (!LocalFiles.ours(r.getUrl())) return true;
                // The ‹ "back to apps" link: close this app (Play Hub or the home screen is underneath).
                String path = r.getUrl().getPath();
                if (path == null || !path.startsWith("/web/")) { finish(); return true; }
                return false;
            }
        });
        web.loadUrl(LocalFiles.START);
        setContentView(web);
    }

    @Override
    public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }
}
