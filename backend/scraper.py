"""Five-layer asynchronous competitor pricing scraper for PricePilot."""
import os
os.environ["PLAYWRIGHT_BROWSERS_PATH"] = "/opt/render/.cache/ms-playwright"

import asyncio
import hashlib
import re
import time

import requests
from bs4 import BeautifulSoup

_CACHE: dict[str, dict] = {}
_CACHE_TTL_SECONDS = 86_400
_MAX_RAW_CHARS = 12_000
_MAX_CLEAN_CHARS = 8_000

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}

_PRICING_KEYWORDS = (
    "plan", "price", "pricing", "per month", "per year", "/mo", "/yr",
    "free", "starter", "pro", "enterprise", "business", "team", "annual",
    "monthly", "billed", "usd", "$", "€", "£", "₹", "upgrade",
    "subscribe", "tier", "features included",
)
_NOISE_TAGS = (
    "script", "style", "nav", "footer", "noscript", "iframe", "header",
    "aside", "form", "button", "svg", "img", "video", "audio", "canvas",
    "figure", "picture",
)
_PRICING_SELECTORS = (
    "[class*='pric']", "[class*='plan']", "[class*='tier']",
    "[id*='pric']", "[id*='plan']", "[id*='tier']", "main", "article",
    "[role='main']",
)
_NOISE_PATTERNS = (
    "cookie", "privacy policy", "terms of service", "all rights reserved",
    "sign in", "sign up", "log in", "log out", "get started", "contact us",
    "follow us", "© 20", "copyright", "javascript", "please enable",
    "browser not supported", "loading...", "skip to content",
)


def _cache_key(url: str) -> str:
    return hashlib.md5(url.encode("utf-8"), usedforsecurity=False).hexdigest()


def _get_cached(url: str) -> dict | None:
    key = _cache_key(url)
    entry = _CACHE.get(key)
    if not entry:
        return None
    if time.time() - entry["cached_at"] > _CACHE_TTL_SECONDS:
        _CACHE.pop(key, None)
        return None
    return entry


def _set_cache(url: str, result: dict) -> None:
    _CACHE[_cache_key(url)] = {**result, "cached_at": time.time()}


def _has_pricing_content(text: str) -> bool:
    """Require meaningful length and at least three distinct pricing signals."""
    if not text or len(text.strip()) < 200:
        return False
    lowered = text.casefold()
    return sum(keyword in lowered for keyword in _PRICING_KEYWORDS) >= 3


def _clean_pricing_content(raw_text: str) -> str:
    """Remove duplicated/legal/navigation noise and prioritize pricing lines."""
    pricing_lines: list[str] = []
    context_lines: list[str] = []
    seen: set[str] = set()
    for raw_line in raw_text.splitlines():
        line = re.sub(r"\s+", " ", raw_line).strip()
        normalized = line.casefold()
        if len(line) < 3 or normalized in seen:
            continue
        if any(pattern in normalized for pattern in _NOISE_PATTERNS):
            continue
        if re.fullmatch(r"[\s\d\W]{1,5}", line):
            continue
        target = (
            pricing_lines
            if any(keyword in normalized for keyword in _PRICING_KEYWORDS)
            else context_lines
        )
        target.append(line)
        seen.add(normalized)
    return "\n".join([*pricing_lines, *context_lines])[:_MAX_CLEAN_CHARS]


def _focused_bs4_text(soup: BeautifulSoup) -> str:
    for selector in _PRICING_SELECTORS:
        elements = soup.select(selector)
        if not elements:
            continue
        text = "\n".join(
            element.get_text(separator="\n", strip=True)
            for element in elements
        )
        if _has_pricing_content(text):
            return text
    return soup.get_text(separator="\n", strip=True)


def _layer1_sync(url: str) -> dict:
    response = requests.get(
        url,
        timeout=12,
        headers=_HEADERS,
        allow_redirects=True,
    )
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup.find_all(_NOISE_TAGS):
        tag.decompose()
    raw_text = _focused_bs4_text(soup)
    if _has_pricing_content(raw_text):
        return {
            "text": raw_text[:_MAX_RAW_CHARS],
            "clean_text": _clean_pricing_content(raw_text),
            "status": "success_layer1",
        }
    return {
        "text": raw_text[:_MAX_RAW_CHARS],
        "clean_text": "",
        "status": "too_short_or_no_pricing",
    }


async def _layer2_playwright(url: str) -> dict:
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        return {
            "text": "",
            "clean_text": "",
            "status": "playwright_not_installed",
        }

    raw_text = ""
    async with async_playwright() as playwright:
        browser = None
        try:
            browser = await playwright.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-blink-features=AutomationControlled",
                ],
            )
            context = await browser.new_context(
                user_agent=_HEADERS["User-Agent"],
                viewport={"width": 1280, "height": 800},
                java_script_enabled=True,
            )
            page = await context.new_page()

            async def block_heavy_resources(route):
                if route.request.resource_type in {"image", "media", "font"}:
                    await route.abort()
                else:
                    await route.continue_()

            await page.route("**/*", block_heavy_resources)
            await page.goto(
                url,
                wait_until="domcontentloaded",
                timeout=35_000,
            )
            try:
                await page.wait_for_load_state("networkidle", timeout=10_000)
            except Exception:
                # Analytics/websocket-heavy sites may never become fully idle.
                pass
            await page.wait_for_timeout(2_000)
            for selector in _PRICING_SELECTORS:
                try:
                    locator = page.locator(selector).first
                    text = await locator.inner_text(timeout=3_000)
                    if _has_pricing_content(text):
                        raw_text = text
                        break
                except Exception:
                    continue
            if not raw_text:
                raw_text = await page.inner_text("body")
        except Exception as error:
            return {
                "text": "",
                "clean_text": "",
                "status": f"playwright_failed: {str(error)[:100]}",
            }
        finally:
            if browser:
                await browser.close()

    if _has_pricing_content(raw_text):
        return {
            "text": raw_text[:_MAX_RAW_CHARS],
            "clean_text": _clean_pricing_content(raw_text),
            "status": "success_layer2",
        }
    return {
        "text": raw_text[:_MAX_RAW_CHARS],
        "clean_text": "",
        "status": "no_pricing_content_after_render",
    }


async def scrape_competitor(url: str) -> dict:
    """Run static scrape, rendered scrape, cleaning, validation, then fallback."""
    cached = _get_cached(url)
    if cached:
        return {
            "text": cached["text"],
            "clean_text": cached["clean_text"],
            "status": f"{cached['status']}_cached",
        }

    try:
        result = await asyncio.to_thread(_layer1_sync, url)
        if result["status"] == "success_layer1":
            _set_cache(url, result)
            return result
        print(f"[Scraper] Layer 1 failed for {url}: {result['status']}")
    except Exception as error:
        print(f"[Scraper] Layer 1 exception for {url}: {error}")

    try:
        result = await _layer2_playwright(url)
        if result["status"] == "success_layer2":
            _set_cache(url, result)
            return result
        print(f"[Scraper] Layer 2 failed for {url}: {result['status']}")
    except Exception as error:
        print(f"[Scraper] Layer 2 exception for {url}: {error}")

    return {"text": "", "clean_text": "", "status": "manual_required"}


async def scrape_competitors_concurrent(
    competitors: list[dict],
) -> list[dict]:
    """Scrape all supplied competitors concurrently while preserving order."""
    results = await asyncio.gather(
        *(scrape_competitor(comp["url"]) for comp in competitors),
        return_exceptions=True,
    )
    output = []
    for competitor, result in zip(competitors, results):
        if isinstance(result, Exception):
            output.append(
                {
                    **competitor,
                    "text": "",
                    "clean_text": "",
                    "status": "failed",
                }
            )
        else:
            output.append({**competitor, **result})
    return output
