const API_BASE_URL = `${window.location.origin}/main`;


const jobsGrid = document.getElementById('jobsGrid');
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

const jobDetailModal = document.getElementById('jobDetailModal');
const applicationModal = document.getElementById('applicationModal');
const jobDetailTitle = document.getElementById('jobDetailTitle');
const jobSalaryEl = document.getElementById('jobSalary');
const jobLocationEl = document.getElementById('jobLocation');
const jobRequirementsEl = document.getElementById('jobRequirements');
const jobBenefitsEl = document.getElementById('jobBenefits');
const jobMainImageEl = document.getElementById('jobMainImage');
const jobImageGalleryEl = document.getElementById('jobImageGallery');
const jobVideoEl = document.getElementById('jobVideo');


let jobsData = [];

// Добавим переменную для хранения текущего job_id
let currentJobId = null;

if (navToggle) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}


document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});


async function loadJobs() {
    try {
        const response = await fetch(`${API_BASE_URL}/jobs`);
        if (!response.ok) {
            throw new Error('Ошибка загрузки вакансий');
        }
        jobsData = await response.json();
        
        jobsGrid.innerHTML = '';
        jobsData.forEach(job => {
            const jobCard = createJobCard(job);
            jobsGrid.appendChild(jobCard);
        });
    } catch (error) {
        console.error('Ошибка загрузки вакансий:', error);
        showNotification('Ошибка загрузки вакансий', 'error');
        jobsGrid.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">Не удалось загрузить вакансии. Попробуйте обновить страницу.</p>';
    }
}


function createJobCard(job) {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.style.cursor = 'pointer';
    
    // Форматируем зарплату
    const salary = typeof job.salary === 'number' ? `${job.salary.toLocaleString()} BYN` : job.salary;
    
    // Форматируем дату создания
    const createdDate = job.created_at ? new Date(job.created_at).toLocaleDateString('ru-RU') : 'Не указана';
    
    // Берем требования из БД (Requirements)
    const requirementsPreview = job.requirements ? 
        job.requirements.substring(0, 100) + (job.requirements.length > 100 ? '...' : '') : 
        'Требования уточняются';
    
    // Берем условия и льготы из БД (Conditions_and_benefits)
    const benefitsPreview = job.conditions_and_benefits ? 
        job.conditions_and_benefits.substring(0, 100) + (job.conditions_and_benefits.length > 100 ? '...' : '') : 
        'Условия уточняются';
    
    // Получаем первое изображение для превью
    const media = Array.isArray(job.media) ? job.media : [];
    const firstImage = media.find(m => 
        (m.file_type || '').toLowerCase().includes('image') || 
        /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(m.file_url || '')
    );
    
    // Проверяем наличие видео
    const hasVideo = media.some(m => 
        (m.file_type || '').toLowerCase().includes('video') || 
        /\.(mp4|webm|ogg|avi|mov|mkv)$/i.test(m.file_url || '')
    );
    
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
        
        ${firstImage ? `
        <div class="job-card-image">
            <img src="${firstImage.file_url}" alt="Превью профессии" class="job-preview-image">
            ${hasVideo ? '<div class="video-indicator"><i class="fas fa-play"></i></div>' : ''}
        </div>
        ` : ''}
        
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
        <div class="job-preview-info">
            <div class="job-requirements-preview">
                <i class="fas fa-clipboard-list"></i>
                <span>${requirementsPreview}</span>
            </div>
            <div class="job-benefits-preview">
                <i class="fas fa-gift"></i>
                <span>${benefitsPreview}</span>
            </div>
        </div>
        
        ${media.length > 0 ? `
        <div class="job-media-preview">
            <span class="media-count">
                <i class="fas fa-images"></i>
                ${media.length} файл(ов)
            </span>
        </div>
        ` : ''}
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
    currentJobId = job.id;
    
    // Проверяем существование элементов перед установкой textContent
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

    // Очищаем медиа элементы с проверками
    if (jobImageGalleryEl) jobImageGalleryEl.innerHTML = '';
    if (jobVideoEl) jobVideoEl.innerHTML = '';
    if (jobMainImageEl) jobMainImageEl.src = '';

    // Обрабатываем медиа файлы
    const media = Array.isArray(job.media) ? job.media : [];
    const images = media.filter(m => 
        (m.file_type || '').toLowerCase().includes('image') || 
        /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(m.file_url || '')
    );
    const videos = media.filter(m => 
        (m.file_type || '').toLowerCase().includes('video') || 
        /\.(mp4|webm|ogg|avi|mov|mkv)$/i.test(m.file_url || '')
    );

    // Отображаем основное изображение
    if (images.length > 0 && jobMainImageEl) {
        jobMainImageEl.src = images[0].file_url;
        jobMainImageEl.style.display = 'block';
        
        // Создаем галерею дополнительных изображений
        if (jobImageGalleryEl && images.length > 1) {
            images.slice(1).forEach((img, index) => {
                const thumb = document.createElement('img');
                thumb.src = img.file_url;
                thumb.alt = `Фото профессии ${index + 2}`;
                thumb.className = 'gallery-thumbnail';
                thumb.addEventListener('click', () => {
                    if (jobMainImageEl) jobMainImageEl.src = img.file_url;
                });
                jobImageGalleryEl.appendChild(thumb);
            });
        }
    } else if (jobMainImageEl) {
        jobMainImageEl.src = 'https://via.placeholder.com/600x400?text=Нет+изображения';
        jobMainImageEl.style.display = 'block';
    }

    // Отображаем видео
    if (videos.length > 0 && jobVideoEl) {
        videos.forEach((videoData, index) => {
            const videoContainer = document.createElement('div');
            videoContainer.className = 'video-container';
            
            const video = document.createElement('video');
            video.controls = true;
            video.preload = 'metadata';
            video.className = 'job-video';
            
            const source = document.createElement('source');
            source.src = videoData.file_url;
            source.type = videoData.file_type || 'video/mp4';
            
            video.appendChild(source);
            videoContainer.appendChild(video);
            
            // Добавляем заголовок для видео
            const videoTitle = document.createElement('p');
            videoTitle.className = 'video-title';
            videoTitle.textContent = `Видео ${index + 1}`;
            videoContainer.appendChild(videoTitle);
            
            jobVideoEl.appendChild(videoContainer);
        });
    }

    // Устанавливаем требования
    if (jobRequirementsEl) {
        jobRequirementsEl.textContent = job.requirements || job.Requirements || 'Требования уточняются';
    }
    
    // Устанавливаем условия и льготы
    if (jobBenefitsEl) {
        jobBenefitsEl.textContent = job.conditions_and_benefits || job.Conditions_and_benefits || 'Условия уточняются';
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