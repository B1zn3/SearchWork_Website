const API_BASE_URL = `/main`;


const jobsGrid = document.getElementById('jobsGrid');
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

let jobDetailModal = null;
let applicationModal = null;
let jobDetailTitle = null;
let jobSalaryEl = null;
let jobLocationEl = null;
let jobRequirementsEl = null;
let jobBenefitsEl = null;

document.addEventListener('DOMContentLoaded', function() {  
    initializeModalElements();
    
    loadJobs();
    loadPublicSettings();
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.job-card, .feature, .contact-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});


function initializeModalElements() {
    jobDetailModal = document.getElementById('jobDetailModal');
    applicationModal = document.getElementById('applicationModal');
    jobDetailTitle = document.getElementById('jobDetailTitle');
    jobSalaryEl = document.getElementById('jobSalary');
    jobLocationEl = document.getElementById('jobLocation');
    jobRequirementsEl = document.getElementById('jobRequirements');
    jobBenefitsEl = document.getElementById('jobBenefits');
    
    if (!jobDetailModal) {
        console.error('❌ Модальное окно деталей вакансии не найдено!');
    }
    if (!applicationModal) {
        console.error('❌ Модальное окно заявки не найдено!');
    }
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
    
    // Исправлено: правильный порядок полей для требований
    const requirements = job.Requirements || job.requirements;
    const requirementsPreview = requirements ? 
        requirements.substring(0, 100) + (requirements.length > 100 ? '...' : '') : 
        'Требования уточняются';
    
    // Исправлено: правильный порядок полей для льгот
    const benefits = job.Conditions_and_benefits || job.conditions_and_benefits || job.benefits;
    const benefitsPreview = benefits ? 
        benefits.substring(0, 100) + (benefits.length > 100 ? '...' : '') : 
        'Льготы не указаны';
    
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
        
        <div class="job-description">
            ${job.description.substring(0, 150)}${job.description.length > 150 ? '...' : ''}
        </div>
        <div class="job-benefits">
                <i class="fas fa-gift"></i>
                <span>${benefitsPreview}</span>
        </div>
        <div class="job-preview-info">
            <div class="job-requirements-preview">
                <i class="fas fa-clipboard-list"></i>
                <span>${requirementsPreview}</span>
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

document.addEventListener('DOMContentLoaded', function() {
    loadJobs();
    loadPublicSettings();
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.job-card, .feature, .contact-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}); 


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

function openJobDetailModal(job) {
    if (!jobDetailModal) {
        console.error('Модальное окно не инициализировано');
        showNotification('Ошибка открытия карточки вакансии', 'error');
        return;
    }
    
    currentJobId = job.id;
    
    // Безопасные проверки всех элементов
    if (jobDetailTitle) jobDetailTitle.textContent = job.title || 'Вакансия';
    if (jobSalaryEl) jobSalaryEl.textContent = typeof job.salary === 'number' ? `${job.salary.toLocaleString()} BYN` : (job.salary || 'Не указана');
    if (jobLocationEl) jobLocationEl.textContent = job.location || 'Не указано';
    
    // Устанавливаем дату публикации
    const jobDateEl = document.getElementById('jobDate');
    if (jobDateEl) {
        const createdDate = job.created_at ? new Date(job.created_at).toLocaleDateString('ru-RU') : 'Не указана';
        jobDateEl.textContent = createdDate;
    }
    
    // Устанавливаем описание профессии
    const jobDescriptionEl = document.getElementById('jobDescription');
    if (jobDescriptionEl) {
        jobDescriptionEl.textContent = job.description || 'Описание не указано';
    }
    
    // Устанавливаем требования
    if (jobRequirementsEl) {
        jobRequirementsEl.textContent = job.Requirements || job.requirements || 'Требования уточняются';
    }
    
    // Устанавливаем условия и льготы - ИСПРАВЛЕНО!
    if (jobBenefitsEl) {
        const benefits = job.Conditions_and_benefits || job.conditions_and_benefits || job.benefits;
        
        if (benefits && benefits.trim() !== '') {
            jobBenefitsEl.innerHTML = benefits; // Используем innerHTML вместо textContent
        } else {
            jobBenefitsEl.innerHTML = 'Льготы не указаны';
            jobBenefitsEl.style.color = '#6b7280';
            jobBenefitsEl.style.fontStyle = 'italic';
        }
    } else {
        console.error('Элемент jobBenefitsEl не найден!');
    }

    jobDetailModal.style.display = 'block';
}

function closeJobDetailModal() {
    jobDetailModal.style.display = 'none';
}
window.closeJobDetailModal = closeJobDetailModal;

function openApplicationModal() {
    applicationModal.style.display = 'block';
}
window.openApplicationModal = openApplicationModal;

function closeModal() {
    applicationModal.style.display = 'none';
}
window.closeModal = closeModal;

async function handleFormSubmission(event) {
    event.preventDefault();
    
    if (!currentJobId) {
        showNotification('Ошибка: не выбрана вакансия', 'error');
        return;
    }
    
    const formData = new FormData(event.target);
    const fullName = formData.get('fullName').trim();
    const email = formData.get('email').trim();
    const phone = formData.get('phone').trim();
    const experience = formData.get('experience') ? formData.get('experience').trim() : '';
    
    // Валидация на фронтенде
    const errors = [];
    
    // Валидация ФИО
    if (!fullName) {
        errors.push('ФИО обязательно для заполнения');
    } else if (!/^[А-Яа-яЁё\s-]{2,100}$/.test(fullName)) {
        errors.push('ФИО должно содержать только русские буквы, пробелы и дефисы (2-100 символов)');
    } else if (fullName.split(/\s+/).length < 2) {
        errors.push('ФИО должно содержать минимум имя и фамилию');
    }
    
    // Валидация email
    if (!email) {
        errors.push('Email обязателен для заполнения');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Введите корректный email адрес');
    }
    
    // Валидация телефона
    if (!phone) {
        errors.push('Номер телефона обязателен для заполнения');
    } else {
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        if (!/^(\+375|80)(25|29|33|44|17)\d{7}$/.test(cleanPhone)) {
            errors.push('Введите корректный номер телефона в белорусском формате');
        }
    }
    
    // Валидация опыта работы
    if (experience && experience.length > 2000) {
        errors.push('Описание опыта работы не должно превышать 2000 символов');
    }
    
    // Если есть ошибки, показываем их
    if (errors.length > 0) {
        showNotification(errors[0], 'error');
        return;
    }
    
    try {
        // Отправляем данные на сервер
        const response = await fetch(`${API_BASE_URL}/apply/${currentJobId}`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Ошибка отправки заявки');
        }
        
        const result = await response.json();
        showNotification('Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.', 'success');
        
        closeModal();
        event.target.reset();
        
    } catch (error) {
        console.error('Ошибка отправки заявки:', error);
        showNotification(error.message || 'Ошибка отправки заявки', 'error');
    }
}

window.handleFormSubmission = handleFormSubmission;

window.addEventListener('click', (e) => {
    if (e.target === jobDetailModal) closeJobDetailModal();
    if (e.target === applicationModal) closeModal();
});

async function loadPublicSettings() {
    try {
        const res = await fetch(`${API_BASE_URL}/settings`);
        if (!res.ok) return;
        const s = await res.json();
        const emailEl = document.getElementById('contactEmailText');
        const phoneEl = document.getElementById('contactPhoneText');
        const addressEl = document.getElementById('contactAddressText');
        if (emailEl) emailEl.textContent = s.site_email || '—';
        if (phoneEl) phoneEl.textContent = s.site_phone || '—';
        if (addressEl) addressEl.textContent = s.site_adress || '—';
    } catch (e) {
        // молча игнорируем, чтобы не мешать остальному функционалу
        console.warn('Не удалось загрузить настройки сайта');
    }
}

// Добавляем функцию удаления вакансии
async function deleteJob(jobId) {
    if (!confirm('Вы уверены, что хотите удалить эту вакансию?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Ошибка удаления вакансии');
        }
        
        showNotification('Вакансия успешно удалена', 'success');
        // Перезагружаем список вакансий
        loadJobs();
        
    } catch (error) {
        console.error('Ошибка удаления вакансии:', error);
        showNotification('Ошибка удаления вакансии', 'error');
    }
}

// Делаем функцию доступной глобально
window.deleteJob = deleteJob;