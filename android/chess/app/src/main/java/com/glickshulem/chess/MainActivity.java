package com.glickshulem.chess;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

// Development shell: loads the live game from GitHub Pages, so pushes show up on next open.
public class MainActivity extends Activity {
    private static final String URL = "https://glickshulem-stack.github.io/apps/apps/chess/";
    private WebView web;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setUserAgentString(s.getUserAgentString() + " GlickApp");
        web.setWebViewClient(new WebViewClient());
        web.loadUrl(URL);
        setContentView(web);
    }
}
