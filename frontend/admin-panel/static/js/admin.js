const API_BASE_URL = '/admin-panel';

let sidebar, mainContent, navLinks, sidebarToggle;
let dashboardSection, jobsSection, applicationsSection, settingsSection;
let selectedJobImages = []; 
let uploadedImageUrls = [];

let uploadedJobImageUrls = [];

selectedJobImages = [];
renderJobImagesList();

let jobsData = [];
let applicationsData = [];
let currentApplicationId = null;

function initDOMElements() {
    sidebar = document.querySelector('.sidebar');
    mainContent = document.querySelector('.main-content');
    navLinks = document.querySelectorAll('.nav-link');
    sidebarToggle = document.querySelector('.sidebar-toggle');
    dashboardSection = document.getElementById('dashboard');
    jobsSection = document.getElementById('jobs');
    applicationsSection = document.getElementById('applications');
    settingsSection = document.getElementById('settings');
}


// Navigation
function showSection(sectionId) {
    [dashboardSection, jobsSection, applicationsSection, settingsSection].forEach(section => {
        if (section) section.style.display = 'none';
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }

    if (navLinks && navLinks.length) {
        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
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
}

document.getElementById('addJobImageBtn').onclick = function() {
    document.getElementById('jobImageInput').value = '';
    document.getElementById('jobImageInput').click();
};

document.getElementById('jobImageInput').onchange = function(event) {
    // Дополняем массив, не теряя старые позиции.
    const newFiles = Array.from(event.target.files || []);
    selectedJobImages = selectedJobImages.concat(newFiles);
    renderJobImagesList();
};

function renderJobImagesList() {
    const container = document.getElementById('jobImagesList');
    container.innerHTML = '';
    selectedJobImages.forEach((file, idx) => {
        const div = document.createElement('div');
        div.textContent = file.name;
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '✕';
        removeBtn.onclick = function() {
            selectedJobImages.splice(idx, 1);
            renderJobImagesList();
        };
        div.appendChild(removeBtn);
        container.appendChild(div);
    });
}


function setupNavigation() {
    document.addEventListener('click', function(e) {
        if (sidebarToggle && e.target.closest('.sidebar-toggle')) {
            if (sidebar) sidebar.classList.toggle('active');
            return;
        }
        
        const navLink = e.target.closest('.nav-link');
        if (navLink && navLink.hasAttribute('data-section')) {
            e.preventDefault();
            const section = navLink.getAttribute('data-section');
            showSection(section);

            if (window.innerWidth <= 1024 && sidebar) {
                sidebar.classList.remove('active');
            }
        }

        if (e.target.closest('.btn-primary') && e.target.closest('.btn-primary').textContent.includes('Добавить вакансию')) {
            e.preventDefault();
            showAddJobModal();
        }

        if (e.target.closest('.btn-primary') && e.target.closest('.btn-primary').textContent.includes('Сохранить настройки')) {
            e.preventDefault();
            updateSettings();
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initDOMElements();
    setupNavigation();
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterApplications);
    }
    showSection('dashboard');
    window.addEventListener('resize', function() {
        if (window.innerWidth > 1024 && sidebar) {
            sidebar.classList.remove('active');
        }
    });
});


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

async function uploadImagesToS3(files) {
    const formData = new FormData();
    files.forEach(file => formData.append("photos", file));
    const resp = await fetch(`${API_BASE_URL}/upload-images`, { method: "POST", body: formData });
    if (!resp.ok) throw new Error('Ошибка загрузки фото');
    const data = await resp.json();
    return data.urls;
}

async function deleteImagesFromS3(urls) {
    const resp = await fetch(`${API_BASE_URL}/delete-images`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls })
    });
    return resp.ok;
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

function closeAddJobModal() {
    document.getElementById('addJobModal').style.display = 'none';
    document.getElementById('addJobForm').reset();
}

async function submitAddJob() {
    try {
        const salaryValue = document.getElementById('jobSalary').value;
        const jobData = {
            title: document.getElementById('jobTitle').value.trim(),
            description: document.getElementById('jobDescription').value.trim(),
            location: document.getElementById('jobLocation').value.trim(),
            salary: salaryValue ? parseFloat(salaryValue) : null,
            Requirements: document.getElementById('jobRequirements').value.trim(),
            Conditions_and_benefits: document.getElementById('jobConditions').value.trim()
        };
        if (!jobData.title || !jobData.description || !jobData.location) {
            showNotification('Заполните обязательные поля: название, описание и локация', 'error');
            return;
        }

        let imageUrls = [];
        if (selectedJobImages.length > 0) {
            imageUrls = await uploadImagesToS3(selectedJobImages);
        }
        jobData.photos = imageUrls;

        const response = await fetch(`${API_BASE_URL}/new_job`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jobData)
        });

        if (response.ok) {
            showNotification('Вакансия успешно создана!', 'success');
            closeModal('addJobModal');
            loadJobsTable();
            loadDashboard();
            selectedJobImages = [];
            renderJobImagesList();
        } else {
            if (imageUrls.length > 0) {
                await deleteImagesFromS3(imageUrls);
            }
            showNotification('Ошибка создания вакансии, фото удалены!', 'error');
        }
    } catch (error) {
        showNotification('Неизвестная ошибка при добавлении вакансии', 'error');
    }
}

function editJob(id) {
    const job = jobsData.find(j => j.id === id);
    if (!job) {
        showNotification('Вакансия не найдена', 'error');
        return;
    }
    document.getElementById('editJobId').value = job.id;
    document.getElementById('editJobTitle').value = job.title || '';
    document.getElementById('editJobDescription').value = job.description || '';
    document.getElementById('editJobLocation').value = job.location || '';
    document.getElementById('editJobSalary').value = job.salary || '';
    document.getElementById('editJobRequirements').value = job.Requirements || job.requirements || '';
    document.getElementById('editJobConditions').value = job.Conditions_and_benefits || job.conditions_and_benefits || '';

    document.getElementById('editJobModal').style.display = 'block';
}

async function submitEditJob() {
    try {
        const jobId = document.getElementById('editJobId').value;
        
        const jobData = {
            title: document.getElementById('editJobTitle').value.trim(),
            description: document.getElementById('editJobDescription').value.trim(),
            location: document.getElementById('editJobLocation').value.trim(),
            salary: document.getElementById('editJobSalary').value ? 
                   parseFloat(document.getElementById('editJobSalary').value) : null,
            Requirements: document.getElementById('editJobRequirements').value.trim(),
            Conditions_and_benefits: document.getElementById('editJobConditions').value.trim()
        };
        
        if (!jobData.title || !jobData.description || !jobData.location) {
            showNotification('Заполните обязательные поля: название, описание и локация', 'error');
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jobData)
        });

        if (response.ok) {
            showNotification('Вакансия успешно обновлена!', 'success');
            closeModal('editJobModal');
            loadJobsTable();
            loadDashboard();
        } else if (response.status === 422) {
            const errorData = await response.json();
            console.error('Ошибка валидации:', errorData);
            
            if (errorData.detail) {
                if (Array.isArray(errorData.detail)) {
                    const errorMessages = errorData.detail.map(error => 
                        `${error.loc && error.loc.length > 1 ? error.loc[1] + ': ' : ''}${error.msg}`
                    );
                    showNotification(errorMessages.join(', '), 'error');
                } else {
                    showNotification(errorData.detail, 'error');
                }
            } else {
                showNotification('Ошибка валидации данных', 'error');
            }
        } else {
            const errorText = await response.text();
            console.error('Ошибка сервера:', response.status, errorText);
            showNotification(`Ошибка сервера: ${response.status}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка обновления вакансии:', error);
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            showNotification('Ошибка подключения к серверу', 'error');
        } else {
            showNotification('Неизвестная ошибка при обновлении вакансии', 'error');
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

function showAddJobModal() {
    const modal = document.getElementById('addJobModal');
    if (modal) {
        modal.style.display = 'block';
    }
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
            </td>
        `;
        tbody.appendChild(row);
    });
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
                </td>
            `;
            tableBody.appendChild(row);
        
    });
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

async function approveApplication(applicationId = null) {
    const id = applicationId || currentApplicationId;
    if (!id) return;
    
    try {
        const statusData = {
            status: 'approved'
        };
        
        const response = await fetch(`${API_BASE_URL}/applications/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(statusData)
        });
        
        if (response.ok) {
            showNotification('Заявка одобрена!', 'success');
            closeApplicationModal();
            loadApplicationsTable();
            loadDashboard();
        } else if (response.status === 422) {
            const errorData = await response.json();
            console.error('Ошибка валидации при одобрении заявки:', errorData);
            
            if (errorData.detail) {
                if (Array.isArray(errorData.detail)) {
                    const errorMessages = errorData.detail.map(error => 
                        `${error.loc && error.loc.length > 1 ? error.loc[1] + ': ' : ''}${error.msg}`
                    );
                    showNotification(errorMessages.join(', '), 'error');
                } else {
                    showNotification(errorData.detail, 'error');
                }
            } else {
                showNotification('Ошибка валидации данных', 'error');
            }
        } else {
            const error = await response.json();
            showNotification(`Ошибка: ${error.detail || 'Неизвестная ошибка'}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка одобрения заявки:', error);
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            showNotification('Ошибка подключения к серверу', 'error');
        } else {
            showNotification('Ошибка одобрения заявки', 'error');
        }
    }
}

async function rejectApplication(applicationId = null) {
    const id = applicationId || currentApplicationId;
    if (!id) return;
    
    try {
        const statusData = {
            status: 'rejected'
        };
        
        const response = await fetch(`${API_BASE_URL}/applications/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(statusData)
        });
        
        if (response.ok) {
            showNotification('Заявка отклонена!', 'success');
            closeApplicationModal();
            loadApplicationsTable();
            loadDashboard();
        } else if (response.status === 422) {
            const errorData = await response.json();
            console.error('Ошибка валидации при отклонении заявки:', errorData);
            
            if (errorData.detail) {
                if (Array.isArray(errorData.detail)) {
                    const errorMessages = errorData.detail.map(error => 
                        `${error.loc && error.loc.length > 1 ? error.loc[1] + ': ' : ''}${error.msg}`
                    );
                    showNotification(errorMessages.join(', '), 'error');
                } else {
                    showNotification(errorData.detail, 'error');
                }
            } else {
                showNotification('Ошибка валидации данных', 'error');
            }
        } else {
            const error = await response.json();
            showNotification(`Ошибка: ${error.detail || 'Неизвестная ошибка'}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка отклонения заявки:', error);
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            showNotification('Ошибка подключения к серверу', 'error');
        } else {
            showNotification('Ошибка отклонения заявки', 'error');
        }
    }
}

async function filterApplications() {
    try {
        const statusFilter = document.getElementById('statusFilter');
        if (!statusFilter) {
            console.error('Элемент statusFilter не найден');
            return;
        }
        
        const selectedStatus = statusFilter.value;
        
        if (!selectedStatus) {
            await loadApplicationsTable();
            return;
        }

        const response = await fetch(`${API_BASE_URL}/applications/filter/${selectedStatus}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });
        
        if (response.ok) {
            const filteredApplications = await response.json();
            updateApplicationsTable(filteredApplications);
        } else if (response.status === 404) {
            console.warn('Endpoint фильтрации не найден, используем клиентскую фильтрацию');
            await loadApplicationsTable(); 
            filterApplicationsClientSide(selectedStatus);
        } else {
            const error = await response.json();
            showNotification(`Ошибка: ${error.detail || 'Неизвестная ошибка'}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка фильтрации заявок:', error);
        showNotification('Ошибка фильтрации заявок', 'error');
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


// settings
async function updateSettings() {
    try {
        const settingsData = {
            site_adress: document.getElementById('siteAddress').value.trim(),
            site_email: document.getElementById('siteEmail').value.trim(),
            site_phone: document.getElementById('sitePhone').value.trim()
        };

        const response = await fetch(`${API_BASE_URL}/settings`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settingsData)
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
        } else if (response.status === 422) {
            const errorData = await response.json();
            console.error('Ошибка валидации настроек:', errorData);
            
            if (errorData.detail) {
                if (Array.isArray(errorData.detail)) {
                    const errorMessages = errorData.detail.map(error => 
                        `${error.loc && error.loc.length > 1 ? error.loc[1] + ': ' : ''}${error.msg}`
                    );
                    showNotification(errorMessages.join(', '), 'error');
                } else {
                    showNotification(errorData.detail, 'error');
                }
            } else {
                showNotification('Ошибка валидации данных настроек', 'error');
            }
        } else {
            const errorData = await response.json().catch(() => ({ detail: 'Неизвестная ошибка' }));
            showNotification(`Ошибка: ${errorData.detail || 'Неизвестная ошибка'}`, 'error');
            console.error('Ошибка сервера:', response.status, errorData);
        }
    } catch (error) {
        console.error('Ошибка обновления настроек:', error);
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            showNotification('Ошибка подключения к серверу', 'error');
        } else {
            showNotification('Неизвестная ошибка при обновлении настроек', 'error');
        }
    }
}
async function loadSettings() {
    try {
        const response = await fetch('/admin-panel/settings');
        if (response.ok) {
            const settings = await response.json();
            document.getElementById('siteEmail').value = settings[0].site_email || '';
            document.getElementById('sitePhone').value = settings[0].site_phone || '';
            document.getElementById('siteAddress').value = settings[0].site_adress || '';
        }
    } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
    }
}
 

// Modal functions
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