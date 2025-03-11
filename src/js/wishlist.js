let currentWishlist = []; // Текущий список желаний
let wishToDelete = null; // ID желания, которое нужно удалить

// Загрузка списка желаний пользователя
async function loadWishlist() {
    if (!currentUser) {
        clearWishlist();
        return;
    }
    
    const { data, error } = await supabase
        .from('wishes')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Ошибка при загрузке списка желаний:', error);
        return;
    }
    
    currentWishlist = data;
    renderWishlist();
}

// Отображение списка желаний
function renderWishlist() {
    const container = document.getElementById('wishes-container');
    container.innerHTML = '';
    
    if (currentWishlist.length === 0) {
        container.innerHTML = '<p class="empty-message">У вас пока нет желаний. Добавьте первое!</p>';
        return;
    }
    
    currentWishlist.forEach(wish => {
        const wishCard = document.createElement('div');
        wishCard.className = 'wish-card';
        wishCard.innerHTML = `
            <div class="wish-image" style="background-image: url('${wish.image_url || 'placeholder.jpg'}')"></div>
            <div class="wish-content">
                <h3 class="wish-title">${wish.title}</h3>
                <p class="wish-description">${wish.description || ''}</p>
                ${wish.link ? `<a href="${wish.link}" target="_blank" class="wish-link">Перейти к товару</a>` : ''}
                <div class="wish-actions">
                    <button class="edit-btn" data-id="${wish.id}">Изменить</button>
                    <button class="delete-btn" data-id="${wish.id}">Удалить</button>
                </div>
            </div>
        `;
        
        container.appendChild(wishCard);
    });
    
    // Добавляем обработчики для кнопок
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editWish(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => confirmDeleteWish(btn.dataset.id));
    });
}

// Очистка списка желаний
function clearWishlist() {
    document.getElementById('wishes-container').innerHTML = 
        '<p class="empty-message">Войдите, чтобы увидеть ваш список желаний</p>';
}

// Сохранение нового желания
async function saveWish() {
    if (!currentUser) {
        alert('Необходимо войти в аккаунт');
        return;
    }
    
    const title = document.getElementById('wish-title').value;
    const description = document.getElementById('wish-description').value;
    const link = document.getElementById('wish-link').value;
    const imageFile = document.getElementById('wish-image').files[0];
    
    // Проверка на наличие заголовка
    if (!title) {
        alert('Введите название желания');
        return;
    }
    
    let imageUrl = null;
    
    // Если есть изображение, загружаем его в Storage
    if (imageFile) {
        const filePath = `wishes/${currentUser.id}_${Date.now()}_${imageFile.name}`;
        const { data, error } = await supabase.storage
            .from('wish-images')
            .upload(filePath, imageFile);
        
        if (error) {
            console.error('Ошибка при загрузке изображения:', error);
            alert('Не удалось загрузить изображение');
            return;
        }
        
        // Получаем публичную ссылку на изображение
        const { data: urlData } = supabase.storage
            .from('wish-images')
            .getPublicUrl(filePath);
        
        imageUrl = urlData.publicUrl;
    }
    
    // Создаем запись в базе данных
    const { data, error } = await supabase
        .from('wishes')
        .insert([
            {
                user_id: currentUser.id,
                title,
                description,
                link,
                image_url: imageUrl
            }
        ])
        .select();
    
    if (error) {
        console.error('Ошибка при сохранении желания:', error);
        alert('Не удалось сохранить желание');
        return;
    }
    
    // Добавляем новое желание в список и обновляем UI
    currentWishlist.unshift(data[0]);
    renderWishlist();
    
    // Сбрасываем форму и скрываем модальное окно
    document.getElementById('wish-form').reset();
    document.getElementById('image-placeholder').innerHTML = 'Нажмите для загрузки изображения';
    document.getElementById('image-placeholder').style.border = '2px dashed #ddd';
    document.getElementById('image-placeholder').style.background = '#f9f9f9';
    hideModal('add-wish-modal');
}

// Редактирование желания
function editWish(wishId) {
    const wish = currentWishlist.find(w => w.id === wishId);
    if (!wish) return;
    
    // Заполняем форму данными желания
    document.getElementById('wish-title').value = wish.title;
    document.getElementById('wish-description').value = wish.description || '';
    document.getElementById('wish-link').value = wish.link || '';
    
    // Показываем изображение, если есть
    if (wish.image_url) {
        const img = document.createElement('img');
        img.src = wish.image_url;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '180px';
        
        document.getElementById('image-placeholder').innerHTML = '';
        document.getElementById('image-placeholder').style.border = 'none';
        document.getElementById('image-placeholder').style.background = 'none';
        document.getElementById('image-placeholder').appendChild(img);
    }
    
    // Изменяем обработчик отправки формы для обновления
    const wishForm = document.getElementById('wish-form');
    wishForm.removeEventListener('submit', saveWish);
    wishForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('wish-title').value;
        const description = document.getElementById('wish-description').value;
        const link = document.getElementById('wish-link').value;
        const imageFile = document.getElementById('wish-image').files[0];
        
        // Проверка на наличие заголовка
        if (!title) {
            alert('Введите название желания');
            return;
        }
        
        let imageUrl = wish.image_url;
        
        // Если есть новое изображение, загружаем его
        if (imageFile) {
            const filePath = `wishes/${currentUser.id}_${Date.now()}_${imageFile.name}`;
            const { data, error } = await supabase.storage
                .from('wish-images')
                .upload(filePath, imageFile);
            
            if (error) {
                console.error('Ошибка при загрузке изображения:', error);
                alert('Не удалось загрузить изображение');
                return;
            }
            
            // Получаем публичную ссылку на изображение
            const { data: urlData } = supabase.storage
                .from('wish-images')
                .getPublicUrl(filePath);
            
            imageUrl = urlData.publicUrl;
        }
        
        // Обновляем запись в базе данных
        const { data, error } = await supabase
            .from('wishes')
            .update({
                title,
                description,
                link,
                image_url: imageUrl
            })
            .eq('id', wishId)
            .select();
        
        if (error) {
            console.error('Ошибка при обновлении желания:', error);
            alert('Не удалось обновить желание');
            return;
        }
        
        // Обновляем желание в списке и обновляем UI
        const index = currentWishlist.findIndex(w => w.id === wishId);
        if (index !== -1) {
            currentWishlist[index] = data[0];
        }
        renderWishlist();
        
        // Сбрасываем форму и восстанавливаем обработчик
        wishForm.reset();
        document.getElementById('image-placeholder').innerHTML = 'Нажмите для загрузки изображения';
        document.getElementById('image-placeholder').style.border = '2px dashed #ddd';
        document.getElementById('image-placeholder').style.background = '#f9f9f9';
        
        wishForm.removeEventListener('submit', arguments.callee);
        wishForm.addEventListener('submit', saveWish);
        
        hideModal('add-wish-modal');
    });
    
    // Показываем модальное окно
    showModal('add-wish-modal');
}

// Подтверждение удаления желания
function confirmDeleteWish(wishId) {
    wishToDelete = wishId;
    showModal('confirm-modal');
}

// Удаление желания после подтверждения
async function deleteConfirmedWish() {
    if (!wishToDelete) return;
    
    const { error } = await supabase
        .from('wishes')
        .delete()
        .eq('id', wishToDelete);
    
    if (error) {
        console.error('Ошибка при удалении желания:', error);
        alert('Не удалось удалить желание');
        hideModal('confirm-modal');
        return;
    }
    
    // Удаляем желание из списка и обновляем UI
    currentWishlist = currentWishlist.filter(wish => wish.id !== wishToDelete);
    renderWishlist();
    
    wishToDelete = null;
    hideModal('confirm-modal');
}