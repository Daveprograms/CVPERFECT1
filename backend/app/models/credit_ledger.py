import enum
import uuid

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum as SQLEnum, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ..database import Base


class CreditEventKind(str, enum.Enum):
    GRANT = "grant"
    CONSUME = "consume"
    REFUND = "refund"
    EXPIRE = "expire"
    ADJUST = "adjust"


class CreditLedger(Base):
    __tablename__ = "credit_ledger"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    kind = Column(SQLEnum(CreditEventKind), nullable=False)
    feature = Column(String(64), nullable=False)
    delta = Column(Integer, nullable=False)
    balance_after = Column(Integer, nullable=False)

    reason = Column(String(128), nullable=True)

    related_ai_run_id = Column(UUID(as_uuid=True), ForeignKey("ai_runs.id", ondelete="SET NULL"), nullable=True)
    related_resume_variant_id = Column(UUID(as_uuid=True), ForeignKey("resume_variants.id", ondelete="SET NULL"), nullable=True)
    related_export_id = Column(UUID(as_uuid=True), ForeignKey("resume_exports.id", ondelete="SET NULL"), nullable=True)

    occurred_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (CheckConstraint("balance_after >= 0", name="ck_credit_ledger_nonneg"),)

    user = relationship("User")
    ai_run = relationship("AIRun")
    resume_variant = relationship("ResumeVariant")
    export = relationship("ResumeExport")

