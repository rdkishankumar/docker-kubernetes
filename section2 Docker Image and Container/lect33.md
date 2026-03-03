# Notes: Managing & Removing Images and Containers

## Why Clean Up?

As you work with Docker, you accumulate:
- **Stopped containers** that are no longer needed
- **Old images** from previous builds
- These take up disk space and clutter your lists

Regular cleanup keeps your Docker environment manageable.

---

## Managing Containers

### Listing Containers

```bash
docker ps          # Running containers only
docker ps -a       # ALL containers (running + stopped)
```

### Removing Containers

```bash
# Remove a single stopped container
docker rm <container_name>

# Remove multiple containers at once (space-separated)
docker rm <name1> <name2> <name3> <name4>
```

### Important Rules

| Rule | Explanation |
|------|-------------|
| **Cannot remove running containers** | You get an error if you try |
| **Must stop first, then remove** | `docker stop` → then `docker rm` |
| **Can remove multiple at once** | Separate names/IDs with spaces |

### Workflow: Stop → Remove

```bash
# Step 1: See what's running
docker ps

# Step 2: Stop running containers
docker stop <container1> <container2>

# Step 3: See all containers (including stopped)
docker ps -a

# Step 4: Remove stopped containers
docker rm <container1> <container2> <container3>

# Step 5: Verify clean list
docker ps -a    # Should be empty or much shorter
```

### The Problem with Manual Removal

Manually copying container names and running `docker rm` is **cumbersome**. A more elegant automatic approach exists (covered next — `--rm` flag).

---

## Managing Images

### Listing Images

```bash
docker images
```

Output shows:
| Column | Meaning |
|--------|---------|
| REPOSITORY | Image name (e.g., `node`, `python`) |
| TAG | Version tag (e.g., `latest`) |
| IMAGE ID | Unique identifier |
| CREATED | When the image was created |
| SIZE | Disk space occupied |

### Understanding Image Sizes

```
┌─────────────────────────────────┐
│  Your Custom Image (~920MB)     │
│  ┌───────────────────────────┐  │
│  │ Your code + node_modules  │  │  ← Tiny extra size
│  │ (~few MB)                 │  │
│  ├───────────────────────────┤  │
│  │ Node.js Image (~910MB)    │  │
│  │ ┌───────────────────────┐ │  │
│  │ │ Node.js runtime       │ │  │  ← Node tools
│  │ ├───────────────────────┤ │  │
│  │ │ Linux OS layer        │ │  │  ← Base operating system
│  │ └───────────────────────┘ │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

The majority of your custom image's size comes from the **base image** (runtime + OS layer), not your application code.

---

### Removing Images

```bash
# Remove a single image by ID
docker rmi <image_id>

# Remove multiple images at once (space-separated)
docker rmi <image_id_1> <image_id_2> <image_id_3>
```

**What happens:** Deletes the image and all its layers.

### Important Rules for Image Removal

| Rule | Explanation |
|------|-------------|
| **Cannot remove images used by ANY container** | Even stopped containers prevent removal |
| **Remove containers first** | Both running AND stopped containers must be removed before the image can be deleted |
| **Running container** | Image can't be removed |
| **Stopped container** | Image STILL can't be removed |
| **No container exists** | Image CAN be removed |

```
Container exists (running or stopped) → Image CANNOT be removed ❌
Container removed                     → Image CAN be removed ✅
```

### Pruning Unused Images

```bash
docker image prune
```

- Removes **all unused images** (images not referenced by any container)
- Useful for bulk cleanup
- Be careful — this can remove many images at once

---

## Complete Cleanup Commands Summary

| Action | Command |
|--------|---------|
| List running containers | `docker ps` |
| List all containers | `docker ps -a` |
| Stop a container | `docker stop <name>` |
| Stop multiple containers | `docker stop <name1> <name2>` |
| Remove a stopped container | `docker rm <name>` |
| Remove multiple containers | `docker rm <name1> <name2> <name3>` |
| Remove all stopped containers | `docker container prune` |
| List all images | `docker images` |
| Remove an image | `docker rmi <image_id>` |
| Remove multiple images | `docker rmi <id1> <id2> <id3>` |
| Remove all unused images | `docker image prune` |

---

## Dependency Chain for Removal

```
To remove an IMAGE:
  1. Stop ALL containers using it     → docker stop <name>
  2. Remove ALL containers using it   → docker rm <name>
  3. THEN remove the image            → docker rmi <image_id>

Shortcut for containers:
  docker container prune    → removes all stopped containers

Shortcut for images:
  docker image prune        → removes all unused images

Nuclear option:
  docker system prune       → removes all unused containers, images, networks, and cache
```

---

# Spring Boot Equivalent

## Typical Spring Boot Cleanup Workflow

```bash
# Check what's running
docker ps

# Stop Spring Boot containers
docker stop my-spring-app-1 my-spring-app-2

# See all containers
docker ps -a

# Remove stopped containers
docker rm my-spring-app-1 my-spring-app-2

# List images
docker images
# REPOSITORY       TAG     IMAGE ID       SIZE
# myspringapp      2.0     abc123         320MB
# myspringapp      1.0     def456         318MB
# eclipse-temurin  17-jre  ghi789         275MB

# Remove old version
docker rmi def456

# Or remove by name:tag
docker rmi myspringapp:1.0

# Prune all unused
docker image prune
```

### Understanding Spring Boot Image Sizes

```
┌──────────────────────────────────┐
│  Your Spring Boot Image (~320MB) │
│  ┌────────────────────────────┐  │
│  │ Your JAR (~40MB)           │  │  ← Application + dependencies
│  ├────────────────────────────┤  │
│  │ Eclipse Temurin JRE (~275MB│  │
│  │ ┌──────────────────────┐   │  │
│  │ │ Java Runtime         │   │  │  ← JRE tools
│  │ ├──────────────────────┤   │  │
│  │ │ Linux OS layer       │   │  │  ← Base OS
│  │ └──────────────────────┘   │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### Full Cleanup Script

```bash
# Stop all running containers
docker stop $(docker ps -q)

# Remove all stopped containers
docker container prune -f

# Remove all unused images
docker image prune -a -f

# Or nuclear option: remove everything unused
docker system prune -a -f

# Verify
docker ps -a        # Should be empty
docker images       # Should be minimal
```

### Spring Boot Build Cleanup

```bash
# After multiple builds, you accumulate many images
docker images
# myspringapp   <none>   old_id_1   500MB   (dangling/untagged)
# myspringapp   <none>   old_id_2   500MB   (dangling/untagged)
# myspringapp   1.0      latest_id  320MB   (current)

# Remove dangling images (untagged, leftover from rebuilds)
docker image prune -f

# Remove specific old versions
docker rmi myspringapp:0.9 myspringapp:0.8
```

---

## Key Takeaways

1. **Containers accumulate** — clean up regularly with `docker rm` or `docker container prune`
2. **Images accumulate** — clean up with `docker rmi` or `docker image prune`
3. **Cannot remove running containers** — stop first, then remove
4. **Cannot remove images with existing containers** — remove containers first (even stopped ones)
5. **Manual cleanup is cumbersome** — automatic removal (`--rm` flag) is coming next
6. **Image size = your code + base image** — base images (OS + runtime) make up most of the size
7. **`docker system prune`** is the nuclear option for full cleanup