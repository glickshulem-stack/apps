package com.glickshulem.studio;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.media.MediaCodec;
import android.media.MediaExtractor;
import android.media.MediaFormat;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.provider.OpenableColumns;

import androidx.media3.common.Effect;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MimeTypes;
import androidx.media3.common.audio.AudioProcessor;
import androidx.media3.effect.Crop;
import androidx.media3.transformer.Composition;
import androidx.media3.transformer.EditedMediaItem;
import androidx.media3.transformer.Effects;
import androidx.media3.transformer.ExportException;
import androidx.media3.transformer.ExportResult;
import androidx.media3.transformer.ProgressHolder;
import androidx.media3.transformer.Transformer;

import org.json.JSONObject;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;
import java.nio.ShortBuffer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/** Does the saving: cut (and crop) a video with Media3 Transformer, or turn its sound into an MP3. */
final class Engine {
    private final Context ctx;
    private final Handler main = new Handler(Looper.getMainLooper());
    private Uri source;
    private String sourceName = "video";

    private volatile String state = "idle", msg = "", outName = "", outFolder = "", outMime = "";
    private volatile int pct = 0;
    private volatile boolean cancelled = false;
    private volatile Uri result;
    private Transformer transformer;

    Engine(Context c) { ctx = c.getApplicationContext(); }

    void setSource(Uri u) {
        source = u;
        sourceName = "video";
        try (Cursor c = ctx.getContentResolver().query(u, null, null, null, null)) {
            if (c != null && c.moveToFirst()) {
                int i = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (i >= 0 && c.getString(i) != null) sourceName = c.getString(i);
            }
        } catch (Exception ignored) { }
    }

    String sourceInfo() {
        try {
            JSONObject o = new JSONObject();
            o.put("ok", source != null);
            o.put("name", sourceName);
            if (source != null) o.put("type", ctx.getContentResolver().getType(source));
            return o.toString();
        } catch (Exception e) { return "{}"; }
    }

    synchronized String job() {
        try {
            JSONObject o = new JSONObject();
            o.put("state", state); o.put("pct", pct); o.put("msg", msg);
            o.put("name", outName); o.put("folder", outFolder);
            return o.toString();
        } catch (Exception e) { return "{}"; }
    }

    private synchronized void set(String s, int p, String m) { state = s; pct = p; msg = m; }

    String start(JSONObject o) {
        if (source == null) return "error: Open a video first.";
        if ("working".equals(state)) return "error: Still saving the last one.";
        String kind = o.optString("kind", "video");
        long startMs = Math.max(0, o.optLong("start", 0));
        long endMs = o.optLong("end", 0);
        String base = cleanName(o.optString("name", stripExt(sourceName)));
        String folder = cleanName(o.optString("folder", "Studio"));
        cancelled = false; result = null;
        set("working", 0, "Starting…");
        if ("mp3".equals(kind)) {
            outMime = "audio/mpeg"; outName = base + ".mp3"; outFolder = Environment.DIRECTORY_MUSIC + "/" + folder;
            new Thread(() -> makeMp3(startMs, endMs), "mp3").start();
        } else {
            outMime = "video/mp4"; outName = base + ".mp4"; outFolder = Environment.DIRECTORY_MOVIES + "/" + folder;
            JSONObject crop = o.optJSONObject("crop");
            main.post(() -> makeVideo(startMs, endMs, crop));
        }
        return "ok";
    }

    void cancel() {
        cancelled = true;
        main.post(() -> { if (transformer != null) { transformer.cancel(); transformer = null; set("cancelled", 0, "Stopped."); } });
    }

    // ---------- video: Media3 Transformer (uses the tablet's video chip, so big files are fine) ----------

    private void makeVideo(long startMs, long endMs, JSONObject crop) {
        final File tmp = new File(ctx.getCacheDir(), "out.mp4");
        tmp.delete();
        MediaItem.ClippingConfiguration.Builder clip = new MediaItem.ClippingConfiguration.Builder().setStartPositionMs(startMs);
        if (endMs > startMs) clip.setEndPositionMs(endMs);
        MediaItem item = new MediaItem.Builder().setUri(source).setClippingConfiguration(clip.build()).build();
        List<Effect> video = new ArrayList<>();
        if (crop != null) {
            // Page gives fractions of the picture (0..1, from top-left). Media3 wants -1..1 with up = +1.
            float l = (float) crop.optDouble("l", 0), t = (float) crop.optDouble("t", 0);
            float r = (float) crop.optDouble("r", 1), b = (float) crop.optDouble("b", 1);
            video.add(new Crop(l * 2 - 1, r * 2 - 1, 1 - b * 2, 1 - t * 2));
        }
        EditedMediaItem edited = new EditedMediaItem.Builder(item)
                .setEffects(new Effects(Collections.<AudioProcessor>emptyList(), video)).build();
        transformer = new Transformer.Builder(ctx)
                .setVideoMimeType(MimeTypes.VIDEO_H264)
                .setAudioMimeType(MimeTypes.AUDIO_AAC)
                .addListener(new Transformer.Listener() {
                    @Override public void onCompleted(Composition c, ExportResult r) {
                        transformer = null;
                        new Thread(() -> publish(tmp), "save").start();
                    }
                    @Override public void onError(Composition c, ExportResult r, ExportException e) {
                        transformer = null;
                        tmp.delete();
                        set("error", 0, "Could not save the video (" + e.getErrorCodeName() + ").");
                    }
                }).build();
        set("working", 0, "Making your video…");
        transformer.start(edited, tmp.getAbsolutePath());
        final ProgressHolder ph = new ProgressHolder();
        main.postDelayed(new Runnable() {
            @Override public void run() {
                Transformer t = transformer;
                if (t == null) return;
                if (t.getProgress(ph) == Transformer.PROGRESS_STATE_AVAILABLE) set("working", Math.min(98, ph.progress), "Making your video…");
                main.postDelayed(this, 400);
            }
        }, 400);
    }

    // ---------- MP3: decode the sound track, keep only the chosen part, encode with LAME ----------

    private void makeMp3(long startMs, long endMs) {
        File tmp = new File(ctx.getCacheDir(), "out.mp3");
        MediaExtractor ex = new MediaExtractor();
        MediaCodec dec = null;
        try (OutputStream os = new BufferedOutputStream(new FileOutputStream(tmp), 1 << 16)) {
            ex.setDataSource(ctx, source, null);
            int track = -1;
            MediaFormat fmt = null;
            for (int i = 0; i < ex.getTrackCount(); i++) {
                MediaFormat f = ex.getTrackFormat(i);
                String m = f.getString(MediaFormat.KEY_MIME);
                if (m != null && m.startsWith("audio/")) { track = i; fmt = f; break; }
            }
            if (track < 0) { set("error", 0, "This video has no sound to turn into MP3."); return; }
            long durUs = fmt.containsKey(MediaFormat.KEY_DURATION) ? fmt.getLong(MediaFormat.KEY_DURATION) : 0;
            long startUs = startMs * 1000, endUs = endMs > startMs ? endMs * 1000 : (durUs > 0 ? durUs : Long.MAX_VALUE);
            long spanUs = Math.max(1, (endUs == Long.MAX_VALUE ? durUs : endUs) - startUs);
            ex.selectTrack(track);
            ex.seekTo(startUs, MediaExtractor.SEEK_TO_PREVIOUS_SYNC);
            dec = MediaCodec.createDecoderByType(fmt.getString(MediaFormat.KEY_MIME));
            dec.configure(fmt, null, null, 0);
            dec.start();

            MediaCodec.BufferInfo info = new MediaCodec.BufferInfo();
            boolean inDone = false, outDone = false;
            int rate = fmt.getInteger(MediaFormat.KEY_SAMPLE_RATE), ch = fmt.getInteger(MediaFormat.KEY_CHANNEL_COUNT), enc = 2;
            Mp3Encoder mp3 = null;
            int[] left = new int[0], right = new int[0];
            set("working", 0, "Making your MP3…");
            while (!outDone) {
                if (cancelled) { set("cancelled", 0, "Stopped."); tmp.delete(); return; }
                if (!inDone) {
                    int ii = dec.dequeueInputBuffer(10000);
                    if (ii >= 0) {
                        ByteBuffer ib = dec.getInputBuffer(ii);
                        int n = ib == null ? -1 : ex.readSampleData(ib, 0);
                        long t = ex.getSampleTime();
                        if (n < 0 || t > endUs) {
                            dec.queueInputBuffer(ii, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM);
                            inDone = true;
                        } else {
                            dec.queueInputBuffer(ii, 0, n, t, 0);
                            ex.advance();
                        }
                    }
                }
                int oi = dec.dequeueOutputBuffer(info, 10000);
                if (oi == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                    MediaFormat of = dec.getOutputFormat();
                    rate = of.getInteger(MediaFormat.KEY_SAMPLE_RATE);
                    ch = of.getInteger(MediaFormat.KEY_CHANNEL_COUNT);
                    enc = of.containsKey("pcm-encoding") ? of.getInteger("pcm-encoding") : 2;
                } else if (oi >= 0) {
                    if ((info.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) outDone = true;
                    ByteBuffer ob = dec.getOutputBuffer(oi);
                    if (ob != null && info.size > 0) {
                        if (mp3 == null) mp3 = new Mp3Encoder(rate, ch == 1 ? 1 : 2, 192, os);
                        int bps = enc == 4 ? 4 : 2;
                        int frames = info.size / (bps * ch);
                        ob.position(info.offset); ob.limit(info.offset + info.size);
                        ob = ob.slice().order(ByteOrder.nativeOrder());
                        // keep only frames inside [start, end)
                        long t0 = info.presentationTimeUs;
                        int from = (int) Math.max(0, Math.min(frames, Math.ceil((startUs - t0) * (double) rate / 1e6)));
                        int to = (int) Math.max(0, Math.min(frames, Math.ceil((endUs - t0) * (double) rate / 1e6)));
                        if (endUs == Long.MAX_VALUE) to = frames;
                        int count = to - from;
                        if (count > 0) {
                            if (left.length < count) { left = new int[count]; right = new int[count]; }
                            if (bps == 2) {
                                ShortBuffer sb = ob.asShortBuffer();
                                for (int f = 0; f < count; f++) {
                                    int base = (from + f) * ch;
                                    left[f] = sb.get(base) << 16;
                                    right[f] = ch > 1 ? sb.get(base + 1) << 16 : left[f];
                                }
                            } else {
                                FloatBuffer fb = ob.asFloatBuffer();
                                for (int f = 0; f < count; f++) {
                                    int base = (from + f) * ch;
                                    left[f] = toInt(fb.get(base));
                                    right[f] = ch > 1 ? toInt(fb.get(base + 1)) : left[f];
                                }
                            }
                            mp3.encode(left, ch == 1 ? left : right, count);
                        }
                        long done = t0 + (long) (frames * 1e6 / rate) - startUs;
                        set("working", (int) Math.max(0, Math.min(98, done * 100 / spanUs)), "Making your MP3…");
                        if (t0 >= endUs) outDone = true;
                    }
                    dec.releaseOutputBuffer(oi, false);
                }
            }
            if (mp3 == null) { set("error", 0, "No sound found in the part you picked."); tmp.delete(); return; }
            mp3.finish();
        } catch (Exception e) {
            tmp.delete();
            set("error", 0, "Could not make the MP3 (" + e.getMessage() + ").");
            return;
        } finally {
            try { if (dec != null) { dec.stop(); dec.release(); } } catch (Exception ignored) { }
            ex.release();
        }
        publish(tmp);
    }

    private static int toInt(float v) {
        if (v > 1f) v = 1f; else if (v < -1f) v = -1f;
        return ((int) (v * 32767f)) << 16;
    }

    // ---------- put the finished file in Movies/… or Music/… so Gallery and music apps see it ----------

    private void publish(File tmp) {
        if (cancelled) { tmp.delete(); set("cancelled", 0, "Stopped."); return; }
        set("working", 99, "Saving to your tablet…");
        try {
            boolean audio = outMime.startsWith("audio");
            if (Build.VERSION.SDK_INT >= 29) {
                ContentResolver cr = ctx.getContentResolver();
                Uri coll = audio ? MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                                 : MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
                ContentValues v = new ContentValues();
                v.put(MediaStore.MediaColumns.DISPLAY_NAME, outName);
                v.put(MediaStore.MediaColumns.MIME_TYPE, outMime);
                v.put(MediaStore.MediaColumns.RELATIVE_PATH, outFolder);
                v.put(MediaStore.MediaColumns.IS_PENDING, 1);
                Uri u = cr.insert(coll, v);
                if (u == null) throw new Exception("no space");
                try (InputStream in = new FileInputStream(tmp); OutputStream out = cr.openOutputStream(u)) { copy(in, out); }
                v.clear();
                v.put(MediaStore.MediaColumns.IS_PENDING, 0);
                cr.update(u, v, null, null);
                try (Cursor c = cr.query(u, new String[]{MediaStore.MediaColumns.DISPLAY_NAME}, null, null, null)) {
                    if (c != null && c.moveToFirst()) outName = c.getString(0);
                } catch (Exception ignored) { }
                result = u;
            } else {
                File dir = new File(Environment.getExternalStorageDirectory(), outFolder);
                dir.mkdirs();
                File f = new File(dir, outName);
                for (int k = 1; f.exists(); k++) f = new File(dir, stripExt(outName) + " (" + k + ")" + (audio ? ".mp3" : ".mp4"));
                outName = f.getName();
                try (InputStream in = new FileInputStream(tmp); OutputStream out = new FileOutputStream(f)) { copy(in, out); }
                MediaScannerConnection.scanFile(ctx, new String[]{f.getAbsolutePath()}, new String[]{outMime}, (p, u) -> result = u);
            }
            set("done", 100, "Saved.");
        } catch (Exception e) {
            set("error", 0, "Could not save to the tablet (" + e.getMessage() + ").");
        } finally {
            tmp.delete();
        }
    }

    void openResult(Activity a) {
        if (result == null) return;
        Intent i = new Intent(Intent.ACTION_VIEW).setDataAndType(result, outMime).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try { a.startActivity(i); } catch (Exception ignored) { }
    }

    void shareResult(Activity a) {
        if (result == null) return;
        Intent i = new Intent(Intent.ACTION_SEND).setType(outMime).putExtra(Intent.EXTRA_STREAM, result).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try { a.startActivity(Intent.createChooser(i, "Share")); } catch (Exception ignored) { }
    }

    private static void copy(InputStream in, OutputStream out) throws Exception {
        byte[] b = new byte[1 << 16];
        for (int n; (n = in.read(b)) > 0; ) out.write(b, 0, n);
    }

    private static String stripExt(String n) { int d = n.lastIndexOf('.'); return d > 0 ? n.substring(0, d) : n; }

    private static String cleanName(String n) {
        String s = n.replaceAll("[\\\\/:*?\"<>|]", "").trim();
        return s.isEmpty() ? "video" : (s.length() > 80 ? s.substring(0, 80) : s);
    }
}
