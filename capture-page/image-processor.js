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
            const { imageBitmap, indexToReplace } = payload;
            console.log(`Worker: Received PROCESS_FRAME for index ${indexToReplace}.`);

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
            // This is crucial for performance: draw only what's needed.
            offscreenCanvas.width = sWidth;
            offscreenCanvas.height = sHeight;

            // Apply filter (this property is available on OffscreenCanvasRenderingContext2D)
            offscreenCtx.filter = filterToApply;

            console.log('Worker: Drawing image to OffscreenCanvas...');
            // Draw the ImageBitmap onto the OffscreenCanvas
            offscreenCtx.drawImage(imageBitmap, sx, sy, sWidth, sHeight, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
            console.log('Worker: Image drawn. Converting to Blob...');

            // Encode to JPEG. This is the heavy part, now off the main thread!
            // Using a high quality for better results
            const blob = await offscreenCanvas.convertToBlob({
                type: 'image/jpeg',
                quality: 0.95
            });
            console.log('Worker: Blob created. Reading as DataURL...');

            // Read the blob as a data URL
            const reader = new FileReader();
            reader.onloadend = () => {
                const imgData = reader.result;
                // Send the result back to the main thread
                self.postMessage({
                    type: 'FRAME_PROCESSED',
                    payload: { imgData, indexToReplace }
                });
                imageBitmap.close(); // Release the ImageBitmap memory
                console.log('Worker: Frame processed and result sent to main thread.');
            };
            reader.readAsDataURL(blob);
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
            // START OF FIX: Removed faulty reference to imageBitmap
            // This prevents the worker from crashing on page unload.
            self.close(); // Terminate the worker
            console.log('Worker: Worker closed.');
            // END OF FIX
            break;
    }
};
