

# Building Your Own Docker Image: Notes with Java Analogies

## Why Custom Images?

Running a pre-built image (like `node`) just gives you a bare runtime environment. That's like having the **JDK installed** but no `.java` files to compile and run. The JDK alone doesn't do anything useful — you need **your application code** on top of it.

```
Base Image (e.g., node)              Custom Image
┌─────────────────────────┐         ┌─────────────────────────┐
│ Like having JDK only     │  ──▶   │ JDK + your .java files  │
│ Runtime is ready          │ build  │ + compiled .class files  │
│ But nothing to execute    │ upon   │ = Ready to run!          │
└─────────────────────────┘         └─────────────────────────┘
```

> **Java Analogy:** A base Docker image is like installing the **JRE/JDK** on a fresh machine. You have `java` and `javac` available, but without your `Main.java`, `pom.xml`, and compiled classes, there's nothing to run. Building a custom image is like creating a **fat JAR / uber JAR** — everything bundled together, ready to execute anywhere with `java -jar app.jar`.

## The Pattern: Base Image + Your Code

```
                    Works for ANY language
                  ┌──────────────────────┐
                  │  Base Image (runtime) │
                  │  node, python, php,   │
                  │  openjdk, maven...    │
                  └──────────┬───────────┘
                             │
                    + YOUR application code
                    + YOUR dependencies
                    + YOUR configuration
                             │
                             ▼
                  ┌──────────────────────┐
                  │  Custom Image         │
                  │  YOUR app, ready to   │
                  │  run in a container   │
                  └──────────────────────┘
```

> **Java Analogy:** Think of it like **inheritance**:
> ```java
> class NodeImage extends BaseOS {
>     // Has Node.js runtime installed
> }
> 
> class MyApp extends NodeImage {
>     // Adds MY code, MY dependencies
>     // NOW it does something useful
> }
> ```
> The base image is the **parent class** with general capabilities. Your custom image is the **child class** that adds specific behavior.

## The Example App (Node.js)

```
Project Structure
├── server.js          ← Main app code (like Main.java)
├── package.json       ← Dependencies (like pom.xml)
├── public/
│   └── styles.css     ← Static resources
└── .gitignore         ← (optional)
```

### Java Equivalent Mapping

| Node.js Project | Java Equivalent |
|-----------------|-----------------|
| `server.js` | `Application.java` (Spring Boot main class) |
| `package.json` | `pom.xml` or `build.gradle` |
| `npm install` | `mvn install` or `gradle build` |
| `node server.js` | `java -jar app.jar` |
| `express` (dependency) | `spring-boot-starter-web` |
| `body-parser` (dependency) | Built into Spring MVC |
| `node_modules/` | `.m2/repository/` or `build/libs/` |

### App Flow

```
Browser ──GET /──▶ Server ──▶ Returns HTML form
                                    │
                              "Enter your goal"
                                    │
Browser ──POST /store-goal──▶ Server
                               │
                         Extract goal value
                         Store in variable
                         Redirect to /
                               │
Browser ◀── Updated HTML ◀─────┘
            showing the goal
```

> **Java Analogy:** This is exactly like a **Spring Boot Controller**:
> ```java
> @Controller
> public class GoalController {
>     private String userGoal = "Set a goal";
> 
>     @GetMapping("/")
>     public String showForm(Model model) {
>         model.addAttribute("goal", userGoal);
>         return "index";           // like returning HTML
>     }
> 
>     @PostMapping("/store-goal")
>     public String storeGoal(@RequestParam String goal) {
>         this.userGoal = goal;     // store it
>         return "redirect:/";      // redirect back
>     }
> }
> ```

## package.json = pom.xml

```
Node world (package.json)          Java world (pom.xml)
┌────────────────────────┐        ┌──────────────────────────┐
│ {                      │        │ <dependencies>           │
│   "dependencies": {    │        │   <dependency>           │
│     "express": "4.x",  │  ═══  │     spring-boot-web      │
│     "body-parser": "1" │  ═══  │     jackson-databind      │
│   }                    │        │   </dependency>           │
│ }                      │        │ </dependencies>          │
└────────────────────────┘        └──────────────────────────┘

npm install  ═══  mvn dependency:resolve
```

> **Java Analogy:** `package.json` is the **`pom.xml` of the Node world**. It doesn't contain the actual libraries — it's a **manifest** that tells the package manager what to download. Just like Maven reads `pom.xml` and downloads JARs from Maven Central, npm reads `package.json` and downloads packages from the npm registry.

## Running Without Docker (For Context)

```bash
# Node way                        # Java equivalent
npm install                        mvn clean install
node server.js                     java -jar target/app.jar
# App on localhost:80              # App on localhost:8080
```

### The Problem Without Docker

```
Developer A's Machine              Developer B's Machine
┌──────────────────────┐          ┌──────────────────────┐
│ Node v14.7           │          │ Node v12.3           │
│ npm v6.14            │          │ npm v6.9             │
│ macOS                │          │ Windows              │
│ ✅ Works             │          │ ❌ Breaks            │
└──────────────────────┘          └──────────────────────┘
```

> **Java Analogy:** This is the classic Java problem too — "It works on my machine!" Different JDK versions (Java 8 vs 11 vs 17), different OS, different Maven versions. Docker solves this the same way a **fat JAR** tries to, but **even more completely** — it bundles not just your app and dependencies, but the **entire runtime environment and OS layer**.

```
Without Docker (fat JAR):
┌─────────────────┐
│ app.jar          │ ← Your code + dependencies
│ Still needs JRE  │ ← But which version? Which OS?
└─────────────────┘

With Docker:
┌─────────────────┐
│ Docker Image     │
│ ├── OS layer     │ ← Consistent everywhere
│ ├── JRE/JDK     │ ← Exact version locked in
│ ├── Dependencies │ ← All included
│ └── app.jar      │ ← Your code
└─────────────────┘
```

## The Goal: Build a Custom Image

```
What we have:
  📦 Official node image on Docker Hub (like openjdk image)
  📄 Our application code (server.js, package.json)

What we need:
  🎯 A custom image that combines both
```

### Dockerfile = Build Script

```
Dockerfile                         Java Equivalent
┌──────────────────────────┐      ┌──────────────────────────┐
│ FROM node:14             │  ══  │ FROM openjdk:17          │
│ COPY package.json .      │  ══  │ COPY pom.xml .           │
│ RUN npm install          │  ══  │ RUN mvn dependency:resolve│
│ COPY . .                 │  ══  │ COPY . .                 │
│ EXPOSE 80                │  ══  │ EXPOSE 8080              │
│ CMD ["node","server.js"] │  ══  │ CMD ["java","-jar","app"]│
└──────────────────────────┘      └──────────────────────────┘
```

> **Java Analogy:** The Dockerfile is like a **multi-stage build script** — imagine combining your `pom.xml`, your CI/CD pipeline config, and your deployment script into **one declarative file**. It says: "Start with this JDK, copy my code, build it, and here's how to run it."

## The Big Picture Analogy

```
Java Class Hierarchy          Docker Image Hierarchy
┌───────────────┐            ┌───────────────┐
│    Object     │            │   scratch      │ (bare OS)
└───────┬───────┘            └───────┬───────┘
        │                            │
┌───────┴───────┐            ┌───────┴───────┐
│ AbstractClass │            │  ubuntu/alpine │ (base OS)
└───────┬───────┘            └───────┬───────┘
        │                            │
┌───────┴───────┐            ┌───────┴───────┐
│  ParentClass  │            │  node / openjdk│ (runtime)
└───────┬───────┘            └───────┬───────┘
        │                            │
┌───────┴───────┐            ┌───────┴───────┐
│  MyApp.java   │            │  YOUR image   │ (your app)
└───────────────┘            └───────────────┘

Each layer INHERITS from        Each image BUILDS ON
the one above and ADDS          the one below and ADDS
its own behavior                its own files/config
```

## Key Takeaway

```
Your specific application does NOT exist on Docker Hub.
You must BUILD your own image using a Dockerfile.

Base Image  +  Your Code  +  Dockerfile  =  Custom Image
  (FROM)        (COPY)       (recipe)       (deployable unit)
```

> **Final Java Analogy:** Docker Hub base images are like **abstract classes** — they provide the structure and runtime capabilities but are **incomplete on their own**. Your Dockerfile is the **concrete implementation** — it fills in the abstract methods (your code) and produces a **fully instantiable class** (a runnable image). Every time you do `docker run`, you're calling `new MyApp()` — creating a **container (object)** from your **image (class)**.