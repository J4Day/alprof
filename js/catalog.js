class CatalogManager {
    constructor() {
        this.services = [];
        this.init();
    }

    async init() {
        this.createDropdownMenu();
        await this.loadServices();
        this.updateCatalogContent();
        this.setupEventListeners();
    }

    async loadServices() {
        try {
            if (window.firebaseManager) {
                this.services = await firebaseManager.getServices();
            } else {
                // Fallback to default services if Firebase is not available
                this.services = this.getDefaultServices();
            }
            this.updateDropdownServices();
        } catch (error) {
            console.error('Error loading services:', error);
            this.services = this.getDefaultServices();
            this.updateDropdownServices();
        }
    }

    getDefaultServices() {
        return [
            { id: '1', name: 'Окна', image: 'images/okna.jpg', description: 'Алюминиевые окна высокого качества' },
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

    createDropdownMenu() {
        const header = document.querySelector('header .max-w-7xl .flex');

        const navContainer = document.createElement('nav');
        navContainer.className = 'hidden md:block';
        navContainer.innerHTML = `
            <div class="flex items-center space-x-6">
                <a href="index.html" class="text-gray-700 hover:text-orange-600 transition-colors duration-200 font-medium">Главная</a>
                
                <div class="relative group">
                    <button class="flex items-center space-x-1 text-gray-700 hover:text-orange-600 transition-colors duration-200 font-medium">
                        <span>Каталог</span>
                        <i data-lucide="chevron-down" class="w-4 h-4 transform group-hover:rotate-180 transition-transform duration-200"></i>
                    </button>
                    <div id="catalog-dropdown" class="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                        <div class="py-3">
                            <div id="dropdown-services"></div>
                        </div>
                    </div>
                </div>
                
                <a href="#process" class="text-gray-700 hover:text-orange-600 transition-colors duration-200 font-medium">Услуги</a>
                <a href="#works" class="text-gray-700 hover:text-orange-600 transition-colors duration-200 font-medium">Наши работы</a>
                <a href="#contact" class="text-gray-700 hover:text-orange-600 transition-colors duration-200 font-medium">Контакты</a>
            </div>
        `;

        const contactInfo = header.querySelector('.hidden.md\\:block');
        header.insertBefore(navContainer, contactInfo);

        lucide.createIcons();
        this.updateDropdownServices();
    }

    updateDropdownServices() {
        const container = document.getElementById('dropdown-services');
        if (!container) return;

        container.innerHTML = this.services.map(service => `
            <a href="catalog.html?category=${encodeURIComponent(service.name)}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors duration-200">
                ${service.name}
            </a>
        `).join('');
    }

    scrollToService(serviceId) {
        const element = document.getElementById(`service-${serviceId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    updateCatalogContent() {
        this.updateProductSection();
        this.updateExtendedSection();
    }

    updateProductSection() {
        const section = document.querySelector('#products');
        if (!section) return;

        // Находим контейнер с сеткой или создаем новый
        let gridContainer = section.querySelector('.grid');
        if (!gridContainer) {
            gridContainer = section.querySelector('.max-w-7xl');
        }

        if (!gridContainer) return;

        const firstRowServices = this.services.slice(0, 6);

        // Заменяем содержимое после заголовка
        const titleSection = gridContainer.querySelector('.text-center');
        const afterTitle = titleSection ? titleSection.nextElementSibling : gridContainer.firstElementChild;

        // Создаем новую сетку
        const newGrid = document.createElement('div');
        newGrid.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                ${firstRowServices.map(service => this.createServiceCard(service)).join('')}
            </div>
        `;

        // Удаляем старое содержимое после заголовка
        const elementsToRemove = [];
        let currentElement = afterTitle;
        while (currentElement) {
            elementsToRemove.push(currentElement);
            currentElement = currentElement.nextElementSibling;
        }
        elementsToRemove.forEach(el => el.remove());

        // Добавляем новое содержимое
        gridContainer.appendChild(newGrid.firstElementChild);
    }

    updateExtendedSection() {
        // Найдем следующую секцию после products
        const productsSection = document.querySelector('#products');
        if (!productsSection) return;

        const nextSection = productsSection.nextElementSibling;
        if (!nextSection) return;

        const gridContainer = nextSection.querySelector('.max-w-7xl');
        if (!gridContainer) return;

        const extendedServices = this.services.slice(6, 12);

        // Заменяем все содержимое контейнера новой сеткой
        gridContainer.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                ${extendedServices.map(service => this.createServiceCard(service)).join('')}
            </div>
        `;
    }

    createServiceCard(service) {
        return `
            <div id="service-${service.id}" class="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:transform hover:-translate-y-2 overflow-hidden cursor-pointer border border-gray-100 hover:border-orange-200" onclick="catalogManager.showServiceDetails('${service.id}')">
                <div class="relative overflow-hidden">
                    <div class="h-48 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-500" style="background-image: url('${service.image}')"></div>
                    <div class="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <div class="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                            <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="p-6">
                    <h3 class="text-lg font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors duration-300 text-center">${service.name}</h3>
                    <p class="text-sm text-gray-600 leading-relaxed text-center line-clamp-2 mb-4">${service.description}</p>
                    <div class="flex justify-center">
                        <div class="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <span class="inline-flex items-center text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                                Подробнее
                                <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Basic event listeners for smooth scrolling
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
    }

    // Добавим метод для показа деталей сервиса (если нужен)
    showServiceDetails(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        if (service) {
            // Здесь можно добавить логику показа модального окна или перехода на страницу товара
            console.log('Показываем детали для:', service);
            // Например, перенаправление на страницу каталога с фильтром
            window.location.href = `catalog.html?category=${encodeURIComponent(service.name)}`;
        }
    }
}

// Добавляем CSS стили для улучшения внешнего вида
const style = document.createElement('style');
style.textContent = `
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    .line-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    @media (max-width: 640px) {
        .grid {
            gap: 1rem !important;
        }
    }
`;
document.head.appendChild(style);

window.catalogManager = new CatalogManager();