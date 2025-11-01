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

    # Check for NVIDIA GPU (optional, for Riva TTS)
    try:
        subprocess.run(['nvidia-smi'], check=True, capture_output=True)
        print_success("NVIDIA GPU detected (Riva TTS available)")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print_warning("NVIDIA GPU not detected (Riva TTS unavailable, will use fallback)")

    return all_installed

def check_env_file() -> bool:
    """Check if .env file exists and has required variables"""
    print_header("Checking Environment Configuration")

    env_file = Path('.env')
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
        if key not in env_content or f"{key}=your_" in env_content:
            missing_keys.append(key)

    if missing_keys:
        print_warning(f"Missing or placeholder API keys: {', '.join(missing_keys)}")
        print_info("Please update your .env file with valid API keys")
        return False

    print_success("Environment configuration is valid")
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

def setup_project() -> bool:
    """Initial project setup"""
    print_header("Setting Up Project")

    # Create necessary directories
    dirs = ['backend/data', 'frontend/build', 'logs', 'nginx/ssl']
    for dir_path in dirs:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
        print_success(f"Created directory: {dir_path}")

    # Initialize database
    if not initialize_database():
        print_warning("Database initialization failed, but continuing...")

    # Install backend dependencies
    print_info("Installing backend dependencies...")
    backend_path = Path('backend')
    if (backend_path / 'requirements.txt').exists():
        if run_command(['pip', 'install', '-r', 'requirements.txt'], cwd=backend_path):
            print_success("Backend dependencies installed")
        else:
            print_error("Failed to install backend dependencies")
            return False

    # Install frontend dependencies
    print_info("Installing frontend dependencies...")
    frontend_path = Path('frontend')
    if (frontend_path / 'package.json').exists():
        if run_command(['npm', 'install'], cwd=frontend_path):
            print_success("Frontend dependencies installed")
        else:
            print_error("Failed to install frontend dependencies")
            return False

    return True

def start_services(mode: str = 'dev', detached: bool = False, with_riva: bool = True, auto_setup_riva: bool = True) -> bool:
    """Start all services using Docker Compose"""
    print_header(f"Starting Services ({mode} mode)")

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

def restart_services(mode: str = 'dev') -> bool:
    """Restart all services"""
    print_header("Restarting Services")

    if stop_services():
        time.sleep(2)
        return start_services(mode, detached=True)
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

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='AI Babysitter System - Unified Launcher',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python launcher.py start              # Start all services (dev mode + Riva TTS)
  python launcher.py start --prod       # Start in production mode
  python launcher.py start --no-riva    # Start without NVIDIA Riva TTS
  python launcher.py stop               # Stop all services (including Riva)
  python launcher.py restart            # Restart services
  python launcher.py logs               # Show all logs
  python launcher.py logs backend       # Show backend logs only
  python launcher.py status             # Show service status
  python launcher.py test               # Run all tests
  python launcher.py clean              # Clean project

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
        choices=['setup', 'start', 'stop', 'restart', 'logs', 'status', 'test', 'clean'],
        help='Command to execute'
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
        help='Run in detached mode (background)'
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

    args = parser.parse_args()

    # Print banner
    print_header("AI Babysitter System Launcher")

    # Execute command
    mode = 'prod' if args.prod else 'dev'
    success = True

    if args.command == 'setup':
        if not check_requirements():
            sys.exit(1)
        if not check_env_file():
            sys.exit(1)
        success = setup_project()

    elif args.command == 'start':
        if not check_requirements():
            sys.exit(1)
        if not check_env_file():
            print_warning("Starting anyway, but some features may not work")
        # Auto-setup is enabled by default, can be controlled via --no-riva flag
        success = start_services(mode, args.detach, with_riva=not args.no_riva, auto_setup_riva=not args.no_riva)

    elif args.command == 'stop':
        success = stop_services()

    elif args.command == 'restart':
        success = restart_services(mode)

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