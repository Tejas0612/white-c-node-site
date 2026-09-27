# Project working rules

- Before making major changes, create and verify a timestamped local backup of the current project, including uncommitted files, local data, configuration, and Git history. This is an explicit user requirement.
- Store backups in `.backups/`, keep them out of Git and public assets, and restrict permissions because they can contain secrets. Exclude dependencies and regenerable build caches.
- Preserve existing backups. Report the backup location before proceeding with major changes. Never treat a Git commit alone as a backup of untracked files or local configuration.
