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
        stripHeight: 40 + 240 + 20 + 240 + 150, // topPadding + photoHeight*2 + gap + bottomSpaceForLogo
        frames: [
            { x: 40, y: 40, width: 320, height: 240 },
            { x: 40, y: 40 + 240 + 20, width: 320, height: 240 }
        ],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-2-photos-option1.png', name: 'Standard Pair' },
            { id: 'option2', src: 'assets/strip-frame-2-photos-option2.png', name: 'Minimal Duo' }
        ]
    },
    // Configuration for a 3-photo strip
    '3': {
        stripWidth: 400,
        stripHeight: 40 + 220 + 20 + 220 + 20 + 220 + 150, // topPadding + photoHeight*3 + gap*2 + bottomSpaceForLogo
        frames: [
            { x: 40, y: 40, width: 320, height: 220 },
            { x: 40, y: 40 + 220 + 20, width: 320, height: 220 },
            { x: 40, y: 40 + 220 + 20 + 220 + 20, width: 320, height: 220 }
        ],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-3-photos-option1.png', name: 'Classic Three' },
            { id: 'option2', src: 'assets/strip-frame-3-photos-option2.png', name: 'Film Strip' }
        ]
    },
    // Configuration for a 4-photo strip
    '4': {
        stripWidth: 400,
        stripHeight: 40 + 226 + 20 + 226 + 20 + 226 + 20 + 226 + 150, // topPadding + photoHeight*4 + gap*3 + bottomSpaceForLogo
        frames: [
            { x: 40, y: 40, width: 320, height: 226 },
            { x: 40, y: 40 + 226 + 20, width: 320, height: 226 },
            { x: 40, y: 40 + 226 + 20 + 226 + 20, width: 320, height: 226 },
            { x: 40, y: 40 + 226 + 20 + 226 + 20 + 226 + 20, width: 320, height: 226 }
        ],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-4-photos.png', name: 'Grid Four' },
            { id: 'option2', src: 'assets/strip-frame-4-photos-option2.png', name: 'Square Shots' }
        ]
    },
    // Configuration for a 6-photo strip
    '6': {
        stripWidth: 400,
        stripHeight: 40 + 220 + 20 + 220 + 20 + 220 + 20 + 220 + 20 + 220 + 20 + 220 + 150, // topPadding + photoHeight*6 + gap*5 + bottomSpaceForLogo
        frames: [
            { x: 40, y: 40, width: 320, height: 220 },
            { x: 40, y: 40 + 220 + 20, width: 320, height: 220 },
            { x: 40, y: 40 + (220 + 20) * 2, width: 320, height: 220 },
            { x: 40, y: 40 + (220 + 20) * 3, width: 320, height: 220 },
            { x: 40, y: 40 + (220 + 20) * 4, width: 320, height: 220 },
            { x: 40, y: 40 + (220 + 20) * 5, width: 320, height: 220 }
        ],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-6-photos-option1.png', name: 'Tall Six' },
            { id: 'option2', src: 'assets/strip-frame-6-photos-option2.png', name: 'Even Six' }
        ]
    }
};

// --- DOM Element References ---
const DOMElements = {
    canvasContainer: document.getElementById('canvasContainer'),
    photoStripCanvas: document.getElementById('photoStripCanvas'),
    backgroundSelect: document.getElementById('backgroundSelect'),
    frameSelect: document.getElementById('frameSelect'),
    addTextBtn: document.getElementById('addTextBtn'),
    textInput: document.getElementById('textInput'),
    fontSelect: document.getElementById('fontSelect'),
    fontSizeInput: document.getElementById('fontSizeInput'),
    textColorInput: document.getElementById('textColorInput'),
    textShadowColorInput: document.getElementById('textShadowColorInput'),
    textShadowBlurInput: document.getElementById('textShadowBlurInput'),
    boldToggleBtn: document.getElementById('boldToggleBtn'),
    italicToggleBtn: document.getElementById('italicToggleBtn'),
    textAlignSelect: document.getElementById('textAlignSelect'),
    removeTextBtn: document.getElementById('removeTextBtn'),
    stickerSelect: document.getElementById('stickerSelect'),
    addStickerBtn: document.getElementById('addStickerBtn'),
    removeStickerBtn: document.getElementById('removeStickerBtn'),
    toggleDrawModeBtn: document.getElementById('toggleDrawModeBtn'),
    brushColorInput: document.getElementById('brushColorInput'),
    brushSizeInput: document.getElementById('brushSizeInput'),
    clearDrawingsBtn: document.getElementById('clearDrawingsBtn'),
    downloadStripBtn: document.getElementById('downloadStripBtn'),
    downloadFormatSelect: document.getElementById('downloadFormatSelect'),
    printStripBtn: document.getElementById('printStripBtn'),
    retakeBtn: document.getElementById('retakeBtn'),
    // NEW: Date/Time elements
    toggleDateTime: document.getElementById('toggleDateTime')
};

// --- Canvas and Context ---
let ctx;
let currentConfig; // Stores the active layout configuration
let capturedImages = []; // Stores loaded Image objects from capturedPhotos
let activeElements = []; // Stores text, stickers, drawings, etc.
let selectedElement = null; // Currently selected text or sticker for manipulation
let isDragging = false;
let dragOffsetX, dragOffsetY;

// Drawing state
let isDrawing = false;
let drawings = []; // Stores individual drawing paths
let currentPath = [];

// NEW: Date/Time state
let showDateTimeOnStrip = false;

// --- Constants & Defaults ---
const DEFAULT_TEXT_SETTINGS = {
    font: 'Poppins',
    size: 24,
    color: '#000000',
    shadowColor: '#000000',
    shadowBlur: 0,
    bold: false,
    italic: false,
    align: 'center'
};

const DEFAULT_DRAWING_SETTINGS = {
    color: '#FF0000', // Red
    size: 5
};

const STICKER_BASE_PATH = 'assets/stickers/';
const STICKER_FILES = [
    { id: 'star', src: 'star.png', name: 'Star' },
    { id: 'heart', src: 'heart.png', name: 'Heart' },
    { id: 'glasses', src: 'glasses.png', name: 'Glasses' },
    { id: 'hat', src: 'hat.png', name: 'Party Hat' },
    { id: 'moustache', src: 'moustache.png', name: 'Moustache' },
    { id: 'arrow', src: 'arrow.png', name: 'Arrow' }
];

// --- Utility Functions ---

/**
 * Logs an analytics event to the console.
 * In a real application, this would send data to an analytics service (e.g., Google Analytics).
 * @param {string} eventName - The name of the event (e.g., "Editor Loaded").
 * @param {object} [details={}] - Optional details related to the event.
 */
function logAnalytics(eventName, details = {}) {
    console.log(`ANALYTICS: ${eventName} -`, { timestamp: new Date().toISOString(), ...details });
    // Example for real analytics (if you had Google Analytics initialized):
    // gtag('event', eventName, {
    //     'event_category': 'Editor Interactions',
    //     'event_label': eventName,
    //     ...details
    // });
}

/**
 * Loads an image and returns a Promise that resolves with the Image object.
 * @param {string} src - The source URL of the image.
 * @returns {Promise<Image>} - A promise that resolves with the Image object.
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
 * Gets the mouse/touch coordinates relative to the canvas.
 * @param {Event} event - The mouse or touch event.
 * @returns {{x: number, y: number}} - The coordinates.
 */
function getCanvasCoords(event) {
    const rect = DOMElements.photoStripCanvas.getBoundingClientRect();
    let clientX, clientY;

    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }

    // Scale coordinates from CSS pixels to canvas pixels
    const scaleX = DOMElements.photoStripCanvas.width / rect.width;
    const scaleY = DOMElements.photoStripCanvas.height / rect.height;

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

/**
 * Updates the disabled state of text editing controls based on selection.
 */
function updateTextControlsFromSelection() {
    const isTextSelected = selectedElement && selectedElement.type === 'text';
    DOMElements.fontSelect.disabled = !isTextSelected;
    DOMElements.fontSizeInput.disabled = !isTextSelected;
    DOMElements.textColorInput.disabled = !isTextSelected;
    DOMElements.textShadowColorInput.disabled = !isTextSelected;
    DOMElements.textShadowBlurInput.disabled = !isTextSelected;
    DOMElements.boldToggleBtn.disabled = !isTextSelected;
    DOMElements.italicToggleBtn.disabled = !isTextSelected;
    DOMElements.textAlignSelect.disabled = !isTextSelected;
    DOMElements.removeTextBtn.disabled = !isTextSelected;

    // The text input and add button should always be available to add NEW text
    DOMElements.textInput.disabled = false;
    DOMElements.addTextBtn.disabled = false;

    // Update button active states
    if (isTextSelected) {
        DOMElements.boldToggleBtn.classList.toggle('active', selectedElement.bold);
        DOMElements.italicToggleBtn.classList.toggle('active', selectedElement.italic);
    } else {
        DOMElements.boldToggleBtn.classList.remove('active');
        DOMElements.italicToggleBtn.classList.remove('active');
    }
}

/**
 * Updates the disabled state of sticker controls based on selection.
 */
function updateStickerControlsFromSelection() {
    const isStickerSelected = selectedElement && selectedElement.type === 'sticker';
    DOMElements.removeStickerBtn.disabled = !isStickerSelected;
    // Sticker select and add button should always be available to add NEW stickers
    DOMElements.stickerSelect.disabled = false;
    DOMElements.addStickerBtn.disabled = false;
}

// --- Core Canvas Rendering ---

/**
 * Clears the canvas and draws the background, frame, photos, text, stickers, and drawings.
 */
async function renderCanvas() {
    if (!ctx || !currentConfig) {
        console.warn('Canvas context or config not initialized for rendering.');
        return;
    }

    // Set canvas dimensions
    DOMElements.photoStripCanvas.width = currentConfig.stripWidth;
    DOMElements.photoStripCanvas.height = currentConfig.stripHeight;

    // Clear canvas
    ctx.clearRect(0, 0, DOMElements.photoStripCanvas.width, DOMElements.photoStripCanvas.height);

    // Draw background color or image
    const selectedBackgroundSrc = DOMElements.backgroundSelect.value;
    if (selectedBackgroundSrc && selectedBackgroundSrc !== 'none') {
        try {
            const backgroundImg = await loadImage(selectedBackgroundSrc);
            // Draw background to fill the whole strip
            ctx.drawImage(backgroundImg, 0, 0, DOMElements.photoStripCanvas.width, DOMElements.photoStripCanvas.height);
        } catch (error) {
            console.error('Error loading background image:', error);
            ctx.fillStyle = currentConfig.defaultBackground || '#CCCCCC';
            ctx.fillRect(0, 0, DOMElements.photoStripCanvas.width, DOMElements.photoStripCanvas.height);
        }
    } else {
        ctx.fillStyle = currentConfig.defaultBackground || '#CCCCCC';
        ctx.fillRect(0, 0, DOMElements.photoStripCanvas.width, DOMElements.photoStripCanvas.height);
    }

    // Draw captured photos onto their respective frames
    capturedImages.forEach((img, index) => {
        if (currentConfig.frames[index]) {
            const frame = currentConfig.frames[index];
            // Calculate aspect ratios
            const imgAspectRatio = img.width / img.height;
            const frameAspectRatio = frame.width / frame.height;

            let drawWidth = frame.width;
            let drawHeight = frame.height;
            let sx = 0; // Source X
            let sy = 0; // Source Y
            let sWidth = img.width; // Source Width
            let sHeight = img.height; // Source Height

            // Maintain aspect ratio while covering the frame (cropping if necessary)
            if (imgAspectRatio > frameAspectRatio) {
                // Image is wider than frame, crop horizontally
                sWidth = img.height * frameAspectRatio;
                sx = (img.width - sWidth) / 2;
            } else {
                // Image is taller than frame, crop vertically
                sHeight = img.width / frameAspectRatio;
                sy = (img.height - sHeight) / 2;
            }

            // Draw image to canvas
            ctx.drawImage(img, sx, sy, sWidth, sHeight, frame.x, frame.y, drawWidth, drawHeight);
        }
    });

    // Draw frame overlay
    const selectedFrameSrc = DOMElements.frameSelect.value;
    if (selectedFrameSrc && selectedFrameSrc !== 'none') {
        try {
            const frameImg = await loadImage(selectedFrameSrc);
            ctx.drawImage(frameImg, 0, 0, DOMElements.photoStripCanvas.width, DOMElements.photoStripCanvas.height);
        } catch (error) {
            console.error('Error loading frame image:', error);
        }
    }

    // Draw active elements (text, stickers)
    activeElements.forEach(element => {
        if (element.type === 'text') {
            drawText(element);
        } else if (element.type === 'sticker') {
            drawSticker(element);
        }
    });

    // Draw drawings
    drawings.forEach(path => {
        if (path.length > 1) {
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x, path[i].y);
            }
            ctx.strokeStyle = path[0].color;
            ctx.lineWidth = path[0].size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        }
    });

    // NEW: Draw real-time date
    if (showDateTimeOnStrip) {
        drawDateTime();
    }

    // Draw selection handles for the selected element (if any)
    if (selectedElement) {
        drawSelectionHandles(selectedElement);
    }
}


/**
 * Draws a text element on the canvas.
 * @param {object} textElement - The text element object.
 */
function drawText(textElement) {
    ctx.font = `${textElement.bold ? 'bold ' : ''}${textElement.italic ? 'italic ' : ''}${textElement.size}px ${textElement.font}`;
    ctx.fillStyle = textElement.color;
    ctx.textAlign = textElement.align;

    // Calculate x position based on alignment
    let x;
    if (textElement.align === 'center') {
        x = textElement.x || DOMElements.photoStripCanvas.width / 2;
    } else if (textElement.align === 'left') {
        x = textElement.x || currentConfig.common.photoSidePadding; // Align to left padding
    } else { // right
        x = textElement.x || DOMElements.photoStripCanvas.width - currentConfig.common.photoSidePadding; // Align to right padding
    }

    // Apply shadow if blur is greater than 0
    if (textElement.shadowBlur > 0) {
        ctx.shadowColor = textElement.shadowColor;
        ctx.shadowBlur = textElement.shadowBlur;
        ctx.shadowOffsetX = 2; // Fixed offset for shadow effect
        ctx.shadowOffsetY = 2; // Fixed offset for shadow effect
    } else {
        ctx.shadowColor = 'transparent'; // No shadow
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    ctx.fillText(textElement.text, x, textElement.y);

    // Reset shadow properties after drawing text to avoid affecting other elements
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

/**
 * Draws a sticker element on the canvas.
 * @param {object} stickerElement - The sticker element object.
 */
function drawSticker(stickerElement) {
    if (stickerElement.img) {
        ctx.drawImage(stickerElement.img, stickerElement.x, stickerElement.y, stickerElement.width, stickerElement.height);
    }
}

/**
 * Draws selection handles around the currently selected element.
 * @param {object} element - The selected element (text or sticker).
 */
function drawSelectionHandles(element) {
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // Dashed line

    let x, y, width, height;

    if (element.type === 'text') {
        ctx.font = `${element.bold ? 'bold ' : ''}${element.italic ? 'italic ' : ''}${element.size}px ${element.font}`;
        const metrics = ctx.measureText(element.text);
        width = metrics.width;
        height = element.size * 1.2; // Approximation for text height

        // Adjust x based on alignment for selection box
        if (element.align === 'center') {
            x = element.x - width / 2;
        } else if (element.align === 'left') {
            x = element.x;
        } else { // right
            x = element.x - width;
        }
        y = element.y - element.size; // Adjust y to be at the top of the text
    } else if (element.type === 'sticker') {
        x = element.x;
        y = element.y;
        width = element.width;
        height = element.height;
    }

    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]); // Reset line dash
}

/**
 * Draws the current date in YYYY.MM.DD format on the canvas.
 */
function drawDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 0-indexed month, add leading zero
    const day = now.getDate().toString().padStart(2, '0'); // Add leading zero

    const formattedDate = `${year}.${month}.${day}`;

    ctx.font = 'bold 24px Poppins'; // Fixed font size and style for date
    ctx.fillStyle = '#333333'; // Dark gray color
    ctx.textAlign = 'center';

    // Position it centrally in the bottom space, slightly above the very bottom
    const x = DOMElements.photoStripCanvas.width / 2;
    const y = currentConfig.stripHeight - (currentConfig.common.bottomSpaceForLogo / 2) + 20; // Adjust Y as needed

    ctx.fillText(formattedDate, x, y);
}


// --- Event Handlers ---

/**
 * Handles mouse/touch down events on the canvas for dragging and selection.
 * @param {Event} event - The mouse or touch event.
 */
function handleCanvasMouseDown(event) {
    const coords = getCanvasCoords(event);
    let clickedOnElement = false;

    // Check if clicked on any active element (stickers or text)
    // Iterate in reverse to select elements drawn on top
    for (let i = activeElements.length - 1; i >= 0; i--) {
        const element = activeElements[i];
        let elementX, elementY, elementWidth, elementHeight;

        if (element.type === 'text') {
            ctx.font = `${element.bold ? 'bold ' : ''}${element.italic ? 'italic ' : ''}${element.size}px ${element.font}`;
            const metrics = ctx.measureText(element.text);
            elementWidth = metrics.width;
            elementHeight = element.size * 1.2;
            if (element.align === 'center') {
                elementX = element.x - elementWidth / 2;
            } else if (element.align === 'left') {
                elementX = element.x;
            } else {
                elementX = element.x - elementWidth;
            }
            elementY = element.y - element.size;
        } else if (element.type === 'sticker') {
            elementX = element.x;
            elementY = element.y;
            elementWidth = element.width;
            elementHeight = element.height;
        }

        if (coords.x >= elementX && coords.x <= elementX + elementWidth &&
            coords.y >= elementY && coords.y <= elementY + elementHeight) {
            selectedElement = element;
            dragOffsetX = coords.x - elementX;
            dragOffsetY = coords.y - elementY;
            isDragging = true;
            clickedOnElement = true;
            console.log('Element selected:', selectedElement);
            updateTextControlsFromSelection();
            updateStickerControlsFromSelection();
            renderCanvas(); // Redraw to show selection handles
            break;
        }
    }

    if (!clickedOnElement) {
        selectedElement = null; // Deselect if clicked outside any element
        updateTextControlsFromSelection();
        updateStickerControlsFromSelection();
        renderCanvas(); // Redraw to hide selection handles
    }

    if (isDrawing) {
        currentPath = [];
        currentPath.push({ x: coords.x, y: coords.y, color: DOMElements.brushColorInput.value, size: parseInt(DOMElements.brushSizeInput.value) });
        isDragging = true; // Use isDragging for drawing as well
    }
}

/**
 * Handles mouse/touch move events for dragging elements or drawing.
 * @param {Event} event - The mouse or touch event.
 */
function handleCanvasMouseMove(event) {
    if (!isDragging) return;

    const coords = getCanvasCoords(event);

    if (isDrawing) {
        currentPath.push({ x: coords.x, y: coords.y, color: DOMElements.brushColorInput.value, size: parseInt(DOMElements.brushSizeInput.value) });
        renderCanvas(); // Redraw constantly while drawing
    } else if (selectedElement) {
        // Update position of selected element
        if (selectedElement.type === 'text') {
            // Text position is based on baseline and alignment
            // Need to reverse the adjustment done in drawText for x
            if (selectedElement.align === 'center') {
                selectedElement.x = coords.x; // Keep center X as coords.x
            } else if (selectedElement.align === 'left') {
                selectedElement.x = coords.x - dragOffsetX;
            } else { // right
                selectedElement.x = coords.x + (selectedElement.width - dragOffsetX); // This might need more precise calculation
            }
            selectedElement.y = coords.y - dragOffsetY + selectedElement.size; // Adjust Y back to baseline
        } else if (selectedElement.type === 'sticker') {
            selectedElement.x = coords.x - dragOffsetX;
            selectedElement.y = coords.y - dragOffsetY;
        }
        renderCanvas(); // Redraw with new position
    }
}

/**
 * Handles mouse/touch up events to stop dragging or drawing.
 */
function handleCanvasMouseUp() {
    isDragging = false;
    if (isDrawing && currentPath.length > 1) {
        drawings.push(currentPath); // Save the completed path
    }
    currentPath = [];
    renderCanvas(); // Final redraw after move/drag/draw ends
}

/**
 * Handles adding a new text element to the canvas.
 */
function handleAddText() {
    const text = DOMElements.textInput.value.trim();
    if (text) {
        // Default position: center of the strip, just above the bottom logo area
        const x = DOMElements.photoStripCanvas.width / 2;
        const y = currentConfig.stripHeight - currentConfig.common.bottomSpaceForLogo - 30;

        const newText = {
            type: 'text',
            text: text,
            x: x,
            y: y,
            font: DOMElements.fontSelect.value,
            size: parseInt(DOMElements.fontSizeInput.value),
            color: DOMElements.textColorInput.value,
            shadowColor: DOMElements.textShadowColorInput.value,
            shadowBlur: parseInt(DOMElements.textShadowBlurInput.value),
            bold: DOMElements.boldToggleBtn.classList.contains('active'),
            italic: DOMElements.italicToggleBtn.classList.contains('active'),
            align: DOMElements.textAlignSelect.value
        };
        activeElements.push(newText);
        DOMElements.textInput.value = ''; // Clear input
        selectedElement = newText; // Select the newly added text
        updateTextControlsFromSelection();
        renderCanvas();
        logAnalytics('Text_Added', { text: text });
    } else {
        alert('Please enter some text!');
    }
}

/**
 * Handles removing the selected text element.
 */
function handleRemoveText() {
    if (selectedElement && selectedElement.type === 'text') {
        activeElements = activeElements.filter(el => el !== selectedElement);
        selectedElement = null; // Deselect
        updateTextControlsFromSelection();
        renderCanvas();
        logAnalytics('Text_Removed');
    }
}

/**
 * Handles adding a new sticker element to the canvas.
 */
async function handleAddSticker() {
    const stickerId = DOMElements.stickerSelect.value;
    const stickerInfo = STICKER_FILES.find(s => s.id === stickerId);

    if (stickerInfo) {
        try {
            const stickerImg = await loadImage(STICKER_BASE_PATH + stickerInfo.src);
            // Default size and position (center)
            const width = 100;
            const height = (stickerImg.height / stickerImg.width) * width;
            const x = (DOMElements.photoStripCanvas.width / 2) - (width / 2);
            const y = (DOMElements.photoStripCanvas.height / 2) - (height / 2);

            const newSticker = {
                type: 'sticker',
                id: stickerId,
                img: stickerImg,
                x: x,
                y: y,
                width: width,
                height: height
            };
            activeElements.push(newSticker);
            selectedElement = newSticker; // Select the newly added sticker
            updateStickerControlsFromSelection();
            renderCanvas();
            logAnalytics('Sticker_Added', { stickerId: stickerId });
        } catch (error) {
            console.error('Error loading sticker image:', error);
            alert('Failed to load sticker image.');
        }
    } else {
        alert('Please select a sticker!');
    }
}

/**
 * Handles removing the selected sticker element.
 */
function handleRemoveSticker() {
    if (selectedElement && selectedElement.type === 'sticker') {
        activeElements = activeElements.filter(el => el !== selectedElement);
        selectedElement = null; // Deselect
        updateStickerControlsFromSelection();
        renderCanvas();
        logAnalytics('Sticker_Removed');
    }
}

/**
 * Toggles drawing mode on/off.
 */
function toggleDrawMode() {
    isDrawing = !isDrawing;
    if (isDrawing) {
        DOMElements.toggleDrawModeBtn.classList.add('active');
        DOMElements.canvasContainer.classList.add('drawing-mode');
        // Deselect any active element when entering drawing mode
        selectedElement = null;
        updateTextControlsFromSelection();
        updateStickerControlsFromSelection();
        renderCanvas();
        logAnalytics('Draw_Mode_Enabled');
    } else {
        DOMElements.toggleDrawModeBtn.classList.remove('active');
        DOMElements.canvasContainer.classList.remove('drawing-mode');
        logAnalytics('Draw_Mode_Disabled');
    }
}

/**
 * Clears all drawings from the canvas.
 */
function clearAllDrawings() {
    if (confirm('Are you sure you want to clear all drawings? This cannot be undone.')) {
        drawings = [];
        renderCanvas();
        logAnalytics('Drawings_Cleared');
    }
}

/**
 * Populates dropdowns with available options (frames, backgrounds, stickers).
 */
function populateOptions() {
    // Populate Frame Select
    DOMElements.frameSelect.innerHTML = '<option value="none">No Frame</option>';
    currentConfig.availableFrames.forEach(frame => {
        const option = document.createElement('option');
        option.value = frame.src;
        option.textContent = frame.name;
        DOMElements.frameSelect.appendChild(option);
    });

    // Populate Background Select (example, you might expand this)
    DOMElements.backgroundSelect.innerHTML = '<option value="none">Default Background</option>';
    // Example backgrounds - you'd add more real options here
    DOMElements.backgroundSelect.add(new Option('Light Gray', '#E0E0E0'));
    DOMElements.backgroundSelect.add(new Option('Blue Gradient', 'assets/blue-gradient-bg.png')); // Example image background
    DOMElements.backgroundSelect.add(new Option('Pink Gradient', 'assets/pink-gradient-bg.png')); // Example image background


    // Populate Sticker Select
    DOMElements.stickerSelect.innerHTML = '<option value="">Select Sticker</option>';
    STICKER_FILES.forEach(sticker => {
        const option = document.createElement('option');
        option.value = sticker.id;
        option.textContent = sticker.name;
        DOMElements.stickerSelect.appendChild(option);
    });
}

/**
 * Sets up all event listeners for UI interactions.
 */
function setupEventListeners() {
    DOMElements.backgroundSelect.addEventListener('change', renderCanvas);
    DOMElements.frameSelect.addEventListener('change', renderCanvas);

    // Canvas interaction for dragging and drawing
    DOMElements.photoStripCanvas.addEventListener('mousedown', handleCanvasMouseDown);
    DOMElements.photoStripCanvas.addEventListener('mousemove', handleCanvasMouseMove);
    DOMElements.photoStripCanvas.addEventListener('mouseup', handleCanvasMouseUp);
    DOMElements.photoStripCanvas.addEventListener('mouseout', handleCanvasMouseUp); // End drag/draw if mouse leaves canvas

    DOMElements.photoStripCanvas.addEventListener('touchstart', handleCanvasMouseDown, { passive: true });
    DOMElements.photoStripCanvas.addEventListener('touchmove', handleCanvasMouseMove, { passive: true });
    DOMElements.photoStripCanvas.addEventListener('touchend', handleCanvasMouseUp);
    DOMElements.photoStripCanvas.addEventListener('touchcancel', handleCanvasMouseUp);

    // Text controls
    DOMElements.addTextBtn.addEventListener('click', handleAddText);
    DOMElements.removeTextBtn.addEventListener('click', handleRemoveText);
    DOMElements.textInput.addEventListener('input', () => { // Live update selected text
        if (selectedElement && selectedElement.type === 'text') {
            selectedElement.text = DOMElements.textInput.value;
            renderCanvas();
        }
    });
    DOMElements.fontSelect.addEventListener('change', (e) => {
        if (selectedElement && selectedElement.type === 'text') selectedElement.font = e.target.value;
        renderCanvas();
    });
    DOMElements.fontSizeInput.addEventListener('input', (e) => {
        if (selectedElement && selectedElement.type === 'text') selectedElement.size = parseInt(e.target.value);
        renderCanvas();
    });
    DOMElements.textColorInput.addEventListener('input', (e) => {
        if (selectedElement && selectedElement.type === 'text') selectedElement.color = e.target.value;
        renderCanvas();
    });
    DOMElements.textShadowColorInput.addEventListener('input', (e) => {
        if (selectedElement && selectedElement.type === 'text') selectedElement.shadowColor = e.target.value;
        renderCanvas();
    });
    DOMElements.textShadowBlurInput.addEventListener('input', (e) => {
        if (selectedElement && selectedElement.type === 'text') selectedElement.shadowBlur = parseInt(e.target.value);
        renderCanvas();
    });
    DOMElements.boldToggleBtn.addEventListener('click', () => {
        if (selectedElement && selectedElement.type === 'text') {
            selectedElement.bold = !selectedElement.bold;
            DOMElements.boldToggleBtn.classList.toggle('active', selectedElement.bold);
            renderCanvas();
        }
    });
    DOMElements.italicToggleBtn.addEventListener('click', () => {
        if (selectedElement && selectedElement.type === 'text') {
            selectedElement.italic = !selectedElement.italic;
            DOMElements.italicToggleBtn.classList.toggle('active', selectedElement.italic);
            renderCanvas();
        }
    });
    DOMElements.textAlignSelect.addEventListener('change', (e) => {
        if (selectedElement && selectedElement.type === 'text') {
            selectedElement.align = e.target.value;
            // When alignment changes, recalculate x to keep it visually "in place"
            // This is a rough estimation and can be improved for precise alignment transitions
            if (e.target.value === 'center') {
                selectedElement.x = DOMElements.photoStripCanvas.width / 2;
            } else if (e.target.value === 'left') {
                selectedElement.x = currentConfig.common.photoSidePadding;
            } else { // right
                selectedElement.x = DOMElements.photoStripCanvas.width - currentConfig.common.photoSidePadding;
            }
            renderCanvas();
        }
    });

    // Sticker controls
    DOMElements.addStickerBtn.addEventListener('click', handleAddSticker);
    DOMElements.removeStickerBtn.addEventListener('click', handleRemoveSticker);

    // Drawing controls
    DOMElements.toggleDrawModeBtn.addEventListener('click', toggleDrawMode);
    DOMElements.brushColorInput.addEventListener('input', () => {
        // No direct effect on existing drawings, only for new strokes
    });
    DOMElements.brushSizeInput.addEventListener('input', () => {
        // No direct effect on existing drawings, only for new strokes
    });
    DOMElements.clearDrawingsBtn.addEventListener('click', clearAllDrawings);

    // Download and Print
    DOMElements.downloadStripBtn.addEventListener('click', downloadStrip);
    DOMElements.printStripBtn.addEventListener('click', printStrip);

    // Back to Capture Page
    DOMElements.retakeBtn.addEventListener('click', () => {
        window.location.href = 'capture-page/capture-page.html';
        logAnalytics('Retake_Photos_Navigated');
    });

    // NEW: Date/Time Event Listener
    DOMElements.toggleDateTime.addEventListener('change', (e) => {
        showDateTimeOnStrip = e.target.checked;
        renderCanvas();
        logAnalytics('DateTime_Toggle', { enabled: showDateTimeOnStrip });
    });
}

/**
 * Downloads the generated photo strip as an image.
 */
function downloadStrip() {
    const format = DOMElements.downloadFormatSelect.value;
    let mimeType = format;
    let quality = 1.0; // Default for PNG

    if (format.includes('image/jpeg')) {
        [mimeType, quality] = format.split(';');
        quality = parseFloat(quality);
    }

    const dataURL = DOMElements.photoStripCanvas.toDataURL(mimeType, quality);
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `ODZ_PhotoStrip_${Date.now()}.${mimeType.split('/')[1].split(';')[0]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    logAnalytics('Strip_Downloaded', { format: mimeType, quality: quality });
}

/**
 * Prints the generated photo strip.
 */
function printStrip() {
    const dataURL = DOMElements.photoStripCanvas.toDataURL('image/png'); // Always print PNG for quality
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Print Photo Strip</title>
            <style>
                body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; }
                img { max-width: 100%; max-height: 90vh; display: block; margin: auto; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
                @media print {
                    body { background: none; }
                    img { page-break-after: always; }
                }
            </style>
        </head>
        <body>
            <img src="${dataURL}" onload="window.print();window.close()" />
        </body>
        </html>
    `);
    printWindow.document.close();
    logAnalytics('Strip_Printed');
}


// --- Initialization ---

/**
 * Initializes the editing page: loads captured photos, sets up canvas, and renders the initial strip.
 */
async function initializeEditorPage() {
    // Get the selected photo count from localStorage
    const storedPhotoCount = localStorage.getItem('selectedPhotoCount');
    const configKey = storedPhotoCount || '4'; // Default to 4 if not found

    if (!STRIP_LAYOUT_CONFIGS[configKey]) {
        console.error(`No configuration found for photo count: ${configKey}. Defaulting to '4'.`);
        currentConfig = STRIP_LAYOUT_CONFIGS['4'];
    } else {
        currentConfig = STRIP_LAYOUT_CONFIGS[configKey];
    }

    // Get the canvas context
    ctx = DOMElements.photoStripCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
        console.error('Failed to get 2D canvas context.');
        alert('Your browser does not support the canvas features required for editing.');
        return;
    }

    // Load captured photos from localStorage
    const capturedPhotosData = JSON.parse(localStorage.getItem('capturedPhotos') || '[]');
    if (capturedPhotosData.length === 0) {
        alert('No photos captured! Please go back and capture some photos.');
        DOMElements.retakeBtn.textContent = 'Capture Photos Now';
        // Optionally disable editing controls if no photos
        // For now, allow user to play with text/stickers even without photos
    }

    try {
        capturedImages = await Promise.all(capturedPhotosData.map(dataURL => loadImage(dataURL)));
        console.log(`Loaded ${capturedImages.length} captured photos.`);
    } catch (error) {
        console.error('Error loading captured photos:', error);
        alert('Failed to load captured photos. Please try capturing them again.');
        capturedImages = []; // Clear array if loading fails
    }

    // Initialize UI controls with default values
    DOMElements.fontSelect.value = DEFAULT_TEXT_SETTINGS.font;
    DOMElements.fontSizeInput.value = DEFAULT_TEXT_SETTINGS.size;
    DOMElements.textColorInput.value = DEFAULT_TEXT_SETTINGS.color;
    DOMElements.textShadowColorInput.value = DEFAULT_TEXT_SETTINGS.shadowColor;
    DOMElements.textShadowBlurInput.value = DEFAULT_TEXT_SETTINGS.shadowBlur;
    DOMElements.textAlignSelect.value = DEFAULT_TEXT_SETTINGS.align;
    if (DOMElements.brushColorInput) DOMElements.brushColorInput.value = DEFAULT_DRAWING_SETTINGS.color;
    if (DOMElements.brushSizeInput) DOMElements.brushSizeInput.value = DEFAULT_DRAWING_SETTINGS.size;

    // Initially disable controls that depend on selection or specific modes
    updateTextControlsFromSelection();
    // IMPORTANT: Explicitly ensure text input and add button are ENABLED after the above call
    // This handles the case where there ARE photos, but no text is selected initially.
    if (DOMElements.textInput) DOMElements.textInput.disabled = false;
    if (DOMElements.addTextBtn) DOMElements.addTextBtn.disabled = false;

    updateStickerControlsFromSelection(); // This will disable remove sticker button initially
    if (DOMElements.toggleDrawModeBtn) DOMElements.toggleDrawModeBtn.classList.remove('active'); // Ensure draw button isn't active by default

    // NEW: Initialize date/time controls
    DOMElements.toggleDateTime.checked = showDateTimeOnStrip; // This will be false by default

    populateOptions(); // Fill dropdowns with relevant options
    setupEventListeners(); // Attach all event listeners
    renderCanvas(); // Initial render of the photo strip
    logAnalytics('Editor_Page_Loaded_Successfully', { layout: configKey });
}

// Ensure the `initializeEditorPage` function runs only after the entire HTML document is loaded.
// This prevents errors where JavaScript tries to find elements before they exist on the page.
document.addEventListener('DOMContentLoaded', initializeEditorPage);
