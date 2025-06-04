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
            { id: 'option3', src: 'assets/strip-frame-1-photos-option3.png', name: 'Styled Border' },
            { id: 'customColorOption', src: 'CUSTOM_COLOR_PLACEHOLDER', name: 'Custom Color' } // Added Custom Color
        ]
    },
    // Configuration for a 2-photo strip
    '2': {
        stripWidth: 400,
        stripHeight: 40 + (2 * 240) + 20 + 150, // topPadding + (2*photoHeight) + gap + bottomSpaceForLogo
        frames: [
            { x: 40, y: 40, width: 320, height: 240 },
            { x: 40, y: 40 + 240 + 20, width: 320, height: 240 }
        ],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-2-photos-option1.png', name: 'Original Double' },
            { id: 'option2', src: 'assets/strip-frame-2-photos-option2.png', name: 'Minimal Lines' },
            { id: 'option3', src: 'assets/strip-frame-2-photos-option3.png', name: 'Decorative Duo' },
            { id: 'customColorOption', src: 'CUSTOM_COLOR_PLACEHOLDER', name: 'Custom Color' } // Added Custom Color
        ]
    },
    // Configuration for a 3-photo strip
    '3': {
        stripWidth: 400,
        stripHeight: 40 + (3 * 220) + (2 * 20) + 150, // topPadding + (3*photoHeight) + (2*gap) + bottomSpaceForLogo
        frames: [
            { x: 40, y: 40, width: 320, height: 220 },
            { x: 40, y: 40 + 220 + 20, width: 320, height: 220 },
            { x: 40, y: 40 + (2 * 220) + (2 * 20), width: 320, height: 220 }
        ],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-3-photos-option1.png', name: 'Original Triple' },
            { id: 'option2', src: 'assets/strip-frame-3-photos-option2.png', name: 'Simple Border' },
            { id: 'option3', src: 'assets/strip-frame-3-photos-option3.png', name: 'Modern Style' },
            { id: 'customColorOption', src: 'CUSTOM_COLOR_PLACEHOLDER', name: 'Custom Color' } // Added Custom Color
        ]
    },
    // Configuration for a 4-photo strip
    '4': {
        stripWidth: 400,
        stripHeight: 40 + (4 * 226) + (3 * 20) + 150, // topPadding + (4*photoHeight) + (3*gap) + bottomSpaceForLogo
        frames: [
            { x: 40, y: 40, width: 320, height: 226 },
            { x: 40, y: 40 + 226 + 20, width: 320, height: 226 },
            { x: 40, y: 40 + (2 * 226) + (2 * 20), width: 320, height: 226 },
            { x: 40, y: 40 + (3 * 226) + (3 * 20), width: 320, height: 226 }
        ],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-4-photos-option1.png', name: 'Original Quad' },
            { id: 'option2', src: 'assets/strip-frame-4-photos-option2.png', name: 'Vintage Edge' },
            { id: 'option3', src: 'assets/strip-frame-4-photos-option3.png', name: 'Clean Frame' },
            { id: 'customColorOption', src: 'CUSTOM_COLOR_PLACEHOLDER', name: 'Custom Color' } // Added Custom Color
        ]
    },
    // Configuration for a 6-photo strip (2 columns)
    '6': {
        stripWidth: 760, // Wider for two columns
        stripHeight: 40 + (3 * 220) + (2 * 20) + 150, // topPadding + (3*photoHeight) + (2*gap) + bottomSpaceForLogo (same as 3-photo vertical)
        frames: [
            { x: 40, y: 40, width: 320, height: 220 },
            { x: 40, y: 40 + 220 + 20, width: 320, height: 220 },
            { x: 40, y: 40 + (2 * 220) + (2 * 20), width: 320, height: 220 },
            { x: 400, y: 40, width: 320, height: 220 }, // Second column starts at 400 (40 + 320 + 40)
            { x: 400, y: 40 + 220 + 20, width: 320, height: 220 },
            { x: 400, y: 40 + (2 * 220) + (2 * 20), width: 320, height: 220 }
        ],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-6-photos-option1.png', name: 'Original Six' },
            { id: 'option2', src: 'assets/strip-frame-6-photos-option2.png', name: 'Two-Column Classic' },
            { id: 'customColorOption', src: 'CUSTOM_COLOR_PLACEHOLDER', name: 'Custom Color' } // Added Custom Color
        ]
    }
};

// --- Default Settings for Draggable Elements ---
const DEFAULT_TEXT_SETTINGS = {
    font: 'Fredoka, cursive',
    size: 40,
    color: '#333333',
    align: 'center',
    isBold: false,
    isItalic: false,
    isUnderline: false,
};

const DEFAULT_DRAWING_SETTINGS = {
    color: '#FF0000',
    size: 10
};

// --- DOM Element References (Centralized for Clarity) ---
const DOMElements = {
    photoCanvas: document.getElementById("photoCanvas"),
    ctx: null, // Initialized in initializeEditorPage
    frameSelect: document.getElementById("frameSelect"),
    customBackgroundColorInput: document.getElementById("customBackgroundColorInput"), // NEW: Custom Background Color Input
    stickerSelect: document.getElementById("stickerSelect"),
    addStickerBtn: document.getElementById("addStickerBtn"),
    removeStickerBtn: document.getElementById("removeStickerBtn"),
    textInput: document.getElementById("textInput"),
    textColorInput: document.getElementById("textColor"),
    textFontSelect: document.getElementById("textFont"),
    textSizeInput: document.getElementById("textSize"),
    addTextBtn: document.getElementById("addTextBtn"),
    removeTextBtn: document.getElementById("removeTextBtn"),
    textBoldBtn: document.getElementById('textBoldBtn'),
    textItalicBtn: document.getElementById('textItalicBtn'),
    textUnderlineBtn: document.getElementById('textUnderlineBtn'),
    textAlignSelect: document.getElementById('textAlignSelect'),
    downloadStripBtn: document.getElementById("downloadStripBtn"),
    downloadFormatSelect: document.getElementById('downloadFormat'),
    retakeBtn: document.getElementById("retakeBtn"),
    noPhotosMessage: document.getElementById('no-photos-message'),
    downloadSpinner: document.getElementById('download-spinner'),
    toggleDrawModeBtn: document.getElementById('toggleDrawModeBtn'), // Assuming this button exists for drawing
    brushSizeInput: document.getElementById('brushSize'),
    brushColorInput: document.getElementById('brushColor'),
};

// --- Global State Variables ---
let capturedPhotosBase64 = [];
let currentStripConfig = null;
let preloadedCapturedImages = []; // Stores preloaded Image objects for captured photos

let stickers = []; // Stores dynamically added and draggable sticker objects
let texts = []; // Stores dynamically added and draggable text objects
let drawings = []; // Stores drawing paths

let selectedDraggable = null; // Reference to the currently selected sticker or text object
let isDragging = false; // Flag for drag operations
let dragOffsetX, dragOffsetY; // Offset for drag positioning

let currentFrameImgSrc = ''; // Path to the currently selected frame image
let isCustomBackgroundSelected = false; // NEW: Flag if custom background color is active
let customBackgroundColor = '#FFFFFF'; // NEW: The selected custom background color

let isDrawingMode = false; // Flag for drawing mode
let lastX = 0, lastY = 0; // For drawing lines

// --- Utility Functions ---

/**
 * Loads an image from a given source.
 * @param {string} src - The image source (URL or Base64).
 * @returns {Promise<HTMLImageElement>} A promise that resolves with the loaded image.
 */
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });
}

/**
 * Preloads all captured photo images to ensure they are ready for canvas drawing.
 */
async function preloadAllCapturedImages() {
    preloadedCapturedImages = []; // Clear previous preloaded images
    const promises = capturedPhotosBase64.map(src => loadImage(src));
    try {
        preloadedCapturedImages = await Promise.all(promises);
        console.log("All captured photos preloaded for editing.");
    } catch (error) {
        console.error("Error preloading captured images:", error);
        // Continue even if some images fail to load; error will be handled during drawing
    }
}

/**
 * Displays an info/error message in the canvas area and hides the canvas.
 * @param {string} mainMsg - The primary message.
 * @param {'info'|'error'} type - The type of message for styling.
 * @param {string} [subMsg=''] - An optional secondary message (can contain HTML).
 */
function displayMessageInCanvasArea(mainMsg, type = 'info', subMsg = '') {
    if (!DOMElements.noPhotosMessage || !DOMElements.photoCanvas || !DOMElements.downloadSpinner) {
        console.error("Critical DOM elements for messages are missing.");
        return;
    }

    let mainParagraph = DOMElements.noPhotosMessage.querySelector('p:first-child');
    if (!mainParagraph) {
        mainParagraph = document.createElement('p');
        DOMElements.noPhotosMessage.prepend(mainParagraph);
    }
    mainParagraph.innerText = mainMsg;

    let subMsgElement = DOMElements.noPhotosMessage.querySelector('.sub-message');
    if (!subMsgElement) {
        subMsgElement = document.createElement('p');
        subMsgElement.classList.add('sub-message');
        DOMElements.noPhotosMessage.appendChild(subMsgElement);
    }
    subMsgElement.innerHTML = subMsg;

    DOMElements.noPhotosMessage.className = `info-message ${type}`;
    DOMElements.noPhotosMessage.style.display = 'block';
    DOMElements.photoCanvas.style.display = 'none';
    DOMElements.downloadSpinner.classList.add('hidden-spinner'); // Hide spinner if message is shown
}

/**
 * Hides the info/error message and shows the canvas.
 */
function hideMessageInCanvasArea() {
    if (DOMElements.noPhotosMessage) {
        DOMElements.noPhotosMessage.style.display = 'none';
    }
    if (DOMElements.photoCanvas) {
        DOMElements.photoCanvas.style.display = 'block';
    }
}

/**
 * Shows/hides the download processing spinner for the strip.
 * @param {boolean} show - True to show, false to hide.
 */
function showDownloadSpinner(show) {
    if (!DOMElements.downloadSpinner || !DOMElements.photoCanvas || !DOMElements.noPhotosMessage) {
        console.error("Critical DOM elements for spinner are missing.");
        return;
    }
    if (show) {
        DOMElements.downloadSpinner.classList.remove('hidden-spinner');
        DOMElements.photoCanvas.style.display = 'none';
        DOMElements.noPhotosMessage.style.display = 'none'; // Ensure no message is displayed
    } else {
        DOMElements.downloadSpinner.classList.add('hidden-spinner');
        // Only show canvas if no other message is active
        if (DOMElements.noPhotosMessage.style.display === 'none') {
            DOMElements.photoCanvas.style.display = 'block';
        }
    }
}


// --- Canvas Drawing Functions ---

/**
 * Main rendering function for the canvas. Draws background, frame, photos, stickers, text, and drawings.
 */
async function renderCanvas() {
    if (!DOMElements.ctx || !currentStripConfig || !DOMElements.photoCanvas) {
        console.error("Canvas context or strip config not initialized. Cannot render.");
        return;
    }

    DOMElements.ctx.clearRect(0, 0, DOMElements.photoCanvas.width, DOMElements.photoCanvas.height);

    // 1. Draw Background: Prioritize custom color, then default from config
    if (isCustomBackgroundSelected) {
        DOMElements.ctx.fillStyle = customBackgroundColor;
        DOMElements.ctx.fillRect(0, 0, DOMElements.photoCanvas.width, DOMElements.photoCanvas.height);
    } else if (currentStripConfig.defaultBackground) {
        DOMElements.ctx.fillStyle = currentStripConfig.defaultBackground;
        DOMElements.ctx.fillRect(0, 0, DOMElements.photoCanvas.width, DOMElements.photoCanvas.height);
    }

    // 2. Draw the selected frame image (ONLY if custom color is NOT selected)
    if (!isCustomBackgroundSelected && currentFrameImgSrc) {
        try {
            const frameImg = await loadImage(currentFrameImgSrc);
            DOMElements.ctx.drawImage(frameImg, 0, 0, DOMElements.photoCanvas.width, DOMElements.photoCanvas.height);
        } catch (error) {
            console.warn(`WARNING: Could not load selected strip frame image: ${currentFrameImgSrc}. Ensure it exists and is correct.`, error);
            // Fallback to default background if frame image fails to load
            DOMElements.ctx.fillStyle = currentStripConfig.defaultBackground || '#CCCCCC';
            DOMElements.ctx.fillRect(0, 0, DOMElements.photoCanvas.width, DOMElements.photoCanvas.height);
        }
    } else if (!isCustomBackgroundSelected) {
        // Fallback to default background if no frame selected and not custom color
        DOMElements.ctx.fillStyle = currentStripConfig.defaultBackground || '#CCCCCC';
        DOMElements.ctx.fillRect(0, 0, DOMElements.photoCanvas.width, DOMElements.photoCanvas.height);
    }

    drawPhotosOnStrip(DOMElements.ctx);
    drawStickersOnCanvas(DOMElements.ctx);
    drawTextOnCanvas(DOMElements.ctx);
    drawings.forEach(draw => drawLines(DOMElements.ctx, draw)); // Redraw all stored drawings
}

/**
 * Draws the captured photos onto the specified canvas context based on the current strip configuration.
 * @param {CanvasRenderingContext2D} targetCtx - The context to draw on.
 */
function drawPhotosOnStrip(targetCtx) {
    const numPhotosToDisplay = capturedPhotosBase64.length;
    const framesToUse = currentStripConfig ? currentStripConfig.frames : [];

    for (let i = 0; i < Math.min(numPhotosToDisplay, framesToUse.length); i++) {
        const frame = framesToUse[i];
        if (!frame) {
            console.warn(`WARNING: No frame configuration found for photo index ${i}. Skipping drawing photo.`);
            continue;
        }

        const img = preloadedCapturedImages[i];

        if (img && img.complete) {
            targetCtx.drawImage(img, frame.x, frame.y, frame.width, frame.height);
        } else {
            console.warn(`Preloaded image ${i} not ready. Attempting to load on demand.`);
            const imgSrc = capturedPhotosBase64[i];
            loadImage(imgSrc).then(loadedImg => {
                targetCtx.drawImage(loadedImg, frame.x, frame.y, frame.width, frame.height);
                renderCanvas(); // Re-render once image is loaded
            }).catch(error => {
                console.error(`ERROR: Failed to draw photo ${i + 1}. Image source might be corrupt. Details:`, error);
                // Draw a placeholder if image fails to load
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
 * Draws all stored sticker objects onto the canvas.
 * @param {CanvasRenderingContext2D} targetCtx - The context to draw on.
 */
function drawStickersOnCanvas(targetCtx) {
    stickers.forEach(sticker => {
        try {
            const imgToDraw = sticker.img || (() => {
                const img = new Image();
                img.src = sticker.src;
                sticker.img = img; // Cache the Image object
                return img;
            })();

            if (imgToDraw.complete) {
                targetCtx.drawImage(imgToDraw, sticker.x, sticker.y, sticker.width, sticker.height);
            } else {
                imgToDraw.onload = () => renderCanvas(); // Redraw once loaded
            }

            // Draw selection border if selected
            if (selectedDraggable === sticker) {
                targetCtx.strokeStyle = 'cyan';
                targetCtx.lineWidth = 2;
                targetCtx.setLineDash([5, 5]); // Dashed line
                targetCtx.strokeRect(sticker.x, sticker.y, sticker.width, sticker.height);
                targetCtx.setLineDash([]); // Reset line dash
            }
        } catch (error) {
            console.error(`ERROR: Failed to draw sticker ${sticker.src}:`, error);
        }
    });
}

/**
 * Draws all stored text objects onto the canvas.
 * @param {CanvasRenderingContext2D} targetCtx - The context to draw on.
 */
function drawTextOnCanvas(targetCtx) {
    texts.forEach(textObj => {
        targetCtx.fillStyle = textObj.color;
        let fontStyle = '';
        if (textObj.isItalic) fontStyle += 'italic ';
        if (textObj.isBold) fontStyle += 'bold ';

        targetCtx.font = `${fontStyle}${textObj.size}px ${textObj.font}`;
        targetCtx.textAlign = textObj.align;
        targetCtx.textBaseline = 'middle'; // For vertical centering

        // Adjust X based on alignment
        let textX = textObj.x;
        if (textObj.align === 'center') {
            textX = textObj.x + textObj.width / 2; // drawText positions from origin for center
        } else if (textObj.align === 'right') {
            textX = textObj.x + textObj.width; // drawText positions from origin for right
        }

        targetCtx.fillText(textObj.content, textX, textObj.y + textObj.height / 2); // Center Y for simpler logic

        // Draw underline if enabled
        if (textObj.isUnderline) {
            const textMetrics = targetCtx.measureText(textObj.content);
            const underlineHeight = textObj.size / 15;
            const underlineY = textObj.y + textObj.height / 2 + textObj.size / 2 - underlineHeight / 2; // Position below text

            let underlineStartX = textObj.x;
            if (textObj.align === 'center') {
                underlineStartX = textX - textMetrics.width / 2;
            } else if (textObj.align === 'right') {
                underlineStartX = textX - textMetrics.width;
            }

            targetCtx.beginPath();
            targetCtx.strokeStyle = textObj.color;
            targetCtx.lineWidth = underlineHeight;
            targetCtx.moveTo(underlineStartX, underlineY);
            targetCtx.lineTo(underlineStartX + textMetrics.width, underlineY);
            targetCtx.stroke();
        }

        // Draw selection border if selected
        if (selectedDraggable === textObj) {
            targetCtx.strokeStyle = 'cyan';
            targetCtx.lineWidth = 2;
            targetCtx.setLineDash([5, 5]); // Dashed line
            targetCtx.strokeRect(textObj.x, textObj.y, textObj.width, textObj.height);
            targetCtx.setLineDash([]); // Reset line dash
        }
    });
}

/**
 * Draws a stored drawing path onto the canvas.
 * @param {CanvasRenderingContext2D} targetCtx - The context to draw on.
 * @param {Object} draw - The drawing object containing color, size, and points.
 */
function drawLines(targetCtx, draw) {
    targetCtx.strokeStyle = draw.color;
    targetCtx.lineWidth = draw.size;
    targetCtx.lineCap = 'round'; // Makes the end of lines round
    targetCtx.lineJoin = 'round'; // Makes corners round

    targetCtx.beginPath();
    // Move to the first point if it exists
    if (draw.points.length > 0) {
        targetCtx.moveTo(draw.points[0].x, draw.points[0].y);
    }
    // Draw lines to subsequent points
    for (let i = 1; i < draw.points.length; i++) {
        targetCtx.lineTo(draw.points[i].x, draw.points[i].y);
    }
    targetCtx.stroke();
}


// --- Editor Initialization and Setup ---

/**
 * Updates canvas dimensions and populates frame options based on selected photo count.
 */
function updateCanvasAndRender() {
    const selectedPhotoCountStr = localStorage.getItem('selectedPhotoCount');
    const selectedPhotoCount = parseInt(selectedPhotoCountStr, 10);

    // Use default '3' if photo count is invalid or 5 (not supported)
    const configKey = isNaN(selectedPhotoCount) || selectedPhotoCount < 1 || selectedPhotoCount > 6 || selectedPhotoCount === 5
        ? '3'
        : selectedPhotoCount.toString();

    currentStripConfig = STRIP_LAYOUT_CONFIGS[configKey];

    if (!currentStripConfig || typeof currentStripConfig.stripWidth === 'undefined' || typeof currentStripConfig.stripHeight === 'undefined') {
        console.error('ERROR: currentStripConfig is invalid or missing dimensions! Cannot render.');
        displayMessageInCanvasArea('Error: Strip configuration missing. Please report this issue.', 'error');
        return;
    }

    DOMElements.photoCanvas.width = currentStripConfig.stripWidth;
    DOMElements.photoCanvas.height = currentStripConfig.stripHeight;

    populateFrameOptions(currentStripConfig.availableFrames);

    // Set initial frame/background state based on stored or default
    let initialFrameValue = localStorage.getItem('lastSelectedFrame') || currentStripConfig.availableFrames[0].src;

    // Check if the initial value corresponds to 'CUSTOM_COLOR_PLACEHOLDER'
    if (initialFrameValue === 'CUSTOM_COLOR_PLACEHOLDER') {
        isCustomBackgroundSelected = true;
        currentFrameImgSrc = ''; // Ensure no frame image is loaded
        // Also ensure the color picker reflects the current custom color
        if (DOMElements.customBackgroundColorInput) DOMElements.customBackgroundColorInput.value = customBackgroundColor;
    } else {
        isCustomBackgroundSelected = false;
        currentFrameImgSrc = initialFrameValue;
    }
    // Set the dropdown value, but only if the option actually exists
    if (DOMElements.frameSelect) {
        const optionExists = Array.from(DOMElements.frameSelect.options).some(opt => opt.value === initialFrameValue);
        if (optionExists) {
            DOMElements.frameSelect.value = initialFrameValue;
        } else {
            // Fallback to first option if saved value is no longer valid
            DOMElements.frameSelect.value = currentStripConfig.availableFrames[0].src;
            localStorage.setItem('lastSelectedFrame', DOMElements.frameSelect.value);
            isCustomBackgroundSelected = false; // Ensure it's not custom if falling back
            currentFrameImgSrc = DOMElements.frameSelect.value;
        }
    }


    // Toggle visibility of the custom color input based on selection
    if (DOMElements.customBackgroundColorInput) {
        DOMElements.customBackgroundColorInput.style.display = isCustomBackgroundSelected ? 'block' : 'none';
        // Also ensure label for it is visible/hidden if you have one
        const customColorLabel = document.querySelector('label[for="customBackgroundColorInput"]');
        if (customColorLabel) {
            customColorLabel.style.display = isCustomBackgroundSelected ? 'block' : 'none';
        }
    }


    renderCanvas();
}


/**
 * Populates the frame selection dropdown with available frames for the current layout.
 * @param {Array<Object>} frames - An array of frame objects from currentStripConfig.availableFrames.
 */
function populateFrameOptions(frames) {
    if (!DOMElements.frameSelect) {
        console.error("Frame select element not found.");
        return;
    }
    DOMElements.frameSelect.innerHTML = ''; // Clear existing options
    if (frames && frames.length > 0) {
        frames.forEach(frame => {
            const option = document.createElement('option');
            option.value = frame.src; // Use src as the value
            option.textContent = frame.name;
            DOMElements.frameSelect.appendChild(option);
        });
        DOMElements.frameSelect.disabled = false;
    } else {
        const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No frames available';
        DOMElements.frameSelect.appendChild(option);
        DOMElements.frameSelect.disabled = true;
    }
}

/**
 * Disables or enables sticker-related controls based on whether a sticker is selected.
 */
function updateStickerControlsFromSelection() {
    const disable = !selectedDraggable || !stickers.includes(selectedDraggable);
    if (DOMElements.removeStickerBtn) DOMElements.removeStickerBtn.disabled = disable;
}

/**
 * Disables or enables text-related controls based on whether a text element is selected.
 */
function updateTextControlsFromSelection() {
    const disable = !selectedDraggable || !texts.includes(selectedDraggable);
    if (DOMElements.removeTextBtn) DOMElements.removeTextBtn.disabled = disable;
    // Also update text property controls
    const selectedText = texts.includes(selectedDraggable) ? selectedDraggable : null;
    if (DOMElements.textColorInput) DOMElements.textColorInput.disabled = !selectedText;
    if (DOMElements.textFontSelect) DOMElements.textFontSelect.disabled = !selectedText;
    if (DOMElements.textSizeInput) DOMElements.textSizeInput.disabled = !selectedText;
    if (DOMElements.textBoldBtn) DOMElements.textBoldBtn.disabled = !selectedText;
    if (DOMElements.textItalicBtn) DOMElements.textItalicBtn.disabled = !selectedText;
    if (DOMElements.textUnderlineBtn) DOMElements.textUnderlineBtn.disabled = !selectedText;
    if (DOMElements.textAlignSelect) DOMElements.textAlignSelect.disabled = !selectedText;

    // Set values if selected
    if (selectedText) {
        if (DOMElements.textInput) DOMElements.textInput.value = selectedText.content;
        if (DOMElements.textColorInput) DOMElements.textColorInput.value = selectedText.color;
        if (DOMElements.textFontSelect) DOMElements.textFontSelect.value = selectedText.font;
        if (DOMElements.textSizeInput) DOMElements.textSizeInput.value = selectedText.size;
        if (DOMElements.textBoldBtn) {
            selectedText.isBold ? DOMElements.textBoldBtn.classList.add('active') : DOMElements.textBoldBtn.classList.remove('active');
        }
        if (DOMElements.textItalicBtn) {
            selectedText.isItalic ? DOMElements.textItalicBtn.classList.add('active') : DOMElements.textItalicBtn.classList.remove('active');
        }
        if (DOMElements.textUnderlineBtn) {
            selectedText.isUnderline ? DOMElements.textUnderlineBtn.classList.add('active') : DOMElements.textUnderlineBtn.classList.remove('active');
        }
        if (DOMElements.textAlignSelect) DOMElements.textAlignSelect.value = selectedText.align;

    } else {
        // Reset or disable controls if nothing selected
        if (DOMElements.textInput) DOMElements.textInput.value = '';
        if (DOMElements.textColorInput) DOMElements.textColorInput.value = DEFAULT_TEXT_SETTINGS.color;
        if (DOMElements.textFontSelect) DOMElements.textFontSelect.value = DEFAULT_TEXT_SETTINGS.font;
        if (DOMElements.textSizeInput) DOMElements.textSizeInput.value = DEFAULT_TEXT_SETTINGS.size;
        if (DOMElements.textBoldBtn) DOMElements.textBoldBtn.classList.remove('active');
        if (DOMElements.textItalicBtn) DOMElements.textItalicBtn.classList.remove('active');
        if (DOMElements.textUnderlineBtn) DOMElements.textUnderlineBtn.classList.remove('active');
        if (DOMElements.textAlignSelect) DOMElements.textAlignSelect.value = DEFAULT_TEXT_SETTINGS.align;
    }
}

/**
 * Main initialization function for the editor page.
 */
async function initializeEditorPage() {
    DOMElements.ctx = DOMElements.photoCanvas.getContext("2d"); // Initialize context here

    capturedPhotosBase64 = JSON.parse(localStorage.getItem('capturedPhotos') || '[]');
    const selectedPhotoCount = localStorage.getItem('selectedPhotoCount');

    // Retrieve last saved custom color
    customBackgroundColor = localStorage.getItem('customPhotoBackgroundColor') || '#FFFFFF';

    if (capturedPhotosBase64.length === 0 || !selectedPhotoCount) {
        displayMessageInCanvasArea('No photos found.', 'info', 'Please go back to <a href="capture-page/capture-page.html">capture photos</a> first.');
        // Disable all relevant controls if no photos are present
        const controlsToDisable = [
            DOMElements.stickerSelect, DOMElements.addStickerBtn, DOMElements.removeStickerBtn,
            DOMElements.textInput, DOMElements.textColorInput, DOMElements.textFontSelect,
            DOMElements.textSizeInput, DOMElements.addTextBtn, DOMElements.removeTextBtn,
            DOMElements.textBoldBtn, DOMElements.textItalicBtn, DOMElements.textUnderlineBtn,
            DOMElements.textAlignSelect, DOMElements.downloadStripBtn, DOMElements.frameSelect,
            DOMElements.customBackgroundColorInput, // NEW: Disable custom color input
            DOMElements.downloadFormatSelect
        ];
        controlsToDisable.forEach(element => { if (element) element.disabled = true; });

        // Ensure draw mode is off and its controls are disabled
        isDrawingMode = false;
        if (DOMElements.toggleDrawModeBtn) DOMElements.toggleDrawModeBtn.classList.remove('active');
        if (DOMElements.toggleDrawModeBtn) DOMElements.toggleDrawModeBtn.disabled = true;
        if (DOMElements.brushColorInput) DOMElements.brushColorInput.disabled = true;
        if (DOMElements.brushSizeInput) DOMElements.brushSizeInput.disabled = true;

        return;
    }

    // Set initial frame/background state based on last session or default
    let lastSelectedFrame = localStorage.getItem('lastSelectedFrame');
    if (lastSelectedFrame === 'CUSTOM_COLOR_PLACEHOLDER') {
        isCustomBackgroundSelected = true;
        currentFrameImgSrc = ''; // No frame image when custom color is active
    } else {
        isCustomBackgroundSelected = false;
        currentFrameImgSrc = lastSelectedFrame;
    }
    if (DOMElements.customBackgroundColorInput) DOMElements.customBackgroundColorInput.value = customBackgroundColor;


    await preloadAllCapturedImages();
    updateCanvasAndRender(); // This will also handle initial frame selection logic

    // Initialize sticker/text controls state
    updateStickerControlsFromSelection();
    updateTextControlsFromSelection();

    // Ensure text input and add button are enabled if photos exist
    if (DOMElements.textInput) DOMElements.textInput.disabled = false;
    if (DOMElements.addTextBtn) DOMElements.addTextBtn.disabled = false;
    if (DOMElements.stickerSelect) DOMElements.stickerSelect.disabled = false;
    if (DOMElements.addStickerBtn) DOMElements.addStickerBtn.disabled = false;
    if (DOMElements.downloadStripBtn) DOMElements.downloadStripBtn.disabled = false;
    if (DOMElements.downloadFormatSelect) DOMElements.downloadFormatSelect.disabled = false;

    // Drawing controls initial state
    if (DOMElements.toggleDrawModeBtn) DOMElements.toggleDrawModeBtn.classList.remove('active'); // Ensure draw button isn't active by default
    if (DOMElements.brushColorInput) DOMElements.brushColorInput.value = DEFAULT_DRAWING_SETTINGS.color;
    if (DOMElements.brushSizeInput) DOMElements.brushSizeInput.value = DEFAULT_DRAWING_SETTINGS.size;
    if (DOMElements.brushColorInput) DOMElements.brushColorInput.disabled = !isDrawingMode;
    if (DOMElements.brushSizeInput) DOMElements.brushSizeInput.disabled = !isDrawingMode;

    setupEventListeners(); // Attach all event listeners
    // No need for a separate renderCanvas() call here, updateCanvasAndRender already calls it
    // logAnalytics('Editor_Page_Loaded_Successfully', { layout: configKey }); // Assuming logAnalytics exists
}

/**
 * Attaches all necessary event listeners to DOM elements.
 */
function setupEventListeners() {
    if (DOMElements.addStickerBtn) DOMElements.addStickerBtn.addEventListener("click", handleAddSticker);
    if (DOMElements.removeStickerBtn) DOMElements.removeStickerBtn.addEventListener("click", handleRemoveSticker);
    if (DOMElements.addTextBtn) DOMElements.addTextBtn.addEventListener("click", handleAddText);
    if (DOMElements.removeTextBtn) DOMElements.removeTextBtn.addEventListener("click", handleRemoveText);

    // Text Style Event Listeners
    if (DOMElements.textBoldBtn) DOMElements.textBoldBtn.addEventListener('click', () => toggleTextStyle('isBold'));
    if (DOMElements.textItalicBtn) DOMElements.textItalicBtn.addEventListener('click', () => toggleTextStyle('isItalic'));
    if (DOMElements.textUnderlineBtn) DOMElements.textUnderlineBtn.addEventListener('click', () => toggleTextStyle('isUnderline'));
    if (DOMElements.textColorInput) DOMElements.textColorInput.addEventListener('input', () => updateTextStyle('color', DOMElements.textColorInput.value));
    if (DOMElements.textFontSelect) DOMElements.textFontSelect.addEventListener('change', () => updateTextStyle('font', DOMElements.textFontSelect.value));
    if (DOMElements.textSizeInput) DOMElements.textSizeInput.addEventListener('input', () => updateTextStyle('size', parseInt(DOMElements.textSizeInput.value)));
    if (DOMElements.textAlignSelect) DOMElements.textAlignSelect.addEventListener('change', () => updateTextStyle('align', DOMElements.textAlignSelect.value));

    // Drawing mode
    if (DOMElements.toggleDrawModeBtn) DOMElements.toggleDrawModeBtn.addEventListener('click', toggleDrawingMode);
    if (DOMElements.brushColorInput) DOMElements.brushColorInput.addEventListener('input', () => { if (isDrawingMode) DEFAULT_DRAWING_SETTINGS.color = DOMElements.brushColorInput.value; });
    if (DOMElements.brushSizeInput) DOMElements.brushSizeInput.addEventListener('input', () => { if (isDrawingMode) DEFAULT_DRAWING_SETTINGS.size = parseInt(DOMElements.brushSizeInput.value); });


    // Canvas Interaction for Dragging and Drawing
    if (DOMElements.photoCanvas) {
        DOMElements.photoCanvas.addEventListener('mousedown', handleCanvasMouseDown);
        DOMElements.photoCanvas.addEventListener('mousemove', handleCanvasMouseMove);
        DOMElements.photoCanvas.addEventListener('mouseup', handleCanvasMouseUp);
        DOMElements.photoCanvas.addEventListener('mouseout', handleCanvasMouseUp);

        DOMElements.photoCanvas.addEventListener('touchstart', handleCanvasTouchStart, { passive: false });
        DOMElements.photoCanvas.addEventListener('touchmove', handleCanvasTouchMove, { passive: false });
        DOMElements.photoCanvas.addEventListener('touchend', handleCanvasTouchEnd);
        DOMElements.photoCanvas.addEventListener('touchcancel', handleCanvasTouchEnd);
    }

    // NEW: Frame Selection Event Listener - Updated to handle custom color
    if (DOMElements.frameSelect) DOMElements.frameSelect.addEventListener('change', (event) => {
        const selectedValue = event.target.value;
        localStorage.setItem('lastSelectedFrame', selectedValue); // Save selection

        if (selectedValue === 'CUSTOM_COLOR_PLACEHOLDER') {
            isCustomBackgroundSelected = true;
            currentFrameImgSrc = ''; // No frame image when custom color is active
            if (DOMElements.customBackgroundColorInput) DOMElements.customBackgroundColorInput.style.display = 'block'; // Show color picker
            const customColorLabel = document.querySelector('label[for="customBackgroundColorInput"]');
            if (customColorLabel) customColorLabel.style.display = 'block';
        } else {
            isCustomBackgroundSelected = false;
            currentFrameImgSrc = selectedValue;
            if (DOMElements.customBackgroundColorInput) DOMElements.customBackgroundColorInput.style.display = 'none'; // Hide color picker
            const customColorLabel = document.querySelector('label[for="customBackgroundColorInput"]');
            if (customColorLabel) customColorLabel.style.display = 'none';
        }
        renderCanvas();
    });

    // NEW: Custom Background Color Input Listener
    if (DOMElements.customBackgroundColorInput) DOMElements.customBackgroundColorInput.addEventListener('input', (event) => {
        customBackgroundColor = event.target.value;
        localStorage.setItem('customPhotoBackgroundColor', customBackgroundColor); // Save color
        if (isCustomBackgroundSelected) { // Only re-render if custom color is currently active
            renderCanvas();
        }
    });


    if (DOMElements.downloadStripBtn) DOMElements.downloadStripBtn.addEventListener('click', handleDownloadStrip);
    if (DOMElements.retakeBtn) DOMElements.retakeBtn.addEventListener('click', handleRetakePhotos);
}


// --- Event Handlers ---

async function handleAddSticker() {
    const stickerSrc = DOMElements.stickerSelect.value;
    if (!stickerSrc) return;

    try {
        const img = await loadImage(stickerSrc);
        const initialWidth = 100; // Fixed initial width
        const initialHeight = (img.height / img.width) * initialWidth; // Maintain aspect ratio
        const newSticker = {
            img: img, // Store the Image object directly
            src: stickerSrc,
            x: (DOMElements.photoCanvas.width / 2) - (initialWidth / 2), // Center horizontally
            y: (DOMElements.photoCanvas.height / 2) - (initialHeight / 2), // Center vertically
            width: initialWidth,
            height: initialHeight,
        };
        stickers.push(newSticker);
        selectedDraggable = newSticker; // Select the newly added sticker
        updateStickerControlsFromSelection();
        renderCanvas();
    } catch (error) {
        console.error("Failed to add sticker:", error);
        alert("Error loading sticker image. Please ensure the file exists and is accessible.");
    }
}

function handleRemoveSticker() {
    if (selectedDraggable && stickers.includes(selectedDraggable)) {
        stickers = stickers.filter(s => s !== selectedDraggable);
        selectedDraggable = null;
        updateStickerControlsFromSelection();
        renderCanvas();
    } else {
        alert("No sticker selected to remove. Click on a sticker on the canvas first to select it.");
    }
}

function handleAddText() {
    const textContent = DOMElements.textInput.value.trim();
    if (!textContent) {
        return;
    }

    // Get current text styles from UI, or use defaults
    const textColor = DOMElements.textColorInput ? DOMElements.textColorInput.value : DEFAULT_TEXT_SETTINGS.color;
    const textFont = DOMElements.textFontSelect ? DOMElements.textFontSelect.value : DEFAULT_TEXT_SETTINGS.font;
    const textSize = DOMElements.textSizeInput ? parseInt(DOMElements.textSizeInput.value) : DEFAULT_TEXT_SETTINGS.size;
    const isBold = DOMElements.textBoldBtn ? DOMElements.textBoldBtn.classList.contains('active') : DEFAULT_TEXT_SETTINGS.isBold;
    const isItalic = DOMElements.textItalicBtn ? DOMElements.textItalicBtn.classList.contains('active') : DEFAULT_TEXT_SETTINGS.isItalic;
    const isUnderline = DOMElements.textUnderlineBtn ? DOMElements.textUnderlineBtn.classList.contains('active') : DEFAULT_TEXT_SETTINGS.isUnderline;
    const textAlign = DOMElements.textAlignSelect ? DOMElements.textAlignSelect.value : DEFAULT_TEXT_SETTINGS.align;


    // Temporarily set font to measure text width
    DOMElements.ctx.font = `${isBold ? 'bold ' : ''}${isItalic ? 'italic ' : ''}${textSize}px ${textFont}`;
    const textMetrics = DOMElements.ctx.measureText(textContent);
    const textWidth = textMetrics.width;
    const textHeight = textSize * 1.2; // Approximate height with line spacing

    const newTextObj = {
        content: textContent,
        x: (DOMElements.photoCanvas.width / 2) - (textWidth / 2), // Center horizontally
        y: (DOMElements.photoCanvas.height / 2) - (textHeight / 2), // Center vertically
        color: textColor,
        font: textFont,
        size: textSize,
        align: textAlign,
        isBold: isBold,
        isItalic: isItalic,
        isUnderline: isUnderline,
        width: textWidth, // Store calculated width
        height: textHeight, // Store approximate height
    };

    texts.push(newTextObj);
    DOMElements.textInput.value = ""; // Clear input after adding
    selectedDraggable = newTextObj; // Select the newly added text
    updateTextControlsFromSelection();
    renderCanvas();
}

function handleRemoveText() {
    if (selectedDraggable && texts.includes(selectedDraggable)) {
        texts = texts.filter(t => t !== selectedDraggable);
        selectedDraggable = null;
        updateTextControlsFromSelection();
        renderCanvas();
    } else {
        alert("No text selected to remove. Click on a text element on the canvas first to select it.");
    }
}

/**
 * Toggles a text style property (bold, italic, underline) for the selected text.
 * @param {string} styleProp - The property name (e.g., 'isBold', 'isItalic').
 */
function toggleTextStyle(styleProp) {
    if (selectedDraggable && texts.includes(selectedDraggable)) {
        selectedDraggable[styleProp] = !selectedDraggable[styleProp];
        // Toggle active class on button
        if (styleProp === 'isBold' && DOMElements.textBoldBtn) DOMElements.textBoldBtn.classList.toggle('active');
        if (styleProp === 'isItalic' && DOMElements.textItalicBtn) DOMElements.textItalicBtn.classList.toggle('active');
        if (styleProp === 'isUnderline' && DOMElements.textUnderlineBtn) DOMElements.textUnderlineBtn.classList.toggle('active');
        renderCanvas();
    } else {
        // If no text selected, just toggle the button's active state for next text
        if (styleProp === 'isBold' && DOMElements.textBoldBtn) DOMElements.textBoldBtn.classList.toggle('active');
        if (styleProp === 'isItalic' && DOMElements.textItalicBtn) DOMElements.textItalicBtn.classList.toggle('active');
        if (styleProp === 'isUnderline' && DOMElements.textUnderlineBtn) DOMElements.textUnderlineBtn.classList.toggle('active');
    }
}

/**
 * Updates a specific style property for the selected text.
 * @param {string} prop - The property name (e.g., 'color', 'font', 'size', 'align').
 * @param {*} value - The new value for the property.
 */
function updateTextStyle(prop, value) {
    if (selectedDraggable && texts.includes(selectedDraggable)) {
        selectedDraggable[prop] = value;
        // Re-calculate width/height for text if font or size changes
        if (prop === 'font' || prop === 'size' || prop === 'content') {
            DOMElements.ctx.font = `${selectedDraggable.isBold ? 'bold ' : ''}${selectedDraggable.isItalic ? 'italic ' : ''}${selectedDraggable.size}px ${selectedDraggable.font}`;
            const textMetrics = DOMElements.ctx.measureText(selectedDraggable.content);
            selectedDraggable.width = textMetrics.width;
            selectedDraggable.height = selectedDraggable.size * 1.2;
        }
        renderCanvas();
    }
}

function toggleDrawingMode() {
    isDrawingMode = !isDrawingMode;
    if (DOMElements.toggleDrawModeBtn) {
        isDrawingMode ? DOMElements.toggleDrawModeBtn.classList.add('active') : DOMElements.toggleDrawModeBtn.classList.remove('active');
    }
    // Disable/enable other controls when in drawing mode
    const controlsToToggle = [
        DOMElements.addStickerBtn, DOMElements.removeStickerBtn, DOMElements.stickerSelect,
        DOMElements.addTextBtn, DOMElements.removeTextBtn, DOMElements.textInput,
        DOMElements.textColorInput, DOMElements.textFontSelect, DOMElements.textSizeInput,
        DOMElements.textBoldBtn, DOMElements.textItalicBtn, DOMElements.textUnderlineBtn, DOMElements.textAlignSelect,
        DOMElements.frameSelect, DOMElements.customBackgroundColorInput // NEW: Custom color input
    ];
    controlsToToggle.forEach(element => {
        if (element) {
            element.disabled = isDrawingMode;
        }
    });

    // Drawing specific controls
    if (DOMElements.brushColorInput) DOMElements.brushColorInput.disabled = !isDrawingMode;
    if (DOMElements.brushSizeInput) DOMElements.brushSizeInput.disabled = !isDrawingMode;

    // Deselect any draggable when entering drawing mode
    if (isDrawingMode && selectedDraggable) {
        selectedDraggable = null;
        updateStickerControlsFromSelection();
        updateTextControlsFromSelection();
    }
    renderCanvas();
}


// --- Canvas Interaction Handlers (Dragging & Drawing) ---

/**
 * Gets normalized coordinates from mouse or touch event relative to the canvas.
 * @param {Event} event - The mouse or touch event.
 * @returns {{x: number, y: number}} - The normalized coordinates.
 */
function getEventCoordinates(event) {
    if (!DOMElements.photoCanvas) return { x: 0, y: 0 };
    const rect = DOMElements.photoCanvas.getBoundingClientRect();
    const scaleX = DOMElements.photoCanvas.width / rect.width;
    const scaleY = DOMElements.photoCanvas.height / rect.height;

    let clientX, clientY;
    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    return { x, y };
}

/**
 * Checks if a point is within a given rectangle.
 * @param {number} pointX - X coordinate of the point.
 * @param {number} pointY - Y coordinate of the point.
 * @param {number} rectX - X coordinate of the rectangle's top-left corner.
 * @param {number} rectY - Y coordinate of the rectangle's top-left corner.
 * @param {number} rectWidth - Width of the rectangle.
 * @param {number} rectHeight - Height of the rectangle.
 * @returns {boolean} True if the point is inside the rectangle, false otherwise.
 */
function isPointInRect(pointX, pointY, rectX, rectY, rectWidth, rectHeight) {
    return pointX >= rectX &&
           pointX <= rectX + rectWidth &&
           pointY >= rectY &&
           pointY <= rectY + rectHeight;
}

function handleCanvasMouseDown(e) {
    e.preventDefault();
    const coords = getEventCoordinates(e);
    lastX = coords.x;
    lastY = coords.y;

    if (isDrawingMode) {
        isDragging = true; // Use isDragging for drawing as well
        drawings.push({
            color: DOMElements.brushColorInput.value,
            size: parseInt(DOMElements.brushSizeInput.value),
            points: [{ x: lastX, y: lastY }]
        });
    } else {
        isDragging = false; // Reset drag state for draggables
        selectedDraggable = null; // Reset selected draggable

        // Iterate through stickers and texts in reverse order to select topmost
        const allDraggables = [...stickers, ...texts];
        for (let i = allDraggables.length - 1; i >= 0; i--) {
            const obj = allDraggables[i];
            // For text, adjust hit area slightly for easier selection
            let hitX = obj.x, hitY = obj.y, hitW = obj.width, hitH = obj.height;
            if (texts.includes(obj)) {
                // Give a small buffer for text selection
                hitX -= 5; hitY -= 5; hitW += 10; hitH += 10;
            }

            if (isPointInRect(coords.x, coords.y, hitX, hitY, hitW, hitH)) {
                selectedDraggable = obj;
                isDragging = true; // Activate dragging for draggable elements
                dragOffsetX = coords.x - obj.x;
                dragOffsetY = coords.y - obj.y;

                // Bring selected object to front by moving it to the end of its array
                if (stickers.includes(selectedDraggable)) {
                    stickers = stickers.filter(s => s !== selectedDraggable);
                    stickers.push(selectedDraggable);
                } else if (texts.includes(selectedDraggable)) {
                    texts = texts.filter(t => t !== selectedDraggable);
                    texts.push(selectedDraggable);
                }
                break; // Found and selected an object, stop checking
            }
        }
    }
    updateStickerControlsFromSelection(); // Update UI for selection change
    updateTextControlsFromSelection();
    renderCanvas(); // Redraw to show selection or start drawing
}

function handleCanvasMouseMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    const coords = getEventCoordinates(e);

    if (isDrawingMode) {
        const currentDrawing = drawings[drawings.length - 1];
        if (currentDrawing) {
            currentDrawing.points.push({ x: coords.x, y: coords.y });
            renderCanvas(); // Re-render to show ongoing drawing
        }
    } else if (selectedDraggable) {
        selectedDraggable.x = coords.x - dragOffsetX;
        selectedDraggable.y = coords.y - dragOffsetY;
        renderCanvas();
    }
}

function handleCanvasMouseUp(e) {
    isDragging = false;
    // Do NOT deselect selectedDraggable here if you want it to remain selected after drag
    // selectedDraggable = null; // Uncomment this if you want auto-deselection
    // renderCanvas(); // If you uncommented above, uncomment this too
}

// --- Touch Event Handlers ---
function handleCanvasTouchStart(e) {
    if (e.touches.length === 1) {
        e.preventDefault();
        const touch = e.touches[0];
        handleCanvasMouseDown({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} });
    }
}

function handleCanvasTouchMove(e) {
    if (e.touches.length === 1 && isDragging) {
        e.preventDefault();
        const touch = e.touches[0];
        handleCanvasMouseMove({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} });
    }
}

function handleCanvasTouchEnd(e) {
    handleCanvasMouseUp(e);
}


// --- Download Strip Logic ---

function handleDownloadStrip() {
    if (capturedPhotosBase64.length === 0) {
        alert('Please capture photos first to download a strip.');
        return;
    }

    showDownloadSpinner(true);
    const format = DOMElements.downloadFormatSelect.value.split(';');
    const mimeType = format[0];
    const quality = format.length > 1 ? parseFloat(format[1]) : 1.0;

    // Use a small delay to ensure spinner is visible before heavy processing
    setTimeout(async () => {
        try {
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = DOMElements.photoCanvas.width;
            finalCanvas.height = DOMElements.photoCanvas.height;
            const finalCtx = finalCanvas.getContext('2d');

            // Temporarily clear selection and disable drawing mode for clean download output
            const tempSelected = selectedDraggable;
            const tempIsDrawingMode = isDrawingMode;
            selectedDraggable = null;
            isDrawingMode = false;

            // 1. Draw Background for final image (prioritize custom color)
            if (isCustomBackgroundSelected) {
                finalCtx.fillStyle = customBackgroundColor;
                finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
            } else if (currentStripConfig && currentStripConfig.defaultBackground) {
                finalCtx.fillStyle = currentStripConfig.defaultBackground;
                finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
            }

            // 2. Draw Frame Image (only if not custom color)
            if (!isCustomBackgroundSelected && currentFrameImgSrc) {
                try {
                    const frameImg = await loadImage(currentFrameImgSrc);
                    finalCtx.drawImage(frameImg, 0, 0, finalCanvas.width, finalCanvas.height);
                } catch (error) {
                    console.error("Error loading frame for download; proceeding without frame:", error);
                    // Fallback handled by initial fillRect if frame fails
                }
            }

            // 3. Draw Photos
            const numPhotosToDisplay = capturedPhotosBase64.length;
            const framesToUse = currentStripConfig ? currentStripConfig.frames : [];
            for (let i = 0; i < Math.min(numPhotosToDisplay, framesToUse.length); i++) {
                const frame = framesToUse[i];
                if (!frame) continue;
                try {
                    const img = preloadedCapturedImages[i] || await loadImage(capturedPhotosBase64[i]);
                    finalCtx.drawImage(img, frame.x, frame.y, frame.width, frame.height);
                } catch (error) {
                    console.error(`Error drawing photo ${i + 1} for download:`, error);
                    finalCtx.fillStyle = '#ccc'; // Placeholder if photo fails
                    finalCtx.fillRect(frame.x, frame.y, frame.width, frame.height);
                }
            }

            // 4. Draw Stickers
            for (const sticker of stickers) {
                try {
                    const imgToDraw = sticker.img || await loadImage(sticker.src);
                    finalCtx.drawImage(imgToDraw, sticker.x, sticker.y, sticker.width, sticker.height);
                } catch (error) {
                    console.error(`Error drawing sticker ${sticker.src} for download:`, error);
                }
            }

            // 5. Draw Text
            for (const textObj of texts) {
                finalCtx.fillStyle = textObj.color;
                let fontStyle = '';
                if (textObj.isItalic) fontStyle += 'italic ';
                if (textObj.isBold) fontStyle += 'bold ';
                finalCtx.font = `${fontStyle}${textObj.size}px ${textObj.font}`;
                finalCtx.textAlign = textObj.align;
                finalCtx.textBaseline = 'middle';

                let textX = textObj.x;
                if (textObj.align === 'center') {
                    textX = textObj.x + textObj.width / 2;
                } else if (textObj.align === 'right') {
                    textX = textObj.x + textObj.width;
                }
                finalCtx.fillText(textObj.content, textX, textObj.y + textObj.height / 2);

                if (textObj.isUnderline) {
                    const textMetrics = finalCtx.measureText(textObj.content);
                    const underlineHeight = textObj.size / 15;
                    const underlineY = textObj.y + textObj.height / 2 + textObj.size / 2 - underlineHeight / 2;

                    let underlineStartX = textObj.x;
                    if (textObj.align === 'center') {
                        underlineStartX = textX - textMetrics.width / 2;
                    } else if (textObj.align === 'right') {
                        underlineStartX = textX - textMetrics.width;
                    }
                    finalCtx.beginPath();
                    finalCtx.strokeStyle = textObj.color;
                    finalCtx.lineWidth = underlineHeight;
                    finalCtx.moveTo(underlineStartX, underlineY);
                    finalCtx.lineTo(underlineStartX + textMetrics.width, underlineY);
                    finalCtx.stroke();
                }
            }

            // 6. Draw Drawings
            drawings.forEach(draw => drawLines(finalCtx, draw));

            // Finalize and download
            const dataURL = finalCanvas.toDataURL(mimeType, quality);
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = `odz_photobooth_strip.${mimeType.split('/')[1].split(';')[0]}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Restore state
            selectedDraggable = tempSelected;
            isDrawingMode = tempIsDrawingMode;
            renderCanvas(); // Re-render editing canvas with original state
        } catch (error) {
            console.error('Error preparing strip for download:', error);
            alert('Failed to prepare photo strip for download. See console for details.');
        } finally {
            showDownloadSpinner(false);
        }
    }, 50); // Small delay to allow spinner to show
}

function handleRetakePhotos() {
    localStorage.removeItem('capturedPhotos');
    localStorage.removeItem('selectedPhotoCount');
    localStorage.removeItem('lastSelectedFrame'); // Clear saved frame/custom color
    localStorage.removeItem('customPhotoBackgroundColor'); // Clear saved custom color
    // If you have other stored editing data, remove them too
    // localStorage.removeItem('stickers');
    // localStorage.removeItem('texts');
    // localStorage.removeItem('drawings');
    window.location.href = 'layout-selection/layout-selection.html'; // Path is relative to base href
}

// Ensure the `initializeEditorPage` function runs only after the entire HTML document is loaded.
document.addEventListener('DOMContentLoaded', initializeEditorPage);
