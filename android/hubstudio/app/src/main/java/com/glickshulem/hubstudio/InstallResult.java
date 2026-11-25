package com.glickshulem.hubstudio;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInstaller;

/** Android tells App Vault here how an install went (done, needs a tap, or failed). */
public class InstallResult extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent i) {
        String id = i.getStringExtra("id");
        int status = i.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
        Intent confirm = i.getParcelableExtra(Intent.EXTRA_INTENT);
        MainActivity a = MainActivity.current.get();
        if (a != null && !a.isDestroyed()) { a.installResult(id, status, confirm); return; }
        // App Vault's screen is gone: still show Android's Install screen if it asked for a tap.
        if (status == PackageInstaller.STATUS_PENDING_USER_ACTION && confirm != null) {
            confirm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            c.startActivity(confirm);
        }
    }
}
