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
            // The main thread sends an ImageBitmap (frame from video) and the index to replace.
            const { imageBitmap, indexToReplace } = payload; 
            console.log(`Worker: Received PROCESS_FRAME. Index to replace: ${indexToReplace}`);

            if (!offscreenCanvas || !offscreenCtx) {
                console.error('Worker: OffscreenCanvas not initialized.');
                if (imageBitmap) imageBitmap.close(); // Prevent memory leak
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

            // Apply filter
            offscreenCtx.filter = filterToApply;

            // Draw the ImageBitmap onto the OffscreenCanvas
            offscreenCtx.drawImage(imageBitmap, sx, sy, sWidth, sHeight, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

            // Encode to JPEG. This is the heavy part, now off the main thread!
            const blob = await offscreenCanvas.convertToBlob({
                type: 'image/jpeg',
                quality: 0.95
            });

            // Post the blob and the indexToReplace back to the main thread
            self.postMessage({
                type: 'FRAME_PROCESSED',
                payload: { blob, indexToReplace: indexToReplace } // Send the index back
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
