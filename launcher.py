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

def setup_project() -> bool:
    """Initial project setup"""
    print_header("Setting Up Project")

    # Create necessary directories
    dirs = ['backend/data', 'frontend/build', 'logs', 'nginx/ssl']
    for dir_path in dirs:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
        print_success(f"Created directory: {dir_path}")

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

def start_services(mode: str = 'dev', detached: bool = False) -> bool:
    """Start all services using Docker Compose"""
    print_header(f"Starting Services ({mode} mode)")

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
  python launcher.py start          # Start all services (dev mode)
  python launcher.py start --prod   # Start in production mode
  python launcher.py stop           # Stop all services
  python launcher.py restart        # Restart services
  python launcher.py logs           # Show all logs
  python launcher.py logs backend   # Show backend logs only
  python launcher.py status         # Show service status
  python launcher.py test           # Run all tests
  python launcher.py clean          # Clean project
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
        success = start_services(mode, args.detach)

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