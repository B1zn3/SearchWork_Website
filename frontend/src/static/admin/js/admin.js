// Copied from frontend/admin-panel/static/js/admin.js
// API endpoints
// Базовый URL для админ-эндпоинтов FastAPI
const API_BASE_URL = `${window.location.origin}/admin-panel`;

// DOM elements
const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('.main-content');
const navLinks = document.querySelectorAll('.nav-link');
const dashboardSection = document.getElementById('dashboard');
const jobsSection = document.getElementById('jobs');
const applicationsSection = document.getElementById('applications');
const settingsSection = document.getElementById('settings');

// Global data
let jobsData = [];
let applicationsData = [];

// Navigation
function showSection(sectionId) {
    // Hide all sections
    [dashboardSection, jobsSection, applicationsSection, settingsSection].forEach(section => {
        if (section) section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) targetSection.style.display = 'block';
    
    // Update active nav link
    navLinks.forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeLink) activeLink.classList.add('active');
    
    // Load section data
    switch(sectionId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'jobs':
            loadJobsTable();
            break;
        case 'applications':
            loadApplicationsTable();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Dashboard functions
async function loadDashboard() {
    try {
        // Загружаем статистику
        const [jobsResponse, applicationsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/jobs`),
            fetch(`${API_BASE_URL}/applications`)
        ]);

        if (jobsResponse.ok) {
            const jobs = await jobsResponse.json();
            document.getElementById('totalJobs').textContent = jobs.length;
        }

        if (applicationsResponse.ok) {
            const applications = await applicationsResponse.json();
            document.getElementById('pendingApplications').textContent = applications.length;
            document.getElementById('approvedApplications').textContent = '0'; // Пока нет логики статусов
            document.getElementById('rejectedApplications').textContent = '0'; // Пока нет логики статусов

            // Загружаем последние заявки
            const container = document.getElementById('recentApplicationsList');
            if (container) {
                container.innerHTML = '';
                applications.slice(0, 5).forEach(app => {
                    const item = document.createElement('div');
                    item.className = 'application-item';
                    item.innerHTML = `
                        <div class="application-info">
                            <h4>${app.fio || 'Не указано'}</h4>
                            <p>${app.job_title || 'Не указано'}</p>
                        </div>
                        <span class="application-status">${new Date(app.created_at).toLocaleDateString()}</span>
                    `;
                    container.appendChild(item);
                });
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки дашборда:', error);
        showNotification('Ошибка загрузки данных', 'error');
    }
}



// Jobs management
async function loadJobsTable() {
    try {
        const response = await fetch(`${API_BASE_URL}/jobs`);
        if (!response.ok) {
            throw new Error('Ошибка загрузки вакансий');
        }
        jobsData = await response.json();
        
        const tbody = document.getElementById('jobsTableBody');
        if (!tbody) {
            console.error('Элемент jobsTableBody не найден');
            return;
        }
        
        tbody.innerHTML = '';
        
        jobsData.forEach(job => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${job.id || 'N/A'}</td>
                <td>
                    <div class="job-info">
                        <h4>${job.title || 'Не указано'}</h4>
                        <p>${job.description || 'Описание отсутствует'}</p>
                    </div>
                </td>
                <td>${job.location || 'Не указано'}</td>
                <td>${formatSalary(job.salary)}</td>
                <td>${new Date(job.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editJob(${job.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteJob(${job.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Ошибка загрузки вакансий:', error);
        showNotification('Ошибка загрузки вакансий', 'error');
    }
}

async function addJob(jobData) {
    try {
        const response = await fetch(`${API_BASE_URL}/new_job`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jobData)
        });

        if (!response.ok) {
            throw new Error('Ошибка добавления вакансии');
        }

        showNotification('Вакансия успешно добавлена!', 'success');
        closeModal('addJobModal');
        loadJobsTable();
        loadDashboard();
    } catch (error) {
        console.error('Ошибка добавления вакансии:', error);
        showNotification('Ошибка добавления вакансии', 'error');
    }
}







// Applications management
async function loadApplicationsTable() {
    try {
        const response = await fetch(`${API_BASE_URL}/applications`);
        if (!response.ok) {
            throw new Error('Ошибка загрузки заявок');
        }
        applicationsData = await response.json();
        
        const tbody = document.getElementById('applicationsTableBody');
        if (!tbody) {
            console.error('Элемент applicationsTableBody не найден');
            return;
        }
        
        tbody.innerHTML = '';
        
        applicationsData.forEach(app => {
            const row = document.createElement('tr');
            // Сокращаем отображение опыта, полный текст показываем в title
            const shortExperience = formatExperience(app.experience);
            const fullExperience = (app.experience || 'Не указано').toString().replace(/"/g, '&quot;');

            row.innerHTML = `
                <td>${app.id || 'N/A'}</td>
                <td>${app.job_title || 'Не указано'}</td>
                <td>
                    <div class="applicant-info">
                        <h4>${app.fio || 'Не указано'}</h4>
                        <p>${app.email || 'Не указано'}</p>
                    </div>
                </td>
                <td>${app.email || 'Не указано'}</td>
                <td>${app.phone || 'Не указано'}</td>
                <td class="experience-cell" title="${fullExperience}">${shortExperience}</td>
                <td>${new Date(app.created_at).toLocaleDateString()}</td>
                <td><span class="status-badge pending">Ожидает рассмотрения</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewApplication(${app.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            // Открываем модалку с полной информацией по клику
            row.style.cursor = 'pointer';
            row.addEventListener('click', () => openApplicationModal(app));
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Ошибка загрузки заявок:', error);
        showNotification('Ошибка загрузки заявок', 'error');
    }
}

// Открытие модального окна просмотра заявки
function openApplicationModal(app) {
    try {
        document.getElementById('appViewName').textContent = app.fio || 'Не указано';
        document.getElementById('appViewEmail').textContent = app.email || 'Не указано';
        document.getElementById('appViewPhone').textContent = app.phone || 'Не указано';
        document.getElementById('appViewJob').textContent = app.job_title || 'Не указано';
        document.getElementById('appViewDate').textContent = new Date(app.created_at).toLocaleString();
        document.getElementById('appViewExperience').textContent = app.experience || 'Не указано';

        const approveBtn = document.getElementById('approveApplicationBtn');
        const rejectBtn = document.getElementById('rejectApplicationBtn');
        if (approveBtn) {
            approveBtn.onclick = (e) => { e.stopPropagation(); approveApplication(app.id); };
        }
        if (rejectBtn) {
            rejectBtn.onclick = (e) => { e.stopPropagation(); rejectApplication(app.id); };
        }

        openModal('applicationViewModal');
    } catch (err) {
        console.error('Ошибка открытия модального окна заявки:', err);
        showNotification('Не удалось открыть заявку', 'error');
    }
}

async function approveApplication(applicationId) {
    try {
        const res = await fetch(`${API_BASE_URL}/applications/${applicationId}/approve`, { method: 'PUT' });
        if (!res.ok) throw new Error('Ошибка одобрения');
        showNotification('Заявка одобрена!', 'success');
        closeModal('applicationViewModal');
        loadApplicationsTable();
    } catch (error) {
        console.error('Ошибка одобрения заявки:', error);
        showNotification('Ошибка одобрения заявки', 'error');
    }
}

async function rejectApplication(applicationId) {
    try {
        const reason = prompt('Укажите причину отказа:');
        if (reason === null) return;
        const res = await fetch(`${API_BASE_URL}/applications/${applicationId}/reject`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        });
        if (!res.ok) throw new Error('Ошибка отклонения');
        showNotification('Заявка отклонена!', 'success');
        closeModal('applicationViewModal');
        loadApplicationsTable();
    } catch (error) {
        console.error('Ошибка отклонения заявки:', error);
        showNotification('Ошибка отклонения заявки', 'error');
    }
}


// Форматирование опыта для компактного отображения в таблице
function formatExperience(experience) {
    if (!experience) return 'Не указано';

    const clean = experience.toString().trim().replace(/\s+/g, ' ');
    if (clean.length <= 60) return clean;

    const firstSentence = clean.split('.')[0];
    if (firstSentence.length >= 20 && firstSentence.length <= 60) {
        return firstSentence + '.';
    }

    return clean.substring(0, 60) + '...';
}







// Settings management
async function loadSettings() {
    try {
        const response = await fetch(`${API_BASE_URL}/settings`, { credentials: 'include' });
        if (!response.ok) {
            throw new Error('Ошибка загрузки настроек');
        }
        const settings = await response.json();
        // Правильное сопоставление: email, phone, address
        const emailInput = document.getElementById('contactEmail');
        const phoneInput = document.getElementById('contactPhone');
        const addressInput = document.getElementById('contactAddress');
        if (emailInput) emailInput.value = settings.site_email || '';
        if (phoneInput) phoneInput.value = settings.site_phone || '';
        if (addressInput) addressInput.value = settings.site_adress || '';
    } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
        showNotification('Ошибка загрузки настроек', 'error');
    }
}

async function saveSettings() {
    const settings = {
        site_email: document.getElementById('contactEmail')?.value || '',
        site_phone: document.getElementById('contactPhone')?.value || '',
        site_adress: document.getElementById('contactAddress')?.value || ''
    };

    try {
        const response = await fetch(`${API_BASE_URL}/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(settings)
        });

        if (!response.ok) {
            throw new Error('Ошибка сохранения настроек');
        }

        showNotification('Настройки успешно сохранены!', 'success');
    } catch (error) {
        console.error('Ошибка сохранения настроек:', error);
        showNotification('Ошибка сохранения настроек', 'error');
    }
}

// Utility functions


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
        if (modalId === 'jobModal') {
            document.getElementById('jobForm').reset();
            delete document.getElementById('jobForm').dataset.editId;
            document.getElementById('modalJobTitle').textContent = 'Добавить вакансию';
        }
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // Add Job form submission (под вашу схему JobSchema)
    const addJobForm = document.getElementById('addJobForm');
    if (addJobForm) {
        addJobForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(addJobForm);
            const rawSalary = (formData.get('jobSalary') || '').toString();
            const digits = rawSalary.replace(/[^0-9.,]/g, '').replace(',', '.');
            const salary = parseFloat(digits) || 0;
            const jobData = {
                title: formData.get('jobTitle') || '',
                description: formData.get('jobDescription') || '',
                location: formData.get('jobLocation') || '',
                salary: salary,
                Requirements: formData.get('jobExperience') || '',
                Conditions_and_benefits: formData.get('jobConditions') || ''
            };
            addJob(jobData);
        });
    }
    
    // Settings form submission
    const settingsForm = document.getElementById('siteSettingsForm');
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
    });
    
    // Initialize dashboard
    showSection('dashboard');
});

function formatSalary(value) {
    const num = Number(value);
    if (!isFinite(num)) return '-';
    try {
        return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(num);
    } catch (_) {
        return `${num} ₽`;
    }
}


