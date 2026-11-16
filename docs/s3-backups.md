# Private S3 backups

The daily crm-photo-backup.timer uses the existing private CRM S3 credentials. `backup_s3.py` writes only under `crm-backups/v1/`; it never changes public access or removes source media.

Each snapshot contains a consistent SQLite online backup and a manifest mapping every sync blob, published media file and project package to a SHA-256 content-addressed pool object. Evicted primary-S3 blobs are copied within S3 into the separate backup prefix. New objects receive full streamed SHA-256 readback verification before reuse is allowed. Unchanged bytes are shared across snapshots. Local staging is limited to database copies, not a multi-GB archive.

A snapshot is recoverable only when COMPLETE.json exists and matches the manifest checksum. Completion follows manifest readback and an independent database download, SHA-256 and SQLite quick_check. A failed attempt cannot publish COMPLETE or delete an older snapshot. Remote snapshots are retained without automatic deletion; configure a reviewed retention policy separately.

Restore with the same protected EnvironmentFile and CA bundle:

```
/opt/crm-photo/venv/bin/python /opt/crm-photo/server/backup_s3.py --restore SNAPSHOT_ID --destination /path/to/empty/directory
```

Never restore over live data. Restore checks paths, byte sizes, SHA-256 and SQLite integrity. Reuse the existing S3 credentials for any primary-storage records in the restored database. The restore destination must have enough space for all files. Existing local tar backups are retained until a separate verified archive migration.

Current production deployment may use the identical module in `/opt/crm-photo/backup-runtime/backup_s3.py` through the `30-s3.conf` service override, with PYTHONPATH pointing at the active server. The API is not restarted. To roll back the schedule, remove that override and daemon-reload; the earlier low-space guard remains in effect for local backups.
