// Initialize Lucide icons
lucide.createIcons();

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
        
        // Close mobile menu when clicking on a link
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (event) => {
            if (!mobileMenuButton.contains(event.target) && !mobileMenu.contains(event.target)) {
                mobileMenu.classList.add('hidden');
            }
        });
    }
});

// Partners management
class PartnersLoader {
    constructor() {
        this.partnersCollection = db.collection('partners');
    }

    async loadPartners() {
        try {
            const snapshot = await this.partnersCollection.orderBy('order', 'asc').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error loading partners:', error);
            return this.getDefaultPartners();
        }
    }

    getDefaultPartners() {
        return [
            { name: 'Partner 1', logo: 'https://via.placeholder.com/150x80?text=Partner+1', order: 1 },
            { name: 'Partner 2', logo: 'https://via.placeholder.com/150x80?text=Partner+2', order: 2 },
            { name: 'Partner 3', logo: 'https://via.placeholder.com/150x80?text=Partner+3', order: 3 },
            { name: 'Partner 4', logo: 'https://via.placeholder.com/150x80?text=Partner+4', order: 4 },
            { name: 'Partner 5', logo: 'https://via.placeholder.com/150x80?text=Partner+5', order: 5 },
            { name: 'Partner 6', logo: 'https://via.placeholder.com/150x80?text=Partner+6', order: 6 },
            { name: 'Partner 7', logo: 'https://via.placeholder.com/150x80?text=Partner+7', order: 7 },
            { name: 'Partner 8', logo: 'https://via.placeholder.com/150x80?text=Partner+8', order: 8 }
        ];
    }

    async renderPartners() {
        const partnersSlider = document.querySelector('.partners-slider');
        if (!partnersSlider) return;

        const partners = await this.loadPartners();
        
        if (partners.length === 0) {
            partnersSlider.innerHTML = `
                <div class="partner-logo flex-shrink-0">
                    <div class="h-16 flex items-center justify-center text-gray-400">
                        <span>Нет партнеров</span>
                    </div>
                </div>
            `;
            return;
        }

        // Create partner logos HTML (duplicate for infinite scroll)
        const partnerLogos = partners.map(partner => `
            <div class="partner-logo flex-shrink-0">
                <img src="${partner.logo}" alt="${partner.name}" 
                     class="h-16 object-contain opacity-60 hover:opacity-100 transition-opacity duration-300"
                     title="${partner.name}">
            </div>
        `).join('');

        // Render partners twice for infinite scroll effect
        partnersSlider.innerHTML = partnerLogos + partnerLogos;
    }
}

// Initialize partners loader
const partnersLoader = new PartnersLoader();

// Services/Categories management for homepage
class ServicesLoader {
    constructor() {
        this.servicesCollection = db.collection('services');
    }

    async loadServices() {
        try {
            if (window.firebaseManager) {
                const snapshot = await this.servicesCollection.orderBy('order', 'asc').get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } else {
                return this.getDefaultServices();
            }
        } catch (error) {
            console.error('Error loading services:', error);
            return this.getDefaultServices();
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
            { id: '8', name: 'Зенитные фонари', image: 'images/zenitnye_fonari.jpg', description: 'Световые фонари для крыш' }
        ];
    }

    async renderServices() {
        const servicesGrid = document.getElementById('services-grid');
        if (!servicesGrid) return;

        const services = await this.loadServices();
        
        if (services.length === 0) {
            servicesGrid.innerHTML = `
                <div class="col-span-full text-center py-8 text-gray-500">
                    <p>Категории не найдены</p>
                </div>
            `;
            return;
        }

        // Render first 8 services for homepage
        const displayServices = services.slice(0, 8);
        servicesGrid.innerHTML = displayServices.map(service => `
            <div class="bg-white rounded-xl card-shadow transition-all duration-300 hover:transform hover:-translate-y-2 overflow-hidden cursor-pointer" onclick="window.location.href='catalog.html?category=${encodeURIComponent(service.name)}'">
                <div class="h-48 bg-cover bg-center" style="background-image: url('${service.image}')" onError="this.style.backgroundImage='url(https://via.placeholder.com/400x300?text=${encodeURIComponent(service.name)})'"></div>
                <div class="p-6 text-center">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">${service.name}</h3>
                    <p class="text-sm text-gray-600">${service.description}</p>
                </div>
            </div>
        `).join('');
    }
}

// Initialize services loader
const servicesLoader = new ServicesLoader();

// Smooth scroll for anchor links
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

// Add scroll effect for cards
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

// Observe elements for animation
document.querySelectorAll('.card-shadow').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Load contacts, partners and services from Firebase when page loads
document.addEventListener('DOMContentLoaded', async () => {
    if (window.contactsLoader) {
        try {
            await window.contactsLoader.updateContactsInPage();
        } catch (error) {
            console.log('Could not load contacts from Firebase:', error.message);
        }
    }
    
    if (partnersLoader) {
        try {
            await partnersLoader.renderPartners();
        } catch (error) {
            console.log('Could not load partners from Firebase:', error.message);
        }
    }
    
    if (servicesLoader) {
        try {
            await servicesLoader.renderServices();
        } catch (error) {
            console.log('Could not load services from Firebase:', error.message);
        }
    }
});