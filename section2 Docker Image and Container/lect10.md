

# Notes: Managing Images & Containers — Overview

## What We've Learned So Far

| Action | Command |
|--------|---------|
| Build an image | `docker build .` |
| Run a container | `docker run -p <host>:<container> <image_id>` |
| Stop a container | `docker stop <container_name>` |
| List running containers | `docker ps` |
| List all containers | `docker ps -a` |

**But there is much more we can do to configure and manage images and containers.**

---

## The Universal Help Flag

> **On ANY Docker command, you can add `--help` to see all available options.**

```bash
docker --help                  # General Docker help
docker build --help            # All options for building images
docker run --help              # All options for running containers
docker stop --help             # All options for stopping containers
docker ps --help               # All options for listing containers
docker images --help           # All options for listing images
```

**Tip:** Most options you'll never or rarely need, but `--help` is the fastest way to discover what's possible for any command.

---

## What's Coming: Topics to Explore

### Image Management

| Topic | Description |
|-------|-------------|
| **Tagging/Naming** | Assign meaningful names and versions to images instead of using auto-generated IDs |
| **Listing** | View all images created in the past |
| **Analyzing/Inspecting** | Examine image details, layers, configuration |
| **Removing/Clearing** | Delete images you no longer need to free disk space |

### Container Management

| Topic | Description |
|-------|-------------|
| **Naming** | Assign custom names to containers instead of auto-generated ones |
| **Configuring** | Set detailed options when running containers |
| **Controlling** | Start, stop, restart, pause containers with fine-grained control |
| **Listing** | View running and stopped containers |
| **Restarting** | Resume previously stopped containers |
| **Removing** | Delete stopped containers you no longer need |

---

## Preview of Key Commands

### Image Commands

```bash
# Tag/name an image during build
docker build -t <name>:<tag> .

# List all images
docker images

# Inspect an image
docker inspect <image_id>

# Remove an image
docker rmi <image_id>

# Remove unused images
docker image prune
```

### Container Commands

```bash
# Run with a custom name
docker run --name <custom_name> -p <host>:<container> <image>

# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Stop a container
docker stop <container_name>

# Restart a stopped container
docker start <container_name>

# Remove a stopped container
docker rm <container_name>

# Remove all stopped containers
docker container prune
```

---

## Command Structure Overview

```
docker <command> [options] [arguments]
       │          │         │
       │          │         └── Image ID, container name, path, etc.
       │          └──────────── Flags like -p, -d, --name, --rm, etc.
       └─────────────────────── build, run, stop, start, ps, images, rm, rmi, inspect, etc.
```

Every command supports `--help`:
```bash
docker <command> --help
```

---

# Spring Boot Equivalent Commands Preview

### Image Management

```bash
# Build and tag a Spring Boot image
docker build -t myspringapp:1.0 .

# Build with Buildpacks (auto-named)
mvn spring-boot:build-image -Dspring-boot.build-image.imageName=myspringapp:1.0

# List all images
docker images

# Inspect the Spring Boot image
docker inspect myspringapp:1.0

# Remove the image
docker rmi myspringapp:1.0

# Remove all unused images
docker image prune
```

### Container Management

```bash
# Run with custom name and detached mode
docker run -d --name my-spring-container -p 8080:8080 myspringapp:1.0

# List running containers
docker ps

# List all containers
docker ps -a

# Stop the container
docker stop my-spring-container

# Restart the stopped container
docker start my-spring-container

# Remove the stopped container
docker rm my-spring-container

# Remove all stopped containers
docker container prune
```

### Using --help with Spring Boot Related Commands

```bash
docker build --help       # See all build options (--tag, --file, --no-cache, etc.)
docker run --help         # See all run options (--name, -d, -p, -e, -v, --rm, etc.)
docker images --help      # See all listing/filtering options
docker inspect --help     # See all inspection options
```

---

## Key Takeaway

> **`--help` is your best friend.** Before searching online, try adding `--help` to any Docker command to discover available options and their descriptions. Most of what you need is documented right there in the terminal.