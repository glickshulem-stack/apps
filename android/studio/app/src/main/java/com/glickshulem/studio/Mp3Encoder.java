package com.glickshulem.studio;

import de.sciss.jump3r.mp3.BitStream;
import de.sciss.jump3r.mp3.GainAnalysis;
import de.sciss.jump3r.mp3.GetAudio;
import de.sciss.jump3r.mp3.ID3Tag;
import de.sciss.jump3r.mp3.Lame;
import de.sciss.jump3r.mp3.LameGlobalFlags;
import de.sciss.jump3r.mp3.MPEGMode;
import de.sciss.jump3r.mp3.Parse;
import de.sciss.jump3r.mp3.Presets;
import de.sciss.jump3r.mp3.Quantize;
import de.sciss.jump3r.mp3.QuantizePVT;
import de.sciss.jump3r.mp3.Reservoir;
import de.sciss.jump3r.mp3.Takehiro;
import de.sciss.jump3r.mp3.VBRTag;
import de.sciss.jump3r.mp3.Version;
import de.sciss.jump3r.mpg.Common;
import de.sciss.jump3r.mpg.Interface;
import de.sciss.jump3r.mpg.MPGLib;

import java.io.IOException;
import java.io.OutputStream;

/** MP3 encoder (LAME, pure Java via jump3r). Set up by hand because jump3r's own wrapper needs javax.sound, which Android lacks. */
public final class Mp3Encoder {
    private final Lame lame = new Lame();
    private final LameGlobalFlags gfp;
    private final OutputStream out;
    private final byte[] buf = new byte[256 * 1024];

    public Mp3Encoder(int sampleRate, int channels, int kbps, OutputStream out) {
        this.out = out;
        GainAnalysis ga = new GainAnalysis(); BitStream bs = new BitStream(); Presets p = new Presets();
        QuantizePVT qupvt = new QuantizePVT(); Quantize qu = new Quantize(); VBRTag vbr = new VBRTag();
        Version ver = new Version(); ID3Tag id3 = new ID3Tag(); Reservoir rv = new Reservoir(); Takehiro tak = new Takehiro();
        Parse parse = new Parse(); MPGLib mpg = new MPGLib(); Interface intf = new Interface(); Common common = new Common();
        GetAudio gaud = new GetAudio();
        lame.setModules(ga, bs, p, qupvt, qu, vbr, ver, id3, mpg);
        bs.setModules(ga, mpg, ver, vbr);
        id3.setModules(bs, ver);
        p.setModules(lame);
        qu.setModules(bs, rv, qupvt, tak);
        qupvt.setModules(tak, rv, lame.enc.psy);
        rv.setModules(bs);
        tak.setModules(qupvt);
        vbr.setModules(lame, bs, ver);
        gaud.setModules(parse, mpg);
        parse.setModules(ver, id3, p);
        mpg.setModules(intf, common);
        intf.setModules(vbr, common);
        gfp = lame.lame_init();
        gfp.num_channels = channels;
        gfp.in_samplerate = sampleRate;
        gfp.mode = channels == 1 ? MPEGMode.MONO : MPEGMode.JOINT_STEREO;
        gfp.brate = kbps;
        gfp.quality = 5;
        id3.id3tag_init(gfp);
        gfp.write_id3tag_automatic = false;
        gfp.findReplayGain = false;
        if (lame.lame_init_params(gfp) < 0) throw new IllegalArgumentException("MP3 settings not supported");
    }

    /** Samples are 32-bit ints (16-bit value shifted left by 16). For mono pass the same array twice. */
    public void encode(int[] left, int[] right, int frames) throws IOException {
        int n = lame.lame_encode_buffer_int(gfp, left, right, frames, buf, 0, buf.length);
        if (n < 0) throw new IOException("MP3 encoder error " + n);
        if (n > 0) out.write(buf, 0, n);
    }

    public void finish() throws IOException {
        int n = lame.lame_encode_flush(gfp, buf, 0, buf.length);
        if (n > 0) out.write(buf, 0, n);
        lame.lame_close(gfp);
    }
}
