# Conversational Memory with Compression in PydanticAI

## Overview

This architecture implements conversational memory for AI agents using:

- Rolling conversation summaries
- Sliding window memory
- Context compression
- Token-aware truncation
- Persistent memory
- Semantic memory support

The objective is to maintain long conversations without exceeding the model context window.

---

# High-Level Architecture

```text
User Input
    ↓
Memory Manager
    ├── Rolling Summary
    ├── Recent Messages
    ├── Semantic Memory
    └── Tool State
    ↓
Context Builder
    ↓
PydanticAI Agent
    ↓
LLM Response
    ↓
Memory Update
```

---

# Memory Strategy

The system stores:

| Memory Type | Purpose |
|---|---|
| Rolling Summary | Compressed old conversations |
| Recent Messages | Latest interactions |
| Semantic Memory | Important long-term facts |
| Tool State | Agent/tool execution state |

---

# Core Idea

Instead of sending the full conversation history:

```text
Full Conversation History ❌
```

We send:

```text
Compressed Summary
+
Recent Messages
+
Current Input
```

This dramatically reduces token usage.

---

# Example Workflow

## Initial Conversation

```text
User: Analyze sales data
Assistant: Sure
User: Filter only 2024
Assistant: Done
User: Group by month
Assistant: Done
```

---

# After Compression

```text
Summary:
"User is analyzing 2024 sales grouped monthly"

Recent Messages:
User: Show top products
```

---

# Basic Memory Structure

```python
from dataclasses import dataclass, field

@dataclass
class AgentMemory:

    rolling_summary: str = ""

    recent_messages: list = field(default_factory=list)

    semantic_facts: list = field(default_factory=list)

    tool_state: dict = field(default_factory=dict)
```

---

# Adding Messages

```python
def add_message(memory, role, content):

    memory.recent_messages.append({
        "role": role,
        "content": content
    })
```

---

# Context Builder

```python
def build_context(memory):

    recent = "\n".join(
        f"{m['role']}: {m['content']}"
        for m in memory.recent_messages
    )

    semantic = "\n".join(memory.semantic_facts)

    return f"""
Conversation Summary:
{memory.rolling_summary}

Semantic Facts:
{semantic}

Recent Messages:
{recent}
"""
```

---

# Compression Trigger

Compression can be triggered by:

- Message count
- Token count
- Estimated context size

---

# Message Count Trigger

```python
if len(memory.recent_messages) > 20:
    await compress_memory(memory)
```

---

# Token Count Trigger

```python
if token_count(context) > 12000:
    await compress_memory(memory)
```

---

# Compression Logic

```python
async def compress_memory(memory, llm):

    old_messages = memory.recent_messages[:-5]

    conversation_text = "\n".join(
        f"{m['role']}: {m['content']}"
        for m in old_messages
    )

    prompt = f"""
    Summarize this conversation preserving:

    - user goals
    - technical context
    - decisions
    - preferences
    - important facts

    Conversation:
    {conversation_text}
    """

    result = await llm.run(prompt)

    memory.rolling_summary = result.data

    memory.recent_messages = memory.recent_messages[-5:]
```

---

# Incremental Summarization (Recommended)

Instead of summarizing the entire history repeatedly:

```text
Old Summary + New Messages → Updated Summary
```

This is significantly cheaper and faster.

---

# Incremental Compression Example

```python
async def incremental_compress(memory, llm):

    new_messages = "\n".join(
        f"{m['role']}: {m['content']}"
        for m in memory.recent_messages[:-5]
    )

    prompt = f"""
    Current summary:
    {memory.rolling_summary}

    New messages:
    {new_messages}

    Update the summary preserving important context.
    """

    result = await llm.run(prompt)

    memory.rolling_summary = result.data

    memory.recent_messages = memory.recent_messages[-5:]
```

---

# PydanticAI Integration

## Agent Creation

```python
from pydantic_ai import Agent

agent = Agent(
    model="openai:gpt-4.1"
)
```

---

# Running the Agent

```python
context = build_context(memory)

result = await agent.run(
    user_prompt,
    system_prompt=context
)
```

---

# Updating Memory

```python
add_message(memory, "user", user_prompt)

add_message(memory, "assistant", result.data)
```

---

# Token Counting

Recommended libraries:

- tiktoken
- provider tokenizer APIs

---

# Example Token Counter

```python
import tiktoken

encoding = tiktoken.encoding_for_model("gpt-4")

def token_count(text):

    return len(encoding.encode(text))
```

---

# Sliding Window Memory

Keep only the latest messages:

```python
memory.recent_messages = memory.recent_messages[-5:]
```

This prevents uncontrolled growth.

---

# Semantic Memory

Semantic memory stores long-term facts separately.

Example:

```python
memory.semantic_facts.append(
    "User prefers PostgreSQL"
)
```

---

# Vector Memory (Advanced)

You can store embeddings for retrieval.

Recommended stack:

| Purpose | Tool |
|---|---|
| Embeddings | OpenAI |
| Vector DB | Qdrant |
| Cache | Redis |
| Persistence | PostgreSQL |

---

# Vector Retrieval Flow

```text
User Query
    ↓
Embedding Generation
    ↓
Vector Search
    ↓
Relevant Memories Retrieved
    ↓
Injected Into Context
```

---

# Example Embedding Search

```python
embedding = embed(user_input)

results = vectordb.search(
    embedding,
    top_k=5
)
```

---

# Production Architecture

```text
Frontend
    ↓
API Layer
    ↓
PydanticAI Agent
    ↓
Memory Manager
    ├── Rolling Summary
    ├── Sliding Window
    ├── Semantic Memory
    ├── Redis Cache
    └── PostgreSQL
    ↓
LLM Provider
```

---

# Recommended Technologies

| Component | Recommendation |
|---|---|
| Agent Framework | PydanticAI |
| Cache | Redis |
| Persistence | PostgreSQL |
| Vector Database | Qdrant |
| Embeddings | OpenAI |
| Token Counting | tiktoken |

---

# Benefits

## Reduced Token Usage

Compression dramatically lowers context size.

---

## Better Long Conversations

The agent maintains continuity even after thousands of messages.

---

## Lower Cost

Smaller prompts reduce inference costs.

---

## Better Scalability

Allows persistent multi-session conversations.

---

# Recommended Hybrid Strategy

```text
Rolling Summary
+
Recent Conversation Window
+
Semantic Vector Memory
```

This is the architecture used by most modern production agents.

---

# Best Practices

- Never send the entire conversation history
- Compress old messages
- Preserve recent interactions
- Store important facts separately
- Use token-based compression triggers
- Persist memory externally
- Use incremental summaries whenever possible

---

# Common Mistakes

## Sending Full History

```text
Huge token cost
Slow inference
Context overflow
```

---

## Compressing Too Aggressively

```text
Loss of conversational continuity
Missing important details
```

---

## No Semantic Separation

Mixing:
- conversation
- preferences
- long-term facts
- tool state

creates poor retrieval quality.

---

# Final Recommended Architecture

```text
Conversation
    ↓
Sliding Window
    ↓
Compression
    ↓
Rolling Summary
    ↓
Persistent Storage
    ↓
Semantic Retrieval
    ↓
Context Reconstruction
    ↓
LLM
```