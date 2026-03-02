

# Getting Started with Docker Images & Containers

## Two Ways to Get an Image

```
┌─────────────────────────────────────────┐
│  Way 1: Use an existing image           │
│    • Colleague built it                 │
│    • Official pre-built (Docker Hub)    │
│    • Community-shared images            │
│                                         │
│  Way 2: Build your own (covered later)  │
└─────────────────────────────────────────┘
```

## Docker Hub (hub.docker.com)

```
🔍 Search: "node"
┌─────────────────────────────────────┐
│  📦 node                             │
│  Official Image                      │
│  Maintained by Node.js team          │
│  Contains: Full Node.js environment  │
│  Usable by anyone                    │
└─────────────────────────────────────┘
```

## Running Your First Container

### Attempt 1: Basic Run

```bash
docker run node
```

**What happens step by step:**

```
1. Docker looks locally     → ❌ Not found
2. Pulls from Docker Hub    → ⬇️ Downloads image
3. Creates container        → ✅ Container created
4. Runs container           → 🔇 Nothing visible
```

> The container **was created and ran**, but Node's interactive shell is **not exposed** to us. Containers are **isolated** by default.

### Verifying the Container Exists

```bash
docker ps -a    # Show ALL containers (running + stopped)
```

```
CONTAINER ID   IMAGE   CREATED       STATUS                   NAMES
f1a2b3c4       node    2 min ago     Exited (0) 2 min ago     random_name
```

### Attempt 2: Interactive Mode

```bash
docker run -it node
```

| Flag | Meaning |
|------|---------|
| `-i` | Interactive (keep STDIN open) |
| `-t` | Allocate a pseudo-TTY (terminal) |

```
Welcome to Node.js v14.9.0
> 1 + 1
2
> process.version
'v14.9.0'
> (Ctrl+C twice to exit)
```

## Proving Container Isolation

```
INSIDE CONTAINER          HOST MACHINE
┌─────────────────┐      ┌─────────────────┐
│ Node v14.9.0    │      │ Node v14.7.0    │
│                 │      │ (or not          │
│ (from image)    │      │  installed)      │
└─────────────────┘      └─────────────────┘
     Different versions = proof of isolation
```

> You do **NOT** need Node.js installed on your machine to run a Node container. The container carries its **own** complete environment.

## Multiple Containers from One Image

```bash
docker ps -a
```

```
CONTAINER ID   IMAGE   STATUS                   NAMES
f1a2b3c4       node    Exited (0) 5 min ago     name_1
d5e6f7g8       node    Exited (0) 2 min ago     name_2
```

```
                    ┌──────────────────┐
                ┌──▶│  Container 1     │ (exited)
┌──────────┐    │   └──────────────────┘
│  IMAGE   │────┤
│  (node)  │    │   ┌──────────────────┐
└──────────┘    └──▶│  Container 2     │ (exited)
                    └──────────────────┘

Same image → Multiple independent containers
Can run simultaneously in separate terminals
```

## Key Takeaways

```
IMAGE                              CONTAINER
• Holds code + environment         • Running instance of an image
• Pulled/built once                • Created many times
• Read-only blueprint              • Isolated execution unit
• From Docker Hub or custom        • Created with `docker run`

docker run = create + start a new container from an image
docker ps -a = list all containers (running + stopped)
-it flag = expose interactive terminal from container
```