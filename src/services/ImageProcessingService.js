class ImageProcessingService {
    static DEFAULT_MAX_DIMENSION = 1200;
    static DEFAULT_QUALITY = 0.8;

    /**
     * Compress an image file and convert it to a base64 data URL.
     * Uses canvas-based resizing for compression.
     * 
     * @param {File} file - The image file to compress
     * @param {Object} options - Optional compression settings
     * @param {number} options.maxWidthOrHeight - Max width or height in pixels
     * @param {number} options.quality - JPEG quality 0-1
     * @returns {Promise<string>} Base64 data URL string
     */
    async compress(file, options = {}) {
        return new Promise((resolve, reject) => {
            const maxWidthOrHeight = options.maxWidthOrHeight || ImageProcessingService.DEFAULT_MAX_DIMENSION;
            const quality = options.quality !== undefined ? options.quality : ImageProcessingService.DEFAULT_QUALITY;

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;

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
    }
}

export default new ImageProcessingService();
