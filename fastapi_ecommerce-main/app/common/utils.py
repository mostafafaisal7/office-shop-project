import uuid

def uuid_to_bytes(u: uuid.UUID) -> bytes:
    return u.bytes

def bytes_to_uuid(b: bytes) -> uuid.UUID:
    return uuid.UUID(bytes=b)