from app.api.routes import users

app.include_router(users.router, prefix="/users", tags=["users"])

