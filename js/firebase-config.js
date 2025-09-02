// Firebase configuration
// ВАЖНО: Замените эти значения на ваши собственные из Firebase Console
const firebaseConfig = {

    apiKey: "AIzaSyALToMf0bae8Zh_6_KPflbzhTlYJPw81M0",

    authDomain: "bishtrade-3c96f.firebaseapp.com",

    projectId: "bishtrade-3c96f",

    storageBucket: "bishtrade-3c96f.firebasestorage.app",

    messagingSenderId: "24522132746",

    appId: "1:24522132746:web:782ee0c8004a501d543ef3",

    measurementId: "G-WZN81ZW2TX"

};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const db = firebase.firestore();
const auth = firebase.auth ? firebase.auth() : null;

// Firebase Database Manager
class FirebaseManager {
    constructor() {
        this.servicesCollection = db.collection('services');
        this.productsCollection = db.collection('products');
        this.contactsDoc = db.collection('settings').doc('contacts');
    }

    // Services CRUD operations
    async getServices() {
        try {
            const snapshot = await this.servicesCollection.orderBy('order', 'asc').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting services:', error);
            return this.getDefaultServices();
        }
    }

    async addService(serviceData) {
        try {
            const docRef = await this.servicesCollection.add({
                ...serviceData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { id: docRef.id, ...serviceData };
        } catch (error) {
            console.error('Error adding service:', error);
            throw error;
        }
    }

    async updateService(serviceId, serviceData) {
        try {
            await this.servicesCollection.doc(serviceId).update({
                ...serviceData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { id: serviceId, ...serviceData };
        } catch (error) {
            console.error('Error updating service:', error);
            throw error;
        }
    }

    async deleteService(serviceId) {
        try {
            await this.servicesCollection.doc(serviceId).delete();
            // Also delete all products in this category
            const products = await this.productsCollection.where('categoryId', '==', serviceId).get();
            const batch = db.batch();
            products.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            return true;
        } catch (error) {
            console.error('Error deleting service:', error);
            throw error;
        }
    }

    // Products CRUD operations
    async getProducts(categoryId = null) {
        try {
            let query = this.productsCollection;
            if (categoryId) {
                query = query.where('categoryId', '==', categoryId);
            }
            const snapshot = await query.orderBy('name', 'asc').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting products:', error);
            return [];
        }
    }

    async addProduct(productData) {
        try {
            const docRef = await this.productsCollection.add({
                ...productData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { id: docRef.id, ...productData };
        } catch (error) {
            console.error('Error adding product:', error);
            throw error;
        }
    }

    async updateProduct(productId, productData) {
        try {
            await this.productsCollection.doc(productId).update({
                ...productData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { id: productId, ...productData };
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    }

    async deleteProduct(productId) {
        try {
            await this.productsCollection.doc(productId).delete();
            return true;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }

    // Initialize default data if database is empty
    async initializeDefaultData() {
        try {
            const services = await this.getServices();
            if (services.length === 0) {
                const defaultServices = this.getDefaultServices();
                const batch = db.batch();
                
                defaultServices.forEach((service, index) => {
                    const docRef = this.servicesCollection.doc();
                    batch.set(docRef, {
                        ...service,
                        order: index + 1,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });
                
                await batch.commit();
                console.log('Default services initialized');
                
                // Initialize default products for each service
                await this.initializeDefaultProducts();
            }
        } catch (error) {
            console.error('Error initializing default data:', error);
        }
    }

    async initializeDefaultProducts() {
        try {
            const services = await this.getServices();
            const batch = db.batch();
            
            services.forEach(service => {
                const defaultProducts = [
                    {
                        categoryId: service.id,
                        categoryName: service.name,
                        name: `${service.name} - Стандартная модель`,
                        shortName: 'Стандартная модель',
                        price: 'от 15,000 сом',
                        features: ['Двойное остекление', 'Стандартная фурнитура', 'Белый цвет'],
                        image: service.image,
                        description: `Стандартная модель для категории "${service.name}". ${service.description}`,
                        inStock: true
                    },
                    {
                        categoryId: service.id,
                        categoryName: service.name,
                        name: `${service.name} - Премиум модель`,
                        shortName: 'Премиум модель',
                        price: 'от 25,000 сом',
                        features: ['Тройное остекление', 'Премиум фурнитура', 'Любой цвет RAL'],
                        image: service.image,
                        description: `Премиум модель для категории "${service.name}". ${service.description}`,
                        inStock: true
                    },
                    {
                        categoryId: service.id,
                        categoryName: service.name,
                        name: `${service.name} - Эконом модель`,
                        shortName: 'Эконом модель',
                        price: 'от 10,000 сом',
                        features: ['Одинарное остекление', 'Базовая фурнитура', 'Ограниченный выбор цветов'],
                        image: service.image,
                        description: `Эконом модель для категории "${service.name}". ${service.description}`,
                        inStock: true
                    }
                ];

                defaultProducts.forEach(product => {
                    const docRef = this.productsCollection.doc();
                    batch.set(docRef, {
                        ...product,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });
            });
            
            await batch.commit();
            console.log('Default products initialized');
        } catch (error) {
            console.error('Error initializing default products:', error);
        }
    }

    // Image upload methods - Multiple options without Firebase Storage
    async uploadImage(file, folder = 'images') {
        try {
            // Check if user is authenticated
            if (auth && !auth.currentUser) {
                throw new Error('Необходима авторизация для загрузки изображений');
            }

            // Option 1: Convert to Base64 and store in Firestore (for small images)
            if (file.size < 1024 * 1024) { // Less than 1MB
                return await this.convertToBase64(file);
            }

            // Option 2: Try external services for larger files
            try {
                return await this.uploadToImgur(file);
            } catch (imgurError) {
                console.log('Imgur failed, falling back to Base64:', imgurError);
                return await this.convertToBase64(file);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    async convertToBase64(file) {
        return new Promise((resolve, reject) => {
            // Compress image before converting to Base64
            this.compressImage(file, 800, 0.8).then(compressedFile => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(compressedFile);
            }).catch(reject);
        });
    }

    async compressImage(file, maxWidth = 800, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(resolve, file.type, quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    async uploadToImgur(file) {
        const IMGUR_CLIENT_ID = 'YOUR_IMGUR_CLIENT_ID'; // Замените на ваш Client ID
        
        if (IMGUR_CLIENT_ID === 'YOUR_IMGUR_CLIENT_ID') {
            throw new Error('Imgur Client ID не настроен');
        }

        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', 'file');

        const response = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Imgur API error: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
            return result.data.link;
        } else {
            throw new Error('Imgur upload failed');
        }
    }

    async uploadToCloudinary(file) {
        const CLOUDINARY_UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET'; // Замените на ваш preset
        const CLOUDINARY_CLOUD_NAME = 'YOUR_CLOUD_NAME'; // Замените на ваше имя

        if (CLOUDINARY_CLOUD_NAME === 'YOUR_CLOUD_NAME') {
            throw new Error('Cloudinary не настроен');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Cloudinary API error: ${response.status}`);
        }

        const result = await response.json();
        return result.secure_url;
    }

    // Simple method - no deletion needed for Base64
    async deleteImage(imageUrl) {
        // For Base64 images, no deletion needed
        if (imageUrl && imageUrl.startsWith('data:')) {
            return true;
        }
        
        // For external services, deletion might not be possible or needed
        return true;
    }

    // Authentication methods
    async signInWithEmail(email, password) {
        if (!auth) throw new Error('Firebase Auth не инициализирован');
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            return userCredential.user;
        } catch (error) {
            console.error('Error signing in:', error);
            throw error;
        }
    }

    async signOut() {
        if (!auth) throw new Error('Firebase Auth не инициализирован');
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    }

    getCurrentUser() {
        return auth ? auth.currentUser : null;
    }

    onAuthStateChanged(callback) {
        if (!auth) {
            callback(null);
            return () => {};
        }
        return auth.onAuthStateChanged(callback);
    }

    // Contacts operations
    async getContacts() {
        try {
            const doc = await this.contactsDoc.get();
            if (doc.exists) {
                return doc.data();
            } else {
                return null; // Return null if no contacts exist
            }
        } catch (error) {
            console.error('Error getting contacts:', error);
            return null;
        }
    }

    async saveContacts(contactsData) {
        try {
            await this.contactsDoc.set({
                ...contactsData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error saving contacts:', error);
            throw error;
        }
    }

    getDefaultServices() {
        return [
            { name: 'Окна', image: 'images/okna.jpg', description: 'Алюминиевые окна высокого качества' },
            { name: 'Панорамные окна', image: 'images/panoram_okna.jpg', description: 'Панорамное остекление для современных зданий' },
            { name: 'Раздвижные окна', image: 'images/razdvijnye_okna.jpg', description: 'Практичные раздвижные системы' },
            { name: 'Алюминиевые двери', image: 'images/allumin_dveri.jpg', description: 'Надежные алюминиевые двери' },
            { name: 'Алюминиевые входные группы', image: 'images/allumin_vhodnye_construksii.png', description: 'Стильные входные конструкции' },
            { name: 'Раздвижные двери', image: 'images/razdvijnye_dveri.jpg', description: 'Элегантные раздвижные двери' },
            { name: 'Фасадное остекление', image: 'images/fasad_osteklenye.jpg', description: 'Профессиональное фасадное остекление' },
            { name: 'Зенитные фонари', image: 'images/zenitnye_fonari.jpg', description: 'Световые фонари для крыш' },
            { name: 'Балконы', image: 'images/allumin_balkon.jpg', description: 'Алюминиевые балконные конструкции' },
            { name: 'Террасы, веранды, беседки', image: 'images/allumin_terassa.jpg', description: 'Конструкции для отдыха' },
            { name: 'Зимние сады', image: 'images/zimnye_sady.jpg', description: 'Остекленные зимние сады' },
            { name: 'Алюминиевые перегородки', image: 'images/allumin_peregovornaya.jpg', description: 'Офисные и домашние перегородки' }
        ];
    }
}

// Initialize Firebase Manager
window.firebaseManager = new FirebaseManager();

// Contacts loader for public pages
class PublicContactsLoader {
    constructor() {
        this.contactsDoc = db.collection('settings').doc('contacts');
        this.defaultContacts = {
            phone: '+996 (555) 555-555',
            email: 'info@bishtrade.kz', 
            address: 'г. Бишкек, ул. Примерная, 123',
            hours: 'Пн-Пт: 9:00-18:00, Сб: 10:00-16:00'
        };
    }

    async loadContacts() {
        try {
            const doc = await this.contactsDoc.get();
            if (doc.exists) {
                return doc.data();
            } else {
                return this.defaultContacts;
            }
        } catch (error) {
            console.log('Using default contacts due to:', error.message);
            return this.defaultContacts;
        }
    }

    async updateContactsInPage() {
        const contacts = await this.loadContacts();
        
        // Update phone elements
        const phoneElements = document.querySelectorAll('[data-contact="phone"]');
        phoneElements.forEach(el => {
            if (el.tagName === 'A') {
                el.href = `tel:${contacts.phone}`;
                el.querySelector('span').textContent = contacts.phone;
            } else {
                el.textContent = contacts.phone;
            }
        });
        
        // Update email elements  
        const emailElements = document.querySelectorAll('[data-contact="email"]');
        emailElements.forEach(el => {
            if (el.tagName === 'A') {
                el.href = `mailto:${contacts.email}`;
                el.querySelector('span').textContent = contacts.email;
            } else {
                el.textContent = contacts.email;
            }
        });
        
        // Update address elements
        const addressElements = document.querySelectorAll('[data-contact="address"]');
        addressElements.forEach(el => el.textContent = contacts.address);
        
        // Update hours elements
        const hoursElements = document.querySelectorAll('[data-contact="hours"]');
        hoursElements.forEach(el => el.textContent = contacts.hours);
    }
}

// Initialize public contacts loader
window.contactsLoader = new PublicContactsLoader();