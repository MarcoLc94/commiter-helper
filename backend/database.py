from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import DeclarativeBase, sessionmaker, relationship
from datetime import datetime

DATABASE_URL = "postgresql://commiter:commiter123@localhost:5432/commiter"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class SavedReport(Base):
    __tablename__ = "saved_reports"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    repo_path = Column(String, default="")
    author = Column(String, default="")
    year = Column(Integer)
    month = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    days = relationship(
        "SavedDay",
        back_populates="report",
        cascade="all, delete-orphan",
        order_by="SavedDay.date",
    )


class SavedDay(Base):
    __tablename__ = "saved_days"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("saved_reports.id"), nullable=False)
    date = Column(String)
    weekday = Column(String)
    day_type = Column(String)
    total_hours = Column(Float, default=0.0)
    report = relationship("SavedReport", back_populates="days")
    activities = relationship("SavedActivity", back_populates="day", cascade="all, delete-orphan")


class SavedActivity(Base):
    __tablename__ = "saved_activities"
    id = Column(Integer, primary_key=True, index=True)
    day_id = Column(Integer, ForeignKey("saved_days.id"), nullable=False)
    ticket = Column(String, nullable=True)
    activity = Column(Text, default="")
    module = Column(String, default="General")
    status = Column(String, default="Completado")
    hours = Column(Float, default=1.0)
    comments = Column(Text, default="")
    author = Column(String, default="")
    day = relationship("SavedDay", back_populates="activities")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
