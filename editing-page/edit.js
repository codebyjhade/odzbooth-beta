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
            { id: 'option1', src: 'assets/strip-frame-2-photos-option1.png', name: 'Pastel Pink' },
            { id: 'option2', src: 'assets/strip-frame-2-photos-option2.png', name: 'Light Coral' },
            { id: 'option3', src: 'assets/strip-frame-2-photos-option3.png', name: 'Ice Blue' },
            { id: 'option3', src: 'assets/strip-frame-2-photos-option4.png', name: 'White Smoke' }
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
            { id: 'option1', src: 'assets/strip-frame-3-photos-option1.png', name: 'Ice Blue' },
            { id: 'option2', src: 'assets/strip-frame-3-photos-option2.png', name: 'Pastel Pink' },
            { id: 'option3', src: 'assets/strip-frame-3-photos-option3.png', name: 'White Smoke' },
            { id: 'option3', src: 'assets/strip-frame-3-photos-option4.png', name: 'Light Coral' }
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
            { id: 'option1', src: 'assets/strip-frame-4-photos-option1.png', name: 'Light Coral' },
            { id: 'option2', src: 'assets/strip-frame-4-photos-option2.png', name: 'Pastel Pink' },
            { id: 'option3', src: 'assets/strip-frame-4-photos-option3.png', name: 'White Smoke' },
            { id: 'option3', src: 'assets/strip-frame-4-photos-option4.png', name: 'Ice Blue' }
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
            { id: 'option1', src: 'assets/strip-frame-6-photos-option1.png', name: 'White Smoke' },
            { id: 'option2', src: 'assets/strip-frame-6-photos-option2.png', name: 'Light Coral' },
            { id: 'option2', src: 'assets/strip-frame-6-photos-option2.png', name: 'Ice Blue' },
            { id: 'option2', src: 'assets/strip-frame-6-photos-option2.png', name: 'Pastel Pink' }
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
    DOMElements.photoCanvas.style.display = 'none'; // Hide canvas if message is showing
    DOMElements.downloadSpinner.classList.add('hidden-spinner'); // Hide spinner if message is showing
    
    DOMElements.noPhotosMessage.className = `info-message ${type}`; // Apply styling class

    // Update main message paragraph
    let mainParagraph = DOMElements.noPhotosMessage.querySelector('p:first-child');
    if (!mainParagraph) {
        mainParagraph = document.createElement('p');
        DOMElements.noPhotosMessage.prepend(mainParagraph);
    }
    mainParagraph.innerText = mainMsg;

    // Update sub-message paragraph
    let subMsgElement = DOMElements.noPhotosMessage.querySelector('.sub-message');
    if (!subMsgElement) {
        subMsgElement = document.createElement('p');
        subMsgElement.classList.add('sub-message');
        DOMElements.noPhotosMessage.appendChild(subMsgElement);
    }
    subMsgElement.innerHTML = subMsg; // Use innerHTML for links
}

/**
 * Hides the canvas message and shows the canvas.
 */
function hideCanvasMessage() {
    DOMElements.noPhotosMessage.style.display = 'none';
    if (DOMElements.downloadSpinner.classList.contains('hidden-spinner')) {
        DOMElements.photoCanvas.style.display = 'block';
    }
}

/**
 * Shows/hides the download processing spinner overlay.
 * @param {boolean} show - True to show the spinner, false to hide it.
 */
function toggleDownloadSpinner(show) {
    if (show) {
        DOMElements.downloadSpinner.classList.remove('hidden-spinner');
        DOMElements.photoCanvas.style.display = 'none';
        DOMElements.noPhotosMessage.style.display = 'none';
    } else {
        DOMElements.downloadSpinner.classList.add('hidden-spinner');
        if (DOMElements.noPhotosMessage.style.display === 'none') {
            DOMElements.photoCanvas.style.display = 'block';
        }
    }
}

/**
 * Populates the frame selection dropdown with available frames for the current strip layout.
 * @param {Array<Object>} frames - An array of frame objects from `STRIP_LAYOUT_CONFIGS`.
 */
function populateFrameOptions(frames) {
    DOMElements.frameSelect.innerHTML = ''; // Clear existing options
    if (frames && frames.length > 0) {
        frames.forEach(frame => {
            const option = document.createElement('option');
            option.value = frame.src; // Use src as the value
            option.textContent = frame.name;
            DOMElements.frameSelect.appendChild(option);
        });
        DOMElements.frameSelect.disabled = false;
        // Set the first frame as default if no value is set
        if (!DOMElements.frameSelect.value) {
            DOMElements.frameSelect.value = frames[0].src;
        }
    } else {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No frames available';
        DOMElements.frameSelect.appendChild(option);
        DOMElements.frameSelect.disabled = true;
    }
}

/**
 * Updates the text editing controls (input, color, font, size, styles)
 * to reflect the properties of the currently `selectedDraggable` text object.
 * It also handles enabling/disabling these controls.
 */
function updateTextControlsFromSelection() {
    const isTextSelected = appState.selectedDraggable && appState.selectedDraggable.type === 'text';
    // Use selected text object's properties or default settings if none selected
    const textObj = isTextSelected ? appState.selectedDraggable : DEFAULT_TEXT_SETTINGS;

    // The main text input field should *always* be enabled for new text entry.
    // Its value will be set to the selected text's content, or cleared if nothing is selected.
    DOMElements.textInput.value = isTextSelected ? textObj.content : '';
    DOMElements.textInput.disabled = false; // Always enable for new input

    DOMElements.textColorInput.value = textObj.color;
    DOMElements.textFontSelect.value = textObj.font;
    DOMElements.textSizeInput.value = textObj.size;
    DOMElements.textAlignSelect.value = textObj.align;

    // Update active states for style buttons
    DOMElements.textBoldBtn.classList.toggle('active', isTextSelected && textObj.isBold);
    DOMElements.textItalicBtn.classList.toggle('active', isTextSelected && textObj.isItalic);
    DOMElements.textUnderlineBtn.classList.toggle('active', isTextSelected && textObj.isUnderline);

    // Controls that should ONLY be enabled when a text object IS SELECTED (for editing existing text)
    const textEditingControls = [
        DOMElements.textColorInput, DOMElements.textFontSelect, DOMElements.textSizeInput,
        DOMElements.textAlignSelect, DOMElements.textBoldBtn, DOMElements.textItalicBtn, DOMElements.textUnderlineBtn
    ];
    textEditingControls.forEach(control => {
        if (control) control.disabled = !isTextSelected;
    });

    // The 'Add Text' button should also always be enabled so you can add new text
    if (DOMElements.addTextBtn) {
        DOMElements.addTextBtn.disabled = false; 
    }
    
    // Explicitly manage remove button state - enabled only when a text object is selected
    DOMElements.removeTextBtn.disabled = !isTextSelected;
}

/**
 * Updates the sticker controls (remove button) based on whether a sticker is selected.
 */
function updateStickerControlsFromSelection() {
    // The remove sticker button should only be enabled when a sticker is currently selected.
    DOMElements.removeStickerBtn.disabled = !(appState.selectedDraggable && appState.selectedDraggable.type === 'sticker');
}

/**
 * Updates the canvas cursor based on the current interaction mode (draw, grab, resize, rotate).
 * @param {string} cursorType - The type of cursor to set ('default', 'grab', 'grabbing', 'resize-nwse', etc.).
 */
function updateCanvasCursor(cursorType) {
    // Only update cursor if not in drawing mode or if it's explicitly about drawing mode
    if (appState.isDrawMode && cursorType !== 'draw-mode' && cursorType !== 'default') {
        DOMElements.canvasContainer.classList.add('draw-mode'); // Maintain crosshair if in draw mode
        return;
    }
    // Remove all specific cursor classes first
    DOMElements.canvasContainer.classList.remove(
        'resize-ns', 'resize-ew', 'resize-nwse', 'resize-nesw',
        'rotate', 'grab', 'grabbing', 'draw-mode'
    );
    // Add the desired cursor class
    if (cursorType && cursorType !== 'default') {
        DOMElements.canvasContainer.classList.add(cursorType);
    }
}


// --- Canvas Drawing Functions ---

/**
 * Clears the canvas and redraws all elements (background, photos, frame, stickers, text, drawings).
 * This is the main rendering loop.
 */
async function renderCanvas() {
    DOMElements.ctx.clearRect(0, 0, DOMElements.photoCanvas.width, DOMElements.photoCanvas.height);

    // Draw background color
    if (appState.currentStripConfig && appState.currentStripConfig.defaultBackground) {
        DOMElements.ctx.fillStyle = appState.currentStripConfig.defaultBackground;
        DOMElements.ctx.fillRect(0, 0, DOMElements.photoCanvas.width, DOMElements.photoCanvas.height);
    }

    // Draw the selected frame image
    await drawFrameOnCanvas(DOMElements.ctx);

    // Draw captured photos within their respective frames
    drawPhotosOnCanvas(DOMElements.ctx);

    // Draw all active stickers
    drawDraggableObjectsOnCanvas(DOMElements.ctx, appState.stickers);

    // Draw all active text elements
    drawDraggableObjectsOnCanvas(DOMElements.ctx, appState.texts);

    // Draw all user drawings
    drawDrawingsOnCanvas(DOMElements.ctx, appState.drawings);
    
    // Draw the date on the canvas
    drawDateOnCanvas(DOMElements.ctx);

    // Draw selection handles for the currently selected draggable object
    if (appState.selectedDraggable && !appState.isDrawMode) {
        drawSelectionHandles(DOMElements.ctx, appState.selectedDraggable);
    }
}

/**
 * Draws the selected frame image onto the canvas.
 * @param {CanvasRenderingContext2D} targetCtx - The canvas context to draw on.
 */
async function drawFrameOnCanvas(targetCtx) {
    if (DOMElements.frameSelect.value) {
        try {
            // Load the frame image if not already loaded, or use the preloaded one
            if (!appState.currentFrameImg || appState.currentFrameImg.src !== DOMElements.frameSelect.value) {
                appState.currentFrameImg = await loadImage(DOMElements.frameSelect.value);
            }
            targetCtx.drawImage(appState.currentFrameImg, 0, 0, DOMElements.photoCanvas.width, DOMElements.photoCanvas.height);
        } catch (error) {
            console.warn(`WARNING: Could not load selected strip frame image: ${DOMElements.frameSelect.value}. Falling back to default background.`, error);
            targetCtx.fillStyle = appState.currentStripConfig.defaultBackground || '#CCCCCC';
            targetCtx.fillRect(0, 0, DOMElements.photoCanvas.width, DOMElements.photoCanvas.height);
        }
    } else {
        // Fallback if no frame selected or loading failed
        targetCtx.fillStyle = appState.currentStripConfig.defaultBackground || '#CCCCCC';
        targetCtx.fillRect(0, 0, DOMElements.photoCanvas.width, DOMElements.photoCanvas.height);
    }
}

/**
 * Draws captured photos onto the canvas, fitting them into their allocated frames.
 * @param {CanvasRenderingContext2D} targetCtx - The canvas context to draw on.
 */
function drawPhotosOnCanvas(targetCtx) {
    const numPhotosToDisplay = appState.capturedPhotosBase64.length;
    const framesToUse = appState.currentStripConfig ? appState.currentStripConfig.frames : [];

    for (let i = 0; i < Math.min(numPhotosToDisplay, framesToUse.length); i++) {
        const frame = framesToUse[i];
        if (!frame) {
            console.warn(`WARNING: No frame configuration found for photo index ${i}. Skipping drawing photo.`);
            continue;
        }

        const img = appState.preloadedCapturedImages[i];

        if (img && img.complete) {
            targetCtx.drawImage(img, frame.x, frame.y, frame.width, frame.height);
        } else {
            // Fallback for images not yet preloaded (should be rare)
            console.warn(`Preloaded image ${i} not ready. Attempting to load on demand.`);
            const imgSrc = appState.capturedPhotosBase64[i];
            loadImage(imgSrc).then(loadedImg => {
                targetCtx.drawImage(loadedImg, frame.x, frame.y, frame.width, frame.height);
                renderCanvas(); // Re-render once image is loaded
            }).catch(error => {
                console.error(`ERROR: Failed to draw photo ${i + 1}. Image source might be corrupt. Details:`, error);
                // Draw a placeholder for failed images
                targetCtx.fillStyle = '#ccc';
                targetCtx.fillRect(frame.x, frame.y, frame.width, frame.height);
                targetCtx.fillStyle = 'red';
                targetCtx.font = '12px Arial';
                targetCtx.textAlign = 'center';
                targetCtx.fillText('Error', frame.x + frame.width / 2, frame.y + frame.height / 2);
            });
        }
    }
}

/**
 * Draws an array of draggable objects (stickers or text) onto the canvas.
 * Handles rotation and checks for image readiness.
 * @param {CanvasRenderingContext2D} targetCtx - The canvas context to draw on.
 * @param {Array<object>} objects - Array of sticker or text objects to draw.
 */
function drawDraggableObjectsOnCanvas(targetCtx, objects) {
    objects.forEach(obj => {
        targetCtx.save(); // Save the canvas state before applying transformations

        // Translate to object's center, rotate, then translate back
        // This makes rotation pivot around the object's center
        const centerX = obj.x + obj.width / 2;
        const centerY = obj.y + obj.height / 2;
        targetCtx.translate(centerX, centerY);
        targetCtx.rotate(obj.angle);
        targetCtx.translate(-centerX, -centerY);

        if (obj.type === 'sticker') {
            const imgToDraw = obj.img || (() => { // Load image if not already loaded (should be preloaded)
                const img = new Image();
                img.src = obj.src;
                obj.img = img; // Store for future use
                return img;
            })();

            if (imgToDraw.complete) {
                targetCtx.drawImage(imgToDraw, obj.x, obj.y, obj.width, obj.height);
            } else {
                imgToDraw.onload = () => renderCanvas(); // Re-render when image loads
            }
        } else if (obj.type === 'text') {
            let fontStyle = '';
            if (obj.isItalic) fontStyle += 'italic ';
            if (obj.isBold) fontStyle += 'bold ';

            targetCtx.font = `${fontStyle}${obj.size}px ${obj.font}`;
            targetCtx.textAlign = obj.align;
            targetCtx.textBaseline = 'middle'; // Center text vertically

            // Store measured width/height for hit testing and handle drawing
            const textMetrics = targetCtx.measureText(obj.content);
            obj.width = textMetrics.width;
            obj.height = obj.size; // Approximation for text height

            let textDrawX = obj.x; // Adjust drawing position based on alignment
            if (obj.align === 'center') {
                textDrawX = obj.x + obj.width / 2;
            } else if (obj.align === 'right') {
                textDrawX = obj.x + obj.width;
            }

            // Ensure no lingering shadow/outline properties from previous draws
            targetCtx.shadowColor = 'rgba(0,0,0,0)';
            targetCtx.shadowBlur = 0;
            targetCtx.shadowOffsetX = 0;
            targetCtx.shadowOffsetY = 0;
            targetCtx.lineWidth = 0; // Clear outline properties from previous draws

            // Draw filled text
            targetCtx.fillStyle = obj.color;
            targetCtx.fillText(obj.content, textDrawX, obj.y + obj.height / 2);

            // Draw underline (if enabled)
            if (obj.isUnderline) {
                targetCtx.beginPath();
                targetCtx.strokeStyle = obj.color;
                targetCtx.lineWidth = obj.size / 15; // Proportional underline thickness
                const underlineY = obj.y + obj.height / 2 + obj.size / 2 - (obj.size / 15) / 2; // Position below text

                let underlineStartX = obj.x;
                // Adjust underline start X based on text alignment
                if (obj.align === 'center') {
                    underlineStartX = textDrawX - textMetrics.width / 2;
                } else if (obj.align === 'right') {
                    underlineStartX = textDrawX - textMetrics.width;
                }
                
                targetCtx.moveTo(underlineStartX, underlineY);
                targetCtx.lineTo(underlineStartX + textMetrics.width, underlineY);
                targetCtx.stroke();
            }
        }
        targetCtx.restore(); // Restore the canvas state
    });
}

/**
 * Draws all user-created drawing paths onto the canvas.
 * @param {CanvasRenderingContext2D} targetCtx - The canvas context to draw on.
 * @param {Array<object>} drawingsData - Array of drawing objects, each containing points, color, and size.
 */
function drawDrawingsOnCanvas(targetCtx, drawingsData) {
    drawingsData.forEach(drawing => {
        targetCtx.beginPath();
        targetCtx.strokeStyle = drawing.color;
        targetCtx.lineWidth = drawing.size;
        targetCtx.lineCap = 'round'; // Round caps for smoother lines
        targetCtx.lineJoin = 'round'; // Round joins for smoother corners

        if (drawing.points.length > 0) {
            targetCtx.moveTo(drawing.points[0].x, drawing.points[0].y);
            for (let i = 1; i < drawing.points.length; i++) {
                targetCtx.lineTo(drawing.points[i].x, drawing.points[i].y);
            }
        }
        targetCtx.stroke();
    });
}

/**
 * Draws the selection rectangle and interaction handles (resize, rotate) around the selected draggable object.
 * Uses increased handle size for better touch usability.
 * @param {CanvasRenderingContext2D} targetCtx - The canvas context to draw on.
 * @param {object} obj - The currently selected draggable object.
 */
function drawSelectionHandles(targetCtx, obj) {
    targetCtx.save(); // Save context state before handle drawing

    // Apply object's rotation to the context so handles are drawn relative to its rotated state
    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;
    targetCtx.translate(centerX, centerY);
    targetCtx.rotate(obj.angle);
    targetCtx.translate(-centerX, -centerY);

    // Draw dashed selection border
    targetCtx.strokeStyle = '#00FFFF'; // Cyan
    targetCtx.lineWidth = 2;
    targetCtx.setLineDash([5, 5]); // Dashed line
    targetCtx.strokeRect(obj.x, obj.y, obj.width, obj.height);
    targetCtx.setLineDash([]); // Reset line dash for subsequent draws

    // Increased handle size for better touch usability
    const handleSize = 30; // Original was 12
    const halfHandleSize = handleSize / 2;
    const rotateHandleOffset = 30; // Distance of rotate handle from object top edge

    targetCtx.fillStyle = 'white';
    targetCtx.strokeStyle = 'black';
    targetCtx.lineWidth = 1;

    // Draw corner resize handles (squares)
    targetCtx.fillRect(obj.x - halfHandleSize, obj.y - halfHandleSize, handleSize, handleSize); // TL
    targetCtx.strokeRect(obj.x - halfHandleSize, obj.y - halfHandleSize, handleSize, handleSize);
    
    targetCtx.fillRect(obj.x + obj.width - halfHandleSize, obj.y - halfHandleSize, handleSize, handleSize); // TR
    targetCtx.strokeRect(obj.x + obj.width - halfHandleSize, obj.y - halfHandleSize, handleSize, handleSize);
    
    targetCtx.fillRect(obj.x - halfHandleSize, obj.y + obj.height - halfHandleSize, handleSize, handleSize); // BL
    targetCtx.strokeRect(obj.x - halfHandleSize, obj.y + obj.height - halfHandleSize, handleSize, handleSize);
    
    targetCtx.fillRect(obj.x + obj.width - halfHandleSize, obj.y + obj.height - halfHandleSize, handleSize, handleSize); // BR
    targetCtx.strokeRect(obj.x + obj.width - halfHandleSize, obj.y + obj.height - halfHandleSize, handleSize, handleSize);

    // Draw rotate handle (circle above the top center)
    const rotateHandleX = obj.x + obj.width / 2;
    const rotateHandleY = obj.y - rotateHandleOffset; // Position above the object
    targetCtx.beginPath();
    targetCtx.arc(rotateHandleX, rotateHandleY, halfHandleSize, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.stroke();

    // Draw line from object to rotate handle
    targetCtx.beginPath();
    targetCtx.moveTo(obj.x + obj.width / 2, obj.y); // Center of top edge
    targetCtx.lineTo(rotateHandleX, rotateHandleY + halfHandleSize); // Center of rotate handle
    targetCtx.stroke();

    targetCtx.restore(); // Restore context to original state
}

/**
 * Draws the current Philippine date (YYYY.MM.DD) at the bottom of the strip.
 * @param {CanvasRenderingContext2D} targetCtx - The canvas context to draw on.
 */
function drawDateOnCanvas(targetCtx) {
    // Get current date and format it
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, pad with '0'
    const day = String(now.getDate()).padStart(2, '0'); // Pad with '0'
    const dateString = `${year}.${month}.${day}`;

    // Get canvas dimensions
    const canvasWidth = targetCtx.canvas.width;
    const canvasHeight = targetCtx.canvas.height;

    // Set text properties
    targetCtx.font = "21.3px 'Poppins', sans-serif";
    targetCtx.fillStyle = '#333333'; // Dark gray, good for most backgrounds
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'bottom';

    // Calculate position (centered, near the bottom)
    const x = canvasWidth / 2;
    const y = canvasHeight - 15; // 15px padding from the bottom edge

    // Draw the text
    targetCtx.fillText(dateString, x, y);
}


// --- Draggable Object Management ---

/**
 * Adds a new sticker to the canvas.
 * @param {string} stickerSrc - The source URL of the sticker image.
 */
async function addSticker(stickerSrc) {
    if (!stickerSrc) {
        alert("Please select a sticker first.");
        return;
    }

    try {
        const img = await loadImage(stickerSrc);
        const initialWidth = 100; // Default size for new stickers
        const initialHeight = (img.naturalHeight / img.naturalWidth) * initialWidth;
        const newSticker = {
            id: Date.now(), // Unique ID for tracking
            img: img, // Loaded Image object
            src: stickerSrc,
            x: (DOMElements.photoCanvas.width / 2) - (initialWidth / 2), // Center horizontally
            y: (DOMElements.photoCanvas.height / 2) - (initialHeight / 2), // Center vertically
            width: initialWidth,
            height: initialHeight,
            originalWidth: img.naturalWidth, // Store original dimensions for aspect ratio
            originalHeight: img.naturalHeight,
            angle: 0, // No initial rotation
            type: 'sticker' // Identifier for object type
        };
        appState.stickers.push(newSticker);
        appState.selectedDraggable = newSticker; // Select the newly added sticker
        renderCanvas(); // Redraw canvas with new sticker
        updateStickerControlsFromSelection(); // Update UI to enable remove button
        logAnalytics('Sticker_Added', { src: stickerSrc });
    } catch (error) {
        console.error("Failed to add sticker:", error);
        alert("Error loading sticker image. Please ensure the file exists in the 'assets' folder.");
        logAnalytics('Sticker_Add_Failed', { src: stickerSrc, error: error.message });
    }
}

/**
 * Removes the currently selected sticker from the canvas.
 */
function removeSelectedSticker() {
    if (appState.selectedDraggable && appState.selectedDraggable.type === 'sticker') {
        // Filter out the selected sticker from the array
        appState.stickers = appState.stickers.filter(s => s !== appState.selectedDraggable);
        appState.selectedDraggable = null; // Deselect the object
        renderCanvas(); // Redraw canvas
        updateStickerControlsFromSelection(); // Update UI to disable remove button
        logAnalytics('Sticker_Removed');
    } else {
        alert("No sticker selected to remove. Click on a sticker on the canvas first to select it.");
    }
}

/**
 * Adds a new text object to the canvas with current UI settings.
 */
function addText() {
    const textContent = DOMElements.textInput.value.trim();
    if (!textContent) {
        alert("Please enter some text to add.");
        return;
    }

    // Temporarily set context font to measure text accurately
    // Ensure font style (bold/italic) is considered for accurate measurement
    const tempFontStyle = `${DOMElements.textBoldBtn.classList.contains('active') ? 'bold ' : ''}` +
                         `${DOMElements.textItalicBtn.classList.contains('active') ? 'italic ' : ''}`;
    DOMElements.ctx.font = `${tempFontStyle}${parseInt(DOMElements.textSizeInput.value)}px ${DOMElements.textFontSelect.value}`;
    const textMetrics = DOMElements.ctx.measureText(textContent);
    const textWidth = textMetrics.width;
    const textHeight = parseInt(DOMElements.textSizeInput.value); // Use font size as height approximation

    const newTextObj = {
        id: Date.now() + 1, // Unique ID
        content: textContent,
        x: (DOMElements.photoCanvas.width / 2) - (textWidth / 2), // Center horizontally
        y: (DOMElements.photoCanvas.height / 2) - (textHeight / 2), // Center vertically
        color: DOMElements.textColorInput.value,
        font: DOMElements.textFontSelect.value,
        size: textHeight, // Storing initial size and current size
        align: DOMElements.textAlignSelect.value,
        isBold: DOMElements.textBoldBtn.classList.contains('active'),
        isItalic: DOMElements.textItalicBtn.classList.contains('active'),
        isUnderline: DOMElements.textUnderlineBtn.classList.contains('active'),
        width: textWidth, // Measured width (will be updated on render)
        height: textHeight, // Measured height (will be updated on render)
        originalSize: textHeight, // Store original font size for scaling
        angle: 0,
        type: 'text' // Identifier for object type
    };

    appState.texts.push(newTextObj);
    DOMElements.textInput.value = ""; // Clear input after adding
    appState.selectedDraggable = newTextObj; // Select the newly added text
    renderCanvas(); // Redraw canvas
    updateTextControlsFromSelection(); // Update controls to reflect new selection (enables editing controls)
    logAnalytics('Text_Added', { content: textContent });
}

/**
 * Removes the currently selected text object from the canvas.
 */
function removeSelectedText() {
    if (appState.selectedDraggable && appState.selectedDraggable.type === 'text') {
        appState.texts = appState.texts.filter(t => t !== appState.selectedDraggable);
        appState.selectedDraggable = null; // Deselect
        renderCanvas();
        updateTextControlsFromSelection(); // Update UI to disable editing controls and remove button
        logAnalytics('Text_Removed');
    } else {
        alert("No text selected to remove. Click on a text element on the canvas first to select it.");
    }
}

/**
 * Toggles drawing mode on/off.
 * When entering drawing mode, any selected draggable is deselected.
 */
function toggleDrawMode() {
    appState.isDrawMode = !appState.isDrawMode;
    if (appState.isDrawMode) {
        updateCanvasCursor('draw-mode'); // Change cursor to crosshair
        DOMElements.toggleDrawModeBtn.classList.add('active'); // Highlight button
        appState.selectedDraggable = null; // Deselect any object when entering draw mode
        updateTextControlsFromSelection(); // Update UI (disables text editing controls)
        updateStickerControlsFromSelection(); // Update UI (disables remove sticker button)
        logAnalytics('Draw_Mode_Enabled');
    } else {
        updateCanvasCursor('default'); // Revert cursor
        DOMElements.toggleDrawModeBtn.classList.remove('active'); // Unhighlight button
        logAnalytics('Draw_Mode_Disabled');
    }
    renderCanvas(); // Re-render to clear selection handles if draw mode is entered
}

/**
 * Clears all drawings from the canvas after user confirmation.
 */
function clearAllDrawings() {
    if (confirm('Are you sure you want to clear all drawings? This cannot be undone.')) {
        appState.drawings = []; // Clear the drawings array
        renderCanvas(); // Redraw canvas without drawings
        logAnalytics('All_Drawings_Cleared');
    }
}


// --- Canvas Interaction Logic (Mouse & Touch) ---

/**
 * Handles the mouse/touch down event on the canvas.
 * Determines if an object or handle is clicked, or initiates drawing mode.
 * @param {MouseEvent | TouchEvent} e - The event object.
 */
function handleCanvasPointerDown(e) {
    e.preventDefault(); // Prevent default browser actions (like scrolling on touch)
    const { x, y } = getEventCoordinates(e);

    if (appState.isDrawMode) {
        // Start a new drawing path
        appState.isDragging = true;
        appState.lastDrawX = x;
        appState.lastDrawY = y;
        appState.drawings.push({
            color: DOMElements.brushColorInput.value,
            size: parseInt(DOMElements.brushSizeInput.value),
            points: [{ x, y }] // Start the path with the current point
        });
        logAnalytics('Drawing_Started');
    } else { // Handle object dragging/resizing/rotation
        // If an object is already selected, check if a handle was clicked
        if (appState.selectedDraggable) {
            appState.dragType = checkHandleClick(x, y, appState.selectedDraggable);
            if (appState.dragType) {
                appState.isDragging = true;
                // Store initial state for transformation calculations
                appState.initialMouseX = x;
                appState.initialMouseY = y;
                appState.initialObjX = appState.selectedDraggable.x;
                appState.initialObjY = appState.selectedDraggable.y;
                appState.initialObjWidth = appState.selectedDraggable.width;
                appState.initialObjHeight = appState.selectedDraggable.height;
                appState.initialObjAngle = appState.selectedDraggable.angle;
                logAnalytics('Draggable_Handle_Clicked', { type: appState.dragType });
                return; // Stop here if a handle was clicked
            }
        }

        // If no handle clicked, or no object selected, check if any draggable object was clicked
        // Iterate in reverse order to select the topmost object if objects overlap
        const allDraggables = [...appState.stickers, ...appState.texts].slice().reverse();
        let clickedOnDraggable = false;
        for (const obj of allDraggables) {
            if (isPointInRotatedRect(x, y, obj)) {
                appState.selectedDraggable = obj;
                appState.isDragging = true;
                appState.dragType = 'drag'; // Default drag type when clicking the object body
                appState.dragOffsetX = x - obj.x; // Offset for smooth dragging
                appState.dragOffsetY = y - obj.y;

                // Move the selected object to the end of its respective array
                // This ensures it's drawn last (on top) and is selected first on subsequent clicks
                if (obj.type === 'sticker') {
                    appState.stickers = appState.stickers.filter(s => s !== obj);
                    appState.stickers.push(obj);
                } else if (obj.type === 'text') {
                    appState.texts = appState.texts.filter(t => t !== obj);
                    appState.texts.push(obj);
                }
                clickedOnDraggable = true;
                logAnalytics('Draggable_Selected_And_Dragged', { type: obj.type, id: obj.id });
                break; // Found and selected an object, stop checking
            }
        }

        // If no draggable object was clicked, deselect any currently selected object
        if (!clickedOnDraggable) {
            appState.selectedDraggable = null;
            appState.dragType = null;
            logAnalytics('Canvas_Clicked_Deselected_Object');
        }
    }
    renderCanvas(); // Re-render to show/hide selection handles
    // Update UI for selection state (this is crucial for enabling/disabling remove/edit buttons)
    updateTextControlsFromSelection();
    updateStickerControlsFromSelection();
}

/**
 * Handles the mouse/touch move event on the canvas.
 * Continues drawing, dragging, resizing, or rotating the selected object.
 * @param {MouseEvent | TouchEvent} e - The event object.
 */
function handleCanvasPointerMove(e) {
    const { x, y } = getEventCoordinates(e);

    // If in drawing mode and dragging, continue the current drawing path
    if (appState.isDrawMode && appState.isDragging) {
        const lastDrawing = appState.drawings[appState.drawings.length - 1];
        if (lastDrawing) { // Ensure there's a current drawing path
            lastDrawing.points.push({ x, y });
            renderCanvas();
            appState.lastDrawX = x;
            appState.lastDrawY = y;
        }
        return; // Stop further processing if drawing
    }

    // Update cursor based on hover if not currently dragging and not in draw mode
    if (!appState.isDragging && !appState.isDrawMode) {
        updateCanvasCursor('default'); // Start with default cursor
        if (appState.selectedDraggable) {
            const handleType = checkHandleClick(x, y, appState.selectedDraggable);
            if (handleType) {
                // Set specific cursor for resize/rotate handles
                if (handleType.startsWith('resize')) {
                    updateCanvasCursor(handleType === 'resize-tl' || handleType === 'resize-br' ? 'resize-nwse' : 'resize-nesw');
                } else if (handleType === 'rotate') {
                    updateCanvasCursor('rotate');
                }
            } else if (isPointInRotatedRect(x, y, appState.selectedDraggable)) {
                updateCanvasCursor('grab'); // Set grab cursor if hovering over selected object body
            }
        }
    }

    // If not dragging or no object selected, nothing more to do
    if (!appState.isDragging || !appState.selectedDraggable) return;

    e.preventDefault(); // Prevent default browser actions (like text selection or scrolling)
    updateCanvasCursor('grabbing'); // Set grabbing cursor while actively interacting

    const obj = appState.selectedDraggable;

    if (appState.dragType === 'drag') {
        // Update object's position directly
        obj.x = x - appState.dragOffsetX;
        obj.y = y - appState.dragOffsetY;
        logAnalytics('Draggable_Dragging', { type: obj.type, id: obj.id });
    } else if (appState.dragType.startsWith('resize')) {
        // Calculate new dimensions and position based on mouse movement relative to object's initial state
        const initialCenterX = appState.initialObjX + appState.initialObjWidth / 2;
        const initialCenterY = appState.initialObjY + appState.initialObjHeight / 2;

        // Translate current mouse position to be relative to the object's initial center
        const currentMouseXTranslated = x - initialCenterX;
        const currentMouseYTranslated = y - initialCenterY;

        // Rotate current mouse position back by the object's initial negative angle
        // This effectively un-rotates the mouse movement relative to the object's original axis
        const cosInitialAngle = Math.cos(-appState.initialObjAngle);
        const sinInitialAngle = Math.sin(-appState.initialObjAngle);

        const rotatedMouseX = currentMouseXTranslated * cosInitialAngle - currentMouseYTranslated * sinInitialAngle;
        const rotatedMouseY = currentMouseXTranslated * sinInitialAngle + currentMouseYTranslated * cosInitialAngle;

        let newWidth = appState.initialObjWidth;
        let newHeight = appState.initialObjHeight;
        let newX = appState.initialObjX;
        let newY = appState.initialObjY;

        // Calculate the change in mouse position *in the rotated object's local space*
        // This is key for consistent resizing regardless of object rotation
        let dx_rotated = rotatedMouseX - ((appState.initialMouseX - initialCenterX) * cosInitialAngle - (appState.initialMouseY - initialCenterY) * sinInitialAngle);
        let dy_rotated = rotatedMouseY - ((appState.initialMouseX - initialCenterX) * sinInitialAngle + (appState.initialMouseY - initialCenterY) * cosInitialAngle);

        // Adjust width, height, and position based on the handle being dragged
        // We'll prioritize change in width/height based on which corner is dragged
        switch (appState.dragType) {
            case 'resize-br': // Bottom-right
                newWidth = appState.initialObjWidth + dx_rotated;
                newHeight = appState.initialObjHeight + dy_rotated;
                break;
            case 'resize-tl': // Top-left
                newWidth = appState.initialObjWidth - dx_rotated;
                newHeight = appState.initialObjHeight - dy_rotated;
                newX = appState.initialObjX + dx_rotated * Math.cos(appState.initialObjAngle) - dy_rotated * Math.sin(appState.initialObjAngle);
                newY = appState.initialObjY + dy_rotated * Math.cos(appState.initialObjAngle) + dx_rotated * Math.sin(appState.initialObjAngle);
                break;
            case 'resize-tr': // Top-right
                newWidth = appState.initialObjWidth + dx_rotated;
                newHeight = appState.initialObjHeight - dy_rotated;
                newY = appState.initialObjY + dy_rotated * Math.cos(appState.initialObjAngle) + dx_rotated * Math.sin(appState.initialObjAngle);
                break;
            case 'resize-bl': // Bottom-left
                newWidth = appState.initialObjWidth - dx_rotated;
                newHeight = appState.initialObjHeight + dy_rotated;
                newX = appState.initialObjX + dx_rotated * Math.cos(appState.initialObjAngle) - dy_rotated * Math.sin(appState.initialObjAngle);
                break;
        }

        // Maintain aspect ratio for stickers
        if (obj.type === 'sticker' && obj.originalWidth && obj.originalHeight) {
            const aspectRatio = obj.originalWidth / obj.originalHeight;
            
            // Prioritize change in the larger dimension to calculate the other, preventing extreme stretching
            if (Math.abs(newWidth - appState.initialObjWidth) > Math.abs(newHeight - appState.initialObjHeight)) {
                newHeight = newWidth / aspectRatio;
            } else {
                newWidth = newHeight * aspectRatio;
            }

            // Recalculate position to keep the original anchor point fixed while maintaining aspect ratio
            // This is complex due to rotation, but essential for correct behavior.
            const newCenterX = initialCenterX + (newWidth - appState.initialObjWidth) / 2 * Math.cos(appState.initialObjAngle) - (newHeight - appState.initialObjHeight) / 2 * Math.sin(appState.initialObjAngle);
            const newCenterY = initialCenterY + (newWidth - appState.initialObjWidth) / 2 * Math.sin(appState.initialObjAngle) + (newHeight - appState.initialObjHeight) / 2 * Math.cos(appState.initialObjAngle);

            newX = newCenterX - newWidth / 2;
            newY = newCenterY - newHeight / 2;
        }
        
        // Ensure minimum size (prevent objects from disappearing)
        newWidth = Math.max(20, newWidth); // Increased minimum size for better usability
        newHeight = Math.max(20, newHeight);

        // Update object properties
        obj.width = newWidth;
        obj.height = newHeight;
        obj.x = newX;
        obj.y = newY;

        // If it's a text object, scale its font size proportionally
        if (obj.type === 'text') {
            const newTextSize = (obj.originalSize || appState.initialObjHeight) * (newHeight / appState.initialObjHeight);
            obj.size = Math.max(10, Math.round(newTextSize)); // Ensure minimum font size
            updateTextControlsFromSelection(); // Update the size input in the UI
        }
        logAnalytics('Draggable_Resizing', { type: obj.type, id: obj.id, width: obj.width, height: obj.height });

    } else if (appState.dragType === 'rotate') {
        // Calculate new angle based on mouse position relative to object's center
        const obj = appState.selectedDraggable;
        const centerX = appState.initialObjX + appState.initialObjWidth / 2;
        const centerY = appState.initialObjY + appState.initialObjHeight / 2;

        const initialVectorX = appState.initialMouseX - centerX;
        const initialVectorY = appState.initialMouseY - centerY;

        const currentVectorX = x - centerX;
        const currentVectorY = y - centerY;

        const initialAngle = Math.atan2(initialVectorY, initialVectorX); // Angle of initial mouse position
        const currentAngle = Math.atan2(currentVectorY, currentVectorX); // Angle of current mouse position

        const angleDelta = currentAngle - initialAngle; // Change in angle
        obj.angle = appState.initialObjAngle + angleDelta; // Apply delta to initial angle
        logAnalytics('Draggable_Rotating', { type: obj.type, id: obj.id, angle: obj.angle });
    }
    renderCanvas(); // Re-render canvas to show changes
}

/**
 * Handles the mouse/touch up event on the canvas.
 * Ends any active dragging, resizing, or drawing operation.
 * @param {MouseEvent | TouchEvent} e - The event object.
 */
function handleCanvasPointerUp(e) {
    if (appState.isDragging && appState.isDrawMode) {
        logAnalytics('Drawing_Ended');
    } else if (appState.isDragging && appState.selectedDraggable) {
        logAnalytics('Draggable_Interaction_Ended', { type: appState.dragType, id: appState.selectedDraggable.id });
    }
    appState.isDragging = false;
    appState.dragType = null;
    if (!appState.isDrawMode) { // Only reset cursor if not in draw mode
        updateCanvasCursor('default');
    }
    renderCanvas(); // Re-render to ensure handles are drawn correctly after interaction
}

// --- Touch Event Handlers (Simplified for single touch) ---
// These functions map touch events to the more general pointer handlers.

function handleTouchStart(e) {
    if (e.touches.length === 1) { // Only handle single touch for now
        e.preventDefault(); // Prevent default browser actions (like scrolling/zooming)
        // Pass the raw Touch event object directly to handleCanvasPointerDown
        handleCanvasPointerDown(e); 
    }
}

function handleTouchMove(e) {
    if (e.touches.length === 1 && appState.isDragging) { // Only allow move if dragging
        e.preventDefault(); // Prevent scrolling
        // Pass the raw Touch event object directly to handleCanvasPointerMove
        handleCanvasPointerMove(e);
    }
}

function handleTouchEnd(e) {
    handleCanvasPointerUp(e);
}


// --- Editing Tool Event Handlers (UI controls) ---

/**
 * Updates the selected text object's properties based on UI input changes.
 * This generic handler can be used for text content, color, font, and size.
 * @param {string} property - The property to update (e.g., 'content', 'color', 'font', 'size').
 * @param {*} value - The new value for the property.
 */
function updateSelectedTextProperty(property, value) {
    if (appState.selectedDraggable && appState.selectedDraggable.type === 'text') {
        appState.selectedDraggable[property] = value;

        // Recalculate text width and height if content, font, or size changes
        // Also if bold/italic state changes, as it affects text metrics
        if (property === 'content' || property === 'font' || property === 'size' || property === 'isBold' || property === 'isItalic') {
            const currentTextObj = appState.selectedDraggable;
            const tempFontStyle = `${currentTextObj.isBold ? 'bold ' : ''}${currentTextObj.isItalic ? 'italic ' : ''}`;
            DOMElements.ctx.font = `${tempFontStyle}${currentTextObj.size}px ${currentTextObj.font}`;
            currentTextObj.width = DOMElements.ctx.measureText(currentTextObj.content).width;
            currentTextObj.height = currentTextObj.size; // Simple approximation for height based on font size
        }
        renderCanvas(); // Re-render to apply changes
        logAnalytics('Text_Property_Updated', { property: property, value: value });
    }
}


// --- Download, Print Logic ---

/**
 * Creates a composite image of the photo strip on a temporary canvas,
 * including photos, frames, stickers, text, and drawings.
 * This temporary canvas is used for download, QR, and print.
 * @returns {Promise<HTMLCanvasElement>} A promise that resolves with the final composite canvas.
 */
async function createFinalStripCanvas() {
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = DOMElements.photoCanvas.width;
    finalCanvas.height = DOMElements.photoCanvas.height;
    const finalCtx = finalCanvas.getContext('2d');

    // Temporarily clear selection on the main editing canvas for a clean render for output.
    // This prevents selection handles from appearing on the downloaded/printed image.
    const tempSelected = appState.selectedDraggable;
    appState.selectedDraggable = null;

    // Draw background color
    if (appState.currentStripConfig && appState.currentStripConfig.defaultBackground) {
        finalCtx.fillStyle = appState.currentStripConfig.defaultBackground;
        finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    }

    // Draw the selected frame image (this is an asynchronous operation, so we await it).
    // The `drawFrameOnCanvas` function is designed to draw to any provided context.
    await drawFrameOnCanvas(finalCtx);

    // Draw captured photos within their respective frames on the final canvas.
    // Ensure all preloaded images are fully loaded before drawing.
    const numPhotosToDisplay = appState.capturedPhotosBase64.length;
    const framesToUse = appState.currentStripConfig ? appState.currentStripConfig.frames : [];
    for (let i = 0; i < Math.min(numPhotosToDisplay, framesToUse.length); i++) {
        const frame = framesToUse[i];
        if (!frame) continue; // Skip if frame configuration is missing.

        const img = appState.preloadedCapturedImages[i];
        if (img && img.complete) { // Check if image is loaded and complete.
            finalCtx.drawImage(img, frame.x, frame.y, frame.width, frame.height);
        } else {
            // Fallback: If for some reason a preloaded image isn't ready (should be rare),
            // try to load it on demand for the final output.
            try {
                const loadedImg = await loadImage(appState.capturedPhotosBase64[i]);
                finalCtx.drawImage(loadedImg, frame.x, frame.y, frame.width, frame.height);
            } catch (error) {
                console.error(`ERROR: Failed to draw photo ${i + 1} on final composite for print/download:`, error);
                // Optionally draw a placeholder for failed images on the final output.
            }
        }
    }

    // Draw all active stickers, text elements, and user drawings on the final canvas.
    // These functions also draw to any provided context.
    drawDraggableObjectsOnCanvas(finalCtx, appState.stickers);
    drawDraggableObjectsOnCanvas(finalCtx, appState.texts);
    drawDrawingsOnCanvas(finalCtx, appState.drawings);
    
    // Draw the date on the final canvas
    drawDateOnCanvas(finalCtx);

    // Restore the selection on the main editing canvas after the final image is created.
    // This is important so the user's current selection state is not lost.
    appState.selectedDraggable = tempSelected;
    renderCanvas(); // Re-render the main canvas to bring back selection handles if any.

    return finalCanvas; // Return the temporary canvas containing the final image.
}


/**
 * Handles the download of the photo strip.
 */
async function downloadStrip() {
    if (appState.capturedPhotosBase64.length === 0) {
        alert('No photos found. Please capture photos first to download a strip.');
        return;
    }

    toggleDownloadSpinner(true); // Show spinner
    logAnalytics('Download_Started');

    try {
        const finalCanvas = await createFinalStripCanvas(); // Get the composite canvas
        const format = DOMElements.downloadFormatSelect.value.split(';');
        const mimeType = format[0];
        const quality = format.length > 1 ? parseFloat(format[1]) : 1.0;

        const dataURL = finalCanvas.toDataURL(mimeType, quality);
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `odz_photobooth_strip_${Date.now()}.${mimeType.split('/')[1].split(';')[0]}`; // Unique filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        logAnalytics('Download_Successful', { format: mimeType, quality: quality });
    } catch (error) {
        console.error('Error during strip download:', error);
        alert('Failed to download photo strip. See console for details.');
        logAnalytics('Download_Failed', { error: error.message });
    } finally {
        toggleDownloadSpinner(false); // Hide spinner
    }
}


/**
 * Handles the printing of the photo strip.
 * It creates a new window, embeds the image, and then triggers the browser's print dialog.
 */
async function printStrip() {
    // Basic check: Ensure there are photos to print.
    if (appState.capturedPhotosBase64.length === 0) {
        alert('No photos found. Please capture photos first to print.');
        logAnalytics('Print_Request_Failed', { reason: 'No photos captured' });
        return;
    }

    toggleDownloadSpinner(true); // Show a spinner/loading indicator while preparing for print.
    logAnalytics('Print_Request_Started');

    try {
        // Create the final composite image on a temporary canvas.
        const finalCanvas = await createFinalStripCanvas();
        // Get the image as a PNG data URL, which is generally good for print quality.
        const dataURL = finalCanvas.toDataURL('image/png');

        // Open a new browser window.
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            // Check if the pop-up was blocked.
            alert('Print window was blocked. Please allow pop-ups for this site to print.');
            logAnalytics('Print_Request_Failed', { reason: 'Pop-up blocked' });
            return;
        }

        // Write basic HTML and CSS into the new window to display only the image.
        printWindow.document.write('<html><head><title>Print ODZ Booth Strip</title>');
        printWindow.document.write('<style>');
        // CSS to ensure the image fits the page, is centered, and removes default print margins.
        printWindow.document.write(`
            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
            img { max-width: 100%; max-height: 95vh; display: block; margin: 0 auto; object-fit: contain; }
            @page { margin: 0; size: auto; } /* Remove print margins and allow size to auto-adjust */
        `);
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(`<img src="${dataURL}" alt="ODZ Booth Photo Strip">`);
        printWindow.document.close(); // Close the document stream.

        // Wait for the image to load in the new window before triggering the print dialog.
        // This is crucial to ensure the image is ready for the printer.
        printWindow.onload = function() {
            printWindow.focus(); // Bring the new window to the foreground.
            printWindow.print(); // Open the native print dialog.
            // Note: printWindow.close() here might close the window *before* the user interacts with the print dialog.
            // It's often better to let the user close it, or use a setTimeout to close after a delay.
            // For most modern browsers, the print dialog handles its own window closure.
            logAnalytics('Print_Dialog_Opened');
            // If you want to force close after print dialog, use: setTimeout(() => printWindow.close(), 500);
        };
    } catch (error) {
        console.error("Error preparing strip for printing:", error);
        alert("Failed to prepare photo strip for printing. Please try again or check console for details.");
        logAnalytics('Print_Request_Failed', { error: error.message });
    } finally {
        toggleDownloadSpinner(false); // Hide the spinner regardless of success or failure.
    }
}

/**
 * Navigates back to the capture page to retake photos, clearing current editing data.
 */
function retakePhotos() {
    // Clear only captured photos and related counts, but keep layout info
    localStorage.removeItem('capturedPhotos');
    // localStorage.removeItem('selectedPhotoCount'); // Keep this, as layout is chosen
    // localStorage.removeItem('selectedFrameAspectRatio'); // Keep this

    logAnalytics('Retake_Photos_Initiated');
    window.location.href = 'capture-page/capture-page.html';
}


// --- Event Listeners ---

/**
 * Attaches all necessary event listeners to DOM elements.
 */
function setupEventListeners() {
    // Canvas interaction events
    DOMElements.photoCanvas.addEventListener('mousedown', handleCanvasPointerDown);
    DOMElements.photoCanvas.addEventListener('mousemove', handleCanvasPointerMove);
    DOMElements.photoCanvas.addEventListener('mouseup', handleCanvasPointerUp);
    DOMElements.photoCanvas.addEventListener('mouseout', handleCanvasPointerUp); // End interaction if mouse leaves canvas

    DOMElements.photoCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    DOMElements.photoCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    DOMElements.photoCanvas.addEventListener('touchend', handleTouchEnd);
    DOMElements.photoCanvas.addEventListener('touchcancel', handleTouchEnd);

    // Frame selection
    DOMElements.frameSelect.addEventListener('change', async () => {
        // Preload the new frame image to avoid flicker
        try {
            appState.currentFrameImg = await loadImage(DOMElements.frameSelect.value);
            renderCanvas();
            logAnalytics('Frame_Changed', { newFrame: DOMElements.frameSelect.value });
        } catch (error) {
            console.error("Failed to load selected frame:", error);
            alert("Could not load selected frame. Using default background.");
            appState.currentFrameImg = null; // Clear if load fails
            renderCanvas();
            logAnalytics('Frame_Load_Failed', { frameSrc: DOMElements.frameSelect.value, error: error.message });
        }
    });

    // Sticker controls
    DOMElements.addStickerBtn.addEventListener("click", () => addSticker(DOMElements.stickerSelect.value));
    DOMElements.removeStickerBtn.addEventListener("click", removeSelectedSticker);

    // Text controls
    DOMElements.textInput.addEventListener('input', () => updateSelectedTextProperty('content', DOMElements.textInput.value));
    DOMElements.textColorInput.addEventListener('change', () => updateSelectedTextProperty('color', DOMElements.textColorInput.value));
    DOMElements.textFontSelect.addEventListener('change', () => updateSelectedTextProperty('font', DOMElements.textFontSelect.value));
    DOMElements.textSizeInput.addEventListener('change', () => updateSelectedTextProperty('size', parseInt(DOMElements.textSizeInput.value)));
    DOMElements.textAlignSelect.addEventListener('change', () => updateSelectedTextProperty('align', DOMElements.textAlignSelect.value));
    DOMElements.textBoldBtn.addEventListener('click', () => {
        DOMElements.textBoldBtn.classList.toggle('active');
        updateSelectedTextProperty('isBold', DOMElements.textBoldBtn.classList.contains('active'));
    });
    DOMElements.textItalicBtn.addEventListener('click', () => {
        DOMElements.textItalicBtn.classList.toggle('active');
        updateSelectedTextProperty('isItalic', DOMElements.textItalicBtn.classList.contains('active'));
    });
    DOMElements.textUnderlineBtn.addEventListener('click', () => {
        DOMElements.textUnderlineBtn.classList.toggle('active');
        updateSelectedTextProperty('isUnderline', DOMElements.textUnderlineBtn.classList.contains('active'));
    });

    DOMElements.addTextBtn.addEventListener("click", addText);
    DOMElements.removeTextBtn.addEventListener("click", removeSelectedText);

    // Drawing tool controls
    DOMElements.brushColorInput.addEventListener('input', () => {
        // If actively drawing a new line, update its color
        if (appState.isDrawMode && appState.drawings.length > 0) {
            const lastDrawing = appState.drawings[appState.drawings.length - 1];
            if (lastDrawing && lastDrawing.points.length > 0) { // Only update if drawing has started
                 // If the last point is just being added, update color.
                 // Otherwise, changing color applies to the *next* stroke.
                if (appState.isDragging || lastDrawing.points.length === 1) { 
                    lastDrawing.color = DOMElements.brushColorInput.value;
                }
            }
        }
        renderCanvas(); // Re-render to show immediate color change if applicable
    });
    DOMElements.brushSizeInput.addEventListener('input', () => {
        // If actively drawing a new line, update its size
        if (appState.isDrawMode && appState.drawings.length > 0) {
            const lastDrawing = appState.drawings[appState.drawings.length - 1];
            if (lastDrawing && lastDrawing.points.length > 0) { // Only update if drawing has started
                if (appState.isDragging || lastDrawing.points.length === 1) {
                    lastDrawing.size = parseInt(DOMElements.brushSizeInput.value);
                }
            }
        }
        renderCanvas(); // Re-render to show immediate size change if applicable
    });
    DOMElements.toggleDrawModeBtn.addEventListener('click', toggleDrawMode);
    DOMElements.clearDrawingBtn.addEventListener('click', clearAllDrawings);

    // Download, Print buttons
    DOMElements.downloadStripBtn.addEventListener('click', downloadStrip);
    DOMElements.printStripBtn.addEventListener('click', printStrip);
    
    // Navigation buttons
    DOMElements.retakeBtn.addEventListener('click', retakePhotos);
}

// --- Initialization ---

/**
 * Initializes the editing page: retrieves captured photos, sets up canvas,
 * populates UI controls, and attaches event listeners.
 */
async function initializeEditorPage() {
    // 1. Get the 2D rendering context for the canvas.
    DOMElements.ctx = DOMElements.photoCanvas.getContext("2d");

    // 2. Retrieve captured photos and layout configuration from localStorage
    appState.capturedPhotosBase64 = JSON.parse(localStorage.getItem('capturedPhotos') || '[]');
    const selectedPhotoCountStr = localStorage.getItem('selectedPhotoCount');
    const selectedPhotoCount = parseInt(selectedPhotoCountStr, 10);

    // Determine the strip configuration based on selected photo count
    const configKey = isNaN(selectedPhotoCount) || selectedPhotoCount < 1 || selectedPhotoCount > 6 || selectedPhotoCount === 5
        ? '3' // Default to 3 photos if invalid/missing
        : selectedPhotoCount.toString();
    appState.currentStripConfig = STRIP_LAYOUT_CONFIGS[configKey];

    // Handle cases where no photos are found or layout is invalid
    if (appState.capturedPhotosBase64.length === 0 || !appState.currentStripConfig || typeof appState.currentStripConfig.stripWidth === 'undefined') {
        displayCanvasMessage(
            'No photos found or invalid layout.',
            'info',
            'Please go back to <a href="capture-page/capture-page.html">capture photos</a> first.'
        );
        // Disable all editing controls if no photos or invalid setup
        Object.values(DOMElements).forEach(el => {
            // Check if element exists before trying to disable
            if (el && typeof el.disabled !== 'undefined') el.disabled = true;
        });
        DOMElements.retakeBtn.disabled = false; // Re-enable retake button always
        
        // IMPORTANT: Ensure text input and add button are ALWAYS enabled, even with no photos
        if (DOMElements.textInput) DOMElements.textInput.disabled = false; 
        if (DOMElements.addTextBtn) DOMElements.addTextBtn.disabled = false;
        
        logAnalytics('Editor_Page_Load_Failed', { reason: 'No photos or invalid config' });
        return;
    }

    // Set canvas dimensions based on the determined strip configuration
    DOMElements.photoCanvas.width = appState.currentStripConfig.stripWidth;
    DOMElements.photoCanvas.height = appState.currentStripConfig.stripHeight;

    // Preload captured images for efficient drawing
    await preloadCapturedPhotos();

    // Populate frame options in the dropdown
    populateFrameOptions(appState.currentStripConfig.availableFrames);

    // If a frame is already selected or default, preload it
    if (DOMElements.frameSelect.value) {
        try {
            appState.currentFrameImg = await loadImage(DOMElements.frameSelect.value);
        } catch (error) {
            console.error("Failed to preload initial frame:", error);
            // Will fallback to default background in drawFrameOnCanvas
        }
    }


    // Set initial values for text and drawing controls
    // Using `if (DOMElements.element)` checks before assignment for robustness,
    // though ideally all elements are guaranteed to exist at this point.
    if (DOMElements.textColorInput) DOMElements.textColorInput.value = DEFAULT_TEXT_SETTINGS.color;
    if (DOMElements.textFontSelect) DOMElements.textFontSelect.value = DEFAULT_TEXT_SETTINGS.font;
    if (DOMElements.textSizeInput) DOMElements.textSizeInput.value = DEFAULT_TEXT_SETTINGS.size;
    if (DOMElements.textAlignSelect) DOMElements.textAlignSelect.value = DEFAULT_TEXT_SETTINGS.align;
    if (DOMElements.brushColorInput) DOMElements.brushColorInput.value = DEFAULT_DRAWING_SETTINGS.color;
    if (DOMElements.brushSizeInput) DOMElements.brushSizeInput.value = DEFAULT_DRAWING_SETTINGS.size;

    // Initially disable controls that depend on selection or specific modes
    // This call will correctly disable the *editing* controls.
    updateTextControlsFromSelection(); 
    // IMPORTANT: Explicitly ensure text input and add button are ENABLED after the above call
    // This handles the case where there ARE photos, but no text is selected initially.
    if (DOMElements.textInput) DOMElements.textInput.disabled = false; 
    if (DOMElements.addTextBtn) DOMElements.addTextBtn.disabled = false;
    
    updateStickerControlsFromSelection(); // This will disable remove sticker button initially
    if (DOMElements.toggleDrawModeBtn) DOMElements.toggleDrawModeBtn.classList.remove('active'); // Ensure draw button isn't active by default

    setupEventListeners(); // Attach all event listeners
    renderCanvas(); // Initial render of the photo strip
    logAnalytics('Editor_Page_Loaded_Successfully', { layout: configKey });
}

// Ensure the `initializeEditorPage` function runs only after the entire HTML document is loaded.
// This prevents errors where JavaScript tries to find elements before they exist on the page.
document.addEventListener('DOMContentLoaded', initializeEditorPage);
