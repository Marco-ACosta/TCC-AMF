"""Initial Migration"""

from alembic import op
import sqlalchemy as sa

revision = "0001_initial_migration"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    schema = "public"

    op.create_table(
        "rooms",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("created_at", sa.BigInteger(), nullable=False),
        sa.Column("updated_at", sa.BigInteger(), nullable=False),
        schema=schema,
    )

def downgrade() -> None:
    schema = "public"
    op.drop_table("rooms", schema=schema)
