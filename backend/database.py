
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

from sqlalchemy.orm import sessionmaker, declarative_base

import os

from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path, override=True)

DATABASE_URL = os.getenv(
    "DATABASE_URL"  # key name in the .env file
)

engine = create_async_engine(DATABASE_URL, echo=False)

AsyncSessionLocal = sessionmaker(
    engine,                      # which database to connect to
    class_=AsyncSession,         # use async session (non-blocking)
    expire_on_commit=False        # keep model data accessible after commit
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:  # open a new session
        yield session                            # give it to the endpoint
