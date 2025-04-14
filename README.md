# Quote Request Generator\n\nA system to create and manage insurance quote requests.

## Overview

The Quote Request Generator is a web application designed to streamline the process of creating insurance quote requests. It enables users to generate quote documents for auto, home, and specialty insurance, avoiding manual data entry repeatedly across different forms.

## Project Status and Planning

The Quote Request Generator is currently in active development, with an initial MVP planned for release within 4-6 weeks. Recent analysis has identified several key areas for improvement to reach a complete implementation.

### Current Status

- **Frontend**: Successfully migrated to Next.js 15.3.0 with App Router and ShadCN UI
- **Form State Persistence**: Completed with comprehensive testing
- **Sample Data Generator**: Completed with rich data generation capabilities
- **Auto Insurance Form**: Partially implemented, needs field mapping updates
- **Home Insurance Form**: Partially implemented (10/56 fields)
- **Specialty Insurance Form**: Needs to be ported to Next.js from older implementation
- **Document Generation**: DOCX generation implemented; PDF export in progress

### Key Planning Documents

- [Gap Analysis](plan/gap_analysis.md) - Detailed analysis of missing elements
- [MVP Launch Plan](plan/mvp_launch_plan.md) - Concrete plan for launching MVP in 4-6 weeks
- [Implementation Checklist](plan/implementation_checklist.txt) - Comprehensive task tracking
- [Field Inventory Matrix](plan/field_inventory_matrix.md) - Mapping of all required fields

Our immediate focus is on delivering a functional MVP centered on the Auto Insurance Form with complete document generation capabilities, which will enable early user testing while development continues on additional features.

## Features

- Client management (create, read, update, delete)
- Quote request generation for auto, home, and specialty insurance
- Document export to DOCX and PDF formats
- Document history tracking
- User authentication and authorization
- Responsive dashboard interface

## Technology Stack

- **Backend**: FastAPI (Python), LanceDB (vector database for AI capabilities)
- **Frontend**: React, TypeScript, React Router, Axios
- **Containerization**: Docker, Docker Compose

## Development Setup

### Prerequisites

- Docker and Docker Compose
- Git

### Running the Application Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Brian-Berge-Agency/quote-request-generator.git
   cd quote-request-generator
   ```

2. **Start the development environment**:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Create an admin user**:
   ```bash
   docker exec -it quote-request-backend-dev python create_admin.py
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Running Without Docker

#### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Run migrations:
   ```bash
   export PYTHONPATH=$PYTHONPATH:$(pwd)
   alembic upgrade head
   ```

6. Create an admin user:
   ```bash
   python create_admin.py
   ```

7. Start the server:
   ```bash
   python run.py
   ```

#### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Production Deployment

### Deploying to Hetzner

1. **Connect to your Hetzner server**:
   ```bash
   ssh -i ~/.ssh/id_ed25519 root@65.21.174.252
   ```

2. **Clone the repository**:
   ```bash
   git clone https://github.com/jakenelwood/quote-request-fresh.git
   cd quote-request-generator72
   ```

3. **Run the deployment script**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

This script will:
- Pull the latest changes
- Set up document templates
- Build and start Docker containers
- Display the URLs for accessing the application

4. **Access the application**:
   - Frontend: http://65.21.174.252:3000
   - Backend API: http://65.21.174.252:8000

### Manual Deployment

If you prefer to deploy manually:

1. **Set up document templates**:
   ```bash
   chmod +x setup-templates.sh
   ./setup-templates.sh
   ```

2. **Build and start Docker containers**:
   ```bash
   export SERVER_IP=65.21.174.252
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

## Usage Guide

### Authentication

1. Navigate to the login page
2. Enter your username and password
3. You will be redirected to the dashboard upon successful login

### Managing Clients

1. Click on "Clients" in the navigation menu
2. Use the "Add New Client" button to create a new client
3. Click on a client to view and edit their details

### Creating Quote Requests

1. From the dashboard, click "Create New Quote"
2. Select a client from the dropdown or create a new one
3. Fill in the required information for the quote
4. Select which insurance types to include (Auto, Home, Specialty)
5. Save the quote

### Generating Documents

1. Navigate to a specific quote
2. Click on the "Generate Document" button
3. Select the desired format (DOCX or PDF)
4. The document will be generated and available for download

## License

This project is proprietary software of the Brian Berge Agency.

## MVP Features

- Auto Insurance form with comprehensive data collection
- Document generation in DOCX and PDF formats
- Document history tracking and management
- Basic search functionality
- Docker-based deployment for easy installation

## Components

- **Backend**: FastAPI-based REST API
- **Frontend**: Next.js application with ShadCN UI components
- **Document Generation**: Python-based document generator for DOCX and PDF formats

## Deployment Instructions

### Prerequisites

- Docker and Docker Compose
- Git
- LibreOffice for PDF conversion (optional, fallback methods are available)

### Deploying on Hetzner Server

1. **SSH into your Hetzner server:**

```bash
ssh -i ~/.ssh/id_ed25519 root@65.21.174.252
```

2. **Clone the repository:**

```bash
git clone https://github.com/jakenelwood/quote-request-fresh.git
cd quote-request-generator72
```

3. **Run the deployment script:**

```bash
chmod +x deploy.sh
./deploy.sh
```

This script will:
- Pull the latest changes
- Set up document templates
- Build and start Docker containers
- Display the URLs for accessing the application

4. **Access the application:**

- Frontend: http://65.21.174.252:3000
- Backend API: http://65.21.174.252:8000

### Manual Deployment

If you prefer to deploy manually:

1. **Set up document templates:**

```bash
chmod +x setup-templates.sh
./setup-templates.sh
```

2. **Build and start Docker containers:**

```bash
export SERVER_IP=65.21.174.252
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Development Setup

### Frontend

```bash
cd frontend-next
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Testing

### Frontend Tests

```bash
cd frontend-next
npm test
```

### Backend Tests

```bash
cd backend
pytest
```

## Document Templates

The application uses DOCX templates with placeholders:

- `auto-request-form.docx`: Template for auto insurance quotes
- `home-quote-request-form.docx`: Template for home insurance quotes
- `specialty-quote-request-form.docx`: Template for specialty insurance quotes

## Contributors

- Brian Berge Agency Team
