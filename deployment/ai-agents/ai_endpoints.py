"""
FastAPI endpoints for custom coroutine-based AI orchestration layer
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, Optional
import asyncio
import logging
from datetime import datetime

from ai_service import orchestrator

logger = logging.getLogger(__name__)

# Pydantic models for API requests
class LeadAnalysisRequest(BaseModel):
    lead_id: str
    lead_data: Dict[str, Any]
    priority: int = 5

class FollowUpRequest(BaseModel):
    lead_id: str
    lead_data: Dict[str, Any]
    context: str = ""
    priority: int = 5

class ScaleRequest(BaseModel):
    agent_type: str  # "lead_analysis" or "follow_up"
    target_count: int

# Create router
ai_router = APIRouter(prefix="/ai", tags=["AI Orchestration"])

@ai_router.on_event("startup")
async def startup_ai_orchestrator():
    """Start AI orchestration layer on FastAPI startup"""
    try:
        await orchestrator.start()
        logger.info("AI Orchestration Layer started successfully")
    except Exception as e:
        logger.error(f"Failed to start AI orchestration: {e}")

@ai_router.on_event("shutdown")
async def shutdown_ai_orchestrator():
    """Stop AI orchestration layer on FastAPI shutdown"""
    try:
        await orchestrator.stop()
        logger.info("AI Orchestration Layer stopped successfully")
    except Exception as e:
        logger.error(f"Failed to stop AI orchestration: {e}")

@ai_router.get("/status")
async def get_ai_status():
    """Get AI orchestration layer status and metrics"""
    try:
        metrics = orchestrator.get_system_metrics()
        return {
            "status": "success",
            "data": metrics,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get AI status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@ai_router.post("/analyze-lead")
async def analyze_lead(request: LeadAnalysisRequest):
    """Queue lead for AI analysis"""
    try:
        if not orchestrator.is_running:
            raise HTTPException(status_code=503, detail="AI orchestration layer not running")
        
        task_id = await orchestrator.analyze_lead(
            lead_data=request.lead_data,
            priority=request.priority
        )
        
        return {
            "status": "success",
            "task_id": task_id,
            "message": "Lead analysis queued successfully",
            "estimated_completion": "30-60 seconds",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to queue lead analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@ai_router.post("/generate-follow-up")
async def generate_follow_up(request: FollowUpRequest):
    """Queue follow-up message generation"""
    try:
        if not orchestrator.is_running:
            raise HTTPException(status_code=503, detail="AI orchestration layer not running")
        
        task_id = await orchestrator.generate_follow_up(
            lead_data=request.lead_data,
            context=request.context,
            priority=request.priority
        )
        
        return {
            "status": "success",
            "task_id": task_id,
            "message": "Follow-up generation queued successfully",
            "estimated_completion": "15-30 seconds",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to queue follow-up generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@ai_router.post("/scale-agents")
async def scale_agents(request: ScaleRequest):
    """Dynamically scale AI agent pools"""
    try:
        if not orchestrator.is_running:
            raise HTTPException(status_code=503, detail="AI orchestration layer not running")
        
        if request.agent_type not in ["lead_analysis", "follow_up"]:
            raise HTTPException(status_code=400, detail="Invalid agent type")
        
        if request.target_count < 0 or request.target_count > 10:
            raise HTTPException(status_code=400, detail="Target count must be between 0 and 10")
        
        await orchestrator.scale_agents(request.agent_type, request.target_count)
        
        return {
            "status": "success",
            "message": f"Scaled {request.agent_type} agents to {request.target_count}",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to scale agents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@ai_router.get("/agents/{agent_id}/metrics")
async def get_agent_metrics(agent_id: str):
    """Get metrics for a specific agent"""
    try:
        if agent_id not in orchestrator.agents:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        agent = orchestrator.agents[agent_id]
        metrics = agent.get_metrics()
        
        return {
            "status": "success",
            "data": metrics,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get agent metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@ai_router.get("/health")
async def ai_health_check():
    """Comprehensive AI system health check"""
    try:
        metrics = orchestrator.get_system_metrics()
        
        # Determine health status
        is_healthy = (
            orchestrator.is_running and
            metrics["total_agents"] > 0 and
            metrics["error_rate"] < 0.1  # Less than 10% error rate
        )
        
        status_code = 200 if is_healthy else 503
        
        return {
            "status": "healthy" if is_healthy else "unhealthy",
            "orchestrator_running": orchestrator.is_running,
            "total_agents": metrics["total_agents"],
            "error_rate": metrics["error_rate"],
            "queue_sizes": metrics["queue_sizes"],
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"AI health check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@ai_router.post("/restart")
async def restart_orchestrator():
    """Restart the AI orchestration layer"""
    try:
        logger.info("Restarting AI orchestration layer...")
        
        # Stop current orchestrator
        await orchestrator.stop()
        
        # Brief pause
        await asyncio.sleep(2)
        
        # Start fresh
        await orchestrator.start()
        
        return {
            "status": "success",
            "message": "AI orchestration layer restarted successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to restart orchestrator: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Utility endpoints for development and debugging
@ai_router.get("/debug/queues")
async def debug_queue_status():
    """Debug endpoint to inspect queue states"""
    try:
        queue_info = {}
        
        for agent_id, agent in orchestrator.agents.items():
            if hasattr(agent, 'task_queue'):
                queue_info[agent_id] = {
                    "agent_type": agent.agent_type,
                    "queue_size": agent.task_queue.qsize(),
                    "status": agent.status.value,
                    "processed_count": agent.processed_count,
                    "error_count": agent.error_count
                }
        
        return {
            "status": "success",
            "data": queue_info,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Debug queue status failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
