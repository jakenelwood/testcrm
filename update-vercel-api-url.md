# Updating the API URL in Vercel

After pushing your changes to GitHub, you'll need to update the API URL in your Vercel deployment to point to your CORS-enabled API endpoint.

## Steps to Update Vercel Configuration

1. Go to your Vercel dashboard
2. Select your project (`quote-request-fresh`)
3. Navigate to the "Settings" tab
4. Click on "Environment Variables"
5. Look for the variable `NEXT_PUBLIC_API_BASE_URL` (or add it if it doesn't exist)
6. Set the value to:
   ```
   http://65.21.174.252:8200
   ```
7. Click "Save"
8. Redeploy your application by going to the "Deployments" tab and clicking "Redeploy" on your latest deployment

## Verifying the Connection

After redeployment, you can test the connectivity by:

1. Visit your Vercel app URL
2. Navigate to the server test page 
3. The "Test API Proxy Connection" should now succeed
4. The "Direct Client Connection Test" should also succeed now that we have properly configured CORS

## Troubleshooting

If you're still experiencing CORS issues after updating the URL:

1. Make sure the Hetzner server is properly running our minimal CORS API on port 8200:
   ```bash
   docker ps | grep minimal-cors-api
   ```

2. Verify that your minimal CORS API has the correct origin:
   ```bash
   curl http://localhost:8200/
   ```
   It should show the Vercel domain in the allowed origins.

3. Check Vercel logs for any client-side errors that might indicate CORS issues. 