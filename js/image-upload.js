// Free Image Upload with Cloudinary - No Firebase Storage needed
class ImageUploadManager {
    constructor() {
        // Configuration for Cloudinary (optional)
        this.config = {
            cloudinary: {
                cloudName: 'dkfsdldiz', // Get free at https://cloudinary.com
                uploadPreset: 'alprof_upload',
                enabled: false
            }
        };
    }

    // Main upload method with Cloudinary and Base64 fallback
    async uploadImage(file) {
        try {
            // Always compress image first
            const compressedFile = await this.compressImage(file, 800, 0.8);
            
            // Option 1: Small images (< 500KB) -> Base64 in Firestore
            if (compressedFile.size < 500 * 1024) {
                console.log('Using Base64 storage for small image');
                return await this.convertToBase64(compressedFile);
            }

            // Option 2: Try Cloudinary for larger images (if configured)  
            if (this.config.cloudinary.enabled) {
                try {
                    return await this.uploadToCloudinary(compressedFile);
                } catch (error) {
                    console.log('Cloudinary failed, falling back to Base64:', error.message);
                }
            }

            // Final fallback: Base64 (always works but increases DB size)
            console.log('Using Base64 fallback for large image - this may increase loading time');
            return await this.convertToBase64(compressedFile);

        } catch (error) {
            throw new Error(`Не удалось загрузить изображение: ${error.message}`);
        }
    }

    // Compress image to reduce file size
    async compressImage(file, maxWidth = 800, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onerror = () => reject(new Error('Не удалось загрузить изображение'));
            
            img.onload = () => {
                try {
                    // Calculate new dimensions maintaining aspect ratio
                    let { width, height } = img;
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                    
                    // Set canvas size
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Draw image with compression
                    ctx.fillStyle = 'white'; // White background for JPEG
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to blob
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error('Не удалось сжать изображение'));
                            }
                        },
                        'image/jpeg', // Always use JPEG for better compression
                        quality
                    );
                } catch (error) {
                    reject(new Error('Ошибка при обработке изображения'));
                }
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    // Convert image to Base64 for storage in Firestore
    async convertToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
            reader.readAsDataURL(file);
        });
    }


    // Upload to Cloudinary (free tier available)
    async uploadToCloudinary(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', this.config.cloudinary.uploadPreset);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${this.config.cloudinary.cloudName}/image/upload`, 
            {
                method: 'POST',
                body: formData
            }
        );

        if (!response.ok) {
            throw new Error(`Cloudinary API error: ${response.status}`);
        }

        const result = await response.json();
        return result.secure_url;
    }

    // Create preview of selected image
    createPreview(file, previewElementId) {
        const preview = document.getElementById(previewElementId);
        if (!preview) return;

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.classList.remove('hidden');
                
                // Show file size info
                const sizeInfo = document.createElement('div');
                sizeInfo.className = 'text-xs text-gray-500 mt-1';
                sizeInfo.innerHTML = `Размер: ${this.formatFileSize(file.size)}`;
                
                const existingSizeInfo = preview.parentElement.querySelector('.text-xs');
                if (existingSizeInfo) {
                    existingSizeInfo.remove();
                }
                preview.parentElement.appendChild(sizeInfo);
            };
            reader.readAsDataURL(file);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Configure Cloudinary service (call this in your setup)
    configureCloudinary(cloudinaryConfig) {
        if (cloudinaryConfig) {
            this.config.cloudinary = { ...this.config.cloudinary, ...cloudinaryConfig };
            this.config.cloudinary.enabled = true;
            console.log('✅ Cloudinary configured');
        } else {
            console.log('ℹ️ Using Base64 storage only (all images stored in Firestore)');
        }
    }

    // Get upload method info for user
    getUploadInfo(fileSize) {
        if (fileSize < 500 * 1024) {
            return { method: 'Base64', color: 'green', message: 'Быстрая загрузка (сохраняется в базе данных)' };
        }
        
        if (this.config.cloudinary.enabled) {
            return { method: 'Cloudinary', color: 'blue', message: 'Загрузка на внешний сервис (бесплатно)' };
        }
        
        return { method: 'Base64', color: 'orange', message: 'Большое изображение будет сжато и сохранено в базе данных' };
    }
}

// Initialize global instance
window.imageUploader = new ImageUploadManager();

// Example Cloudinary configuration (uncomment and replace with your credentials):
// window.imageUploader.configureCloudinary({
//     cloudName: 'YOUR_CLOUD_NAME',      // Get from https://cloudinary.com
//     uploadPreset: 'YOUR_UPLOAD_PRESET'  // Create in Cloudinary settings
// });