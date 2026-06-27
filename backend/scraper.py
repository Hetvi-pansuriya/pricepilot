"""
3-Layer async competitor scraper.

Layer 1: requests + BeautifulSoup (fast, sync wrapped in thread)
Layer 2: Playwright (JS-rendered pages, async)
Layer 3: handled by PATCH .../manual endpoint (user pastes text directly)
"""

import asyncio
import requests
from bs4 import BeautifulSoup

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}


def _layer1_sync(url: str) -> dict:
    """Synchronous requests + BS4 scrape."""
    response = requests.get(url, timeout=10, headers=_HEADERS)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    # Remove noise tags
    for tag in soup.find_all(["script", "style", "nav", "footer", "noscript"]):
        tag.decompose()

    text = soup.get_text(separator="\n", strip=True)
    if len(text) > 500:
        return {"text": text, "status": "success_layer1"}
    return {"text": "", "status": "too_short"}


async def _layer2_playwright(url: str) -> dict:
    """Playwright headless Chromium scrape."""
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        return {"text": "", "status": "failed"}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            await page.goto(url, wait_until="networkidle", timeout=30000)
            text = await page.inner_text("body")
        finally:
            await browser.close()

    if len(text) > 500:
        return {"text": text, "status": "success_layer2"}
    return {"text": "", "status": "failed"}


async def scrape_competitor(url: str) -> dict:
    """
    Try Layer 1, fall back to Layer 2.
    Returns {"text": str, "status": str}.
    """
    # Layer 1
    try:
        result = await asyncio.to_thread(_layer1_sync, url)
        if result["status"] == "success_layer1":
            return result
    except Exception:
        pass  # fall through to Layer 2

    # Layer 2
    try:
        result = await _layer2_playwright(url)
        return result
    except Exception:
        return {"text": "", "status": "failed"}
