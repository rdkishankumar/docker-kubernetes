# Notes: Pulling & Running Shared Images

## Pulling Images from Docker Hub

Once an image is pushed to Docker Hub (or any registry), anyone can pull and use it (if public).

### Basic Pull Command

```bash
docker pull <docker_id>/<repository>:<tag>
```

**Example:**

```bash
docker pull academind/node-hello-world
```

- Uses the `latest` tag by default if no tag specified
- Downloads the image to your local machine
- **No login required** for public repositories

---

## Demonstration: Pull and Run a Shared Image

```bash
# Clean up local images first (optional, for demo)
docker image prune -a

# Log out to prove public access works
docker logout

# Pull the image (no login needed for public repos)
docker pull academind/node-hello-world

# Verify it's downloaded
docker images
# REPOSITORY                      TAG      IMAGE ID
# academind/node-hello-world      latest   abc123

# Run the pulled image
docker run -d -p 8000:80 --rm academind/node-hello-world

# Visit localhost:8000 — the app works!

# Stop when done
docker stop <container_name>
```

---

## Public vs Private Access

| Action | Public Repository | Private Repository |
|--------|-------------------|-------------------|
| **Pull** | Anyone (no login) | Only authorized users (login required) |
| **Push** | Only owner (login required) | Only authorized users (login required) |
| **Run** | Anyone | Only authorized users |

---

## Critical Behavior: `docker pull` vs `docker run`

### `docker pull` — Always Gets Latest

```bash
docker pull academind/node-hello-world
```

- **Always checks the registry** for the latest version
- **Downloads the newest image** if it has changed
- Use this to ensure you have the most up-to-date version

### `docker run` — Does NOT Auto-Update

```bash
docker run academind/node-hello-world
```

**Two scenarios:**

| Scenario | Behavior |
|----------|----------|
| **Image does NOT exist locally** | Automatically pulls from registry (like `docker pull` + `docker run`) |
| **Image DOES exist locally** | Uses the local version — **does NOT check for updates** |

---

## The Update Problem

### Timeline Example

```
Day 1: You pull and run the image
  docker pull academind/node-hello-world    ← Gets v1
  docker run academind/node-hello-world     ← Runs v1

Day 2: Image owner pushes an update (v2)
  (on Docker Hub, the image is now v2)

Day 3: You run again
  docker run academind/node-hello-world     ← Still runs v1 (local)! ❌
  
  # You're NOT getting the updated v2 automatically
```

### The Solution: Pull Before Run

```bash
# Always pull first to ensure latest version
docker pull academind/node-hello-world

# Then run
docker run academind/node-hello-world
```

---

## Visual: Pull vs Run Behavior

```
SCENARIO 1: Image NOT on local machine
┌──────────────┐
│ docker run   │ ──→ Image not found locally
└──────────────┘              │
                              ▼
                    ┌──────────────────┐
                    │ Auto-pull from   │
                    │ Docker Hub       │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Run container    │
                    │ (latest version) │
                    └──────────────────┘


SCENARIO 2: Image EXISTS on local machine
┌──────────────┐
│ docker run   │ ──→ Image found locally
└──────────────┘              │
                              ▼
                    ┌──────────────────┐
                    │ Use local image  │  ← May be outdated!
                    │ (no update check)│
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Run container    │
                    │ (possibly old)   │
                    └──────────────────┘


SOLUTION: Always pull first
┌──────────────┐     ┌──────────────┐
│ docker pull  │ ──→ │ Gets latest  │
└──────────────┘     │ from Hub     │
                     └──────────────┘
                              │
                              ▼
┌──────────────┐     ┌──────────────────┐
│ docker run   │ ──→ │ Run container    │
└──────────────┘     │ (guaranteed new) │
                     └──────────────────┘
```

---

## Best Practices for Using Shared Images

### For Development/Testing

```bash
# Always pull first to get latest
docker pull academind/node-hello-world:latest
docker run -d -p 3000:80 --rm academind/node-hello-world:latest
```

### For Production (Use Specific Tags)

```bash
# Use specific version tags, not :latest
docker pull academind/node-hello-world:1.0
docker run -d -p 3000:80 academind/node-hello-world:1.0
```

**Why specific tags for production?**
- `:latest` can change unexpectedly
- Specific versions (`:1.0`, `:2.0`) are predictable
- Easier to rollback if issues occur

---

## Running Shared Images

### Full Command with Common Options

```bash
docker run -d -p 8000:80 --rm academind/node-hello-world
#          │  │           │   │
#          │  │           │   └── Full image name (required)
#          │  │           └────── Auto-remove on stop
#          │  └────────────────── Port mapping
#          └───────────────────── Detached mode
```

### Important: Use Full Image Name

```bash
# CORRECT — includes docker_id/
docker run academind/node-hello-world

# WRONG — Docker will look for a local image called "node-hello-world"
docker run node-hello-world
```

---

## Complete Sharing Workflow

### Publisher (You)

```bash
# Build
docker build -t myusername/myapp:1.0 .

# Login
docker login

# Push
docker push myusername/myapp:1.0
```

### Consumer (Team Member / Server / Anyone)

```bash
# Pull latest
docker pull myusername/myapp:1.0

# Run
docker run -d -p 3000:80 --rm myusername/myapp:1.0
```

### When Publisher Updates

```bash
# Publisher: rebuild and push
docker build -t myusername/myapp:1.1 .
docker push myusername/myapp:1.1

# Consumer: must explicitly pull new version
docker pull myusername/myapp:1.1
docker run -d -p 3000:80 --rm myusername/myapp:1.1
```

---

# Spring Boot Equivalent

## Pull and Run Spring Boot Image

```bash
# Pull the image
docker pull yourusername/spring-order-service:1.0

# Run it
docker run -d -p 8080:8080 --rm yourusername/spring-order-service:1.0

# Access at localhost:8080
```

## Team Workflow

### Developer A (Publisher)

```bash
# Build and push
mvn clean package -DskipTests
docker build -t companyname/order-service:1.0 .
docker login
docker push companyname/order-service:1.0
```

### Developer B (Consumer)

```bash
# Pull and run (no source code needed!)
docker pull companyname/order-service:1.0
docker run -d -p 8080:8080 companyname/order-service:1.0

# Test the API
curl localhost:8080/api/orders
```

### Ensuring Latest Version

```bash
# Before running, always pull to get updates
docker pull companyname/order-service:1.0

# Then run
docker run -d -p 8080:8080 --rm companyname/order-service:1.0
```

## CI/CD Pipeline Pattern

```bash
# CI/CD pulls latest, runs tests, deploys
docker pull companyname/order-service:latest
docker stop order-service-container || true
docker rm order-service-container || true
docker run -d -p 8080:8080 --name order-service-container companyname/order-service:latest
```

---

## Quick Reference

| Action | Command |
|--------|---------|
| Pull image (latest) | `docker pull username/repo` |
| Pull specific tag | `docker pull username/repo:1.0` |
| Run pulled image | `docker run username/repo:1.0` |
| Pull + Run (if not local) | `docker run username/repo` (auto-pulls if missing) |
| Force update | `docker pull username/repo` then `docker run ...` |
| List local images | `docker images` |
| Remove all unused images | `docker image prune -a` |

---

## Key Takeaways

1. **Anyone can pull public images** — no login required
2. **Pushing requires login** — only repository owners can push
3. **Use full image name** — `username/repository:tag`
4. **`docker pull` always gets latest** — checks registry every time
5. **`docker run` does NOT auto-update** — uses local copy if available
6. **Always pull before run** to ensure you have the latest version
7. **Use specific tags for production** — avoid surprises from `:latest` changes
8. **Sharing images is cleaner than sharing Dockerfiles** — consumers don't need source code