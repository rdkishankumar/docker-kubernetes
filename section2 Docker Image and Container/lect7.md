# Notes: Understanding Images & Containers — Code Changes and Rebuilds

## Core Concept: Images Are Read-Only Snapshots

Once an image is built, it is **locked, finished, and read-only**. You cannot edit it from the outside. Any changes to your source code after the image was built have **zero impact** on the image.

---

## The Problem: Code Changes Not Reflected

### Scenario

1. You have a running container based on a custom image.
2. You make a change to your source code (e.g., adding an exclamation mark to an HTML heading).
3. You restart the container.
4. **The change is NOT reflected** in the running application.

### Why?

In the Dockerfile, the `COPY` instruction takes a **snapshot** of your source code at the point in time when the image is built:

```dockerfile
COPY . /app          # Copies source code INTO the image at build time
RUN npm install      # Installs dependencies based on that snapshot
EXPOSE 80
CMD ["node", "server.js"]
```

- The `COPY` operation captures your code **as it exists at that moment**.
- After the image is built, editing your local source code has **no effect** on the image.
- You could even **delete** your local source code entirely — the image would not be affected.
- **Restarting** the container doesn't help because the container is based on the same unchanged image.

---

## The Solution: Rebuild the Image

To pick up code changes, you must **rebuild the image**:

```bash
docker build .
```

This creates a **completely new image** with a **new image ID**. Then run a container from the new image:

```bash
docker run -p 3000:80 <new_image_id>
```

Now the change (e.g., the exclamation mark) will be visible.

---

## Key Takeaways

| Concept | Explanation |
|---------|-------------|
| **Images are read-only** | Once built, images are locked templates. No external changes affect them. |
| **COPY is a snapshot** | It captures code at the moment of build, not a live link. |
| **Restarting ≠ Rebuilding** | Restarting a container reuses the same image; rebuilding creates a new one. |
| **New build = New image** | Each `docker build` produces a new image with a new ID. |
| **Old image still exists** | The previous image remains unless explicitly removed. |
| **Better workflows exist** | Later techniques (e.g., bind mounts/volumes) allow picking up changes without rebuilding — but the core concept remains true. |

---

## Visual Workflow

```
Source Code (v1) → docker build . → Image A (contains v1 code)
                                        ↓
                                   docker run → Container (shows v1)

--- You edit source code ---

Source Code (v2) → (Image A still has v1 code — unchanged!)
                                        ↓
                                   docker run → Container (STILL shows v1) ❌

--- You rebuild ---

Source Code (v2) → docker build . → Image B (contains v2 code)  ← NEW image, NEW ID
                                        ↓
                                   docker run → Container (shows v2) ✅
```

---

## Complete Command Sequence

```bash
# 1. Initial build and run
docker build .
docker run -p 3000:80 <image_id_v1>

# 2. Make code changes locally...

# 3. Stop the running container
docker ps                          # Find the container name
docker stop <container_name>       # Stop it

# 4. Rebuild the image (creates a NEW image)
docker build .

# 5. Run the NEW image
docker run -p 3000:80 <image_id_v2>

# 6. Verify changes are reflected at localhost:3000

# 7. When done, stop the new container
docker ps
docker stop <container_name>
```

---

# Spring Boot Equivalent

## The Same Concept Applies

Spring Boot images work identically — the image is a snapshot of your JAR file at build time.

### Scenario

1. You build a Spring Boot JAR and create a Docker image.
2. You change a controller, service, or template.
3. You restart the container → **changes NOT reflected**.
4. You must **rebuild the JAR** and **rebuild the image**.

### Step-by-Step

```bash
# 1. Initial build
mvn clean package -DskipTests
docker build -t myspringapp:1.0 .
docker run -d -p 8080:8080 myspringapp:1.0

# 2. Make code changes (e.g., modify a REST controller)...

# 3. Stop the running container
docker ps
docker stop <container_name>

# 4. Rebuild the JAR (critical step!)
mvn clean package -DskipTests

# 5. Rebuild the Docker image
docker build -t myspringapp:2.0 .

# 6. Run the new image
docker run -d -p 8080:8080 myspringapp:2.0

# 7. Verify at localhost:8080
```

### Using Buildpacks (No Dockerfile)

```bash
# 1. Make code changes
# 2. Rebuild image in one command (rebuilds JAR + image)
mvn spring-boot:build-image -Dspring-boot.build-image.imageName=myspringapp:2.0

# 3. Run
docker run -d -p 8080:8080 myspringapp:2.0
```

---

## Spring Boot Dockerfile Reminder

```dockerfile
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY target/myapp-0.0.1-SNAPSHOT.jar app.jar    # ← SNAPSHOT of the JAR at build time
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
```

The `COPY` line captures the JAR **as it exists at build time**. Recompiling the JAR locally afterwards does **nothing** to the image.

---

## Spring Boot Development Tip: Avoiding Constant Rebuilds

For **development**, you can use **bind mounts** to avoid rebuilding images on every code change (covered in later Docker topics):

```bash
# Mount local target directory into the container
docker run -p 8080:8080 -v $(pwd)/target/myapp.jar:/app/app.jar myspringapp:1.0
```

Or better yet, use **Spring Boot DevTools** with Docker Compose for hot-reloading during development.

However, for **production**, you should always build a fresh image with the final code baked in.

---

## Quick Reference: Image Rebuild Workflow

| Step | Node.js | Spring Boot |
|------|---------|-------------|
| Edit code | Edit `.js`/`.html` files | Edit `.java`/`.properties` files |
| Rebuild artifact | N/A (interpreted) | `mvn clean package -DskipTests` |
| Rebuild image | `docker build .` | `docker build -t myapp:v2 .` |
| Run new container | `docker run -p 3000:80 <id>` | `docker run -p 8080:8080 myapp:v2` |
| One-step rebuild | N/A | `mvn spring-boot:build-image` |