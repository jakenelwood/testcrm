# 🤖 GardenOS AI Orchestration Architecture

## Overview

GardenOS features a **custom coroutine-based AI orchestration layer** designed for production-grade CRM intelligence. This architecture provides full control, horizontal scalability, and modularity while maintaining cost efficiency through DeepSeek-V3 integration.

## 🏗️ Architecture Components

### Core Classes

#### **BaseAIAgent**
Abstract base class for all AI agents with built-in lifecycle management:

```python
class BaseAIAgent:
    def __init__(self, agent_id: str, agent_type: str)
    async def start()                    # Start agent coroutine
    async def process_task(task)         # Process individual tasks
    async def _agent_loop()              # Main processing loop
    def get_metrics()                    # Performance metrics
```

**Features**:
- Async/await patterns for non-blocking operations
- Built-in error handling and retry mechanisms
- Performance tracking and metrics collection
- Configurable timeouts and concurrency limits

#### **Specialized Agents**

##### **LeadAnalysisAgent**
Handles intelligent lead qualification and scoring:

```python
# Queue lead for analysis
task_id = await agent.queue_analysis(lead_data, priority=5)

# Returns comprehensive analysis
{
    "lead_quality_score": 8,
    "conversion_probability": 75,
    "recommended_action": "Schedule demo call",
    "follow_up_timeline": "Within 24 hours",
    "key_insights": ["High-value prospect", "Budget confirmed"]
}
```

##### **FollowUpAgent**
Generates personalized follow-up communications:

```python
# Queue follow-up generation
task_id = await agent.queue_follow_up(lead_data, context="Demo completed")

# Returns email-ready content
{
    "subject": "Next steps after your demo",
    "body": "Hi John, thank you for taking the time...",
    "full_message": "Complete email content"
}
```

#### **AIOrchestrator**
Central coordination and load balancing system:

```python
class AIOrchestrator:
    async def start()                           # Initialize agent pools
    async def stop()                            # Graceful shutdown
    async def analyze_lead(data, priority)      # Route to analysis agents
    async def generate_follow_up(data, context) # Route to follow-up agents
    async def scale_agents(type, count)         # Dynamic scaling
    def get_system_metrics()                    # System-wide metrics
```

## 🚀 Production Features

### Dynamic Scaling
Automatically adjust agent pools based on demand:

```bash
# Scale up during high traffic
POST /ai/scale-agents
{
  "agent_type": "lead_analysis",
  "target_count": 8
}

# Scale down during quiet periods
POST /ai/scale-agents
{
  "agent_type": "follow_up", 
  "target_count": 2
}
```

### Load Balancing
Intelligent task distribution across agent pools:

- **Queue-based routing**: Tasks routed to agents with smallest queues
- **Priority handling**: High-priority tasks processed first
- **Fault tolerance**: Failed agents don't affect others

### Real-Time Monitoring

#### System Metrics
```bash
GET /ai/status
{
  "orchestrator_status": "running",
  "total_agents": 6,
  "total_processed": 1247,
  "error_rate": 0.02,
  "queue_sizes": {
    "lead_analysis": 3,
    "follow_up": 1
  }
}
```

#### Agent Metrics
```bash
GET /ai/agents/lead-analysis-0/metrics
{
  "agent_id": "lead-analysis-0",
  "status": "processing",
  "processed_count": 156,
  "error_count": 2,
  "uptime_seconds": 3600,
  "current_task_id": "analysis-abc123"
}
```

## 🧠 AI Model Integration

### DeepSeek-V3 via DeepInfra

**Why DeepSeek-V3?**
- **Cost Effective**: ~90% cheaper than GPT-4
- **High Performance**: Competitive reasoning capabilities
- **Fast Response**: Optimized inference via DeepInfra
- **OpenAI Compatible**: Drop-in replacement for OpenAI API

**Configuration**:
```python
client = AsyncOpenAI(
    api_key=os.getenv("DEEPINFRA_API_KEY"),
    base_url="https://api.deepinfra.com/v1/openai"
)
model = "deepseek-ai/DeepSeek-V3-0324"
```

**Cost Estimation**:
```python
# Typical costs for CRM operations
Lead Analysis (500 tokens):     ~$0.0004
Follow-up Generation (300 tokens): ~$0.0002
Monthly (1000 leads):           ~$0.60
```

## 📊 Business Intelligence Features

### Lead Scoring Algorithm
Multi-factor analysis considering:

1. **Company Information**: Size, industry, revenue indicators
2. **Contact Quality**: Role, email domain, phone presence
3. **Engagement Signals**: Source, timing, interaction history
4. **Behavioral Patterns**: Website activity, content downloads

### Follow-Up Personalization
Context-aware message generation:

1. **Prospect Profiling**: Industry-specific language and pain points
2. **Interaction History**: References to previous conversations
3. **Value Proposition**: Tailored benefits based on company profile
4. **Call-to-Action**: Specific next steps based on sales stage

## 🔧 Operational Excellence

### Health Monitoring
```bash
GET /ai/health
{
  "status": "healthy",
  "orchestrator_running": true,
  "total_agents": 6,
  "error_rate": 0.02,
  "queue_sizes": {"lead_analysis": 2, "follow_up": 0}
}
```

### Debug Tools
```bash
# Queue inspection
GET /ai/debug/queues

# System restart
POST /ai/restart
```

### Error Handling
- **Automatic retries**: Failed tasks retry up to 3 times
- **Circuit breakers**: Prevent cascade failures
- **Graceful degradation**: System continues with reduced capacity
- **Detailed logging**: Comprehensive error tracking

## 🎯 Integration Points

### FastAPI Endpoints
```python
# Core AI operations
POST /ai/analyze-lead        # Queue lead analysis
POST /ai/generate-follow-up  # Queue follow-up generation
GET  /ai/status             # System metrics
POST /ai/scale-agents       # Dynamic scaling

# Monitoring and debugging
GET  /ai/health             # Health check
GET  /ai/agents/{id}/metrics # Agent performance
GET  /ai/debug/queues       # Queue inspection
POST /ai/restart            # System restart
```

### Database Integration
- **Lead data retrieval**: Direct PostgreSQL queries
- **Result storage**: AI insights stored in `ai_interactions` table
- **Performance tracking**: Metrics stored for analysis

### Kubernetes Integration
- **Pod scheduling**: Agents run as K3s workloads
- **Resource management**: CPU/memory limits and requests
- **Auto-scaling**: HPA based on queue depth and CPU usage
- **Service discovery**: Internal service communication

## 🚀 Future Enhancements

### Planned Features
1. **Semantic Search**: pgvector integration for lead similarity
2. **Conversation Memory**: Multi-turn dialogue management
3. **Email Classification**: Automatic routing and prioritization
4. **Predictive Analytics**: Conversion probability modeling
5. **A/B Testing**: Message variant performance tracking

### Scaling Roadmap
1. **Multi-Model Support**: Add GPT-4, Claude, local models
2. **Geographic Distribution**: Multi-region deployment
3. **Specialized Agents**: Industry-specific AI agents
4. **Real-Time Processing**: WebSocket-based live analysis

## 📚 Developer Guide

### Adding New Agent Types
```python
class CustomAgent(BaseAIAgent):
    def __init__(self, agent_id: str = None):
        super().__init__(agent_id or f"custom-{uuid.uuid4().hex[:8]}", "custom")
        self.task_queue = asyncio.Queue()
    
    async def process_task(self, task: AgentTask) -> Dict[str, Any]:
        # Implement custom logic
        pass
```

### Configuration
Environment variables for customization:
```bash
# Agent scaling limits
MAX_LEAD_ANALYSIS_AGENTS=10
MAX_FOLLOW_UP_AGENTS=5

# Performance tuning
LEAD_ANALYSIS_TIMEOUT=30
FOLLOW_UP_TIMEOUT=20

# API configuration
DEEPINFRA_API_KEY=your_key_here
```

This architecture provides the foundation for enterprise-grade AI operations while maintaining the flexibility to evolve with changing business requirements.
