// capture-page/image-processor.js

"use strict";

// --- Worker State ---
let offscreenCanvas = null;
let offscreenCtx = null;
let settings = {
    aspectRatio: 4 / 3,
    filter: 'none'
};

// --- Message Handler ---
self.onmessage = async (event) => {
    const { type, payload } = event.data;

    switch (type) {
        case 'INIT':
            // Initialize the canvas and context from the main thread
            offscreenCanvas = payload.canvas;
            offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
            if (payload.aspectRatio) {
                settings.aspectRatio = payload.aspectRatio;
            }
            console.log('Worker: Initialized with aspect ratio:', settings.aspectRatio);
            break;

        case 'PROCESS_FRAME':
            // Process a single video frame sent from the main thread
            await processFrame(payload);
            break;

        case 'UPDATE_SETTINGS':
            // Update settings like filter or aspect ratio
            Object.assign(settings, payload);
            console.log('Worker: Settings updated', settings);
            break;
    }
};

// --- Core Image Processing Function ---
async function processFrame({ imageBitmap, indexToReplace, isInverted }) {
    if (!offscreenCanvas || !offscreenCtx) {
        console.error('Worker: Canvas not initialized.');
        imageBitmap.close();
        return;
    }

    const { width: videoWidth, height: videoHeight } = imageBitmap;
    const videoAspectRatio = videoWidth / videoHeight;

    // --- Cropping Logic: Crop the video frame to match the target aspect ratio ---
    let sx = 0, sy = 0;
    let sWidth = videoWidth;
    let sHeight = videoHeight;

    if (videoAspectRatio > settings.aspectRatio) {
        // Video is wider than the target, crop the sides
        sWidth = videoHeight * settings.aspectRatio;
        sx = (videoWidth - sWidth) / 2;
    } else if (videoAspectRatio < settings.aspectRatio) {
        // Video is taller than the target, crop the top and bottom
        sHeight = videoWidth / settings.aspectRatio;
        sy = (videoHeight - sHeight) / 2;
    }

    // Set canvas dimensions to the cropped size
    offscreenCanvas.width = sWidth;
    offscreenCanvas.height = sHeight;

    // Apply the CSS filter
    offscreenCtx.filter = settings.filter;

    // --- Transformation Logic ---
    offscreenCtx.save(); // Save the clean canvas state

    // The raw camera image is NOT mirrored, but the default CSS preview IS.
    // To match the preview, we flip the canvas if the preview was NOT flipped by the user.
    if (!isInverted) {
        offscreenCtx.translate(sWidth, 0); // Move origin to the right
        offscreenCtx.scale(-1, 1);        // Flip horizontally
    }

    // Draw the cropped video frame onto the transformed canvas
    offscreenCtx.drawImage(imageBitmap, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

    offscreenCtx.restore(); // Restore to the default non-flipped state

    // Convert the canvas to a high-quality JPEG blob
    const blob = await offscreenCanvas.convertToBlob({
        type: 'image/jpeg',
        quality: 0.95
    });

    // Send the processed blob and its intended index back to the main thread
    self.postMessage({
        type: 'FRAME_PROCESSED',
        payload: { blob, indexToReplace }
    });

    // Clean up memory
    imageBitmap.close();
}
