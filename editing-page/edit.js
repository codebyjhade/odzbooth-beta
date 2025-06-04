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
            { id: 'option1', src: 'assets/strip-frame-2-photos-option1.png', name: 'option-1' },
            { id: 'option2', src: 'assets/strip-frame-2-photos-option2.png', name: 'option-2' },
            { id: 'option3', src: 'assets/strip-frame-2-photos-option3.png', name: 'option-3' }
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
            { id: 'option1', src: 'assets/strip-frame-3-photos-option1.png', name: 'option-1' },
            { id: 'option2', src: 'assets/strip-frame-3-photos-option2.png', name: 'option-2' },
            { id: 'option3', src: 'assets/strip-frame-3-photos-option3.png', name: 'option-3' }
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
            { id: 'option1', src: 'assets/strip-frame-4-photos-option1.png', name: 'option-1' },
            { id: 'option2', src: 'assets/strip-frame-4-photos-option2.png', name: 'option-2' },
            { id: 'option3', src: 'assets/strip-frame-4-photos-option3.png', name: 'option-3' }
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
            { id: 'option1', src: 'assets/strip-frame-6-photos-option1.png', name: 'option-1' },
            { id: 'option2', src: 'assets/strip-frame-6-photos-option2.png', name: 'option-2' }
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

    // NEW: Background color input
    backgroundColorInput: document.getElementById("backgroundColorInput"),
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

    // NEW: Custom background color for the strip
    customBackgroundColor: '#CCCCCC', 
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

    // Draw background color (MODIFIED to use customBackgroundColor)
    if (appState.customBackgroundColor) {
        DOMElements.ctx.fillStyle = appState.customBackgroundColor;
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
            // Fallback to custom background color if frame loading fails
            targetCtx.fillStyle = appState.customBackgroundColor || '#CCCCCC';
            targetCtx.fillRect(0, 0, DOMElements.photoCanvas.width, DOMElements.photoCanvas.height);
        }
    } else {
        // Fallback if no frame selected or loading failed
        targetCtx.fillStyle = appState.customBackgroundColor || '#CCCCCC';
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
            targetCtx.fillStyle = obj.color;
            targetCtx.font = `${obj.isBold ? 'bold ' : ''}${obj.isItalic ? 'italic ' : ''}${obj.size}px ${obj.font}`;
            targetCtx.textAlign = obj.align;
            targetCtx.textBaseline = 'top'; // Align text to the top of its bounding box

            // Calculate actual text X position based on alignment
            let textX = obj.x;
            if (obj.align === 'center') {
                textX = obj.x + obj.width / 2;
            } else if (obj.align === 'right') {
                textX = obj.x + obj.width;
            }
            targetCtx.fillText(obj.content, textX, obj.y);

            // Draw underline if active
            if (obj.isUnderline) {
                const textMetrics = targetCtx.measureText(obj.content);
                const underlineY = obj.y + obj.size + 2; // Position below text
                let underlineX = obj.x;
                if (obj.align === 'center') {
                    underlineX = obj.x + obj.width / 2 - textMetrics.width / 2;
                } else if (obj.align === 'right') {
                    underlineX = obj.x + obj.width - textMetrics.width;
                }
                targetCtx.fillRect(underlineX, underlineY, textMetrics.width, 2); // 2px thick underline
            }
        }
        targetCtx.restore(); // Restore the canvas state
    });
}

/**
 * Draws all stored drawing paths onto the canvas.
 * @param {CanvasRenderingContext2D} targetCtx - The canvas context to draw on.
 * @param {Array<Array<object>>} drawings - Array of drawing paths, each path is an array of segments.
 */
function drawDrawingsOnCanvas(targetCtx, drawings) {
    drawings.forEach(path => {
        if (path.length > 0) {
            targetCtx.beginPath();
            targetCtx.strokeStyle = path[0].color; // Use color from the first segment
            targetCtx.lineWidth = path[0].size;     // Use size from the first segment
            targetCtx.lineCap = 'round';
            targetCtx.lineJoin = 'round';

            targetCtx.moveTo(path[0].x, path[0].y); // Start path at the first point

            for (let i = 1; i < path.length; i++) {
                targetCtx.lineTo(path[i].x, path[i].y); // Draw lines to subsequent points
            }
            targetCtx.stroke(); // Render the path
        }
    });
}

/**
 * Draws selection handles (resize, rotate) around the currently selected draggable object.
 * @param {CanvasRenderingContext2D} targetCtx - The canvas context to draw on.
 * @param {object} obj - The currently selected draggable object.
 */
function drawSelectionHandles(targetCtx, obj) {
    targetCtx.save(); // Save context to isolate transformations for handles

    const handleSize = 12; // Size of the square handles
    const halfHandle = handleSize / 2;

    // Translate and rotate to align with the object's transformed state
    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;
    targetCtx.translate(centerX, centerY);
    targetCtx.rotate(obj.angle);
    targetCtx.translate(-centerX, -centerY);

    // Styling for handles
    targetCtx.fillStyle = 'white';
    targetCtx.strokeStyle = '#33A4C9'; // Primary brand color
    targetCtx.lineWidth = 2;

    // Corner handles (resize)
    const handles = [
        { x: obj.x - halfHandle, y: obj.y - halfHandle },                                   // Top-left
        { x: obj.x + obj.width - halfHandle, y: obj.y - halfHandle },                       // Top-right
        { x: obj.x - halfHandle, y: obj.y + obj.height - halfHandle },                      // Bottom-left
        { x: obj.x + obj.width - halfHandle, y: obj.y + obj.height - halfHandle }           // Bottom-right
    ];

    handles.forEach(handle => {
        targetCtx.fillRect(handle.x, handle.y, handleSize, handleSize);
        targetCtx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });

    // Rotation handle (top center, slightly above object)
    const rotateHandleX = obj.x + obj.width / 2 - halfHandle;
    const rotateHandleY = obj.y - 30 - halfHandle; // 30px above the top edge
    targetCtx.beginPath();
    targetCtx.arc(rotateHandleX + halfHandle, rotateHandleY + halfHandle, halfHandle, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.stroke();

    // Connect rotation handle to the object (optional, for visual clarity)
    targetCtx.beginPath();
    targetCtx.moveTo(obj.x + obj.width / 2, obj.y);
    targetCtx.lineTo(rotateHandleX + halfHandle, rotateHandleY + halfHandle);
    targetCtx.stroke();

    targetCtx.restore(); // Restore to previous canvas state
}


// --- Event Handlers ---

/**
 * Handles the start of a pointer interaction (mouse down or touch start) on the canvas.
 * Determines if a draggable object or a handle is clicked, or initiates drawing mode.
 * @param {MouseEvent|TouchEvent} event - The event object.
 */
function handleCanvasPointerDown(event) {
    event.preventDefault(); // Prevent default touch behaviors like scrolling
    const { x, y } = getEventCoordinates(event);

    appState.isDragging = true;
    appState.initialMouseX = x;
    appState.initialMouseY = y;

    // If in drawing mode, start a new drawing path
    if (appState.isDrawMode) {
        appState.lastDrawX = x;
        appState.lastDrawY = y;
        appState.drawings.push([{
            x: x, y: y,
            color: DOMElements.brushColorInput.value,
            size: parseInt(DOMElements.brushSizeInput.value)
        }]);
        logAnalytics('Drawing_Started');
        return; // Exit as drawing mode takes precedence
    }

    // Check for handle clicks on the currently selected object first
    if (appState.selectedDraggable) {
        const handleType = checkHandleClick(x, y, appState.selectedDraggable);
        if (handleType) {
            appState.dragType = handleType;
            // Store initial object properties for resize/rotate calculations
            appState.initialObjX = appState.selectedDraggable.x;
            appState.initialObjY = appState.selectedDraggable.y;
            appState.initialObjWidth = appState.selectedDraggable.width;
            appState.initialObjHeight = appState.selectedDraggable.height;
            appState.initialObjAngle = appState.selectedDraggable.angle || 0;

            logAnalytics('Handle_Click', { type: handleType });
            renderCanvas(); // Re-render to show active handle (e.g., cursor change)
            return;
        }
    }

    // If no handle was clicked on the selected object, try selecting another object
    appState.selectedDraggable = null; // Deselect previous object by default

    // Check stickers (drawn first, so checked last for selection priority)
    for (let i = appState.stickers.length - 1; i >= 0; i--) {
        const sticker = appState.stickers[i];
        if (isPointInRotatedRect(x, y, sticker)) {
            appState.selectedDraggable = sticker;
            appState.dragType = 'drag';
            // Store initial object position for dragging
            appState.initialObjX = sticker.x;
            appState.initialObjY = sticker.y;
            // Bring selected sticker to front for drawing and interaction
            appState.stickers.splice(i, 1);
            appState.stickers.push(sticker);
            logAnalytics('Sticker_Selected', { src: sticker.src });
            break; // Found a sticker, stop checking
        }
    }

    // If no sticker, check text (drawn second to last)
    if (!appState.selectedDraggable) {
        for (let i = appState.texts.length - 1; i >= 0; i--) {
            const text = appState.texts[i];
            // For text, consider a slightly larger hit area for easier selection
            // Or, implement more sophisticated text hit testing based on rendered glyphs
            if (isPointInRotatedRect(x, y, text)) {
                appState.selectedDraggable = text;
                appState.dragType = 'drag';
                // Store initial object position for dragging
                appState.initialObjX = text.x;
                appState.initialObjY = text.y;
                // Bring selected text to front
                appState.texts.splice(i, 1);
                appState.texts.push(text);
                logAnalytics('Text_Selected', { content: text.content });
                break; // Found text, stop checking
            }
        }
    }

    updateTextControlsFromSelection(); // Update text panel based on new selection
    updateStickerControlsFromSelection(); // Update sticker panel based on new selection
    renderCanvas(); // Re-render to show selection handles if an object was selected
}

/**
 * Handles pointer movement (mouse move or touch move) on the canvas.
 * Performs dragging, resizing, or rotation of the selected object, or continues drawing.
 * @param {MouseEvent|TouchEvent} event - The event object.
 */
function handleCanvasPointerMove(event) {
    event.preventDefault(); // Prevent default touch behaviors like scrolling

    const { x, y } = getEventCoordinates(event);

    if (appState.isDrawMode && appState.isDragging) {
        const currentPath = appState.drawings[appState.drawings.length - 1];
        currentPath.push({ x: x, y: y, color: DOMElements.brushColorInput.value, size: parseInt(DOMElements.brushSizeInput.value) });
        renderCanvas();
        return;
    }

    if (!appState.isDragging || !appState.selectedDraggable) {
        // Update cursor when not dragging or selecting an object based on hover
        if (!appState.isDrawMode) {
            let cursorSet = false;
            if (appState.selectedDraggable) { // Check handles if an object is already selected
                const handleType = checkHandleClick(x, y, appState.selectedDraggable);
                if (handleType) {
                    // Map handle type to CSS cursor
                    const cursorMap = {
                        'resize-tl': 'resize-nwse', 'resize-br': 'resize-nwse',
                        'resize-tr': 'resize-nesw', 'resize-bl': 'resize-nesw',
                        'rotate': 'rotate', // Custom cursor for rotate handle
                    };
                    updateCanvasCursor(cursorMap[handleType]);
                    cursorSet = true;
                }
            }
            // Check if hovering over any draggable object
            if (!cursorSet) {
                const hoveredObject = [...appState.stickers, ...appState.texts].find(obj => isPointInRotatedRect(x, y, obj));
                if (hoveredObject) {
                    updateCanvasCursor('grab');
                    cursorSet = true;
                }
            }
            if (!cursorSet) {
                updateCanvasCursor('default'); // Default cursor if nothing special
            }
        }
        return; // No active drag or selection
    }

    const dx = x - appState.initialMouseX;
    const dy = y - appState.initialMouseY;
    const obj = appState.selectedDraggable;

    // Apply transformations based on dragType
    switch (appState.dragType) {
        case 'drag':
            obj.x = appState.initialObjX + dx;
            obj.y = appState.initialObjY + dy;
            updateCanvasCursor('grabbing'); // Indicate active dragging
            break;
        case 'resize-tl':
            // Calculate new width/height, maintaining aspect ratio if needed (for stickers)
            let newWidthTL = appState.initialObjWidth - dx;
            let newHeightTL = appState.initialObjHeight - dy;

            if (obj.type === 'sticker' && obj.img && obj.img.naturalWidth && obj.img.naturalHeight) {
                const aspectRatio = obj.img.naturalWidth / obj.img.naturalHeight;
                if (Math.abs(dx) > Math.abs(dy)) {
                    newHeightTL = newWidthTL / aspectRatio;
                } else {
                    newWidthTL = newHeightTL * aspectRatio;
                }
            }
            
            // Prevent negative dimensions
            obj.width = Math.max(20, newWidthTL);
            obj.height = Math.max(20, newHeightTL);

            // Adjust position to keep bottom-right fixed
            obj.x = appState.initialObjX + (appState.initialObjWidth - obj.width);
            obj.y = appState.initialObjY + (appState.initialObjHeight - obj.height);
            updateCanvasCursor('resize-nwse');
            break;
        case 'resize-tr':
            let newWidthTR = appState.initialObjWidth + dx;
            let newHeightTR = appState.initialObjHeight - dy;

            if (obj.type === 'sticker' && obj.img && obj.img.naturalWidth && obj.img.naturalHeight) {
                const aspectRatio = obj.img.naturalWidth / obj.img.naturalHeight;
                if (Math.abs(dx) > Math.abs(dy)) {
                    newHeightTR = newWidthTR / aspectRatio;
                } else {
                    newWidthTR = newHeightTR * aspectRatio;
                }
            }

            obj.width = Math.max(20, newWidthTR);
            obj.height = Math.max(20, newHeightTR);
            obj.y = appState.initialObjY + (appState.initialObjHeight - obj.height);
            updateCanvasCursor('resize-nesw');
            break;
        case 'resize-bl':
            let newWidthBL = appState.initialObjWidth - dx;
            let newHeightBL = appState.initialObjHeight + dy;

            if (obj.type === 'sticker' && obj.img && obj.img.naturalWidth && obj.img.naturalHeight) {
                const aspectRatio = obj.img.naturalWidth / obj.img.naturalHeight;
                if (Math.abs(dx) > Math.abs(dy)) {
                    newHeightBL = newWidthBL / aspectRatio;
                } else {
                    newWidthBL = newHeightBL * aspectRatio;
                }
            }
            obj.width = Math.max(20, newWidthBL);
            obj.height = Math.max(20, newHeightBL);
            obj.x = appState.initialObjX + (appState.initialObjWidth - obj.width);
            updateCanvasCursor('resize-nesw');
            break;
        case 'resize-br':
            let newWidthBR = appState.initialObjWidth + dx;
            let newHeightBR = appState.initialObjHeight + dy;

            if (obj.type === 'sticker' && obj.img && obj.img.naturalWidth && obj.img.naturalHeight) {
                const aspectRatio = obj.img.naturalWidth / obj.img.naturalHeight;
                if (Math.abs(dx) > Math.abs(dy)) {
                    newHeightBR = newWidthBR / aspectRatio;
                } else {
                    newWidthBR = newHeightBR * aspectRatio;
                }
            }
            obj.width = Math.max(20, newWidthBR);
            obj.height = Math.max(20, newHeightBR);
            updateCanvasCursor('resize-nwse');
            break;
        case 'rotate':
            const centerX = appState.initialObjX + appState.initialObjWidth / 2;
            const centerY = appState.initialObjY + appState.initialObjHeight / 2;

            // Calculate angle from center to initial mouse, and from center to current mouse
            const angleRad = Math.atan2(y - centerY, x - centerX) - Math.atan2(appState.initialMouseY - centerY, appState.initialMouseX - centerX);
            obj.angle = appState.initialObjAngle + angleRad;
            updateCanvasCursor('rotate'); // Custom rotate cursor
            break;
    }

    renderCanvas(); // Re-render canvas to show updated object position/size/rotation
}

/**
 * Handles the end of a pointer interaction (mouse up or touch end) on the canvas.
 * Resets dragging state.
 * @param {MouseEvent|TouchEvent} event - The event object.
 */
function handleCanvasPointerUp(event) {
    appState.isDragging = false;
    appState.dragType = null;
    updateCanvasCursor('default'); // Reset cursor
    // If drawing mode was active and dragging ended, log it
    if (appState.isDrawMode) {
        logAnalytics('Drawing_Ended');
    }
    renderCanvas(); // Final render after interaction
}

/**
 * Updates a property of the currently selected text object and re-renders the canvas.
 * @param {string} property - The property name (e.g., 'content', 'color').
 * @param {*} value - The new value for the property.
 */
function updateSelectedTextProperty(property, value) {
    if (appState.selectedDraggable && appState.selectedDraggable.type === 'text') {
        appState.selectedDraggable[property] = value;
        renderCanvas();
        logAnalytics('Text_Property_Updated', { property: property, value: value });
    }
}

/**
 * Adds a new text object to the canvas.
 * @param {string} content - The text content.
 */
function addNewText(content) {
    if (!content.trim()) {
        alert("Please enter some text to add.");
        return;
    }

    // Apply default text settings to the new text object
    const newText = {
        id: Date.now(), // Simple unique ID
        type: 'text',
        content: content,
        x: DOMElements.photoCanvas.width / 2 - 100, // Center horizontally
        y: DOMElements.photoCanvas.height / 2 - 20, // Center vertically
        width: 200, // Default width, will be adjusted by textMetrics
        height: DEFAULT_TEXT_SETTINGS.size * 1.2, // Rough height based on font size
        angle: 0,
        color: DOMElements.textColorInput.value || DEFAULT_TEXT_SETTINGS.color,
        font: DOMElements.textFontSelect.value || DEFAULT_TEXT_SETTINGS.font,
        size: parseInt(DOMElements.textSizeInput.value) || DEFAULT_TEXT_SETTINGS.size,
        align: DOMElements.textAlignSelect.value || DEFAULT_TEXT_SETTINGS.align,
        isBold: DOMElements.textBoldBtn.classList.contains('active'),
        isItalic: DOMElements.textItalicBtn.classList.contains('active'),
        isUnderline: DOMElements.textUnderlineBtn.classList.contains('active'),
    };
    appState.texts.push(newText);
    appState.selectedDraggable = newText; // Select the newly added text
    DOMElements.textInput.value = content; // Keep input value if adding it

    // Re-render to draw new text and its handles
    renderCanvas();
    updateTextControlsFromSelection(); // Ensure UI reflects newly selected text
    logAnalytics('Text_Added', { content: content });
}

/**
 * Removes the currently selected text object from the canvas.
 */
function removeSelectedText() {
    if (appState.selectedDraggable && appState.selectedDraggable.type === 'text') {
        // Filter out the selected text from the array
        appState.texts = appState.texts.filter(t => t !== appState.selectedDraggable);
        appState.selectedDraggable = null; // Deselect the object
        renderCanvas(); // Redraw canvas without the removed text
        updateTextControlsFromSelection(); // Update UI to disable remove button
        logAnalytics('Text_Removed');
    }
}

/**
 * Adds a sticker to the canvas.
 * @param {string} stickerSrc - The source URL of the sticker image.
 */
async function addSticker(stickerSrc) {
    if (!stickerSrc) {
        alert("Please select a sticker first.");
        return;
    }
    try {
        const img = await loadImage(stickerSrc);
        const newSticker = {
            id: Date.now(), // Simple unique ID
            type: 'sticker',
            src: stickerSrc,
            img: img, // Store loaded image object
            x: DOMElements.photoCanvas.width / 2 - img.width / 4,  // Centered roughly
            y: DOMElements.photoCanvas.height / 2 - img.height / 4,
            width: img.width / 2,  // Start at half size
            height: img.height / 2,
            angle: 0
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
        renderCanvas(); // Redraw canvas without the removed sticker
        updateStickerControlsFromSelection(); // Update UI to disable remove button
        logAnalytics('Sticker_Removed');
    }
}

/**
 * Toggles drawing mode on/off.
 */
function toggleDrawingMode() {
    appState.isDrawMode = !appState.isDrawMode;
    DOMElements.toggleDrawModeBtn.classList.toggle('active', appState.isDrawMode);
    if (appState.isDrawMode) {
        appState.selectedDraggable = null; // Deselect any object when entering draw mode
        updateCanvasCursor('draw-mode'); // Set crosshair cursor
        logAnalytics('Draw_Mode_Enabled');
    } else {
        updateCanvasCursor('default'); // Reset cursor
        logAnalytics('Draw_Mode_Disabled');
    }
    renderCanvas(); // Re-render to clear selection handles if any
}

/**
 * Clears all drawings from the canvas.
 */
function clearDrawings() {
    if (confirm("Are you sure you want to clear all drawings? This cannot be undone.")) {
        appState.drawings = [];
        renderCanvas();
        logAnalytics('Drawings_Cleared');
    }
}

/**
 * Initiates the download of the photo strip as an image.
 */
function downloadStrip() {
    toggleDownloadSpinner(true); // Show spinner
    logAnalytics('Download_Initiated', { format: DOMElements.downloadFormatSelect.value });

    // Use a small delay to ensure spinner is visible before heavy canvas operations
    setTimeout(() => {
        try {
            const format = DOMElements.downloadFormatSelect.value.split(';')[0];
            const quality = parseFloat(DOMElements.downloadFormatSelect.value.split(';')[1]) || 0.9; // Default to 0.9 for JPEG
            
            // Create a temporary canvas for high-resolution output if needed
            // For simplicity, we'll use the main canvas's current resolution.
            // For print quality, you might want a much higher resolution canvas here.
            
            // Re-render on a temporary canvas if a higher resolution is needed
            // For now, directly use the current canvas for download.
            const dataURL = DOMElements.photoCanvas.toDataURL(format, quality);
            const a = document.createElement('a');
            a.href = dataURL;
            a.download = `ODZ_Booth_Strip_${Date.now()}.${format.split('/')[1]}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            logAnalytics('Download_Completed', { format: format });
        } catch (error) {
            console.error("Error generating download:", error);
            alert("Failed to generate image for download. Please try again.");
            logAnalytics('Download_Failed', { error: error.message });
        } finally {
            toggleDownloadSpinner(false); // Hide spinner
        }
    }, 50); // Short delay
}

/**
 * Initiates the printing of the photo strip.
 * Creates a temporary print window to host the image.
 */
function printStrip() {
    logAnalytics('Print_Initiated');
    const dataURL = DOMElements.photoCanvas.toDataURL('image/png', 1.0); // Always PNG for print quality

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <html>
            <head>
                <title>Print Photo Strip</title>
                <style>
                    body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f0f0f0; }
                    img { max-width: 100%; max-height: 95vh; box-shadow: 0 0 10px rgba(0,0,0,0.2); }
                    @media print {
                        body { margin: 0; padding: 0; }
                        img { width: auto; height: auto; max-width: 100%; max-height: 100%; page-break-after: always; }
                    }
                </style>
            </head>
            <body>
                <img src="${dataURL}" onload="window.print(); window.close();" />
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus(); // Bring the new window into focus
        logAnalytics('Print_Window_Opened');
    } else {
        alert("Could not open print window. Please allow pop-ups for this site.");
        logAnalytics('Print_Failed', { reason: 'Pop-up blocked' });
    }
}


// --- Initialization ---

/**
 * Sets up all necessary event listeners for UI interactions.
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
    DOMElements.addTextBtn.addEventListener("click", () => addNewText(DOMElements.textInput.value));
    DOMElements.removeTextBtn.addEventListener("click", removeSelectedText);

    // Drawing controls
    DOMElements.toggleDrawModeBtn.addEventListener('click', toggleDrawingMode);
    DOMElements.clearDrawingBtn.addEventListener('click', clearDrawings);

    // Download and Print
    DOMElements.downloadStripBtn.addEventListener("click", downloadStrip);
    DOMElements.printStripBtn.addEventListener("click", printStrip);

    // Retake photos button
    DOMElements.retakeBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to take new photos? Your current edits will be lost.")) {
            localStorage.removeItem('capturedPhotos');
            localStorage.removeItem('selectedPhotoCount');
            window.location.href = 'capture-page/capture-page.html'; // Navigate back to capture page
            logAnalytics('Retake_Photos');
        }
    });

    // NEW: Background color picker
    if (DOMElements.backgroundColorInput) {
        DOMElements.backgroundColorInput.addEventListener('input', (event) => {
            appState.customBackgroundColor = event.target.value;
            renderCanvas();
            logAnalytics('Background_Color_Changed', { color: appState.customBackgroundColor });
        });
    }
}

// Touch event normalization
// These functions help translate touch events into a format similar to mouse events
// for reuse with handleCanvasPointerDown/Move/Up.
function handleTouchStart(event) {
    if (event.touches.length === 1) { // Only handle single touch for now
        handleCanvasPointerDown(event);
    }
}

function handleTouchMove(event) {
    if (event.touches.length === 1) {
        handleCanvasPointerMove(event);
    }
}

function handleTouchEnd(event) {
    // Check if no touches remain, then trigger pointer up
    if (event.touches.length === 0) {
        handleCanvasPointerUp(event);
    }
}


/**
 * Main initialization function that runs when the DOM is fully loaded.
 * Sets up canvas, loads data, populates UI, and renders initial state.
 */
async function initializeEditorPage() {
    // 1. Get the 2D rendering context for the canvas.
    DOMElements.ctx = DOMElements.photoCanvas.getContext("2d");

    // 2. Retrieve captured photos and layout configuration from localStorage
    appState.capturedPhotosBase64 = JSON.parse(localStorage.getItem('capturedPhotos') || '[]');
    const selectedPhotoCountStr = localStorage.getItem('selectedPhotoCount');
    const selectedPhotoCount = parseInt(selectedPhotoCountStr, 10);

    // Determine the strip configuration based on selected photo count
    // Defaults to '3' if invalid/missing photo count or if it's '5' (not supported)
    const configKey = isNaN(selectedPhotoCount) || selectedPhotoCount < 1 || selectedPhotoCount > 6 || selectedPhotoCount === 5 ? '3' // Default to 3 photos if invalid/missing
        : selectedPhotoCount.toString();
    appState.currentStripConfig = STRIP_LAYOUT_CONFIGS[configKey];

    // NEW: Initialize custom background color from config or default
    if (appState.currentStripConfig && appState.currentStripConfig.defaultBackground) {
        appState.customBackgroundColor = appState.currentStripConfig.defaultBackground;
    }
    if (DOMElements.backgroundColorInput) {
        DOMElements.backgroundColorInput.value = appState.customBackgroundColor;
    }

    // Handle cases where no photos are found or layout is invalid
    if (appState.capturedPhotosBase64.length === 0 || !appState.currentStripConfig || typeof appState.currentStripConfig.stripWidth === 'undefined') {
        displayCanvasMessage(
            'No photos found or invalid layout.',
            'info',
            'Please go back to <a href="capture-page/capture-page.html">capture photos</a> first.'
        );
        // Disable all interactive controls if no photos
        Object.values(DOMElements).forEach(element => {
            if (element && element !== DOMElements.retakeBtn && element !== DOMElements.noPhotosMessage && element !== DOMElements.canvasContainer && element !== DOMElements.photoCanvas) {
                element.disabled = true;
            }
        });
        // Ensure some critical elements like the canvas container and retake button are still accessible.
        DOMElements.canvasContainer.style.pointerEvents = 'none'; // Disable canvas interaction
        if (DOMElements.retakeBtn) DOMElements.retakeBtn.disabled = false; // Ensure retake button is enabled
        return; // Stop initialization if no photos
    } else {
        hideCanvasMessage(); // Hide message if photos are present
        // Re-enable controls that might have been disabled by a previous state
        Object.values(DOMElements).forEach(element => {
            if (element) {
                element.disabled = false;
            }
        });
        DOMElements.canvasContainer.style.pointerEvents = 'auto'; // Re-enable canvas interaction
    }

    // 3. Set canvas dimensions based on the determined strip configuration
    DOMElements.photoCanvas.width = appState.currentStripConfig.stripWidth;
    DOMElements.photoCanvas.height = appState.currentStripConfig.stripHeight;

    // 4. Preload captured images for efficient drawing
    await preloadCapturedPhotos();

    // 5. Populate the frame selection dropdown
    populateFrameOptions(appState.currentStripConfig.availableFrames);
    // Manually trigger change to load initial frame if one exists
    if (DOMElements.frameSelect.value) {
        try {
            appState.currentFrameImg = await loadImage(DOMElements.frameSelect.value);
        } catch (error) {
            console.error("Initial frame load failed:", error);
            appState.currentFrameImg = null; // Clear if load fails
        }
    }

    // Reset some initial control states
    // The text input should be enabled, but editing controls disabled until text is selected.
    updateTextControlsFromSelection(); 
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
