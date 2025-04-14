# Node.js Server Connection Troubleshooting Guide

## The Issue
The Next.js frontend application couldn't connect to the backend API on the Hetzner server, resulting in:

```
Error: connect ECONNREFUSED 65.21.174.252:8000
```

## Troubleshooting Flow

The diagram below shows the recommended troubleshooting flow:

```
┌────────────────────┐                  ┌─────────────────────┐
│                    │                  │                     │
│  Connection Error  │                  │  Check API Config   │
│  ECONNREFUSED      │─────────────────►│  in Frontend Code   │
│                    │                  │                     │
└────────────────────┘                  └──────────┬──────────┘
                                                   │
                                                   ▼
                                        ┌─────────────────────┐
                                        │                     │
                                        │  Test Direct Access │
                                        │  via Browser/Curl   │
                                        │                     │
                                        └──────────┬──────────┘
                                                   │
                                                   ▼
                                        ┌─────────────────────┐
                                        │                     │
                                        │  SSH into Server    │
                                        │                     │
                                        └──────────┬──────────┘
                                                   │
                                                   ▼
                                        ┌─────────────────────┐
                                        │                     │
                                        │  Check Firewall     │
                                        │  ufw status         │
                                        │                     │
                                        └──────────┬──────────┘
                                                   │
                                                   ▼
                                        ┌─────────────────────┐
                                        │                     │
                                        │  Check Service      │
                                        │  systemctl status   │
                                        │                     │
                                        └──────────┬──────────┘
                                                   │
                                                   ▼
                                        ┌─────────────────────┐
                                        │                     │
                                        │  Check Port Listen  │
                                        │  netstat -tulpn     │
                                        │                     │
                                        └──────────┬──────────┘
                                                   │
                                                   ▼
                                        ┌─────────────────────┐
                                        │                     │
                                        │ systemctl start     │
                                        │ node-api-service    │
                                        │                     │
                                        └──────────┬──────────┘
                                                   │
                                                   ▼
                                        ┌─────────────────────┐
                                        │                     │
                                        │ Test API Locally    │
                                        │ curl localhost:8000 │
                                        │                     │
                                        └──────────┬──────────┘
                                                   │
                                                   ▼
                                        ┌─────────────────────┐
                                        │                     │
                                        │ Test from Frontend  │
                                        │                     │
                                        └─────────────────────┘
```

## Diagnostic Steps to Identify the Problem

1. **Verify API configuration in the code**:
   - Checked that API_BASE_URL in lib/api-config.ts correctly pointed to http://65.21.174.252:8000

2. **Test direct connectivity to the server**:
   - Tried accessing the server in browser → Connection refused
   - Used the server test page we created → Connection error

3. **SSH into the server to diagnose**:
   ```bash
   ssh -i ~/.ssh/id_ed25519 root@65.21.174.252
   ```

4. **Check if firewall is blocking**:
   ```bash
   sudo ufw status
   ```
   - Result: "Status: inactive" → Firewall not the issue

5. **Check if the service is running**:
   ```bash
   systemctl status node-api-service
   ```
   - Result: "inactive (dead)" → Service not running

6. **Verify nothing is listening on port 8000**:
   ```bash
   netstat -tulpn | grep 8000
   ```
   - Result: No output → Confirmed nothing listening on port 8000

## The Fix

1. **Start the Node.js service**:
   ```bash
   systemctl start node-api-service
   ```

2. **Verify the service started successfully**:
   ```bash
   systemctl status node-api-service
   ```
   - Look for "Active: active (running)"

3. **Confirm port is listening**:
   ```bash
   netstat -tulpn | grep 8000
   ```
   - Should show: tcp 0 0 0.0.0.0:8000 0.0.0.0:* LISTEN

4. **Test API locally on the server**:
   ```bash
   curl http://localhost:8000/api/health-check
   ```
   - Should return valid JSON response

5. **Test from the frontend application**:
   - Go to server test page → Connection successful

## Key Lessons

1. **Connection refused errors typically mean**:
   - Nothing is running on the target port
   - A firewall is blocking the connection
   - The service is only listening on localhost (127.0.0.1) instead of all interfaces (0.0.0.0)

2. **Diagnosis order matters**:
   - Check configuration → Check connectivity → Check service status → Check port listening

3. **Service configuration**:
   - Ensure the service is configured to listen on 0.0.0.0 (all interfaces) not just localhost
   - Make sure the service is set to auto-start: `systemctl enable node-api-service`

## For Future Reference

If this issue happens again:
1. SSH into the server
2. Check service status: `systemctl status node-api-service`
3. If inactive, start it: `systemctl start node-api-service`
4. Verify it's working: `curl http://localhost:8000/api/health-check`

This debugging pattern applies to most backend API connection issues, regardless of the specific technology. 