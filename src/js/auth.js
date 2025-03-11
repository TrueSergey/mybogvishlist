let supabase; // Глобальная переменная для экземпляра Supabase
let currentUser = null; // Текущий пользователь

// Инициализация Supabase
function initSupabase() {
    const SUPABASE_URL = 'ВАША_SUPABASE_URL';
    const SUPABASE_ANON_KEY = 'ВАШ_ПУБЛИЧНЫЙ_КЛЮЧ';
    
    supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Проверка авторизации пользователя
async function checkUserAuth() {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
        console.error('Ошибка при получении сессии:', error);
        return;
    }
    
    if (data.session) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) {
            console.error('Ошибка при получении пользователя:', userError);
            return;
        }
        
        currentUser = userData.user;
        updateUIForAuthenticatedUser();
    } else {
        updateUIForGuest();
    }
}

// Обновление UI для авторизованного пользователя
function updateUIForAuthenticatedUser() {
    const loginBtn = document.getElementById('login-btn');
    loginBtn.textContent = 'Профиль';
    loginBtn.removeEventListener('click', showAuthForm);
    loginBtn.addEventListener('click', showUserMenu);
    
    // Показать кнопку добавления желаний
    document.getElementById('add-wish-btn').style.display = 'block';
}

// Обновление UI для гостя
function updateUIForGuest() {
    const loginBtn = document.getElementById('login-btn');
    loginBtn.textContent = 'Войти';
    loginBtn.removeEventListener('click', showUserMenu);
    loginBtn.addEventListener('click', showAuthForm);
    
    // Скрыть кнопку добавления желаний
    document.getElementById('add-wish-btn').style.display = 'none';
}

// Показать меню пользователя
function showUserMenu() {
    // Создать выпадающее меню на лету
    const menu = document.createElement('div');
    menu.className = 'user-menu-content';
    menu.innerHTML = `
        <a href="#" id="profile-link">Мой профиль</a>
        <a href="#" id="settings-link">Настройки</a>
        <a href="#" id="logout-link">Выйти</a>
    `;
    
    // Добавить меню в DOM
    const userMenu = document.querySelector('.user-menu') || document.getElementById('login-btn').parentNode;
    userMenu.appendChild(menu);
    
    // Показать меню
    menu.style.display = 'block';
    
    // Обработчик для закрытия меню
    document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target) && e.target !== document.getElementById('login-btn')) {
            menu.style.display = 'none';
            document.removeEventListener('click', closeMenu);
            menu.remove();
        }
    });
    
    // Обработчик для выхода
    document.getElementById('logout-link').addEventListener('click', logout);
}

// Показать форму авторизации
function showAuthForm() {
    // Создаем модальное окно авторизации
    const authModal = document.createElement('div');
    authModal.id = 'auth-modal';
    authModal.className = 'modal';
    authModal.style.display = 'flex';
    
    authModal.innerHTML = `
        <div class="modal-content auth-form">
            <h2>Вход в аккаунт</h2>
            <form id="auth-form">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" required>
                </div>
                <div class="form-group">
                    <label for="password">Пароль</label>
                    <input type="password" id="password" required>
                </div>
                <button type="submit">Войти</button>
            </form>
            <div class="auth-toggle">
                <p>Нет аккаунта? <a href="#" id="register-link">Зарегистрироваться</a></p>
            </div>
        </div>
    `;
    
    document.body.appendChild(authModal);
    
    // Обработчик для закрытия модального окна
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.remove();
        }
    });
    
    // Обработчик для формы авторизации
    document.getElementById('auth-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            alert('Ошибка авторизации: ' + error.message);
            return;
        }
        
        currentUser = data.user;
        updateUIForAuthenticatedUser();
        authModal.remove();
        loadWishlist(); // Загрузить список желаний пользователя
    });
    
    // Обработчик для переключения на регистрацию
    document.getElementById('register-link').addEventListener('click', (e) => {
        e.preventDefault();
        authModal.remove();
        showRegisterForm();
    });
}

// Показать форму регистрации
function showRegisterForm() {
    // Аналогично форме авторизации, но с дополнительными полями и другой логикой
    const registerModal = document.createElement('div');
    registerModal.id = 'register-modal';
    registerModal.className = 'modal';
    registerModal.style.display = 'flex';
    
    registerModal.innerHTML = `
        <div class="modal-content auth-form">
            <h2>Регистрация</h2>
            <form id="register-form">
                <div class="form-group">
                    <label for="name">Имя</label>
                    <input type="text" id="name" required>
                </div>
                <div class="form-group">
                    <label for="reg-email">Email</label>
                    <input type="email" id="reg-email" required>
                </div>
                <div class="form-group">
                    <label for="reg-password">Пароль</label>
                    <input type="password" id="reg-password" required>
                </div>
                <button type="submit">Зарегистрироваться</button>
            </form>
            <div class="auth-toggle">
                <p>Уже есть аккаунт? <a href="#" id="login-link">Войти</a></p>
            </div>
        </div>
    `;
    
    document.body.appendChild(registerModal);
    
    // Обработчик для закрытия модального окна
    registerModal.addEventListener('click', (e) => {
        if (e.target === registerModal) {
            registerModal.remove();
        }
    });
    
    // Обработчик для формы регистрации
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name
                }
            }
        });
        
        if (error) {
            alert('Ошибка регистрации: ' + error.message);
            return;
        }
        
        // Если требуется подтверждение email
        alert('На ваш email отправлено письмо для подтверждения регистрации');
        registerModal.remove();
    });
    
    // Обработчик для переключения на авторизацию
    document.getElementById('login-link').addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.remove();
        showAuthForm();
    });
}

// Выход из аккаунта
async function logout() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
        console.error('Ошибка при выходе:', error);
        return;
    }
    
    currentUser = null;
    updateUIForGuest();
    clearWishlist(); // Очистить список желаний
}