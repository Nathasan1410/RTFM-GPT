# API Reference

RTFM-GPT uses a single API endpoint to proxy requests to Cerebras AI.

## `POST /api/generate`

Generates a learning roadmap for a given topic.

### Request Body

```json
{
  "topic": "string",
  "existingTitles": ["string"]
}
```

-   **topic**: The subject to learn (min 3 chars).
-   **existingTitles**: Optional array of titles the user already has (to avoid duplicates).

### Response

**Success (200 OK)**

```json
{
  "title": "Roadmap Title",
  "modules": [
    {
      "order": 1,
      "title": "Module Title",
      "context": "Why this is important...",
      "docUrl": "https://official.docs/...",
      "challenge": "Actionable task..."
    }
  ]
}
```

**Error (400 Bad Request)**

```json
{
  "error": "Invalid input",
  "details": [ ...zod errors ]
}
```

**Error (429 Too Many Requests)**

```json
{
  "error": "Too many requests. Please try again later."
}
```
