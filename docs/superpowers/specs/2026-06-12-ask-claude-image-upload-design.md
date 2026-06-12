# Ask Claude — Image Upload

**Date:** 2026-06-12  
**Status:** Approved  
**Approach:** Base64 in-memory, text-only persistence (Approach A)

---

## Problem

Ask Claude currently accepts text only. Users want to paste or upload screenshots — charts, options chains, order tickets from Robinhood — and have Claude analyze them inline.

---

## Scope

- File picker upload (paperclip button in ChatInput)
- Single image per message
- JPEG, PNG, WebP, GIF support
- Images are ephemeral: not stored in Supabase, not re-rendered on reload
- No schema changes required

Out of scope: clipboard paste, drag-and-drop, multiple images per message, image persistence.

---

## Architecture

### Data flow

```
User picks file
  → FileReader reads as base64 (client)
  → Local object URL created for preview display
  → On send: POST /api/ask with { user_message, image_base64, image_media_type }
  → Route builds Anthropic content array: [image block, text block]
  → Anthropic streams response
  → Supabase persists only the text portion of the user message
```

### No storage infrastructure needed

Images never leave the client-server round trip. Supabase `messages.content` stays as plain text. The only schema-adjacent change is that persisted user messages gain an `[image]` prefix when an image was attached, so conversation history is legible.

---

## Component changes

### `ChatInput.tsx`

New state: `pendingImage: File | null`

- Add a paperclip `<button>` left of the textarea. Clicking it triggers a hidden `<input type="file" accept="image/jpeg,image/png,image/webp,image/gif">`.
- When a file is selected, set `pendingImage`. Create a local object URL (`URL.createObjectURL`) and store as `pendingImageUrl` for display.
- Show a thumbnail preview strip above the textarea: small rounded image (48×48), with an ✕ button to clear it.
- On `send()`, pass `pendingImage` up to `AskChat` alongside the text. Clear `pendingImage` and revoke the object URL after send.
- Disable the paperclip button while `isStreaming`.

Props change: `onSend(text?: string, image?: File)` — image is optional.

### `AskChat.tsx`

- `send()` accepts an optional `File`.
- If a file is present, read it as base64 via `FileReader` before posting.
- POST body gains two optional fields: `image_base64: string`, `image_media_type: string`.
- Message added to local state: `{ role: "user", content: text, imageUrl?: string }` where `imageUrl` is the local object URL for display in the thread.
- After send, revoke the object URL to free memory.

### `ChatThread.tsx` / `Message` type

Expand the `Message` interface:

```ts
export interface Message {
  role: "user" | "assistant"
  content: string
  imageUrl?: string  // local object URL, ephemeral
}
```

`UserBubble` gains an optional image block rendered above the text:

```
┌─────────────────────────────────┐
│  [img thumbnail 120×80 rounded] │
│  "What's the IV on this chain?" │
└─────────────────────────────────┘
```

Image is rendered as `<img src={imageUrl} />` with `max-height: 200px`, `border-radius: 8px`, `object-fit: contain`.

---

## API route — `/api/ask/route.ts`

### Request body

```ts
{
  conversation_id?: string
  user_message: string
  image_base64?: string        // base64-encoded image data
  image_media_type?: string    // "image/jpeg" | "image/png" | "image/webp" | "image/gif"
}
```

### Anthropic message construction

When `image_base64` is present, the user turn content becomes an array:

```ts
[
  {
    type: "image",
    source: {
      type: "base64",
      media_type: image_media_type,
      data: image_base64,
    },
  },
  {
    type: "text",
    text: user_message,
  },
]
```

When no image, content remains a plain string (no change to existing path).

### Persistence

```ts
const persistedContent = image_base64
  ? `[image] ${user_message}`
  : user_message
```

Stored in `messages.content`. No schema change.

### Conversation history

Only text messages in history are sent back to Anthropic for multi-turn context. Prior image turns appear as `[image] <user text>` — Claude understands the context even without the image bytes.

### System prompt addition

Append to the existing system prompt:

> The user may attach images to their messages (screenshots of charts, options chains, Robinhood order tickets, news). Analyze the image content directly and relate it to the supply chain context.

---

## Validation and error handling

- Client-side: reject files over 5 MB (Anthropic limit) with an inline error below the thumbnail: `"Image too large — max 5 MB"`.
- Client-side: reject unsupported MIME types with `"Unsupported format — use JPG, PNG, WebP, or GIF"`.
- Server-side: if `image_base64` is present but `image_media_type` is missing or invalid, return 400.
- Server-side: `image_base64` length > ~6.7 MB (5 MB base64-encoded overhead) → return 400 `"Image too large"`.

---

## Git branch

Feature branch: `feat/ask-image-upload`
