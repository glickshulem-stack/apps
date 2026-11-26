package com.glickshulem.hubstudio;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.SystemClock;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Notifications without paid push (Su, 2026-11-25): every ~5 minutes Android wakes this receiver, which asks the
 * Firestore database (with the same sign-in as the page) for new things and shows a notification for each new one.
 * Studio ("su"): new messages, join requests and Beta requests. App Vault ("user"): new replies from the developer.
 * Android may stretch the 5 minutes when the device is asleep (battery saving). Nothing shows while the app is open.
 */
public class Notifier extends BroadcastReceiver {
    static final String PROJECT = "app-vault-962b9";
    static final String SITE = "https://glickshulem-stack.github.io/";
    static final long EVERY = 5 * 60 * 1000L;
    static volatile boolean visible = false;   // the app is on screen: the page shows things itself

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences("notify", Context.MODE_PRIVATE); }

    /** Called by the page after sign-in. mode = "su" (Studio) or "user" (App Vault). */
    static void setup(Context c, String apiKey, String refresh, String uid, String mode) {
        SharedPreferences p = prefs(c);
        boolean changed = !uid.equals(p.getString("uid", "")) || !mode.equals(p.getString("mode", ""));
        SharedPreferences.Editor e = p.edit().putString("key", apiKey).putString("refresh", refresh).putString("uid", uid).putString("mode", mode)
            .remove("idToken").putLong("idUntil", 0);
        if (changed) e.putStringSet("done", new HashSet<>()).putBoolean("primed", false);   // first poll only remembers what is already there
        e.apply();
        schedule(c, 60 * 1000L);
    }
    static void stop(Context c) {
        prefs(c).edit().clear().apply();
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(alarm(c));
    }
    static PendingIntent alarm(Context c) {
        return PendingIntent.getBroadcast(c, 7, new Intent(c, Notifier.class).setAction("com.glickshulem.hubstudio.POLL"), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
    static void schedule(Context c, long delay) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE); if (am == null) return;
        long at = SystemClock.elapsedRealtime() + delay;
        if (Build.VERSION.SDK_INT >= 23) am.setAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, at, alarm(c));
        else am.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, at, alarm(c));
    }

    @Override public void onReceive(Context c, Intent i) {
        final Context app = c.getApplicationContext();
        if (prefs(app).getString("refresh", "").isEmpty()) return;   // not signed in: nothing to check
        if (!"com.glickshulem.hubstudio.POLL".equals(i.getAction())) { schedule(app, 60 * 1000L); return; }   // phone restarted or app updated
        final PendingResult done = goAsync();
        new Thread(() -> {
            try { poll(app); } catch (Exception e) { }
            finally { schedule(app, EVERY); done.finish(); }
        }).start();
    }

    // ---------- what is new ----------
    static class Item { String key, title, text, open; Item(String k, String t, String x, String o) { key = k; title = t; text = x; open = o; } }

    static void poll(Context c) throws Exception {
        SharedPreferences p = prefs(c);
        String token = idToken(c); if (token == null) return;
        String mode = p.getString("mode", ""), uid = p.getString("uid", "");
        List<Item> now = new ArrayList<>();
        if ("su".equals(mode)) {
            for (JSONObject d : query(token, "", "reports", "status", "new")) {
                JSONObject f = d.optJSONObject("fields"); if (f == null) continue;
                String last = ts(f, "lastAt"); if (last.isEmpty()) last = ts(f, "created");
                String seen = ts(f, "suSeenAt");
                if (!seen.isEmpty() && seen.compareTo(last) >= 0) continue;   // Su already opened this chat
                String id = id(d), text = str(f, "text");
                JSONObject m = latestMsg(token, id);
                if (m != null && "user".equals(str(m, "from"))) text = str(m, "text");
                now.add(new Item("r:" + id + ":" + last, str(f, "name"), text, "chat:" + str(f, "uid")));
            }
            for (JSONObject d : query(token, "", "members", "status", "pending")) {
                JSONObject f = d.optJSONObject("fields"); if (f == null) continue;
                String note = str(f, "note");
                now.add(new Item("j:" + id(d), "Wants to join App Vault", str(f, "name") + (note.isEmpty() ? "" : ": " + note), "people"));
            }
            for (JSONObject d : query(token, "", "members", "beta", "asked")) {
                JSONObject f = d.optJSONObject("fields"); if (f == null) continue;
                now.add(new Item("b:" + id(d), "Wants to join Beta", str(f, "name"), "people"));
            }
        } else {
            for (JSONObject d : query(token, "", "reports", "uid", uid)) {
                JSONObject f = d.optJSONObject("fields"); if (f == null) continue;
                JSONObject u = f.optJSONObject("userUnread");
                if (u == null || !u.optBoolean("booleanValue", false)) continue;
                String id = id(d), last = ts(f, "lastAt");
                JSONObject m = latestMsg(token, id);
                if (m == null || !"su".equals(str(m, "from"))) continue;
                now.add(new Item("m:" + id + ":" + last, "Reply from the developer", str(m, "text"), "chat"));
            }
        }
        Set<String> old = p.getStringSet("done", new HashSet<>()), keep = new HashSet<>();
        boolean primed = p.getBoolean("primed", false);
        for (Item it : now) {
            keep.add(it.key);
            if (old.contains(it.key)) continue;
            if (primed && !visible) show(c, it);
        }
        p.edit().putStringSet("done", keep).putBoolean("primed", true).apply();
    }

    static void show(Context c, Item it) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE); if (nm == null) return;
        if (Build.VERSION.SDK_INT >= 26) nm.createNotificationChannel(new NotificationChannel("messages", "Messages", NotificationManager.IMPORTANCE_HIGH));
        Intent open = new Intent(c, MainActivity.class).putExtra("open", it.open).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(c, it.key.hashCode(), open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        String text = it.text.length() > 140 ? it.text.substring(0, 140) + "…" : it.text;
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, "messages") : new Notification.Builder(c);
        b.setSmallIcon(android.R.drawable.stat_notify_chat).setContentTitle(it.title).setContentText(text)
            .setStyle(new Notification.BigTextStyle().bigText(text)).setAutoCancel(true).setContentIntent(pi).setWhen(System.currentTimeMillis()).setShowWhen(true);
        try { nm.notify(it.key.hashCode(), b.build()); } catch (SecurityException e) { }   // notifications not allowed
    }

    // ---------- Firestore over the web (same rules as the page) ----------
    static String idToken(Context c) throws Exception {
        SharedPreferences p = prefs(c);
        String t = p.getString("idToken", "");
        if (!t.isEmpty() && System.currentTimeMillis() < p.getLong("idUntil", 0)) return t;
        String body = "grant_type=refresh_token&refresh_token=" + URLEncoder.encode(p.getString("refresh", ""), "UTF-8");
        JSONObject r = new JSONObject(http("https://securetoken.googleapis.com/v1/token?key=" + p.getString("key", ""), "POST", null, "application/x-www-form-urlencoded", body));
        t = r.optString("id_token", "");
        if (t.isEmpty()) return null;
        long secs = 3000; try { secs = Long.parseLong(r.optString("expires_in", "3600")) - 300; } catch (Exception e) { }
        p.edit().putString("idToken", t).putLong("idUntil", System.currentTimeMillis() + secs * 1000).putString("refresh", r.optString("refresh_token", p.getString("refresh", ""))).apply();
        return t;
    }
    static List<JSONObject> query(String token, String parent, String col, String field, String value) throws Exception {
        JSONObject q = new JSONObject()
            .put("from", new JSONArray().put(new JSONObject().put("collectionId", col)))
            .put("where", new JSONObject().put("fieldFilter", new JSONObject()
                .put("field", new JSONObject().put("fieldPath", field)).put("op", "EQUAL").put("value", new JSONObject().put("stringValue", value))))
            .put("limit", 50);
        return run(token, parent, q);
    }
    static JSONObject latestMsg(String token, String reportId) throws Exception {
        JSONObject q = new JSONObject()
            .put("from", new JSONArray().put(new JSONObject().put("collectionId", "msgs")))
            .put("orderBy", new JSONArray().put(new JSONObject().put("field", new JSONObject().put("fieldPath", "created")).put("direction", "DESCENDING")))
            .put("limit", 1);
        List<JSONObject> r = run(token, "/reports/" + reportId, q);
        return r.isEmpty() ? null : r.get(0).optJSONObject("fields");
    }
    static List<JSONObject> run(String token, String parent, JSONObject q) throws Exception {
        String url = "https://firestore.googleapis.com/v1/projects/" + PROJECT + "/databases/(default)/documents" + parent + ":runQuery";
        JSONArray a = new JSONArray(http(url, "POST", token, "application/json", new JSONObject().put("structuredQuery", q).toString()));
        List<JSONObject> out = new ArrayList<>();
        for (int k = 0; k < a.length(); k++) { JSONObject d = a.getJSONObject(k).optJSONObject("document"); if (d != null) out.add(d); }
        return out;
    }
    static String id(JSONObject d) { String n = d.optString("name", ""); return n.substring(n.lastIndexOf('/') + 1); }
    static String str(JSONObject f, String k) { JSONObject v = f.optJSONObject(k); return v == null ? "" : v.optString("stringValue", ""); }
    /** "2026-11-25T21:05:18" (seconds are enough to compare) */
    static String ts(JSONObject f, String k) { JSONObject v = f.optJSONObject(k); String s = v == null ? "" : v.optString("timestampValue", ""); return s.length() >= 19 ? s.substring(0, 19) : s; }

    static String http(String url, String method, String token, String type, String body) throws Exception {
        HttpURLConnection h = (HttpURLConnection) new URL(url).openConnection();
        h.setConnectTimeout(8000); h.setReadTimeout(8000); h.setRequestMethod(method);
        h.setRequestProperty("Referer", SITE);   // the web key may only work for our site
        if (token != null) h.setRequestProperty("Authorization", "Bearer " + token);
        if (body != null) { h.setDoOutput(true); h.setRequestProperty("Content-Type", type); try (OutputStream o = h.getOutputStream()) { o.write(body.getBytes("UTF-8")); } }
        int code = h.getResponseCode();
        InputStream in = code < 400 ? h.getInputStream() : h.getErrorStream();
        ByteArrayOutputStream out = new ByteArrayOutputStream(); byte[] buf = new byte[8192]; int n;
        if (in != null) { while ((n = in.read(buf)) > 0) out.write(buf, 0, n); in.close(); }
        String s = out.toString("UTF-8");
        if (code >= 400) throw new Exception("HTTP " + code + " " + s);
        return s;
    }
}
