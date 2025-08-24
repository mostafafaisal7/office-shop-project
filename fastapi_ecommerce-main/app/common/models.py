from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Boolean, Integer
from sqlalchemy.ext.declarative import declared_attr

class TimestampMixin:
    @declared_attr
    def created_at(cls):
        return Column(DateTime, default=datetime.now(timezone.utc), nullable=False)

    @declared_attr
    def updated_at(cls):
        return Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc), nullable=False)

class SoftDeleteMixin:
    @declared_attr
    def is_deleted(cls):
        return Column(Boolean, default=False, nullable=False)

class UserTrackingMixin:
    @declared_attr
    def created_by(cls):
        return Column(Integer, nullable=True)  

    @declared_attr
    def updated_by(cls):
        return Column(Integer, nullable=True) 

