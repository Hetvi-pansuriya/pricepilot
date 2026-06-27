"""
Shared Gemini helper — retry logic, quota handling, JSON parsing.
"""

import asyncio
import json
import re


async def call_gemini_with_retry(model, prompt: str, max_retries: int = 2) -> dict:
    """
    Call the Gemini model with retry logic.

    - On JSON parse error: re-prompts asking for clean JSON (once)
    - On quota / 429 error: waits 60 seconds then retries
    - On other errors: breaks immediately
    Raises ValueError if all retries exhausted.
    """
    last_error = None
    current_prompt = prompt

    for attempt in range(max_retries):
        try:
            response = await asyncio.to_thread(model.generate_content, current_prompt)
            text = response.text.strip()

            # Strip markdown fences if Gemini added them
            if text.startswith("```"):
                text = re.sub(r"^```[a-z]*\n?", "", text)
                text = re.sub(r"\n?```$", "", text)
                text = text.strip()

            return json.loads(text)

        except json.JSONDecodeError as e:
            last_error = f"JSON parse error: {e}"
            if attempt == 0:
                # Re-prompt asking for clean JSON
                current_prompt = (
                    current_prompt
                    + "\n\nIMPORTANT: Your previous response was not valid JSON. "
                    "Return ONLY a valid JSON object. No markdown, no backticks, no explanation."
                )
            continue

        except Exception as e:
            error_str = str(e)
            if "quota" in error_str.lower() or "429" in error_str:
                # Quota exceeded — wait 60 s and retry
                await asyncio.sleep(60)
                continue
            last_error = error_str
            break

    raise ValueError(f"Gemini failed after {max_retries} retries: {last_error}")
