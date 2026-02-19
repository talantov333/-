from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class VacationRequest(db.Model):
    __tablename__ = 'vacation_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_name = db.Column(db.String(100), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'employeeName': self.employee_name,
            'startDate': self.start_date.isoformat(),
            'endDate': self.end_date.isoformat(),
            'status': self.status,
            'createdAt': self.created_at.isoformat()
        }