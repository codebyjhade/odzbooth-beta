// edit.js - The core logic for the Photo Editing Page (Simplified: Drag Only)
"use strict";

// --- DOM Element References ---
const photoCanvas = document.getElementById("photoCanvas");
const ctx = photoCanvas.getContext("2d");

const frameSelect = document.getElementById("frameSelect");

const stickerSelect = document.getElementById("stickerSelect");
const addStickerBtn = document.getElementById("addStickerBtn");
const removeStickerBtn = document.getElementById("removeStickerBtn");

const textInput = document.getElementById("textInput");
const textColorInput = document.getElementById("textColor");
const textFontSelect = document.getElementById("textFont");
const textSizeInput = document.getElementById("textSize");
const addTextBtn = document.getElementById("addTextBtn");
const removeTextBtn = document.getElementById("removeTextBtn");

const textBoldBtn = document.getElementById('textBoldBtn');
const textItalicBtn = document.getElementById('textItalicBtn');
const textUnderlineBtn = document('textUnderlineBtn'); // Corrected typo here
const textAlignSelect = document.getElementById('textAlignSelect');

const downloadStripBtn = document.getElementById("downloadStripBtn");
const downloadFormatSelect = document.getElementById('downloadFormat');
const retakeBtn = document.getElementById("retakeBtn");

const noPhotosMessage = document.getElementById('no-photos-message');
const downloadSpinner = document.getElementById('download-spinner');


// --- Global State Variables ---
let capturedPhotosBase64 = [];
let stickers = []; // Array to store dynamically added and draggable sticker objects
let texts = []; // Array to store dynamically added and draggable text objects

let currentStripConfig = null;
let selectedDraggable = null; // Currently selected sticker or text object

let isDragging = false; // Only need this for drag functionality
let dragOffsetX, dragOffsetY; // Offset for dragging

let currentFrameImgSrc = ''; // To store the currently selected frame image path


// --- Configuration: Fixed Strip Dimensions and Photo Frame Coordinates ---
const STRIP_COMMON_SETTINGS = {
    photoSidePadding: 40,
    photoSlotWidth: 320,
    gapBetweenPhotos: 20,
    topPadding: 40,
    bottomSpaceForLogo: 150
};

const STRIP_CONFIGS = {
    '1': {
        stripWidth: 400,
        stripHeight: STRIP_COMMON_SETTINGS.topPadding + 240 + STRIP_COMMON_SETTINGS.bottomSpaceForLogo,
        frames: [
            { x: STRIP_COMMON_SETTINGS.photoSidePadding, y: STRIP_COMMON_SETTINGS.topPadding, width: STRIP_COMMON_SETTINGS.photoSlotWidth, height: 240 }
        ],
        defaultBackground: '#CCCCCC',
        frameAspectRatio: 320 / 240,
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-1-photos-option1.png', name: 'Original Single' },
            { id: 'option2', src: 'assets/strip-frame-1-photos-option2.png', name: 'Clean White' },
            { id: 'option3', src: 'assets/strip-frame-1-photos-option3.png', name: 'Styled Border' }
        ]
    },
    '2': {
        stripWidth: 400,
        stripHeight: STRIP_COMMON_SETTINGS.topPadding + (240 * 2) + STRIP_COMMON_SETTINGS.gapBetweenPhotos + STRIP_COMMON_SETTINGS.bottomSpaceForLogo,
        frames: [
            { x: STRIP_COMMON_SETTINGS.photoSidePadding, y: STRIP_COMMON_SETTINGS.topPadding, width: STRIP_COMMON_SETTINGS.photoSlotWidth, height: 240 },
            { x: STRIP_COMMON_SETTINGS.photoSidePadding, y: STRIP_COMMON_SETTINGS.topPadding + 240 + STRIP_COMMON_SETTINGS.gapBetweenPhotos, width: STRIP_COMMON_SETTINGS.photoSlotWidth, height: 240 }
        ],
        defaultBackground: '#CCCCCC',
        frameAspectRatio: 320 / 240,
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-2-photos-option1.png', name: 'Original Double' },
            { id: 'option2', src: 'assets/strip-frame-2-photos-option2.png', name: 'Minimal Lines' },
            { id: 'option3', src: 'assets/strip-frame-2-photos-option3.png', name: 'Decorative Duo' }
        ]
    },
    '3': {
        stripWidth: 400,
        stripHeight: 890,
        frames: [
            { x: STRIP_COMMON_SETTINGS.photoSidePadding, y: STRIP_COMMON_SETTINGS.topPadding, width: STRIP_COMMON_SETTINGS.photoSlotWidth, height: 220 },
            { x: STRIP_COMMON_SETTINGS.photoSidePadding, y: STRIP_COMMON_SETTINGS.topPadding + 220 + STRIP_COMMON_SETTINGS.gapBetweenPhotos, width: STRIP_COMMON_SETTINGS.photoSlotWidth, height: 220 },
            { x: STRIP_COMMON_SETTINGS.photoSidePadding, y: STRIP_COMMON_SETTINGS.topPadding + (220 * 2) + (STRIP_COMMON_SETTINGS.gapBetweenPhotos * 2), width: STRIP_COMMON_SETTINGS.photoSlotWidth, height: 220 }
        ],
        defaultBackground: '#CCCCCC',
        frameAspectRatio: 320 / 220,
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-3-photos-option1.png', name: 'Original Triple' },
            { id: 'option2', src: 'assets/strip-frame-3-photos-option2.png', name: 'Simple Border' },
            { id: 'option3', src: 'assets/strip-frame-3-photos-option3.png', name: 'Modern Style' }
        ]
    },
    '4': {
        stripWidth: 400,
        stripHeight: 1155,
        frames: [
            { x: STRIP_COMMON_SETTINGS.photoSidePadding, y: STRIP_COMMON_SETTINGS.topPadding, width: STRIP_COMMON_SETTINGS.photoSlotWidth, height: 226 },
            { x: STRIP_COMMON_SETTINGS.photoSidePadding, y: STRIP_COMMON_SETTINGS.topPadding + 226 + STRIP_COMMON_SETTINGS.gapBetweenPhotos, width: STRIP_COMMON_SETTINGS.photoSlotWidth, height: 226 },
            { x: STRIP_COMMON_SETTINGS.photoSidePadding, y: STRIP_COMMON_SETTINGS.topPadding + (226 * 2) + (STRIP_COMMON_SETTINGS.gapBetweenPhotos * 2), width: STRIP_COMMON_SETTINGS.photoSlotWidth, height: 226 },
            { x: STRIP_COMMON_SETTINGS.photoSidePadding, y: STRIP_COMMON_SETTINGS.topPadding + (226 * 3) + (STRIP_COMMON_SETTINGS.gapBetweenPhotos * 3), width: STRIP_COMMON_SETTINGS.photoSlotWidth, height: 226 }
        ],
        defaultBackground: '#CCCCCC',
        frameAspectRatio: 320 / 226,
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-4-photos-option1.png', name: 'Original Quad' },
            { id: 'option2', src: 'assets/strip-frame-4-photos-option2.png', name: 'Vintage Edge' },
            { id: 'option3', src: 'assets/strip-frame-4-photos-option3.png', name: 'Clean Frame' }
        ]
    },
    '6': {
        stripWidth: 760,
        stripHeight: 890,
        frames: [
            { x: 40, y: 40, width: 320, height: 220 },
            { x: 40, y: 280, width: 320, height: 220 },
            { x: 40, y: 520, width: 320, height: 220 },
            { x: 400, y: 40, width: 320, height: 220 },
            { x: 400, y: 280, width: 320, height: 220 },
            { x: 400, y: 520, width: 320, height: 220 }
        ],
        defaultBackground: '#CCCCCC',
        frameAspectRatio: 320 / 220,
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-6-photos-option1.png', name: 'Original Six' },
            { id: 'option2', src: 'assets/strip-frame-6-photos-option2.png', name: 'Two-Column Classic' }
        ]
    }
};

// --- Image Preloading Utility ---
let preloadedCapturedImages = [];

async function preloadAllCapturedImages() {
    preloadedCapturedImages = [];
    const promises = capturedPhotosBase64.map(src => loadImage(src));
    try {
        preloadedCapturedImages = await Promise.all(promises);
        console.log("All captured photos preloaded for editing.");
    } catch (error) {
        console.error("Error preloading captured images:", error);
    }
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });
}

/**
 * Displays an info/error message in the canvas area.
 * @param {string} mainMsg - The primary message.
 * @param {'info'|'error'} type - The type of message for styling.
 * @param {string} [subMsg=''] - An optional secondary message (can contain HTML).
 */
function displayNoPhotosMessage(mainMsg, type = 'info', subMsg = '') {
    let mainParagraph = noPhotosMessage.querySelector('p:first-child');
    if (!mainParagraph) {
        mainParagraph = document.createElement('p');
        noPhotosMessage.prepend(mainParagraph);
    }
    mainParagraph.innerText = mainMsg;

    let subMsgElement = noPhotosMessage.querySelector('.sub-message');
    if (!subMsgElement) {
        subMsgElement = document.createElement('p');
        subMsgElement.classList.add('sub-message');
        noPhotosMessage.appendChild(subMsgElement);
    }
    subMsgElement.innerHTML = subMsg;

    noPhotosMessage.className = `info-message ${type}`;
    noPhotosMessage.style.display = 'block';
    downloadSpinner.classList.add('hidden-spinner');
    photoCanvas.style.display = 'none';
}

/**
 * Hides the no photos message.
 */
function hideNoPhotosMessage() {
    noPhotosMessage.style.display = 'none';
    photoCanvas.style.display = 'block';
}

/**
 * Shows/hides the download processing spinner for strip.
 * @param {boolean} show - True to show, false to hide.
 */
function showDownloadSpinner(show) {
    if (show) {
        downloadSpinner.classList.remove('hidden-spinner');
        photoCanvas.style.display = 'none';
        noPhotosMessage.style.display = 'none';
    } else {
        downloadSpinner.classList.add('hidden-spinner');
        if (noPhotosMessage.style.display === 'none') {
            photoCanvas.style.display = 'block';
        }
    }
}


// --- Canvas Drawing Functions ---

async function renderCanvas() {
    ctx.clearRect(0, 0, photoCanvas.width, photoCanvas.height);

    if (currentStripConfig && currentStripConfig.defaultBackground) {
        ctx.fillStyle = currentStripConfig.defaultBackground;
        ctx.fillRect(0, 0, photoCanvas.width, photoCanvas.height);
    }

    if (currentFrameImgSrc) {
        try {
            const frameImg = await loadImage(currentFrameImgSrc);
            ctx.drawImage(frameImg, 0, 0, photoCanvas.width, photoCanvas.height);
        } catch (error) {
            console.warn(`WARNING: Could not load selected strip frame image: ${currentFrameImgSrc}. Ensure it exists and is correct.`, error);
            ctx.fillStyle = currentStripConfig.defaultBackground || '#CCCCCC';
            ctx.fillRect(0, 0, photoCanvas.width, photoCanvas.height);
        }
    } else {
        ctx.fillStyle = currentStripConfig.defaultBackground || '#CCCCCC';
        ctx.fillRect(0, 0, photoCanvas.width, photoCanvas.height);
    }

    drawPhotosOnStrip(ctx);
    drawStickersOnCanvas(ctx, stickers);
    drawTextOnCanvas(ctx, texts);
}

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
                renderCanvas();
            }).catch(error => {
                console.error(`ERROR: Failed to draw photo ${i + 1}. Image source might be corrupt. Details:`, error);
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

function drawStickersOnCanvas(targetCtx, stickersData) {
    for (const sticker of stickersData) {
        try {
            const imgToDraw = sticker.img || (() => {
                const img = new Image();
                img.src = sticker.src;
                sticker.img = img;
                return img;
            })();

            if (imgToDraw.complete) {
                targetCtx.drawImage(imgToDraw, sticker.x, sticker.y, sticker.width, sticker.height);
            } else {
                imgToDraw.onload = () => renderCanvas();
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
    }
}

function drawTextOnCanvas(targetCtx, textsData) {
    textsData.forEach(textObj => {
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

function updateCanvasAndRender() {
    const selectedPhotoCountStr = localStorage.getItem('selectedPhotoCount');
    const selectedPhotoCount = parseInt(selectedPhotoCountStr, 10);

    const configKey = isNaN(selectedPhotoCount) || selectedPhotoCount < 1 || selectedPhotoCount > 6 || selectedPhotoCount === 5
        ? '3'
        : selectedPhotoCount.toString();

    currentStripConfig = STRIP_CONFIGS[configKey];

    if (!currentStripConfig || typeof currentStripConfig.stripWidth === 'undefined' || typeof currentStripConfig.stripHeight === 'undefined') {
        console.error('ERROR: currentStripConfig is invalid or missing dimensions! Cannot render.');
        displayNoPhotosMessage('Error: Strip configuration missing. Please report this issue.', 'error');
        return;
    }

    photoCanvas.width = currentStripConfig.stripWidth;
    photoCanvas.height = currentStripConfig.stripHeight;

    populateFrameOptions(currentStripConfig.availableFrames);
    if (!currentFrameImgSrc && currentStripConfig.availableFrames.length > 0) {
        currentFrameImgSrc = currentStripConfig.availableFrames[0].src; // Set first as default
        frameSelect.value = currentStripConfig.availableFrames[0].src; // Update dropdown to reflect default
    } else if (currentFrameImgSrc) {
        frameSelect.value = currentFrameImgSrc;
    }


    renderCanvas();
}

/**
 * Populates the frame selection dropdown with available frames for the current layout.
 * @param {Array<Object>} frames - An array of frame objects from currentStripConfig.availableFrames.
 */
function populateFrameOptions(frames) {
    frameSelect.innerHTML = ''; // Clear existing options
    if (frames && frames.length > 0) {
        frames.forEach(frame => {
            const option = document.createElement('option');
            option.value = frame.src; // Use src as the value
            option.textContent = frame.name;
            frameSelect.appendChild(option);
        });
        frameSelect.disabled = false;
    } else {
        const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No frames available';
        frameSelect.appendChild(option);
        frameSelect.disabled = true;
    }
}


// --- Initialization ---

async function initializeEditor() {
    capturedPhotosBase64 = JSON.parse(localStorage.getItem('capturedPhotos') || '[]');
    const selectedPhotoCount = localStorage.getItem('selectedPhotoCount');

    if (capturedPhotosBase64.length === 0 || !selectedPhotoCount) {
        displayNoPhotosMessage('No photos found.', 'info', 'Please go back to <a href="capture-page/capture-page.html">capture photos</a> first.');
        stickerSelect.disabled = true;
        addStickerBtn.disabled = true;
        removeStickerBtn.disabled = true;
        textInput.disabled = true;
        textColorInput.disabled = true;
        textFontSelect.disabled = true;
        textSizeInput.disabled = true;
        addTextBtn.disabled = true;
        removeTextBtn.disabled = true;
        downloadStripBtn.disabled = true;
        frameSelect.disabled = true; // Disable frame select if no photos
        return;
    }

    currentStripConfig = STRIP_CONFIGS[selectedPhotoCount];
    if (!currentStripConfig) {
        displayNoPhotosMessage('Invalid layout selected.', 'error', 'The selected photo layout is not supported. Please <a href="layout-selection/layout-selection.html">choose another layout</a>.');
        stickerSelect.disabled = true;
        addStickerBtn.disabled = true;
        removeStickerBtn.disabled = true;
        textInput.disabled = true;
        textColorInput.disabled = true;
        textFontSelect.disabled = true;
        textSizeInput.disabled = true;
        addTextBtn.disabled = true;
        removeTextBtn.disabled = true;
        downloadStripBtn.disabled = true;
        frameSelect.disabled = true; // Disable frame select if invalid layout
        return;
    }

    if (currentStripConfig.availableFrames && currentStripConfig.availableFrames.length > 0) {
        if (!currentFrameImgSrc) {
            currentFrameImgSrc = currentStripConfig.availableFrames[0].src;
        }
    }

    await preloadAllCapturedImages();
    updateCanvasAndRender();

    // Attach only basic mouse/touch event listeners
    photoCanvas.addEventListener('mousedown', handleMouseDown);
    photoCanvas.addEventListener('mousemove', handleMouseMove);
    photoCanvas.addEventListener('mouseup', handleMouseUp);
    photoCanvas.addEventListener('mouseout', handleMouseUp); // End interaction if mouse leaves canvas

    // Mobile/Touch events
    photoCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    photoCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    photoCanvas.addEventListener('touchend', handleTouchEnd);
    photoCanvas.addEventListener('touchcancel', handleTouchEnd);
}


// --- Event Listeners for UI Buttons ---

addStickerBtn.addEventListener("click", async function() {
    const stickerSrc = stickerSelect.value;
    if (!stickerSrc) return;

    try {
        const img = await loadImage(stickerSrc);
        const initialWidth = 100; // Fixed initial width
        const initialHeight = (img.height / img.width) * initialWidth; // Maintain aspect ratio
        const newSticker = {
            img: img,
            src: stickerSrc,
            x: (photoCanvas.width / 2) - (initialWidth / 2), // Center horizontally
            y: (photoCanvas.height / 2) - (initialHeight / 2), // Center vertically
            width: initialWidth, // Fixed width
            height: initialHeight, // Fixed height
        };
        stickers.push(newSticker);
        selectedDraggable = newSticker; // Select the newly added sticker
        renderCanvas();
    }
    catch (error) {
        console.error("Failed to add sticker:", error);
        alert("Error loading sticker image. Please ensure the file exists in the 'assets' folder.");
    }
});

removeStickerBtn.addEventListener("click", () => {
    if (selectedDraggable && stickers.includes(selectedDraggable)) {
        stickers = stickers.filter(s => s !== selectedDraggable);
        selectedDraggable = null;
        renderCanvas();
    } else {
        alert("No sticker selected to remove. Click on a sticker on the canvas first to select it.");
    }
});

addTextBtn.addEventListener("click", function() {
    const textContent = textInput.value.trim();
    if (!textContent) {
        return;
    }

    const textColor = textColorInput.value;
    const textFont = textFontSelect.value;
    const textSize = parseInt(textSizeInput.value);

    // Temporarily set font to measure text width
    ctx.font = `${textBoldBtn.classList.contains('active') ? 'bold ' : ''}${textItalicBtn.classList.contains('active') ? 'italic ' : ''}${textSize}px ${textFont}`;
    const textMetrics = ctx.measureText(textContent);
    const textWidth = textMetrics.width;
    const textHeight = textSize; // Approximate height for bounding box

    const newTextObj = {
        content: textContent,
        x: (photoCanvas.width / 2) - (textWidth / 2), // Center horizontally
        y: (photoCanvas.height / 2) - (textHeight / 2), // Center vertically
        color: textColor,
        font: textFont,
        size: textSize,
        align: textAlignSelect.value,
        isBold: textBoldBtn.classList.contains('active'),
        isItalic: textItalicBtn.classList.contains('active'),
        isUnderline: textUnderlineBtn.classList.contains('active'), // Corrected to use 'classList.contains'
        width: textWidth, // Store calculated width
        height: textHeight, // Store approximate height
    };

    texts.push(newTextObj);
    textInput.value = "";
    selectedDraggable = newTextObj; // Select the newly added text
    renderCanvas();
});

removeTextBtn.addEventListener("click", () => {
    if (selectedDraggable && texts.includes(selectedDraggable)) {
        texts = texts.filter(t => t !== selectedDraggable);
        selectedDraggable = null;
        renderCanvas();
    } else {
        alert("No text selected to remove. Click on a text element on the canvas first to select it.");
    }
});

textBoldBtn.addEventListener('click', () => { textBoldBtn.classList.toggle('active'); renderCanvas(); });
textItalicBtn.addEventListener('click', () => { textItalicBtn.classList.toggle('active'); renderCanvas(); });
// Corrected to use 'classList.toggle'
textUnderlineBtn.addEventListener('click', () => { textUnderlineBtn.classList.toggle('active'); renderCanvas(); });
textAlignSelect.addEventListener('change', () => { renderCanvas(); });


// --- Basic Dragging Interaction Handlers ---

function getEventCoordinates(event) {
    const rect = photoCanvas.getBoundingClientRect();
    const scaleX = photoCanvas.width / rect.width;
    const scaleY = photoCanvas.height / rect.height;

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

function isPointInRect(pointX, pointY, rectX, rectY, rectWidth, rectHeight) {
    return pointX >= rectX &&
           pointX <= rectX + rectWidth &&
           pointY >= rectY &&
           pointY <= rectY + rectHeight;
}

function handleMouseDown(e) {
    e.preventDefault();
    const mousePos = getEventCoordinates(e);

    isDragging = false; // Reset drag state
    selectedDraggable = null; // Reset selected draggable

    // Iterate through stickers and texts in reverse order to select topmost
    const allDraggables = [...stickers, ...texts];
    for (let i = allDraggables.length - 1; i >= 0; i--) {
        const obj = allDraggables[i];
        if (isPointInRect(mousePos.x, mousePos.y, obj.x, obj.y, obj.width, obj.height)) {
            selectedDraggable = obj;
            isDragging = true;
            dragOffsetX = mousePos.x - obj.x;
            dragOffsetY = mousePos.y - obj.y;

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
    renderCanvas(); // Redraw to show selection
}

function handleMouseMove(e) {
    if (!isDragging || !selectedDraggable) return;

    e.preventDefault();
    const mousePos = getEventCoordinates(e);

    selectedDraggable.x = mousePos.x - dragOffsetX;
    selectedDraggable.y = mousePos.y - dragOffsetY;

    renderCanvas();
}

function handleMouseUp(e) {
    isDragging = false;
    // Do NOT deselect selectedDraggable here if you want it to remain selected after drag
    // selectedDraggable = null; // Uncomment this if you want auto-deselection
    // renderCanvas(); // If you uncommented above, uncomment this too
}

// --- Touch Event Handlers (Simplified for single touch) ---

function handleTouchStart(e) {
    if (e.touches.length === 1) { // Only handle single touch for now
        e.preventDefault();
        const touch = e.touches[0];
        handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} });
    }
}

function handleTouchMove(e) {
    if (e.touches.length === 1 && isDragging) { // Only allow move if dragging
        e.preventDefault();
        const touch = e.touches[0];
        handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} });
    }
}

function handleTouchEnd(e) {
    handleMouseUp(e);
}


// --- Download Strip Button Logic ---
downloadStripBtn.addEventListener('click', () => {
    if (capturedPhotosBase64.length === 0) {
        alert('Please capture photos first to download a strip.');
        return;
    }

    showDownloadSpinner(true);
    const format = downloadFormatSelect.value.split(';');
    const mimeType = format[0];
    const quality = format.length > 1 ? parseFloat(format[1]) : 1.0;

    setTimeout(() => {
        try {
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = photoCanvas.width;
            finalCanvas.height = photoCanvas.height;
            const finalCtx = finalCanvas.getContext('2d');

            // Temporarily clear selection for download
            const tempSelected = selectedDraggable;
            selectedDraggable = null;

            if (currentStripConfig && currentStripConfig.defaultBackground) {
                finalCtx.fillStyle = currentStripConfig.defaultBackground;
                finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
            }
            if (currentFrameImgSrc) {
                loadImage(currentFrameImgSrc).then(frameImg => {
                    finalCtx.drawImage(frameImg, 0, 0, finalCanvas.width, finalCanvas.height);
                    drawPhotosAndDraggablesForDownload(finalCtx); // Draw photos, stickers, text
                    finalizeDownload(finalCanvas, mimeType, quality);
                    selectedDraggable = tempSelected; // Restore selection
                    renderCanvas(); // Re-render editing canvas with selection
                }).catch(error => {
                    console.error("Error loading frame for download:", error);
                    drawPhotosAndDraggablesForDownload(finalCtx); // Draw without frame
                    finalizeDownload(finalCanvas, mimeType, quality);
                    selectedDraggable = tempSelected; // Restore selection
                    renderCanvas(); // Re-render editing canvas with selection
                });
            } else {
                drawPhotosAndDraggablesForDownload(finalCtx); // Draw without frame
                finalizeDownload(finalCanvas, mimeType, quality);
                selectedDraggable = tempSelected; // Restore selection
                renderCanvas(); // Re-render editing canvas with selection
            }
        } catch (error) {
            console.error('Error preparing strip for download:', error);
            alert('Failed to prepare photo strip for download. See console for details.');
            showDownloadSpinner(false);
        }
    }, 50);
});

async function drawPhotosAndDraggablesForDownload(targetCtx) {
    const numPhotosToDisplay = capturedPhotosBase64.length;
    const framesToUse = currentStripConfig ? currentStripConfig.frames : [];

    for (let i = 0; i < Math.min(numPhotosToDisplay, framesToUse.length); i++) {
        const frame = framesToUse[i];
        if (!frame) continue;

        const img = preloadedCapturedImages[i];
        if (img && img.complete) {
            targetCtx.drawImage(img, frame.x, frame.y, frame.width, frame.height);
        } else {
            try {
                const loadedImg = await loadImage(capturedPhotosBase64[i]);
                targetCtx.drawImage(loadedImg, frame.x, frame.y, frame.width, frame.height);
            } catch (error) {
                console.error(`ERROR: Failed to draw photo ${i + 1} on final composite:`, error);
            }
        }
    }

    for (const sticker of stickers) {
        try {
            const imgToDraw = sticker.img || await loadImage(sticker.src);
            targetCtx.drawImage(imgToDraw, sticker.x, sticker.y, sticker.width, sticker.height);
        } catch (error) {
            console.error(`ERROR: Failed to draw sticker ${sticker.src} for download:`, error);
        }
    }

    for (const textObj of texts) {
        targetCtx.fillStyle = textObj.color;
        let fontStyle = '';
        if (textObj.isItalic) fontStyle += 'italic ';
        if (textObj.isBold) fontStyle += 'bold ';
        targetCtx.font = `${fontStyle}${textObj.size}px ${textObj.font}`;
        targetCtx.textAlign = textObj.align;
        targetCtx.textBaseline = 'middle';

        // Adjust X based on alignment for download render
        let textX = textObj.x;
        if (textObj.align === 'center') {
            textX = textObj.x + textObj.width / 2;
        } else if (textObj.align === 'right') {
            textX = textObj.x + textObj.width;
        }

        targetCtx.fillText(textObj.content, textX, textObj.y + textObj.height / 2);

        if (textObj.isUnderline) {
            const textMetrics = targetCtx.measureText(textObj.content);
            const underlineHeight = textObj.size / 15;
            const underlineY = textObj.y + textObj.height / 2 + textObj.size / 2 - underlineHeight / 2;

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
    }
}

function finalizeDownload(canvas, mimeType, quality) {
    const dataURL = canvas.toDataURL(mimeType, quality);
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `odz_photobooth_strip.${mimeType.split('/')[1].split(';')[0]}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showDownloadSpinner(false);
}


// NEW: Frame Selection Event Listener
frameSelect.addEventListener('change', (event) => {
    currentFrameImgSrc = event.target.value;
    renderCanvas();
});

retakeBtn.addEventListener('click', () => {
    localStorage.removeItem('capturedPhotos');
    localStorage.removeItem('selectedPhotoCount');
    window.location.href = 'layout-selection/layout-selection.html';
});

document.addEventListener('DOMContentLoaded', initializeEditor);
