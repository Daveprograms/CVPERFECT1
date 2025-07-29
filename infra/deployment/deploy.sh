#!/bin/bash

# CVPerfect Production Deployment Script
# Deploys the application to production environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="cvperfect"
DOCKER_REGISTRY="ghcr.io"
IMAGE_TAG="${GITHUB_SHA:-latest}"
DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-production}"

echo -e "${BLUE}Starting CVPerfect deployment...${NC}"
echo "Environment: $DEPLOYMENT_ENV"
echo "Image Tag: $IMAGE_TAG"

# Function to print step headers
print_step() {
    echo -e "\n${BLUE}===================================================${NC}"
    echo -e "${BLUE}STEP: $1${NC}"
    echo -e "${BLUE}===================================================${NC}"
}

# Function to handle errors
handle_error() {
    echo -e "${RED}Error occurred in deployment step: $1${NC}"
    exit 1
}

# Pre-deployment checks
print_step "Pre-deployment Checks"

# Check if required environment variables are set
required_vars=("DATABASE_URL" "REDIS_URL" "SECRET_KEY" "GEMINI_API_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}Error: Required environment variable $var is not set${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ All required environment variables are set${NC}"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed or not in PATH${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is available${NC}"

# Check if we can connect to the Docker registry
if [ "$DEPLOYMENT_ENV" = "production" ]; then
    if ! docker info &> /dev/null; then
        echo -e "${RED}Error: Cannot connect to Docker daemon${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker daemon is running${NC}"
fi

# Pull latest images
print_step "Pulling Latest Images"

if [ "$DEPLOYMENT_ENV" = "production" ]; then
    echo "Pulling backend image..."
    docker pull "$DOCKER_REGISTRY/$APP_NAME-backend:$IMAGE_TAG" || handle_error "Failed to pull backend image"
    
    echo "Pulling frontend image..."
    docker pull "$DOCKER_REGISTRY/$APP_NAME-frontend:$IMAGE_TAG" || handle_error "Failed to pull frontend image"
    
    echo -e "${GREEN}✓ Successfully pulled all images${NC}"
else
    echo -e "${YELLOW}Skipping image pull for non-production environment${NC}"
fi

# Database migration
print_step "Database Migration"

echo "Running database migrations..."
if [ "$DEPLOYMENT_ENV" = "production" ]; then
    # Run migrations in a temporary container
    docker run --rm \
        --env-file .env \
        -v "$(pwd)/scripts:/scripts" \
        "$DOCKER_REGISTRY/$APP_NAME-backend:$IMAGE_TAG" \
        python /scripts/migrate_db.py || handle_error "Database migration failed"
else
    # Run migrations locally
    python scripts/migrate_db.py || handle_error "Database migration failed"
fi

echo -e "${GREEN}✓ Database migration completed${NC}"

# Stop existing containers
print_step "Stopping Existing Services"

if [ "$DEPLOYMENT_ENV" = "production" ]; then
    echo "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down --remove-orphans || true
else
    docker-compose down || true
fi

echo -e "${GREEN}✓ Existing services stopped${NC}"

# Deploy new version
print_step "Deploying New Version"

if [ "$DEPLOYMENT_ENV" = "production" ]; then
    echo "Starting production services..."
    
    # Export environment variables for docker-compose
    export IMAGE_TAG
    export DATABASE_URL
    export REDIS_URL
    export SECRET_KEY
    export GEMINI_API_KEY
    export STRIPE_SECRET_KEY
    export FRONTEND_URL
    
    # Start services
    docker-compose -f docker-compose.prod.yml up -d || handle_error "Failed to start production services"
    
    # Wait for services to be healthy
    echo "Waiting for services to be healthy..."
    sleep 30
    
    # Check if services are running
    if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        handle_error "Services are not running properly"
    fi
    
else
    echo "Starting development services..."
    docker-compose up -d || handle_error "Failed to start development services"
fi

echo -e "${GREEN}✓ New version deployed successfully${NC}"

# Health checks
print_step "Health Checks"

BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
FRONTEND_URL_CHECK="${FRONTEND_URL:-http://localhost:3000}"

echo "Checking backend health..."
for i in {1..10}; do
    if curl -f "$BACKEND_URL/health" &> /dev/null; then
        echo -e "${GREEN}✓ Backend is healthy${NC}"
        break
    fi
    
    if [ $i -eq 10 ]; then
        handle_error "Backend health check failed after 10 attempts"
    fi
    
    echo "Attempt $i failed, retrying in 10 seconds..."
    sleep 10
done

echo "Checking frontend health..."
for i in {1..10}; do
    if curl -f "$FRONTEND_URL_CHECK" &> /dev/null; then
        echo -e "${GREEN}✓ Frontend is healthy${NC}"
        break
    fi
    
    if [ $i -eq 10 ]; then
        handle_error "Frontend health check failed after 10 attempts"
    fi
    
    echo "Attempt $i failed, retrying in 10 seconds..."
    sleep 10
done

# Post-deployment tasks
print_step "Post-deployment Tasks"

echo "Cleaning up old Docker images..."
if [ "$DEPLOYMENT_ENV" = "production" ]; then
    docker image prune -f || true
    echo -e "${GREEN}✓ Old images cleaned up${NC}"
fi

# Send deployment notification (if configured)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    echo "Sending deployment notification..."
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚀 CVPerfect $DEPLOYMENT_ENV deployment completed successfully!\nVersion: $IMAGE_TAG\nTime: $(date)\"}" \
        "$SLACK_WEBHOOK_URL" || echo -e "${YELLOW}Warning: Failed to send Slack notification${NC}"
fi

# Deployment summary
print_step "Deployment Summary"

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo "Deployment Details:"
echo "  Environment: $DEPLOYMENT_ENV"
echo "  Image Tag: $IMAGE_TAG"
echo "  Backend URL: $BACKEND_URL"
echo "  Frontend URL: $FRONTEND_URL_CHECK"
echo "  Deployment Time: $(date)"
echo ""
echo "Next Steps:"
echo "  1. Monitor application logs for any issues"
echo "  2. Run smoke tests to verify functionality"
echo "  3. Monitor application metrics and performance"
echo ""
echo "Useful Commands:"
echo "  View logs: docker-compose logs -f"
echo "  Check status: docker-compose ps"
echo "  Restart service: docker-compose restart <service_name>"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}" 