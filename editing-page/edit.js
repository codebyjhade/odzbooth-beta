// editing-page/edit.js

"use strict";

// --- Configuration ---
// Defines the layout specifics for photo strips based on the number of photos.
const STRIP_LAYOUT_CONFIGS = {
    // Common settings for photo slots and padding
    common: {
        photoSidePadding: 40,
        photoSlotWidth: 320,
        gapBetweenPhotos: 20,
        topPadding: 40,
        bottomSpaceForLogo: 150
    },
    // Configuration for a 1-photo strip
    '1': {
        stripWidth: 400,
        stripHeight: 40 + 240 + 150, // topPadding + photoHeight + bottomSpaceForLogo
        frames: [{ x: 40, y: 40, width: 320, height: 240 }],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-1-photos-option1.png', name: 'Original Single' },
            { id: 'option2', src: 'assets/strip-frame-1-photos-option2.png', name: 'Clean White' },
            { id: 'option3', src: 'assets/strip-frame-1-photos-option3.png', name: 'Styled Border' }
        ]
    },
    // Configuration for a 2-photo strip
    '2': {
        stripWidth: 400,
        stripHeight: 40 + (240 * 2) + 20 + 150, // top + (2*photo) + gap + bottom
        frames: [
            { x: 40, y: 40, width: 320, height: 240 },
            { x: 40, y: 40 + 240 + 20, width: 320, height: 240 }
        ],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-2-photos-option1.png', name: 'Silver Grey' },
            { id: 'option2', src: 'assets/strip-frame-2-photos-option2.png', name: 'Classic White' },
            { id: 'option3', src: 'assets/strip-frame-2-photos-option3.png', name: 'Light Sky Blue' },
            { id: 'option3', src: 'assets/strip-frame-2-photos-option4.png', name: 'Off-White' },
            { id: 'option3', src: 'assets/strip-frame-2-photos-option5.png', name: 'Periwinkle' },
            { id: 'option3', src: 'assets/strip-frame-2-photos-option6.png', name: 'Blush Pink' }
        ]
    },
    // Configuration for a 3-photo strip
    '3': {
        stripWidth: 400,
        stripHeight: 40 + (220 * 3) + (20 * 2) + 150,
        frames: [
            { x: 40, y: 40, width: 320, height: 220 },
            { x: 40, y: 40 + 220 + 20, width: 320, height: 220 },
            { x: 40, y: 40 + (220 * 2) + (20 * 2), width: 320, height: 220 }
        ],
        defaultBackground: '#CCCCCC',
        frameAspectRatio: 320 / 220,
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-3-photos-option1.png', name: 'Classic White' },
            { id: 'option2', src: 'assets/strip-frame-3-photos-option2.png', name: 'Periwinkle' },
            { id: 'option3', src: 'assets/strip-frame-3-photos-option3.png', name: 'Blush Pink' },
            { id: 'option3', src: 'assets/strip-frame-3-photos-option4.png', name: 'Silver Grey' },
            { id: 'option3', src: 'assets/strip-frame-3-photos-option5.png', name: 'Off-White' },
            { id: 'option3', src: 'assets/strip-frame-3-photos-option6.png', name: 'Light Sky Blue' }
        ]
    },
    // Configuration for a 4-photo strip
    '4': {
        stripWidth: 400,
        stripHeight: 40 + (226 * 4) + (20 * 3) + 150,
        frames: [
            { x: 40, y: 40, width: 320, height: 226 },
            { x: 40, y: 40 + 226 + 20, width: 320, height: 226 },
            { x: 40, y: 40 + (226 * 2) + (20 * 2), width: 320, height: 226 },
            { x: 40, y: 40 + (226 * 3) + (20 * 3), width: 320, height: 226 }
        ],
        defaultBackground: '#CCCCCC',
        frameAspectRatio: 320 / 226,
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-4-photos-option1.png', name: 'Blush Pink' },
            { id: 'option2', src: 'assets/strip-frame-4-photos-option2.png', name: 'Classic White' },
            { id: 'option3', src: 'assets/strip-frame-4-photos-option3.png', name: 'Light Sky Blue' },
            { id: 'option3', src: 'assets/strip-frame-4-photos-option4.png', name: 'Off-White' },
            { id: 'option3', src: 'assets/strip-frame-4-photos-option5.png', name: 'Silver Grey' },
            { id: 'option3', src: 'assets/strip-frame-4-photos-option6.png', name: 'Periwinkle' }
        ]
    },
    // Configuration for a 6-photo strip (2 columns)
    '6': {
        stripWidth: 760, // Wider for two columns
        stripHeight: 40 + (220 * 3) + (20 * 2) + 150,
        frames: [
            { x: 40, y: 40, width: 320, height: 220 },
            { x: 40, y: 40 + 220 + 20, width: 320, height: 220 },
            { x: 40, y: 40 + (220 * 2) + (20 * 2), width: 320, height: 220 },
            { x: 400, y: 40, width: 320, height: 220 },
            { x: 400, y: 40 + 220 + 20, width: 320, height: 220 },
            { x: 400, y: 40 + (220 * 2) + (20 * 2), width: 320, height: 220 }
        ],
        defaultBackground: '#CCCCCC',
        frameAspectRatio: 320 / 220,
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-6-photos-option1.png', name: 'Light Sky Blue' },
            { id: 'option2', src: 'assets/strip-frame-6-photos-option2.png', name: 'Classic White' },
            { id: 'option2', src: 'assets/strip-frame-6-photos-option3.png', name: 'Off-White' },
            { id: 'option2', src: 'assets/strip-frame-6-photos-option4.png', name: 'Silver Grey' },
            { id: 'option2', src: 'assets/strip-frame-6-photos-option5.png', name: 'Blush Pink' },
            { id: 'option2', src: 'assets/strip-frame-6-photos-option6.png', name: 'Periwinkle' }
        ]
    }
};

// Default values for new text (no outline/shadow properties now)
const DEFAULT_TEXT_SETTINGS = {
    color: '#333333',
    font: "'Poppins', sans-serif",
    size: 30,
    align: 'center',
    isBold: false,
    isItalic: false,
    isUnderline: false
};

const DEFAULT_DRAWING_SETTINGS = {
    color: '#FF0000',
    size: 5
};

// --- DOM Element References ---
// Centralized object for all frequently accessed DOM elements on this page.
const DOMElements = {
    photoCanvas: document.getElementById("photoCanvas"),
    // Get context after canvas is defined. This will be assigned in initializeEditor.
    ctx: null, 
    canvasContainer: document.getElementById('canvasContainer'),
    
    // New Title Select element
    titleSelect: document.getElementById("titleSelect"),

    frameSelect: document.getElementById("frameSelect"),

    stickerSelect: document.getElementById("stickerSelect"),
    addStickerBtn: document.getElementById("addStickerBtn"),
    removeStickerBtn: document.getElementById("removeStickerBtn"),

    textInput: document.getElementById("textInput"),
    textColorInput: document.getElementById("textColorInput"), 
    textFontSelect: document.getElementById("textFontSelect"),
    textSizeInput: document.getElementById("textSizeInput"),
    addTextBtn: document.getElementById("addTextBtn"),
    removeTextBtn: document.getElementById("removeTextBtn"),

    textBoldBtn: document.getElementById('textBoldBtn'),
    textItalicBtn: document.getElementById('textItalicBtn'),
    textUnderlineBtn: document.getElementById('textUnderlineBtn'),
    textAlignSelect: document.getElementById('textAlignSelect'),

    brushColorInput: document.getElementById('brushColorInput'),
    brushSizeInput: document.getElementById('brushSizeInput'),
    toggleDrawModeBtn: document.getElementById('toggleDrawModeBtn'),
    clearDrawingBtn: document.getElementById('clearDrawingBtn'),

    downloadStripBtn: document.getElementById("downloadStripBtn"),
    downloadFormatSelect: document.getElementById('downloadFormatSelect'),
    printStripBtn: document.getElementById('printStripBtn'),
    
    retakeBtn: document.getElementById("retakeBtn"),

    noPhotosMessage: document.getElementById('noPhotosMessage'),
    downloadSpinner: document.getElementById('downloadSpinner'),
};

// --- Global Application State Variables ---
// Encapsulates all dynamic data that defines the current state of the editor.
const appState = {
    capturedPhotosBase64: [],      // Base64 data URLs of photos from capture page
    preloadedCapturedImages: [],   // Preloaded Image objects of captured photos

    stickers: [],                  // Array of active sticker objects on the canvas
    texts: [],                     // Array of active text objects on the canvas
    drawings: [],                  // Array of drawing path segments
    
    selectedTitle: '',             // New state variable for the selected title

    currentStripConfig: null,      // The layout configuration for the current strip (e.g., for 3 photos)
    selectedDraggable: null,       // Reference to the currently selected sticker or text object
    currentFrameImg: null,         // The loaded Image object of the selected frame

    isDragging: false,             // True when an object/handle is actively being dragged
    dragType: null,                // Type of interaction: 'drag', 'resize-tl', 'rotate', etc.

    // Variables to store initial state for drag/resize/rotate calculations
    initialMouseX: 0,
    initialMouseY: 0,
    initialObjX: 0,
    initialObjY: 0,
    initialObjWidth: 0,
    initialObjHeight: 0,
    initialObjAngle: 0,

    isDrawMode: false,             // True when drawing mode is active
    lastDrawX: 0,                  // Last X coordinate for drawing a continuous line
    lastDrawY: 0,                  // Last Y coordinate for drawing a continuous line
};

// --- Utility Functions ---

/**
 * Logs an analytics event to the console.
 * This function acts as a placeholder for actual analytics tracking.
 * @param {string} eventName - The name of the event (e.g., "Sticker Added").
 * @param {object} [details={}] - Optional details related to the event.
 */
function logAnalytics(eventName, details = {}) {
    console.log(`ANALYTICS: ${eventName} -`, { timestamp: new Date().toISOString(), ...details });
}

/**
 * Loads an image from a URL and returns a Promise.
 * @param {string} src - The URL of the image.
 * @returns {Promise<HTMLImageElement>} A promise that resolves with the loaded Image object.
 */
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img); // Resolve when image loads successfully
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`)); // Reject if image fails to load
        img.src = src; // Set the source to start loading
    });
}

/**
 * Preloads all captured photo images for faster rendering.
 */
async function preloadCapturedPhotos() {
    appState.preloadedCapturedImages = []; // Clear any previous preloaded images
    const promises = appState.capturedPhotosBase64.map(src => loadImage(src));
    try {
        appState.preloadedCapturedImages = await Promise.all(promises);
        logAnalytics("Captured_Photos_Preloaded", { count: appState.preloadedCapturedImages.length });
    } catch (error) {
        console.error("Error preloading captured images:", error);
        logAnalytics("Captured_Photos_Preload_Failed", { error: error.message });
    }
}

/**
 * Gets mouse or touch coordinates relative to the canvas.
 * Accounts for canvas scaling (display size vs. internal resolution).
 * @param {MouseEvent | TouchEvent} event - The mouse or touch event.
 * @returns {{x: number, y: number}} - Coordinates {x, y} on the canvas.
 */
function getEventCoordinates(event) {
    const rect = DOMElements.photoCanvas.getBoundingClientRect(); // Get canvas size and position in viewport
    const canvasActualWidth = DOMElements.photoCanvas.width;    // Actual canvas resolution
    const canvasActualHeight = DOMElements.photoCanvas.height;

    // Calculate scaling factors if canvas display size differs from its internal resolution
    const scaleX = canvasActualWidth / rect.width;
    const scaleY = canvasActualHeight / rect.height;

    let clientX, clientY;
    // Handle touch events for mobile
    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else { // Handle mouse events
        clientX = event.clientX;
        clientY = event.clientY;
    }

    // Adjust coordinates based on canvas position and scaling
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    return { x, y };
}

/**
 * Checks if a point (px, py) is inside a rotated rectangle (draggable object).
 * This is crucial for hit testing on stickers and text.
 * @param {number} px - X coordinate of the point.
 * @param {number} py - Y coordinate of the point.
 * @param {object} obj - The draggable object ({x, y, width, height, angle}).
 * @returns {boolean} True if the point is inside the rotated rectangle.
 */
function isPointInRotatedRect(px, py, obj) {
    // If no rotation, a simple AABB check is sufficient and faster
    if (obj.angle === 0) {
        return px >= obj.x && px <= obj.x + obj.width &&
               py >= obj.y && py <= obj.y + obj.height;
    }

    // Translate point and rectangle center to origin
    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;

    const translatedPx = px - centerX;
    const translatedPy = py - centerY;

    // Rotate the point back by the object's negative angle
    const cosAngle = Math.cos(-obj.angle);
    const sinAngle = Math.sin(-obj.angle);

    const rotatedPx = translatedPx * cosAngle - translatedPy * sinAngle;
    const rotatedPy = translatedPx * sinAngle + translatedPy * cosAngle;

    // Now check if the rotated point is within the *unrotated* bounds of the rectangle
    return rotatedPx >= -obj.width / 2 && rotatedPx <= obj.width / 2 &&
           rotatedPy >= -obj.height / 2 && rotatedPy <= obj.height / 2;
}

/**
 * Checks if a point (px, py) is within any of the draggable object's handles (resize or rotate).
 * Uses a larger hit area for touch friendliness.
 * @param {number} px - X coordinate of the point.
 * @param {number} py - Y coordinate of the point.
 * @param {object} obj - The draggable object ({x, y, width, height, angle}).
 * @returns {string|null} The type of handle ('resize-tl', 'rotate', etc.) or null if no handle is hit.
 */
function checkHandleClick(px, py, obj) {
    // Increased handle size for better touch usability
    const handleSize = 30; // Original was 12
    const halfHandleSize = handleSize / 2;
    const rotateHandleOffset = 30; // Distance of rotate handle from object top edge

    // Calculate object's center for rotation
    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;

    // Translate point to object's local space (relative to its center)
    const translatedPx = px - centerX;
    const translatedPy = py - centerY;

    // Rotate point back by the object's negative angle to align with its unrotated bounding box
    const cosAngle = Math.cos(-obj.angle);
    const sinAngle = Math.sin(-obj.angle);

    const rotatedPx = translatedPx * cosAngle - translatedPy * sinAngle;
    const rotatedPy = translatedPx * sinAngle + translatedPy * cosAngle;

    // Translate point back to top-left corner as origin for handle checks
    const localPx = rotatedPx + obj.width / 2;
    const localPy = rotatedPy + obj.height / 2;

    // Define the bounding boxes for each handle in local coordinates
    // Increased hit area by adjusting x/y offsets for handles for more forgiving taps.
    const handles = {
        'resize-tl': { x: -halfHandleSize, y: -halfHandleSize, width: handleSize, height: handleSize },
        'resize-tr': { x: obj.width - halfHandleSize, y: -halfHandleSize, width: handleSize, height: handleSize },
        'resize-bl': { x: -halfHandleSize, y: obj.height - halfHandleSize, width: handleSize, height: handleSize },
        'resize-br': { x: obj.width - halfHandleSize, y: obj.height - halfHandleSize, width: handleSize, height: handleSize },
        'rotate': { x: obj.width / 2 - halfHandleSize, y: -rotateHandleOffset - halfHandleSize, width: handleSize, height: handleSize }
    };

    // Check if the local point hits any handle
    for (const type in handles) {
        const hRect = handles[type];
        if (localPx >= hRect.x && localPx <= hRect.x + hRect.width &&
            localPy >= hRect.y && localPy <= hRect.y + hRect.height) {
            return type; // Return the type of handle hit
        }
    }
    return null; // No handle hit
}

// --- UI Feedback & State Update Functions ---

/**
 * Displays an info or error message in the canvas area.
 * @param {string} mainMsg - The primary message.
 * @param {'info'|'error'} [type='info'] - The type of message for styling.
 * @param {string} [subMsg=''] - An optional secondary message (can contain HTML).
 */
function displayCanvasMessage(mainMsg, type = 'info', subMsg = '') {
    // Ensure the message container is visible
    DOMElements.noPhotosMessage.style.display = 'block';
    DOMElements.photoCanvas.style.display = 'none'; // Hide canvas if message is shown
    
    // Set message content
    const mainP = DOMElements.noPhotosMessage.querySelector('p:not(.sub-message)');
    const subP = DOMElements.noPhotosMessage.querySelector('.sub-message');

    mainP.textContent = mainMsg;
    subP.innerHTML = subMsg; // Use innerHTML to allow for links and formatting
    
    // Apply styling based on type
    if (type === 'error') {
        mainP.style.color = '#dc3545'; // A red color for errors
    } else {
        mainP.style.color = '#6c757d'; // Default info color
    }
}

/**
 * Hides the info message and shows the canvas.
 */
function hideCanvasMessage() {
    DOMElements.noPhotosMessage.style.display = 'none';
    DOMElements.photoCanvas.style.display = 'block';
}

/**
 * Initializes the dropdown menu for available photo strip frames based on the number of photos.
 */
function initializeFrameOptions(photoCount) {
    const config = STRIP_LAYOUT_CONFIGS[photoCount];
    if (!config) {
        console.error(`No strip configuration found for ${photoCount} photos.`);
        return;
    }

    // Clear existing options
    DOMElements.frameSelect.innerHTML = '';

    // Add options from the configuration
    config.availableFrames.forEach(frame => {
        const option = document.createElement('option');
        option.value = frame.src;
        option.textContent = frame.name;
        DOMElements.frameSelect.appendChild(option);
    });

    // Set the first option as the default selection
    if (config.availableFrames.length > 0) {
        DOMElements.frameSelect.value = config.availableFrames[0].src;
    }
}

/**
 * Handles the frame selection change, re-drawing the canvas.
 */
async function handleFrameSelection(event) {
    const selectedSrc = event.target.value;
    if (selectedSrc) {
        try {
            appState.currentFrameImg = await loadImage(selectedSrc);
            logAnalytics("Frame_Selected", { frame: selectedSrc });
        } catch (error) {
            console.error(error);
            appState.currentFrameImg = null; // Fallback to no frame
        }
    } else {
        appState.currentFrameImg = null;
    }
    redrawCanvas();
}

/**
 * Draws the photo strip title onto the canvas based on the selected title.
 */
function drawStripTitleToCanvas() {
    if (!appState.selectedTitle) {
        return;
    }

    const ctx = DOMElements.ctx;
    const canvas = DOMElements.photoCanvas;
    const stripConfig = appState.currentStripConfig;

    // Center text horizontally
    const textX = canvas.width / 2;

    // Position text 66px from the bottom of the strip
    const textY = canvas.height - 66;

    ctx.save();
    ctx.font = "30px 'Bebas Neue'";
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add a subtle text shadow for better readability on varied backgrounds
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillText(appState.selectedTitle, textX, textY);
    ctx.restore();
}

/**
 * Handles the title selection change, updating the app state and re-drawing the canvas.
 */
function handleTitleSelection(event) {
    appState.selectedTitle = event.target.value;
    logAnalytics("Title_Selected", { title: appState.selectedTitle });
    redrawCanvas();
}

/**
 * Redraws all elements on the canvas: background, photos, frame, stickers, text, and drawings.
 * This is the core rendering loop for the editing interface.
 */
function redrawCanvas() {
    const ctx = DOMElements.ctx;
    const canvas = DOMElements.photoCanvas;
    const stripConfig = appState.currentStripConfig;

    if (!ctx || !stripConfig) return;

    // 1. Clear the entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Draw background color
    ctx.fillStyle = stripConfig.defaultBackground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 3. Draw the main photo strip frame image
    if (appState.currentFrameImg) {
        ctx.drawImage(appState.currentFrameImg, 0, 0, canvas.width, canvas.height);
    }
    
    // 4. Draw the captured photos inside their respective frames
    appState.preloadedCapturedImages.forEach((img, index) => {
        const frame = stripConfig.frames[index];
        if (frame && img) {
            ctx.drawImage(img, frame.x, frame.y, frame.width, frame.height);
        }
    });

    // 5. Draw the selected title
    drawStripTitleToCanvas();

    // 6. Draw all custom texts
    appState.texts.forEach(textObj => drawText(ctx, textObj));

    // 7. Draw all stickers
    appState.stickers.forEach(sticker => drawSticker(ctx, sticker));

    // 8. Draw the drawing paths
    drawDrawings();

    // 9. Draw selection handles for the currently selected draggable object (if any)
    drawSelectionHandles();
}

/**
 * Main initialization function.
 * Sets up the canvas, loads photos from local storage, and attaches event listeners.
 */
async function initializeEditor() {
    // 1. Get canvas context
    DOMElements.ctx = DOMElements.photoCanvas.getContext('2d');
    
    // 2. Load captured photos from session storage
    const storedPhotos = sessionStorage.getItem('capturedPhotos');
    if (storedPhotos) {
        appState.capturedPhotosBase64 = JSON.parse(storedPhotos);
        logAnalytics("Photos_Loaded_From_Session", { count: appState.capturedPhotosBase64.length });
    } else {
        // No photos, show message and exit
        displayCanvasMessage('No photos found.', 'error', 'Please go back to <a href="capture-page/capture-page.html">capture photos</a> first.');
        return;
    }

    // 3. Determine strip layout based on photo count
    const photoCount = appState.capturedPhotosBase64.length;
    appState.currentStripConfig = STRIP_LAYOUT_CONFIGS[photoCount.toString()];
    if (!appState.currentStripConfig) {
        displayCanvasMessage('Invalid photo count for strip.', 'error', 'Only 1, 2, 3, 4, or 6 photos are supported. Please <a href="capture-page/capture-page.html">retake your photos</a>.');
        return;
    }

    // 4. Set canvas dimensions
    DOMElements.photoCanvas.width = appState.currentStripConfig.stripWidth;
    DOMElements.photoCanvas.height = appState.currentStripConfig.stripHeight;

    // 5. Preload images
    await preloadCapturedPhotos();
    
    // 6. Populate UI controls based on the selected strip config
    initializeFrameOptions(photoCount);
    // Add event listeners for the new title select
    DOMElements.titleSelect.addEventListener('change', handleTitleSelection);
    DOMElements.frameSelect.addEventListener('change', handleFrameSelection);
    
    // 7. Initial drawing of the canvas
    await handleFrameSelection({ target: { value: DOMElements.frameSelect.value } });
    
    // 8. Attach other event listeners
    attachEventListeners();

    logAnalytics("Editor_Initialized", { photoCount: photoCount });
}
document.addEventListener("DOMContentLoaded", initializeEditor);
