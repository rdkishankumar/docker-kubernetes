

# Writing a Dockerfile: Step-by-Step

## The Complete Dockerfile

```dockerfile
FROM node

WORKDIR /app

COPY . /app

RUN npm install

EXPOSE 80

CMD ["node", "server.js"]
```

## Each Instruction Explained

### 1. `FROM node`

```dockerfile
FROM node
```

> **Java Analogy:** This is like writing `FROM openjdk:17` — you're saying "start with a base image that already has the runtime installed." Just as you need the JDK to compile and run Java, you need the Node runtime to run JavaScript. You **inherit** all capabilities of the parent image.

```
Think of it like Java inheritance:

class MyImage extends NodeImage {
    // Everything Node provides is already available
    // Now we add our own stuff on top
}
```

---

### 2. `WORKDIR /app`

```dockerfile
WORKDIR /app
```

Sets the **working directory** inside the container. All subsequent commands (`COPY`, `RUN`, `CMD`) execute relative to this path.

> **Java Analogy:** Like setting the `<directory>` in a Maven POM or doing `cd /app` before running any build commands. It's telling the container: "This is where our project lives."

```
Container File System
/
├── bin/
├── usr/
├── app/          ← WORKDIR (we work here)
│   ├── (our code will go here)
│   └── ...
└── ...
```

---

### 3. `COPY . /app`

```dockerfile
COPY . /app
```

| Path | Meaning |
|------|---------|
| `.` (first) | Everything in the folder where the Dockerfile lives (on host) |
| `/app` (second) | Destination inside the container |

> **Java Analogy:** Like the Maven `resources` plugin copying your `src/` directory into the build output, or like copying your entire project into a build server's workspace. The Dockerfile itself is **excluded** from the copy.

```
HOST                              CONTAINER
┌──────────────────┐    COPY     ┌──────────────────┐
│ ./               │ ─────────▶ │ /app/             │
│ ├── server.js    │             │ ├── server.js     │
│ ├── package.json │             │ ├── package.json  │
│ ├── public/      │             │ ├── public/       │
│ └── Dockerfile   │ (excluded)  │ └── (no Dockerfile)│
└──────────────────┘             └──────────────────┘
```

**Note:** Since `WORKDIR` is set to `/app`, you could also write:
```dockerfile
COPY . .        # Second dot = current WORKDIR = /app
COPY . ./       # Same thing
COPY . /app     # Explicit - preferred for clarity
```

---

### 4. `RUN npm install`

```dockerfile
RUN npm install
```

Executes **during image build**. Installs all dependencies listed in `package.json`.

> **Java Analogy:** This is exactly like `RUN mvn dependency:resolve` or `RUN gradle build`. It downloads all third-party libraries and makes them available inside the image. Runs once at build time, not at runtime.

```
Build Time (RUN)
┌─────────────────────────────────┐
│ Reads package.json              │  ══  Reads pom.xml
│ Downloads express, body-parser  │  ══  Downloads Spring JARs
│ Stores in node_modules/         │  ══  Stores in .m2/ or lib/
└─────────────────────────────────┘
```

---

### 5. `EXPOSE 80`

```dockerfile
EXPOSE 80
```

Tells Docker that the container will listen on port 80 at runtime. **Containers are isolated** — including their network. Without this, the port stays locked inside the container.

> **Java Analogy:** Like configuring `server.port=8080` in Spring Boot's `application.properties` and then telling Docker about it. The app listens internally, but Docker needs to know which port to make accessible.

```
WITHOUT EXPOSE:
┌──────────────┐
│  Container   │
│  Port 80 🔒  │ ── Browser can't reach it
└──────────────┘

WITH EXPOSE:
┌──────────────┐
│  Container   │
│  Port 80 🔓  │ ── Docker knows to open this port
└──────────────┘
```

---

### 6. `CMD ["node", "server.js"]`

```dockerfile
CMD ["node", "server.js"]
```

Executes **when a container starts** (not during build).

> **Java Analogy:** This is like `CMD ["java", "-jar", "app.jar"]`. It's the **entry point** — what actually runs when the container comes to life.

### RUN vs CMD — Critical Difference

| | `RUN` | `CMD` |
|--|-------|-------|
| **When** | Image **build** time | Container **start** time |
| **Purpose** | Setup/install | Launch the app |
| **How many** | Multiple allowed | Only last one counts |
| **Analogy** | `mvn install` (build step) | `java -jar app.jar` (run step) |

```
Image Build (RUN)              Container Start (CMD)
┌─────────────────┐           ┌─────────────────┐
│ npm install     │           │ node server.js   │
│ Setup env       │    ──▶    │ App is RUNNING   │
│ Install deps    │           │ Serving requests │
└─────────────────┘           └─────────────────┘
   Template ready               Instance alive
```

> **Java Analogy:** Using `RUN` for `CMD`'s job would be like trying to **start your Spring Boot server during Maven's build phase**. The server would run in the build environment, not in the container. You want the build step to **prepare** everything, and the CMD to **launch** it.

```java
// WRONG: Starting server at compile time
// RUN node server.js  ← Like running main() during mvn compile

// RIGHT: Starting server when container launches
// CMD ["node", "server.js"]  ← Like java -jar app.jar at runtime
```

---

## Visual Summary

```
Dockerfile Flow
═══════════════

FROM node              ← Start with base runtime (like FROM openjdk)
       │
WORKDIR /app           ← Set project directory
       │
COPY . /app            ← Copy source code into image
       │
RUN npm install        ← Install dependencies (build time)
       │
EXPOSE 80              ← Declare network port
       │
CMD ["node","server.js"] ← Launch command (runtime)
       │
       ▼
   IMAGE READY         ← Template/blueprint complete
       │
  docker run           ← Creates container, executes CMD
       │
       ▼
   CONTAINER RUNNING   ← App is live and serving requests
```

## The Big Picture Java Analogy

```
Java Build & Deploy                Docker Build & Run
┌───────────────────┐             ┌────────────────────┐
│ 1. Install JDK    │  ═══════   │ FROM openjdk:17     │
│ 2. Copy source    │  ═══════   │ COPY . /app         │
│ 3. mvn install    │  ═══════   │ RUN mvn install     │
│ 4. Package JAR    │  ═══════   │ (part of RUN)       │
│ 5. java -jar app  │  ═══════   │ CMD ["java","-jar"] │
└───────────────────┘             └────────────────────┘

Everything in ONE file.
Reproducible. Portable. Consistent.
```

> **Key Insight:** The Dockerfile captures your **entire build and deployment process** in a single, version-controllable file. It's like combining your `pom.xml`, CI/CD pipeline, Dockerfile, and deployment script into one declarative recipe that **anyone can reproduce identically**.