class CatalogPageManager {
    constructor() {
        this.services = [];
        this.products = [];
        this.currentCategory = null;
        this.init();
    }

    async init() {
        await this.loadData();
        await this.loadContacts();
        this.handleURLParams();
        this.setupEventListeners();
        lucide.createIcons();
    }

    async loadContacts() {
        if (window.contactsLoader) {
            try {
                await window.contactsLoader.updateContactsInPage();
            } catch (error) {
                console.log('Could not load contacts from Firebase:', error.message);
            }
        }
    }

    async loadData() {
        try {
            if (window.firebaseManager) {
                this.services = await firebaseManager.getServices();
                this.products = await firebaseManager.getProducts();
            } else {
                this.services = this.getDefaultServices();
                this.products = this.generateProductsForCategories();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.services = this.getDefaultServices();
            this.products = this.generateProductsForCategories();
        }
    }

    getDefaultServices() {
        return [
            { id: '1', name: 'Окна', image: 'images/okna.jpg', description: 'Алюминиевые окна высокого качества для вашего дома' },
            { id: '2', name: 'Панорамные окна', image: 'images/panoram_okna.jpg', description: 'Панорамное остекление для современных зданий' },
            { id: '3', name: 'Раздвижные окна', image: 'images/razdvijnye_okna.jpg', description: 'Практичные раздвижные системы' },
            { id: '4', name: 'Алюминиевые двери', image: 'images/allumin_dveri.jpg', description: 'Надежные алюминиевые двери' },
            { id: '5', name: 'Алюминиевые входные группы', image: 'images/allumin_vhodnye_construksii.png', description: 'Стильные входные конструкции' },
            { id: '6', name: 'Раздвижные двери', image: 'images/razdvijnye_dveri.jpg', description: 'Элегантные раздвижные двери' },
            { id: '7', name: 'Фасадное остекление', image: 'images/fasad_osteklenye.jpg', description: 'Профессиональное фасадное остекление' },
            { id: '8', name: 'Зенитные фонари', image: 'images/zenitnye_fonari.jpg', description: 'Световые фонари для крыш' },
            { id: '9', name: 'Балконы', image: 'images/allumin_balkon.jpg', description: 'Алюминиевые балконные конструкции' },
            { id: '10', name: 'Террасы, веранды, беседки', image: 'images/allumin_terassa.jpg', description: 'Конструкции для отдыха' },
            { id: '11', name: 'Зимние сады', image: 'images/zimnye_sady.jpg', description: 'Остекленные зимние сады' },
            { id: '12', name: 'Алюминиевые перегородки', image: 'images/allumin_peregovornaya.jpg', description: 'Офисные и домашние перегородки' }
        ];
    }

    generateProductsForCategories() {
        const allProducts = [];

        this.services.forEach(service => {
            const serviceProducts = this.generateProductsForService(service);
            allProducts.push(...serviceProducts);
        });

        return allProducts;
    }

    generateProductsForService(service) {
        const baseProducts = [
            {
                name: 'Стандартная модель',
                price: 'от 15,000 сом',
                features: ['Двойное остекление', 'Стандартная фурнитура', 'Белый цвет'],
                inStock: true
            },
            {
                name: 'Премиум модель',
                price: 'от 25,000 сом',
                features: ['Тройное остекление', 'Премиум фурнитура', 'Любой цвет RAL', 'Энергосберегающее стекло'],
                inStock: true
            },
            {
                name: 'Эконом модель',
                price: 'от 10,000 сом',
                features: ['Одинарное остекление', 'Базовая фурнитура', 'Ограниченный выбор цветов'],
                inStock: Math.random() > 0.3 // 70% chance in stock
            }
        ];

        return baseProducts.map((product, index) => ({
            id: `${service.id}_${index + 1}`,
            categoryId: service.id,
            categoryName: service.name,
            name: `${service.name} - ${product.name}`,
            shortName: product.name,
            price: product.price,
            features: product.features,
            image: service.image,
            inStock: product.inStock,
            description: `${product.name} для категории "${service.name}". ${service.description}`
        }));
    }

    handleURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');

        if (category && this.services.find(s => s.name === category)) {
            this.showCategoryProducts(category);
        } else {
            this.showCategories();
        }
    }

    showCategories() {
        this.currentCategory = null;

        document.getElementById('page-title').textContent = 'Каталог продукции';
        document.getElementById('page-description').textContent = 'Выберите интересующую вас категорию продукции';
        document.getElementById('breadcrumb-category').textContent = 'Каталог';

        document.getElementById('categories-section').style.display = 'block';
        document.getElementById('products-section').style.display = 'none';

        this.renderCategories();

        // Update URL without page reload
        const url = new URL(window.location);
        url.search = '';
        window.history.pushState({}, '', url);
    }

    showCategoryProducts(categoryName) {
        this.currentCategory = categoryName;
        const category = this.services.find(s => s.name === categoryName);

        if (!category) {
            this.showCategories();
            return;
        }

        document.getElementById('page-title').textContent = categoryName;
        document.getElementById('page-description').textContent = category.description;
        document.getElementById('breadcrumb-category').textContent = categoryName;

        document.getElementById('categories-section').style.display = 'none';
        document.getElementById('products-section').style.display = 'block';

        this.renderProducts(categoryName);

        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('category', categoryName);
        window.history.pushState({}, '', url);
    }

    renderCategories() {
        const grid = document.getElementById('categories-grid');

        // Add loading state
        grid.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">Загрузка...</div>';

        // Simulate loading delay for better UX
        setTimeout(() => {
            grid.innerHTML = this.services.map(service => this.createCategoryCard(service)).join('');
            lucide.createIcons();
        }, 100);
    }

    createCategoryCard(service) {
        const productCount = this.products.filter(p => p.categoryName === service.name).length;
        const inStockCount = this.products.filter(p => p.categoryName === service.name && p.inStock).length;

        return `
            <div class="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:transform hover:-translate-y-2 overflow-hidden cursor-pointer border border-gray-100 hover:border-orange-200" onclick="catalogPageManager.showCategoryProducts('${service.name.replace(/'/g, "\\'")}')">
                <div class="h-48 bg-cover bg-center relative overflow-hidden" style="background-image: url('${service.image}')">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent"></div>
                    <div class="absolute bottom-4 left-4 right-4">
                        <h3 class="text-xl font-bold text-white drop-shadow-lg">${service.name}</h3>
                        ${productCount > 0 ? `<p class="text-sm text-white/90 drop-shadow">${inStockCount} из ${productCount} в наличии</p>` : ''}
                    </div>
                    <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div class="bg-white/20 backdrop-blur-sm rounded-full p-2">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="p-6">
                    <p class="text-gray-600 text-sm leading-relaxed mb-4">${service.description}</p>
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-500 font-medium">${productCount} ${productCount === 1 ? 'модель' : productCount < 5 ? 'модели' : 'моделей'}</span>
                        <div class="flex items-center text-orange-600 group-hover:text-orange-700 transition-colors duration-200">
                            <span class="text-sm font-semibold mr-2">Смотреть</span>
                            <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderProducts(categoryName) {
        const grid = document.getElementById('products-grid');
        const categoryProducts = this.products.filter(p => p.categoryName === categoryName);

        if (categoryProducts.length === 0) {
            grid.innerHTML = this.createEmptyProductsState();
            return;
        }

        // Add loading state
        grid.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">Загрузка товаров...</div>';

        setTimeout(() => {
            grid.innerHTML = categoryProducts.map(product => this.createProductCard(product)).join('');
            lucide.createIcons();
        }, 150);
    }

    createEmptyProductsState() {
        return `
            <div class="col-span-full text-center py-16">
                <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"></path>
                    </svg>
                </div>
                <h3 class="text-2xl font-semibold text-gray-900 mb-3">Товары не найдены</h3>
                <p class="text-gray-600 mb-6">В данной категории пока нет товаров</p>
                <button onclick="catalogPageManager.showCategories()" class="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-colors duration-200">
                    Вернуться к категориям
                </button>
            </div>
        `;
    }

    createProductCard(product) {
        const stockBadge = product.inStock
            ? '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">В наличии</span>'
            : '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Под заказ</span>';

        return `
            <div class="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:transform hover:-translate-y-1 overflow-hidden border border-gray-100 hover:border-orange-200 cursor-pointer" onclick="catalogPageManager.showProductDetails('${product.id}')">
                <div class="relative">
                    <div class="h-48 bg-cover bg-center" style="background-image: url('${product.image}')"></div>
                    <div class="absolute top-4 right-4">
                        ${stockBadge}
                    </div>
                </div>
                <div class="p-6">
                    <h3 class="text-lg font-bold text-gray-900 mb-2">${product.shortName || product.name}</h3>
                    <p class="text-gray-600 text-sm mb-4 line-clamp-2">${product.description}</p>
                    
                    ${product.features && product.features.length > 0 ? `
                    <div class="mb-4">
                        <h4 class="text-sm font-semibold text-gray-900 mb-3">Особенности:</h4>
                        <ul class="text-sm text-gray-600 space-y-2">
                            ${product.features.slice(0, 3).map(feature => `
                                <li class="flex items-start">
                                    <svg class="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    <span>${feature}</span>
                                </li>
                            `).join('')}
                            ${product.features.length > 3 ? `
                                <li class="text-xs text-gray-400 ml-6">+${product.features.length - 3} дополнительных</li>
                            ` : ''}
                        </ul>
                    </div>
                    ` : ''}
                    
                    <div class="border-t border-gray-100 pt-4">
                        <div class="flex items-center justify-between mb-4">
                            <span class="text-2xl font-bold text-orange-600">${product.price}</span>
                        </div>
                        <button onclick="event.stopPropagation(); catalogPageManager.requestQuote('${product.name.replace(/'/g, "\\'")}')" 
                                class="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-colors duration-200 flex items-center justify-center space-x-2 ${!product.inStock ? 'opacity-75' : ''}" 
                                ${!product.inStock ? '' : ''}>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                            <span>${product.inStock ? 'Заказать' : 'Уточнить наличие'}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    showProductDetails(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.showModal(`
                <div>
                    <div class="text-center mb-6">
                        <div class="w-24 h-24 bg-cover bg-center rounded-xl mx-auto mb-4 shadow-lg" style="background-image: url('${product.image}')"></div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-2">${product.name}</h3>
                        <p class="text-orange-600 text-xl font-semibold">${product.price}</p>
                        ${product.inStock
                ? '<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mt-2">В наличии</span>'
                : '<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 mt-2">Под заказ</span>'
            }
                    </div>
                    
                    <div class="mb-6">
                        <p class="text-gray-600 leading-relaxed">${product.description}</p>
                    </div>
                    
                    ${product.features && product.features.length > 0 ? `
                    <div class="mb-6">
                        <h4 class="text-lg font-semibold text-gray-900 mb-4">Особенности:</h4>
                        <ul class="text-gray-600 space-y-3">
                            ${product.features.map(feature => `
                                <li class="flex items-start">
                                    <svg class="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    <span>${feature}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    
                    <div class="border-t border-gray-100 pt-6 space-y-3">
                        <button onclick="catalogPageManager.requestQuote('${product.name.replace(/'/g, "\\'")}'); this.closest('.modal-overlay').remove();" 
                                class="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                            <span>${product.inStock ? 'Заказать' : 'Уточнить наличие'}</span>
                        </button>
                        <button onclick="this.closest('.modal-overlay').remove()" class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors duration-200">
                            Закрыть
                        </button>
                    </div>
                </div>
            `);
        }
    }

    requestQuote(productName) {
        this.showModal(`
            <div class="text-center">
                <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 mb-4">Заказать консультацию</h3>
                <div class="bg-gray-50 rounded-lg p-4 mb-6">
                    <p class="text-sm text-gray-600 mb-1">Товар:</p>
                    <p class="font-semibold text-gray-900">${productName}</p>
                </div>
                <p class="text-gray-600 mb-8">Свяжитесь с нами для получения подробной информации и расчета стоимости</p>
                
                <div class="space-y-3 mb-8">
                    <a href="tel:+996555555555" class="flex items-center justify-center space-x-3 bg-orange-600 hover:bg-orange-700 text-white px-6 py-4 rounded-lg transition-colors duration-200 font-semibold" data-contact="phone">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                        </svg>
                        <span>+996 (555) 555-555</span>
                    </a>
                    <a href="mailto:info@bishtrade.kz" class="flex items-center justify-center space-x-3 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-4 rounded-lg transition-colors duration-200 font-medium" data-contact="email">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        <span>info@bishtrade.kz</span>
                    </a>
                </div>
                
                <button onclick="this.closest('.modal-overlay').remove()" class="text-gray-500 hover:text-gray-700 transition-colors duration-200 font-medium">
                    Закрыть
                </button>
            </div>
        `);
    }

    showModal(content, callback = null) {
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
                ${content}
            </div>
        `;

        document.body.appendChild(modal);
        lucide.createIcons();

        // Update contacts in the modal
        if (window.contactsLoader) {
            window.contactsLoader.updateContactsInPage().catch(error => {
                console.log('Could not update contacts in modal:', error.message);
            });
        }

        if (callback) callback();

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    setupEventListeners() {
        const backButton = document.getElementById('back-to-categories');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.showCategories();
            });
        }

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal-overlay');
                if (modal) modal.remove();
            }
        });

        // Browser back/forward buttons
        window.addEventListener('popstate', () => {
            this.handleURLParams();
        });
    }
}

// Add CSS animations
const catalogPageStyle = document.createElement('style');
catalogPageStyle.textContent = `
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    .animate-fadeIn {
        animation: fadeIn 0.2s ease-out;
    }
    
    .animate-slideUp {
        animation: slideUp 0.3s ease-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideUp {
        from { 
            opacity: 0; 
            transform: translateY(20px); 
        }
        to { 
            opacity: 1; 
            transform: translateY(0); 
        }
    }
    
    .card-shadow {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    .card-shadow:hover {
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
`;
document.head.appendChild(catalogPageStyle);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.catalogPageManager = new CatalogPageManager();
});