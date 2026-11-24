package com.glickshulem.studio;

import android.content.Context;
import android.net.Uri;
import android.webkit.WebResourceResponse;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/** Whole package: the app's screens are inside the APK (assets/web/) and are served to the WebView from
 *  https://appassets.androidplatform.net/web/ so everything (the chess engine's worker too) works like a website, offline. */
final class LocalFiles {
    static final String HOST = "appassets.androidplatform.net";
    static final String START = "https://" + HOST + "/web/index.html";
    private static final Map<String, String> TYPES = new HashMap<>();
    static {
        TYPES.put("html", "text/html"); TYPES.put("js", "text/javascript"); TYPES.put("css", "text/css");
        TYPES.put("svg", "image/svg+xml"); TYPES.put("png", "image/png"); TYPES.put("jpg", "image/jpeg");
        TYPES.put("jpeg", "image/jpeg"); TYPES.put("webp", "image/webp"); TYPES.put("json", "application/json");
        TYPES.put("wasm", "application/wasm"); TYPES.put("txt", "text/plain"); TYPES.put("woff2", "font/woff2");
        TYPES.put("mp3", "audio/mpeg"); TYPES.put("webmanifest", "application/manifest+json");
    }

    static boolean ours(Uri u) { return u != null && HOST.equals(u.getHost()); }

    /** The file for a request to our host, or null to let the WebView handle it (e.g. Google Fonts). */
    static WebResourceResponse serve(Context c, Uri u) {
        if (!ours(u)) return null;
        String path = u.getPath() == null ? "" : u.getPath();
        if (path.startsWith("/")) path = path.substring(1);
        if (path.isEmpty() || path.endsWith("/")) path += "index.html";
        if (path.contains("..")) return notFound();
        try {
            InputStream in = c.getAssets().open(path);
            String ext = path.substring(path.lastIndexOf('.') + 1).toLowerCase();
            String type = TYPES.containsKey(ext) ? TYPES.get(ext) : "application/octet-stream";
            boolean text = type.startsWith("text/") || type.endsWith("javascript") || type.endsWith("json") || type.endsWith("xml");
            WebResourceResponse r = new WebResourceResponse(type, text ? "utf-8" : null, in);
            Map<String, String> h = new HashMap<>();
            h.put("Access-Control-Allow-Origin", "*");
            h.put("Cache-Control", "no-cache");
            r.setResponseHeaders(h);
            return r;
        } catch (Exception e) {
            return notFound();
        }
    }

    private static WebResourceResponse notFound() {
        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", new HashMap<>(), new java.io.ByteArrayInputStream(new byte[0]));
    }
}
