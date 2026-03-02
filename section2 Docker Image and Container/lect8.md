# Notes: Docker Image Layer-Based Architecture

## Core Concept: Images Are Layer-Based

Every instruction in a Dockerfile represents a **layer**. An image is built up from multiple layers, and Docker **caches** each layer's result. When you rebuild an image, Docker only re-executes layers where something changed — and **all subsequent layers after the change**.

---

## How Layer Caching Works

### When Nothing Changes

```bash
docker build .
```

If no files or instructions have changed since the last build, Docker uses **cached results for every layer**. The build completes almost instantly (fraction of a second).

Output shows:
```
Step 1/6 : FROM node
 ---> Using cache
Step 2/6 : WORKDIR /app
 ---> Using cache
Step 3/6 : COPY . /app
 ---> Using cache
Step 4/6 : RUN npm install
 ---> Using cache
Step 5/6 : EXPOSE 80
 ---> Using cache
Step 6/6 : CMD ["node", "server.js"]
 ---> Using cache
```

### When Something Changes

If you modify a source code file and rebuild:

```
Step 1/6 : FROM node         → Using cache ✅
Step 2/6 : WORKDIR /app      → Using cache ✅
Step 3/6 : COPY . /app       → RE-EXECUTED ⚠️ (file change detected)
Step 4/6 : RUN npm install   → RE-EXECUTED ⚠️ (subsequent layer)
Step 5/6 : EXPOSE 80         → RE-EXECUTED ⚠️ (subsequent layer)
Step 6/6 : CMD [...]         → RE-EXECUTED ⚠️ (subsequent layer)
```

**Key Rule:** When one layer changes, **all subsequent layers are also re-executed**. Docker does not perform deep analysis of whether subsequent layers would actually produce different results.

---

## Visual Representation of Layers

```
┌─────────────────────────────────┐
│  Container Layer (read-write)   │  ← Added only when container runs
├─────────────────────────────────┤
│  CMD ["node", "server.js"]      │  Layer 6 (read-only)
├─────────────────────────────────┤
│  EXPOSE 80                      │  Layer 5 (read-only)
├─────────────────────────────────┤
│  RUN npm install                │  Layer 4 (read-only)
├─────────────────────────────────┤
│  COPY . /app                    │  Layer 3 (read-only)
├─────────────────────────────────┤
│  WORKDIR /app                   │  Layer 2 (read-only)
├─────────────────────────────────┤
│  FROM node                      │  Layer 1 (read-only, base image)
└─────────────────────────────────┘
```

- **Image layers** = read-only, created at build time
- **Container layer** = read-write, created at runtime (the running application, result of executing CMD)

---

## The Optimization Problem

### Unoptimized Dockerfile

```dockerfile
FROM node
WORKDIR /app
COPY . /app              # Copies EVERYTHING (including source code)
RUN npm install           # Installs dependencies
EXPOSE 80
CMD ["node", "server.js"]
```

**Problem:** Any source code change invalidates the `COPY` layer, which forces `RUN npm install` to re-execute — even though dependencies haven't changed. `npm install` is slow and unnecessary if only source code changed.

### Optimized Dockerfile

```dockerfile
FROM node
WORKDIR /app
COPY package.json /app    # Copy ONLY package.json first
RUN npm install            # Install dependencies (cached if package.json unchanged)
COPY . /app                # THEN copy the rest of the source code
EXPOSE 80
CMD ["node", "server.js"]
```

**Why this works:**

```
Scenario: Only source code changed (not package.json)

Step 1: FROM node            → Using cache ✅
Step 2: WORKDIR /app         → Using cache ✅
Step 3: COPY package.json    → Using cache ✅ (package.json didn't change)
Step 4: RUN npm install      → Using cache ✅ (previous layer cached, so this is too!)
Step 5: COPY . /app          → RE-EXECUTED ⚠️ (source code changed)
Step 6: EXPOSE 80            → RE-EXECUTED ⚠️
Step 7: CMD [...]            → RE-EXECUTED ⚠️
```

The expensive `npm install` step is **skipped** because it comes **before** the source code copy. Dependencies are only reinstalled if `package.json` actually changes.

---

## Layer Architecture Summary

| Principle | Explanation |
|-----------|-------------|
| **Every instruction = a layer** | Each Dockerfile instruction creates a separate cached layer |
| **Layers are cached** | Docker stores the result of each layer |
| **Change detection** | Docker checks if input to a layer has changed |
| **Cascade invalidation** | If one layer changes, ALL subsequent layers are re-executed |
| **No deep analysis** | Docker doesn't analyze whether a subsequent layer's output would actually differ |
| **Image layers are read-only** | Once built, image layers cannot be modified |
| **Container adds a layer** | Running a container adds a writable layer on top |
| **Order matters** | Place frequently-changing instructions LATER in the Dockerfile |

---

## Optimization Principle

> **Put instructions that change less frequently BEFORE instructions that change more frequently.**

```
Things that rarely change:
  - Base image (FROM)
  - Working directory (WORKDIR)
  - Dependency files (package.json, pom.xml, build.gradle)
  - Dependency installation (npm install, mvn install)

Things that change often:
  - Source code (COPY . /app)
```

---

# Spring Boot Equivalent: Layer Optimization

## The Same Problem Exists

In Spring Boot, downloading Maven/Gradle dependencies is the expensive step (equivalent to `npm install`). We want to cache that and only re-copy source code when it changes.

---

## Unoptimized Spring Boot Dockerfile

```dockerfile
FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY . /app                              # Copies EVERYTHING
RUN ./mvnw clean package -DskipTests     # Downloads deps + builds
EXPOSE 8080
CMD ["java", "-jar", "target/myapp.jar"]
```

**Problem:** Any source code change forces Maven to re-download all dependencies because the `COPY` layer is invalidated, which cascades to the `RUN` layer.

---

## Optimized Spring Boot Dockerfile (Multi-Stage + Dependency Caching)

```dockerfile
# Stage 1: Build
FROM eclipse-temurin:17-jdk AS builder
WORKDIR /app

# Copy dependency files FIRST (rarely change)
COPY pom.xml .
COPY mvnw .
COPY .mvn ./.mvn

# Download dependencies ONLY (cached if pom.xml unchanged)
RUN chmod +x mvnw && ./mvnw dependency:resolve

# THEN copy source code (changes frequently)
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests

# Stage 2: Run (slim image)
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
```

### Layer Behavior When Only Source Code Changes

```
Stage 1:
  COPY pom.xml           → Using cache ✅
  COPY mvnw              → Using cache ✅
  COPY .mvn              → Using cache ✅
  RUN dependency:resolve → Using cache ✅ (pom.xml didn't change!)
  COPY src               → RE-EXECUTED ⚠️ (source code changed)
  RUN package            → RE-EXECUTED ⚠️ (but deps already cached!)

Stage 2:
  COPY --from=builder    → RE-EXECUTED ⚠️ (new JAR)
```

**Result:** Dependencies are NOT re-downloaded. Only compilation runs, which is much faster.

---

## Optimized Gradle Equivalent

```dockerfile
FROM eclipse-temurin:17-jdk AS builder
WORKDIR /app

# Copy dependency files first
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
COPY gradlew .

# Download dependencies (cached if build.gradle unchanged)
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon

# Then copy source code
COPY src ./src

# Build
RUN ./gradlew bootJar --no-daemon

# Runtime stage
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
```

---

## Spring Boot Layered JAR (Best Layer Optimization)

Spring Boot 2.3+ creates layered JARs that align perfectly with Docker's layer caching:

```dockerfile
# Stage 1: Extract layers
FROM eclipse-temurin:17-jre AS builder
WORKDIR /app
COPY target/*.jar app.jar
RUN java -Djarmode=layertools -jar app.jar extract

# Stage 2: Build layered image
FROM eclipse-temurin:17-jre
WORKDIR /app

# Dependencies layer (rarely changes) — CACHED
COPY --from=builder /app/dependencies/ ./

# Spring Boot loader (rarely changes) — CACHED
COPY --from=builder /app/spring-boot-loader/ ./

# Snapshot dependencies (occasionally changes)
COPY --from=builder /app/snapshot-dependencies/ ./

# Application code (changes frequently) — only this rebuilds
COPY --from=builder /app/application/ ./

EXPOSE 8080
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
```

### Layer Behavior

```
COPY dependencies/          → Using cache ✅ (deps didn't change)
COPY spring-boot-loader/    → Using cache ✅ (loader didn't change)
COPY snapshot-dependencies/  → Using cache ✅ (snapshots didn't change)
COPY application/           → RE-EXECUTED ⚠️ (your code changed)
```

**Only the final, smallest layer rebuilds** when source code changes.

---

## Comparison: Optimization Patterns

| Approach | Node.js | Spring Boot (Maven) |
|----------|---------|---------------------|
| **Copy dep file first** | `COPY package.json /app` | `COPY pom.xml .` |
| **Install dependencies** | `RUN npm install` | `RUN ./mvnw dependency:resolve` |
| **Copy source code after** | `COPY . /app` | `COPY src ./src` |
| **Build** | N/A (interpreted) | `RUN ./mvnw package` |
| **Result** | Deps cached on code change | Deps cached on code change |

---

## Quick Reference: Layer Caching Commands

```bash
# Build with full output (see which layers are cached)
docker build .

# Build with no cache (force rebuild all layers)
docker build --no-cache .

# Build with specific target for multi-stage
docker build --target builder .

# Prune build cache
docker builder prune

# View image layers and sizes
docker history <image_id>
```