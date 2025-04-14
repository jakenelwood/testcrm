# Quote Request Generator Documentation

This directory contains the documentation for the Quote Request Generator application.

## Setup and Configuration

- [Server Setup Guide](server-setup-guide.md) - Instructions for setting up the server environment, including Docker, LanceDB, and Traefik
- [Server Connection Troubleshooting](server-connection-troubleshooting.md) - How to diagnose and fix common server connection issues
- [Docker Setup Guide](docker-setup-guide.md) - Detailed instructions for containerizing the application with Docker
- [Docker Deployment Guide](docker-deployment.md) - Step-by-step guide for deploying with Docker on the Hetzner server
- [LanceDB Integration Guide](lancedb-integration.md) - How to integrate LanceDB for data storage and future AI capabilities
- [Next.js Authentication Setup](nextjs-auth-setup.md) - How to implement user authentication in the Next.js frontend

## Development Guides

- [Document Generation Guide](document-generation-guide.md) - How to implement the document generation functionality
- [Implementation Plan](implementation-plan.md) - Prioritized roadmap for development phases
- [Implementation Order](implementation-order.md) - Specific order and tasks for immediate next steps

## Project Information

The Quote Request Generator is a web application that populates DOCX forms with client information for insurance quote requests. The system follows these key principles:

### Features

- Frontend built with Next.js and deployed on Vercel
- Backend API hosted on Hetzner server (65.21.174.252)
- Document generation using DOCX templates with placeholder replacement
- LanceDB for data storage with future AI integration capabilities
- Docker and Traefik for containerization and routing

### System Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Frontend       │      │  Backend API    │      │  LanceDB        │
│  (Next.js)      │─────►│  (Node.js)      │─────►│  (Vector DB)    │
│  Vercel         │      │  Hetzner        │      │  Docker         │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                 │
                                 ▼
                         ┌─────────────────┐
                         │                 │
                         │  Document       │
                         │  Generation     │
                         │                 │
                         └─────────────────┘
```

### Troubleshooting Common Issues

For common issues and their solutions, see the [Server Connection Troubleshooting](server-connection-troubleshooting.md) guide.

### Contributing

When contributing to this project, please ensure you follow the code organization principles outlined in the project's README.md file.

### Project Status

The project is currently in development with the MVP focusing on:

1. Auto Quote Request form generation
2. Basic frontend UI with form submission
3. Document generation and download
4. LanceDB integration

For detailed implementation status, see the [Implementation Plan](implementation-plan.md) and [Implementation Order](implementation-order.md) documents. 