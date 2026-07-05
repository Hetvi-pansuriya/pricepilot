#!/bin/bash
set -e

# WeasyPrint system dependencies
apt-get install -y libpango-1.0-0 libpangoft2-1.0-0 libgdk-pixbuf2.0-0 libffi-dev libcairo2

# Python dependencies and database migration
pip install -r backend/requirements.txt
cd backend
alembic upgrade head
cd ..

# Chromium runtime for JavaScript-rendered pricing pages
export PLAYWRIGHT_BROWSERS_PATH=/opt/render/.cache/ms-playwright
playwright install-deps chromium
playwright install chromium
