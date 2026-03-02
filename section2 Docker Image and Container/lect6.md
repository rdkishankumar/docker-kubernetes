# Notes: Building Docker Images and Running Containers

## Overview

This covers the complete workflow of turning a **Dockerfile** into an **image** and then into a running **container**.

---

## Key Commands

### 1. Building an Image

```bash
docker build .
```

- The `docker build` command tells Docker to build a new custom image based on a Dockerfile.
- The `.` (dot) specifies the **build context path** — the directory where Docker will look for the Dockerfile.
- If your terminal is already in the project folder containing the Dockerfile, `.` is sufficient.

**What happens during the build:**
1. Executes `FROM` — pulls the base image (e.g., `node`)
2. Sets the `WORKDIR`
3. Copies application code (`COPY`)
4. Runs dependency installation (e.g., `RUN npm install`)
5. Processes `EXPOSE` instruction
6. Registers the `CMD` instruction
7. **Outputs an image ID** at the end

> **Note:** On Windows, the output format may look slightly different, but you'll still get an image ID.

You can also assign custom names to images (covered later).

---

### 2. Running a Container

```bash
docker run <image_id>
```

- Creates and starts a container from the specified image.
- If the command inside the container is a **long-running process** (e.g., a Node server or Spring Boot application), the container keeps running and the terminal doesn't return to the prompt.

---

### 3. The Port Publishing Problem

Even with `EXPOSE 80` in the Dockerfile, visiting `localhost` **will NOT work** by default.

**Why?**
- `EXPOSE` is **documentation only** — it doesn't actually publish the port.
- It's a **best practice** to include it, but it's **100% optional**.
- You need to explicitly **publish** ports when running the container.

**Solution — use the `-p` flag:**

```bash
docker run -p 3000:80 <image_id>
```

| Part | Meaning |
|------|---------|
| `-p` | Publish flag |
| `3000` | **Local/host machine port** (your choice) |
| `80` | **Internal container port** (what the app listens on) |

Now `localhost:3000` will reach the application running inside the container on port 80.

---

### 4. Stopping a Container

**Step 1:** Find the running container name/ID:
```bash
docker ps
```
- `docker ps` — shows **only running** containers
- `docker ps -a` — shows **all** containers (including stopped ones)

**Step 2:** Stop the container:
```bash
docker stop <container_name>
```

- Takes a short while to shut down
- After stopping, the container moves to "exited" status (visible with `docker ps -a`)

---

## Complete Workflow Summary

```
Dockerfile  →  docker build .  →  Image (with ID)  →  docker run -p <host>:<container> <image_id>  →  Running Container
                                                                                                            ↓
                                                                                          docker ps → docker stop <name>
```

1. **Write** the Dockerfile with instructions
2. **Build** the image: `docker build .`
3. **Run** the container with port mapping: `docker run -p 3000:80 <image_id>`
4. **Find** running containers: `docker ps`
5. **Stop** the container: `docker stop <container_name>`

---

## Key Concepts to Remember

- **Image** = Blueprint/template (created with `docker build`)
- **Container** = Running instance of an image (created with `docker run`)
- **EXPOSE** = Documentation only; does NOT open ports
- **`-p` flag** = Required to actually map host ports to container ports
- Containers with long-running processes (servers) **don't exit automatically**
- Container names can be **auto-assigned** or **manually assigned** (covered later)

---

# Java Spring Boot Equivalent Commands

## Spring Boot Dockerfile Example

```dockerfile
# Use an official OpenJDK base image
FROM eclipse-temurin:17-jre

# Set the working directory inside the container
WORKDIR /app

# Copy the built JAR file into the container
COPY target/myapp-0.0.1-SNAPSHOT.jar app.jar

# Document the port the app uses
EXPOSE 8080

# Command to run the application
CMD ["java", "-jar", "app.jar"]
```

---

## Option 1: Standard Docker Build

### Step 1: Build the Spring Boot application first

```bash
mvn clean package -DskipTests
```
or with Gradle:
```bash
./gradlew bootJar
```

### Step 2: Build the Docker image

```bash
docker build .
```

With a custom name/tag:
```bash
docker build -t myspringapp:1.0 .
```

### Step 3: Run the container

```bash
docker run -p 8080:8080 myspringapp:1.0
```

Run in **detached mode** (background):
```bash
docker run -d -p 8080:8080 myspringapp:1.0
```

### Step 4: Verify and stop

```bash
docker ps
docker stop <container_name>
```

---

## Option 2: Spring Boot's Built-in Buildpacks (No Dockerfile Needed!)

Spring Boot 2.3+ has built-in support for creating OCI images **without writing a Dockerfile**.

### Using Maven:

```bash
mvn spring-boot:build-image
```

With a custom image name:
```bash
mvn spring-boot:build-image -Dspring-boot.build-image.imageName=myspringapp:1.0
```

### Using Gradle:

```bash
./gradlew bootBuildImage
```

With a custom image name:
```bash
./gradlew bootBuildImage --imageName=myspringapp:1.0
```

Then run normally:
```bash
docker run -p 8080:8080 myspringapp:1.0
```

> **Advantage:** No Dockerfile to maintain. Spring Boot uses Cloud Native Buildpacks (Paketo) to create an optimized, layered image automatically.

---

## Option 3: Optimized Multi-Stage Dockerfile (Production)

```dockerfile
# Stage 1: Build
FROM eclipse-temurin:17-jdk AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
COPY mvnw .
COPY .mvn ./.mvn
RUN chmod +x mvnw && ./mvnw clean package -DskipTests

# Stage 2: Run
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
```

Build and run:
```bash
docker build -t myspringapp:1.0 .
docker run -p 8080:8080 myspringapp:1.0
```

> **Advantage:** The final image only contains the JRE and the JAR — no source code, no JDK, no Maven. Much smaller image size.

---

## Option 4: Layered JAR (Best for Caching)

Spring Boot 2.3+ supports **layered JARs** for better Docker layer caching:

```dockerfile
FROM eclipse-temurin:17-jre AS builder
WORKDIR /app
COPY target/*.jar app.jar
RUN java -Djarmode=layertools -jar app.jar extract

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /app/dependencies/ ./
COPY --from=builder /app/spring-boot-loader/ ./
COPY --from=builder /app/snapshot-dependencies/ ./
COPY --from=builder /app/application/ ./
EXPOSE 8080
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
```

> **Advantage:** When you change only your application code, Docker rebuilds only the last layer. Dependencies (which rarely change) stay cached. Significantly faster rebuilds.

---

## Spring Boot Docker Commands Quick Reference

| Task | Command |
|------|---------|
| Build JAR | `mvn clean package -DskipTests` |
| Build image (Dockerfile) | `docker build -t myapp:1.0 .` |
| Build image (Buildpacks) | `mvn spring-boot:build-image` |
| Run container | `docker run -p 8080:8080 myapp:1.0` |
| Run detached | `docker run -d -p 8080:8080 myapp:1.0` |
| Run with environment vars | `docker run -p 8080:8080 -e SPRING_PROFILES_ACTIVE=prod myapp:1.0` |
| View running containers | `docker ps` |
| View all containers | `docker ps -a` |
| View logs | `docker logs <container_name>` |
| Stop container | `docker stop <container_name>` |
| Remove container | `docker rm <container_name>` |
| Remove image | `docker rmi myapp:1.0` |
| List images | `docker images` |

---

## Common Spring Boot Port Mapping Examples

```bash
# Default Spring Boot port (8080) mapped to host 8080
docker run -p 8080:8080 myapp:1.0

# Map to a different host port
docker run -p 9090:8080 myapp:1.0

# Multiple port mappings (e.g., app + actuator)
docker run -p 8080:8080 -p 8081:8081 myapp:1.0

# Bind to specific host interface
docker run -p 127.0.0.1:8080:8080 myapp:1.0
```