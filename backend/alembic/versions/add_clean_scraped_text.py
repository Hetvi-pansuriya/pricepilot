"""Add clean_scraped_text to competitors.

Revision ID: 0002
Revises: None
"""

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = None
branch_labels = None
depends_on = None


def _columns(inspector) -> set[str]:
    return {
        column["name"]
        for column in inspector.get_columns("competitors")
    }


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "competitors" not in inspector.get_table_names():
        # On a fresh install, FastAPI's create_all creates the new model schema.
        return
    if "clean_scraped_text" not in _columns(inspector):
        op.add_column(
            "competitors",
            sa.Column("clean_scraped_text", sa.Text(), nullable=True),
        )


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if (
        "competitors" in inspector.get_table_names()
        and "clean_scraped_text" in _columns(inspector)
    ):
        op.drop_column("competitors", "clean_scraped_text")
