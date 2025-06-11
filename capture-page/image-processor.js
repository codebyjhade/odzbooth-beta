// capture-page/image-processor.js

// This script runs in a Web Worker context.
// It receives messages from the main thread to process images.

let offscreenCanvas = null;
let offscreenCtx = null;
let photoFrameAspectRatio = 4 / 3; // Default, will be updated by main thread
let filterToApply = 'none'; // Default, will be updated by main thread

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
            // The main thread sends an ImageBitmap (frame from video) and other capture details
            const { imageBitmap, filter, indexToReplace } = payload; // Extract filter and indexToReplace
            console.log(`Worker: Received PROCESS_FRAME.`);

            if (!offscreenCanvas || !offscreenCtx) {
                console.error('Worker: OffscreenCanvas not initialized.');
                if (imageBitmap) imageBitmap.close(); // Prevent memory leak
                return;
            }

            // Apply filter received with the frame
            filterToApply = filter;

            const videoActualWidth = imageBitmap.width;
            const videoActualHeight = imageBitmap.height;
            const videoActualAspectRatio = videoActualWidth / videoActualHeight;

            let sx = 0;
            let sy = 0;
            let sWidth = videoActualWidth;
            let sHeight = videoActualHeight;

            // Crop the video feed to match the desired photo frame aspect ratio
            if (videoActualAspectRatio > photoFrameAspectRatio) {
                // Video is wider than desired aspect ratio, crop horizontally
                sWidth = videoActualHeight * photoFrameAspectRatio;
                sx = (videoActualWidth - sWidth) / 2;
            } else if (videoActualAspectRatio < photoFrameAspectRatio) {
                // Video is taller than desired aspect ratio, crop vertically
                sHeight = videoActualWidth / photoFrameAspectRatio;
                sy = (videoActualHeight - sHeight) / 2;
            }

            // Calculate destination dimensions, respecting the requested aspect ratio for the output
            // Max dimension for the output photo, e.g., 800px on the longest side
            const maxOutputSize = 800; 
            let dWidth, dHeight;

            if (photoFrameAspectRatio >= 1) { // Landscape or square
                dWidth = maxOutputSize;
                dHeight = maxOutputSize / photoFrameAspectRatio;
            } else { // Portrait
                dHeight = maxOutputSize;
                dWidth = maxOutputSize * photoFrameAspectRatio;
            }

            // Set canvas dimensions to the calculated output dimensions
            offscreenCanvas.width = dWidth;
            offscreenCanvas.height = dHeight;

            // Clear the canvas
            offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

            // Draw the cropped image to the offscreen canvas
            offscreenCtx.drawImage(imageBitmap, sx, sy, sWidth, sHeight, 0, 0, dWidth, dHeight);

            // Apply filter
            if (filterToApply && filterToApply !== 'none') {
                offscreenCtx.filter = filterToApply;
                // Re-draw to apply filter. Drawing over itself is a common pattern for filters.
                // This might be less efficient than pixel manipulation for complex filters,
                // but simpler for basic CSS-like filters.
                offscreenCtx.drawImage(imageBitmap, sx, sy, sWidth, sHeight, 0, 0, dWidth, dHeight);
                offscreenCtx.filter = 'none'; // Reset filter to avoid affecting subsequent draws
            }

            // Encode to JPEG. This is the heavy part, now off the main thread!
            const blob = await offscreenCanvas.convertToBlob({
                type: 'image/jpeg',
                quality: 0.95
            });

            // Post the blob directly, and include indexToReplace
            self.postMessage({
                type: 'FRAME_PROCESSED',
                payload: { blob, indexToReplace } // Send back the indexToReplace
            });

            imageBitmap.close(); // Release the ImageBitmap memory
            console.log('Worker: Frame processed and blob sent to main thread.');
            break;

        case 'UPDATE_SETTINGS':
            // Update settings like aspect ratio or filter from the main thread
            if (payload.aspectRatio) {
                photoFrameAspectRatio = payload.aspectRatio;
                console.log(`Worker: Aspect ratio updated to ${photoFrameAspectRatio}.`);
            }
            if (payload.filter) {
                filterToApply = payload.filter;
                console.log(`Worker: Filter updated to ${filterToApply}.`);
            }
            break;

        case 'CLOSE_WORKER':
            self.close(); // Terminate the worker
            console.log('Worker: Worker closed.');
            break;
    }
};
