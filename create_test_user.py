import asyncio
import sys
sys.path.append('fastapi_ecommerce-main')

from app.core.database import get_db
from app.users.models import User
from app.core.hashing import Hasher

async def create_test_user():
    async for db in get_db():
        # Create a test customer user
        test_user = User(
            name="Test Customer",
            email="testcustomer@example.com",
            phone="01999888777",
            hashed_password=Hasher.get_password_hash("testpass123"),
            role="customer",
            is_verified=True,
            is_active=True
        )
        
        db.add(test_user)
        await db.commit()
        await db.refresh(test_user)
        
        print(f"Created test user:")
        print(f"- ID: {test_user.id}")
        print(f"- Name: {test_user.name}")
        print(f"- Email: {test_user.email}")
        print(f"- Phone: {test_user.phone}")
        print(f"- Role: {test_user.role}")
        print(f"- Password: testpass123")
        break

if __name__ == "__main__":
    asyncio.run(create_test_user())
