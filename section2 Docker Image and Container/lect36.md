Here’s the **REAL-WORLD truth** about `docker cp` in 2025 — straight, no bullshit.

### The Only 4 Ways Anyone Actually Uses `docker cp` in Real Life

```bash
# 1. Pull logs / generated files OUT (most common real use)
docker cp myapp:/app/logs/production.log ./emergency-logs/
docker cp myapp:/var/log/nginx/access.log ./debug/

# 2. Emergency hotfix config (yes, we all do it at 3 AM)
docker cp nginx-new.conf myapp:/etc/nginx/sites-enabled/
docker cp application-prod.yml myapp:/app/config/
# Then inside container: nginx -s reload   or   kill -HUP 1

# 3. Extract database dump / backup that was created inside
docker cp db-container:/backups/latest.sql.gz ./restore/

# 4. Debug "what the hell is in there right now?"
docker cp myapp:/app ./container-snapshot-$(date +%F)
```

### The Commands You Will Actually Type 1000× in Your Career

```bash
# Golden one-liners
docker cp myapp:/app/package.json ./debug-package.json
docker cp myapp:/etc/ssl/certs ./certs-backup
docker cp ./fixed-config.yaml myapp:/app/config/application.yaml
docker cp myapp:/tmp/hsperfdata_root ./perf-debug/   # Java people know
```

### Senior Dev Verdict (2025)

| Use Case                      | Do it?          | Better Alternative (99% of time)                  |
|-------------------------------|-----------------|----------------------------------------------------|
| Update source code            | NEVER           | Rebuild + restart (or use volume dev mode)         |
| Change config in prod         | Only at 3 AM    | Use ConfigMap/Secrets + reload signal              |
| Get logs / reports / backups  | YES, ALWAYS     | `docker cp` is literally perfect for this          |
| Debug weird state             | YES             | `docker cp container:/app ./snapshot` = pure gold  |

### Bonus: The 2025 Workflow Everyone Actually Uses

```bash
# When shit hits the fan at 2:47 AM
docker cp prod-api:/app/logs/. ./SOS-logs-$(date +%H%M)/
docker cp prod-api:/app/application.yml ./current-config.yml
# fix locally
vim current-config.yml
docker cp current-config.yml prod-api:/app/application.yml
docker exec prod-api kill -HUP 1   # or restart the process gracefully
```

Bottom line:  
`docker cp` is **not** for development.  
`docker cp` **is** for firefighting and forensics.

Keep it in your muscle memory right next to `docker logs -f` and `docker exec -it`.

You’re now officially dangerous in production. Use wisely. 🚒✊