#!/bin/bash
# Setup script for backend testing and verification

echo "🚀 CVPerfect Backend - Setup and Verification Script"
echo "=================================================="
echo ""

# Navigate to backend directory
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "✅ Setup complete!"
echo ""
echo "=================================================="
echo "🧪 Running Tests"
echo "=================================================="
echo ""

# Run tests
pytest -v --tb=short

echo ""
echo "=================================================="
echo "📊 Test Coverage Report"
echo "=================================================="
echo ""

# Run tests with coverage
pytest --cov=app --cov-report=term-missing --cov-report=html

echo ""
echo "✅ All done!"
echo ""
echo "📝 Next steps:"
echo "  1. Review test results above"
echo "  2. Check coverage report in htmlcov/index.html"
echo "  3. Start the server: uvicorn app.main:app --reload"
echo "  4. Test endpoints at http://localhost:8000/docs"
echo ""
