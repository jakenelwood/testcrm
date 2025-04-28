# Vercel Deployment Guide

This guide explains how to deploy the CRM application to Vercel.

## Prerequisites

- [Vercel CLI](https://vercel.com/docs/cli) installed (`npm install -g vercel`)
- A Vercel account linked to your GitHub account

## Deployment Configuration

The deployment configuration is defined in the `vercel.json` file at the root of the repository. This file specifies:

- The build command: `cd frontend-next-files && npm install && npm run build`
- The output directory: `frontend-next-files/.next`
- The install command: `cd frontend-next-files && npm install`
- The framework: `nextjs`
- The deployment region: `iad1` (Washington, D.C., USA - East)
- Environment variables, including the API URL

## Deployment Steps

### Using the Deployment Script

1. Run the deployment script:
   ```bash
   ./deploy-to-vercel.sh
   ```

2. Follow the prompts from the Vercel CLI.

### Manual Deployment

1. Ensure you're logged in to Vercel CLI:
   ```bash
   vercel login
   ```

2. Deploy from the root directory:
   ```bash
   vercel --prod
   ```

## Troubleshooting

### Common Issues

1. **Build fails with "No such file or directory"**:
   - Ensure the directory paths in `vercel.json` match your actual project structure.
   - The frontend code should be in the `frontend-next-files` directory.

2. **Environment variables not working**:
   - Check that environment variables are correctly set in `vercel.json`.
   - You can also set them in the Vercel dashboard.

3. **API connection issues**:
   - Verify the `NEXT_PUBLIC_API_BASE_URL` is correct and the API is accessible.

### Verifying Deployment

After deployment, you can verify your application at the provided Vercel URL. The deployment logs will show any errors that occurred during the build process.

## Backend Deployment

Note that Vercel only deploys the frontend. The backend API should be deployed separately, and the `NEXT_PUBLIC_API_BASE_URL` environment variable should point to your backend API URL.

Currently, the backend is deployed at `http://65.21.174.252:8000`.
