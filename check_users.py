import asyncio
import sys
import os
sys.path.append('fastapi_ecommerce-main')

from app.core.database import get_db
from app.users.models import User
from sqlalchemy import select

async def check_users():
    async for db in get_db():
        result = await db.execute(select(User))
        users = result.scalars().all()
        print(f'Found {len(users)} users:')
        for user in users:
            print(f'- ID: {user.id}, Name: {user.name}, Email: {user.email}, Phone: {user.phone}, Role: {user.role}')
        break

if __name__ == "__main__":
    asyncio.run(check_users())
