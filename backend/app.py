from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from models import db, VacationRequest

app = Flask(__name__)
CORS(app)  # Разрешаем кросс-доменные запросы

# Конфигурация базы данных
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Создание таблиц при первом запуске
with app.app_context():
    db.create_all()

def validate_dates(start_date, end_date):
    """Валидация дат"""
    if start_date > end_date:
        return False, "Дата окончания не может быть раньше даты начала"
    if start_date < datetime.now().date():
        return False, "Нельзя создать заявку на прошедшую дату"
    return True, "OK"

# API Endpoints
@app.route('/api/vacations', methods=['GET'])
def get_vacations():
    """Получить все заявки на отпуск"""
    status_filter = request.args.get('status')
    employee_filter = request.args.get('employee')
    
    query = VacationRequest.query
    
    if status_filter:
        query = query.filter_by(status=status_filter)
    if employee_filter:
        query = query.filter(VacationRequest.employee_name.contains(employee_filter))
    
    vacations = query.order_by(VacationRequest.created_at.desc()).all()
    return jsonify([v.to_dict() for v in vacations])

@app.route('/api/vacations/<int:vacation_id>', methods=['GET'])
def get_vacation(vacation_id):
    """Получить конкретную заявку"""
    vacation = VacationRequest.query.get_or_404(vacation_id)
    return jsonify(vacation.to_dict())

@app.route('/api/vacations', methods=['POST'])
def create_vacation():
    """Создать новую заявку"""
    data = request.json
    
    # Проверка обязательных полей
    required_fields = ['employeeName', 'startDate', 'endDate']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Отсутствуют обязательные поля'}), 400
    
    try:
        start_date = datetime.strptime(data['startDate'], '%Y-%m-%d').date()
        end_date = datetime.strptime(data['endDate'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Неверный формат даты. Используйте ГГГГ-ММ-ДД'}), 400
    
    # Валидация дат
    is_valid, message = validate_dates(start_date, end_date)
    if not is_valid:
        return jsonify({'error': message}), 400
    
    # Создание заявки
    new_vacation = VacationRequest(
        employee_name=data['employeeName'],
        start_date=start_date,
        end_date=end_date
    )
    
    db.session.add(new_vacation)
    db.session.commit()
    
    return jsonify(new_vacation.to_dict()), 201

@app.route('/api/vacations/<int:vacation_id>', methods=['PATCH'])
def update_vacation_status(vacation_id):
    """Обновить статус заявки (одобрить/отклонить)"""
    vacation = VacationRequest.query.get_or_404(vacation_id)
    data = request.json
    
    if 'status' not in data:
        return jsonify({'error': 'Поле status обязательно'}), 400
    
    if data['status'] not in ['approved', 'rejected', 'pending']:
        return jsonify({'error': 'Неверный статус. Используйте: approved, rejected, pending'}), 400
    
    vacation.status = data['status']
    db.session.commit()
    
    return jsonify(vacation.to_dict())

@app.route('/api/vacations/<int:vacation_id>', methods=['PUT'])
def update_vacation(vacation_id):
    """Полное обновление заявки"""
    vacation = VacationRequest.query.get_or_404(vacation_id)
    data = request.json
    
    try:
        if 'startDate' in data:
            start_date = datetime.strptime(data['startDate'], '%Y-%m-%d').date()
            vacation.start_date = start_date
        if 'endDate' in data:
            end_date = datetime.strptime(data['endDate'], '%Y-%m-%d').date()
            vacation.end_date = end_date
        if 'employeeName' in data:
            vacation.employee_name = data['employeeName']
    except ValueError:
        return jsonify({'error': 'Неверный формат даты'}), 400
    
    db.session.commit()
    return jsonify(vacation.to_dict())

@app.route('/api/vacations/<int:vacation_id>', methods=['DELETE'])
def delete_vacation(vacation_id):
    """Удалить заявку"""
    vacation = VacationRequest.query.get_or_404(vacation_id)
    db.session.delete(vacation)
    db.session.commit()
    return '', 204

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Получить статистику по заявкам"""
    total = VacationRequest.query.count()
    pending = VacationRequest.query.filter_by(status='pending').count()
    approved = VacationRequest.query.filter_by(status='approved').count()
    rejected = VacationRequest.query.filter_by(status='rejected').count()
    
    return jsonify({
        'total': total,
        'pending': pending,
        'approved': approved,
        'rejected': rejected
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)