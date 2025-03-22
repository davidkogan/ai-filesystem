from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
from sqlalchemy import LargeBinary
from sqlalchemy import Table, ForeignKey
from sqlalchemy.orm import relationship

Base = declarative_base()

document_group_table = Table(
    "document_group",
    Base.metadata,
    Column("document_id", ForeignKey("documents.id"), primary_key=True),
    Column("group_id", ForeignKey("groups.id"), primary_key=True)
)

class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)

    documents = relationship("Document", secondary=document_group_table, back_populates="groups")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True)
    filename = Column(String, unique=True, nullable=False)
    size_kb = Column(Integer)
    text = Column(Text)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    pdf_data = Column(LargeBinary)

    groups = relationship("Group", secondary=document_group_table, back_populates="documents")

# SQLite DB (local file)
engine = create_engine("sqlite:///documents.db", echo=False)
SessionLocal = sessionmaker(bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
