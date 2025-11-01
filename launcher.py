#!/usr/bin/env python3
"""
AI Babysitter System - Main Launcher
Run the entire application stack with a single command.
"""

import sys
import os
import subprocess
import argparse
import time
import webbrowser
from pathlib import Path
from typing import List, Optional

try:
    import requests
except ImportError:
    requests = None  # Optional dependency for Riva health check

class Color:
    """Terminal colors for pretty output"""
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(message: str):
    """Print a styled header message"""
    print(f"\n{Color.HEADER}{Color.BOLD}{'='*60}{Color.END}")
    print(f"{Color.HEADER}{Color.BOLD}{message:^60}{Color.END}")
    print(f"{Color.HEADER}{Color.BOLD}{'='*60}{Color.END}\n")

def print_success(message: str):
    """Print success message"""
    print(f"{Color.GREEN}✓ {message}{Color.END}")

def print_error(message: str):
    """Print error message"""
    print(f"{Color.RED}✗ {message}{Color.END}")

def print_info(message: str):
    """Print info message"""
    print(f"{Color.CYAN}ℹ {message}{Color.END}")

def print_warning(message: str):
    """Print warning message"""
    print(f"{Color.YELLOW}⚠ {message}{Color.END}")

def run_command(cmd: List[str], cwd: Optional[Path] = None) -> bool:
    """Run a shell command and return success status"""
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            check=True,
            capture_output=True,
            text=True
        )
        return True
    except subprocess.CalledProcessError as e:
        print_error(f"Command failed: {' '.join(cmd)}")
        if e.stderr:
            print(e.stderr)
        return False

def check_command_exists(command: str) -> bool:
    """Check if a command exists in PATH"""
    try:
        subprocess.run(['which', command], check=True, capture_output=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def get_python_executable() -> str:
    """Get the best available Python executable"""
    for py in ['python3', 'python']:
        if check_command_exists(py):
            try:
                result = subprocess.run([py, '--version'], capture_output=True, text=True, check=True)
                version = result.stdout.strip()
                # Check for Python 3.10+
                if 'Python 3.' in version:
                    major, minor = map(int, version.split()[1].split('.')[:2])
                    if major == 3 and minor >= 10:
                        return py
            except:
                continue
    return 'python3'  # fallback

def check_requirements() -> bool:
    """Check if required tools are installed"""
    print_header("Checking Requirements")

    requirements = {
        'docker': ['docker', '--version'],
        'docker-compose': ['docker-compose', '--version'],
        'python3': ['python3', '--version'],
        'node': ['node', '--version'],
        'npm': ['npm', '--version'],
    }

    all_installed = True
    for name, cmd in requirements.items():
        try:
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            version = result.stdout.strip().split('\n')[0]
            print_success(f"{name} is installed ({version})")
        except (subprocess.CalledProcessError, FileNotFoundError):
            print_error(f"{name} is NOT installed")
            all_installed = False

            # Provide installation hints
            if name == 'docker':
                print_info("Install Docker Desktop from: https://docs.docker.com/get-docker/")
            elif name == 'docker-compose':
                print_info("Install Docker Compose from: https://docs.docker.com/compose/install/")
            elif name == 'python3':
                print_info("Install Python 3.10+ from: https://www.python.org/downloads/")
            elif name == 'node' or name == 'npm':
                print_info("Install Node.js (includes npm) from: https://nodejs.org/")

    # Check for NVIDIA GPU (optional, for Riva TTS)
    try:
        subprocess.run(['nvidia-smi'], check=True, capture_output=True)
        print_success("NVIDIA GPU detected (Riva TTS available)")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print_warning("NVIDIA GPU not detected (Riva TTS unavailable, will use fallback)")

    # Check Python version
    if all_installed:
        try:
            result = subprocess.run(['python3', '--version'], capture_output=True, text=True, check=True)
            version_str = result.stdout.strip().split()[1]
            major, minor = map(int, version_str.split('.')[:2])
            if major < 3 or (major == 3 and minor < 10):
                print_error(f"Python {version_str} is too old. Python 3.10+ required.")
                all_installed = False
            else:
                print_success(f"Python version {version_str} is compatible")
        except Exception as e:
            print_warning(f"Could not verify Python version: {e}")

    return all_installed

def create_default_env_file() -> bool:
    """Create a default .env file with placeholders"""
    print_info("Creating default .env file...")

    default_env = """# AI Babysitter - Environment Configuration
# Created by launcher.py

# ============================================
# REQUIRED API KEYS
# ============================================

# NVIDIA Nemotron API Key (Required)
# Get yours at: https://build.nvidia.com/
NVIDIA_API_KEY=your_nvidia_api_key_here

# OpenAI API Key (Required for vision features)
# Get yours at: https://platform.openai.com/
OPENAI_API_KEY=your_openai_api_key_here

# ============================================
# OPTIONAL API KEYS
# ============================================

# ElevenLabs API Key (Optional - Premium TTS)
# ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Anthropic API Key (Optional - Alternative vision)
# ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Twilio (Optional - Emergency calling)
# TWILIO_ACCOUNT_SID=your_twilio_sid_here
# TWILIO_AUTH_TOKEN=your_twilio_token_here
# TWILIO_PHONE_NUMBER=your_twilio_phone_here

# ============================================
# SERVER CONFIGURATION
# ============================================

BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
FRONTEND_PORT=3000

# ============================================
# LOGGING CONFIGURATION
# ============================================

LOG_LEVEL=INFO
LOG_FORMAT=json
LOG_REQUESTS=true

# ============================================
# CORS CONFIGURATION
# ============================================

CORS_ORIGINS=*
"""

    try:
        env_file = Path('.env')
        with open(env_file, 'w') as f:
            f.write(default_env)
        print_success(".env file created with default configuration")
        return True
    except Exception as e:
        print_error(f"Failed to create .env file: {e}")
        return False

def check_env_file() -> bool:
    """Check if .env file exists and has required variables"""
    print_header("Checking Environment Configuration")

    env_file = Path('.env')

    # Check if .env exists
    if not env_file.exists():
        print_warning(".env file not found")

        # Try to copy from .env.example
        example_file = Path('.env.example')
        if example_file.exists():
            print_info("Creating .env from .env.example...")
            try:
                with open(example_file) as f:
                    content = f.read()
                with open(env_file, 'w') as f:
                    f.write(content)
                print_success(".env file created from .env.example")
            except Exception as e:
                print_error(f"Failed to copy .env.example: {e}")
                create_default_env_file()
        else:
            # Create default .env
            create_default_env_file()

        print_warning("\nIMPORTANT: Please edit .env and add your API keys!")
        print_info(f"\n{Color.CYAN}Get your API keys:{Color.END}")
        print_info(f"  • NVIDIA: {Color.YELLOW}https://build.nvidia.com/{Color.END}")
        print_info(f"  • OpenAI: {Color.YELLOW}https://platform.openai.com/{Color.END}")
        print_info(f"\n{Color.CYAN}Edit .env file:{Color.END}")
        print_info(f"  {Color.YELLOW}nano .env{Color.END}  # or use your preferred editor")
        return False

    # Check for required keys
    with open(env_file) as f:
        env_content = f.read()

    required_keys = ['NVIDIA_API_KEY', 'OPENAI_API_KEY']
    missing_keys = []
    placeholder_keys = []

    for key in required_keys:
        if key not in env_content:
            missing_keys.append(key)
        elif f"{key}=your_" in env_content or f"{key}=nvapi-" in env_content.replace(f"{key}=nvapi-xxxxxxxx", "PLACEHOLDER") or f"{key}=sk-" in env_content.replace(f"{key}=sk-xxxxxxxx", "PLACEHOLDER"):
            # Check if it's a real key or placeholder
            lines = env_content.split('\n')
            for line in lines:
                if line.startswith(f"{key}="):
                    value = line.split('=', 1)[1].strip()
                    if 'your_' in value or 'xxxx' in value or len(value) < 20:
                        placeholder_keys.append(key)
                    break

    if missing_keys:
        print_warning(f"Missing API keys in .env: {', '.join(missing_keys)}")
        print_info("Please add these keys to your .env file")
        return False

    if placeholder_keys:
        print_warning(f"Placeholder API keys detected: {', '.join(placeholder_keys)}")
        print_info("Please replace with valid API keys")
        print_info(f"\n{Color.CYAN}Get your API keys:{Color.END}")
        print_info(f"  • NVIDIA: {Color.YELLOW}https://build.nvidia.com/{Color.END}")
        print_info(f"  • OpenAI: {Color.YELLOW}https://platform.openai.com/{Color.END}")
        return False

    print_success("Environment configuration looks valid")
    return True

def check_riva_tts() -> bool:
    """Check if NVIDIA Riva TTS is configured and running"""
    riva_dir = Path.home() / 'riva'

    # Check if Riva is configured
    if not riva_dir.exists():
        return False

    config_file = riva_dir / 'config.sh'
    if not config_file.exists():
        return False

    # Check if Riva server is running
    if requests is None:
        # Fallback: check if Docker container is running
        try:
            result = subprocess.run(
                ['docker', 'ps', '--filter', 'name=riva-speech', '--format', '{{.Status}}'],
                capture_output=True,
                text=True
            )
            return 'Up' in result.stdout
        except:
            return False

    try:
        response = requests.get('http://localhost:8001/v1/health/ready', timeout=2)
        return response.status_code == 200 and response.json().get('ready', False)
    except:
        return False

def auto_setup_riva() -> bool:
    """Automatically set up NVIDIA Riva TTS if not already configured"""
    print_header("NVIDIA Riva TTS Auto-Setup")

    riva_dir = Path.home() / 'riva'
    setup_script = Path('setup_riva_local.sh')

    # Check if setup script exists
    if not setup_script.exists():
        print_error("setup_riva_local.sh not found")
        return False

    # Run setup script
    print_info("Running Riva setup (this creates ~/riva directory and downloads scripts)...")
    try:
        subprocess.run(['bash', str(setup_script)], check=True)
        print_success("Riva setup script completed")
    except subprocess.CalledProcessError:
        print_error("Riva setup failed")
        return False

    # Prompt for NGC API key
    print_info("\nTo complete Riva setup, you need an NVIDIA NGC API key")
    print_info(f"Get your key at: {Color.CYAN}https://ngc.nvidia.com/setup/api-key{Color.END}\n")

    ngc_key = input(f"{Color.YELLOW}Enter your NGC API key (or press Enter to skip): {Color.END}").strip()

    if not ngc_key:
        print_warning("Skipping NGC API key setup")
        print_info(f"You can add it later: {Color.YELLOW}nano ~/riva/config.sh{Color.END}")
        return False

    # Update config.sh with NGC API key
    config_file = riva_dir / 'config.sh'
    if config_file.exists():
        try:
            with open(config_file, 'r') as f:
                config_content = f.read()

            # Replace placeholder with actual key
            config_content = config_content.replace(
                'NGC_API_KEY="YOUR_NGC_API_KEY_HERE"',
                f'NGC_API_KEY="{ngc_key}"'
            )

            with open(config_file, 'w') as f:
                f.write(config_content)

            print_success("NGC API key configured")
        except Exception as e:
            print_error(f"Failed to update config: {e}")
            return False

    # Download models
    print_info("\nDownloading Riva TTS models (~5GB, this may take 10-30 minutes)...")
    print_warning("You can skip this now and run it later: cd ~/riva && bash riva_init.sh")

    response = input(f"{Color.YELLOW}Download models now? (yes/no): {Color.END}").strip().lower()

    if response == 'yes':
        print_info("Downloading models... (this will take a while)")
        try:
            subprocess.run(
                ['bash', 'riva_init.sh'],
                cwd=riva_dir,
                check=True
            )
            print_success("Riva models downloaded successfully")
            return True
        except subprocess.CalledProcessError:
            print_error("Model download failed")
            print_info(f"You can retry later: {Color.YELLOW}cd ~/riva && bash riva_init.sh{Color.END}")
            return False
    else:
        print_info(f"Skipping model download")
        print_info(f"Download later: {Color.YELLOW}cd ~/riva && bash riva_init.sh{Color.END}")
        return False

def start_riva_tts(auto_setup: bool = True) -> bool:
    """Start NVIDIA Riva TTS server if available"""
    print_info("Checking NVIDIA Riva TTS...")

    riva_dir = Path.home() / 'riva'

    # Check if Riva is set up
    if not riva_dir.exists() or not (riva_dir / 'config.sh').exists():
        if auto_setup:
            print_info("NVIDIA Riva TTS not configured, starting auto-setup...")
            if auto_setup_riva():
                print_success("Riva auto-setup completed!")
                # Continue to start Riva
            else:
                print_warning("Riva auto-setup incomplete or skipped")
                print_info(f"Complete setup later: {Color.YELLOW}bash setup_riva_local.sh{Color.END}")
                return False
        else:
            print_warning("NVIDIA Riva TTS not set up")
            print_info(f"Run: {Color.YELLOW}bash setup_riva_local.sh{Color.END} to set up Riva")
            return False

    # Check if already running
    if check_riva_tts():
        print_success("NVIDIA Riva TTS already running")
        return True

    # Try to start Riva
    print_info("Starting NVIDIA Riva TTS server...")
    start_script = riva_dir / 'riva_start.sh'

    if not start_script.exists():
        print_warning("Riva start script not found")
        return False

    try:
        # Start Riva in background
        subprocess.Popen(
            ['bash', str(start_script)],
            cwd=riva_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        # Wait for server to start (max 60 seconds)
        print_info("Waiting for Riva TTS to start (this may take 2-3 minutes)...")
        for i in range(60):
            time.sleep(3)
            if check_riva_tts():
                print_success("NVIDIA Riva TTS server started successfully")
                print_info(f"  • TTS gRPC: {Color.CYAN}localhost:50051{Color.END}")
                print_info(f"  • TTS HTTP:  {Color.CYAN}http://localhost:8001{Color.END}")
                return True
            if i % 5 == 0:
                print_info(f"  Still waiting... ({i*3}s)")

        print_warning("Riva TTS took too long to start, continuing without it")
        return False

    except Exception as e:
        print_warning(f"Failed to start Riva TTS: {e}")
        return False

def stop_riva_tts() -> bool:
    """Stop NVIDIA Riva TTS server"""
    riva_dir = Path.home() / 'riva'

    if not check_riva_tts():
        return True  # Already stopped

    print_info("Stopping NVIDIA Riva TTS server...")
    stop_script = riva_dir / 'riva_stop.sh'

    if stop_script.exists():
        try:
            subprocess.run(['bash', str(stop_script)], cwd=riva_dir, check=True)
            print_success("NVIDIA Riva TTS stopped")
            return True
        except:
            pass

    # Fallback: stop Docker container directly
    try:
        subprocess.run(['docker', 'stop', 'riva-speech'], check=True, capture_output=True)
        print_success("NVIDIA Riva TTS stopped")
        return True
    except:
        print_warning("Could not stop Riva TTS")
        return False

def wait_for_service_and_open_browser(url: str = "http://localhost:3000", max_wait: int = 60) -> bool:
    """Wait for service to be ready and automatically open browser"""
    print_info(f"Waiting for service to be ready at {url}...")

    for i in range(max_wait):
        try:
            if requests:
                # Try to connect to the service
                response = requests.get(url, timeout=1)
                if response.status_code == 200:
                    print_success(f"Service is ready at {url}")
                    print_info("Opening browser...")
                    webbrowser.open(url)
                    return True
            else:
                # Fallback without requests library - just wait and open
                if i >= 10:  # Wait at least 10 seconds
                    print_success(f"Opening browser at {url}")
                    webbrowser.open(url)
                    return True
        except:
            pass

        if i % 5 == 0 and i > 0:
            print_info(f"  Still waiting... ({i}s)")

        time.sleep(1)

    print_warning(f"Service did not respond after {max_wait}s, but may still be starting")
    print_info(f"You can manually open: {Color.CYAN}{url}{Color.END}")
    return False

def initialize_database() -> bool:
    """Initialize the database with all required tables"""
    print_info("Initializing database...")

    backend_path = Path('backend').resolve()

    # Check if we're in the right directory
    if not backend_path.exists():
        print_error("Backend directory not found")
        return False

    # Find Python executable (prefer venv if available)
    venv_python = backend_path / 'venv' / 'bin' / 'python'
    python_exec = str(venv_python) if venv_python.exists() else sys.executable

    # Initialize database using Python subprocess
    try:
        # Run database initialization script
        subprocess.run(
            [python_exec, '-c',
             'from app.database.db import init_db; init_db(); print("Database initialized")'],
            cwd=backend_path,
            capture_output=True,
            text=True,
            check=True
        )
        print_success("Database initialized successfully")
        return True
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to initialize database: {e.stderr if e.stderr else str(e)}")
        return False
    except Exception as e:
        print_error(f"Failed to initialize database: {e}")
        return False

def setup_venv() -> bool:
    """Set up Python virtual environment for backend"""
    print_info("Setting up Python virtual environment...")

    backend_path = Path('backend')
    venv_path = backend_path / 'venv'

    # Check if venv already exists
    if venv_path.exists():
        print_success("Virtual environment already exists")
        return True

    # Create virtual environment
    python_exec = get_python_executable()
    try:
        print_info(f"Creating virtual environment with {python_exec}...")
        subprocess.run(
            [python_exec, '-m', 'venv', 'venv'],
            cwd=backend_path,
            check=True,
            capture_output=True
        )
        print_success("Virtual environment created")
        return True
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to create virtual environment: {e.stderr.decode() if e.stderr else str(e)}")
        return False

def install_backend_dependencies() -> bool:
    """Install Python backend dependencies"""
    print_info("Installing backend Python dependencies...")
    print_warning("This may take several minutes...")

    backend_path = Path('backend').resolve()
    venv_path = backend_path / 'venv'

    # Determine pip executable
    if venv_path.exists():
        if sys.platform == 'win32':
            pip_exec = str(venv_path / 'Scripts' / 'pip')
        else:
            pip_exec = str(venv_path / 'bin' / 'pip')
    else:
        pip_exec = 'pip3'

    requirements_file = backend_path / 'requirements.txt'
    if not requirements_file.exists():
        print_error("requirements.txt not found in backend/")
        return False

    try:
        # Upgrade pip first
        print_info("Upgrading pip...")
        subprocess.run(
            [pip_exec, 'install', '--upgrade', 'pip'],
            check=True,
            capture_output=True
        )

        # Install requirements
        print_info("Installing Python packages from requirements.txt...")
        subprocess.run(
            [pip_exec, 'install', '-r', str(requirements_file)],
            cwd=backend_path,
            check=True,
            capture_output=True,
            text=True
        )
        print_success("Backend dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print_error("Failed to install backend dependencies")
        if e.stderr:
            print(e.stderr)
        print_info(f"\nYou can try manually:")
        print_info(f"  cd backend")
        print_info(f"  source venv/bin/activate  # or venv\\Scripts\\activate on Windows")
        print_info(f"  pip install -r requirements.txt")
        return False

def install_frontend_dependencies() -> bool:
    """Install Node.js frontend dependencies"""
    print_info("Installing frontend Node.js dependencies...")
    print_warning("This may take several minutes...")

    frontend_path = Path('frontend').resolve()

    if not (frontend_path / 'package.json').exists():
        print_error("package.json not found in frontend/")
        return False

    try:
        # Check for package-lock.json or node_modules
        node_modules = frontend_path / 'node_modules'
        if node_modules.exists():
            print_info("node_modules already exists, running npm install to ensure up-to-date...")

        # Run npm install
        print_info("Running npm install...")
        subprocess.run(
            ['npm', 'install'],
            cwd=frontend_path,
            check=True,
            capture_output=True,
            text=True
        )
        print_success("Frontend dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print_error("Failed to install frontend dependencies")
        if e.stderr:
            print(e.stderr)
        print_info(f"\nYou can try manually:")
        print_info(f"  cd frontend")
        print_info(f"  npm install")
        return False

def setup_project() -> bool:
    """Initial project setup with comprehensive dependency installation"""
    print_header("Setting Up Project")

    # Create necessary directories
    print_info("Creating project directories...")
    dirs = ['backend/data', 'frontend/build', 'logs', 'nginx/ssl']
    for dir_path in dirs:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
    print_success("Project directories created")

    # Set up Python virtual environment
    if not setup_venv():
        print_warning("Virtual environment setup failed, will try using system Python")

    # Install backend dependencies
    if not install_backend_dependencies():
        print_error("Backend dependency installation failed!")
        return False

    # Install frontend dependencies
    if not install_frontend_dependencies():
        print_error("Frontend dependency installation failed!")
        return False

    # Initialize database
    print_info("Initializing database...")
    if not initialize_database():
        print_warning("Database initialization failed, but continuing...")
        print_info("Database will be initialized on first backend start")

    print_success("\nProject setup completed successfully!")
    print_info("\nNext steps:")
    print_info("  1. Configure your .env file with API keys")
    print_info("  2. Run: python launcher.py start")

    return True

def check_and_install_dependencies() -> bool:
    """Check if dependencies are installed, install if missing"""
    # Create necessary directories first
    print_info("Ensuring project directories exist...")
    dirs = ['backend/data', 'frontend/build', 'logs', 'nginx/ssl']
    for dir_path in dirs:
        Path(dir_path).mkdir(parents=True, exist_ok=True)

    # Check if .env exists
    if not Path('.env').exists():
        print_warning(".env file not found, creating default...")
        create_default_env_file()
        print_warning("Please edit .env and add your API keys!")
        print_info(f"  • NVIDIA: {Color.YELLOW}https://build.nvidia.com/{Color.END}")
        print_info(f"  • OpenAI: {Color.YELLOW}https://platform.openai.com/{Color.END}")

    backend_venv = Path('backend/venv').exists()
    frontend_node_modules = Path('frontend/node_modules').exists()

    needs_setup = False

    if not backend_venv:
        print_warning("Backend virtual environment not found")
        needs_setup = True

    if not frontend_node_modules:
        print_warning("Frontend node_modules not found")
        needs_setup = True

    if needs_setup:
        print_info("Installing missing dependencies...")
        print_warning("This may take several minutes on first run...")

        # Set up venv if needed
        if not backend_venv:
            if not setup_venv():
                print_warning("Virtual environment setup failed, continuing with system Python")

        # Install backend dependencies if needed
        if not backend_venv or not (Path('backend/venv/lib').exists() or Path('backend/venv/Lib').exists()):
            if not install_backend_dependencies():
                print_error("Backend dependency installation failed!")
                return False

        # Install frontend dependencies if needed
        if not frontend_node_modules:
            if not install_frontend_dependencies():
                print_error("Frontend dependency installation failed!")
                return False

        # Initialize database
        print_info("Initializing database...")
        if not initialize_database():
            print_warning("Database initialization failed, will retry on backend start")

        print_success("Dependencies installed successfully!")

    return True

def start_services(mode: str = 'dev', detached: bool = False, with_riva: bool = True, auto_setup_riva: bool = True, open_browser: bool = True) -> bool:
    """Start all services using Docker Compose"""
    print_header(f"Starting Services ({mode} mode)")

    # Auto-install dependencies if needed
    if not check_and_install_dependencies():
        print_error("Failed to install dependencies")
        return False

    # Start NVIDIA Riva TTS first if available and requested
    riva_started = False
    if with_riva:
        riva_started = start_riva_tts(auto_setup=auto_setup_riva)

    compose_files = ['-f', 'docker-compose.yml']
    if mode == 'dev':
        compose_files.extend(['-f', 'docker-compose.dev.yml'])

    cmd = ['docker-compose'] + compose_files + ['up']
    if detached:
        cmd.append('-d')

    print_info("Building and starting containers...")
    print_info("This may take a few minutes on first run...")

    try:
        if detached:
            subprocess.run(cmd, check=True)
            print_success("Services started in background")
            print_info("\nServices running at:")
            print(f"  • Frontend: {Color.CYAN}http://localhost:3000{Color.END}")
            print(f"  • Backend:  {Color.CYAN}http://localhost:8000{Color.END}")
            print(f"  • API Docs: {Color.CYAN}http://localhost:8000/docs{Color.END}")
            if mode == 'dev':
                print(f"  • Adminer:  {Color.CYAN}http://localhost:8080{Color.END}")
            if riva_started:
                print(f"  • Riva TTS: {Color.CYAN}http://localhost:8001{Color.END} (gRPC: 50051)")
            print(f"\nView logs: {Color.YELLOW}python launcher.py logs{Color.END}")
            print(f"Stop services: {Color.YELLOW}python launcher.py stop{Color.END}")

            # Automatically open browser if requested
            if open_browser:
                print()  # Empty line for spacing
                wait_for_service_and_open_browser("http://localhost:3000")
        else:
            print_info("Starting services... (Press Ctrl+C to stop)")
            subprocess.run(cmd)
        return True
    except subprocess.CalledProcessError:
        print_error("Failed to start services")
        return False
    except KeyboardInterrupt:
        print_info("\nShutting down services...")
        stop_services()
        return True

def stop_services() -> bool:
    """Stop all services"""
    print_header("Stopping Services")

    # Stop Riva TTS if running
    stop_riva_tts()

    cmd = ['docker-compose', '-f', 'docker-compose.yml', '-f', 'docker-compose.dev.yml', 'down']

    try:
        subprocess.run(cmd, check=True)
        print_success("Services stopped")
        return True
    except subprocess.CalledProcessError:
        print_error("Failed to stop services")
        return False

def restart_services(mode: str = 'dev', open_browser: bool = True) -> bool:
    """Restart all services"""
    print_header("Restarting Services")

    if stop_services():
        time.sleep(2)
        return start_services(mode, detached=True, open_browser=open_browser)
    return False

def show_logs(service: Optional[str] = None, follow: bool = True) -> bool:
    """Show service logs"""
    cmd = ['docker-compose', 'logs']
    if follow:
        cmd.append('-f')
    if service:
        cmd.append(service)

    try:
        subprocess.run(cmd)
        return True
    except KeyboardInterrupt:
        return True
    except subprocess.CalledProcessError:
        print_error("Failed to show logs")
        return False

def show_status() -> bool:
    """Show status of all services"""
    print_header("Service Status")

    cmd = ['docker-compose', 'ps']
    try:
        subprocess.run(cmd, check=True)
        return True
    except subprocess.CalledProcessError:
        print_error("Failed to get service status")
        return False

def clean_project() -> bool:
    """Clean up Docker containers, volumes, and build artifacts"""
    print_header("Cleaning Project")

    print_warning("This will remove all containers, volumes, and build artifacts!")
    response = input("Are you sure? (yes/no): ")

    if response.lower() != 'yes':
        print_info("Cleanup cancelled")
        return False

    # Stop services
    stop_services()

    # Remove volumes
    print_info("Removing Docker volumes...")
    subprocess.run(['docker-compose', 'down', '-v'], check=True)

    # Clean frontend build
    print_info("Cleaning frontend build...")
    subprocess.run(['rm', '-rf', 'frontend/build', 'frontend/node_modules'])

    # Clean backend cache
    print_info("Cleaning backend cache...")
    subprocess.run(['rm', '-rf', 'backend/__pycache__', 'backend/.pytest_cache'])

    print_success("Project cleaned")
    return True

def run_tests(test_type: str = 'all') -> bool:
    """Run tests"""
    print_header(f"Running {test_type} Tests")

    if test_type in ['all', 'backend']:
        print_info("Running backend tests...")
        if not run_command(['pytest', 'tests/', '-v'], cwd=Path('backend')):
            return False

    if test_type in ['all', 'frontend']:
        print_info("Running frontend tests...")
        if not run_command(['npm', 'test', '--', '--watchAll=false'], cwd=Path('frontend')):
            return False

    print_success("All tests passed")
    return True

def is_first_run() -> bool:
    """Check if this is the first run of the launcher"""
    # Check for indicators that setup has been completed
    backend_venv = Path('backend/venv').exists()
    frontend_node_modules = Path('frontend/node_modules').exists()
    env_file = Path('.env').exists()

    # If none of these exist, it's likely a first run
    return not (backend_venv or frontend_node_modules or env_file)

def auto_setup_on_first_run() -> bool:
    """Automatically run setup on first run"""
    print_header("First Run Detected")
    print_info("Welcome to AI Babysitter System!")
    print_info("This appears to be your first time running the launcher.")
    print_info("Let's set up the project automatically...\n")

    # Check system requirements
    if not check_requirements():
        print_error("\nMissing required system dependencies!")
        print_info("Please install the missing tools and try again.")
        return False

    # Check/create .env file
    check_env_file()

    # Run setup
    if not setup_project():
        print_error("\nSetup failed!")
        return False

    print_success("\n" + "="*60)
    print_success("Setup completed successfully!")
    print_success("="*60)
    print_info("\nNext steps:")
    print_info(f"  1. Edit .env file and add your API keys")
    print_info(f"     {Color.YELLOW}nano .env{Color.END}")
    print_info(f"  2. Start the application:")
    print_info(f"     {Color.YELLOW}python launcher.py start{Color.END}")

    return True

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='AI Babysitter System - Unified Launcher',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python launcher.py                    # Auto-setup on first run, then start (detached + auto-open)
  python launcher.py setup              # Manually run setup (install dependencies)
  python launcher.py start              # Start all services in background (detached mode - DEFAULT)
  python launcher.py start -f           # Start in foreground mode (see logs in console)
  python launcher.py start --prod       # Start in production mode
  python launcher.py start --no-riva    # Start without NVIDIA Riva TTS
  python launcher.py start --no-browser # Start without auto-opening browser
  python launcher.py stop               # Stop all services (including Riva)
  python launcher.py restart            # Restart services
  python launcher.py logs               # Show all logs (live tail)
  python launcher.py logs backend       # Show backend logs only
  python launcher.py status             # Show service status
  python launcher.py test               # Run all tests
  python launcher.py clean              # Clean project

Auto-Setup:
  The launcher automatically handles dependencies:
  - Detects missing dependencies on every start
  - Creates Python virtual environment if needed
  - Installs backend dependencies (pip packages) if needed
  - Installs frontend dependencies (npm packages) if needed
  - Creates .env configuration file if missing
  - Initializes database if needed
  - Just run "python launcher.py start" and it handles the rest!

NVIDIA Riva TTS (Auto-Setup):
  The launcher automatically detects and sets up NVIDIA Riva TTS on first run.
  You'll be prompted for NGC API key and model download.
  - First run: Automatic setup wizard
  - Subsequent runs: Automatic Riva startup
  - Skip with: --no-riva flag
  Provides high-quality, low-latency text-to-speech for kids.
        """
    )

    parser.add_argument(
        'command',
        nargs='?',  # Make command optional
        choices=['setup', 'start', 'stop', 'restart', 'logs', 'status', 'test', 'clean'],
        default='start',  # Default to start
        help='Command to execute (default: start)'
    )

    parser.add_argument(
        'service',
        nargs='?',
        help='Specific service (for logs command)'
    )

    parser.add_argument(
        '--prod',
        action='store_true',
        help='Run in production mode'
    )

    parser.add_argument(
        '--detach', '-d',
        action='store_true',
        default=True,
        help='Run in detached mode (background) - DEFAULT'
    )

    parser.add_argument(
        '--foreground', '-f',
        action='store_true',
        help='Run in foreground mode (not detached)'
    )

    parser.add_argument(
        '--no-follow',
        action='store_true',
        help='Don\'t follow logs (for logs command)'
    )

    parser.add_argument(
        '--no-riva',
        action='store_true',
        help='Skip NVIDIA Riva TTS startup (for start command)'
    )

    parser.add_argument(
        '--skip-setup',
        action='store_true',
        help='Skip automatic first-run setup'
    )

    parser.add_argument(
        '--no-browser',
        action='store_true',
        help='Don\'t automatically open browser (for start command)'
    )

    args = parser.parse_args()

    # Handle foreground flag (overrides default detach)
    if args.foreground:
        args.detach = False

    # Print banner
    print_header("AI Babysitter System Launcher")

    # Execute command
    mode = 'prod' if args.prod else 'dev'
    success = True

    if args.command == 'setup':
        if not check_requirements():
            sys.exit(1)
        check_env_file()  # Don't require valid env for setup
        success = setup_project()

    elif args.command == 'start':
        if not check_requirements():
            sys.exit(1)
        if not check_env_file():
            print_warning("API keys not configured!")
            print_error("Cannot start services without valid API keys.")
            print_info("\nPlease edit .env and add your API keys:")
            print_info(f"  {Color.YELLOW}nano .env{Color.END}")
            sys.exit(1)
        # Auto-setup is enabled by default, can be controlled via --no-riva flag
        success = start_services(
            mode,
            args.detach,
            with_riva=not args.no_riva,
            auto_setup_riva=not args.no_riva,
            open_browser=not args.no_browser
        )

    elif args.command == 'stop':
        success = stop_services()

    elif args.command == 'restart':
        success = restart_services(mode, open_browser=not args.no_browser)

    elif args.command == 'logs':
        success = show_logs(args.service, not args.no_follow)

    elif args.command == 'status':
        success = show_status()

    elif args.command == 'test':
        success = run_tests()

    elif args.command == 'clean':
        success = clean_project()

    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()