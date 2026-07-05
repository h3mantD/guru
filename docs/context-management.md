# Context Management

Guru uses recent-message context for chat responses and compact keyword context for YouTube recommendations.

## Chat Response Strategy

The frontend sends the current chat messages to `POST /api/chat`.

The backend then:

1. Removes unsupported roles such as `system`
2. Trims whitespace
3. Drops empty messages
4. Keeps only the latest 12 messages

This logic lives in `server/context.js`.

The cleaned messages are then passed to `server/chatService.js`, which combines them with the selected persona prompt, source basis, speech-style guidance, vocabulary guidance, and answer-depth guidance.

## YouTube Recommendation Strategy

For video recommendations, the frontend sends the current conversation to `POST /api/youtube/recommendations`.

The backend then:

1. Cleans the messages with the same recent-message trimming logic
2. Builds a compact key context from user and assistant messages
3. Extracts technical keywords such as Redis, WebSocket, SQL, JWT, Docker, backend, or system design
4. Searches only the selected creator's configured channel or channels
5. Fetches video details for the search results
6. Keeps only videos whose title, description, or tags match the extracted context

This logic lives in `server/youtubeService.js`.

For direct video-detail requests, the backend extracts the YouTube video ID and verifies that the video belongs to the selected creator's configured channel before returning metadata.

## Long Conversations

For longer chats, only the latest messages are sent to the model. This keeps the request small and helps the app stay simple.

Trade-off:

- Good: easy to understand and maintain
- Good: avoids token growth
- Limitation: older conversation details can be forgotten

## Future Improvement

A later version could add a short running summary when the chat gets long.
