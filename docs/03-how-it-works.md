# AI Babysitter Launcher - How It Works

## Table of Contents
1. [Architecture](#architecture)
2. [Code Structure](#code-structure)
3. [Core Components](#core-components)
4. [Command Flow](#command-flow)
5. [Docker Integration](#docker-integration)
6. [Error Handling](#error-handling)
7. [Extension Guide](#extension-guide)

---

## Architecture

### High-Level Design

The launcher is a Python CLI application that acts as a wrapper around Docker Compose and other development tools. It provides a unified interface for complex multi-step operations.

```
┌─────────────────────────────────────────────────────┐
│             User (Terminal)                          │
└────────────────────┬─────────────────────────────────┘
                     │
                     │ Command-line arguments
                     │
┌────────────────────▼─────────────────────────────────┐
│            launcher.py (Python Script)                │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  Argument Parser (argparse)                   │   │
│  │  - Validates commands                         │   │
│  │  - Parses options                             │   │
│  └──────────────┬────────────────────────────────┘   │
│                 │                                     │
│  ┌──────────────▼────────────────────────────────┐   │
│  │  Validation Layer                              │   │
│  │  - Check requirements                          │   │
│  │  - Verify .env file                            │   │
│  └──────────────┬────────────────────────────────┘   │
│                 │                                     │
│  ┌──────────────▼────────────────────────────────┐   │
│  │  Command Router                                │   │
│  │  - Dispatches to appropriate handler           │   │
│  └──────────────┬────────────────────────────────┘   │
│                 │                                     │
│  ┌──────────────▼────────────────────────────────┐   │
│  │  Command Handlers                              │   │
│  │  - setup()     - start()      - test()        │   │
│  │  - stop()      - restart()    - clean()       │   │
│  │  - logs()      - status()                      │   │
│  └──────────────┬────────────────────────────────┘   │
│                 │                                     │
│  ┌──────────────▼────────────────────────────────┐   │
│  │  Utility Functions                             │   │
│  │  - run_command()                               │   │
│  │  - print_success/error/warning/info()         │   │
│  └──────────────┬────────────────────────────────┘   │
└─────────────────┼─────────────────────────────────────┘
                  │
                  │ subprocess calls
                  │
┌─────────────────▼─────────────────────────────────────┐
│          External Tools                                │
│                                                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐     │
│  │   Docker   │  │   Docker   │  │    npm     │     │
│  │            │  │  Compose   │  │    pip     │     │
│  └────────────┘  └────────────┘  └────────────┘     │
└────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Single Responsibility**: Each function has one clear purpose
2. **Fail Fast**: Validate requirements before executing operations
3. **User Feedback**: Provide clear, color-coded messages
4. **Graceful Degradation**: Handle errors without crashing
5. **Idempotency**: Commands can be run multiple times safely

---

## Code Structure

### File Organization

The launcher is a single Python file (`launcher.py`) organized into sections:

```python
# 1. Imports and Setup
import sys, os, subprocess, argparse, time
from pathlib import Path
from typing import List, Optional

# 2. Color Class (Terminal styling)
class Color:
    # ANSI color codes for terminal output

# 3. Output Functions
def print_header()    # Styled headers
def print_success()   # Green checkmark messages
def print_error()     # Red X messages
def print_info()      # Cyan info messages
def print_warning()   # Yellow warning messages

# 4. Utility Functions
def run_command()     # Execute shell commands

# 5. Validation Functions
def check_requirements()  # Verify Docker, etc.
def check_env_file()      # Validate .env configuration

# 6. Setup Functions
def setup_project()   # Initial project setup

# 7. Service Management Functions
def start_services()  # Start Docker containers
def stop_services()   # Stop containers
def restart_services() # Restart containers
def show_logs()       # Display logs
def show_status()     # Show service status

# 8. Utility Functions
def clean_project()   # Clean up artifacts
def run_tests()       # Execute tests

# 9. Main Entry Point
def main()            # Parse args and dispatch commands

# 10. Script Entry
if __name__ == '__main__':
    main()
```

---

## Core Components

### 1. Color Class

**Purpose**: Provides ANSI escape codes for terminal colors

**Implementation**:
```python
class Color:
    """Terminal colors for pretty output"""
    HEADER = '\033[95m'   # Magenta
    BLUE = '\033[94m'     # Blue
    CYAN = '\033[96m'     # Cyan
    GREEN = '\033[92m'    # Green
    YELLOW = '\033[93m'   # Yellow
    RED = '\033[91m'      # Red
    END = '\033[0m'       # Reset
    BOLD = '\033[1m'      # Bold
```

**Usage**:
```python
print(f"{Color.GREEN}Success!{Color.END}")
print(f"{Color.RED}Error occurred{Color.END}")
```

**Why ANSI codes?**
- Works on most terminals (macOS, Linux, Windows 10+)
- No external dependencies
- Fast and lightweight

---

### 2. Output Functions

#### print_header()

**Purpose**: Display section headers with borders

**Implementation**:
```python
def print_header(message: str):
    """Print a styled header message"""
    print(f"\n{Color.HEADER}{Color.BOLD}{'='*60}{Color.END}")
    print(f"{Color.HEADER}{Color.BOLD}{message:^60}{Color.END}")
    print(f"{Color.HEADER}{Color.BOLD}{'='*60}{Color.END}\n")
```

**Output example**:
```
============================================================
                  Starting Services
============================================================
```

#### print_success(), print_error(), print_info(), print_warning()

**Purpose**: Consistent, colored status messages

**Implementation**:
```python
def print_success(message: str):
    print(f"{Color.GREEN}✓ {message}{Color.END}")

def print_error(message: str):
    print(f"{Color.RED}✗ {message}{Color.END}")

def print_info(message: str):
    print(f"{Color.CYAN}ℹ {message}{Color.END}")

def print_warning(message: str):
    print(f"{Color.YELLOW}⚠ {message}{Color.END}")
```

**Why different functions?**
- Visual consistency
- Easy to scan output
- Semantic meaning (success vs error)

---

### 3. run_command() Function

**Purpose**: Execute shell commands safely with error handling

**Implementation**:
```python
def run_command(cmd: List[str], cwd: Optional[Path] = None) -> bool:
    """Run a shell command and return success status"""
    try:
        result = subprocess.run(
            cmd,                    # Command as list
            cwd=cwd,               # Working directory
            check=True,            # Raise exception on failure
            capture_output=True,   # Capture stdout/stderr
            text=True              # Return strings, not bytes
        )
        return True
    except subprocess.CalledProcessError as e:
        print_error(f"Command failed: {' '.join(cmd)}")
        if e.stderr:
            print(e.stderr)
        return False
```

**Key features**:
- Commands passed as lists (safer than strings)
- Optional working directory
- Captures and displays errors
- Returns boolean for success/failure

**Why subprocess.run()?**
- Part of Python standard library
- More secure than `os.system()`
- Better error handling than `subprocess.call()`
- Can capture output

---

### 4. Validation Functions

#### check_requirements()

**Purpose**: Verify required tools are installed

**Implementation**:
```python
def check_requirements() -> bool:
    """Check if required tools are installed"""
    print_header("Checking Requirements")

    requirements = {
        'docker': ['docker', '--version'],
        'docker-compose': ['docker-compose', '--version'],
        'python': ['python3', '--version'],
    }

    all_installed = True
    for name, cmd in requirements.items():
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            print_success(f"{name} is installed")
        except (subprocess.CalledProcessError, FileNotFoundError):
            print_error(f"{name} is NOT installed")
            all_installed = False

    return all_installed
```

**Why check requirements?**
- Fail fast with clear error messages
- Prevents cryptic Docker errors later
- Helps new developers identify missing tools

#### check_env_file()

**Purpose**: Validate `.env` file exists and has API keys

**Implementation**:
```python
def check_env_file() -> bool:
    """Check if .env file exists and has required variables"""
    print_header("Checking Environment Configuration")

    env_file = Path('.env')

    # Create from example if missing
    if not env_file.exists():
        print_warning(".env file not found")
        print_info("Creating .env from .env.example...")

        example_file = Path('.env.example')
        if example_file.exists():
            with open(example_file) as f:
                content = f.read()
            with open(env_file, 'w') as f:
                f.write(content)
            print_success(".env file created")
            print_warning("Please edit .env and add your API keys!")
            return False
        else:
            print_error(".env.example not found")
            return False

    # Check for required keys
    with open(env_file) as f:
        env_content = f.read()

    required_keys = ['NVIDIA_API_KEY', 'OPENAI_API_KEY']
    missing_keys = []

    for key in required_keys:
        # Check if key exists and isn't placeholder
        if key not in env_content or f"{key}=your_" in env_content:
            missing_keys.append(key)

    if missing_keys:
        print_warning(f"Missing or placeholder API keys: {', '.join(missing_keys)}")
        print_info("Please update your .env file with valid API keys")
        return False

    print_success("Environment configuration is valid")
    return True
```

**Validation logic**:
1. Check if `.env` exists
2. If not, create from `.env.example`
3. Check if required API keys are present
4. Check if keys are not placeholders (`your_api_key_here`)
5. Return `True` only if all checks pass

---

### 5. Docker Compose Integration

#### start_services()

**Purpose**: Launch all Docker containers

**Implementation**:
```python
def start_services(mode: str = 'dev', detached: bool = False) -> bool:
    """Start all services using Docker Compose"""
    print_header(f"Starting Services ({mode} mode)")

    # Build compose file list
    compose_files = ['-f', 'docker-compose.yml']
    if mode == 'dev':
        compose_files.extend(['-f', 'docker-compose.dev.yml'])

    # Build docker-compose command
    cmd = ['docker-compose'] + compose_files + ['up']
    if detached:
        cmd.append('-d')

    print_info("Building and starting containers...")
    print_info("This may take a few minutes on first run...")

    try:
        if detached:
            subprocess.run(cmd, check=True)
            print_success("Services started in background")

            # Show service URLs
            print_info("\nServices running at:")
            print(f"  • Frontend: {Color.CYAN}http://localhost:3000{Color.END}")
            print(f"  • Backend:  {Color.CYAN}http://localhost:8000{Color.END}")
            print(f"  • API Docs: {Color.CYAN}http://localhost:8000/docs{Color.END}")
            if mode == 'dev':
                print(f"  • Adminer:  {Color.CYAN}http://localhost:8080{Color.END}")

            # Show next steps
            print(f"\nView logs: {Color.YELLOW}python launcher.py logs{Color.END}")
            print(f"Stop services: {Color.YELLOW}python launcher.py stop{Color.END}")
        else:
            # Foreground mode
            print_info("Starting services... (Press Ctrl+C to stop)")
            subprocess.run(cmd)
        return True
    except subprocess.CalledProcessError:
        print_error("Failed to start services")
        return False
    except KeyboardInterrupt:
        # Handle Ctrl+C gracefully
        print_info("\nShutting down services...")
        stop_services()
        return True
```

**Key features**:
- Supports dev and prod modes
- Handles foreground and background execution
- Shows helpful URLs in detached mode
- Graceful Ctrl+C handling
- Clear error messages

**Docker Compose file layering**:
- `docker-compose.yml`: Base configuration (all modes)
- `docker-compose.dev.yml`: Dev-specific overrides (hot reload, debug)

**Why use `-f` flags?**
- Allows combining multiple compose files
- Overrides stack on top of base configuration
- Keeps dev and prod configs separate

---

## Command Flow

### Typical Command Execution Flow

```
User runs: python launcher.py start -d
                    ↓
┌───────────────────────────────────────────┐
│ 1. Parse Arguments (argparse)             │
│    - command = "start"                    │
│    - detach = True                        │
└──────────────────┬────────────────────────┘
                   ↓
┌───────────────────────────────────────────┐
│ 2. Print Banner                           │
│    "AI Babysitter System Launcher"       │
└──────────────────┬────────────────────────┘
                   ↓
┌───────────────────────────────────────────┐
│ 3. Validate Requirements                  │
│    - check_requirements()                 │
│    - Docker ✓                             │
│    - Docker Compose ✓                     │
│    - Python ✓                             │
└──────────────────┬────────────────────────┘
                   ↓
┌───────────────────────────────────────────┐
│ 4. Validate Environment                   │
│    - check_env_file()                     │
│    - .env exists ✓                        │
│    - API keys present ✓                   │
└──────────────────┬────────────────────────┘
                   ↓
┌───────────────────────────────────────────┐
│ 5. Execute Command                        │
│    - start_services(mode='dev',           │
│                     detached=True)        │
└──────────────────┬────────────────────────┘
                   ↓
┌───────────────────────────────────────────┐
│ 6. Build Docker Compose Command           │
│    ['docker-compose',                     │
│     '-f', 'docker-compose.yml',           │
│     '-f', 'docker-compose.dev.yml',       │
│     'up', '-d']                            │
└──────────────────┬────────────────────────┘
                   ↓
┌───────────────────────────────────────────┐
│ 7. Execute Docker Compose                 │
│    - subprocess.run()                     │
│    - Build images (if needed)             │
│    - Create containers                    │
│    - Start containers                     │
└──────────────────┬────────────────────────┘
                   ↓
┌───────────────────────────────────────────┐
│ 8. Show Results                           │
│    - Success message                      │
│    - Service URLs                         │
│    - Next steps                           │
└──────────────────┬────────────────────────┘
                   ↓
┌───────────────────────────────────────────┐
│ 9. Exit                                   │
│    - sys.exit(0) for success              │
│    - sys.exit(1) for failure              │
└───────────────────────────────────────────┘
```

---

## Error Handling

### Strategy

The launcher uses multiple error handling strategies:

#### 1. Pre-flight Validation

**Purpose**: Catch errors before execution

```python
# Check requirements first
if not check_requirements():
    sys.exit(1)  # Exit before trying to start

# Check configuration
if not check_env_file():
    print_warning("Starting anyway, but some features may not work")
```

**Benefits**:
- Prevents cryptic errors later
- Clear error messages upfront
- User knows what to fix

#### 2. Try-Except Blocks

**Purpose**: Handle runtime errors gracefully

```python
try:
    subprocess.run(cmd, check=True)
    print_success("Command succeeded")
    return True
except subprocess.CalledProcessError as e:
    print_error(f"Command failed: {' '.join(cmd)}")
    if e.stderr:
        print(e.stderr)
    return False
except FileNotFoundError:
    print_error("Command not found")
    return False
```

**Benefits**:
- Prevents crashes
- Shows helpful error messages
- Returns status for conditional logic

#### 3. Boolean Return Values

**Purpose**: Allow callers to handle failures

```python
def start_services() -> bool:
    # ... do work ...
    if success:
        return True
    else:
        return False

# Caller can check result
if not start_services():
    sys.exit(1)
```

**Benefits**:
- Clear success/failure indication
- Enables conditional logic
- Composable functions

#### 4. Exit Codes

**Purpose**: Communicate status to shell

```python
# In main()
success = execute_command(args.command)
sys.exit(0 if success else 1)
```

**Usage in shell scripts**:
```bash
if python launcher.py start; then
    echo "Started successfully"
else
    echo "Failed to start"
    exit 1
fi
```

---

## Extension Guide

### Adding a New Command

**Step 1**: Add command to choices

```python
parser.add_argument(
    'command',
    choices=['setup', 'start', 'stop', 'restart',
             'logs', 'status', 'test', 'clean',
             'my_new_command'],  # ← Add here
    help='Command to execute'
)
```

**Step 2**: Create handler function

```python
def my_new_command() -> bool:
    """Description of what this command does"""
    print_header("My New Command")

    # Your logic here
    print_info("Doing something...")

    # Execute operations
    success = run_command(['some', 'command'])

    if success:
        print_success("Command completed")
        return True
    else:
        print_error("Command failed")
        return False
```

**Step 3**: Add to command router in main()

```python
def main():
    # ... existing code ...

    elif args.command == 'my_new_command':
        success = my_new_command()

    sys.exit(0 if success else 1)
```

**Step 4**: Update help text

```python
parser = argparse.ArgumentParser(
    # ... existing args ...
    epilog="""
Examples:
  python launcher.py my_new_command   # Description
  # ... other examples ...
    """
)
```

### Adding Command Options

**Example**: Add `--verbose` flag

```python
# In main()
parser.add_argument(
    '--verbose', '-v',
    action='store_true',
    help='Enable verbose output'
)

# Use in functions
def start_services(mode: str, detached: bool, verbose: bool = False):
    if verbose:
        print_info("Verbose output enabled")
        # Show more details
```

### Adding Validation Checks

**Example**: Check for Node.js

```python
def check_requirements() -> bool:
    requirements = {
        'docker': ['docker', '--version'],
        'docker-compose': ['docker-compose', '--version'],
        'python': ['python3', '--version'],
        'node': ['node', '--version'],  # ← Add check
    }

    # Rest of function unchanged
```

---

## Technical Details

### Subprocess Management

**Why subprocess.run()?**
- Modern Python 3.5+ API
- Better than `os.system()` (more secure)
- Better than `subprocess.call()` (more features)
- Captures output and errors

**Security considerations**:
```python
# ✅ GOOD: Command as list (safe)
subprocess.run(['docker', 'ps'], check=True)

# ❌ BAD: Command as string (shell injection risk)
subprocess.run('docker ps', shell=True)  # DON'T DO THIS
```

**Capturing output**:
```python
result = subprocess.run(
    ['docker', 'ps'],
    capture_output=True,
    text=True
)
print(result.stdout)  # Standard output
print(result.stderr)  # Error output
print(result.returncode)  # Exit code
```

### Path Handling

**Why pathlib.Path?**
- Cross-platform (works on Windows, macOS, Linux)
- Object-oriented API
- Better than string concatenation

```python
from pathlib import Path

# Create paths
backend_path = Path('backend')
requirements = backend_path / 'requirements.txt'

# Check existence
if requirements.exists():
    print("File found")

# Create directories
Path('logs').mkdir(parents=True, exist_ok=True)
```

### Type Hints

**Why use type hints?**
- Better IDE autocomplete
- Catch bugs before runtime
- Self-documenting code

```python
from typing import List, Optional

def run_command(
    cmd: List[str],           # Must be list of strings
    cwd: Optional[Path] = None  # Can be Path or None
) -> bool:                     # Returns boolean
    # ...
```

---

## Performance Considerations

### Why is first start slow?

1. **Docker image building**: Compiles backend and frontend
2. **Dependency installation**: npm install, pip install
3. **Volume mounting**: Sets up shared directories

**Subsequent starts are faster** because:
- Images are cached
- Dependencies already installed
- Only containers need to start

### Optimization tips

**Use detached mode**:
```bash
python launcher.py start -d  # Faster than foreground
```

**Build images separately**:
```bash
docker-compose build  # Build without starting
python launcher.py start -d  # Start pre-built images
```

**Clean old images**:
```bash
docker system prune -a  # Remove unused images
```

---

## Security Considerations

### API Key Protection

The launcher helps protect API keys:

1. **Never commits `.env`**: `.gitignore` includes `.env`
2. **Uses `.env.example`**: Template without real keys
3. **Validates keys**: Checks for placeholders

**Best practices**:
```bash
# .env (never committed)
NVIDIA_API_KEY=nvapi-real-key-here

# .env.example (committed)
NVIDIA_API_KEY=your_nvidia_api_key_here
```

### Subprocess Security

**Safe command execution**:
```python
# ✅ SAFE: List prevents injection
cmd = ['docker', 'exec', container_name, 'ls']
subprocess.run(cmd, check=True)

# ❌ UNSAFE: String with user input
user_input = get_user_input()
subprocess.run(f'docker exec {user_input} ls', shell=True)
```

---

## Debugging the Launcher

### Enable debug output

Add print statements:
```python
def start_services(mode: str, detached: bool):
    print(f"DEBUG: mode={mode}, detached={detached}")
    # ... rest of function
```

### Test commands without executing

Modify `run_command()`:
```python
def run_command(cmd: List[str], cwd: Optional[Path] = None) -> bool:
    print(f"Would run: {' '.join(cmd)}")
    return True  # Simulate success
```

### Check Docker Compose directly

```bash
# See what launcher does
docker-compose -f docker-compose.yml -f docker-compose.dev.yml config

# Test commands manually
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

---

## Future Improvements

Potential enhancements:

1. **Configuration file**: Support `launcher.config.yml` for customization
2. **Parallel operations**: Start services concurrently
3. **Health checks**: Verify services are responding
4. **Automatic migrations**: Run database migrations on start
5. **Log filtering**: Built-in grep for logs
6. **Service-specific commands**: `python launcher.py restart backend`
7. **Plugin system**: Allow custom commands
8. **Progress indicators**: Show build/start progress
9. **Rollback**: Restore previous state on failure
10. **Remote deployment**: Deploy to staging/production

---

## Related Documentation

- **[Overview](01-overview.md)**: High-level introduction
- **[How to Use](02-how-to-use.md)**: User guide and command reference

---

## Contributing

To modify the launcher:

1. **Test changes**: Run all commands to verify
2. **Update docs**: Keep documentation in sync
3. **Add error handling**: Anticipate failure cases
4. **Follow conventions**: Match existing code style
5. **Add type hints**: Help others understand your code

---

**Version**: 1.0.0
**Last Updated**: 2025-10-29
**Python Version**: 3.8+
