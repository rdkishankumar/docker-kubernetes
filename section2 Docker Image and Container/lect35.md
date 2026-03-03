# Notes: Inspecting Images — `docker image inspect`

## Quick Recap: Image & Container Relationship

```
┌─────────────────────────────────────┐
│           IMAGE (read-only)          │
│                                     │
│  Your Code + Application Environment│
│  (This is why images are large)     │
│                                     │
│  Multiple containers SHARE this     │
│  Code is NOT copied to containers   │
│                                     │
├─────────────────────────────────────┤
│  Container Layer (thin, read-write) │  ← Added at runtime
│  - Running process                  │
│  - Can create/modify files ONLY     │
│    in this thin layer               │
└─────────────────────────────────────┘
```

**Key points:**
- Image code is **locked and read-only**
- Containers can only write to their **own thin layer** on top
- Multiple containers based on the same image **share** the image code
- Code is **not copied** into each container — they reference the image

---

## The `docker image inspect` Command

```bash
docker image inspect <image_id>
```

Outputs detailed **JSON information** about an image. Useful for understanding how an image and its resulting containers are configured.

---

## What the Output Contains

### From Top to Bottom

| Section | What It Shows |
|---------|---------------|
| **ID** | Full image ID (not just the shortened version) |
| **Created** | Exact timestamp when the image was built |
| **Container Config** | Configuration for containers started from this image |
| **ExposedPorts** | Which ports the image documents as exposed (e.g., `80/tcp`) |
| **Env** | Environment variables set in the image (some auto-set by base image) |
| **Cmd / Entrypoint** | The command that runs when a container starts (your `CMD` instruction) |
| **DockerVersion** | Which Docker version was used to build the image |
| **Os** | Operating system (e.g., `linux` — from the base image's OS layer) |
| **Layers** | All the layers that make up the image |

---

## Understanding Layers in Inspect Output

### Example: Your Custom Image

```
Your Dockerfile has 6 instructions:
  FROM node
  WORKDIR /app
  COPY package.json /app
  RUN npm install
  COPY . /app
  EXPOSE 80
  CMD ["node", "server.js"]
```

But the inspect output shows **more than 6 layers**. Why?

```
┌────────────────────────────────┐
│  Layer 7: CMD                  │  ← Your Dockerfile
│  Layer 6: EXPOSE 80            │  ← Your Dockerfile
│  Layer 5: COPY . /app          │  ← Your Dockerfile
│  Layer 4: RUN npm install      │  ← Your Dockerfile
│  Layer 3: COPY package.json    │  ← Your Dockerfile
│  Layer 2: WORKDIR /app         │  ← Your Dockerfile
├────────────────────────────────┤
│  Layer 1: Node.js runtime      │  ← From base image (node)
│  Layer 0: Linux OS             │  ← From base image's base
└────────────────────────────────┘
```

**Your image inherits layers from the base image.** The `node` image itself builds on a Linux OS image, so those layers are included too.

> If the base `node` image changes internally, your image's cache would be invalidated and a rebuild would re-execute all layers.

---

## Practical Usage

### Inspect Your Own Custom Image

```bash
docker images
# REPOSITORY   TAG      IMAGE ID     SIZE
# <none>       <none>   abc123def    920MB

docker image inspect abc123def
```

### Inspect a Pulled Base Image

```bash
docker image inspect node
```

See how the official Node image is configured — its environment variables, entry point, OS, layers, etc.

### Common Use Cases

| When | Why |
|------|-----|
| **Forgot your configuration** | Check what ports are exposed, what CMD is set |
| **Pulled someone else's image** | Understand how it's configured before running it |
| **Debugging** | Verify environment variables, layers, OS details |
| **Comparing images** | See differences between image versions |
| **Checking layer count** | Understand image composition and optimization opportunities |

---

## Example Output (Simplified)

```json
[
  {
    "Id": "sha256:abc123def456...",
    "Created": "2024-01-15T10:30:00.000Z",
    "Config": {
      "ExposedPorts": {
        "80/tcp": {}
      },
      "Env": [
        "PATH=/usr/local/sbin:/usr/local/bin...",
        "NODE_VERSION=18.17.0",
        "YARN_VERSION=1.22.19"
      ],
      "Cmd": ["node", "server.js"],
      "WorkingDir": "/app",
      "Entrypoint": null
    },
    "DockerVersion": "24.0.5",
    "Os": "linux",
    "Architecture": "amd64",
    "RootFS": {
      "Type": "layers",
      "Layers": [
        "sha256:layer1...",
        "sha256:layer2...",
        "sha256:layer3...",
        "sha256:layer4...",
        "sha256:layer5...",
        "sha256:layer6...",
        "sha256:layer7...",
        "sha256:layer8..."
      ]
    }
  }
]
```

---

## Filtering Inspect Output

You can extract specific fields using Go template syntax:

```bash
# Get just the exposed ports
docker image inspect --format='{{.Config.ExposedPorts}}' <image_id>

# Get just the CMD
docker image inspect --format='{{.Config.Cmd}}' <image_id>

# Get just the environment variables
docker image inspect --format='{{.Config.Env}}' <image_id>

# Get the OS
docker image inspect --format='{{.Os}}' <image_id>

# Get the number of layers
docker image inspect --format='{{len .RootFS.Layers}}' <image_id>

# Get the working directory
docker image inspect --format='{{.Config.WorkingDir}}' <image_id>
```

---

# Spring Boot Equivalent

## Inspecting Spring Boot Images

```bash
# Build a Spring Boot image
mvn clean package -DskipTests
docker build -t myspringapp:1.0 .

# Inspect it
docker image inspect myspringapp:1.0
```

### What You'll See

```json
{
  "Config": {
    "ExposedPorts": {
      "8080/tcp": {}
    },
    "Env": [
      "PATH=/opt/java/openjdk/bin:/usr/local/sbin...",
      "JAVA_HOME=/opt/java/openjdk",
      "JAVA_VERSION=jdk-17.0.9+9"
    ],
    "Cmd": ["java", "-jar", "app.jar"],
    "WorkingDir": "/app"
  },
  "Os": "linux",
  "RootFS": {
    "Layers": [
      "sha256:...",    // Linux OS layer (from eclipse-temurin base)
      "sha256:...",    // JRE layer
      "sha256:...",    // WORKDIR layer
      "sha256:...",    // COPY JAR layer
      "sha256:..."     // EXPOSE + CMD layers
    ]
  }
}
```

### Spring Boot Layer Structure

```
┌──────────────────────────┐
│ CMD ["java","-jar",...]  │  ← Your Dockerfile
│ EXPOSE 8080              │  ← Your Dockerfile
│ COPY app.jar             │  ← Your Dockerfile
│ WORKDIR /app             │  ← Your Dockerfile
├──────────────────────────┤
│ JRE (Java Runtime)       │  ← From eclipse-temurin base
│ Linux OS                 │  ← From base image's base
└──────────────────────────┘
```

### Useful Inspect Queries for Spring Boot

```bash
# Check which Java version is in the image
docker image inspect --format='{{.Config.Env}}' myspringapp:1.0

# Check the startup command
docker image inspect --format='{{.Config.Cmd}}' myspringapp:1.0

# Check exposed ports
docker image inspect --format='{{.Config.ExposedPorts}}' myspringapp:1.0

# Check working directory
docker image inspect --format='{{.Config.WorkingDir}}' myspringapp:1.0

# Count layers
docker image inspect --format='{{len .RootFS.Layers}}' myspringapp:1.0
```

### Inspecting Buildpack Images

If you used Spring Boot Buildpacks (`mvn spring-boot:build-image`), inspecting reveals additional configuration:

```bash
docker image inspect myspringapp:1.0

# Buildpack images have more layers (optimized layering)
# and different entry points managed by the launcher
```

---

## Comparing Images

```bash
# Inspect two versions side by side
docker image inspect myspringapp:1.0 > v1.json
docker image inspect myspringapp:2.0 > v2.json
diff v1.json v2.json
```

---

## Key Takeaways

1. **`docker image inspect` shows detailed image configuration** — ports, env vars, CMD, layers, OS
2. **Images include layers from base images** — your custom layers sit on top of inherited layers
3. **Useful for debugging and understanding** — especially for pulled/third-party images
4. **Format flag extracts specific fields** — `--format='{{.Config.Cmd}}'`
5. **Layer count > Dockerfile instructions** — because base image layers are inherited
6. **Container config is defined by the image** — inspect reveals how containers will behave
7. **Not needed daily** — but valuable when you need to understand or debug image configuration