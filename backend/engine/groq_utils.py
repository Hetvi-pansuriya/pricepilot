"""
Shared Groq helper — retry logic, rate-limit handling, JSON parsing.

Groq uses the OpenAI-compatible chat completions API.
Default model: llama3-70b-8192 (fast, accurate, great for structured JSON output).
"""

import asyncio
import json
import re
import os

# Groq model to use — change here to switch model globally
# llama-3.3-70b-versatile is the recommended replacement for the deprecated llama3-70b-8192
GROQ_MODEL = "llama-3.3-70b-versatile"


async def call_groq_with_retry(client, prompt: str, max_retries: int = 3) -> dict:
    """
    Call the Groq chat completion API with retry logic.

    - On JSON parse error: re-prompts asking for clean JSON (once)
    - On rate-limit / 429 error: waits 30 seconds then retries
    - On other errors: breaks immediately
    Raises ValueError if all retries exhausted.
    """
    last_error = None
    current_prompt = prompt

    for attempt in range(max_retries):
        try:
            # Groq SDK is synchronous — run in a thread so we don't block the event loop
            response = await asyncio.to_thread(
                client.chat.completions.create,
                model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a SaaS pricing expert. "
                            "Always respond with ONLY a valid JSON object. "
                            "No markdown fences, no backticks, no explanation outside the JSON."
                        ),
                    },
                    {"role": "user", "content": current_prompt},
                ],
                temperature=0.3,       # low temperature = more deterministic / structured output
                max_tokens=4096,       # enough for full strategy JSON
                response_format={"type": "json_object"},  # enforces JSON output (Groq supports this)
            )

            text = response.choices[0].message.content.strip()

            # Strip markdown fences if the model added them anyway
            if text.startswith("```"):
                text = re.sub(r"^```[a-z]*\n?", "", text)
                text = re.sub(r"\n?```$", "", text)
                text = text.strip()

            return json.loads(text)

        except json.JSONDecodeError as e:
            last_error = f"JSON parse error: {e}"
            if attempt < max_retries - 1:
                # Re-prompt asking for clean JSON
                current_prompt = (
                    current_prompt
                    + "\n\nCRITICAL: Your previous response was not valid JSON. "
                    "Return ONLY a valid JSON object. No markdown, no backticks, no text outside the JSON braces."
                )
            continue

        except Exception as e:
            error_str = str(e)
            # Rate limit — wait and retry
            if "rate_limit" in error_str.lower() or "429" in error_str or "rate limit" in error_str.lower():
                wait_seconds = 30
                print(f"Groq rate limit hit on attempt {attempt + 1}, waiting {wait_seconds}s...")
                await asyncio.sleep(wait_seconds)
                continue
            # Any other error — stop immediately
            last_error = error_str
            break

    raise ValueError(f"Groq API failed after {max_retries} retries: {last_error}")
