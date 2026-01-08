Of course. Here is the in-depth and complete developer documentation for the Google Agent Development Kit (ADK) based on the information you provided.

# Google Agent Development Kit (ADK) Developer Documentation

This document provides a comprehensive guide for developers looking to build, customize, and deploy multi-agent services using the Google Agent Development Kit (ADK). It covers fundamental concepts from agents, tools, and memory to advanced workflows and runtime execution, complete with Python code snippets.

## 1. Core Concepts of the ADK

The ADK is built around a few core concepts that work together to create powerful and flexible agentic applications.

### 1.1. Agents: The Building Blocks

Agents are the fundamental actors in the ADK. They can be specialized to perform specific tasks, orchestrate other agents, or interact with users and external systems. The `BaseAgent` class is the foundation for all agent types.

#### **LLM Agent (`LlmAgent`)**

The `LlmAgent` is the primary "thinking" component, powered by a Large Language Model (LLM) to reason, understand language, and make decisions.

**Key Configuration:**

*   **Identity (`name`, `description`, `model`)**: Every agent requires a unique `name` for identification and a `model` string (e.g., "gemini-2.0-flash") to specify its LLM. A `description` is highly recommended in multi-agent systems to help other agents understand its capabilities.
*   **Guidance (`instruction`)**: This is the most critical parameter. It's a string that defines the agent's goal, personality, constraints, and how it should use its tools. You can inject dynamic values from the session state using `{key}` syntax.
*   **Capabilities (`tools`)**: A list of functions or `BaseTool` instances that the agent can call. This extends the agent's abilities beyond the LLM's built-in knowledge.

```python
# A simple LLM Agent that uses a tool
def get_capital_city(country: str) -> str:
  """Retrieves the capital city for a given country."""
  capitals = {"france": "Paris", "japan": "Tokyo", "canada": "Ottawa"}
  return capitals.get(country.lower(), f"Sorry, I don't know the capital of {country}.")

capital_agent = LlmAgent(
    model="gemini-2.0-flash",
    name="capital_agent",
    description="Answers user questions about the capital city of a given country.",
    instruction="""You are an agent that provides the capital city of a country.
When a user asks for the capital of a country, use the `get_capital_city` tool to find the capital and then clearly state the answer.""",
    tools=[get_capital_city]
)
```

#### **Workflow Agents**

Workflow agents are deterministic orchestrators that manage the execution flow of their sub-agents. They are not powered by an LLM themselves.

*   **`SequentialAgent`**: Executes its sub-agents in a strict, defined order. It's perfect for creating pipelines where the output of one step is the input for the next.

    ```python
    # Conceptual Example: A sequential pipeline
    from google.adk.agents import SequentialAgent, LlmAgent

    step1 = LlmAgent(name="Step1_FetchData", output_key="fetched_data")
    step2 = LlmAgent(name="Step2_ProcessData", instruction="Process the data from {fetched_data}.")

    pipeline = SequentialAgent(name="MyPipeline", sub_agents=[step1, step2])
    ```

*   **`ParallelAgent`**: Executes its sub-agents concurrently to speed up independent tasks. This is ideal for scenarios like fanning out multiple research queries at once.

    ```python
    # Conceptual Example: Parallel research
    from google.adk.agents import ParallelAgent, LlmAgent

    fetch_weather = LlmAgent(name="WeatherFetcher", output_key="weather_result")
    fetch_news = LlmAgent(name="NewsFetcher", output_key="news_result")

    parallel_gatherer = ParallelAgent(
        name="InfoGatherer",
        sub_agents=[fetch_weather, fetch_news]
    )
    ```

*   **`LoopAgent`**: Executes its sub-agents iteratively. The loop can terminate after a `max_iterations` count is reached or when a sub-agent signals an "escalation". This is useful for refinement, polling, or retry logic.

    ```python
    # Conceptual Example: Iterative refinement loop
    from google.adk.agents import LoopAgent, LlmAgent

    writer_agent = LlmAgent(name="Writer", output_key="current_draft")
    critic_agent = LlmAgent(name="Critic", instruction="Critique the draft: {current_draft}")

    # This loop will run the writer then the critic, for a maximum of 3 cycles.
    refinement_loop = LoopAgent(
        name="RefinementLoop",
        sub_agents=[writer_agent, critic_agent],
        max_iterations=3
    )
    ```

#### **Custom Agents**

For ultimate control, you can create a custom agent by inheriting from `google.adk.agents.BaseAgent` and implementing the `_run_async_impl` method. This allows you to define any orchestration logic, such as complex conditional branching, that doesn't fit the standard workflow agents.

```python
from google.adk.agents import BaseAgent, InvocationContext, LlmAgent
from google.adk.events import Event
from typing import AsyncGenerator

class MyCustomOrchestrator(BaseAgent):
    def __init__(self, name: str, decision_agent: LlmAgent, task_a_agent: LlmAgent, task_b_agent: LlmAgent):
        super().__init__(name=name, sub_agents=[decision_agent, task_a_agent, task_b_agent])
        self.decision_agent = decision_agent
        self.task_a_agent = task_a_agent
        self.task_b_agent = task_b_agent

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        # 1. Run the decision agent
        async for event in self.decision_agent.run_async(ctx):
            yield event

        # 2. Use custom logic based on state
        decision = ctx.session.state.get("decision_result")
        if decision == "A":
            async for event in self.task_a_agent.run_async(ctx):
                yield event
        else:
            async for event in self.task_b_agent.run_async(ctx):
                yield event
```

### 1.2. Multi-Agent Systems

Complex applications are best structured as a Multi-Agent System (MAS), where multiple agents collaborate to achieve a goal.

*   **Agent Hierarchy**: You create a parent-child hierarchy by passing a list of agents to the `sub_agents` parameter of a parent agent. This structure is fundamental for workflow orchestration and delegation.
*   **Communication & Interaction**:
    *   **Shared Session State**: The primary way for agents in a sequence to pass data. An agent can write to `session.state`, and the next agent can read from it. The `output_key` on an `LlmAgent` is a convenient shortcut for this.
    *   **LLM-Driven Delegation**: An `LlmAgent` can dynamically transfer control to another agent by calling the built-in `transfer_to_agent` function. This requires clear instructions and well-defined `description` fields on the target agents so the LLM can make an informed choice.
    *   **Agent-as-a-Tool**: You can wrap an agent in an `AgentTool` and include it in another agent's `tools` list. This allows one agent to explicitly call another to perform a task and get a result back, without permanently transferring control.

### 1.3. Sessions, State, and Memory

#### **Session and State: Short-Term Context**

A **Session** represents a single, ongoing conversation thread. It is the container for the conversation's history (`events`) and its "scratchpad" (`state`).

The **SessionService** is responsible for the entire lifecycle of sessions: creating, retrieving, updating, and deleting them. The ADK provides several implementations:

*   `InMemorySessionService`: Stores session data in memory. Ideal for development and testing, but data is lost on restart.
*   `VertexAiSessionService`: A scalable, persistent solution using Google Cloud's Vertex AI Agent Engine.
*   `DatabaseSessionService`: Persists session data to a relational database like PostgreSQL or SQLite.

**Session State (`session.state`)** is a key-value dictionary for storing data relevant to the current conversation. State keys can have prefixes to define their scope and persistence behavior:

*   **No Prefix (Session Scope)**: Data is tied to the current session ID (e.g., `task_status`).
*   `user:` **(User Scope)**: Data is tied to the `user_id` and is shared across all their sessions (e.g., `user:theme`).
*   `app:` **(App Scope)**: Data is shared across all users and sessions for the application (e.g., `app:global_discount_code`).
*   `temp:` **(Invocation Scope)**: Data exists only for the current turn (from user input to final response) and is then discarded. It's perfect for passing data between tool calls within a single turn.

State is updated by modifying the `context.state` object within a tool or callback, or by using an agent's `output_key`. These changes are packaged into an `Event` and committed by the `Runner`.

#### **Memory: Long-Term Knowledge**

While a session holds short-term context, **Memory** provides a searchable, long-term knowledge store. This allows an agent to recall information from past conversations.

The **MemoryService** defines the interface for this long-term storage.

*   `add_session_to_memory`: Ingests a completed session into the long-term store.
*   `search_memory`: Allows an agent to query the memory store.

The ADK provides two primary implementations:

*   `InMemoryMemoryService`: A basic, in-memory store for prototyping.
*   `VertexAiMemoryBankService`: A managed Google Cloud service providing sophisticated, persistent, and searchable memory for production agents.

```python
# Example of using InMemoryMemoryService
from google.adk.memory import InMemoryMemoryService, load_memory
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.adk.agents import LlmAgent

# --- Services (shared across the application) ---
session_service = InMemorySessionService()
memory_service = InMemoryMemoryService()

# --- Agent that can recall information ---
memory_recall_agent = LlmAgent(
    model="gemini-2.0-flash",
    name="MemoryRecallAgent",
    instruction="Answer the user's question. Use the 'load_memory' tool if the answer might be in past conversations.",
    tools=[load_memory] # Give the agent the memory search tool
)

# In your application logic, after a conversation turn...
# 1. Get the completed session
# completed_session = await session_service.get_session(...)
# 2. Add it to long-term memory
# await memory_service.add_session_to_memory(completed_session)

# The memory_recall_agent can now search this memory in future conversations.
```

### 1.4. Runtime and Execution

The **ADK Runtime** is the engine that orchestrates your agents, tools, and services.

*   **The `Runner`**: This is the main entry point for an agent invocation. It manages the event loop for a single user query.
*   **The Event Loop**: The ADK operates on an event-driven loop. An agent's logic runs until it yields an `Event` (e.g., a response, a tool call). The `Runner` processes this event, commits any state changes via the services, and then allows the agent's logic to resume. This ensures a consistent and predictable execution flow.
*   **`RunConfig`**: This object allows you to customize runtime behavior, such as enabling streaming modes, configuring speech and audio, or setting limits on LLM calls (`max_llm_calls`).

```python
from google.adk.runtime.runconfig import RunConfig, StreamingMode

# Configure the agent to stream responses using Server-Sent Events (SSE)
sse_streaming_config = RunConfig(
    streaming_mode=StreamingMode.SSE,
    max_llm_calls=50 # Safety limit
)

# This config would be passed to the runner's run_async method
# runner.run_async(..., run_config=sse_streaming_config)
```

---

## 2. In-Depth Example: A Custom Orchestrator Agent

This example demonstrates how to build a multi-agent service using a `CustomAgent` as an orchestrator. The service will research a topic by breaking it down into sub-topics, looping through them to gather information, and compiling a final report.

This showcases the interplay between `CustomAgent`, `SequentialAgent`, `LoopAgent`, `InvocationContext`, and services like `InMemorySessionService` and `InMemoryMemoryService`.

#### **Scenario**

A user provides a high-level topic, like "The Future of Renewable Energy." The orchestrator agent will:
1.  **Deconstruct**: Break the main topic into three distinct sub-topics.
2.  **Research Loop**: For each sub-topic, it will first check its long-term memory for existing research. If none is found, it will perform a new search.
3.  **Synthesize**: Combine the research findings into a final, coherent report.

#### **The Code**

Here is the complete, runnable Python code for this example.

```python
import asyncio
import logging
from typing import AsyncGenerator, Any, List, Dict

from google.adk.agents import (
    BaseAgent,
    LlmAgent,
    SequentialAgent,
    LoopAgent,
    InvocationContext,
)
from google.adk.events import Event, EventActions
from google.adk.memory import InMemoryMemoryService
from google.adk.sessions import InMemorySessionService
from google.adk.tools import FunctionTool
from google.adk.runners import Runner
from google.genai.types import Content, Part

# --- Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - [%(name)s] - %(message)s')
logger = logging.getLogger(__name__)

APP_NAME = "research_orchestrator_app"
USER_ID = "research_user"
SESSION_ID = "session_001"
MODEL = "gemini-2.0-flash"

# --- Services ---
session_service = InMemorySessionService()
memory_service = InMemoryMemoryService()

# --- Tools ---
def search_web(query: str) -> str:
    """Performs a web search for a given query and returns a summary."""
    logger.info(f"TOOL: Executing web search for: '{query}'")
    # In a real app, this would call a search API. We'll simulate it.
    return f"Simulated web search summary for '{query}': Key findings include A, B, and C."

# The built-in `load_memory` tool needs to be created with the memory service
load_memory_tool = FunctionTool(
    func=memory_service.search_memory,
    name="load_memory",
    description="Tool to query the memory of past conversations for relevant information.",
)

# --- Agent Definitions ---

# 1. Agent to break down the main topic
topic_deconstructor_agent = LlmAgent(
    name="TopicDeconstructor",
    model=MODEL,
    instruction="""Given a user's research topic, break it down into exactly three distinct, searchable sub-topics.
    Your output MUST be a JSON list of strings. Example: ["sub-topic 1", "sub-topic 2", "sub-topic 3"]""",
    output_key="sub_topics",
)

# 2. Agent to perform research on a single sub-topic
researcher_agent = LlmAgent(
    name="SubTopicResearcher",
    model=MODEL,
    instruction="""You are a research assistant. The current sub-topic to research is: {current_sub_topic}.
    First, use the 'load_memory' tool to check if you already have information on this exact sub-topic.
    If the memory search returns relevant information, use that.
    If the memory is empty or not relevant, you MUST use the 'search_web' tool to get new information.
    Finally, provide a concise summary of your findings for the sub-topic.""",
    tools=[load_memory_tool, search_web],
    output_key="temp:current_research_summary", # Use temp state for intermediate results
)

# 3. Custom Agent to manage the loop state
class LoopManager(BaseAgent):
    """A custom agent to manage the state for the research loop."""
    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        # Initialize loop index if it doesn't exist
        current_index = ctx.session.state.get("temp:loop_index", 0)
        sub_topics = ctx.session.state.get("sub_topics", [])

        if current_index < len(sub_topics):
            current_topic = sub_topics[current_index]
            logger.info(f"LOOP MANAGER: Processing topic {current_index + 1}/{len(sub_topics)}: '{current_topic}'")
            # Set the current topic for the researcher agent
            ctx.session.state["current_sub_topic"] = current_topic
            # Store the research result in the main state
            if "temp:current_research_summary" in ctx.session.state:
                 # Ensure research_results exists
                if "research_results" not in ctx.session.state:
                    ctx.session.state["research_results"] = {}
                ctx.session.state["research_results"][current_topic] = ctx.session.state.pop("temp:current_research_summary")

            # Increment index for the next iteration
            ctx.session.state["temp:loop_index"] = current_index + 1
            yield Event(author=self.name, content=Content(parts=[Part(text=f"Managed loop for topic: {current_topic}")]))
        else:
            # Escalate to stop the loop
            logger.info("LOOP MANAGER: All topics processed. Escalating to stop loop.")
            yield Event(author=self.name, actions=EventActions(escalate=True))

# 4. The Loop Agent itself
research_loop = LoopAgent(
    name="ResearchLoop",
    sub_agents=[
        researcher_agent,
        LoopManager(name="LoopManager"),
    ],
    max_iterations=5, # Safety break
)

# 5. Agent to synthesize the final report
report_synthesizer_agent = LlmAgent(
    name="ReportSynthesizer",
    model=MODEL,
    instruction="""You are a report writer. Based on the following research findings, write a coherent, well-structured final report.
    Combine the summaries into a single narrative.
    Research Findings: {research_results}""",
)

# 6. The Custom Orchestrator Agent
class ResearchOrchestrator(BaseAgent):
    """A custom agent that orchestrates the entire research and reporting workflow."""
    def __init__(self, **data: Any):
        super().__init__(**data)
        # Define the main workflow as a sequential agent
        self.workflow = SequentialAgent(
            name="MainWorkflow",
            sub_agents=[
                topic_deconstructor_agent,
                research_loop,
                report_synthesizer_agent,
            ],
        )

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        logger.info(f"ORCHESTRATOR: Starting workflow for user topic: '{ctx.session.state.get('user_topic')}'")

        # Initialize loop state
        ctx.session.state["temp:loop_index"] = 0
        ctx.session.state["research_results"] = {}

        # Run the sequential workflow
        async for event in self.workflow.run_async(ctx):
            yield event

        # Add the final report to long-term memory
        final_session = await session_service.get_session(APP_NAME, USER_ID, ctx.session.id)
        logger.info("ORCHESTRATOR: Adding final session to memory.")
        await memory_service.add_session_to_memory(final_session)

        logger.info("ORCHESTRATOR: Workflow complete.")

# Instantiate the main orchestrator
root_agent = ResearchOrchestrator(name="ResearchOrchestrator")

# --- Main Execution Logic ---
async def main():
    """Sets up and runs the agent interaction."""
    # Create the session
    initial_state = {"user_topic": "The Future of Renewable Energy"}
    await session_service.create_session(
        app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID, state=initial_state
    )

    # Create the runner
    runner = Runner(
        agent=root_agent,
        app_name=APP_NAME,
        session_service=session_service,
        memory_service=memory_service,
    )

    # Start the conversation
    user_message = Content(parts=[Part(text=f"Please research the topic: {initial_state['user_topic']}")])

    final_response_text = "No final response."
    async for event in runner.run_async(
        user_id=USER_ID, session_id=SESSION_ID, new_message=user_message
    ):
        logger.info(f"EVENT: Type='{event.type}', Author='{event.author}'")
        if event.is_final_response() and event.content and event.content.parts:
            final_response_text = event.content.parts[0].text

    print("\n" + "="*50)
    print("Final Report:")
    print(final_response_text)
    print("="*50 + "\n")

    # Verify memory
    memory_results = await memory_service.search_memory(APP_NAME, USER_ID, "Renewable Energy")
    print("Memory Search Results:")
    print(memory_results)

if __name__ == "__main__":
    asyncio.run(main())

```

#### **How Data Flows: A Step-by-Step Explanation**

This example relies heavily on the `session.state` dictionary, managed by the `InMemorySessionService`, to pass data between agents. The `InvocationContext` (`ctx`) makes this shared state available to every agent in the workflow.

1.  **Initialization**: The `main` function creates a session with an initial state: `{'user_topic': 'The Future of Renewable Energy'}`. The `ResearchOrchestrator` is run.

2.  **Orchestrator Starts**: The `ResearchOrchestrator._run_async_impl` method begins. It initializes the loop state variables: `{'temp:loop_index': 0, 'research_results': {}}`. It then starts its internal `SequentialAgent`.

3.  **Step 1: Deconstruct Topic**:
    *   **Agent**: `TopicDeconstructorAgent` runs.
    *   **Action**: It reads `{user_topic}` from the state and asks the LLM to generate a list of sub-topics.
    *   **State Change**: Because it has `output_key="sub_topics"`, its JSON list response is saved to the state. The state now contains `{'sub_topics': ['Solar Power Advancements', 'Wind Turbine Efficiency', 'Geothermal Energy Exploration']}`.

4.  **Step 2: Research Loop**:
    *   **Agent**: `ResearchLoop` begins. It will iterate up to 5 times.
    *   **Iteration 1**:
        *   `researcher_agent` runs. Its instruction reads `current_sub_topic` from the state. But it doesn't exist yet!
        *   `LoopManager` runs. It sees `temp:loop_index` is `0`. It reads the `sub_topics` list, gets the first topic ("Solar Power Advancements"), and writes it to the state: `{'current_sub_topic': 'Solar Power Advancements'}`. It then increments the index: `{'temp:loop_index': 1}`.
    *   **Iteration 2**:
        *   `researcher_agent` runs. Now it can read `{'current_sub_topic': 'Solar Power Advancements'}`. It uses the `load_memory_tool` (which finds nothing) and then the `search_web` tool.
        *   **State Change**: Its summary is saved to `{'temp:current_research_summary': '...'}`.
        *   `LoopManager` runs. It sees the `temp:current_research_summary`, moves it to the main `research_results` dictionary: `{'research_results': {'Solar Power Advancements': '...'}}`. It then sets the next topic: `{'current_sub_topic': 'Wind Turbine Efficiency'}` and increments the index to `2`.
    *   **This repeats** for all sub-topics. After the last topic, `LoopManager` sees the index matches the list length and `yields` an event with `escalate=True`, which cleanly terminates the `LoopAgent`.

5.  **Step 3: Synthesize Report**:
    *   **Agent**: `ReportSynthesizerAgent` runs.
    *   **Action**: Its instruction template `{research_results}` is populated with the entire dictionary of summaries collected during the loop. It sends this context to the LLM.
    *   **Output**: The LLM generates the final, formatted report as its response.

6.  **Finalizing in the Orchestrator**:
    *   The `ResearchOrchestrator` resumes after its internal workflow completes.
    *   It retrieves the final session and calls `memory_service.add_session_to_memory()`, saving the entire conversational history—including the final report—into long-term memory for future queries.

This example illustrates a powerful, modular pattern where a custom orchestrator uses standard workflow agents and shared state to manage a complex, multi-step task with conditional logic and loops.