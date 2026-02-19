// Конфигурация
const API_BASE_URL = 'http://localhost:5000/api';

// Состояние приложения
let currentFilters = {
    employee: '',
    status: ''
};

// Загрузка при инициализации
document.addEventListener('DOMContentLoaded', () => {
    loadVacations();
    loadStats();
    setupEventListeners();
});

// Настройка обработчиков событий
function setupEventListeners() {
    // Форма создания заявки
    document.getElementById('vacation-form').addEventListener('submit', handleCreateVacation);
    
    // Модальное окно
    const modal = document.getElementById('edit-modal');
    const closeBtn = document.getElementsByClassName('close')[0];
    
    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    // Форма редактирования
    document.getElementById('edit-form').addEventListener('submit', handleEditVacation);
    
    // Фильтры
    document.getElementById('employee-filter').addEventListener('input', (e) => {
        currentFilters.employee = e.target.value;
    });
    
    document.getElementById('status-filter').addEventListener('change', (e) => {
        currentFilters.status = e.target.value;
    });
}

// Загрузка списка отпусков
async function loadVacations() {
    try {
        const params = new URLSearchParams();
        if (currentFilters.employee) params.append('employee', currentFilters.employee);
        if (currentFilters.status) params.append('status', currentFilters.status);
        
        const url = `${API_BASE_URL}/vacations?${params.toString()}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        
        const vacations = await response.json();
        displayVacations(vacations);
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить список отпусков');
    }
}

// Отображение списка отпусков
function displayVacations(vacations) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    
    vacations.forEach(vacation => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${vacation.id}</td>
            <td>${escapeHtml(vacation.employeeName)}</td>
            <td>${formatDate(vacation.startDate)}</td>
            <td>${formatDate(vacation.endDate)}</td>
            <td>
                <span class="status-badge status-${vacation.status}">
                    ${getStatusText(vacation.status)}
                </span>
            </td>
            <td>${formatDateTime(vacation.createdAt)}</td>
            <td>
                <button class="action-btn approve-btn" onclick="updateStatus(${vacation.id}, 'approved')">✓ Одобрить</button>
                <button class="action-btn reject-btn" onclick="updateStatus(${vacation.id}, 'rejected')">✗ Отклонить</button>
                <button class="action-btn edit-btn" onclick="openEditModal(${vacation.id})">✎ Ред.</button>
                <button class="action-btn delete-btn" onclick="deleteVacation(${vacation.id})">🗑 Удал.</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Загрузка статистики
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (!response.ok) throw new Error('Ошибка загрузки статистики');
        
        const stats = await response.json();
        
        document.getElementById('total-count').textContent = stats.total;
        document.getElementById('pending-count').textContent = stats.pending;
        document.getElementById('approved-count').textContent = stats.approved;
        document.getElementById('rejected-count').textContent = stats.rejected;
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// Создание новой заявки
async function handleCreateVacation(event) {
    event.preventDefault();
    
    const employeeName = document.getElementById('employee-name').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!employeeName || !startDate || !endDate) {
        alert('Пожалуйста, заполните все поля');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/vacations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                employeeName,
                startDate,
                endDate
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка создания заявки');
        }
        
        // Очистка формы
        document.getElementById('vacation-form').reset();
        
        // Обновление данных
        await loadVacations();
        await loadStats();
        
        alert('Заявка успешно создана!');
    } catch (error) {
        console.error('Ошибка:', error);
        alert(error.message);
    }
}

// Обновление статуса заявки
async function updateStatus(id, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/vacations/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) throw new Error('Ошибка обновления статуса');
        
        await loadVacations();
        await loadStats();
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось обновить статус');
    }
}

// Открытие модального окна для редактирования
async function openEditModal(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/vacations/${id}`);
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        
        const vacation = await response.json();
        
        document.getElementById('edit-id').value = vacation.id;
        document.getElementById('edit-employee').value = vacation.employeeName;
        document.getElementById('edit-start').value = vacation.startDate;
        document.getElementById('edit-end').value = vacation.endDate;
        
        document.getElementById('edit-modal').style.display = 'block';
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить данные для редактирования');
    }
}

// Редактирование заявки
async function handleEditVacation(event) {
    event.preventDefault();
    
    const id = document.getElementById('edit-id').value;
    const employeeName = document.getElementById('edit-employee').value;
    const startDate = document.getElementById('edit-start').value;
    const endDate = document.getElementById('edit-end').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/vacations/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                employeeName,
                startDate,
                endDate
            })
        });
        
        if (!response.ok) throw new Error('Ошибка обновления');
        
        document.getElementById('edit-modal').style.display = 'none';
        
        await loadVacations();
        await loadStats();
        
        alert('Заявка успешно обновлена!');
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось обновить заявку');
    }
}

// Удаление заявки
async function deleteVacation(id) {
    if (!confirm('Вы уверены, что хотите удалить эту заявку?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/vacations/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Ошибка удаления');
        
        await loadVacations();
        await loadStats();
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось удалить заявку');
    }
}

// Применение фильтров
function applyFilters() {
    loadVacations();
}

// Сброс фильтров
function resetFilters() {
    document.getElementById('employee-filter').value = '';
    document.getElementById('status-filter').value = '';
    currentFilters = { employee: '', status: '' };
    loadVacations();
}

// Вспомогательные функции
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('ru-RU');
}

function formatDateTime(dateTimeString) {
    return new Date(dateTimeString).toLocaleString('ru-RU');
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'В ожидании',
        'approved': 'Одобрено',
        'rejected': 'Отклонено'
    };
    return statusMap[status] || status;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}