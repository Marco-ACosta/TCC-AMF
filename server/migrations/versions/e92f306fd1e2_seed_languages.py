"""seed languages

Revision ID: e92f306fd1e2
Revises: 3f591d66dae6
Create Date: 2025-09-25 23:28:14.662145
"""

from alembic import op
import sqlalchemy as sa

revision = 'e92f306fd1e2'
down_revision = '1d21cca38fc6'
branch_labels = None
depends_on = None

def _languages_table(conn) -> sa.Table:
    meta = sa.MetaData()
    return sa.Table("languages", meta, autoload_with=conn, schema="public")


LANGUAGES = [
    {"code": "pt-BR", "name": "Português (Brasil)"},
    {"code": "pt-PT", "name": "Português (Portugal)"},
    {"code": "en-US", "name": "English (United States)"},
    {"code": "en-GB", "name": "English (United Kingdom)"},
    {"code": "es-ES", "name": "Español (España)"},
    {"code": "es-419", "name": "Español (Latinoamérica)"},
    {"code": "fr-FR", "name": "Français (France)"},
    {"code": "de-DE", "name": "Deutsch"},
    {"code": "it-IT", "name": "Italiano"},
    {"code": "nl-NL", "name": "Nederlands"},
    {"code": "ru-RU", "name": "Русский"},
    {"code": "zh-CN", "name": "中文（简体）"},
    {"code": "zh-TW", "name": "中文（繁體）"},
    {"code": "ja-JP", "name": "日本語"},
    {"code": "ko-KR", "name": "한국어"},
    {"code": "ar-SA", "name": "العربية"},
    {"code": "tr-TR", "name": "Türkçe"},
    {"code": "pl-PL", "name": "Polski"},
    {"code": "sv-SE", "name": "Svenska"},
    {"code": "no-NO", "name": "Norsk"},
    {"code": "fi-FI", "name": "Suomi"},
    {"code": "da-DK", "name": "Dansk"},
    {"code": "he-IL", "name": "עברית"},
    {"code": "el-GR", "name": "Ελληνικά"},
    {"code": "hi-IN", "name": "हिन्दी"},
    {"code": "th-TH", "name": "ไทย"},
    {"code": "vi-VN", "name": "Tiếng Việt"},
    {"code": "id-ID", "name": "Bahasa Indonesia"},
    {"code": "uk-UA", "name": "Українська"},
    {"code": "fa-IR", "name": "فارسی"},
    {"code": "cs-CZ", "name": "Čeština"},
    {"code": "ro-RO", "name": "Română"},
    {"code": "hu-HU", "name": "Magyar"},
    {"code": "bg-BG", "name": "Български"},
    {"code": "sr-RS", "name": "Српски"},
    {"code": "hr-HR", "name": "Hrvatski"},
    {"code": "sk-SK", "name": "Slovenčina"},
    {"code": "sl-SI", "name": "Slovenščina"},
    {"code": "et-EE", "name": "Eesti"},
    {"code": "lv-LV", "name": "Latviešu"},
    {"code": "lt-LT", "name": "Lietuvių"},
    {"code": "ms-MY", "name": "Bahasa Melayu"},
    {"code": "tl-PH", "name": "Filipino"},
    {"code": "bn-BD", "name": "বাংলা"},
    {"code": "ur-PK", "name": "اردو"},
    {"code": "ta-IN", "name": "தமிழ்"},
    {"code": "te-IN", "name": "తెలుగు"},
    {"code": "mr-IN", "name": "मराठी"},
    {"code": "gu-IN", "name": "ગુજરાતી"},
    {"code": "pa-IN", "name": "ਪੰਜਾਬੀ"},
    {"code": "sw-KE", "name": "Kiswahili"},
    {"code": "am-ET", "name": "አማርኛ"},
    {"code": "zu-ZA", "name": "isiZulu"},
    {"code": "xh-ZA", "name": "isiXhosa"},
]

def upgrade() -> None:
    conn = op.get_bind()
    for row in LANGUAGES:
        conn.execute(
            sa.text("""
                INSERT INTO public.languages (code, name, created_at, updated_at)
                VALUES (
                    :code,
                    :name,
                    (extract(epoch from now())*1000)::bigint,  -- ms
                    (extract(epoch from now())*1000)::bigint   -- ms
                )
                ON CONFLICT (code) DO NOTHING
            """),
            row,
        )

def downgrade() -> None:
    conn = op.get_bind()
    for row in LANGUAGES:
        conn.execute(
            sa.text("DELETE FROM public.languages WHERE code = :code"),
            {"code": row["code"]},
        )
