const API_BASE_URL = '/admin-panel';

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
        const [jobsRes, appsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/jobs`, { method: 'GET', credentials: 'include', headers: { 'Accept': 'application/json' } }),
            fetch(`${API_BASE_URL}/applications`, { method: 'GET', credentials: 'include', headers: { 'Accept': 'application/json' } })
        ]);

        let totalJobs = 0;
        let appsLastWeek = 0;

        if (jobsRes.ok) {
            const jobs = await jobsRes.json();
            totalJobs = jobs.length;
        }

        if (appsRes.ok) {
            const apps = await appsRes.json();
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            appsLastWeek = apps.filter(a => a.created_at && new Date(a.created_at) >= weekAgo).length;
        }

        updateStats({ total_jobs: totalJobs, apps_last_week: appsLastWeek });
    } catch (error) {
        console.error('Ошибка загрузки дашборда:', error);
        showNotification('Ошибка загрузки данных', 'error');
    }
}

function updateStats(stats) {
    const jobsEl = document.getElementById('totalJobs');
    if (jobsEl) jobsEl.textContent = stats.total_jobs || 0;

    const weekEl = document.getElementById('pendingApplications');
    if (weekEl) weekEl.textContent = stats.apps_last_week || 0;
}

// Jobs functions
async function loadJobsTable() {
    try {
        const response = await fetch(`${API_BASE_URL}/jobs`, { method: 'GET', credentials: 'include', headers: { 'Accept': 'application/json' } });
        
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
                <td colspan="5" style="text-align: center; padding: 3rem 1rem;"> <!-- Изменили colspan с 6 на 5 -->
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
        
        const title = job.title || 'Название не указано';
        const location = job.location || 'Локация не указана';
        const salary = job.salary ? `${job.salary.toLocaleString()} BYN` : 'Зарплата не указана';
        const requirements = job.Requirements || job.requirements || 'Требования не указаны';
        const createdDate = job.created_at ? new Date(job.created_at).toLocaleDateString('ru-RU') : 'Дата не указана';
        
        const requirementsText = requirements.length > 80 ? 
            requirements.substring(0, 80) + '...' : requirements;
        
        const locationWithIcon = `<i class="fas fa-map-marker-alt cell-icon"></i>${location}`;
        
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
        row.style.animationDelay = `${index * 0.1}s`;
        tbody.appendChild(row);
    });
}
// Applications functions
async function loadApplicationsTable() {
    try {
        const response = await fetch(`${API_BASE_URL}/applications`, { method: 'GET', credentials: 'include', headers: { 'Accept': 'application/json' } });
        if (response.ok) {
            applicationsData = await response.json();
            renderApplicationsTable(applicationsData);
        } else {
            console.error('Ошибка API при загрузке заявок:', response.status, response.statusText);
            showNotification(`Ошибка API при загрузке заявок: ${response.status}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка загрузки заявок:', error);
        showNotification('Ошибка загрузки заявок', 'error');
    }
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

function renderApplicationsTable(applications) {
    const tbody = document.querySelector('#applicationsTable tbody');
    if (!tbody) {
        console.error('Элемент #applicationsTable tbody не найден');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (!applications || applications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 3rem 1rem;">
                    <div style="color: #64748b; font-size: 1.1rem;">
                        <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; display: block; color: #cbd5e1; opacity: 0.5;"></i>
                        <p style="margin-bottom: 0.5rem; font-weight: 500;">Нет заявок для отображения</p>
                        <p style="font-size: 0.9rem; opacity: 0.7;">Заявки появятся здесь после подачи кандидатами</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    applications.forEach(app => {
        const row = document.createElement('tr');
        const statusClass = getStatusClass(app.status);
        const statusText = getStatusText(app.status);
        
        const experienceText = app.experience ? (app.experience.length > 200 ? app.experience.substring(0, 200) + '…' : app.experience) : '-';
        const createdDate = app.created_at ? new Date(app.created_at).toLocaleDateString('ru-RU') : 'Дата не указана';
        
        row.innerHTML = `
            <td>${app.fio || 'Не указано'}</td>
            <td>${app.email || 'Не указано'}</td>
            <td><a href="tel:${app.phone || ''}" style="color:#007bff;text-decoration:none;">${app.phone || 'Не указано'}</a></td>
            <td><div class="experience-cell" title="${(app.experience || '').replace(/"/g, '&quot;')}">${experienceText}</div></td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td><i class="fas fa-calendar-alt cell-icon"></i>${createdDate}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewApplication(${app.id})" title="Открыть карточку">
                    <i class="fas fa-eye"></i>
                </button>
                ${app.status === 'pending' ? `
                    <button class="btn btn-sm btn-success" onclick="approveApplication(${app.id})" title="Одобрить">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="rejectApplication(${app.id})" title="Отклонить">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function approveApplication(applicationId = null) {
    const id = applicationId || currentApplicationId;
    if (!id) return;
    
    try {
        const formData = new FormData();
        formData.append('status', 'approved');
        
        const response = await fetch(`${API_BASE_URL}/applications/${id}/status`, {
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
        
        const response = await fetch(`${API_BASE_URL}/applications/${id}/status`, {
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

async function filterApplications() {
    try {
        const statusFilter = document.getElementById('statusFilter');
        const selectedStatus = statusFilter.value;
        
        if (!selectedStatus) {
            await loadApplicationsTable();
            return;
        }

        const response = await fetch(`${API_BASE_URL}/applications/filter/${selectedStatus}`, {
            method: 'GET'
        });
        
        if (response.ok) {
            showNotification('Фильтр применен', 'success');
            
            const filteredApplications = await response.json();
            
            updateApplicationsTable(filteredApplications);
            
            await loadDashboard();
        } else {
            const error = await response.json();
            showNotification(`Ошибка: ${error.detail}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка фильтрации заявок:', error);
        showNotification('Ошибка фильтрации заявок', 'error');
    }
}

function updateApplicationsTable(applications) {
    const tableBody = document.querySelector('#applicationsTable tbody');
    tableBody.innerHTML = '';
    
    applications.forEach(app => {
            const statusClass = getStatusClass(app.status);
            const statusText = getStatusText(app.status);
            const experience = app.experience || '';
            const experienceText = experience.length > 200 ? 
                experience.substring(0, 200) + '…' : experience;
            
            const createdDate = app.created_at ? 
                new Date(app.created_at).toLocaleDateString('ru-RU') : 
                'Дата не указана';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${app.fio || 'Не указано'}</td>
                <td>${app.email || 'Не указано'}</td>
                <td><a href="tel:${app.phone || ''}" style="color:#007bff;text-decoration:none;">${app.phone || 'Не указано'}</a></td>
                <td><div class="experience-cell" title="${experience.replace(/"/g, '&quot;')}">${experienceText || '-'}</div></td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td><i class="fas fa-calendar-alt cell-icon"></i>${createdDate}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewApplication(${app.id})" title="Открыть карточку">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${app.status === 'pending' ? `
                        <button class="btn btn-sm btn-success" onclick="approveApplication(${app.id})" title="Одобрить">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="rejectApplication(${app.id})" title="Отклонить">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </td>
            `;
            tableBody.appendChild(row);
        
    });
}

// settings
async function updateSettings() {
    try {
        const formData = new FormData();
        formData.append('site_adress', document.getElementById('siteAddress').value);
        formData.append('site_email', document.getElementById('siteEmail').value);
        formData.append('site_phone', document.getElementById('sitePhone').value);

        const response = await fetch(`${API_BASE_URL}/settings`, {
            method: 'PUT',
            credentials: 'include',
            body: formData
        });
        
         if (response.ok) {
            const updatedSettings = await response.json();
            showNotification('Настройки успешно обновлены!', 'success');
            
            if (document.getElementById('currentAddress')) {
                document.getElementById('currentAddress').textContent = updatedSettings.site_adress;
            }
            if (document.getElementById('currentEmail')) {
                document.getElementById('currentEmail').textContent = updatedSettings.site_email;
            }
            if (document.getElementById('currentPhone')) {
                document.getElementById('currentPhone').textContent = updatedSettings.site_phone;
            }
            
            closeModal('settingsModal');
            return updatedSettings;
        } else {
            const errorData = await response.json().catch(() => ({ detail: 'Неизвестная ошибка' }));
            showNotification(`Ошибка: ${errorData.detail || 'Неизвестная ошибка'}`, 'error');
            console.error('Ошибка сервера:', response.status, errorData);
        }
    } catch (error) {
        console.error('Ошибка обновления настроек:', error);
        showNotification('Ошибка сети при обновлении настроек', 'error');
    }
}

async function loadSettings() {
    try {
        const response = await fetch('/admin-panel/settings');
        if (response.ok) {
            const settings = await response.json();

            document.getElementById('siteEmail').value = settings.site_email || '';
            document.getElementById('sitePhone').value = settings.site_phone || '';
            document.getElementById('siteAddress').value = settings.site_adress || '';
        }
    } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
    }
}
document.addEventListener('DOMContentLoaded', function() {
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit',updateSettings);
    }
});


function showNotification(message, type = 'info') {
    let displayMessage;
    
    if (typeof message === 'string') {
        displayMessage = message;
    } else if (typeof message === 'object') {
        try {
            displayMessage = JSON.stringify(message);
        } catch (e) {
            displayMessage = 'Произошла ошибка';
        }
    } else {
        displayMessage = String(message);
    }
    
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = displayMessage;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
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
        
        const response = await fetch(`${API_BASE_URL}/new_job`, {
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


function editJob(id) {
    const job = jobsData.find(j => j.id === id);
    if (!job) {
        showNotification('Вакансия не найдена', 'error');
        return;
    }
    

    document.getElementById('editJobId').value = job.id;
    document.getElementById('editJobTitle').value = job.title;
    document.getElementById('editJobDescription').value = job.description;
    document.getElementById('editJobLocation').value = job.location;
    document.getElementById('editJobSalary').value = job.salary;
    document.getElementById('editJobRequirements').value = job.Requirements || job.requirements || '';
    document.getElementById('editJobConditions').value = job.Conditions_and_benefits || job.conditions_and_benefits || '';
    
    
    document.getElementById('editJobModal').style.display = 'block';
}


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
        
        
        if (modalId === 'addJobModal') {
            document.getElementById('addJobForm').reset();
        } else if (modalId === 'editJobModal') {
            document.getElementById('editJobForm').reset();
            document.getElementById('editJobId').value = '';
        }
    }
}

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
            const errorData = await response.json();
            showNotification(
                `Ошибка удаления: ${errorData.detail || 'Неизвестная ошибка'}`,
                'error'
            );
        }
    } catch (error) {
        console.error('Ошибка удаления вакансии:', error);
        showNotification('Ошибка подключения к серверу', 'error');
    }
}

function viewApplication(id) {
  const app = applicationsData.find(a => a.id === id);
  if (!app) return;

  currentApplicationId = id;


  const setText = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = val || '-'; };
  setText('#appViewName', app.fio);
  setText('#appViewEmail', app.email);
  setText('#appViewPhone', app.phone);
  setText('#appViewJob', app.job_title); 
  setText('#appViewDate', app.created_at ? new Date(app.created_at).toLocaleString('ru-RU') : '-');
  setText('#appViewExperience', app.experience);

  const approveBtn = document.getElementById('approveApplicationBtn');
  const rejectBtn  = document.getElementById('rejectApplicationBtn');
  if (approveBtn) approveBtn.onclick = () => approveApplication(id);
  if (rejectBtn)  rejectBtn.onclick  = () => rejectApplication(id);

  const modal = document.getElementById('applicationViewModal');
  if (modal) modal.style.display = 'block';
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


document.addEventListener('DOMContentLoaded', () => {
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
            

            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('active');
            }
        });
    });
    
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
    
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            updateSettings();
        });
    }
    
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const modal = closeBtn.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
        if (window.innerWidth <= 1024 && 
            !sidebar.contains(e.target) && 
            !sidebarToggle.contains(e.target) && 
            sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    });
    
    showSection('dashboard');
    
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024) {
            sidebar.classList.remove('active');
        }
    });
}); 