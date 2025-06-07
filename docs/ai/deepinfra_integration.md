# DeepInfra Integration Guide

## Overview

The CRM system uses **DeepSeek-V3-0324** via DeepInfra for all AI operations, providing enterprise-grade AI capabilities at 90% lower cost than OpenAI GPT-4.

## Model Information

- **Model**: `deepseek-ai/DeepSeek-V3-0324`
- **Provider**: DeepInfra (https://deepinfra.com/deepseek-ai/DeepSeek-V3-0324)
- **API Compatibility**: OpenAI-compatible API
- **Base URL**: `https://api.deepinfra.com/v1/openai`

## Configuration

### Environment Variables

```bash
# DeepInfra API Key (primary)
DEEPINFRA_API_KEY=your_deepinfra_api_key_here

# OpenAI-compatible API key (same value for compatibility)
OPENAI_API_KEY=your_deepinfra_api_key_here
```

### AI Service Configuration

The AI service is configured in `deployment/ai-agents/ai_service.py`:

```python
# DeepInfra API configuration
self.client = AsyncOpenAI(
    api_key=os.getenv("DEEPINFRA_API_KEY"),
    base_url="https://api.deepinfra.com/v1/openai"
)
self.model = "deepseek-ai/DeepSeek-V3-0324"
```

## AI Agents

### Lead Analysis Agent
- **Purpose**: Analyzes lead quality and conversion probability
- **Model Settings**: Temperature 0.3 for consistent analysis
- **Output**: JSON with lead score, conversion probability, and recommendations

### Follow-up Agent
- **Purpose**: Generates personalized follow-up messages
- **Model Settings**: Temperature 0.7 for creative content
- **Output**: Email-ready content with subject and body

## Database Configuration

Default AI agents are configured in the database schema:

```sql
INSERT INTO ai_agents (name, role, description, config) VALUES
('Follow-up Agent', 'follow_up', 'Manages automated follow-ups with leads and clients', 
 '{"model": "deepseek-ai/DeepSeek-V3-0324", "temperature": 0.7, "provider": "deepinfra"}'),
('Insight Agent', 'insight', 'Analyzes client data and provides insights', 
 '{"model": "deepseek-ai/DeepSeek-V3-0324", "temperature": 0.3, "provider": "deepinfra"}'),
('Marketing Agent', 'marketing', 'Optimizes campaigns and content performance', 
 '{"model": "deepseek-ai/DeepSeek-V3-0324", "temperature": 0.5, "provider": "deepinfra"}'),
('Support Agent', 'support', 'Handles customer support inquiries', 
 '{"model": "deepseek-ai/DeepSeek-V3-0324", "temperature": 0.5, "provider": "deepinfra"}');
```

## API Endpoints

### Analyze Lead
```bash
POST /ai/analyze-lead
{
  "lead_id": "string",
  "lead_data": {...},
  "priority": 5
}
```

### Generate Follow-up
```bash
POST /ai/generate-follow-up
{
  "lead_id": "string", 
  "lead_data": {...},
  "context": "string",
  "priority": 5
}
```

### System Status
```bash
GET /ai/status
```

## Cost Optimization

### Benefits of DeepSeek-V3-0324
- **90% cost reduction** compared to GPT-4
- **Comparable performance** for business use cases
- **High throughput** with DeepInfra infrastructure
- **OpenAI compatibility** for easy migration

### Scaling Configuration
```bash
# Environment variables for agent scaling
MAX_LEAD_ANALYSIS_AGENTS=3
MAX_FOLLOW_UP_AGENTS=2
LEAD_ANALYSIS_MAX_CONCURRENT=3
FOLLOW_UP_MAX_CONCURRENT=3
```

## Monitoring

### Health Checks
- **AI Health Endpoint**: `/ai/health`
- **System Metrics**: `/ai/status`
- **Agent Metrics**: `/ai/agents/{agent_id}/metrics`

### Key Metrics
- Total agents running
- Tasks processed
- Error rates
- Queue sizes
- Processing times

## Troubleshooting

### Common Issues

1. **API Key Not Set**
   ```
   ERROR: The api_key client option must be set either by passing api_key to the client or by setting the OPENAI_API_KEY environment variable
   ```
   **Solution**: Ensure both `DEEPINFRA_API_KEY` and `OPENAI_API_KEY` are set to your DeepInfra API key.

2. **Model Not Found**
   ```
   ERROR: Model 'deepseek-ai/DeepSeek-V3-0324' not found
   ```
   **Solution**: Verify the model name and ensure your DeepInfra account has access.

3. **Rate Limiting**
   ```
   ERROR: Rate limit exceeded
   ```
   **Solution**: Implement exponential backoff or upgrade DeepInfra plan.

### Debug Commands

```bash
# Check AI service status
kubectl logs -n fastapi deployment/fastapi-ai-agents --tail=50

# Test AI endpoint
curl -X GET http://api.gardenos.local/ai/status

# Check agent metrics
curl -X GET http://api.gardenos.local/ai/agents/lead-analysis-0/metrics
```

## Migration from OpenAI

If migrating from OpenAI to DeepInfra:

1. **Update environment variables** to use DeepInfra API key
2. **Change base URL** to DeepInfra endpoint
3. **Update model names** to DeepSeek-V3-0324
4. **Test all AI endpoints** to ensure compatibility
5. **Monitor performance** and adjust temperature settings if needed

## Security

- **API Key Management**: Store in Kubernetes secrets, not ConfigMaps
- **Network Security**: Use internal service communication within K3s cluster
- **Rate Limiting**: Implement application-level rate limiting for cost control
- **Monitoring**: Track API usage and costs through DeepInfra dashboard
