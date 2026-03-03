# Notes: Sharing Images — Pushing to Docker Hub & Registries

## Why Share Images?

- **Team collaboration** — other developers can pull and run your images
- **Deployment** — production servers can pull images directly
- **CI/CD pipelines** — automated systems can build, push, and pull images
- **Backup** — store images in a central location
- **Distribution** — share your application with the world

---

## Where to Share Images

### Two Main Options

| Option | Description | Use Case |
|--------|-------------|----------|
| **Docker Hub** | Official Docker image registry | Public images, getting started, free tier |
| **Private Registry** | Any other provider (AWS ECR, Google GCR, Azure ACR, etc.) | Enterprise, sensitive code, custom requirements |

### Docker Hub Features

- **Free tier available** — limited private repos, unlimited public repos
- **Official images** — verified images like `node`, `python`, `postgres`
- **Public repositories** — anyone can pull your image
- **Private repositories** — only you/team can access (limited on free plan)

> For private registries, you must include the provider's URL in push/pull commands. With Docker Hub, it's automatic.

---

## The Sharing Workflow

```
LOCAL                                    DOCKER HUB
┌─────────────────┐                     ┌─────────────────┐
│  Your Image     │   docker push →     │  Repository     │
│  (built locally)│                     │  (stored online)│
└─────────────────┘                     └─────────────────┘
                                               │
                                               │ docker pull
                                               ▼
                                        ┌─────────────────┐
                                        │  Team Member /  │
                                        │  Server / CI    │
                                        └─────────────────┘
```

---

## Step-by-Step: Push to Docker Hub

### Step 1: Create a Docker Hub Account

1. Go to [hub.docker.com](https://hub.docker.com)
2. Sign up for a free account
3. Choose a **Docker ID** (e.g., `academind`, `myusername`)

### Step 2: Create a Repository on Docker Hub

1. Log in to Docker Hub
2. Go to **Repositories** → **Create Repository**
3. Enter repository name (e.g., `node-hello-world`)
4. Add description (optional)
5. Choose **Public** or **Private**
6. Click **Create**

**Result:** Your repository URL will be: `<docker_id>/<repo_name>`

Example: `academind/node-hello-world`

---

### Step 3: Tag Your Local Image Correctly

**Important:** Your local image name must match the Docker Hub repository format:

```
<docker_id>/<repository_name>:<tag>
```

#### Option A: Build with the correct name from the start

```bash
docker build -t academind/node-hello-world:latest .
```

#### Option B: Rename/retag an existing image

```bash
docker tag <existing_image_name> <docker_id>/<repo_name>:<tag>
```

**Example:**

```bash
# Current image
docker images
# REPOSITORY   TAG      IMAGE ID
# node-demo    latest   abc123

# Create a new tag pointing to the same image
docker tag node-demo:latest academind/node-hello-world:latest

# Verify
docker images
# REPOSITORY                      TAG      IMAGE ID
# node-demo                       latest   abc123
# academind/node-hello-world      latest   abc123  ← Same ID, new name
```

**Key insight:** `docker tag` doesn't delete the old image — it creates a **clone** (same image ID, different name).

---

### Step 4: Log In to Docker Hub

```bash
docker login
```

Enter your Docker ID and password when prompted.

```
Username: academind
Password: ********
Login Succeeded
```

**Notes:**
- Characters are not displayed while typing password (normal behavior)
- You only need to log in once — credentials are stored
- Use `docker logout` to log out when needed

---

### Step 5: Push the Image

```bash
docker push academind/node-hello-world:latest
```

**Output:**

```
The push refers to repository [docker.io/academind/node-hello-world]
abc123: Pushed
def456: Pushed
latest: digest: sha256:... size: 1234
```

**Smart Pushing:**
- Docker doesn't upload your entire image
- It detects that base layers (like `node`) already exist on Docker Hub
- Only **new/changed layers** are uploaded
- Saves bandwidth and storage

---

### Step 6: Verify on Docker Hub

1. Go to your repository on Docker Hub
2. Refresh the page
3. You'll see your pushed tag(s) listed under **Tags**

---

## Common Errors

### Error: Repository Does Not Exist

```
denied: requested access to the resource is denied
```

**Cause:** Image name doesn't match Docker Hub format (`<docker_id>/<repo>`)

**Solution:** Retag your image with the correct name

### Error: Access Denied

```
denied: requested access to the resource is denied
```

**Cause:** Not logged in, or trying to push to someone else's repository

**Solution:** Run `docker login` with your credentials

### Error: Tag Does Not Exist

```
An image does not exist locally with the tag: academind/node-hello-world
```

**Cause:** You haven't tagged the image with the Docker Hub-compatible name

**Solution:** Use `docker tag` to create the correctly named image

---

## Pushing Multiple Tags

You can have multiple versions/tags in the same repository:

```bash
# Tag version 1.0
docker tag myapp:latest academind/node-hello-world:1.0

# Tag version 2.0
docker tag myapp:v2 academind/node-hello-world:2.0

# Push all tags
docker push academind/node-hello-world:1.0
docker push academind/node-hello-world:2.0
docker push academind/node-hello-world:latest
```

On Docker Hub, all tags appear in the same repository.

---

## Complete Workflow Summary

```bash
# 1. Build your image
docker build -t myapp:latest .

# 2. Tag for Docker Hub
docker tag myapp:latest yourusername/myapp:latest

# 3. Log in (once)
docker login

# 4. Push
docker push yourusername/myapp:latest

# 5. Anyone can now pull
docker pull yourusername/myapp:latest
docker run -p 3000:80 yourusername/myapp:latest
```

---

## Visual: Image Naming for Docker Hub

```
LOCAL IMAGE NAME              DOCKER HUB COMPATIBLE NAME
┌──────────────┐              ┌─────────────────────────────┐
│  myapp:1.0   │  docker tag  │  academind/myapp:1.0        │
└──────────────┘      →       │  └─────┬────┘ └─┬─┘ └─┬─┘   │
                              │        │        │     │     │
                              │   Docker ID  Repo   Tag     │
                              └─────────────────────────────┘
```

---

# Spring Boot Equivalent

## Full Workflow: Push Spring Boot Image to Docker Hub

### Step 1: Build the Application

```bash
mvn clean package -DskipTests
```

### Step 2: Build Docker Image with Correct Name

```bash
# Build with Docker Hub-compatible name from the start
docker build -t yourusername/spring-order-service:1.0 .
```

Or retag an existing image:

```bash
docker tag orderservice:1.0 yourusername/spring-order-service:1.0
```

### Step 3: Log In and Push

```bash
docker login
docker push yourusername/spring-order-service:1.0
```

### Step 4: Pull and Run Anywhere

```bash
# On another machine or server
docker pull yourusername/spring-order-service:1.0
docker run -d -p 8080:8080 yourusername/spring-order-service:1.0
```

---

## Using Spring Boot Buildpacks with Docker Hub

```bash
# Build and name for Docker Hub directly
mvn spring-boot:build-image \
  -Dspring-boot.build-image.imageName=yourusername/spring-order-service:1.0

# Push
docker push yourusername/spring-order-service:1.0
```

---

## Multi-Service Example

```bash
# Build and tag multiple services
docker build -t yourusername/order-service:1.0 ./order-service
docker build -t yourusername/user-service:1.0 ./user-service
docker build -t yourusername/product-service:1.0 ./product-service

# Log in once
docker login

# Push all
docker push yourusername/order-service:1.0
docker push yourusername/user-service:1.0
docker push yourusername/product-service:1.0

# Anyone can now run your microservices
docker run -d -p 8080:8080 yourusername/order-service:1.0
docker run -d -p 8081:8080 yourusername/user-service:1.0
docker run -d -p 8082:8080 yourusername/product-service:1.0
```

---

## Versioning Strategy

```bash
# Build new version
mvn clean package -DskipTests
docker build -t yourusername/myapp:2.0 .

# Also update :latest
docker tag yourusername/myapp:2.0 yourusername/myapp:latest

# Push both
docker push yourusername/myapp:2.0
docker push yourusername/myapp:latest
```

---

## Private Registry Example (AWS ECR)

```bash
# Log in to AWS ECR (different from Docker Hub)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Tag for ECR (note: includes full registry URL)
docker tag myapp:1.0 123456789.dkr.ecr.us-east-1.amazonaws.com/myapp:1.0

# Push to ECR
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/myapp:1.0
```

---

## Quick Reference

| Action | Command |
|--------|---------|
| Log in to Docker Hub | `docker login` |
| Log out | `docker logout` |
| Tag for Docker Hub | `docker tag <local> <dockerid>/<repo>:<tag>` |
| Push to Docker Hub | `docker push <dockerid>/<repo>:<tag>` |
| Pull from Docker Hub | `docker pull <dockerid>/<repo>:<tag>` |
| Build with Hub name | `docker build -t <dockerid>/<repo>:<tag> .` |

---

## Key Takeaways

1. **Docker Hub is the default registry** — push/pull without specifying a host
2. **Image name must match format:** `<docker_id>/<repository>:<tag>`
3. **`docker tag` creates a clone** — doesn't delete the original image
4. **`docker login` required once** — credentials are stored locally
5. **Smart pushing** — only changed layers are uploaded, not entire images
6. **Multiple tags per repo** — version your images with different tags
7. **Private registries** — require the full URL in push/pull commands
8. **Public images** — anyone can pull; be careful with sensitive data