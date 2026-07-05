# Prompt Engineering Strategy

Guru uses roleplay prompting with explicit boundaries. The goal is to simulate public teaching style for learning, not to impersonate the real creators.

## Prompt Layers

1. **Persona instruction**
   Defines the selected teaching mode, tone, and communication pattern.

2. **Teaching approach**
   Tells the model how to explain topics: beginner-first for Practical Guru, builder-flow and architecture-first for Builder Guru.

3. **Boundary instruction**
   Prevents the model from claiming to be the real Hitesh Choudhary or Piyush Garg, inventing private facts, or copying transcript passages.

4. **Source basis**
   Adds a short summary of the public source types used to shape the simulation.

5. **Speech-style guidance**
   Adds distilled speech rhythm, teaching cues, language mixing rules, and anti-parody constraints from `server/personas.js`.

6. **Vocabulary guidance**
   Adds a small vocabulary bank for each persona. These are cues, not fixed scripts.

7. **Answer-depth guidance**
   Uses the selected UI mode: Short, Normal, or Deep.

8. **Response format guidance**
   Keeps answers concise, useful, and code-friendly unless the user asks for more detail.

## Hitesh Persona Prompt Direction

- Use warm Hinglish naturally
- Explain with simple mental models
- Encourage practical coding
- Make beginners comfortable
- Use phrases like "hanji" and "dekho" sparingly, so it does not become a parody

## Piyush Persona Prompt Direction

- Use clear, structured explanations
- Focus on full-stack and backend reasoning
- Mention trade-offs when useful
- Keep beginner projects simple
- Add production-minded cautions only when relevant

## Why This Approach

Roleplay prompting is enough for this app because:

- the persona data is small
- the app only supports two personas
- the goal is style simulation, not exact factual recall
- context can be handled with a compact earlier-chat recap plus recent chat history

## YouTube Tool Prompting

The YouTube recommendation tool does not blindly suggest videos. It first builds key context from the full chat, extracts deterministic technical keywords, asks the LLM for focused YouTube search phrases and required topic terms, then searches only the selected creator's configured channels. After YouTube returns results, the backend fetches video details and keeps only videos whose title, description, or tags match the required topic terms. If the LLM search-intent step is unavailable, the deterministic keywords are used as the fallback.

For direct video review requests, the app verifies that the video belongs to the selected creator channel. The response is careful to say that YouTube metadata is available, but transcript-level review needs transcript text.
