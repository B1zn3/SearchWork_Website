const API_BASE_URL = `/main`;
const jobsGrid = document.getElementById('jobsGrid');
let jobDetailModal = null;
let applicationModal = null;
let jobDetailTitle = null;
let jobSalaryEl = null;
let jobLocationEl = null;
let jobRequirementsEl = null;
let jobBenefitsEl = null;
let currentJobId = null;

document.addEventListener('DOMContentLoaded', function() {  
    initializeModalElements();
    loadJobs();
    loadPublicSettings();
});

function initializeModalElements() {
    jobDetailModal = document.getElementById('jobDetailModal');
    applicationModal = document.getElementById('applicationModal');
    jobDetailTitle = document.getElementById('jobDetailTitle');
    jobSalaryEl = document.getElementById('jobSalary');
    jobLocationEl = document.getElementById('jobLocation');
    jobRequirementsEl = document.getElementById('jobRequirements');
    jobBenefitsEl = document.getElementById('jobBenefits');
    
}

async function loadJobs() {
    try {
        const jobsGrid = document.getElementById('jobsGrid');
        
        if (!jobsGrid) {
            console.error('Элемент jobs-grid не найден');
            showNotification('Ошибка отображения вакансий', 'error');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/jobs`);
        if (!response.ok) {
            throw new Error('Ошибка загрузки вакансий');
        }
        
        const jobsData = await response.json();
        
        jobsGrid.innerHTML = '';
        jobsData.forEach(job => {
            const jobCard = createJobCard(job);
            jobsGrid.appendChild(jobCard);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки вакансий:', error);
        showNotification('Ошибка загрузки вакансий', 'error');
        
        const jobsGrid = document.getElementById('jobs-grid');
        if (jobsGrid) {
            jobsGrid.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">Не удалось загрузить вакансии. Попробуйте обновить страницу.</p>';
        }
    }
}


function createJobCard(job) {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.style.cursor = 'pointer';
    
    const salary = typeof job.salary === 'number' ? `${job.salary.toLocaleString()} BYN` : job.salary;
    const createdDate = job.created_at ? new Date(job.created_at).toLocaleDateString('ru-RU') : 'Не указана';
    
    card.innerHTML = `
        <div class="job-card-header">
            <div class="job-icon">
                <i class="fas fa-briefcase"></i>
            </div>
            <div>
                <h3 class="job-title">${job.title}</h3>
                <p class="job-company">Вакансия</p>
            </div>
        </div>
        
        <div class="job-details">
            <div class="job-detail">
                <i class="fas fa-map-marker-alt"></i>
                <span>${job.location}</span>
            </div>
            <div class="job-detail">
                <i class="fas fa-money-bill-wave"></i>
                <span>${salary}</span>
            </div>
            <div class="job-detail">
                <i class="fas fa-calendar"></i>
                <span>${createdDate}</span>
            </div>
        </div>
    `;
    
    card.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        loadJobDetails(job.id);
    });
    
    return card;
}

function openJobDetailModal(job) {
    
    currentJobId = job.id;
    
    

    if (jobDetailTitle) jobDetailTitle.textContent = job.title || 'Вакансия';
    if (jobSalaryEl) jobSalaryEl.textContent = typeof job.salary === 'number' ? `${job.salary.toLocaleString()} BYN` : (job.salary || 'Не указана');
    if (jobLocationEl) jobLocationEl.textContent = job.location || 'Не указано';

    const jobDateEl = document.getElementById('jobDate');
    if (jobDateEl) {
        const createdDate = job.created_at ? new Date(job.created_at).toLocaleDateString('ru-RU') : 'Не указана';
        jobDateEl.textContent = createdDate;
    }

    const jobDescriptionEl = document.getElementById('jobDescription');
    if (jobDescriptionEl) {
        jobDescriptionEl.textContent = job.description || 'Описание не указано';
    }

    if (jobRequirementsEl) {
        jobRequirementsEl.textContent = job.Requirements || job.requirements || 'Требования уточняются';
    }
 
    const benefitsElement = document.getElementById('jobBenefits');
    if (benefitsElement) {
        const benefits = job.Conditions_and_benefits || 'Льготы уточняются';
        benefitsElement.textContent = benefits;
    }
    jobDetailModal.style.display = 'block';
}

async function loadJobDetails(jobId) {
    try {
        const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
        if (!res.ok) throw new Error('Ошибка загрузки карточки вакансии');
        const data = await res.json();
        openJobDetailModal(data);
    } catch (e) {
        console.error('Ошибка при загрузке деталей профессии:', e);
        showNotification('Не удалось открыть карточку вакансии', 'error');
    }
}

async function handleFormSubmission(event) {
    event.preventDefault();
    
    if (!currentJobId) {
        showNotification('Ошибка: не выбрана вакансия', 'error');
        return;
    }
    
    const formData = new FormData(event.target);
    const applicationData = {
        fio: formData.get('fullName').trim(),
        email: formData.get('email').trim(),
        phone: formData.get('phone').trim(),
        experience: formData.get('experience') ? formData.get('experience').trim() : '',
        job_id: currentJobId
    };
    
    const errors = [];
    
    if (errors.length > 0) {
        showNotification(errors[0], 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/apply/${currentJobId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(applicationData)
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {

            if (response.status === 422 && responseData.detail) {

                if (Array.isArray(responseData.detail)) {
                    const errorMessages = responseData.detail.map(error => 
                        `${error.loc && error.loc.length > 1 ? error.loc[1] + ': ' : ''}${error.msg}`
                    );
                    throw new Error(errorMessages.join(', '));
                } 

                else if (typeof responseData.detail === 'string') {
                    throw new Error(responseData.detail);
                }
            }
            throw new Error(responseData.detail || 'Ошибка отправки заявки');
        }
        
        showNotification('Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.', 'success');
        
        closeModal();
        event.target.reset();
        
    } catch (error) {
        console.error('Ошибка отправки заявки:', error);
        showNotification(error.message || 'Ошибка отправки заявки', 'error');
    }
}

function updateSettingsElements(settings) {
    const elements = {
        email: document.getElementById('contactEmailText'),
        phone: document.getElementById('contactPhoneText'),
        address: document.getElementById('contactAddressText')
    };
    
    if (elements.email) {
        elements.email.textContent = settings.site_email || '—';
        if (settings.site_email) {
            elements.email.href = `mailto:${settings.site_email}`;
        }
    }
    
    if (elements.phone) {
        elements.phone.textContent = settings.site_phone || '—';
        if (settings.site_phone) {
            elements.phone.href = `tel:${settings.site_phone.replace(/\s/g, '')}`;
        }
    }
    
    if (elements.address) {
        elements.address.textContent = settings.site_adress || '—';
    }
}

async function loadPublicSettings() {
    try {
        const res = await fetch(`${API_BASE_URL}/settings`);
        if (!res.ok) return;
        
        const settings = await res.json();
        updateSettingsElements(settings[0]);
        
    } catch (error) {
        console.warn('Не удалось загрузить настройки сайта:', error);
    }
}

function closeJobDetailModal() {
    jobDetailModal.style.display = 'none';
}

function openApplicationModal() {
    applicationModal.style.display = 'block';
}

function closeModal() {
    applicationModal.style.display = 'none';
}

function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

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
            notification.remove();
        }, 300);
    }, 5000);
}

window.addEventListener('beforeunload', function() {
    window.scrollTo(0, 0);
});