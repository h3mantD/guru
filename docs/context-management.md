# Context Management

Guru uses recent-message context plus a compact earlier-conversation recap for chat responses. Video recommendations use compact keyword context from the conversation.

## Chat Response Strategy

The frontend sends the current chat messages to `POST /api/chat`.

The backend then:

1. Removes unsupported roles such as `system`
2. Trims whitespace
3. Drops empty messages
4. Builds a compact recap from older turns when the chat is long
5. Keeps the latest 12 messages as the live message window

This logic lives in `server/context.js`.

The cleaned messages are then passed to `server/chatService.js`, which combines:

- the selected persona prompt
- source basis
- speech-style guidance
- vocabulary guidance
- answer-depth guidance
- earlier conversation recap when available
- latest chat turns

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

For longer chats, Guru sends the latest messages and a compact recap of older turns. This keeps important earlier details available without sending the entire chat every time.

The recap keeps track of useful continuity details such as the user's goal, selected stack, constraints, decisions already made, and earlier examples. The latest messages still stay separate so the assistant can prioritize the current question.

## Future Improvement

A later version could store the recap in the browser so it can survive a page refresh.
