# Docker Deployment Guide

This guide provides step-by-step instructions for deploying the Quote Request Generator application using Docker on the Hetzner server.

## Prerequisites

- SSH access to the Hetzner server
- Git repository access
- Docker and Docker Compose installed on the server (see [Server Setup Guide](server-setup-guide.md))

## Deployment Steps

### 1. SSH into the Hetzner Server

```bash
ssh -i ~/.ssh/id_ed25519 root@65.21.174.252
```

### 2. Clone the Repository

```bash
# Navigate to your preferred directory
cd /root

# Clone the repository
git clone https://github.com/jakenelwood/quote-request-fresh.git

# Navigate to the repository
cd quote-request-fresh
```

### 3. Set Up Environment Variables

```