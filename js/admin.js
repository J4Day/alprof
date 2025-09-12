class AdminPanelManager {
    constructor() {
        this.services = [];
        this.products = [];
        this.filteredProducts = [];
        this.contacts = {};
        this.partners = [];
        this.currentTab = 'services';
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Setup auth state listener
        firebaseManager.onAuthStateChanged((user) => {
            this.handleAuthStateChange(user);
        });

        this.setupEventListeners();
        this.setupTabs();
        lucide.createIcons();
    }

    handleAuthStateChange(user) {
        this.currentUser = user;
        if (user) {
            this.showMainContent();
            this.updateUserInfo(user);
            this.checkFirebaseConnection();
            this.loadData();
        } else {
            this.showLoginScreen();
        }
    }

    showLoginScreen() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('main-content').style.display = 'none';
        document.querySelector('header').style.display = 'none';
    }

    showMainContent() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        document.querySelector('header').style.display = 'block';
    }

    updateUserInfo(user) {
        const userInfoEl = document.getElementById('user-info');
        userInfoEl.textContent = `Добро пожаловать, ${user.email}`;
    }

    async checkFirebaseConnection() {
        try {
            // Test connection by trying to read from database
            await firebaseManager.getServices();
            this.updateConnectionStatus('connected', 'Подключено');

            // Initialize default data if needed
            await firebaseManager.initializeDefaultData();
        } catch (error) {
            console.error('Firebase connection failed:', error);
            this.updateConnectionStatus('error', 'Ошибка подключения');
            this.showError('Не удалось подключиться к базе данных. Проверьте конфигурацию Firebase.');
        }
    }

    updateConnectionStatus(status, text) {
        const statusElement = document.getElementById('connection-status');
        const dot = statusElement.querySelector('.w-2');
        const textElement = statusElement.querySelector('span');

        dot.className = 'w-2 h-2 rounded-full';
        switch (status) {
            case 'connected':
                dot.classList.add('bg-green-400');
                break;
            case 'error':
                dot.classList.add('bg-red-400');
                break;
            default:
                dot.classList.add('bg-yellow-400');
        }

        textElement.textContent = text;
    }

    async loadData() {
        try {
            this.showLoading(true);

            // Load services, products and partners simultaneously
            const [services, products, partners] = await Promise.all([
                firebaseManager.getServices(),
                firebaseManager.getProducts(),
                firebaseManager.getPartners()
            ]);

            this.services = services;
            this.products = products;
            this.partners = partners;
            this.filteredProducts = [...this.products];

            // Render everything after all are loaded
            this.renderServices();
            this.renderProducts();
            this.renderPartners();
            this.populateCategoryFilter();

            // Load contacts
            await this.loadContactsData();

            this.showLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Ошибка загрузки данных из базы');
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (show && !loadingOverlay) {
            const overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            overlay.innerHTML = `
                <div class="bg-white rounded-lg p-6 flex items-center space-x-3">
                    <div class="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span class="text-gray-700">Загрузка...</span>
                </div>
            `;
            document.body.appendChild(overlay);
        } else if (!show && loadingOverlay) {
            loadingOverlay.remove();
        }
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all tabs
                tabButtons.forEach(btn => {
                    btn.classList.remove('active', 'border-orange-500', 'text-orange-600');
                    btn.classList.add('border-transparent', 'text-gray-500');
                });

                // Add active class to clicked tab
                button.classList.remove('border-transparent', 'text-gray-500');
                button.classList.add('active', 'border-orange-500', 'text-orange-600');

                // Show/hide content
                const tabContents = document.querySelectorAll('.tab-content');
                tabContents.forEach(content => content.classList.add('hidden'));

                if (button.id === 'services-tab') {
                    document.getElementById('services-section').classList.remove('hidden');
                    this.currentTab = 'services';
                } else if (button.id === 'products-tab') {
                    document.getElementById('products-section').classList.remove('hidden');
                    this.currentTab = 'products';
                } else if (button.id === 'contacts-tab') {
                    document.getElementById('contacts-section').classList.remove('hidden');
                    this.currentTab = 'contacts';
                } else if (button.id === 'partners-tab') {
                    document.getElementById('partners-section').classList.remove('hidden');
                    this.currentTab = 'partners';
                }
            });
        });

        // Set initial active tab
        document.getElementById('services-tab').click();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin(e);
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', async () => {
            await this.handleLogout();
        });

        // Refresh button
        document.getElementById('refresh-data').addEventListener('click', () => {
            this.loadData();
        });

        // Add service button
        document.getElementById('add-service-btn').addEventListener('click', () => {
            this.showServiceModal();
        });

        // Add product button
        document.getElementById('add-product-btn').addEventListener('click', () => {
            this.showProductModal();
        });

        // Add partner button
        document.getElementById('add-partner-btn').addEventListener('click', () => {
            this.showPartnerModal();
        });

        // Contacts form
        document.getElementById('contacts-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleContactsSave(e);
        });

        // Reset contacts button
        document.getElementById('reset-contacts').addEventListener('click', () => {
            this.loadContactsData();
        });

        // Category filter
        document.getElementById('category-filter').addEventListener('change', (e) => {
            this.filterProducts(e.target.value);
        });
    }

    async handleLogin(e) {
        const email = e.target.email.value;
        const password = e.target.password.value;
        const loginBtn = document.getElementById('login-btn-text');
        const loginLoading = document.getElementById('login-loading');
        const loginError = document.getElementById('login-error');

        try {
            loginBtn.style.display = 'none';
            loginLoading.classList.remove('hidden');
            loginError.classList.add('hidden');

            await firebaseManager.signInWithEmail(email, password);
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = this.getAuthErrorMessage(error.code);
            loginError.classList.remove('hidden');
        } finally {
            loginBtn.style.display = 'inline';
            loginLoading.classList.add('hidden');
        }
    }

    async handleLogout() {
        try {
            await firebaseManager.signOut();
        } catch (error) {
            console.error('Logout error:', error);
            this.showError('Ошибка при выходе из системы');
        }
    }

    getAuthErrorMessage(errorCode) {
        switch (errorCode) {
            case 'auth/user-not-found':
                return 'Пользователь не найден';
            case 'auth/wrong-password':
                return 'Неверный пароль';
            case 'auth/invalid-email':
                return 'Неверный формат email';
            case 'auth/too-many-requests':
                return 'Слишком много попыток входа. Попробуйте позже';
            default:
                return 'Ошибка авторизации. Проверьте данные и попробуйте снова';
        }
    }

    renderServices() {
        const container = document.getElementById('services-list');

        if (this.services.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i data-lucide="package" class="w-12 h-12 mx-auto mb-4 text-gray-300"></i>
                    <p>Категории не найдены</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.services.map(service => {
            const productCount = this.products.filter(p => p.categoryId === service.id).length;
            return `
                <div class="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors duration-200">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <img src="${service.image}" alt="${service.name}" class="w-16 h-16 object-cover rounded-lg" onerror="this.src='https://via.placeholder.com/64x64?text=No+Image'">
                            <div>
                                <h3 class="font-semibold text-gray-900">${service.name}</h3>
                                <p class="text-sm text-gray-600 mt-1">${service.description}</p>
                                <span class="text-xs text-gray-500" data-product-count="${service.id}">Товаров: ${productCount}</span>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="adminManager.editService('${service.id}')" class="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                                <i data-lucide="edit" class="w-4 h-4"></i>
                            </button>
                            <button onclick="adminManager.deleteService('${service.id}')" class="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        lucide.createIcons();
    }

    updateProductCounts() {
        this.services.forEach(service => {
            const countElement = document.querySelector(`[data-product-count="${service.id}"]`);
            if (countElement) {
                const productCount = this.products.filter(p => p.categoryId === service.id).length;
                countElement.textContent = `Товаров: ${productCount}`;
            }
        });
    }

    renderProducts() {
        const container = document.getElementById('products-list');

        if (this.filteredProducts.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i data-lucide="box" class="w-12 h-12 mx-auto mb-4 text-gray-300"></i>
                    <p>Товары не найдены</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredProducts.map(product => `
            <div class="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors duration-200">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <img src="${product.image}" alt="${product.name}" class="w-16 h-16 object-cover rounded-lg" onerror="this.src='https://via.placeholder.com/64x64?text=No+Image'">
                        <div class="flex-1">
                            <h3 class="font-semibold text-gray-900">${product.shortName || product.name}</h3>
                            <p class="text-sm text-gray-600 mt-1">${product.description}</p>
                            <div class="flex items-center space-x-4 mt-2">
                                <span class="text-sm text-orange-600 font-medium">${product.price}</span>
                                <span class="text-xs text-gray-500">Категория: ${product.categoryName}</span>
                                <span class="text-xs ${product.inStock ? 'text-green-600' : 'text-red-600'}">${product.inStock ? 'В наличии' : 'Нет в наличии'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="adminManager.editProduct('${product.id}')" class="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                        <button onclick="adminManager.deleteProduct('${product.id}')" class="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        lucide.createIcons();
    }

    populateCategoryFilter() {
        const select = document.getElementById('category-filter');
        const currentValue = select.value;

        select.innerHTML = '<option value="">Все категории</option>' +
            this.services.map(service => `<option value="${service.id}">${service.name}</option>`).join('');

        select.value = currentValue;
    }

    filterProducts(categoryId) {
        if (categoryId) {
            this.filteredProducts = this.products.filter(product => product.categoryId === categoryId);
        } else {
            this.filteredProducts = [...this.products];
        }
        this.renderProducts();
    }

    showServiceModal(service = null) {
        const isEdit = !!service;
        this.showModal(`
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">${isEdit ? 'Редактировать категорию' : 'Добавить категорию'}</h3>
                    <button onclick="this.closest('.modal-overlay').remove()" class="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <form id="service-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Название</label>
                        <input type="text" name="name" value="${service ? service.name : ''}" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Изображение</label>
                        <div class="space-y-3">
                            <div class="flex space-x-3">
                                <input type="file" name="imageFile" accept="image/*" 
                                       class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                       onchange="adminManager.previewImage(this, 'service-preview')">
                                <button type="button" onclick="document.querySelector('input[name=imageFile]').value=''; document.getElementById('service-preview').src=''" 
                                        class="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200">
                                    Очистить
                                </button>
                            </div>
                            <div class="text-sm text-gray-500">Или введите URL изображения:</div>
                            <input type="text" name="imageUrl" value="${service ? service.image : ''}" 
                                   placeholder="https://example.com/image.jpg"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                   onchange="document.getElementById('service-preview').src=this.value">
                            <div class="mt-2">
                                <img id="service-preview" src="${service ? service.image : ''}" alt="Preview" 
                                     class="max-w-full h-32 object-cover rounded-lg ${service ? '' : 'hidden'}" 
                                     onload="this.classList.remove('hidden')" onerror="this.classList.add('hidden')">
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                        <textarea name="description" required rows="3"
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">${service ? service.description : ''}</textarea>
                    </div>
                    <div class="flex space-x-3 pt-4">
                        <button type="submit" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2">
                            <span id="service-submit-text">${isEdit ? 'Сохранить' : 'Добавить'}</span>
                            <div id="service-submit-loading" class="hidden animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        </button>
                        <button type="button" onclick="this.closest('.modal-overlay').remove()" 
                                class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200">
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        `, () => {
            document.getElementById('service-form').onsubmit = async (e) => {
                e.preventDefault();
                await this.handleServiceSubmit(e, service);
            };
        });
    }

    previewImage(input, previewId) {
        if (input.files && input.files[0]) {
            const file = input.files[0];

            // Use image uploader's preview method
            imageUploader.createPreview(file, previewId);

            // Show upload method info
            const uploadInfo = imageUploader.getUploadInfo(file.size);
            const infoElement = input.parentElement.parentElement.querySelector('.upload-info');

            if (infoElement) {
                infoElement.innerHTML = `
                    <div class="text-xs text-${uploadInfo.color}-600 mt-1 flex items-center space-x-1">
                        <i data-lucide="info" class="w-3 h-3"></i>
                        <span>Метод загрузки: <strong>${uploadInfo.method}</strong> - ${uploadInfo.message}</span>
                    </div>
                `;
                lucide.createIcons();
            }
        }
    }

    showProductModal(product = null) {
        const isEdit = !!product;
        this.showModal(`
            <div class="p-6 max-h-[80vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">${isEdit ? 'Редактировать товар' : 'Добавить товар'}</h3>
                    <button onclick="this.closest('.modal-overlay').remove()" class="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <form id="product-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                        <select name="categoryId" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                            <option value="">Выберите категорию</option>
                            ${this.services.map(service => `
                                <option value="${service.id}" ${product && product.categoryId === service.id ? 'selected' : ''}>
                                    ${service.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Название товара</label>
                        <input type="text" name="shortName" value="${product ? product.shortName || '' : ''}" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                               placeholder="Стандартная модель">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Цена</label>
                        <input type="text" name="price" value="${product ? product.price : ''}" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                               placeholder="от 15,000 сом">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Изображение</label>
                        <div class="space-y-3">
                            <div class="flex space-x-3">
                                <input type="file" name="imageFile" accept="image/*" 
                                       class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                       onchange="adminManager.previewImage(this, 'product-preview')">
                                <button type="button" onclick="document.querySelector('input[name=imageFile]').value=''; document.getElementById('product-preview').src=''" 
                                        class="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200">
                                    Очистить
                                </button>
                            </div>
                            <div class="text-sm text-gray-500">Или введите URL изображения:</div>
                            <input type="text" name="imageUrl" value="${product ? product.image : ''}" 
                                   placeholder="https://example.com/image.jpg"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                   onchange="document.getElementById('product-preview').src=this.value">
                            <div class="mt-2">
                                <img id="product-preview" src="${product ? product.image : ''}" alt="Preview" 
                                     class="max-w-full h-32 object-cover rounded-lg ${product ? '' : 'hidden'}" 
                                     onload="this.classList.remove('hidden')" onerror="this.classList.add('hidden')">
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                        <textarea name="description" required rows="3"
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">${product ? product.description : ''}</textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Особенности (по одной на строке)</label>
                        <textarea name="features" rows="3"
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  placeholder="Двойное остекление&#10;Стандартная фурнитура&#10;Белый цвет">${product && product.features ? product.features.join('\n') : ''}</textarea>
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" name="inStock" id="inStock" ${product && product.inStock !== false ? 'checked' : 'checked'}
                               class="rounded border-gray-300 text-orange-600 focus:ring-orange-500">
                        <label for="inStock" class="ml-2 text-sm text-gray-700">В наличии</label>
                    </div>
                    <div class="flex space-x-3 pt-4">
                        <button type="submit" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2">
                            <span id="product-submit-text">${isEdit ? 'Сохранить' : 'Добавить'}</span>
                            <div id="product-submit-loading" class="hidden animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        </button>
                        <button type="button" onclick="this.closest('.modal-overlay').remove()" 
                                class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200">
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        `, () => {
            document.getElementById('product-form').onsubmit = async (e) => {
                e.preventDefault();
                await this.handleProductSubmit(e, product);
            };
        });
    }

    async handleServiceSubmit(e, existingService) {
        const formData = new FormData(e.target);
        const submitBtn = document.getElementById('service-submit-text');
        const submitLoading = document.getElementById('service-submit-loading');

        try {
            submitBtn.style.display = 'none';
            submitLoading.classList.remove('hidden');

            let imageUrl = formData.get('imageUrl');
            const imageFile = formData.get('imageFile');

            // Upload new image if file is selected
            if (imageFile && imageFile.size > 0) {
                try {
                    imageUrl = await imageUploader.uploadImage(imageFile);
                    console.log('Image uploaded successfully:', imageUrl.substring(0, 50) + '...');
                } catch (uploadError) {
                    console.error('Error uploading image:', uploadError);
                    throw new Error('Ошибка при загрузке изображения: ' + uploadError.message);
                }
            }

            // Validate image URL
            if (!imageUrl) {
                throw new Error('Необходимо выбрать изображение или указать URL');
            }

            const serviceData = {
                name: formData.get('name'),
                image: imageUrl,
                description: formData.get('description')
            };

            if (existingService) {
                await firebaseManager.updateService(existingService.id, serviceData);
                this.showSuccess('Категория успешно обновлена');
            } else {
                await firebaseManager.addService(serviceData);
                this.showSuccess('Категория успешно добавлена');
            }

            await this.loadData();
            document.querySelector('.modal-overlay').remove();

        } catch (error) {
            console.error('Error saving service:', error);
            this.showError(error.message || 'Ошибка при сохранении категории');
        } finally {
            submitBtn.style.display = 'inline';
            submitLoading.classList.add('hidden');
        }
    }

    async handleProductSubmit(e, existingProduct) {
        const formData = new FormData(e.target);
        const categoryId = formData.get('categoryId');
        const category = this.services.find(s => s.id === categoryId);
        const submitBtn = document.getElementById('product-submit-text');
        const submitLoading = document.getElementById('product-submit-loading');

        try {
            submitBtn.style.display = 'none';
            submitLoading.classList.remove('hidden');

            let imageUrl = formData.get('imageUrl');
            const imageFile = formData.get('imageFile');

            // Upload new image if file is selected
            if (imageFile && imageFile.size > 0) {
                try {
                    imageUrl = await imageUploader.uploadImage(imageFile);
                    console.log('Product image uploaded successfully');
                } catch (uploadError) {
                    console.error('Error uploading image:', uploadError);
                    throw new Error('Ошибка при загрузке изображения: ' + uploadError.message);
                }
            }

            const productData = {
                categoryId: categoryId,
                categoryName: category.name,
                shortName: formData.get('shortName'),
                name: `${category.name} - ${formData.get('shortName')}`,
                price: formData.get('price'),
                image: imageUrl,
                description: formData.get('description'),
                features: formData.get('features').split('\n').filter(f => f.trim()),
                inStock: formData.has('inStock')
            };

            if (existingProduct) {
                const updatedProduct = await firebaseManager.updateProduct(existingProduct.id, productData);
                // Update local data
                const index = this.products.findIndex(p => p.id === existingProduct.id);
                if (index !== -1) {
                    this.products[index] = updatedProduct;
                    this.filteredProducts = [...this.products];
                }
                this.showSuccess('Товар успешно обновлен');
            } else {
                const newProduct = await firebaseManager.addProduct(productData);
                // Add to local data
                this.products.push(newProduct);
                this.filteredProducts = [...this.products];
                this.showSuccess('Товар успешно добавлен');
            }

            // Re-render only what's needed
            this.renderProducts();
            this.updateProductCounts();
            this.populateCategoryFilter();
            document.querySelector('.modal-overlay').remove();

        } catch (error) {
            console.error('Error saving product:', error);
            this.showError(error.message || 'Ошибка при сохранении товара');
        } finally {
            submitBtn.style.display = 'inline';
            submitLoading.classList.add('hidden');
        }
    }

    async editService(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        if (service) {
            this.showServiceModal(service);
        }
    }

    async editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.showProductModal(product);
        }
    }

    async deleteService(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        const productCount = this.products.filter(p => p.categoryId === serviceId).length;

        const confirmMessage = productCount > 0
            ? `Вы уверены, что хотите удалить категорию "${service.name}"? Это также удалит ${productCount} товаров в этой категории.`
            : `Вы уверены, что хотите удалить категорию "${service.name}"?`;

        if (confirm(confirmMessage)) {
            try {
                this.showLoading(true);
                await firebaseManager.deleteService(serviceId);
                this.showSuccess('Категория успешно удалена');
                await this.loadData();
            } catch (error) {
                console.error('Error deleting service:', error);
                this.showError('Ошибка при удалении категории');
            } finally {
                this.showLoading(false);
            }
        }
    }

    async deleteProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (confirm(`Вы уверены, что хотите удалить товар "${product.shortName || product.name}"?`)) {
            try {
                this.showLoading(true);
                await firebaseManager.deleteProduct(productId);

                // Remove from local data
                this.products = this.products.filter(p => p.id !== productId);
                this.filteredProducts = this.filteredProducts.filter(p => p.id !== productId);

                // Re-render only what's needed
                this.renderProducts();
                this.updateProductCounts();
                this.populateCategoryFilter();

                this.showSuccess('Товар успешно удален');
            } catch (error) {
                console.error('Error deleting product:', error);
                this.showError('Ошибка при удалении товара');
            } finally {
                this.showLoading(false);
            }
        }
    }

    showModal(content, callback = null) {
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                ${content}
            </div>
        `;

        document.body.appendChild(modal);

        if (callback) callback();

        // Remove the click outside to close functionality
        // modal.addEventListener('click', (e) => {
        //     if (e.target === modal) modal.remove();
        // });
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-white text-sm transition-all duration-300 transform translate-x-full`;

        switch (type) {
            case 'success':
                notification.classList.add('bg-green-600');
                break;
            case 'error':
                notification.classList.add('bg-red-600');
                break;
            default:
                notification.classList.add('bg-blue-600');
        }

        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.remove('translate-x-full'), 100);

        // Animate out and remove
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Contacts management methods
    async loadContactsData() {
        try {
            const contactsData = await firebaseManager.getContacts();
            this.contacts = contactsData || {
                phone: '+996 (555) 555-555',
                email: 'info@bishtrade.kz',
                address: 'г. Бишкек, ул. Примерная, 123',
                hours: 'Пн-Пт: 9:00-18:00, Сб: 10:00-16:00'
            };

            // Fill form with current data
            document.getElementById('contact-phone').value = this.contacts.phone || '';
            document.getElementById('contact-email').value = this.contacts.email || '';
            document.getElementById('contact-address').value = this.contacts.address || '';
            document.getElementById('contact-hours').value = this.contacts.hours || '';

        } catch (error) {
            console.error('Error loading contacts:', error);
            this.showNotification('Ошибка загрузки контактных данных', 'error');
        }
    }

    async handleContactsSave(e) {
        const formData = new FormData(e.target);
        const contactsData = {
            phone: document.getElementById('contact-phone').value.trim(),
            email: document.getElementById('contact-email').value.trim(),
            address: document.getElementById('contact-address').value.trim(),
            hours: document.getElementById('contact-hours').value.trim()
        };

        // Validate required fields
        if (!contactsData.phone || !contactsData.email || !contactsData.address || !contactsData.hours) {
            this.showNotification('Пожалуйста, заполните все поля', 'error');
            return;
        }

        // Check if user is authenticated
        if (!this.currentUser) {
            this.showNotification('Необходимо войти в систему для сохранения данных', 'error');
            return;
        }

        try {
            await firebaseManager.saveContacts(contactsData);
            this.contacts = contactsData;
            this.showNotification('Контактные данные успешно сохранены', 'success');
        } catch (error) {
            console.error('Error saving contacts:', error);
            if (error.code === 'permission-denied') {
                this.showNotification('Недостаточно прав для сохранения данных. Проверьте настройки Firestore Rules.', 'error');
            } else {
                this.showNotification('Ошибка сохранения контактных данных', 'error');
            }
        }
    }

    // Partners management methods
    renderPartners() {
        const container = document.getElementById('partners-list');

        if (this.partners.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i data-lucide="handshake" class="w-12 h-12 mx-auto mb-4 text-gray-300"></i>
                    <p>Партнеры не найдены</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.partners.map(partner => `
            <div class="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors duration-200">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <img src="${partner.logo}" alt="${partner.name}" class="w-16 h-16 object-contain rounded-lg" onerror="this.src='https://via.placeholder.com/64x64?text=No+Logo'">
                        <div>
                            <h3 class="font-semibold text-gray-900">${partner.name}</h3>
                            <p class="text-sm text-gray-600 mt-1">${partner.description || 'Наш партнер'}</p>
                            <span class="text-xs text-gray-500">Порядок: ${partner.order || 0}</span>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="adminManager.editPartner('${partner.id}')" class="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                        <button onclick="adminManager.deletePartner('${partner.id}')" class="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        lucide.createIcons();
    }

    showPartnerModal(partner = null) {
        const isEdit = !!partner;
        this.showModal(`
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">${isEdit ? 'Редактировать партнера' : 'Добавить партнера'}</h3>
                    <button onclick="this.closest('.modal-overlay').remove()" class="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <form id="partner-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Название партнера</label>
                        <input type="text" name="name" value="${partner ? partner.name : ''}" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Логотип</label>
                        <div class="space-y-3">
                            <div class="flex space-x-3">
                                <input type="file" name="logoFile" accept="image/*" 
                                       class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                       onchange="adminManager.previewImage(this, 'partner-preview')">
                                <button type="button" onclick="document.querySelector('input[name=logoFile]').value=''; document.getElementById('partner-preview').src=''" 
                                        class="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200">
                                    Очистить
                                </button>
                            </div>
                            <div class="text-sm text-gray-500">Или введите URL логотипа:</div>
                            <input type="text" name="logoUrl" value="${partner ? partner.logo : ''}" 
                                   placeholder="https://example.com/logo.jpg"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                   onchange="document.getElementById('partner-preview').src=this.value">
                            <div class="mt-2">
                                <img id="partner-preview" src="${partner ? partner.logo : ''}" alt="Preview" 
                                     class="max-w-full h-24 object-contain rounded-lg ${partner ? '' : 'hidden'}" 
                                     onload="this.classList.remove('hidden')" onerror="this.classList.add('hidden')">
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Описание (необязательно)</label>
                        <input type="text" name="description" value="${partner ? partner.description || '' : ''}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                               placeholder="Краткое описание партнера">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Порядок отображения</label>
                        <input type="number" name="order" value="${partner ? partner.order || 0 : 0}" min="0"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                    </div>
                    
                    <div class="flex space-x-3 pt-4">
                        <button type="submit" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2">
                            <span id="partner-submit-text">${isEdit ? 'Сохранить' : 'Добавить'}</span>
                            <div id="partner-submit-loading" class="hidden animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        </button>
                        <button type="button" onclick="this.closest('.modal-overlay').remove()" 
                                class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200">
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        `, () => {
            document.getElementById('partner-form').onsubmit = async (e) => {
                e.preventDefault();
                await this.handlePartnerSubmit(e, partner);
            };
        });
    }

    async handlePartnerSubmit(e, existingPartner) {
        const formData = new FormData(e.target);
        const submitBtn = document.getElementById('partner-submit-text');
        const submitLoading = document.getElementById('partner-submit-loading');

        try {
            submitBtn.style.display = 'none';
            submitLoading.classList.remove('hidden');

            let logoUrl = formData.get('logoUrl');
            const logoFile = formData.get('logoFile');

            // Upload new logo if file is selected
            if (logoFile && logoFile.size > 0) {
                try {
                    logoUrl = await imageUploader.uploadImage(logoFile);
                    console.log('Partner logo uploaded successfully');
                } catch (uploadError) {
                    console.error('Error uploading logo:', uploadError);
                    throw new Error('Ошибка при загрузке логотипа: ' + uploadError.message);
                }
            }

            // Validate logo URL
            if (!logoUrl) {
                throw new Error('Необходимо выбрать логотип или указать URL');
            }

            const partnerData = {
                name: formData.get('name'),
                logo: logoUrl,
                description: formData.get('description') || '',
                order: parseInt(formData.get('order')) || 0
            };

            if (existingPartner) {
                await firebaseManager.updatePartner(existingPartner.id, partnerData);
                this.showSuccess('Партнер успешно обновлен');
            } else {
                await firebaseManager.addPartner(partnerData);
                this.showSuccess('Партнер успешно добавлен');
            }

            await this.loadData();
            document.querySelector('.modal-overlay').remove();

        } catch (error) {
            console.error('Error saving partner:', error);
            this.showError(error.message || 'Ошибка при сохранении партнера');
        } finally {
            submitBtn.style.display = 'inline';
            submitLoading.classList.add('hidden');
        }
    }

    async editPartner(partnerId) {
        const partner = this.partners.find(p => p.id === partnerId);
        if (partner) {
            this.showPartnerModal(partner);
        }
    }

    async deletePartner(partnerId) {
        const partner = this.partners.find(p => p.id === partnerId);
        if (confirm(`Вы уверены, что хотите удалить партнера "${partner.name}"?`)) {
            try {
                this.showLoading(true);
                await firebaseManager.deletePartner(partnerId);
                this.showSuccess('Партнер успешно удален');
                await this.loadData();
            } catch (error) {
                console.error('Error deleting partner:', error);
                this.showError('Ошибка при удалении партнера');
            } finally {
                this.showLoading(false);
            }
        }
    }
}

// Initialize admin panel
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.adminManager = new AdminPanelManager();
    });
}