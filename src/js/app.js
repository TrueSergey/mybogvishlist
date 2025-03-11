// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Supabase
    initSupabase();
    
    // Проверка авторизации пользователя
    checkUserAuth();
    
    // Загрузка списка желаний
    loadWishlist();
    
    // Обработчики событий
    setupEventListeners();
});

function setupEventListeners() {
    // Кнопка добавления желания
    const addWishBtn = document.getElementById('add-wish-btn');
    addWishBtn.addEventListener('click', () => {
        showModal('add-wish-modal');
    });
    
    // Форма добавления желания
    const wishForm = document.getElementById('wish-form');
    wishForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveWish();
    });
    
    // Загрузка изображения
    const imageUpload = document.getElementById('wish-image');
    const imagePlaceholder = document.getElementById('image-placeholder');
    const selectImageBtn = document.getElementById('select-image');
    
    selectImageBtn.addEventListener('click', () => {
        imageUpload.click();
    });
    
    imagePlaceholder.addEventListener('click', () => {
        imageUpload.click();
    });
    
    imageUpload.addEventListener('change', handleImageUpload);
    
    // Обработчики для модальных окон
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modal.id);
            }
        });
    });
    
    // Кнопки отмены и подтверждения удаления
    document.getElementById('cancel-delete').addEventListener('click', () => {
        hideModal('confirm-modal');
    });
    
    document.getElementById('confirm-delete').addEventListener('click', () => {
        deleteConfirmedWish();
    });
    
    // Кнопка авторизации
    document.getElementById('login-btn').addEventListener('click', showAuthForm);
}

// Показать модальное окно
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'flex';
}

// Скрыть модальное окно
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
}

// Обработка загрузки изображения
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            document.getElementById('image-placeholder').innerHTML = '';
            document.getElementById('image-placeholder').style.border = 'none';
            document.getElementById('image-placeholder').style.background = 'none';
            document.getElementById('image-placeholder').appendChild(img);
            img.style.maxWidth = '100%';
            img.style.maxHeight = '180px';
        };
    };
    reader.readAsDataURL(file);
}

// Показать форму авторизации
function showAuthForm() {
    // Реализация будет в auth.js
}