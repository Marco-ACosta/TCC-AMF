from sqlalchemy import select
from db_core.models.language import Language
from db_core.models.language_speaker import LanguageSpeaker
from db_core.models.language_translator import LanguageTranslator
from db_core.models.speaker import Speaker
from db_core.models.translator import Translator
from sqlalchemy.orm import Session
from db_core.models.user import User
from db_core.security.passwords import hash_password, verify_password

def _normalize_email(email: str) -> str:
    return email.strip()

def create_user(db: Session, email: str, password: str, name: str, user_type: str, languages_ids: list[int] | None = None, bio: str | None = None ) -> User:
    email_norm = _normalize_email(email)
    
    exists = db.query(User).filter(User.email.ilike(email_norm)).first()

    if exists:
        raise ValueError("email_ja_cadastrado")

    user = User(
        email=email_norm, 
        name=name, 
        is_admin=user_type == "admin", 
        is_translator=user_type == "translator", 
        is_speaker=user_type == "speaker"
    )


    user.set_password_hash(hash_password(password))
    
    if user_type == "translator":
        user.translator = Translator(user=user)
        ids = set(map(int, languages_ids or []))
        if ids:
            existing_ids = set(
                db.execute(
                    select(Language.id).where(Language.id.in_(ids))
                ).scalars().all()
            )
            missing = ids - existing_ids
            if missing:
                raise ValueError(f"languages_ids_invalidos: {sorted(missing)}")
            
            user.translator.language_translators = [
                LanguageTranslator(language_id=lid) for lid in sorted(existing_ids)
            ]
            
    if user_type == "speaker":
        user.speaker = Speaker(user=user, bio=bio)
        ids = set(map(int, languages_ids or []))
        if ids:
            existing_ids = set(
                db.execute(
                    select(Language.id).where(Language.id.in_(ids))
                ).scalars().all()
            )
            missing = ids - existing_ids
            if missing:
                raise ValueError(f"languages_ids_invalidos: {sorted(missing)}")
            
            user.speaker.language_speakers = [
                LanguageSpeaker(language_id=lid) for lid in sorted(existing_ids)
            ]

    db.add(user)
    db.commit()
    db.refresh(user)
    

    return user

def authenticate(db: Session, email: str, password: str) -> User | None:
    email_norm = _normalize_email(email)
    user = db.query(User).filter(User.email.ilike(email_norm)).one_or_none()
    
    if user and verify_password(password, user.password):
        return user
    
    return None
