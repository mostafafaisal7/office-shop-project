# 🔐 Admin User Management Guide

## 📁 Key Files for Admin User Management

### 1. **User Model Definition**
- **File**: `fastapi_ecommerce-main/app/users/models.py`
- **Purpose**: Defines the User database table structure
- **Key Fields**:
  - `id`: Primary key
  - `name`: User's full name
  - `email`: Unique email address
  - `phone`: Unique phone number
  - `hashed_password`: Encrypted password
  - `role`: User role (`admin`, `customer`, `user`)
  - `is_active`: Account status
  - `is_verified`: Email verification status

### 2. **User Repository Functions**
- **File**: `fastapi_ecommerce-main/app/common/user_repo.py`
- **Purpose**: Database operations for users
- **Key Functions**:
  - `get_user_by_email()`: Find user by email
  - `get_user_by_phone()`: Find user by phone
  - `get_user_by_id()`: Find user by ID
  - `construct_user()`: Create new user instance

### 3. **Authentication Schemas**
- **File**: `fastapi_ecommerce-main/app/auth/schemas.py`
- **Purpose**: Data validation for login/registration
- **Key Schemas**:
  - `LoginRequest`: Email/phone + password validation
  - `RegisterRequest`: User registration data

### 4. **User CRUD Operations**
- **File**: `fastapi_ecommerce-main/app/users/crud.py`
- **Purpose**: Database CRUD operations for users

## 🛠️ How to Create/Manage Admin Users

### Method 1: Using the Script (Recommended)
Use the provided script: `create_test_users_with_known_passwords.py`

```python
# Example: Create a new admin user
admin_user = User(
    name="New Admin",
    email="newadmin@example.com",
    phone="01234567890",
    hashed_password=Hasher.get_password_hash("secure_password"),
    role="admin",  # ← Important: Set role to "admin"
    is_verified=True,
    is_active=True
)
```

### Method 2: Direct Database Update
1. Connect to your MySQL database
2. Insert into the `users` table:
```sql
INSERT INTO users (name, email, phone, hashed_password, role, is_active, is_verified)
VALUES ('Admin Name', 'admin@example.com', '01234567890', '$2b$12$...', 'admin', 1, 1);
```

### Method 3: Registration Endpoint + Manual Role Update
1. Register via `/auth/register` endpoint
2. Manually update the role in database:
```sql
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
```

## 📋 Current Admin Users

Based on the database check, here are the current users:

| ID | Name | Email | Phone | Role | Status |
|----|------|-------|-------|------|--------|
| 1 | Admin | progfaysal@gmail.com | 01303151830 | admin | ✅ Active |
| 2 | Test User | test@example.com | 01234567890 | user | ⚠️ Not admin |
| 3 | Verified User | verified@example.com | 01712345679 | customer | ✅ Active |

## 🔑 Test Credentials

### Admin Login (Phone: 01303151830)
- **Phone**: 01303151830
- **Password**: admin123
- **Role**: admin
- **Login Endpoints**: 
  - `/auth/admin/login` (Admin-specific)
  - `/auth/login` (General)

### Customer Login (Phone: 01712345679)
- **Phone**: 01712345679
- **Password**: customer123
- **Role**: customer
- **Login Endpoints**: 
  - `/auth/customer/login` (Customer-specific)
  - `/auth/login` (General)

## 🚀 Quick Admin User Creation Script

Create a new file `create_admin_user.py`:

```python
import asyncio
import sys
sys.path.append('fastapi_ecommerce-main')

from app.core.database import get_db
from app.users.models import User
from app.core.hashing import Hasher

async def create_admin_user():
    async for db in get_db():
        # Create new admin user
        new_admin = User(
            name="Your Admin Name",
            email="youradmin@example.com",
            phone="01XXXXXXXXX",  # Your phone number
            hashed_password=Hasher.get_password_hash("your_secure_password"),
            role="admin",
            is_verified=True,
            is_active=True
        )
        
        db.add(new_admin)
        await db.commit()
        await db.refresh(new_admin)
        
        print(f"✅ Admin user created:")
        print(f"   ID: {new_admin.id}")
        print(f"   Name: {new_admin.name}")
        print(f"   Email: {new_admin.email}")
        print(f"   Phone: {new_admin.phone}")
        print(f"   Role: {new_admin.role}")
        break

if __name__ == "__main__":
    asyncio.run(create_admin_user())
```

## 🔒 Security Notes

1. **Password Hashing**: Always use `Hasher.get_password_hash()` for passwords
2. **Role Validation**: Ensure role is set to "admin" for admin users
3. **Phone Format**: Use Bangladesh format (01XXXXXXXXX)
4. **Email Verification**: Set `is_verified=True` for admin users
5. **Account Status**: Set `is_active=True` for active accounts

## 📱 SMS/OTP Configuration

The SMS functionality is configured in:
- **File**: `fastapi_ecommerce-main/app/common/sms_utils.py`
- **Provider**: GreenWeb SMS API
- **Token**: Already configured in the system

## ✅ Verification Checklist

- [x] Phone number login working for customers
- [x] Phone number login working for admins  
- [x] Email login still functional
- [x] OTP system working via SMS
- [x] Separate admin/customer endpoints
- [x] Role-based access control
- [x] SMS integration with GreenWeb API
