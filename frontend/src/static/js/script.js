const API_BASE_URL = `/main`;
let jobDetailModal, applicationModal, jobDetailTitle, jobSalaryEl, jobLocationEl;
let jobRequirementsEl, jobBenefitsEl, currentJobId = null;

// Кэширование DOM-элементов и констант
const DOM = {
    jobsGrid: document.getElementById('jobsGrid'),
    jobDateEl: document.getElementById('jobDate'),
    jobDescriptionEl: document.getElementById('jobDescription'),
    benefitsElement: document.getElementById('jobBenefits'),
    contactEmailText: document.getElementById('contactEmailText'),
    contactPhoneText: document.getElementById('contactPhoneText'),
    contactAddressText: document.getElementById('contactAddressText')
};

// Утилитарные функции
const utils = {
    formatSalary: (salary) => typeof salary === 'number' ? `${salary.toLocaleString()} BYN` : salary,
    formatDate: (dateString) => dateString ? new Date(dateString).toLocaleDateString('ru-RU') : 'Не указана',
    showElement: (element, display = 'block') => element && (element.style.display = display),
    hideElement: (element) => element && (element.style.display = 'none')
};

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
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
        if (!DOM.jobsGrid) {
            console.error('Элемент jobs-grid не найден');
            showNotification('Ошибка отображения вакансий', 'error');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/jobs`);
        if (!response.ok) throw new Error('Ошибка загрузки вакансий');
        
        const jobsData = await response.json();
        renderJobs(jobsData);
        
    } catch (error) {
        console.error('Ошибка загрузки вакансий:', error);
        showNotification('Ошибка загрузки вакансий', 'error');
        
        if (DOM.jobsGrid) {
            DOM.jobsGrid.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">Не удалось загрузить вакансии. Попробуйте обновить страницу.</p>';
        }
    }
}

function renderJobs(jobsData) {
    DOM.jobsGrid.innerHTML = '';
    
    const fragment = document.createDocumentFragment();
    jobsData.forEach(job => {
        fragment.appendChild(createJobCard(job));
    });
    
    DOM.jobsGrid.appendChild(fragment);
}

function createJobCard(job) {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.style.cursor = 'pointer';
    
    const salary = utils.formatSalary(job.salary);
    const createdDate = utils.formatDate(job.created_at);
    
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
    
    // Обновление текстового содержимого
    if (jobDetailTitle) jobDetailTitle.textContent = job.title || 'Вакансия';
    if (jobSalaryEl) jobSalaryEl.textContent = utils.formatSalary(job.salary) || 'Не указана';
    if (jobLocationEl) jobLocationEl.textContent = job.location || 'Не указано';
    if (DOM.jobDateEl) DOM.jobDateEl.textContent = utils.formatDate(job.created_at);
    if (DOM.jobDescriptionEl) DOM.jobDescriptionEl.textContent = job.description || 'Описание не указано';
    if (jobRequirementsEl) jobRequirementsEl.textContent = job.Requirements || job.requirements || 'Требования уточняются';
    if (DOM.benefitsElement) DOM.benefitsElement.textContent = job.Conditions_and_benefits || 'Льготы уточняются';
    
    // Инициализация медиа-галереи
    const mediaData = job.media || [];
    initMediaGallery(job.id, mediaData);
    
    // Показать модальное окно
    utils.showElement(jobDetailModal);
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
    
    // Валидация (можно добавить более сложную логику)
    if (!applicationData.fio || !applicationData.email || !applicationData.phone) {
        showNotification('Пожалуйста, заполните все обязательные поля', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/apply/${currentJobId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(applicationData)
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
            let errorMessage = 'Ошибка отправки заявки';
            
            if (response.status === 422 && responseData.detail) {
                if (Array.isArray(responseData.detail)) {
                    errorMessage = responseData.detail.map(error => 
                        `${error.loc && error.loc.length > 1 ? error.loc[1] + ': ' : ''}${error.msg}`
                    ).join(', ');
                } else if (typeof responseData.detail === 'string') {
                    errorMessage = responseData.detail;
                }
            }
            
            throw new Error(errorMessage);
        }
        
        showNotification('Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.', 'success');
        closeModal();
        event.target.reset();
        
    } catch (error) {
        console.error('Ошибка отправки заявки:', error);
        showNotification(error.message || 'Ошибка отправки заявки', 'error');
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

function updateSettingsElements(settings) {
    if (DOM.contactEmailText && settings.site_email) {
        DOM.contactEmailText.textContent = settings.site_email;
        DOM.contactEmailText.href = `mailto:${settings.site_email}`;
    }
    
    if (DOM.contactPhoneText && settings.site_phone) {
        DOM.contactPhoneText.textContent = settings.site_phone;
        DOM.contactPhoneText.href = `tel:${settings.site_phone.replace(/\s/g, '')}`;
    }
    
    if (DOM.contactAddressText && settings.site_adress) {
        DOM.contactAddressText.textContent = settings.site_adress;
    }
}

function closeJobDetailModal() {
    utils.hideElement(jobDetailModal);
}

function openApplicationModal() {
    utils.showElement(applicationModal);
}

function closeModal() {
    utils.hideElement(applicationModal);
}

function showNotification(message, type = 'info') {
    // Удаляем существующие уведомления
    document.querySelectorAll('.notification').forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Анимация появления
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });
    
    // Автоматическое скрытие
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Оптимизированная функция для медиа-галереи
function initMediaGallery(jobId, mediaData) {
    const gallerySection = document.querySelector('.media-gallery-section');
    if (!gallerySection) return;
    
    const elements = {
        gallery: gallerySection.querySelector('.media-gallery'),
        mediaDisplay: gallerySection.querySelector('.media-display'),
        thumbnailsContainer: gallerySection.querySelector('.thumbnails'),
        emptyState: gallerySection.querySelector('.empty-state'),
        prevBtn: gallerySection.querySelector('.nav-btn.prev'),
        nextBtn: gallerySection.querySelector('.nav-btn.next'),
        fullscreenBtn: gallerySection.querySelector('.fullscreen-toggle')
    };
    
    let currentIndex = 0;
    
    // Очистка предыдущего содержимого
    elements.mediaDisplay.innerHTML = '';
    elements.thumbnailsContainer.innerHTML = '';
    
    // Проверка на наличие медиа
    if (!mediaData || mediaData.length === 0) {
        utils.showElement(elements.emptyState, 'flex');
        [elements.prevBtn, elements.nextBtn, elements.fullscreenBtn].forEach(btn => 
            utils.hideElement(btn));
        return;
    }
    
    utils.hideElement(elements.emptyState);
    [elements.prevBtn, elements.nextBtn, elements.fullscreenBtn].forEach(btn => 
        utils.showElement(btn, 'flex'));
    
    // Создание медиа-элементов
    mediaData.forEach((media, index) => {
        if (media.type === 'image') {
            createImageMedia(media, index, elements);
        } else if (media.type === 'video') {
            createVideoMedia(media, index, elements);
        }
    });
    
    // Показать первый элемент
    showMedia(0, elements, mediaData.length);
    
    // Назначение обработчиков событий
    if (elements.prevBtn) {
        elements.prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + mediaData.length) % mediaData.length;
            showMedia(currentIndex, elements, mediaData.length);
        });
    }
    
    if (elements.nextBtn) {
        elements.nextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % mediaData.length;
            showMedia(currentIndex, elements, mediaData.length);
        });
    }
    
    if (elements.fullscreenBtn) {
        elements.fullscreenBtn.addEventListener('click', () => {
            const activeMedia = elements.mediaDisplay.querySelector('.media-item.active');
            if (activeMedia && activeMedia.requestFullscreen) {
                activeMedia.requestFullscreen();
            }
        });
    }
}

// Вспомогательные функции для создания медиа-элементов
const SELECTORS = {
    mediaGallery: '.media-gallery-section',
    mediaDisplay: '.media-display',
    thumbnails: '.thumbnails',
    emptyState: '.empty-state',
    prevBtn: '.nav-btn.prev',
    nextBtn: '.nav-btn.next',
    fullscreenBtn: '.fullscreen-toggle'
};

// Функция для создания медиа-элемента с обработкой ошибок
function createMediaElement(media, index) {
    return new Promise((resolve) => {
        if (media.type === 'image') {
            const img = document.createElement('img');
            img.src = media.url;
            img.alt = media.title || `Изображение ${index + 1}`;
            img.classList.add('media-item');
            img.loading = 'lazy';
            
            img.onload = () => resolve({ element: img, type: 'image' });
            img.onerror = () => {
                console.error(`Не удалось загрузить изображение: ${media.url}`);
                resolve(null);
            };
            
        } else if (media.type === 'video') {
            const videoContainer = document.createElement('div');
            videoContainer.classList.add('video-container', 'media-item');
            
            const video = document.createElement('video');
            video.src = media.url;
            video.preload = 'metadata'; // Предзагрузка только метаданных
            
            const videoOverlay = document.createElement('div');
            videoOverlay.classList.add('video-overlay');
            videoOverlay.innerHTML = '<button class="play-btn"><i class="fas fa-play"></i></button>';
            
            videoContainer.appendChild(video);
            videoContainer.appendChild(videoOverlay);
            
            // Для видео сразу разрешаем, так как полная загрузка не требуется
            resolve({ element: videoContainer, type: 'video' });
        } else {
            resolve(null);
        }
    });
}

// Функция для создания миниатюры
function createThumbnail(media, index) {
    const thumb = document.createElement('div');
    
    if (media.type === 'image') {
        thumb.classList.add('thumbnail');
        thumb.innerHTML = `<img src="${media.url}" alt="Миниатюра ${index + 1}" loading="lazy">`;
    } else if (media.type === 'video') {
        thumb.classList.add('thumbnail', 'video');
        const thumbUrl = media.thumbnail || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHBvbHlnb24gcG9pbnRzPSI0MCwzMCA3MCw1MCA0MCw3MCIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==';
        thumb.innerHTML = `
            <img src="${thumbUrl}" alt="Видео миниатюра ${index + 1}">
            <i class="fas fa-play"></i>
        `;
    }
    
    thumb.addEventListener('click', () => showMedia(index));
    return thumb;
}

// Оптимизированная функция инициализации галереи
async function initMediaGallery(jobId, mediaData) {
    const gallerySection = document.querySelector(SELECTORS.mediaGallery);
    if (!gallerySection || !mediaData || mediaData.length === 0) {
        if (gallerySection) {
            const emptyState = gallerySection.querySelector(SELECTORS.emptyState);
            if (emptyState) emptyState.style.display = 'flex';
            
            // Скрываем элементы навигации
            [SELECTORS.prevBtn, SELECTORS.nextBtn, SELECTORS.fullscreenBtn].forEach(selector => {
                const el = gallerySection.querySelector(selector);
                if (el) el.style.display = 'none';
            });
        }
        return;
    }
    
    const mediaDisplay = gallerySection.querySelector(SELECTORS.mediaDisplay);
    const thumbnailsContainer = gallerySection.querySelector(SELECTORS.thumbnails);
    const emptyState = gallerySection.querySelector(SELECTORS.emptyState);
    const prevBtn = gallerySection.querySelector(SELECTORS.prevBtn);
    const nextBtn = gallerySection.querySelector(SELECTORS.nextBtn);
    const fullscreenBtn = gallerySection.querySelector(SELECTORS.fullscreenBtn);
    
    // Показываем индикатор загрузки
    mediaDisplay.innerHTML = '<div class="media-loading">Загрузка медиа...</div>';
    thumbnailsContainer.innerHTML = '';
    
    // Скрываем empty state и показываем элементы управления
    if (emptyState) emptyState.style.display = 'none';
    if (prevBtn) prevBtn.style.display = 'flex';
    if (nextBtn) nextBtn.style.display = 'flex';
    if (fullscreenBtn) fullscreenBtn.style.display = 'flex';
    
    let currentIndex = 0;
    const mediaElements = [];
    const successfulMedia = [];
    
    // Создаем миниатюры сразу
    mediaData.forEach((media, index) => {
        const thumb = createThumbnail(media, index);
        thumbnailsContainer.appendChild(thumb);
    });
    
    // Загружаем медиа с ограничением параллелизма
    const MAX_PARALLEL_LOAD = 3;
    for (let i = 0; i < mediaData.length; i += MAX_PARALLEL_LOAD) {
        const chunk = mediaData.slice(i, i + MAX_PARALLEL_LOAD);
        const promises = chunk.map((media, index) => 
            createMediaElement(media, i + index)
        );
        
        const results = await Promise.all(promises);
        
        results.forEach((result, idx) => {
            if (result) {
                mediaElements[i + idx] = result;
                successfulMedia.push(result.element);
            }
        });
    }
    
    // Очищаем индикатор загрузки и добавляем успешно загруженные медиа
    mediaDisplay.innerHTML = '';
    successfulMedia.forEach(element => {
        mediaDisplay.appendChild(element);
    });
    
    // Если ни один медиафайл не загрузился, показываем сообщение
    if (successfulMedia.length === 0) {
        mediaDisplay.innerHTML = '<div class="media-error">Не удалось загрузить медиафайлы</div>';
        if (emptyState) emptyState.style.display = 'flex';
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (fullscreenBtn) fullscreenBtn.style.display = 'none';
        return;
    }
    
    // Функция для отображения медиа
    function showMedia(index) {
        const mediaItems = mediaDisplay.querySelectorAll('.media-item');
        const thumbnails = thumbnailsContainer.querySelectorAll('.thumbnail');
        
        mediaItems.forEach(item => item.classList.remove('active'));
        thumbnails.forEach(thumb => thumb.classList.remove('active'));
        
        if (mediaItems[index]) {
            mediaItems[index].classList.add('active');
            thumbnails[index].classList.add('active');
            currentIndex = index;
            
            // Если это видео, добавляем обработчик клика для воспроизведения
            if (mediaElements[index] && mediaElements[index].type === 'video') {
                const video = mediaItems[index].querySelector('video');
                const overlay = mediaItems[index].querySelector('.video-overlay');
                
                if (video && overlay) {
                    const playHandler = () => {
                        video.play();
                        overlay.style.display = 'none';
                        video.setAttribute('controls', 'true');
                    };
                    
                    overlay.onclick = playHandler;
                    video.onclick = () => {
                        if (video.paused) {
                            video.play();
                            overlay.style.display = 'none';
                        } else {
                            video.pause();
                            overlay.style.display = 'flex';
                        }
                    };
                }
            }
        }
    }
    
    // Обработчики навигации
    if (prevBtn) {
        prevBtn.onclick = () => {
            let newIndex = currentIndex - 1;
            if (newIndex < 0) newIndex = successfulMedia.length - 1;
            showMedia(newIndex);
        };
    }
    
    if (nextBtn) {
        nextBtn.onclick = () => {
            let newIndex = currentIndex + 1;
            if (newIndex >= successfulMedia.length) newIndex = 0;
            showMedia(newIndex);
        };
    }
    
    if (fullscreenBtn) {
        fullscreenBtn.onclick = () => {
            const activeMedia = mediaDisplay.querySelector('.media-item.active');
            if (activeMedia) {
                if (activeMedia.requestFullscreen) {
                    activeMedia.requestFullscreen();
                } else if (activeMedia.webkitRequestFullscreen) {
                    activeMedia.webkitRequestFullscreen();
                } else if (activeMedia.msRequestFullscreen) {
                    activeMedia.msRequestFullscreen();
                }
            }
        };
    }
    
    // Показываем первый элемент
    showMedia(0);
}