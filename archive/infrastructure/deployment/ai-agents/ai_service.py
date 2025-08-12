"""
Custom Coroutine-Based AI Orchestration Layer
DeepSeek-V3 via DeepInfra with native async agents for horizontal scalability
"""

import os
import json
import asyncio
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass
from enum import Enum
from openai import AsyncOpenAI
import uuid

logger = logging.getLogger(__name__)

class AgentStatus(Enum):
    IDLE = "idle"
    PROCESSING = "processing"
    WAITING = "waiting"
    ERROR = "error"
    COMPLETED = "completed"

@dataclass
class AgentTask:
    """Task definition for AI agents"""
    id: str
    agent_type: str
    payload: Dict[str, Any]
    priority: int = 5
    created_at: datetime = None
    scheduled_for: datetime = None
    max_retries: int = 3
    retry_count: int = 0

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.scheduled_for is None:
            self.scheduled_for = datetime.utcnow()

class BaseAIAgent:
    """Base class for custom coroutine-based AI agents"""

    def __init__(self, agent_id: str, agent_type: str):
        self.agent_id = agent_id
        self.agent_type = agent_type
        self.status = AgentStatus.IDLE
        self.current_task: Optional[AgentTask] = None
        self.processed_count = 0
        self.error_count = 0
        self.started_at = datetime.utcnow()

        # DeepInfra API configuration
        self.client = AsyncOpenAI(
            api_key=os.getenv("DEEPINFRA_API_KEY"),
            base_url="https://api.deepinfra.com/v1/openai"
        )
        self.model = "deepseek-ai/DeepSeek-V3-0324"

        # Agent-specific configuration
        self.max_concurrent_tasks = int(os.getenv(f"{agent_type.upper()}_MAX_CONCURRENT", "3"))
        self.task_timeout = int(os.getenv(f"{agent_type.upper()}_TIMEOUT", "30"))

    async def start(self):
        """Start the agent coroutine"""
        logger.info(f"Starting AI agent {self.agent_id} ({self.agent_type})")
        while True:
            try:
                await self._agent_loop()
            except Exception as e:
                logger.error(f"Agent {self.agent_id} error: {e}")
                self.error_count += 1
                await asyncio.sleep(5)  # Brief pause before retry

    async def _agent_loop(self):
        """Main agent processing loop - override in subclasses"""
        await asyncio.sleep(1)  # Base implementation just waits

    async def process_task(self, task: AgentTask) -> Dict[str, Any]:
        """Process a task - override in subclasses"""
        raise NotImplementedError("Subclasses must implement process_task")

    async def _update_status(self, status: AgentStatus, task: Optional[AgentTask] = None):
        """Update agent status"""
        self.status = status
        self.current_task = task

        # Log status changes
        logger.debug(f"Agent {self.agent_id} status: {status.value}")

    def get_metrics(self) -> Dict[str, Any]:
        """Get agent performance metrics"""
        uptime = datetime.utcnow() - self.started_at
        return {
            "agent_id": self.agent_id,
            "agent_type": self.agent_type,
            "status": self.status.value,
            "processed_count": self.processed_count,
            "error_count": self.error_count,
            "uptime_seconds": uptime.total_seconds(),
            "current_task_id": self.current_task.id if self.current_task else None
        }

class LeadAnalysisAgent(BaseAIAgent):
    """Specialized coroutine-based agent for lead quality analysis"""

    def __init__(self, agent_id: str = None):
        super().__init__(agent_id or f"lead-analysis-{uuid.uuid4().hex[:8]}", "lead_analysis")
        self.task_queue = asyncio.Queue()

    async def _agent_loop(self):
        """Process lead analysis tasks from queue"""
        try:
            # Wait for task with timeout
            task = await asyncio.wait_for(self.task_queue.get(), timeout=10.0)
            await self._update_status(AgentStatus.PROCESSING, task)

            # Process the task
            result = await self.process_task(task)

            # Mark task as done
            self.task_queue.task_done()
            self.processed_count += 1
            await self._update_status(AgentStatus.IDLE)

            return result

        except asyncio.TimeoutError:
            # No tasks available, stay idle
            await self._update_status(AgentStatus.IDLE)
            await asyncio.sleep(1)
        except Exception as e:
            logger.error(f"Lead analysis agent error: {e}")
            self.error_count += 1
            await self._update_status(AgentStatus.ERROR)
            await asyncio.sleep(5)

    async def process_task(self, task: AgentTask) -> Dict[str, Any]:
        """Analyze lead quality using DeepSeek-V3"""
        lead_data = task.payload.get("lead_data", {})

        system_prompt = """You are a CRM AI assistant specializing in lead qualification.
        Analyze the lead data and provide:
        1. Lead quality score (1-10)
        2. Conversion probability (percentage)
        3. Key strengths and concerns
        4. Recommended next action
        5. Suggested follow-up timeline

        Respond in JSON format."""

        lead_summary = self._format_lead_for_analysis(lead_data)

        try:
            response = await asyncio.wait_for(
                self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Analyze this lead:\n{lead_summary}"}
                    ],
                    temperature=0.3,
                    max_tokens=1000
                ),
                timeout=self.task_timeout
            )

            # Parse AI response
            ai_content = response.choices[0].message.content

            try:
                analysis = json.loads(ai_content)
            except json.JSONDecodeError:
                analysis = {
                    "lead_quality_score": 7,
                    "conversion_probability": 65,
                    "analysis": ai_content,
                    "recommended_action": "Schedule follow-up call",
                    "follow_up_timeline": "Within 2-3 business days"
                }

            return {
                "task_id": task.id,
                "lead_id": lead_data.get("id"),
                "analysis": analysis,
                "agent_id": self.agent_id,
                "model_used": self.model,
                "analyzed_at": datetime.utcnow().isoformat(),
                "processing_time": (datetime.utcnow() - task.created_at).total_seconds()
            }

        except Exception as e:
            logger.error(f"Lead analysis failed: {e}")
            raise

    def _format_lead_for_analysis(self, lead_data: Dict) -> str:
        """Format lead data for AI analysis"""
        return f"""
        Name: {lead_data.get('first_name', '')} {lead_data.get('last_name', '')}
        Email: {lead_data.get('email', 'Not provided')}
        Phone: {lead_data.get('phone', 'Not provided')}
        Company: {lead_data.get('company', 'Unknown')}
        Industry: {lead_data.get('industry', 'Unknown')}
        Source: {lead_data.get('source', 'Unknown')}
        Pipeline: {lead_data.get('pipeline_name', 'Unknown')}
        Status: {lead_data.get('status_name', 'Unknown')}
        Notes: {lead_data.get('notes', 'No notes available')}
        Created: {lead_data.get('created_at', 'Unknown')}
        """

    async def queue_analysis(self, lead_data: Dict, priority: int = 5) -> str:
        """Queue a lead for analysis"""
        task = AgentTask(
            id=f"analysis-{uuid.uuid4().hex[:8]}",
            agent_type=self.agent_type,
            payload={"lead_data": lead_data},
            priority=priority
        )

        await self.task_queue.put(task)
        logger.info(f"Queued lead analysis task {task.id}")
        return task.id

class FollowUpAgent(BaseAIAgent):
    """Specialized coroutine-based agent for follow-up message generation"""

    def __init__(self, agent_id: str = None):
        super().__init__(agent_id or f"follow-up-{uuid.uuid4().hex[:8]}", "follow_up")
        self.task_queue = asyncio.Queue()

    async def _agent_loop(self):
        """Process follow-up generation tasks from queue"""
        try:
            task = await asyncio.wait_for(self.task_queue.get(), timeout=10.0)
            await self._update_status(AgentStatus.PROCESSING, task)

            result = await self.process_task(task)

            self.task_queue.task_done()
            self.processed_count += 1
            await self._update_status(AgentStatus.IDLE)

            return result

        except asyncio.TimeoutError:
            await self._update_status(AgentStatus.IDLE)
            await asyncio.sleep(1)
        except Exception as e:
            logger.error(f"Follow-up agent error: {e}")
            self.error_count += 1
            await self._update_status(AgentStatus.ERROR)
            await asyncio.sleep(5)

    async def process_task(self, task: AgentTask) -> Dict[str, Any]:
        """Generate personalized follow-up messages"""
        lead_data = task.payload.get("lead_data", {})
        context = task.payload.get("context", "")

        system_prompt = """You are a professional sales communication expert.
        Generate a personalized, compelling follow-up message that:
        1. References specific details about the prospect
        2. Provides clear value proposition
        3. Includes a specific call-to-action
        4. Maintains professional but friendly tone
        5. Is concise (under 150 words)

        Format as email-ready content with subject line."""

        lead_context = self._format_lead_for_messaging(lead_data, context)

        try:
            response = await asyncio.wait_for(
                self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Generate follow-up for:\n{lead_context}"}
                    ],
                    temperature=0.7,
                    max_tokens=500
                ),
                timeout=self.task_timeout
            )

            message_content = response.choices[0].message.content

            # Parse subject and body
            lines = message_content.split('\n')
            subject = lines[0].replace('Subject:', '').strip() if lines else "Follow-up on your inquiry"
            body = '\n'.join(lines[1:]).strip() if len(lines) > 1 else message_content

            return {
                "task_id": task.id,
                "lead_id": lead_data.get("id"),
                "subject": subject,
                "body": body,
                "full_message": message_content,
                "agent_id": self.agent_id,
                "model_used": self.model,
                "generated_at": datetime.utcnow().isoformat(),
                "processing_time": (datetime.utcnow() - task.created_at).total_seconds()
            }

        except Exception as e:
            logger.error(f"Message generation failed: {e}")
            raise

    def _format_lead_for_messaging(self, lead_data: Dict, context: str) -> str:
        """Format lead data for message generation"""
        return f"""
        Prospect: {lead_data.get('first_name', '')} {lead_data.get('last_name', '')}
        Company: {lead_data.get('company', 'their company')}
        Industry: {lead_data.get('industry', 'their industry')}
        Source: {lead_data.get('source', 'website')}
        Context: {context or 'Initial outreach'}
        Goal: Schedule consultation call
        """

    async def queue_follow_up(self, lead_data: Dict, context: str = "", priority: int = 5) -> str:
        """Queue a follow-up message generation"""
        task = AgentTask(
            id=f"follow-up-{uuid.uuid4().hex[:8]}",
            agent_type=self.agent_type,
            payload={"lead_data": lead_data, "context": context},
            priority=priority
        )

        await self.task_queue.put(task)
        logger.info(f"Queued follow-up generation task {task.id}")
        return task.id

# AI Orchestration Layer
class AIOrchestrator:
    """Coroutine-based AI orchestration layer for horizontal scalability"""

    def __init__(self):
        self.agents: Dict[str, BaseAIAgent] = {}
        self.agent_tasks: Dict[str, asyncio.Task] = {}
        self.is_running = False

        # Initialize agent pools
        self.lead_analysis_agents = []
        self.follow_up_agents = []

        # Configuration
        self.max_lead_analysis_agents = int(os.getenv("MAX_LEAD_ANALYSIS_AGENTS", "3"))
        self.max_follow_up_agents = int(os.getenv("MAX_FOLLOW_UP_AGENTS", "2"))

    async def start(self):
        """Start the AI orchestration layer"""
        if self.is_running:
            return

        logger.info("Starting AI Orchestration Layer")
        self.is_running = True

        # Start lead analysis agents
        for i in range(self.max_lead_analysis_agents):
            agent = LeadAnalysisAgent(f"lead-analysis-{i}")
            self.lead_analysis_agents.append(agent)
            self.agents[agent.agent_id] = agent

            # Start agent coroutine
            task = asyncio.create_task(agent.start())
            self.agent_tasks[agent.agent_id] = task

        # Start follow-up agents
        for i in range(self.max_follow_up_agents):
            agent = FollowUpAgent(f"follow-up-{i}")
            self.follow_up_agents.append(agent)
            self.agents[agent.agent_id] = agent

            # Start agent coroutine
            task = asyncio.create_task(agent.start())
            self.agent_tasks[agent.agent_id] = task

        logger.info(f"Started {len(self.agents)} AI agents")

    async def stop(self):
        """Stop all AI agents"""
        if not self.is_running:
            return

        logger.info("Stopping AI Orchestration Layer")
        self.is_running = False

        # Cancel all agent tasks
        for task in self.agent_tasks.values():
            task.cancel()

        # Wait for tasks to complete
        await asyncio.gather(*self.agent_tasks.values(), return_exceptions=True)

        self.agents.clear()
        self.agent_tasks.clear()
        self.lead_analysis_agents.clear()
        self.follow_up_agents.clear()

        logger.info("AI Orchestration Layer stopped")

    async def analyze_lead(self, lead_data: Dict, priority: int = 5) -> str:
        """Queue lead for analysis with load balancing"""
        if not self.lead_analysis_agents:
            raise RuntimeError("No lead analysis agents available")

        # Simple round-robin load balancing
        agent = min(self.lead_analysis_agents, key=lambda a: a.task_queue.qsize())
        return await agent.queue_analysis(lead_data, priority)

    async def generate_follow_up(self, lead_data: Dict, context: str = "", priority: int = 5) -> str:
        """Queue follow-up generation with load balancing"""
        if not self.follow_up_agents:
            raise RuntimeError("No follow-up agents available")

        # Simple round-robin load balancing
        agent = min(self.follow_up_agents, key=lambda a: a.task_queue.qsize())
        return await agent.queue_follow_up(lead_data, context, priority)

    def get_system_metrics(self) -> Dict[str, Any]:
        """Get comprehensive system metrics"""
        total_processed = sum(agent.processed_count for agent in self.agents.values())
        total_errors = sum(agent.error_count for agent in self.agents.values())

        agent_metrics = [agent.get_metrics() for agent in self.agents.values()]

        return {
            "orchestrator_status": "running" if self.is_running else "stopped",
            "total_agents": len(self.agents),
            "total_processed": total_processed,
            "total_errors": total_errors,
            "error_rate": total_errors / max(total_processed, 1),
            "agent_metrics": agent_metrics,
            "queue_sizes": {
                "lead_analysis": sum(agent.task_queue.qsize() for agent in self.lead_analysis_agents),
                "follow_up": sum(agent.task_queue.qsize() for agent in self.follow_up_agents)
            },
            "timestamp": datetime.utcnow().isoformat()
        }

    async def scale_agents(self, agent_type: str, target_count: int):
        """Dynamically scale agent pools"""
        if agent_type == "lead_analysis":
            current_agents = self.lead_analysis_agents
            agent_class = LeadAnalysisAgent
        elif agent_type == "follow_up":
            current_agents = self.follow_up_agents
            agent_class = FollowUpAgent
        else:
            raise ValueError(f"Unknown agent type: {agent_type}")

        current_count = len(current_agents)

        if target_count > current_count:
            # Scale up
            for i in range(current_count, target_count):
                agent = agent_class(f"{agent_type}-{i}")
                current_agents.append(agent)
                self.agents[agent.agent_id] = agent

                # Start agent coroutine
                task = asyncio.create_task(agent.start())
                self.agent_tasks[agent.agent_id] = task

            logger.info(f"Scaled up {agent_type} agents from {current_count} to {target_count}")

        elif target_count < current_count:
            # Scale down
            agents_to_remove = current_agents[target_count:]

            for agent in agents_to_remove:
                # Cancel agent task
                if agent.agent_id in self.agent_tasks:
                    self.agent_tasks[agent.agent_id].cancel()
                    del self.agent_tasks[agent.agent_id]

                # Remove from tracking
                if agent.agent_id in self.agents:
                    del self.agents[agent.agent_id]

                current_agents.remove(agent)

            logger.info(f"Scaled down {agent_type} agents from {current_count} to {target_count}")

# Global orchestrator instance
orchestrator = AIOrchestrator()
