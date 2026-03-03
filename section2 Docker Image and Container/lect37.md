# Notes: Copying Files with `docker cp` & Naming/Tagging Images and Containers
# docker run -p 3000:80 -d --rm --name my-js-app goals:latest
---

# Part 1: Copying Files — `docker cp`

## What It Does

The `docker cp` command copies files or folders:
- **INTO** a running container (from local machine)
- **OUT OF** a running container (to local machine)

This lets you interact with a container's filesystem without rebuilding the image or restarting the container.

---

## Syntax

```bash
# Copy INTO a container
docker cp <source_path> <container_name>:<destination_path>

# Copy OUT OF a container
docker cp <container_name>:<source_path> <destination_path>
```

---

## Practical Examples

### Setup: Local Folder Structure

```
project/
├── dummy/
│   └── test.txt    # Contains "hello"
├── server.js
└── Dockerfile
```

### Copy a Folder INTO a Container

```bash
# Copy everything in dummy/ into /test folder inside the container
docker cp dummy/. my_container:/test
```

- `dummy/.` = all contents of the dummy folder
- `my_container:/test` = destination path in the container (created if doesn't exist)

### Copy a Folder OUT OF a Container

```bash
# Copy /test folder from container to local dummy/ folder
docker cp my_container:/test dummy/
```

Result: `dummy/test/test.txt` on your local machine

### Copy a Specific File OUT OF a Container

```bash
# Copy just the test.txt file
docker cp my_container:/test/test.txt dummy/
```

Result: `dummy/test.txt` on your local machine (no nested folder)

---

## Use Cases

| Use Case | Copy Direction | Practical? |
|----------|----------------|------------|
| **Update source code** | INTO | ❌ Not recommended — error-prone, can't replace running files |
| **Add config files** | INTO | ✅ Sometimes useful for web server configs |
| **Extract log files** | OUT OF | ✅ Very useful — get logs from the container "black box" |
| **Extract generated files** | OUT OF | ✅ Useful for build artifacts, reports, etc. |
| **Debug container contents** | OUT OF | ✅ See what's actually inside the container |

### Why NOT to Use `cp` for Code Updates

```bash
# DON'T do this for updating code:
docker cp updated_server.js my_container:/app/server.js
```

**Problems:**
- Easy to forget changed files
- Can't replace currently-executing files (like `server.js`)
- Error-prone and inconsistent
- Better solutions exist (volumes — covered later)

### Good Use: Extract Logs

```bash
# Container generates log files in /app/logs
docker cp my_container:/app/logs ./local_logs/
```

Now you can analyze logs on your local machine!

---

## Visual Summary

```
LOCAL MACHINE                    CONTAINER
┌─────────────┐                 ┌─────────────┐
│ dummy/      │   docker cp →   │ /test/      │
│   test.txt  │                 │   test.txt  │
└─────────────┘                 └─────────────┘

┌─────────────┐                 ┌─────────────┐
│ local_logs/ │   ← docker cp   │ /app/logs/  │
│   app.log   │                 │   app.log   │
└─────────────┘                 └─────────────┘
```

---

# Part 2: Naming Containers

## The Problem

```bash
docker run -d -p 3000:80 <image_id>
docker ps
# NAMES: wizardly_hopper  ← Auto-generated, hard to remember
```

You have to look up and copy the name every time.

## The Solution: `--name` Flag

```bash
docker run -d -p 3000:80 --name goalsapp <image_id>
docker ps
# NAMES: goalsapp  ← Your custom name!
```

Now you can easily reference it:

```bash
docker stop goalsapp
docker start goalsapp
docker logs goalsapp
docker cp goalsapp:/app/logs ./
```

---

## Complete Example with All Common Flags

```bash
docker run -d -p 3000:80 --rm --name goalsapp <image_id>
#          │  │           │   │
#          │  │           │   └── Custom name
#          │  │           └────── Auto-remove on stop
#          │  └────────────────── Port mapping
#          └───────────────────── Detached mode
```

---

# Part 3: Naming & Tagging Images

## Image Naming Structure

```
name:tag
│    │
│    └── Specialized version/variant (optional)
└─────── General name (also called "repository")
```

### Examples

| Full Tag | Name (Repository) | Tag | Meaning |
|----------|-------------------|-----|---------|
| `node` | node | latest (implied) | Default Node.js image |
| `node:14` | node | 14 | Node.js version 14 |
| `node:18-alpine` | node | 18-alpine | Node.js 18 on lightweight Alpine Linux |
| `myapp:1.0` | myapp | 1.0 | Your app version 1.0 |
| `myapp:latest` | myapp | latest | Your app, latest version |

---

## Using Tags with Base Images

### In Dockerfile

```dockerfile
# Use a specific version of Node
FROM node:14

# Or even more specific
FROM node:18-alpine
```

### Why Use Specific Tags?

- **Reproducibility** — same image every time
- **Compatibility** — match your production environment
- **Size optimization** — `alpine` variants are smaller
- **Security** — avoid unexpected updates

---

## Tagging Your Own Images

### Syntax

```bash
docker build -t <name>:<tag> .
```

### Examples

```bash
# Name only (tag defaults to "latest")
docker build -t goalsapp .

# Name + tag
docker build -t goalsapp:latest .
docker build -t goalsapp:1.0 .
docker build -t goalsapp:v2-beta .
```

### Result

```bash
docker images
# REPOSITORY   TAG       IMAGE ID     SIZE
# goalsapp     latest    abc123       920MB
# goalsapp     1.0       def456       918MB
# node         14        ghi789       910MB
```

---

## Running with Name:Tag

```bash
# Instead of image ID
docker run -d -p 3000:80 --name mycontainer goalsapp:latest

# Or just the name (defaults to :latest)
docker run -d -p 3000:80 --name mycontainer goalsapp
```

---

## Practical Workflow

```bash
# 1. Build with a meaningful tag
docker build -t goalsapp:1.0 .

# 2. Run with a meaningful container name
docker run -d -p 3000:80 --rm --name goals-container goalsapp:1.0

# 3. All commands now use readable names
docker logs goals-container
docker stop goals-container
docker cp goals-container:/app/logs ./logs

# 4. Later, build a new version
docker build -t goalsapp:2.0 .
docker run -d -p 3000:80 --rm --name goals-container goalsapp:2.0
```

---

## Visual Summary: Tags & Names

```
IMAGE TAGS (like versions/variants):

  node ─────┬── node:latest (default)
            ├── node:14
            ├── node:18
            ├── node:18-alpine
            └── node:18-slim

  goalsapp ─┬── goalsapp:latest
            ├── goalsapp:1.0
            ├── goalsapp:2.0
            └── goalsapp:dev

CONTAINER NAMES (your choice):

  goalsapp:1.0 ──► docker run --name my-goals-app ...
                                      └── Your custom name
```

---

# Spring Boot Equivalent

## Copying Files with Spring Boot Containers

```bash
# Copy application.properties into running container
docker cp application.properties myspringapp:/app/config/

# Extract logs from Spring Boot container
docker cp myspringapp:/app/logs ./local-logs/

# Extract heap dump for analysis
docker cp myspringapp:/app/heapdump.hprof ./dumps/
```

## Naming Spring Boot Containers

```bash
docker run -d -p 8080:8080 --rm --name order-service myspringapp:1.0
docker run -d -p 8081:8080 --rm --name user-service userapp:1.0
docker run -d -p 8082:8080 --rm --name product-service productapp:1.0

# Manage by name
docker logs order-service
docker stop user-service
docker cp product-service:/app/logs ./logs/
```

## Tagging Spring Boot Images

### Build Commands

```bash
# Basic tag
docker build -t myspringapp:1.0 .

# Multiple tags for same image
docker build -t myspringapp:1.0 -t myspringapp:latest .

# With Buildpacks
mvn spring-boot:build-image -Dspring-boot.build-image.imageName=myspringapp:1.0
```

### Using Specific Base Image Tags

```dockerfile
# Specify exact JRE version
FROM eclipse-temurin:17.0.9_9-jre

# Or use a general version
FROM eclipse-temurin:17-jre

# Or use Alpine for smaller image
FROM eclipse-temurin:17-jre-alpine
```

### Full Spring Boot Workflow

```bash
# Build the JAR
mvn clean package -DskipTests

# Build Docker image with tag
docker build -t orderservice:1.0 .

# Run with named container
docker run -d -p 8080:8080 --rm --name order-api orderservice:1.0

# Check logs
docker logs order-api

# Extract logs if needed
docker cp order-api:/app/logs ./order-logs/

# Stop (auto-removes due to --rm)
docker stop order-api

# Build new version
docker build -t orderservice:1.1 .
docker run -d -p 8080:8080 --rm --name order-api orderservice:1.1
```

---

## Quick Reference

| Action | Command |
|--------|---------|
| Copy INTO container | `docker cp <local_path> <container>:<path>` |
| Copy OUT OF container | `docker cp <container>:<path> <local_path>` |
| Name a container | `docker run --name <name> ...` |
| Tag an image | `docker build -t <name>:<tag> .` |
| Run with image tag | `docker run <name>:<tag>` |
| List images with tags | `docker images` |
| Use specific base image | `FROM node:18-alpine` |

---

## Key Takeaways

1. **`docker cp`** — copies files/folders into or out of running containers
2. **Don't use `cp` for code updates** — use volumes instead (covered later)
3. **`cp` is great for extracting logs** — get data out of the container "black box"
4. **`--name`** — gives containers memorable, easy-to-use names
5. **Image tags = name:tag** — name is the group, tag is the specific version
6. **Use specific base image tags** — `node:18` instead of just `node` for reproducibility
7. **`-t` flag** — tags your own images during build
8. **Tags help manage versions** — `myapp:1.0`, `myapp:2.0`, `myapp:latest`