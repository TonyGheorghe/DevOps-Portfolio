# test_crud_user.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import Base
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.crud.user import (
    create_user, get_user_by_id, get_user_by_username,
    list_users, update_user, delete_user
)

# Conexiune DB - ajustăm dacă ai alt port sau user/parolă
DATABASE_URL = "postgresql+psycopg2://app:app@localhost:5432/arhivare"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def main():
    db = SessionLocal()

    # 1) Creare user
    print("\n=== Creare user ===")
    user_in = UserCreate(username="test_user", password="parola123", role="admin")
    new_user = create_user(db, user_in)
    print("Creat:", new_user.id, new_user.username, new_user.role)

    # 2) Get by ID
    print("\n=== Get by ID ===")
    fetched = get_user_by_id(db, new_user.id)
    print("Fetched:", fetched.id, fetched.username)

    # 3) Get by username
    print("\n=== Get by username ===")
    fetched2 = get_user_by_username(db, "test_user")
    print("Fetched:", fetched2.id, fetched2.username)

    # 4) List users
    print("\n=== List users ===")
    users = list_users(db, skip=0, limit=10)
    for u in users:
        print(u.id, u.username)

    # 5) Update user
    print("\n=== Update user ===")
    updated = update_user(db, new_user, UserUpdate(username="updated_user", password="newpassword"))
    print("Updated:", updated.id, updated.username)

    # 6) Delete user
    print("\n=== Delete user ===")
    delete_user(db, updated)
    print("User deleted!")

    db.close()

if __name__ == "__main__":
    main()

