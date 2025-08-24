#!/usr/bin/env python3

import asyncio
import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'fastapi_ecommerce-main'))

from app.core.sync_database import get_db
from app.users.models import User
from app.core.hashing import Hasher
from datetime import datetime, timezone, timedelta
import uuid

def create_test_customer():
    """Create a test customer user with known credentials"""
    
    # Test customer data
    name = "Test Customer Phone"
    email = "testcustomerphone@example.com"
    phone = "01777888999"
    password = "testpass123"
    
    print(f"Creating test customer:")
    print(f"Name: {name}")
    print(f"Email: {email}")
    print(f"Phone: {phone}")
    print(f"Password: {password}")
    print()
    
    # Create user
    verification_token = str(uuid.uuid4())
    token_expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    
    new_user = User(
        name=name,
        email=email,
        phone=phone,
        hashed_password=Hasher.get_password_hash(password),
        role="customer",
        is_verified=True,  # Make it verified so we can test login
        verification_token=verification_token,
        token_expires_at=token_expires_at
    )
    
    # Save to database
    db = next(get_db())
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.email == email) | (User.phone == phone)
        ).first()
        
        if existing_user:
            print(f"⚠️ User already exists with ID: {existing_user.id}")
            print(f"Updating password for existing user...")
            existing_user.hashed_password = Hasher.get_password_hash(password)
            existing_user.role = "customer"
            existing_user.is_verified = True
            db.commit()
            print(f"✅ Updated existing user with ID: {existing_user.id}")
            return existing_user.id
        else:
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            print(f"✅ Created new customer user with ID: {new_user.id}")
            return new_user.id
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Creating Test Customer User")
    print("=" * 50)
    
    try:
        user_id = create_test_customer()
        print(f"\n🎉 Test customer created successfully!")
        print(f"You can now test login with:")
        print(f"Phone: 01777888999")
        print(f"Password: testpass123")
        print(f"User ID: {user_id}")
        
    except Exception as e:
        print(f"❌ Error creating test customer: {e}")
        import traceback
        traceback.print_exc()
