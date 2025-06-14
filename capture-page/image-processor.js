// capture-page/image-processor.js

// This script runs in a Web Worker context.
// It receives messages from the main thread to process images.

let offscreenCanvas = null;
let offscreenCtx = null;
let photoFrameAspectRatio = 4 / 3; // Default, will be updated by main thread
let filterToApply = 'none'; // Default, will be updated by main thread

// --- Filter Application Functions ---
function applyGrayscale(imageData) {
    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        // Luminosity method: (R + G + B) / 3 or 0.299*R + 0.587*G + 0.114*B
        const gray = (r + g + b) / 3;
        pixels[i] = gray;
        pixels[i + 1] = gray;
        pixels[i + 2] = gray;
    }
}

function applySepia(imageData) {
    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        pixels[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189)); // Red
        pixels[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168)); // Green
        pixels[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131)); // Blue
    }
}

function applyInvert(imageData) {
    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = 255 - pixels[i];     // Red
        pixels[i + 1] = 255 - pixels[i + 1]; // Green
        pixels[i + 2] = 255 - pixels[i + 2]; // Blue
    }
}

function applyBrightness(imageData, value) {
    const pixels = imageData.data;
    const factor = value / 100; // Assuming value is percentage (e.g., 150 for 150%)
    for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = Math.min(255, pixels[i] * factor);
        pixels[i + 1] = Math.min(255, pixels[i + 1] * factor);
        pixels[i + 2] = Math.min(255, pixels[i + 2] * factor);
    }
}

function applySaturate(imageData, value) {
    const pixels = imageData.data;
    const factor = value / 100;
    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const gray = (r * 0.299 + g * 0.587 + b * 0.114);

        pixels[i] = Math.min(255, gray + (r - gray) * factor);
        pixels[i + 1] = Math.min(255, gray + (g - gray) * factor);
        pixels[i + 2] = Math.min(255, gray + (b - gray) * factor);
    }
}

// Note: More complex filters like contrast, hue-rotate, and blur are significantly
// more involved to implement manually with pixel manipulation.
// For now, I'm focusing on the simpler ones that might be failing.
// If advanced filters are critical, a dedicated image processing library
// (e.g., CamanJS, though that adds significant bundle size) or
// investigating specific browser limitations on `offscreenCtx.filter`
// would be necessary.

// Listen for messages from the main thread
self.onmessage = async (event) => {
    const { type, payload } = event.data;

    switch (type) {
        case 'INIT':
            // The main thread sends the OffscreenCanvas for initial setup
            offscreenCanvas = payload.canvas;
            offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
            photoFrameAspectRatio = payload.aspectRatio;
            console.log('Worker: Initialized with OffscreenCanvas.');
            break;

                case 'PROCESS_FRAME':
            const { imageBitmap, indexToReplace, shouldFlip } = payload; // Capture the new 'shouldFlip' flag
            console.log(`Worker: Received PROCESS_FRAME for index: ${indexToReplace}. Should flip: ${shouldFlip}`);
        
            if (!offscreenCanvas || !offscreenCtx) {
                console.error('Worker: OffscreenCanvas not initialized.');
                if (imageBitmap) imageBitmap.close();
                return;
            }
        
            const videoActualWidth = imageBitmap.width;
            const videoActualHeight = imageBitmap.height;
            const videoActualAspectRatio = videoActualWidth / videoActualHeight;
        
            let sx = 0;
            let sy = 0;
            let sWidth = videoActualWidth;
            let sHeight = videoActualHeight;
        
            // Crop the video feed to match the desired photo frame aspect ratio
            if (videoActualAspectRatio > photoFrameAspectRatio) {
                sWidth = videoActualHeight * photoFrameAspectRatio;
                sx = (videoActualWidth - sWidth) / 2;
            } else if (videoActualAspectRatio < photoFrameAspectRatio) {
                sHeight = videoActualWidth / photoFrameAspectRatio;
                sy = (videoActualHeight - sHeight) / 2;
            }
        
            // Set offscreen canvas dimensions to the cropped area
            offscreenCanvas.width = sWidth;
            offscreenCanvas.height = sHeight;
        
            // The canvas transform is automatically reset when width/height is set.
            offscreenCtx.filter = 'none';
        
            // If the image needs to be flipped, apply a horizontal transform to the canvas
            if (shouldFlip) {
                offscreenCtx.translate(offscreenCanvas.width, 0);
                offscreenCtx.scale(-1, 1);
            }
        
            // Draw the ImageBitmap onto the (potentially transformed) OffscreenCanvas
            offscreenCtx.drawImage(imageBitmap, sx, sy, sWidth, sHeight, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
        
            // Reset the transform before applying manual filters to ensure getImageData/putImageData work on a normal coordinate system.
            // This is the most robust approach.
            offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);
        
            // --- Apply Filter Manually ---
            if (filterToApply !== 'none') {
                const imageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        
                if (filterToApply === 'grayscale(100%)') {
                    applyGrayscale(imageData);
                } else if (filterToApply === 'sepia(100%)') {
                    applySepia(imageData);
                } else if (filterToApply === 'invert(100%)') {
                    applyInvert(imageData);
                } else if (filterToApply === 'brightness(150%)') {
                    applyBrightness(imageData, 150); // Assuming 150% brightness
                } else if (filterToApply === 'saturate(200%)') {
                    applySaturate(imageData, 200); // Assuming 200% saturation
                }
                
                offscreenCtx.putImageData(imageData, 0, 0);
                console.log(`Worker: Manually applied filter: ${filterToApply}`);
                }
            
                // Encode to JPEG.
                const blob = await offscreenCanvas.convertToBlob({
                    type: 'image/jpeg',
                    quality: 0.95
                });
            
                self.postMessage({
                    type: 'FRAME_PROCESSED',
                    payload: { blob, indexToReplace }
                });
            
                imageBitmap.close();
                console.log('Worker: Frame processed and blob sent to main thread.');
                break;
            
            case 'UPDATE_SETTINGS':
                if (payload.aspectRatio) {
                    photoFrameAspectRatio = payload.aspectRatio;
                    console.log(`Worker: Aspect ratio updated to ${photoFrameAspectRatio}.`);
            }
            if (payload.filter !== undefined) { // Check for undefined, not just truthy
                filterToApply = payload.filter;
                console.log(`Worker: Filter updated to ${filterToApply}.`);
            }
            break;

        case 'CLOSE_WORKER':
            self.close();
            console.log('Worker: Worker closed.');
            break;
    }
};
