// API endpoints
const API_BASE_URL = 'http://localhost:8000/main';

// DOM elements
const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('.main-content');
const navLinks = document.querySelectorAll('.nav-link');
const sidebarToggle = document.querySelector('.sidebar-toggle');
const dashboardSection = document.getElementById('dashboard');
const jobsSection = document.getElementById('jobs');
const applicationsSection = document.getElementById('applications');
const settingsSection = document.getElementById('settings');

// Global data
let jobsData = [];
let applicationsData = [];
let currentApplicationId = null;

// Navigation
function showSection(sectionId) {
    // Hide all sections
    [dashboardSection, jobsSection, applicationsSection, settingsSection].forEach(section => {
        if (section) section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Update active nav link
    navLinks.forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Update page title
    const pageTitle = document.querySelector('.page-title');
    switch(sectionId) {
        case 'dashboard':
            pageTitle.textContent = 'Дашборд';
            loadDashboard();
            break;
        case 'jobs':
            pageTitle.textContent = 'Вакансии';
            loadJobsTable();
            break;
        case 'applications':
            pageTitle.textContent = 'Заявки';
            loadApplicationsTable();
            break;
        case 'settings':
            pageTitle.textContent = 'Настройки';
            loadSettings();
            break;
    }
}

// Dashboard functions
async function loadDashboard() {
    try {
        // Пока используем заглушку для статистики
        const stats = {
            total_jobs: jobsData.length || 0,
            pending_applications: 0,
            approved_applications: 0,
            rejected_applications: 0
        };
        updateStats(stats);
    } catch (error) {
        console.error('Ошибка загрузки дашборда:', error);
        showNotification('Ошибка загрузки данных', 'error');
    }
}

function updateStats(stats) {
    document.getElementById('totalJobs').textContent = stats.total_jobs || 0;
    document.getElementById('pendingApplications').textContent = stats.pending_applications || 0;
    document.getElementById('approvedApplications').textContent = stats.approved_applications || 0;
    document.getElementById('rejectedApplications').textContent = stats.rejected_applications || 0;
}

// Jobs functions
async function loadJobsTable() {
    try {
        const response = await fetch(`${API_BASE_URL}/jobs`);
        
        if (response.ok) {
            jobsData = await response.json();
            renderJobsTable(jobsData);
        } else {
            console.error('Ошибка API:', response.status, response.statusText);
            showNotification(`Ошибка API: ${response.status}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка загрузки вакансий:', error);
        showNotification('Ошибка загрузки вакансий', 'error');
    }
}

function renderJobsTable(jobs) {
    const tbody = document.querySelector('#jobsTable tbody');
    if (!tbody) {
        console.error('Элемент #jobsTable tbody не найден');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (!jobs || jobs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem 1rem;">
                    <div style="color: #64748b; font-size: 1.1rem;">
                        <i class="fas fa-briefcase" style="font-size: 3rem; margin-bottom: 1rem; display: block; color: #cbd5e1; opacity: 0.5;"></i>
                        <p style="margin-bottom: 0.5rem; font-weight: 500;">Нет вакансий для отображения</p>
                        <p style="font-size: 0.9rem; opacity: 0.7;">Добавьте первую вакансию, нажав кнопку выше</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    jobs.forEach((job, index) => {
        const row = document.createElement('tr');
        
        // Проверяем и форматируем данные
        const title = job.title || 'Название не указано';
        const location = job.location || 'Локация не указана';
        const salary = job.salary ? `${job.salary.toLocaleString()} BYN` : 'Зарплата не указана';
        const requirements = job.Requirements || job.requirements || 'Требования не указаны';
        const createdDate = job.created_at ? new Date(job.created_at).toLocaleDateString('ru-RU') : 'Дата не указана';
        
        // Обрезаем требования если они слишком длинные
        const requirementsText = requirements.length > 80 ? 
            requirements.substring(0, 80) + '...' : requirements;
        
        // Добавляем иконку для локации
        const locationWithIcon = `<i class="fas fa-map-marker-alt cell-icon"></i>${location}`;
        
        // Добавляем иконку для даты
        const dateWithIcon = `<i class="fas fa-calendar-alt cell-icon"></i>${createdDate}`;
        
        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center;">
                    <span class="status-indicator"></span>
                    <strong style="color: #1e293b;">${title}</strong>
                </div>
            </td>
            <td>${locationWithIcon}</td>
            <td><span class="salary-amount">${salary}</span></td>
            <td>
                <div class="requirements-cell">
                    <div class="requirements-text">${requirementsText}</div>
                </div>
            </td>
            <td>${dateWithIcon}</td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-sm btn-info" onclick="editJob(${job.id})" title="Редактировать вакансию">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteJob(${job.id})" title="Удалить вакансию">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        // Добавляем задержку анимации
        row.style.animationDelay = `${index * 0.1}s`;
        tbody.appendChild(row);
    });
}

// Applications functions
async function loadApplicationsTable() {
    try {
        // Пока используем заглушку, так как API для заявок еще не реализован
        applicationsData = [];
        renderApplicationsTable(applicationsData);
        loadJobFilterOptions();
    } catch (error) {
        console.error('Ошибка загрузки заявок:', error);
        showNotification('Ошибка загрузки заявок', 'error');
    }
}

function renderApplicationsTable(applications) {
    const tbody = document.querySelector('#applicationsTable tbody');
    if (!tbody) {
        console.error('Элемент #applicationsTable tbody не найден');
        return;
    }
    
    tbody.innerHTML = '';
    
    applications.forEach(app => {
        const row = document.createElement('tr');
        const statusClass = getStatusClass(app.status);
        const statusText = getStatusText(app.status);
        
        row.innerHTML = `
            <td>${app.id}</td>
            <td>${app.job_title}</td>
            <td>${app.fio}</td>
            <td>${app.email}</td>
            <td>${app.phone}</td>
            <td>${app.experience ? (app.experience.length > 50 ? app.experience.substring(0, 50) + '...' : app.experience) : '-'}</td>
            <td>${new Date(app.created_at).toLocaleDateString()}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewApplication(${app.id})">
                    <i class="fas fa-eye"></i>
                </button>
                ${app.status === 'pending' ? `
                    <button class="btn btn-sm btn-success" onclick="approveApplication(${app.id})">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="rejectApplication(${app.id})">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getStatusClass(status) {
    switch(status) {
        case 'pending': return 'status-pending';
        case 'approved': return 'status-approved';
        case 'rejected': return 'status-rejected';
        default: return 'status-pending';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'pending': return 'Ожидает';
        case 'approved': return 'Одобрено';
        case 'rejected': return 'Отклонено';
        default: return 'Ожидает';
    }
}

function loadJobFilterOptions() {
    const jobFilter = document.getElementById('jobFilter');
    jobFilter.innerHTML = '<option value="">Все вакансии</option>';
    
    jobsData.forEach(job => {
        const option = document.createElement('option');
        option.value = job.id;
        option.textContent = job.title;
        jobFilter.appendChild(option);
    });
}

async function applyFilters() {
    const status = document.getElementById('statusFilter').value;
    const jobId = document.getElementById('jobFilter').value;
    const dateFrom = document.getElementById('dateFromFilter').value;
    const dateTo = document.getElementById('dateToFilter').value;
    
    try {
        let url = `${API_BASE_URL}/admin-panel/applications?`;
        const params = new URLSearchParams();
        
        if (status) params.append('status', status);
        if (jobId) params.append('job_id', jobId);
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        
        url += params.toString();
        
        const response = await fetch(url);
        if (response.ok) {
            applicationsData = await response.json();
            renderApplicationsTable(applicationsData);
        }
    } catch (error) {
        console.error('Ошибка применения фильтров:', error);
        showNotification('Ошибка применения фильтров', 'error');
    }
}

function clearFilters() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('jobFilter').value = '';
    document.getElementById('dateFromFilter').value = '';
    document.getElementById('dateToFilter').value = '';
    loadApplicationsTable();
}

// Обновляем функции для работы с новым API
async function approveApplication(applicationId = null) {
    const id = applicationId || currentApplicationId;
    if (!id) return;
    
    try {
        const formData = new FormData();
        formData.append('status', 'approved');
        
        const response = await fetch(`${API_BASE_URL}/admin-panel/applications/${id}/status`, {
            method: 'PUT',
            body: formData
        });
        
        if (response.ok) {
            showNotification('Заявка одобрена!', 'success');
            closeApplicationModal();
            loadApplicationsTable();
            loadDashboard();
        } else {
            const error = await response.json();
            showNotification(`Ошибка: ${error.detail}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка одобрения заявки:', error);
        showNotification('Ошибка одобрения заявки', 'error');
    }
}

async function rejectApplication(applicationId = null) {
    const id = applicationId || currentApplicationId;
    if (!id) return;
    
    try {
        const formData = new FormData();
        formData.append('status', 'rejected');
        
        const response = await fetch(`${API_BASE_URL}/admin-panel/applications/${id}/status`, {
            method: 'PUT',
            body: formData
        });
        
        if (response.ok) {
            showNotification('Заявка отклонена!', 'success');
            closeApplicationModal();
            loadApplicationsTable();
            loadDashboard();
        } else {
            const error = await response.json();
            showNotification(`Ошибка: ${error.detail}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка отклонения заявки:', error);
        showNotification('Ошибка отклонения заявки', 'error');
    }
}

// Settings functions
async function loadSettings() {
    try {
        const response = await fetch(`${API_BASE_URL}/settings`);
        if (response.ok) {
            const settings = await response.json();
            document.getElementById('contactEmail').value = settings.site_email || '';
            document.getElementById('contactPhone').value = settings.site_phone || '';
            document.getElementById('contactAddress').value = settings.site_adress || '';
        }
    } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
        showNotification('Ошибка загрузки настроек', 'error');
    }
}

async function saveSettings() {
    try {
        const formData = new FormData();
        formData.append('site_email', document.getElementById('contactEmail').value);
        formData.append('site_phone', document.getElementById('contactPhone').value);
        formData.append('site_adress', document.getElementById('contactAddress').value);
        
        const response = await fetch(`${API_BASE_URL}/settings`, {
            method: 'PUT',
            body: formData
        });
        
        if (response.ok) {
            showNotification('Настройки успешно сохранены!', 'success');
        } else {
            const error = await response.json();
            showNotification(`Ошибка: ${error.detail}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка сохранения настроек:', error);
        showNotification('Ошибка сохранения настроек', 'error');
    }
}

// Modal functions
function showAddJobModal() {
    const modal = document.getElementById('addJobModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeAddJobModal() {
    document.getElementById('addJobModal').style.display = 'none';
    document.getElementById('addJobForm').reset();
}

async function submitAddJob() {
    try {
        const formData = new FormData();
        formData.append('title', document.getElementById('jobTitle').value);
        formData.append('description', document.getElementById('jobDescription').value);
        formData.append('location', document.getElementById('jobLocation').value);
        formData.append('salary', document.getElementById('jobSalary').value);
        formData.append('Requirements', document.getElementById('jobRequirements').value);
        formData.append('Conditions_and_benefits', document.getElementById('jobConditions').value);
        
        const response = await fetch(`${API_BASE_URL}/jobs`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            showNotification('Вакансия успешно добавлена!', 'success');
            closeModal('addJobModal');
            loadJobsTable();
            loadDashboard();
        } else {
            const error = await response.json();
            showNotification(`Ошибка: ${error.detail}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка добавления вакансии:', error);
        showNotification('Ошибка добавления вакансии', 'error');
    }
}

// Функция для открытия модального окна редактирования
function editJob(id) {
    const job = jobsData.find(j => j.id === id);
    if (!job) {
        showNotification('Вакансия не найдена', 'error');
        return;
    }
    
    // Заполняем форму данными вакансии
    document.getElementById('editJobId').value = job.id;
    document.getElementById('editJobTitle').value = job.title;
    document.getElementById('editJobDescription').value = job.description;
    document.getElementById('editJobLocation').value = job.location;
    document.getElementById('editJobSalary').value = job.salary;
    document.getElementById('editJobRequirements').value = job.Requirements || job.requirements || '';
    document.getElementById('editJobConditions').value = job.Conditions_and_benefits || job.conditions_and_benefits || '';
    
    // Показываем модальное окно
    document.getElementById('editJobModal').style.display = 'block';
}

// Функция для сохранения изменений в вакансии
async function submitEditJob() {
    try {
        const jobId = document.getElementById('editJobId').value;
        const formData = new FormData();
        formData.append('title', document.getElementById('editJobTitle').value);
        formData.append('description', document.getElementById('editJobDescription').value);
        formData.append('location', document.getElementById('editJobLocation').value);
        formData.append('salary', document.getElementById('editJobSalary').value);
        formData.append('Requirements', document.getElementById('editJobRequirements').value);
        formData.append('Conditions_and_benefits', document.getElementById('editJobConditions').value);
        
        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
            method: 'PUT',
            body: formData
        });
        
        if (response.ok) {
            showNotification('Вакансия успешно обновлена!', 'success');
            closeModal('editJobModal');
            loadJobsTable();
            loadDashboard();
        } else {
            const error = await response.json();
            showNotification(`Ошибка: ${error.detail}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка обновления вакансии:', error);
        showNotification('Ошибка обновления вакансии', 'error');
    }
}

// Utility functions
function getStatusText(status) {
    const statusMap = {
        'pending': 'На рассмотрении',
        'approved': 'Одобрена',
        'rejected': 'Отклонена',
        'active': 'Активна',
        'inactive': 'Неактивна'
    };
    return statusMap[status] || status;
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reset forms
        if (modalId === 'addJobModal') {
            document.getElementById('addJobForm').reset();
        } else if (modalId === 'editJobModal') {
            document.getElementById('editJobForm').reset();
            document.getElementById('editJobId').value = '';
        }
    }
}

// Функция для показа уведомлений
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Автоматически удаляем уведомление через 5 секунд
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

// Заглушки для недостающих функций
async function deleteJob(id) {
    if (!confirm('Вы уверены, что хотите удалить эту вакансию?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Вакансия успешно удалена!', 'success');
            loadJobsTable();
            loadDashboard();
        } else {
            const error = await response.json();
            showNotification(`Ошибка удаления: ${error.detail}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка удаления вакансии:', error);
        showNotification('Ошибка удаления вакансии', 'error');
    }
}

function viewApplication(id) {
    const application = applicationsData.find(app => app.id === id);
    if (application) {
        currentApplicationId = id;
        showApplicationModal(application);
    }
}

function showApplicationModal(application) {
    const modal = document.getElementById('applicationModal');
    const details = document.getElementById('applicationDetails');
    
    if (!modal || !details) {
        console.error('Модальное окно не найдено');
        return;
    }
    
    details.innerHTML = `
        <div class="application-details">
            <div class="detail-row">
                <strong>Вакансия:</strong> ${application.job_title}
            </div>
            <div class="detail-row">
                <strong>ФИО:</strong> ${application.fio}
            </div>
            <div class="detail-row">
                <strong>Email:</strong> ${application.email}
            </div>
            <div class="detail-row">
                <strong>Телефон:</strong> ${application.phone}
            </div>
            <div class="detail-row">
                <strong>Опыт работы:</strong>
                <div class="experience-text">${application.experience || 'Не указан'}</div>
            </div>
            <div class="detail-row">
                <strong>Дата подачи:</strong> ${new Date(application.created_at).toLocaleString()}
            </div>
            <div class="detail-row">
                <strong>Статус:</strong> <span class="status-badge ${getStatusClass(application.status)}">${getStatusText(application.status)}</span>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

function closeApplicationModal() {
    const modal = document.getElementById('applicationModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentApplicationId = null;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Sidebar toggle
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
            
            // На мобильных устройствах закрываем сайдбар после выбора раздела
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('active');
            }
        });
    });
    
    // Job form submission
    const jobForm = document.getElementById('jobForm');
    if (jobForm) {
        jobForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(jobForm);
            const jobData = {
                title: formData.get('title'),
                company: formData.get('company'),
                location: formData.get('location'),
                salary: formData.get('salary'),
                type: formData.get('type'),
                experience: formData.get('experience'),
                description: formData.get('description'),
                icon: formData.get('icon'),
                status: formData.get('status')
            };
            
            const editId = jobForm.dataset.editId;
            if (editId) {
                updateJob(parseInt(editId), jobData);
            } else {
                addJob(jobData);
            }
        });
    }
    
    // Settings form submission
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveSettings();
        });
    }
    
    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const modal = closeBtn.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
        
        // Закрываем сайдбар при клике вне его на мобильных устройствах
        if (window.innerWidth <= 1024 && 
            !sidebar.contains(e.target) && 
            !sidebarToggle.contains(e.target) && 
            sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    });
    
    // Initialize dashboard
    showSection('dashboard');
    
    // Handle window resize for responsive sidebar
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024) {
            sidebar.classList.remove('active');
        }
    });
}); 