# Notes: The `--rm` Flag — Automatic Container Cleanup

## The Problem It Solves

As you work with Docker, stopped containers accumulate and clutter your system. Manually cleaning them up with `docker rm` is cumbersome. The `--rm` flag solves this by **automatically removing the container when it stops**.

---

## The `--rm` Flag

```bash
docker run --rm <image_id>
```

- **Automatically removes the container when it exits/stops**
- No manual cleanup needed
- Container won't appear in `docker ps -a` after stopping

---

## Practical Example

```bash
# Run with --rm, detached mode, and port publishing
docker run -d -p 3000:80 --rm <image_id>

# Verify it's running
docker ps
# CONTAINER ID   IMAGE      STATUS        NAMES
# abc123         def456     Up 2 min      friendly_name

# Use the application
# Visit localhost:3000 — works!

# Stop the container
docker stop friendly_name

# Check all containers
docker ps -a
# Container is NOT listed — it was automatically removed! ✅
```

### Without `--rm` (old behavior)

```bash
docker run -d -p 3000:80 <image_id>
docker stop <container_name>
docker ps -a
# Container IS still listed (status: Exited) ❌
# Must manually run: docker rm <container_name>
```

---

## When to Use `--rm`

| Scenario | Use `--rm`? | Reason |
|----------|-------------|--------|
| **Development web servers** | ✅ Yes | You'll rebuild the image on code changes anyway, so no need to keep old containers |
| **One-off utility scripts** | ✅ Yes | Script runs, produces output, done — no need to keep the container |
| **Testing/experimenting** | ✅ Yes | Keeps your system clean during experimentation |
| **Containers you plan to restart** | ❌ No | You need the container to exist to restart it with `docker start` |
| **Debugging crashed containers** | ❌ No | You might want to inspect logs or state of stopped containers |

### The Key Insight

> For applications like web servers, you typically **don't restart** stopped containers. When code changes, you **rebuild the image** and start a **new container**. So the old container is useless — `--rm` makes perfect sense here.

---

## Common Combined Flags

```bash
# Most common for web servers during development
docker run -d -p 3000:80 --rm <image_id>
#          │  │           │
#          │  │           └── Auto-remove when stopped
#          │  └────────────── Publish port
#          └───────────────── Detached mode

# Interactive utility app with auto-cleanup
docker run -it --rm <image_id>
#          │   │
#          │   └── Auto-remove when script finishes
#          └────── Interactive + TTY

# Full example with name
docker run -d -p 3000:80 --rm --name myapp <image_id>
```

---

## Important Note: `--rm` and `docker start`

```bash
# With --rm, once stopped, the container is GONE
docker run --rm --name myapp <image_id>
docker stop myapp
docker start myapp    # ❌ ERROR — container no longer exists!

# Without --rm, you CAN restart
docker run --name myapp <image_id>
docker stop myapp
docker start myapp    # ✅ Works — container still exists
```

**Trade-off:**
- `--rm` = clean system, but can't restart
- No `--rm` = can restart, but must clean up manually

---

## Visual Comparison

```
WITHOUT --rm:
  docker run → Container Created → Running → docker stop → Stopped (still exists)
                                                              │
                                                    docker ps -a shows it
                                                              │
                                                    Must manually: docker rm

WITH --rm:
  docker run → Container Created → Running → docker stop → REMOVED (gone)
                                                              │
                                                    docker ps -a does NOT show it
                                                              │
                                                    Nothing to clean up ✅
```

---

## Discovering `--rm` and Other Options

```bash
docker run --help
```

Shows ALL available options including:
- `-d` / `--detach` — Run in background
- `-p` / `--publish` — Map ports
- `--rm` — Auto-remove on exit
- `--name` — Assign custom name
- `-it` — Interactive + TTY
- `-e` — Environment variables
- `-v` — Volumes
- And many more...

> **Tip:** The vast majority of these options you'll never need. But when you do need something specific, `--help` is the fastest way to find it.

---

# Spring Boot Equivalent

## Typical Development Workflow with `--rm`

```bash
# Build the image
mvn clean package -DskipTests
docker build -t myspringapp:1.0 .

# Run with auto-cleanup
docker run -d -p 8080:8080 --rm --name myapp myspringapp:1.0

# Use the application at localhost:8080

# When done or code changed — just stop (container auto-removes)
docker stop myapp

# Verify it's gone
docker ps -a    # myapp is NOT listed

# After code changes: rebuild and run fresh
mvn clean package -DskipTests
docker build -t myspringapp:1.1 .
docker run -d -p 8080:8080 --rm --name myapp myspringapp:1.1
```

## Spring Boot Development Cycle with `--rm`

```
Edit Code → mvn package → docker build → docker run --rm → Test → docker stop → (auto-removed)
    ↑                                                                                    │
    └────────────────────────────────────────────────────────────────────────────────────┘
                                    Repeat cycle
```

## Interactive Spring Boot CLI App with `--rm`

```bash
# Run once, auto-clean
docker run -it --rm mycliapp:1.0
# Enter input, get output, container exits and is REMOVED automatically

docker ps -a    # Nothing there — clean!
```

## Common Spring Boot Run Commands

```bash
# Development: detached + port + auto-remove + named
docker run -d -p 8080:8080 --rm --name dev-app myspringapp:1.0

# With environment variables
docker run -d -p 8080:8080 --rm --name dev-app \
  -e SPRING_PROFILES_ACTIVE=dev \
  -e SPRING_DATASOURCE_URL=jdbc:mysql://host:3306/db \
  myspringapp:1.0

# With debug port exposed
docker run -d -p 8080:8080 -p 5005:5005 --rm --name debug-app \
  -e JAVA_TOOL_OPTIONS="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005" \
  myspringapp:1.0
```

---

## Key Takeaways

1. **`--rm` auto-removes containers when they stop** — no manual cleanup needed
2. **Use it for development web servers** — you'll rebuild images on code changes anyway
3. **Use it for one-off scripts** — run, get output, container disappears
4. **Don't use it if you plan to restart** — the container won't exist after stopping
5. **Combine with `-d` and `-p`** for the most common development setup
6. **`docker run --help`** reveals all available options — most you'll never need