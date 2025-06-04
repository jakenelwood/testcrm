# TwinCiGo CRM Project Structure

## Directory Organization

```
crm/
├── app/                    # Next.js app directory
├── components/             # React components
├── config/                 # Configuration files
├── contexts/               # React contexts
├── database/               # Database schemas and migrations
├── deployment/             # Docker deployment files
│   ├── backend/           # FastAPI backend
│   ├── haproxy/           # Load balancer config
│   ├── patroni/           # PostgreSQL HA config
│   ├── postgres/          # Database initialization
│   └── storage/           # File storage
├── docs/                   # Documentation
├── hooks/                  # React hooks
├── lib/                    # Utility libraries
├── public/                 # Static assets
├── scripts/                # Deployment and utility scripts
├── styles/                 # CSS styles
├── types/                  # TypeScript type definitions
├── utils/                  # Utility functions
└── _archive/              # Archived/deprecated files
```

## Key Files

- `deployment/docker-compose.yml` - Main orchestration file
- `deployment/.env.development` - Environment variables
- `scripts/update-and-restart-hetzner.sh` - Main deployment script
- `scripts/cleanup-and-align-deployment.sh` - Cleanup script

## Deployment Workflow

1. Local development: `npm run dev`
2. Deploy to server: `./scripts/cleanup-and-align-deployment.sh`
3. Start services: `./scripts/start-services-sequentially.sh`
4. Monitor: `./scripts/monitor-hetzner-deployment.sh`

## Principles

- **DRY**: Don't Repeat Yourself
- **Simple**: As simple as possible, but no simpler
- **Organized**: Clear directory structure
- **Aligned**: Local and server structures match exactly
