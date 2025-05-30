const postForm = document.getElementById("post-form");
const blogPostsContainer = document.getElementById("blog-posts");
const imageInput = document.getElementById("post-image");
const imagePreviewContainer = document.getElementById("image-preview-container");
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('header nav a');

// Элементы админки
const adminLink = document.getElementById('admin-link');
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const loginButton = document.getElementById('login-button');
const passwordInput = document.getElementById('password-input');
const logoutButton = document.getElementById('logout-button');

//role
const roleSelection = document.getElementById("role-selection");
const adminLoginForm = document.getElementById("admin-login-form");
const userButton = document.getElementById("user-button");
const adminButton = document.getElementById("admin-button");
const adminLoginButton = document.getElementById("admin-login-button");
const mainContent = document.querySelector("main");
const header = document.querySelector("header");
const footer = document.querySelector("footer");

// Пароль (не для продакшена!)
const correctPassword = "31415";
let isAdmin = false;

// Функция для получения постов из localStorage
function getPostsFromLocalStorage() {
    const posts = localStorage.getItem("blogPosts");
    return posts ? JSON.parse(posts) : [];
}

// Функция для сохранения постов в localStorage
function savePostsToLocalStorage(posts) {
    localStorage.setItem("blogPosts", JSON.stringify(posts));
}

// Функция для отображения постов
function displayPosts() {
    blogPostsContainer.innerHTML = "";
    const posts = getPostsFromLocalStorage();

    // Сортируем по дате (самые новые сверху)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    blogPostsContainer.classList.add("post-centered");

    posts.forEach((post, index) => {
        const article = createArticleElement(post, index, false); // false - не админка
        blogPostsContainer.appendChild(article);
    });
}

// Функция для удаления поста (теперь только для админки)
function deletePost(index) {
    if (!isAdmin) {
        alert("У вас нет прав для удаления постов.");
        return;
    }
    let posts = getPostsFromLocalStorage();
    posts.splice(index, 1);
    savePostsToLocalStorage(posts);
    displayAdminPanel(); // Обновляем админ панель
    displayPosts();
}

// Функция для отображения постов в админке
function displayAdminPanel() {
    adminPanel.innerHTML = "";

    const posts = getPostsFromLocalStorage();

    posts.forEach((post, index) => {
        const article = createArticleElement(post, index, true); // true - админка
        adminPanel.appendChild(article);
    });
}

// Функция для создания элемента поста
function createArticleElement(post, index, isAdminPanel) {
    const article = document.createElement("article");
    article.classList.add("post");

    const h2 = document.createElement("h2");
    h2.textContent = post.title;
    article.appendChild(h2);

    const meta = document.createElement("p");
    meta.classList.add("post-meta");
    meta.textContent = `Опубликовано: ${post.date}`;
    article.appendChild(meta);

    if (post.imageUrls && post.imageUrls.length > 0) {
        const imageGallery = document.createElement("div");
        imageGallery.classList.add("image-gallery");
        post.imageUrls.forEach(imageUrl => {
            const img = document.createElement("img");
            img.src = imageUrl;
            img.alt = post.title;
            imageGallery.appendChild(img);
        });
        article.appendChild(imageGallery);
    }

    const content = document.createElement("p");
    content.textContent = post.content;
    article.appendChild(content);

    if (isAdminPanel && isAdmin) {
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Удалить";
        deleteButton.addEventListener("click", () => deletePost(index));
        article.appendChild(deleteButton);
    }

    return article;
}

// Предварительный просмотр изображений
imageInput.addEventListener("change", function() {
    imagePreviewContainer.innerHTML = "";
    const files = this.files;
    if (files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.addEventListener("load", function() {
                const imgContainer = document.createElement("div");
                imgContainer.style.position = "relative";
                const img = document.createElement("img");
                img.setAttribute("src", this.result);
                img.setAttribute("alt", file.name);
                imgContainer.appendChild(img);

                const removeButton = document.createElement("button");
                removeButton.classList.add("remove-image-button");
                removeButton.textContent = "×";
                removeButton.addEventListener("click", function() {
                    imgContainer.remove();
                });

                imgContainer.appendChild(removeButton);
                imagePreviewContainer.appendChild(imgContainer);
            });
            reader.readAsDataURL(file);
        }
    }
});

// Обработка отправки формы
postForm.addEventListener("submit", function(event) {
    event.preventDefault();
    const title = document.getElementById("post-title").value;
    const content = document.getElementById("post-content").value;
    const imageFiles = document.getElementById("post-image").files;
    const imageUrls = [];

    // Добавляем URL изображений
    const previewImages = imagePreviewContainer.querySelectorAll("img");
    previewImages.forEach(img => {
        imageUrls.push(img.src);
    });

    if (imageFiles && imageFiles.length > 0) {
        const promises = [];
        for (let i = 0; i < imageFiles.length; i++) { // Fixed loop condition
            const file = imageFiles[i];
            const reader = new FileReader();
            const promise = new Promise((resolve, reject) => {
                reader.onload = function(e) {
                    imageUrls.push(e.target.result);
                    resolve();
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            promises.push(promise);
        }
        Promise.all(promises)
            .then(() => {
                saveNewPost(title, content, imageUrls);
            })
            .catch(error => {
                console.error("Ошибка загрузки изображений:", error);
            });
    } else {
        saveNewPost(title, content, imageUrls);
    }
});

// Функция сохранения нового поста
function saveNewPost(title, content, imageUrls) {
    const newPost = {
        title: title,
        content: content,
        date: new Date().toLocaleDateString(),
        imageUrls: imageUrls
    };

    let posts = getPostsFromLocalStorage();
    posts.unshift(newPost); // Добавляем в начало массива
    savePostsToLocalStorage(posts);
    displayPosts();

    document.getElementById("post-title").value = "";
    document.getElementById("post-content").value = "";
    document.getElementById("post-image").value = "";
    imagePreviewContainer.innerHTML = "";

    navigateTo('home');
}

// Функция для навигации между страницами
function navigateTo(pageId) {
    pages.forEach(page => page.classList.remove('active'));
    navLinks.forEach(link => link.classList.remove('active'));

    document.getElementById(pageId).classList.add('active');

    // Добавляем класс 'active' к ссылке навигации
    const link = document.querySelector(`header nav a[href="#${pageId}"]`);
    if (link) {
        link.classList.add('active');
    }

    if (pageId === 'admin' && isAdmin) {
        displayAdminPanel(); // Отображаем админ панель
        adminPanel.style.display = 'block';
    } else {
        loginForm.style.display = 'none';
        adminPanel.style.display = 'none';
    }
}

// Функция для авторизации администратора
function loginAdmin() {
    const password = passwordInput.value;
    if (password === correctPassword) {
        isAdmin = true;
        adminLoginForm.style.display = 'none';
        header.style.display = 'flex';
        mainContent.style.display = 'block';
        footer.style.display = 'block';
        roleSelection.style.display = 'none';
        navigateTo('admin'); // Перенаправляем на админку, чтобы отобразить панель
        adminLink.style.display = 'inline-block'; // показываем ссылку на админку
        displayAdminPanel();
    } else {
        document.getElementById('login-message').textContent = 'Неверный пароль!';
        document.getElementById('login-message').style.color = 'red';
    }
}

// Обработчик выбора роли пользователя
userButton.addEventListener("click", function() {
    header.style.display = 'flex';
    mainContent.style.display = 'block';
    footer.style.display = 'block';
    roleSelection.style.display = 'none';
    navigateTo('home'); // Перенаправляем на главную страницу
    adminLink.style.display = 'none'; // Cкрываем ссылку на админку
});

// Обработчик выбора роли администратора
adminButton.addEventListener("click", function() {
    roleSelection.style.display = 'none';
    adminLoginForm.style.display = 'block';
});

// Обработчик отправки формы входа администратора
adminLoginButton.addEventListener("click", loginAdmin);

// Функция для выхода
function logout() {
    isAdmin = false;
    adminLink.style.display = 'none';
    loginForm.style.display = 'none';
    adminPanel.innerHTML = '';
    adminPanel.style.display = 'none';
    header.style.display = 'none';
    mainContent.style.display = 'none';
    footer.style.display = 'none';
    roleSelection.style.display = 'block';
    navigateTo('home');
}

// Обработчики событий
if (document.getElementById('logout-button')) {
    logoutButton.addEventListener('click', logout);
}

function init() {
    // При загрузке страницы показываем выбор роли
    header.style.display = 'none';
    mainContent.style.display = 'none';
    footer.style.display = 'none';
    adminLink.style.display = 'none';
}

// Обработчик изменения хеша в URL
window.addEventListener('hashchange', function() {
    const pageId = location.hash.slice(1) || 'home';
    navigateTo(pageId);
});

// Загружаем и отображаем посты при загрузке страницы
displayPosts();

init()