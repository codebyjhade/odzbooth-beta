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
        stripHeight: 40 + 240 + 20 + 240 + 150, // 2 photos
        frames: [
            { x: 40, y: 40, width: 320, height: 240 },
            { x: 40, y: 40 + 240 + 20, width: 320, height: 240 }
        ],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-2-photos-option1.png', name: 'Dual Classic' },
            { id: 'option2', src: 'assets/strip-frame-2-photos-option2.png', name: 'Minimal Duo' }
        ]
    },
    // Configuration for a 3-photo strip
    '3': {
        stripWidth: 400,
        stripHeight: 40 + 220 + 20 + 220 + 20 + 220 + 150, // 3 photos
        frames: [
            { x: 40, y: 40, width: 320, height: 220 },
            { x: 40, y: 40 + 220 + 20, width: 320, height: 220 },
            { x: 40, y: 40 + 220 + 20 + 220 + 20, width: 320, height: 220 }
        ],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-3-photos-option1.png', name: 'Triple View' },
            { id: 'option2', src: 'assets/strip-frame-3-photos-option2.png', name: 'Elegant Three' }
        ]
    },
    // Configuration for a 4-photo strip
    '4': {
        stripWidth: 400,
        stripHeight: 40 + 226 + 20 + 226 + 20 + 226 + 20 + 226 + 150, // 4 photos
        frames: [
            { x: 40, y: 40, width: 320, height: 226 },
            { x: 40, y: 40 + 226 + 20, width: 320, height: 226 },
            { x: 40, y: 40 + 226 + 20 + 226 + 20, width: 320, height: 226 },
            { x: 40, y: 40 + 226 + 20 + 226 + 20 + 226 + 20, width: 320, height: 226 }
        ],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-4-photos.png', name: 'Quad Classic' },
            { id: 'option2', src: 'assets/strip-frame-4-photos-option2.png', name: 'Four Square' }
        ]
    },
    // Configuration for a 6-photo strip
    '6': {
        stripWidth: 400,
        stripHeight: 40 + (220 * 2) + (20 * 1) + 150, // Top padding + (2 photo rows with gap) + bottom space. Each row has 3 photos.
        frames: [
            { x: 40, y: 40, width: 93, height: 220 },
            { x: 40 + 93 + 20, y: 40, width: 93, height: 220 },
            { x: 40 + 93 + 20 + 93 + 20, y: 40, width: 93, height: 220 },
            { x: 40, y: 40 + 220 + 20, width: 93, height: 220 },
            { x: 40 + 93 + 20, y: 40 + 220 + 20, width: 93, height: 220 },
            { x: 40 + 93 + 20 + 93 + 20, y: 40 + 220 + 20, width: 93, height: 220 }
        ],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-6-photos-option1.png', name: 'Six Grid' },
            { id: 'option2', src: 'assets/strip-frame-6-photos-option2.png', name: 'Photo Story' }
        ]
    }
};

const DEFAULT_TEXT_SETTINGS = {
    fontFamily: 'Poppins',
    fontSize: 40,
    color: '#000000',
    align: 'center',
    bold: false,
    italic: false,
    shadow: false
};

const DEFAULT_DRAWING_SETTINGS = {
    color: '#FF0000',
    size: 5,
    mode: 'brush' // 'brush' or 'eraser'
};

// --- DOM Element References ---
const DOMElements = {
    canvasContainer: document.getElementById('canvasContainer'),
    photoCanvas: document.getElementById('photoCanvas'),
    ctx: null, // Initialized later
    frameSelect: document.getElementById('frameSelect'),
    capturedPhotosGrid: document.getElementById('capturedPhotosGrid'),
    retakeBtn: document.getElementById('retakeBtn'),
    downloadStripBtn: document.getElementById('downloadStripBtn'),
    downloadFormatSelect: document.getElementById('downloadFormatSelect'),
    printStripBtn: document.getElementById('printStripBtn'),
    undoLastStickerBtn: document.getElementById('undoLastStickerBtn'),
    removeSelectedStickerBtn: document.getElementById('removeSelectedStickerBtn'),
    addStickerInput: document.getElementById('addStickerInput'),
    addStickerBtn: document.getElementById('addStickerBtn'),
    stickerSizeSlider: document.getElementById('stickerSizeSlider'),
    stickerRotationSlider: document.getElementById('stickerRotationSlider'),
    stickerOpacitySlider: document.getElementById('stickerOpacitySlider'),
    addTextBtn: document.getElementById('addTextBtn'),
    textInput: document.getElementById('textInput'),
    textFontSelect: document.getElementById('textFontSelect'),
    fontSizeSlider: document.getElementById('fontSizeSlider'),
    textColorInput: document.getElementById('textColorInput'),
    textAlignSelect: document.getElementById('textAlignSelect'),
    textBoldToggle: document.getElementById('textBoldToggle'),
    textItalicToggle: document.getElementById('textItalicToggle'),
    textShadowToggle: document.getElementById('textShadowToggle'),
    removeSelectedTextBtn: document.getElementById('removeSelectedTextBtn'),
    toggleDrawModeBtn: document.getElementById('toggleDrawModeBtn'),
    brushColorInput: document.getElementById('brushColorInput'),
    brushSizeInput: document.getElementById('brushSizeInput'),
    clearDrawingsBtn: document.getElementById('clearDrawingsBtn'),
    drawModeControls: document.getElementById('drawModeControls'), // Container for draw controls
    textControls: document.getElementById('textControls'), // Container for text controls
    stickerControls: document.getElementById('stickerControls'), // Container for sticker controls
    messageOverlay: document.getElementById('messageOverlay'), // New: for displaying canvas messages
    messageText: document.getElementById('messageText') // New: for displaying canvas messages
};

// --- App State ---
const appState = {
    capturedPhotos: [], // Array of Image objects (or base64 strings if loaded from localStorage)
    currentStripConfig: null,
    selectedFrameId: null,
    isDragging: false,
    isResizing: false,
    isRotating: false,
    currentHandle: null, // 'tl', 'tr', 'bl', 'br', 'rot', 'move'
    lastX: 0,
    lastY: 0,
    selectedDraggable: null, // The currently selected sticker or text object
    stickers: [], // Array of { id, src, x, y, width, height, angle, opacity, image }
    texts: [], // Array of { id, x, y, text, fontFamily, fontSize, color, align, bold, italic, shadow, width, height, angle }
    nextStickerId: 1,
    nextTextId: 1,
    isDrawMode: false,
    isDrawing: false,
    drawings: [], // Array of { color, size, points: [{x, y, isStart}] }
    currentDrawing: null, // The drawing currently being created
    undoStack: [], // For undoing operations
    redoStack: [], // For redoing operations
};

// --- Utility Functions ---

/**
 * Logs an analytics event to the console.
 * In a real application, this would send data to an analytics service (e.g., Google Analytics).
 * @param {string} eventName - The name of the event (e.g., "Session Started").
 * @param {object} [details={}] - Optional details related to the event.
 */
function logAnalytics(eventName, details = {}) {
    console.log(`ANALYTICS: ${eventName} -`, { timestamp: new Date().toISOString(), ...details });
    // Example for real analytics (if you had Google Analytics initialized):
    // gtag('event', eventName, {
    //     'event_category': 'User Engagement',
    //     'event_label': eventName,
    //     ...details
    // });
}

/**
 * Loads an image and returns a Promise that resolves with the Image object.
 * @param {string} src - The source URL of the image.
 * @returns {Promise<HTMLImageElement>} A Promise that resolves with the loaded Image object.
 */
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * Preloads captured photos from localStorage into Image objects.
 */
async function preloadCapturedPhotos() {
    const storedPhotos = JSON.parse(localStorage.getItem('capturedPhotos') || '[]');
    appState.capturedPhotos = []; // Clear existing
    DOMElements.capturedPhotosGrid.innerHTML = ''; // Clear display

    for (const base64Data of storedPhotos) {
        try {
            const img = await loadImage(base64Data);
            appState.capturedPhotos.push(img);

            // Add thumbnail to the left grid
            const thumbDiv = document.createElement('div');
            thumbDiv.classList.add('captured-photo-thumbnail');
            const thumbImg = document.createElement('img');
            thumbImg.src = base64Data;
            thumbDiv.appendChild(thumbImg);
            DOMElements.capturedPhotosGrid.appendChild(thumbDiv);

        } catch (error) {
            console.error("Error loading captured photo:", error);
        }
    }
}

/**
 * Gets mouse or touch coordinates relative to the canvas.
 * @param {Event} event - The mouse or touch event.
 * @returns {{x: number, y: number}} Coordinates.
 */
function getEventCoordinates(event) {
    const rect = DOMElements.photoCanvas.getBoundingClientRect();
    let clientX, clientY;

    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }

    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

/**
 * Checks if a point is inside a rotated rectangle.
 * @param {object} point - {x, y}
 * @param {object} rect - {x, y, width, height, angle (radians)}
 * @returns {boolean}
 */
function isPointInRotatedRect(point, rect) {
    const cos = Math.cos(-rect.angle);
    const sin = Math.sin(-rect.angle);

    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;

    // Translate point to origin (relative to rect's center)
    const translatedX = point.x - cx;
    const translatedY = point.y - cy;

    // Rotate point back
    const rotatedX = translatedX * cos - translatedY * sin;
    const rotatedY = translatedX * sin + translatedY * cos;

    // Check if the rotated point is within the unrotated bounds
    return rotatedX >= -rect.width / 2 && rotatedX <= rect.width / 2 &&
           rotatedY >= -rect.height / 2 && rotatedY <= rect.height / 2;
}

/**
 * Checks if a point is within a handle area for resizing/rotating.
 * @param {object} point - {x, y}
 * @param {object} draggable - The draggable object.
 * @param {string} handleType - The type of handle ('tl', 'tr', 'bl', 'br', 'rot').
 * @returns {boolean}
 */
function checkHandleClick(point, draggable, handleType) {
    if (!draggable) return false;
    const handleSize = 10; // Must match handle size in drawSelectionHandles
    const handles = getHandlePositions(draggable, handleSize);
    const handle = handles[handleType];

    if (!handle) return false;

    // Check if the point is within the square handle area
    return point.x >= handle.x && point.x <= handle.x + handleSize &&
           point.y >= handle.y && point.y <= handle.y + handleSize;
}

/**
 * Creates a unique ID for stickers and text.
 * @param {string} type - 'sticker' or 'text'
 */
function generateUniqueId(type) {
    if (type === 'sticker') {
        return `sticker-${appState.nextStickerId++}`;
    } else if (type === 'text') {
        return `text-${appState.nextTextId++}`;
    }
    return `item-${Date.now()}`; // Fallback
}

/**
 * Pushes the current app state onto the undo stack.
 */
function pushStateForUndo() {
    // Clone relevant parts of the state deeply if necessary
    const stateToSave = {
        stickers: JSON.parse(JSON.stringify(appState.stickers.map(s => ({...s, image: null})))), // Avoid circular references
        texts: JSON.parse(JSON.stringify(appState.texts)),
        drawings: JSON.parse(JSON.stringify(appState.drawings)),
        // Only save properties that are simple JSON serializable for images
        capturedPhotos: appState.capturedPhotos.map(img => img.src)
    };
    appState.undoStack.push(stateToSave);
    appState.redoStack = []; // Clear redo stack on new action
    // console.log("State pushed for undo. Undo stack size:", appState.undoStack.length);
}

/**
 * Restores a state from the undo stack.
 */
async function undoLastAction() {
    if (appState.undoStack.length > 0) {
        const lastState = appState.undoStack.pop();
        // Restore photos (need to reload images)
        appState.capturedPhotos = [];
        for(const src of lastState.capturedPhotos) {
            const img = await loadImage(src);
            appState.capturedPhotos.push(img);
        }

        // Restore stickers (need to reload images)
        appState.stickers = [];
        for (const s of lastState.stickers) {
            const img = await loadImage(s.src); // Reload image for sticker
            appState.stickers.push({ ...s, image: img });
        }
        appState.texts = lastState.texts;
        appState.drawings = lastState.drawings;

        appState.selectedDraggable = null; // Deselect after undo
        renderCanvas();
        updateTextControlsFromSelection();
        updateStickerControlsFromSelection();
        // console.log("Undo performed. Undo stack size:", appState.undoStack.length);
    } else {
        console.log("Nothing to undo.");
    }
}


// --- UI Feedback & State Update Functions ---

/**
 * Displays a message on the canvas overlay.
 * @param {string} message - The message to display.
 */
function displayCanvasMessage(message) {
    DOMElements.messageText.textContent = message;
    DOMElements.messageOverlay.style.display = 'flex';
}

/**
 * Hides the canvas message overlay.
 */
function hideCanvasMessage() {
    DOMElements.messageOverlay.style.display = 'none';
}

/**
 * Toggles the visibility of the download spinner.
 * @param {boolean} show - True to show, false to hide.
 */
function toggleDownloadSpinner(show) {
    const spinner = document.getElementById('downloadSpinner');
    if (spinner) {
        if (show) {
            spinner.classList.remove('hidden-spinner');
        } else {
            spinner.classList.add('hidden-spinner');
        }
    }
}

/**
 * Populates the frame selection dropdown based on the current strip configuration.
 */
function populateFrameOptions() {
    DOMElements.frameSelect.innerHTML = ''; // Clear existing options
    if (appState.currentStripConfig && appState.currentStripConfig.availableFrames) {
        appState.currentStripConfig.availableFrames.forEach(frame => {
            const option = document.createElement('option');
            option.value = frame.id;
            option.textContent = frame.name;
            DOMElements.frameSelect.appendChild(option);
        });
        // Select the first option by default
        if (appState.currentStripConfig.availableFrames.length > 0) {
            appState.selectedFrameId = appState.currentStripConfig.availableFrames[0].id;
            DOMElements.frameSelect.value = appState.selectedFrameId;
        }
    }
}

/**
 * Updates the text controls based on the selected text object.
 */
function updateTextControlsFromSelection() {
    const selectedText = appState.selectedDraggable && appState.selectedDraggable.type === 'text' ? appState.selectedDraggable : null;

    if (selectedText) {
        DOMElements.textInput.value = selectedText.text;
        DOMElements.textFontSelect.value = selectedText.fontFamily || DEFAULT_TEXT_SETTINGS.fontFamily;
        DOMElements.fontSizeSlider.value = selectedText.fontSize || DEFAULT_TEXT_SETTINGS.fontSize;
        DOMElements.textColorInput.value = selectedText.color || DEFAULT_TEXT_SETTINGS.color;
        DOMElements.textAlignSelect.value = selectedText.align || DEFAULT_TEXT_SETTINGS.align;

        // Toggle classes for styling buttons
        DOMElements.textBoldToggle.classList.toggle('active', selectedText.bold);
        DOMElements.textItalicToggle.classList.toggle('active', selectedText.italic);
        DOMElements.textShadowToggle.classList.toggle('active', selectedText.shadow);

        DOMElements.removeSelectedTextBtn.disabled = false;
        // Enable editing controls for selected text
        DOMElements.textInput.disabled = false;
        DOMElements.textFontSelect.disabled = false;
        DOMElements.fontSizeSlider.disabled = false;
        DOMElements.textColorInput.disabled = false;
        DOMElements.textAlignSelect.disabled = false;
        DOMElements.textBoldToggle.disabled = false;
        DOMElements.textItalicToggle.disabled = false;
        DOMElements.textShadowToggle.disabled = false;

    } else {
        // Reset to default and disable if no text is selected
        DOMElements.textInput.value = '';
        DOMElements.textFontSelect.value = DEFAULT_TEXT_SETTINGS.fontFamily;
        DOMElements.fontSizeSlider.value = DEFAULT_TEXT_SETTINGS.fontSize;
        DOMElements.textColorInput.value = DEFAULT_TEXT_SETTINGS.color;
        DOMElements.textAlignSelect.value = DEFAULT_TEXT_SETTINGS.align;

        DOMElements.textBoldToggle.classList.remove('active');
        DOMElements.textItalicToggle.classList.remove('active');
        DOMElements.textShadowToggle.classList.remove('active');

        DOMElements.removeSelectedTextBtn.disabled = true;
        // Keep add button and input enabled always, but disable editing controls
        DOMElements.textFontSelect.disabled = true;
        DOMElements.fontSizeSlider.disabled = true;
        DOMElements.textColorInput.disabled = true;
        DOMElements.textAlignSelect.disabled = true;
        DOMElements.textBoldToggle.disabled = true;
        DOMElements.textItalicToggle.disabled = true;
        DOMElements.textShadowToggle.disabled = true;
    }
    // These should always be enabled unless there are no photos at all
    DOMElements.textInput.disabled = appState.capturedPhotos.length === 0;
    DOMElements.addTextBtn.disabled = appState.capturedPhotos.length === 0;
}

/**
 * Updates the sticker controls based on the selected sticker object.
 */
function updateStickerControlsFromSelection() {
    const selectedSticker = appState.selectedDraggable && appState.selectedDraggable.type === 'sticker' ? appState.selectedDraggable : null;

    if (selectedSticker) {
        DOMElements.stickerSizeSlider.value = selectedSticker.width; // Assuming width represents size
        DOMElements.stickerRotationSlider.value = selectedSticker.angle * (180 / Math.PI); // Convert radians to degrees
        DOMElements.stickerOpacitySlider.value = selectedSticker.opacity;
        DOMElements.removeSelectedStickerBtn.disabled = false;
        DOMElements.stickerSizeSlider.disabled = false;
        DOMElements.stickerRotationSlider.disabled = false;
        DOMElements.stickerOpacitySlider.disabled = false;
    } else {
        DOMElements.stickerSizeSlider.value = 100; // Reset to default
        DOMElements.stickerRotationSlider.value = 0;
        DOMElements.stickerOpacitySlider.value = 1;
        DOMElements.removeSelectedStickerBtn.disabled = true;
        DOMElements.stickerSizeSlider.disabled = true;
        DOMElements.stickerRotationSlider.disabled = true;
        DOMElements.stickerOpacitySlider.disabled = true;
    }
    // These should always be enabled unless there are no photos at all
    DOMElements.addStickerInput.disabled = appState.capturedPhotos.length === 0;
    DOMElements.addStickerBtn.disabled = appState.capturedPhotos.length === 0;
    DOMElements.undoLastStickerBtn.disabled = appState.stickers.length === 0;
}

/**
 * Updates the cursor style based on current interaction mode.
 */
function updateCanvasCursor() {
    if (appState.isDrawing) {
        DOMElements.photoCanvas.style.cursor = 'crosshair';
    } else if (appState.isResizing || appState.isRotating) {
        DOMElements.photoCanvas.style.cursor = 'grabbing'; // Or specific resize/rotate cursors if desired
    } else if (appState.isDragging) {
        DOMElements.photoCanvas.style.cursor = 'grabbing';
    } else if (appState.selectedDraggable) {
        DOMElements.photoCanvas.style.cursor = 'grab'; // Indicate it can be dragged
    } else {
        DOMElements.photoCanvas.style.cursor = 'default';
    }
}

/**
 * Toggles the visibility of drawing controls and text/sticker controls.
 */
function toggleControlPanels() {
    if (appState.isDrawMode) {
        DOMElements.drawModeControls.style.display = 'block';
        DOMElements.textControls.style.display = 'none';
        DOMElements.stickerControls.style.display = 'none';
        // Deselect any draggable object when entering draw mode
        appState.selectedDraggable = null;
    } else {
        DOMElements.drawModeControls.style.display = 'none';
        DOMElements.textControls.style.display = 'block';
        DOMElements.stickerControls.style.display = 'block';
    }
    renderCanvas(); // Re-render to clear selection handles if draw mode is entered
}

// --- Canvas Drawing Functions ---

/**
 * Draws the current date on the canvas at the bottom of the strip.
 * @param {CanvasRenderingContext2D} targetCtx - The canvas context to draw on.
 */
function drawDateOnCanvas(targetCtx) {
    if (!appState.currentStripConfig || !STRIP_LAYOUT_CONFIGS.common) return;

    const date = new Date();
    // Format: Month Day, Year (e.g., June 05, 2025)
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);

    const commonConfig = STRIP_LAYOUT_CONFIGS.common;
    const stripWidth = appState.currentStripConfig.stripWidth;
    const stripHeight = appState.currentStripConfig.stripHeight;
    const bottomSpaceForLogo = commonConfig.bottomSpaceForLogo;

    targetCtx.save();
    targetCtx.fillStyle = '#000000'; // Set date color to black
    targetCtx.font = '20px "Poppins", sans-serif'; // Set date font and size
    targetCtx.textAlign = 'center'; // Center the date horizontally
    targetCtx.textBaseline = 'bottom'; // Position the text's baseline at the calculated Y

    // Calculate Y position: Place it 30px from the top of the logo area (which is `stripHeight - bottomSpaceForLogo`)
    const dateY = stripHeight - bottomSpaceForLogo + 30;

    targetCtx.fillText(formattedDate, stripWidth / 2, dateY);
    targetCtx.restore();
}

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

    // Draw the current date on the canvas
    drawDateOnCanvas(DOMElements.ctx);

    // Draw selection handles for the currently selected draggable object
    if (appState.selectedDraggable && !appState.isDrawMode) {
        drawSelectionHandles(DOMElements.ctx, appState.selectedDraggable);
    }
}

/**
 * Draws the selected frame image onto the canvas.
 * @param {CanvasRenderingContext2D} targetCtx - The canvas context.
 */
async function drawFrameOnCanvas(targetCtx) {
    if (!appState.currentStripConfig || !appState.selectedFrameId) return;

    const frame = appState.currentStripConfig.availableFrames.find(f => f.id === appState.selectedFrameId);
    if (frame && frame.src) {
        try {
            const frameImg = await loadImage(frame.src);
            targetCtx.drawImage(frameImg, 0, 0, DOMElements.photoCanvas.width, DOMElements.photoCanvas.height);
        } catch (error) {
            console.error("Error drawing frame:", error);
            // Fallback to background color if frame fails to load
            if (appState.currentStripConfig.defaultBackground) {
                targetCtx.fillStyle = appState.currentStripConfig.defaultBackground;
                targetCtx.fillRect(0, 0, DOMElements.photoCanvas.width, DOMElements.photoCanvas.height);
            }
        }
    }
}

/**
 * Draws the captured photos onto the canvas within their designated frames.
 * @param {CanvasRenderingContext2D} targetCtx - The canvas context.
 */
function drawPhotosOnCanvas(targetCtx) {
    if (!appState.currentStripConfig || appState.capturedPhotos.length === 0) return;

    appState.currentStripConfig.frames.forEach((frame, index) => {
        const photo = appState.capturedPhotos[index];
        if (photo) {
            // Draw photo covering the frame area
            targetCtx.drawImage(photo, frame.x, frame.y, frame.width, frame.height);
        }
    });
}

/**
 * Draws draggable objects (stickers and text) on the canvas.
 * @param {CanvasRenderingContext2D} targetCtx - The canvas context.
 * @param {Array<object>} objects - Array of draggable objects (stickers or text).
 */
function drawDraggableObjectsOnCanvas(targetCtx, objects) {
    objects.forEach(obj => {
        targetCtx.save();
        const cx = obj.x + obj.width / 2;
        const cy = obj.y + obj.height / 2;

        targetCtx.translate(cx, cy);
        targetCtx.rotate(obj.angle || 0);
        targetCtx.translate(-cx, -cy);

        if (obj.type === 'sticker' && obj.image) {
            targetCtx.globalAlpha = obj.opacity !== undefined ? obj.opacity : 1;
            targetCtx.drawImage(obj.image, obj.x, obj.y, obj.width, obj.height);
            targetCtx.globalAlpha = 1; // Reset alpha
        } else if (obj.type === 'text') {
            targetCtx.fillStyle = obj.color || DEFAULT_TEXT_SETTINGS.color;
            targetCtx.font = `${obj.bold ? 'bold ' : ''}${obj.italic ? 'italic ' : ''}${obj.fontSize || DEFAULT_TEXT_SETTINGS.fontSize}px ${obj.fontFamily || DEFAULT_TEXT_SETTINGS.fontFamily}`;
            targetCtx.textAlign = obj.align || DEFAULT_TEXT_SETTINGS.align;

            if (obj.shadow) {
                targetCtx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                targetCtx.shadowOffsetX = 2;
                targetCtx.shadowOffsetY = 2;
                targetCtx.shadowBlur = 4;
            }

            // Text alignment adjustments for fillText
            let textX = obj.x;
            if (obj.align === 'center') textX = obj.x + obj.width / 2;
            if (obj.align === 'right') textX = obj.x + obj.width;

            // Draw text, ensuring it wraps within its bounding box if multi-line.
            // For simplicity, this assumes a single line for now as text input is single line.
            // For multi-line text, you'd need to split by \n and calculate line heights.
            targetCtx.fillText(obj.text, textX, obj.y + obj.height / 2); // Center vertically approx
            targetCtx.shadowColor = 'transparent'; // Reset shadow
            targetCtx.shadowOffsetX = 0;
            targetCtx.shadowOffsetY = 0;
            targetCtx.shadowBlur = 0;
        }
        targetCtx.restore();

        // For debugging: Draw bounding box
        // targetCtx.save();
        // targetCtx.strokeStyle = 'blue';
        // targetCtx.lineWidth = 1;
        // targetCtx.translate(cx, cy);
        // targetCtx.rotate(obj.angle || 0);
        // targetCtx.strokeRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);
        // targetCtx.restore();
    });
}

/**
 * Draws user drawings on the canvas.
 * @param {CanvasRenderingContext2D} targetCtx - The canvas context.
 * @param {Array<object>} drawings - Array of drawing objects.
 */
function drawDrawingsOnCanvas(targetCtx, drawings) {
    drawings.forEach(drawing => {
        targetCtx.save();
        targetCtx.strokeStyle = drawing.color;
        targetCtx.lineWidth = drawing.size;
        targetCtx.lineCap = 'round';
        targetCtx.lineJoin = 'round';

        targetCtx.beginPath();
        if (drawing.points.length > 0) {
            targetCtx.moveTo(drawing.points[0].x, drawing.points[0].y);
            for (let i = 1; i < drawing.points.length; i++) {
                const p = drawing.points[i];
                if (p.isStart) {
                    targetCtx.stroke();
                    targetCtx.beginPath();
                    targetCtx.moveTo(p.x, p.y);
                } else {
                    targetCtx.lineTo(p.x, p.y);
                }
            }
        }
        targetCtx.stroke();
        targetCtx.restore();
    });
}

/**
 * Calculates and returns the positions of the selection handles.
 * @param {object} draggable - The draggable object.
 * @param {number} handleSize - The size of the handles.
 * @returns {object} An object containing handle positions.
 */
function getHandlePositions(draggable, handleSize) {
    const halfWidth = draggable.width / 2;
    const halfHeight = draggable.height / 2;
    const cx = draggable.x + halfWidth;
    const cy = draggable.y + halfHeight;

    // Helper to rotate a point around a center
    const rotatePoint = (px, py, angle, originX, originY) => {
        const dx = px - originX;
        const dy = py - originY;
        const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
        const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);
        return { x: rotatedX + originX, y: rotatedY + originY };
    };

    // Unrotated corners
    const tl = { x: draggable.x, y: draggable.y };
    const tr = { x: draggable.x + draggable.width, y: draggable.y };
    const bl = { x: draggable.x, y: draggable.y + draggable.height };
    const br = { x: draggable.x + draggable.width, y: draggable.y + draggable.height };

    // Apply rotation to corner points
    const rotatedTl = rotatePoint(tl.x, tl.y, draggable.angle, cx, cy);
    const rotatedTr = rotatePoint(tr.x, tr.y, draggable.angle, cx, cy);
    const rotatedBl = rotatePoint(bl.x, bl.y, draggable.angle, cx, cy);
    const rotatedBr = rotatePoint(br.x, br.y, draggable.angle, cx, cy);

    // Rotation handle position (above top center)
    const rotHandleY = draggable.y - 20; // 20px above the top edge
    const rotatedRot = rotatePoint(cx, rotHandleY, draggable.angle, cx, cy);


    return {
        tl: { x: rotatedTl.x - handleSize / 2, y: rotatedTl.y - handleSize / 2 },
        tr: { x: rotatedTr.x - handleSize / 2, y: rotatedTr.y - handleSize / 2 },
        bl: { x: rotatedBl.x - handleSize / 2, y: rotatedBl.y - handleSize / 2 },
        br: { x: rotatedBr.x - handleSize / 2, y: rotatedBr.y - handleSize / 2 },
        rot: { x: rotatedRot.x - handleSize / 2, y: rotatedRot.y - handleSize / 2 }
    };
}


/**
 * Draws selection handles and bounding box for the selected draggable object.
 * @param {CanvasRenderingContext2D} targetCtx - The canvas context.
 * @param {object} draggable - The currently selected draggable object.
 */
function drawSelectionHandles(targetCtx, draggable) {
    if (!draggable) return;

    targetCtx.save();
    targetCtx.strokeStyle = '#33A4C9'; // ODZ Blue
    targetCtx.lineWidth = 2;
    targetCtx.setLineDash([5, 5]); // Dashed line

    const halfWidth = draggable.width / 2;
    const halfHeight = draggable.height / 2;
    const cx = draggable.x + halfWidth;
    const cy = draggable.y + halfHeight;

    // Draw rotated bounding box
    targetCtx.translate(cx, cy);
    targetCtx.rotate(draggable.angle || 0);
    targetCtx.strokeRect(-halfWidth, -halfHeight, draggable.width, draggable.height);
    targetCtx.restore();

    targetCtx.fillStyle = '#33A4C9'; // ODZ Blue for handles
    const handleSize = 10;
    const handles = getHandlePositions(draggable, handleSize);

    // Draw handles
    for (const type in handles) {
        const h = handles[type];
        targetCtx.fillRect(h.x, h.y, handleSize, handleSize);
    }

    // Draw line to rotation handle
    targetCtx.beginPath();
    targetCtx.strokeStyle = '#33A4C9';
    targetCtx.setLineDash([]); // Solid line
    targetCtx.moveTo(cx, cy); // From center
    targetCtx.lineTo(handles.rot.x + handleSize / 2, handles.rot.y + handleSize / 2); // To rotation handle center
    targetCtx.stroke();

    targetCtx.restore(); // Restore to previous state
}

// --- Event Handling ---

/**
 * Handles mouse down events on the canvas for dragging, resizing, and rotating.
 * @param {MouseEvent} event
 */
function handleMouseDown(event) {
    if (appState.isDrawMode) {
        pushStateForUndo(); // Save state before drawing
        appState.isDrawing = true;
        const coords = getEventCoordinates(event);
        appState.currentDrawing = {
            color: DOMElements.brushColorInput.value,
            size: parseInt(DOMElements.brushSizeInput.value),
            points: [{ x: coords.x, y: coords.y, isStart: true }]
        };
        appState.drawings.push(appState.currentDrawing);
        renderCanvas();
        return;
    }

    const coords = getEventCoordinates(event);
    appState.lastX = coords.x;
    appState.lastY = coords.y;

    appState.selectedDraggable = null; // Assume no selection initially
    appState.isResizing = false;
    appState.isRotating = false;
    appState.isDragging = false;
    appState.currentHandle = null;

    // Check handles first (in reverse order of drawing to prioritize top-most)
    const objects = [...appState.texts, ...appState.stickers]; // Check text then stickers
    const allDraggables = [...objects].reverse(); // Reverse to pick top-most if overlapping

    for (const obj of allDraggables) {
        if (checkHandleClick(coords, obj, 'rot')) {
            appState.selectedDraggable = obj;
            appState.isRotating = true;
            appState.currentHandle = 'rot';
            pushStateForUndo(); // Save state before action
            break;
        } else if (checkHandleClick(coords, obj, 'tl')) {
            appState.selectedDraggable = obj;
            appState.isResizing = true;
            appState.currentHandle = 'tl';
            pushStateForUndo();
            break;
        } else if (checkHandleClick(coords, obj, 'tr')) {
            appState.selectedDraggable = obj;
            appState.isResizing = true;
            appState.currentHandle = 'tr';
            pushStateForUndo();
            break;
        } else if (checkHandleClick(coords, obj, 'bl')) {
            appState.selectedDraggable = obj;
            appState.isResizing = true;
            appState.currentHandle = 'bl';
            pushStateForUndo();
            break;
        } else if (checkHandleClick(coords, obj, 'br')) {
            appState.selectedDraggable = obj;
            appState.isResizing = true;
            appState.currentHandle = 'br';
            pushStateForUndo();
            break;
        }
    }

    // If no handle was clicked, check if an object was clicked for dragging
    if (!appState.selectedDraggable) {
        for (const obj of allDraggables) {
            if (isPointInRotatedRect(coords, obj)) {
                appState.selectedDraggable = obj;
                appState.isDragging = true;
                pushStateForUndo(); // Save state before action
                break;
            }
        }
    }

    // Update UI controls for the newly selected object
    updateTextControlsFromSelection();
    updateStickerControlsFromSelection();
    renderCanvas(); // Re-render to show selection handles
    updateCanvasCursor();
}

/**
 * Handles mouse move events for dragging, resizing, and rotating.
 * @param {MouseEvent} event
 */
function handleMouseMove(event) {
    const coords = getEventCoordinates(event);
    const deltaX = coords.x - appState.lastX;
    const deltaY = coords.y - appState.lastY;

    if (appState.isDrawing && appState.currentDrawing) {
        appState.currentDrawing.points.push({ x: coords.x, y: coords.y });
        renderCanvas();
    } else if (appState.selectedDraggable) {
        const obj = appState.selectedDraggable;
        const centerX = obj.x + obj.width / 2;
        const centerY = obj.y + obj.height / 2;

        if (appState.isDragging) {
            obj.x += deltaX;
            obj.y += deltaY;
            renderCanvas();
        } else if (appState.isResizing) {
            // Translate mouse coords to object's local, unrotated space
            const angle = obj.angle || 0;
            const cos = Math.cos(-angle);
            const sin = Math.sin(-angle);

            const rotatedMouseX = (coords.x - centerX) * cos - (coords.y - centerY) * sin;
            const rotatedMouseY = (coords.x - centerX) * sin + (coords.y - centerY) * cos;

            const rotatedLastX = (appState.lastX - centerX) * cos - (appState.lastY - centerY) * sin;
            const rotatedLastY = (appState.lastX - centerX) * sin + (appState.lastY - centerY) * cos;

            const rotatedDeltaX = rotatedMouseX - rotatedLastX;
            const rotatedDeltaY = rotatedMouseY - rotatedLastY;

            let newX = obj.x;
            let newY = obj.y;
            let newWidth = obj.width;
            let newHeight = obj.height;

            switch (appState.currentHandle) {
                case 'br': // Bottom Right
                    newWidth += rotatedDeltaX;
                    newHeight += rotatedDeltaY;
                    break;
                case 'bl': // Bottom Left
                    newWidth -= rotatedDeltaX;
                    newHeight += rotatedDeltaY;
                    newX += rotatedDeltaX * Math.cos(angle) + rotatedDeltaY * Math.sin(angle);
                    newY += rotatedDeltaY * Math.cos(angle) - rotatedDeltaX * Math.sin(angle);
                    break;
                case 'tr': // Top Right
                    newWidth += rotatedDeltaX;
                    newHeight -= rotatedDeltaY;
                    newY += rotatedDeltaX * Math.sin(angle) + rotatedDeltaY * Math.cos(angle);
                    newX += rotatedDeltaX * Math.cos(angle) - rotatedDeltaY * Math.sin(angle);
                    break;
                case 'tl': // Top Left
                    newWidth -= rotatedDeltaX;
                    newHeight -= rotatedDeltaY;
                    newX += rotatedDeltaX * Math.cos(angle) + rotatedDeltaY * Math.sin(angle);
                    newY += rotatedDeltaY * Math.cos(angle) - rotatedDeltaX * Math.sin(angle);
                    break;
            }

            // Ensure min dimensions
            const minDim = 20;
            obj.width = Math.max(minDim, newWidth);
            obj.height = Math.max(minDim, newHeight);

            // Re-calculate x,y to keep top-left corner correct after rotation-aware resizing
            // This is simplified: for rotation-aware resizing, one typically re-calculates the center
            // and then transforms back to the top-left based on new dimensions and angle.
            // For now, we'll apply the calculated newX, newY directly.
            obj.x = newX;
            obj.y = newY;


            renderCanvas();
        } else if (appState.isRotating) {
            // Calculate angle relative to the center of the object
            const dx = coords.x - centerX;
            const dy = coords.y - centerY;
            const newAngle = Math.atan2(dy, dx) + Math.PI / 2; // + PI/2 to align with top handle

            obj.angle = newAngle;
            renderCanvas();
        }
    }
    appState.lastX = coords.x;
    appState.lastY = coords.y;
    updateCanvasCursor();
}


/**
 * Handles mouse up events to stop dragging/resizing/rotating.
 * @param {MouseEvent} event
 */
function handleMouseUp() {
    if (appState.isDrawing) {
        appState.isDrawing = false;
    }
    appState.isDragging = false;
    appState.isResizing = false;
    appState.isRotating = false;
    appState.currentHandle = null; // Clear active handle
    renderCanvas(); // Final render to remove any active visual cues
    updateCanvasCursor();
}

/**
 * Handles touch start events.
 * @param {TouchEvent} event
 */
function handleTouchStart(event) {
    event.preventDefault(); // Prevent scrolling/zooming
    handleMouseDown({
        clientX: event.touches[0].clientX,
        clientY: event.touches[0].clientY,
        target: event.target
    });
}

/**
 * Handles touch move events.
 * @param {TouchEvent} event
 */
function handleTouchMove(event) {
    event.preventDefault(); // Prevent scrolling/zooming
    handleMouseMove({
        clientX: event.touches[0].clientX,
        clientY: event.touches[0].clientY,
        target: event.target
    });
}

/**
 * Handles touch end events.
 * @param {TouchEvent} event
 */
function handleTouchEnd() {
    handleMouseUp();
}


/**
 * Sets up all event listeners for the editing page.
 */
function setupEventListeners() {
    // Canvas interaction for draggable elements
    DOMElements.photoCanvas.addEventListener('mousedown', handleMouseDown);
    DOMElements.photoCanvas.addEventListener('mousemove', handleMouseMove);
    DOMElements.photoCanvas.addEventListener('mouseup', handleMouseUp);
    DOMElements.photoCanvas.addEventListener('mouseout', handleMouseUp); // End action if mouse leaves canvas

    // Touch event listeners for mobile
    DOMElements.photoCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    DOMElements.photoCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    DOMElements.photoCanvas.addEventListener('touchend', handleTouchEnd);
    DOMElements.photoCanvas.addEventListener('touchcancel', handleTouchEnd);

    // Frame selection
    DOMElements.frameSelect.addEventListener('change', (event) => {
        appState.selectedFrameId = event.target.value;
        renderCanvas();
        logAnalytics('Frame_Changed', { frameId: appState.selectedFrameId });
    });

    // Retake photos button
    DOMElements.retakeBtn.addEventListener('click', () => {
        logAnalytics('Retake_Photos_Clicked');
        // Clear captured photos and return to capture page
        localStorage.removeItem('capturedPhotos');
        localStorage.removeItem('selectedPhotoCount');
        localStorage.removeItem('selectedFrameAspectRatio');
        window.location.href = 'capture-page/capture-page.html';
    });

    // Download strip button
    DOMElements.downloadStripBtn.addEventListener('click', async () => {
        logAnalytics('Download_Strip_Clicked', { format: DOMElements.downloadFormatSelect.value });
        displayCanvasMessage("Preparing download...");
        toggleDownloadSpinner(true);

        // Ensure all images (frames, stickers) are loaded before attempting to download
        await Promise.allSettled([
            drawFrameOnCanvas(DOMElements.ctx) // Ensure frame is drawn
            // No need to wait for stickers/photos as they are already Image objects
        ]);

        const format = DOMElements.downloadFormatSelect.value;
        let mimeType = 'image/png';
        let quality = 1.0; // Default for PNG

        if (format.startsWith('image/jpeg')) {
            mimeType = 'image/jpeg';
            quality = parseFloat(format.split(';')[1]) || 0.9;
        }

        const dataURL = DOMElements.photoCanvas.toDataURL(mimeType, quality);
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = `odz_photostrip_${Date.now()}.${mimeType.split('/')[1].split(';')[0]}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        toggleDownloadSpinner(false);
        hideCanvasMessage();
        displayCanvasMessage("Download complete!");
        setTimeout(hideCanvasMessage, 2000); // Hide message after 2 seconds
    });

    // Print strip button
    DOMElements.printStripBtn.addEventListener('click', () => {
        logAnalytics('Print_Strip_Clicked');
        displayCanvasMessage("Preparing for print...");
        const dataURL = DOMElements.photoCanvas.toDataURL('image/png'); // Print as PNG
        const printWindow = window.open('', '_blank');
        printWindow.document.write('<html><head><title>Print Photo Strip</title>');
        printWindow.document.write('<style>body{display:flex; justify-content:center; align-items:center; min-height:100vh; margin:0;}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<img src="' + dataURL + '" style="max-width:100%; height:auto;">');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
        hideCanvasMessage();
    });

    // Sticker controls
    DOMElements.addStickerInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            pushStateForUndo(); // Save state before adding sticker
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const img = await loadImage(e.target.result);
                    const newSticker = {
                        id: generateUniqueId('sticker'),
                        type: 'sticker',
                        src: e.target.result, // Store base64 for reloads/undo
                        image: img, // Store actual image object for drawing
                        x: (DOMElements.photoCanvas.width / 2) - 50, // Center initially
                        y: (DOMElements.photoCanvas.height / 2) - 50,
                        width: 100,
                        height: 100,
                        angle: 0,
                        opacity: 1
                    };
                    appState.stickers.push(newSticker);
                    appState.selectedDraggable = newSticker;
                    renderCanvas();
                    updateStickerControlsFromSelection();
                    logAnalytics('Sticker_Added');
                } catch (error) {
                    console.error("Error loading sticker image:", error);
                    displayCanvasMessage("Failed to load sticker image.");
                    setTimeout(hideCanvasMessage, 2000);
                }
            };
            reader.readAsDataURL(file);
        }
    });

    DOMElements.addStickerBtn.addEventListener('click', () => {
        DOMElements.addStickerInput.click(); // Trigger file input
    });

    DOMElements.removeSelectedStickerBtn.addEventListener('click', () => {
        if (appState.selectedDraggable && appState.selectedDraggable.type === 'sticker') {
            pushStateForUndo(); // Save state before removing
            appState.stickers = appState.stickers.filter(s => s.id !== appState.selectedDraggable.id);
            appState.selectedDraggable = null; // Deselect
            renderCanvas();
            updateStickerControlsFromSelection();
            logAnalytics('Sticker_Removed');
        }
    });

    DOMElements.undoLastStickerBtn.addEventListener('click', undoLastAction);


    DOMElements.stickerSizeSlider.addEventListener('input', (event) => {
        if (appState.selectedDraggable && appState.selectedDraggable.type === 'sticker') {
            const newSize = parseInt(event.target.value);
            // Maintain aspect ratio, assuming initial sticker is square or resize proportionally
            // For simplicity, we just set width/height to newSize
            appState.selectedDraggable.width = newSize;
            appState.selectedDraggable.height = newSize;
            renderCanvas();
        }
    });

    DOMElements.stickerRotationSlider.addEventListener('input', (event) => {
        if (appState.selectedDraggable && appState.selectedDraggable.type === 'sticker') {
            appState.selectedDraggable.angle = parseFloat(event.target.value) * (Math.PI / 180); // Convert degrees to radians
            renderCanvas();
        }
    });

    DOMElements.stickerOpacitySlider.addEventListener('input', (event) => {
        if (appState.selectedDraggable && appState.selectedDraggable.type === 'sticker') {
            appState.selectedDraggable.opacity = parseFloat(event.target.value);
            renderCanvas();
        }
    });


    // Text controls
    DOMElements.addTextBtn.addEventListener('click', () => {
        pushStateForUndo(); // Save state before adding text
        const newText = {
            id: generateUniqueId('text'),
            type: 'text',
            x: DOMElements.photoCanvas.width / 4, // Left quarter
            y: DOMElements.photoCanvas.height / 2, // Center
            width: DOMElements.photoCanvas.width / 2, // Half width
            height: 50, // Default height, will adjust based on font size later
            text: DOMElements.textInput.value || 'New Text',
            fontFamily: DOMElements.textFontSelect.value,
            fontSize: parseInt(DOMElements.fontSizeSlider.value),
            color: DOMElements.textColorInput.value,
            align: DOMElements.textAlignSelect.value,
            bold: DOMElements.textBoldToggle.classList.contains('active'),
            italic: DOMElements.textItalicToggle.classList.contains('active'),
            shadow: DOMElements.textShadowToggle.classList.contains('active'),
            angle: 0
        };
        appState.texts.push(newText);
        appState.selectedDraggable = newText; // Select the newly added text
        renderCanvas();
        updateTextControlsFromSelection();
        logAnalytics('Text_Added', { text: newText.text });
    });

    // Update text content live
    DOMElements.textInput.addEventListener('input', (event) => {
        if (appState.selectedDraggable && appState.selectedDraggable.type === 'text') {
            appState.selectedDraggable.text = event.target.value;
            renderCanvas();
        }
    });

    DOMElements.textFontSelect.addEventListener('change', (event) => {
        if (appState.selectedDraggable && appState.selectedDraggable.type === 'text') {
            appState.selectedDraggable.fontFamily = event.target.value;
            renderCanvas();
        }
    });

    DOMElements.fontSizeSlider.addEventListener('input', (event) => {
        if (appState.selectedDraggable && appState.selectedDraggable.type === 'text') {
            appState.selectedDraggable.fontSize = parseInt(event.target.value);
            renderCanvas();
        }
    });

    DOMElements.textColorInput.addEventListener('input', (event) => {
        if (appState.selectedDraggable && appState.selectedDraggable.type === 'text') {
            appState.selectedDraggable.color = event.target.value;
            renderCanvas();
        }
    });

    DOMElements.textAlignSelect.addEventListener('change', (event) => {
        if (appState.selectedDraggable && appState.selectedDraggable.type === 'text') {
            appState.selectedDraggable.align = event.target.value;
            renderCanvas();
        }
    });

    DOMElements.textBoldToggle.addEventListener('click', () => {
        if (appState.selectedDraggable && appState.selectedDraggable.type === 'text') {
            appState.selectedDraggable.bold = !appState.selectedDraggable.bold;
            DOMElements.textBoldToggle.classList.toggle('active', appState.selectedDraggable.bold);
            renderCanvas();
        }
    });

    DOMElements.textItalicToggle.addEventListener('click', () => {
        if (appState.selectedDraggable && appState.selectedDraggable.type === 'text') {
            appState.selectedDraggable.italic = !appState.selectedDraggable.italic;
            DOMElements.textItalicToggle.classList.toggle('active', appState.selectedDraggable.italic);
            renderCanvas();
        }
    });

    DOMElements.textShadowToggle.addEventListener('click', () => {
        if (appState.selectedDraggable && appState.selectedDraggable.type === 'text') {
            appState.selectedDraggable.shadow = !appState.selectedDraggable.shadow;
            DOMElements.textShadowToggle.classList.toggle('active', appState.selectedDraggable.shadow);
            renderCanvas();
        }
    });

    DOMElements.removeSelectedTextBtn.addEventListener('click', () => {
        if (appState.selectedDraggable && appState.selectedDraggable.type === 'text') {
            pushStateForUndo(); // Save state before removing
            appState.texts = appState.texts.filter(t => t.id !== appState.selectedDraggable.id);
            appState.selectedDraggable = null; // Deselect
            renderCanvas();
            updateTextControlsFromSelection();
            logAnalytics('Text_Removed');
        }
    });

    // Drawing controls
    DOMElements.toggleDrawModeBtn.addEventListener('click', () => {
        appState.isDrawMode = !appState.isDrawMode;
        DOMElements.toggleDrawModeBtn.classList.toggle('active', appState.isDrawMode);
        toggleControlPanels(); // Show/hide relevant controls
        logAnalytics('Draw_Mode_Toggled', { mode: appState.isDrawMode ? 'on' : 'off' });
    });

    DOMElements.brushColorInput.addEventListener('input', (event) => {
        DEFAULT_DRAWING_SETTINGS.color = event.target.value; // Update default for new strokes
        // If actively drawing, could apply to current stroke, but simpler to apply to new ones
    });

    DOMElements.brushSizeInput.addEventListener('input', (event) => {
        DEFAULT_DRAWING_SETTINGS.size = parseInt(event.target.value); // Update default for new strokes
    });

    DOMElements.clearDrawingsBtn.addEventListener('click', () => {
        pushStateForUndo(); // Save state before clearing
        appState.drawings = [];
        appState.currentDrawing = null;
        renderCanvas();
        logAnalytics('Drawings_Cleared');
    });

    // Undo/Redo - basic functionality, could be expanded for more granular control
    document.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
            // console.log("Ctrl+Z pressed");
            undoLastAction();
        }
        // Add Ctrl+Y or Ctrl+Shift+Z for redo if redo stack is implemented
    });
}

// --- Initialization ---

/**
 * Initializes the editor page: loads photos, sets up canvas, populates controls, and attaches events.
 */
async function initializeEditorPage() {
    DOMElements.ctx = DOMEElements.photoCanvas.getContext('2d');

    const selectedPhotoCount = localStorage.getItem('selectedPhotoCount');
    const selectedFrameAspectRatio = parseFloat(localStorage.getItem('selectedFrameAspectRatio'));

    // Determine config based on selectedPhotoCount
    if (STRIP_LAYOUT_CONFIGS[selectedPhotoCount]) {
        appState.currentStripConfig = { ...STRIP_LAYOUT_CONFIGS.common, ...STRIP_LAYOUT_CONFIGS[selectedPhotoCount] };
    } else {
        // Fallback to a default if not found (e.g., 4 photos)
        console.warn("No specific config found for photo count:", selectedPhotoCount, "Falling back to 4 photos.");
        appState.currentStripConfig = { ...STRIP_LAYOUT_CONFIGS.common, ...STRIP_LAYOUT_CONFIGS['4'] };
    }

    // Set canvas dimensions based on the determined strip config
    DOMElements.photoCanvas.width = appState.currentStripConfig.stripWidth;
    DOMElements.photoCanvas.height = appState.currentStripConfig.stripHeight;

    // Load captured photos from local storage
    await preloadCapturedPhotos();

    // Populate frame options based on the loaded config
    populateFrameOptions();

    // Set initial control values
    if (DOMElements.textInput) DOMElements.textInput.value = ''; // Clear text input on load
    if (DOMElements.textFontSelect) DOMElements.textFontSelect.value = DEFAULT_TEXT_SETTINGS.fontFamily;
    if (DOMElements.fontSizeSlider) DOMElements.fontSizeSlider.value = DEFAULT_TEXT_SETTINGS.fontSize;
    if (DOMElements.textColorInput) DOMElements.textColorInput.value = DEFAULT_TEXT_SETTINGS.color;
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

    // Set up an interval to refresh the canvas every minute for the date display
    setInterval(renderCanvas, 60 * 1000); // Update every minute

    logAnalytics('Editor_Page_Loaded_Successfully', { layout: selectedPhotoCount });
}

// Ensure the `initializeEditorPage` function runs only after the entire HTML document is loaded.
// This prevents errors where JavaScript tries to find elements before they exist on the page.
document.addEventListener('DOMContentLoaded', initializeEditorPage);
