# Images are bluprint.

# Notes: Core Concepts Summary — Images & Containers

## The Big Picture

Docker is ultimately about **your code** and **your application**. Everything revolves around packaging your application with its environment into isolated, reproducible units.

---

## The Three Core Elements

```
┌──────────────┐
│  YOUR CODE   │  → Application source code, configuration, assets
│  +           │
│  ENVIRONMENT │  → Runtime (Node.js, JDK), tools, dependencies
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    IMAGE     │  → Blueprint/template containing code + environment
└──────┬───────┘
       │  (can instantiate multiple)
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│Container │   │Container │   │Container │
│    A     │   │    B     │   │    C     │
└──────────┘   └──────────┘   └──────────┘
  Running        Running        Running
  Instance       Instance       Instance
```

---

## Images

### What an Image Contains
- **Your code** — application source code
- **Environment** — runtime tools (Node.js, JDK, Python, etc.)
- **Dependencies** — installed packages (node_modules, Maven dependencies, etc.)
- **Configuration** — setup steps, exposed ports, startup commands

### How an Image Is Created
Through a **Dockerfile** with detailed instructions:

```dockerfile
FROM node                    # Base image (environment/tools)
WORKDIR /app                 # Setup working directory
COPY package.json /app       # Copy dependency manifest
RUN npm install              # Install dependencies
COPY . /app                  # Copy application code
EXPOSE 80                    # Document internal port
CMD ["node", "server.js"]    # Define startup command
```

### Key Properties of Images
- **Read-only** — locked and finished once built
- **Layer-based** — each instruction creates a cached layer
- **Template/blueprint** — not a running thing, just a definition
- **Reusable** — multiple containers can be based on one image
- **Shareable** — can be pushed to registries and pulled by others

---

## Containers

### What a Container Is
- A **running instance** of an image
- An **extra thin layer** on top of the image
- Your **running application** — the actual executing process
- **Standalone and independent** from other containers

### What a Container Is NOT
- A container does **NOT copy** the code and environment from the image into a new file
- The code exists **only once** in the image
- Multiple containers **share/utilize** the same underlying image layers

### How This Works Internally

```
┌─────────────────────────────────────────────┐
│              IMAGE (read-only)               │
│                                             │
│  Layer 1: Base OS + Runtime (e.g., Node)    │
│  Layer 2: Working directory setup           │
│  Layer 3: Dependencies (node_modules)       │
│  Layer 4: Application source code           │
│  Layer 5: Port configuration                │
│                                             │
├─────────────────────────────────────────────┤
│  Container A Layer (read-write)             │  ← Thin layer: running process,
│  - Running node server process              │     allocated memory, resources
│  - Allocated memory & CPU                   │
│  - Runtime state                            │
├─────────────────────────────────────────────┤
│  Container B Layer (read-write)             │  ← Separate thin layer
│  - Running node server process              │     using SAME image layers
│  - Allocated memory & CPU                   │
│  - Runtime state                            │
└─────────────────────────────────────────────┘
```

**Key insight:** If you have 1 image and 2 containers, the code and environment exist **only once** (in the image). Both containers reference and utilize the same image layers. This is extremely **efficient** in terms of disk space and resources.

---

## Image vs Container Comparison

| Aspect | Image | Container |
|--------|-------|-----------|
| **Nature** | Blueprint/template | Running instance |
| **State** | Read-only | Read-write (thin layer on top) |
| **Contains** | Code + environment + dependencies | Running process + runtime state |
| **Created by** | `docker build` | `docker run` |
| **Lifecycle** | Exists until deleted | Can be started, stopped, restarted, removed |
| **Multiplicity** | One image can create many containers | Each container is independent |
| **Copies code?** | Holds the code | Does NOT copy — references the image |
| **Analogy** | Class definition | Object instance |

---

## The Dockerfile → Image → Container Workflow

```
Step 1: WRITE the Dockerfile
  - Define base image (FROM)
  - Set up environment (WORKDIR, RUN)
  - Copy in code and dependencies (COPY)
  - Define runtime behavior (EXPOSE, CMD)

Step 2: BUILD the Image
  docker build .
  - Executes each instruction
  - Creates cached layers
  - Produces a read-only image with an ID

Step 3: RUN Container(s)
  docker run -p 3000:80 <image_id>
  - Adds thin read-write layer on top of image
  - Starts the process defined in CMD
  - Allocates resources (memory, CPU)
  - Container is isolated and independent

Step 4: MANAGE Containers
  docker ps          → See running containers
  docker stop <name> → Stop a container
  docker ps -a       → See all containers (including stopped)
```

---

## Key Takeaways

1. **Docker is about isolated environments** — containing your app and everything needed to run it
2. **Images are blueprints** — they hold code + environment, are read-only and layer-based
3. **Containers are running instances** — thin layers on top of images, independent from each other
4. **Containers don't copy from images** — they reference and utilize image layers directly
5. **One image, many containers** — code exists once, shared efficiently
6. **Images are created via Dockerfiles** — detailed instructions for what goes into the image
7. **Containers are the goal** — images are the building block, containers are what actually runs

---

# Spring Boot Equivalent Summary

## Spring Boot Dockerfile

```dockerfile
FROM eclipse-temurin:17-jre           # Base image: Java runtime environment
WORKDIR /app                           # Working directory
COPY target/myapp-0.0.1-SNAPSHOT.jar app.jar  # Application code (compiled JAR)
EXPOSE 8080                            # Document internal port
CMD ["java", "-jar", "app.jar"]        # Startup command
```

## Complete Workflow

```bash
# Step 1: Build the application
mvn clean package -DskipTests

# Step 2: Build the image
docker build -t myspringapp:1.0 .

# Step 3: Run container(s)
docker run -d -p 8080:8080 --name app1 myspringapp:1.0
docker run -d -p 8081:8080 --name app2 myspringapp:1.0

# Both containers share the same image — code exists only once!

# Step 4: Manage
docker ps                    # See running containers
docker stop app1             # Stop container 1
docker stop app2             # Stop container 2
```

## Multiple Containers from One Image

```bash
# One image
docker build -t myspringapp:1.0 .

# Three independent containers — all sharing the same image layers
docker run -d -p 8080:8080 --name prod-1 myspringapp:1.0
docker run -d -p 8081:8080 --name prod-2 myspringapp:1.0
docker run -d -p 8082:8080 --name prod-3 myspringapp:1.0
```

The JAR file, JRE, and all dependencies exist **only once** in the image. Each container adds only a thin read-write layer for the running JVM process and its runtime state.

## Alternative: Buildpacks (No Dockerfile Needed)

```bash
# Build image directly from source (Spring Boot handles everything)
mvn spring-boot:build-image -Dspring-boot.build-image.imageName=myspringapp:1.0

# Run containers as usual
docker run -d -p 8080:8080 myspringapp:1.0
```