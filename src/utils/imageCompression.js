/**
 * Compress an image file and convert it to a base64 data URL.
 * Uses canvas-based resizing for compression.
 * 
 * @param {File} file - The image file to compress
 * @param {Object} options - Optional compression settings
 * @param {number} options.maxWidthOrHeight - Max width or height in pixels (default: 1200)
 * @param {number} options.maxSizeMB - Approximate max file size in MB (default: 0.5)
 * @param {number} options.quality - JPEG quality 0-1 (default: 0.8)
 * @returns {Promise<string>} Base64 data URL string
 */
export const compressImageToBase64 = (file, options = {}) => {
    return new Promise((resolve, reject) => {
        const {
            maxWidthOrHeight = 1200,
            quality = 0.8,
        } = options;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                // Scale down if larger than maxWidthOrHeight
                if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
                    if (width > height) {
                        height = Math.round((height * maxWidthOrHeight) / width);
                        width = maxWidthOrHeight;
                    } else {
                        width = Math.round((width * maxWidthOrHeight) / height);
                        height = maxWidthOrHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Use PNG for small images (favicons), JPEG for photos
                const isPng = file.type === 'image/png' && (maxWidthOrHeight <= 256);
                const mimeType = isPng ? 'image/png' : 'image/jpeg';
                const dataUrl = canvas.toDataURL(mimeType, isPng ? undefined : quality);

                resolve(dataUrl);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = event.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
};
