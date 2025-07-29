#!/usr/bin/env python3
"""
Development Environment Setup Script
Sets up the development environment for CVPerfect
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def print_step(step_name):
    """Print a formatted step name"""
    print(f"\n{'='*50}")
    print(f"STEP: {step_name}")
    print(f"{'='*50}")

def run_command(command, description, check=True):
    """Run a shell command with error handling"""
    print(f"\nRunning: {description}")
    print(f"Command: {command}")
    
    try:
        result = subprocess.run(command, shell=True, check=check, capture_output=True, text=True)
        if result.stdout:
            print(f"Output: {result.stdout}")
        return result
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
        if e.stderr:
            print(f"Error output: {e.stderr}")
        if check:
            sys.exit(1)
        return e

def check_prerequisites():
    """Check if required tools are installed"""
    print_step("Checking Prerequisites")
    
    required_tools = {
        'python': 'python --version',
        'node': 'node --version',
        'npm': 'npm --version',
        'docker': 'docker --version',
        'git': 'git --version'
    }
    
    missing_tools = []
    
    for tool, command in required_tools.items():
        result = run_command(command, f"Checking {tool}", check=False)
        if result.returncode != 0:
            missing_tools.append(tool)
        else:
            print(f"✓ {tool} is installed")
    
    if missing_tools:
        print(f"\n❌ Missing required tools: {', '.join(missing_tools)}")
        print("Please install the missing tools and run this script again.")
        sys.exit(1)
    else:
        print("\n✅ All prerequisites are installed")

def setup_backend():
    """Set up the backend development environment"""
    print_step("Setting up Backend")
    
    # Change to backend directory
    os.chdir('backend')
    
    # Create virtual environment if it doesn't exist
    if not os.path.exists('venv'):
        run_command('python -m venv venv', "Creating virtual environment")
    
    # Activate virtual environment and install dependencies
    if sys.platform == "win32":
        activate_cmd = 'venv\\Scripts\\activate'
        python_cmd = 'venv\\Scripts\\python'
        pip_cmd = 'venv\\Scripts\\pip'
    else:
        activate_cmd = 'source venv/bin/activate'
        python_cmd = 'venv/bin/python'
        pip_cmd = 'venv/bin/pip'
    
    run_command(f'{pip_cmd} install --upgrade pip', "Upgrading pip")
    run_command(f'{pip_cmd} install -r requirements.txt', "Installing Python dependencies")
    
    # Change back to root directory
    os.chdir('..')
    
    print("✅ Backend setup completed")

def setup_frontend():
    """Set up the frontend development environment"""
    print_step("Setting up Frontend")
    
    # Change to frontend directory
    os.chdir('frontend')
    
    # Install npm dependencies
    run_command('npm install', "Installing Node.js dependencies")
    
    # Change back to root directory
    os.chdir('..')
    
    print("✅ Frontend setup completed")

def create_env_files():
    """Create environment files with default values"""
    print_step("Creating Environment Files")
    
    # Backend .env file
    backend_env_path = Path('backend/.env')
    if not backend_env_path.exists():
        backend_env_content = """# Database
DATABASE_URL=postgresql://postgres:postgres@localhost/cvperfect

# Security
SECRET_KEY=dev-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Google Gemini AI (use your existing API key)
GEMINI_API_KEY=your-existing-gemini-api-key

# Stripe (optional for development)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRO_MONTHLY_PRICE_ID=price_your_monthly_price_id
STRIPE_PRO_YEARLY_PRICE_ID=price_your_yearly_price_id

# Redis
REDIS_URL=redis://localhost:6379

# Frontend URL
FRONTEND_URL=http://localhost:3000
"""
        
        with open(backend_env_path, 'w') as f:
            f.write(backend_env_content)
        print(f"✅ Created {backend_env_path}")
    else:
        print(f"ℹ️  {backend_env_path} already exists")
    
    # Frontend .env.local file
    frontend_env_path = Path('frontend/.env.local')
    if not frontend_env_path.exists():
        frontend_env_content = """# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Stripe (optional for development)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
"""
        
        with open(frontend_env_path, 'w') as f:
            f.write(frontend_env_content)
        print(f"✅ Created {frontend_env_path}")
    else:
        print(f"ℹ️  {frontend_env_path} already exists")

def setup_database():
    """Set up the development database"""
    print_step("Setting up Database")
    
    print("Starting database setup...")
    print("Note: Make sure PostgreSQL is running on your system")
    
    # Run database migration script
    try:
        run_command('python scripts/migrate_db.py', "Running database migrations")
        print("✅ Database setup completed")
    except Exception as e:
        print(f"⚠️  Database setup failed: {e}")
        print("Please ensure PostgreSQL is running and accessible")

def create_development_scripts():
    """Create helpful development scripts"""
    print_step("Creating Development Scripts")
    
    # Create start script for backend
    backend_start_script = Path('scripts/start_backend.py')
    backend_start_content = '''#!/usr/bin/env python3
"""Start the backend development server"""

import subprocess
import sys
from pathlib import Path

def main():
    backend_dir = Path(__file__).parent.parent / "backend"
    
    if sys.platform == "win32":
        python_cmd = str(backend_dir / "venv" / "Scripts" / "python")
    else:
        python_cmd = str(backend_dir / "venv" / "bin" / "python")
    
    cmd = [python_cmd, "-m", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
    
    print("Starting backend development server...")
    print(f"Command: {' '.join(cmd)}")
    
    subprocess.run(cmd, cwd=backend_dir)

if __name__ == "__main__":
    main()
'''
    
    with open(backend_start_script, 'w') as f:
        f.write(backend_start_content)
    
    # Make script executable on Unix systems
    if sys.platform != "win32":
        os.chmod(backend_start_script, 0o755)
    
    print(f"✅ Created {backend_start_script}")

def print_completion_message():
    """Print completion message with next steps"""
    print_step("Setup Complete!")
    
    completion_message = """
🎉 Development environment setup completed successfully!

Next steps:
1. Update the environment files with your actual API keys:
   - backend/.env (add your Gemini API key)
   - frontend/.env.local (add Stripe keys if needed)

2. Start the services:

   Backend:
   cd backend
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   uvicorn main:app --reload

   Frontend:
   cd frontend
   npm run dev

   Or use Docker:
   docker-compose up

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

4. For background tasks, start Celery:
   cd backend
   celery -A app.workers.celery_app worker --loglevel=info

🔧 Development Tips:
- Use the existing Gemini API key you configured before
- Database migrations will run automatically
- Check logs if you encounter any issues
- Use the test suite to verify everything is working

Happy coding! 🚀
"""
    
    print(completion_message)

def main():
    """Main setup function"""
    print("🚀 CVPerfect Development Environment Setup")
    print("This script will set up your development environment")
    
    try:
        check_prerequisites()
        setup_backend()
        setup_frontend()
        create_env_files()
        setup_database()
        create_development_scripts()
        print_completion_message()
        
    except KeyboardInterrupt:
        print("\n\n❌ Setup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Setup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 