# create_admin_user.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User
from app.models.base import Base
from app.core.security import get_password_hash

DATABASE_URL = "postgresql+psycopg2://app:app@localhost:5432/arhivare"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def main():
    db = SessionLocal()

    username = "admin"
    password = "admin1234"  # minim 8 caractere
    role = "admin"

    # verificăm dacă există deja
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        print(f"User '{username}' există deja cu id={existing.id}")
        return

    # creăm userul
    hashed_password = get_password_hash(password)
    new_user = User(username=username, password_hash=hashed_password, role=role)
    db.add(new_user)
    db.commit()
    print(f"User admin creat: {username} / {password}")

if __name__ == "__main__":
    main()

