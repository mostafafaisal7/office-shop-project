import asyncio
import sys
sys.path.append('fastapi_ecommerce-main')

from app.core.database import get_db
from app.users.models import User
from app.core.hashing import Hasher

async def create_test_users():
    async for db in get_db():
        # Create a test admin user with known password
        admin_user = User(
            name="Test Admin",
            email="testadmin@example.com",
            phone="01303151830",  # The phone number you want to test OTP with
            hashed_password=Hasher.get_password_hash("admin123"),
            role="admin",
            is_verified=True,
            is_active=True
        )
        
        # Create a test customer user with known password
        customer_user = User(
            name="Test Customer Phone",
            email="testcustomerphone@example.com",
            phone="01712345679",
            hashed_password=Hasher.get_password_hash("customer123"),
            role="customer",
            is_verified=True,
            is_active=True
        )
        
        try:
            # Check if users already exist
            from sqlalchemy import select
            
            # Check admin
            result = await db.execute(select(User).where(User.phone == "01303151830"))
            existing_admin = result.scalar_one_or_none()
            
            if existing_admin:
                # Update existing admin user password
                existing_admin.hashed_password = Hasher.get_password_hash("admin123")
                print(f"Updated existing admin user (ID: {existing_admin.id}) with new password: admin123")
            else:
                db.add(admin_user)
                print("Created new admin user with password: admin123")
            
            # Check customer
            result = await db.execute(select(User).where(User.phone == "01712345679"))
            existing_customer = result.scalar_one_or_none()
            
            if existing_customer:
                # Update existing customer user password
                existing_customer.hashed_password = Hasher.get_password_hash("customer123")
                print(f"Updated existing customer user (ID: {existing_customer.id}) with new password: customer123")
            else:
                db.add(customer_user)
                print("Created new customer user with password: customer123")
            
            await db.commit()
            
            print("\n✅ Test users ready:")
            print("📱 Admin Phone: 01303151830, Password: admin123")
            print("📱 Customer Phone: 01712345679, Password: customer123")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            await db.rollback()
        
        break

if __name__ == "__main__":
    asyncio.run(create_test_users())
