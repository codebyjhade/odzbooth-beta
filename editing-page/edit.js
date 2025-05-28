// edit.js - The core logic for the Photo Editing Page
"use strict";

// --- DOM Element References ---
const photoCanvas = document.getElementById("photoCanvas");
const ctx = photoCanvas.getContext("2d");

const frameSelect = document.getElementById("frameSelect"); // NEW: Frame selection dropdown

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
const textUnderlineBtn = document.getElementById('textUnderlineBtn');
const textAlignSelect = document.getElementById('textAlignSelect');

const downloadStripBtn = document.getElementById("downloadStripBtn");
const downloadFormatSelect = document.getElementById('downloadFormat');
const retakeBtn = document.getElementById("retakeBtn");

const noPhotosMessage = document.getElementById('no-photos-message');
const downloadSpinner = document.getElementById('download-spinner');


// --- Global State Variables ---
let capturedPhotosBase64 = [];
let stickers = [];
let texts = [];

let currentStripConfig = null;
let selectedDraggable = null;

let isDragging = false;
let isResizing = false;
let isRotating = false;
let startX, startY; // Mouse position on drag/resize/rotate start
let initialObjectX, initialObjectY; // Object position on drag start (for dragging)
let dragOffsetX, dragOffsetY; // Offset for dragging

// NEW for resizing:
let initialDistanceToOppositeCorner; // Distance from resize handle to opposite corner when resizing starts
let pivotX, pivotY; // The fixed corner opposite to the handle being dragged

// Constants for interaction handles
const HANDLE_SIZE = 10;
const ROTATE_HANDLE_OFFSET = 25; // Distance of rotate handle from corner

let currentFrameImgSrc = ''; // To store the currently selected frame image path


// --- Configuration: Fixed Strip Dimensions and Photo Frame Coordinates ---
const STRIP_COMMON_SETTINGS = {
    photoSidePadding: 40,
    photoSlotWidth: 320,
    gapBetweenPhotos: 20,
    topPadding: 40,
    bottomSpaceForLogo: 150
};

// MODIFIED: Updated 'availableFrames' array with the new naming convention and descriptions
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
            { id: 'option1', src: 'assets/strip-frame-2-photos-option1.png', name: 'option-1' },
            { id: 'option2', src: 'assets/strip-frame-2-photos-option2.png', name: 'option-2' },
            { id: 'option3', src: 'assets/strip-frame-2-photos-option3.png', name: 'option-3' }
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
            { id: 'option1', src: 'assets/strip-frame-3-photos-option1.png', name: 'lagi kang option-1' },
            { id: 'option2', src: 'assets/strip-frame-3-photos-option2.png', name: 'lagi kang option-2' },
            { id: 'option3', src: 'assets/strip-frame-3-photos-option3.png', name: 'lagi kang option-3' }
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
            { id: 'option1', src: 'assets/strip-frame-6-photos-option1.png', name: 'option-1' },
            { id: 'option2', src: 'assets/strip-frame-6-photos-option2.png', name: 'option-2' }
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


// --- Canvas Drawing Functions (for the interactive editing canvas) ---

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
                targetCtx.save();
                targetCtx.translate(sticker.x + sticker.width / 2, sticker.y + sticker.height / 2);
                targetCtx.rotate(sticker.rotation);
                targetCtx.drawImage(imgToDraw, -sticker.width / 2, -sticker.height / 2, sticker.width, sticker.height);
                targetCtx.restore();
            } else {
                imgToDraw.onload = () => renderCanvas();
            }

            if (selectedDraggable === sticker) { // Only draw handles for the selected one
                drawSelectionHandles(sticker, targetCtx);
            }
        } catch (error) {
            console.error(`ERROR: Failed to draw sticker ${sticker.src}:`, error);
        }
    }
}

function drawTextOnCanvas(targetCtx, textsData) {
    textsData.forEach(textObj => {
        targetCtx.save();

        targetCtx.fillStyle = textObj.color;
        let fontStyle = '';
        if (textObj.isItalic) fontStyle += 'italic ';
        if (textObj.isBold) fontStyle += 'bold ';

        targetCtx.font = `${fontStyle}${textObj.size}px ${textObj.font}`;
        targetCtx.textAlign = textObj.align;
        targetCtx.textBaseline = 'middle';

        const centerX = textObj.x + textObj.width / 2;
        const centerY = textObj.y + textObj.height / 2;

        targetCtx.translate(centerX, centerY);
        targetCtx.rotate(textObj.rotation);

        targetCtx.fillText(textObj.content, 0, 0);

        if (textObj.isUnderline) {
            const textMetrics = targetCtx.measureText(textObj.content);
            const underlineHeight = textObj.size / 15;
            const underlineY = underlineHeight * 2;

            let underlineX = -textMetrics.width / 2;
            if (textObj.align === 'left') underlineX = 0;
            else if (textObj.align === 'right') underlineX = -textMetrics.width;

            targetCtx.beginPath();
            targetCtx.strokeStyle = textObj.color;
            targetCtx.lineWidth = underlineHeight;
            targetCtx.moveTo(underlineX, underlineY);
            targetCtx.lineTo(underlineX + textMetrics.width, underlineY);
            targetCtx.stroke();
        }

        targetCtx.restore();

        if (selectedDraggable === textObj) { // Only draw handles for the selected one
            drawSelectionHandles(textObj, targetCtx);
        }
    });
}

// NEW: Function to draw selection handles (extracted from drawStickers/drawText)
function drawSelectionHandles(obj, targetCtx) {
    targetCtx.strokeStyle = 'cyan';
    targetCtx.lineWidth = 2;
    targetCtx.setLineDash([5, 5]); // Dashed line for selection border

    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;

    targetCtx.save();
    targetCtx.translate(centerX, centerY);
    targetCtx.rotate(obj.rotation);

    // Bounding box
    targetCtx.strokeRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);
    targetCtx.setLineDash([]); // Reset line dash

    // Scale handle (bottom-right corner)
    targetCtx.fillStyle = 'white';
    targetCtx.strokeStyle = 'blue';
    targetCtx.lineWidth = 1;
    targetCtx.fillRect(
        obj.width / 2 - HANDLE_SIZE / 2,
        obj.height / 2 - HANDLE_SIZE / 2,
        HANDLE_SIZE,
        HANDLE_SIZE
    );
    targetCtx.strokeRect(
        obj.width / 2 - HANDLE_SIZE / 2,
        obj.height / 2 - HANDLE_SIZE / 2,
        HANDLE_SIZE,
        HANDLE_SIZE
    );

    // Rotate handle (top-center, extended)
    targetCtx.beginPath();
    targetCtx.moveTo(0, -obj.height / 2);
    targetCtx.lineTo(0, -obj.height / 2 - ROTATE_HANDLE_OFFSET);
    targetCtx.stroke();

    targetCtx.beginPath();
    targetCtx.arc(0, -obj.height / 2 - ROTATE_HANDLE_OFFSET, HANDLE_SIZE / 2, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.stroke();

    targetCtx.restore();
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
}


// --- Event Listeners ---

addStickerBtn.addEventListener("click", async function() {
    const stickerSrc = stickerSelect.value;
    if (!stickerSrc) return;

    try {
        const img = await loadImage(stickerSrc);
        const initialWidth = 100; // Default initial width for sticker
        const initialHeight = (img.height / img.width) * initialWidth;
        const newSticker = {
            img: img,
            src: stickerSrc,
            x: (photoCanvas.width / 2) - (initialWidth / 2),
            y: (photoCanvas.height / 2) - (initialHeight / 2),
            width: initialWidth, // Current displayed width
            height: initialHeight, // Current displayed height
            originalWidth: initialWidth, // Base width for scaling calculations
            originalHeight: initialHeight, // Base height for scaling calculations
            rotation: 0 // In radians
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
    const text = textInput.value.trim();
    if (!text) {
        return;
    }

    const selectedTextSize = parseInt(textSizeInput.value, 10);
    const selectedTextFont = textFontSelect.value;
    const selectedTextColor = textColorInput.value;
    const isBold = textBoldBtn.classList.contains('active');
    const isItalic = textItalicBtn.classList.contains('active');
    const isUnderline = textUnderlineBtn.classList.contains('active');
    const textAlign = textAlignSelect.value;

    ctx.font = `${isBold ? 'bold ' : ''}${isItalic ? 'italic ' : ''}${selectedTextSize}px ${selectedTextFont}`;
    const textMetrics = ctx.measureText(text);
    const initialTextWidth = textMetrics.width;
    const initialTextHeight = selectedTextSize; // Using font size as approximation for height

    const newTextObj = {
        text: text,
        x: (photoCanvas.width / 2) - (initialTextWidth / 2),
        y: (photoCanvas.height / 2) - (initialTextHeight / 2),
        font: selectedTextFont,
        textSize: selectedTextSize, // Base font size for scaling
        size: selectedTextSize, // Current displayed font size (initially same as textSize)
        color: selectedTextColor,
        align: textAlign,
        isBold: isBold,
        isItalic: isItalic,
        isUnderline: isUnderline,
        width: initialTextWidth, // Current displayed width
        height: initialTextHeight, // Current displayed height (approx)
        rotation: 0, // In radians
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
textUnderlineBtn.addEventListener('click', () => { textUnderlineBtn.classList.toggle('active'); renderCanvas(); });
textAlignSelect.addEventListener('change', () => { renderCanvas(); });


// --- Interactive Dragging, Scaling, Rotation (Handlers) ---

let debounceRenderTimeout;
const DEBOUNCE_DELAY = 16;

function debouncedRenderCanvas() {
    clearTimeout(debounceRenderTimeout);
    debounceRenderTimeout = setTimeout(() => {
        renderCanvas();
    }, DEBOUNCE_DELAY);
}

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

function isPointInRotatedRect(pointX, pointY, rectX, rectY, rectWidth, rectHeight, rotationAngle) {
    const centerX = rectX + rectWidth / 2;
    const centerY = rectY + rectHeight / 2;
    const translatedX = pointX - centerX;
    const translatedY = pointY - centerY;

    const rotatedX = translatedX * Math.cos(-rotationAngle) - translatedY * Math.sin(-rotationAngle);
    const rotatedY = translatedX * Math.sin(-rotationAngle) + translatedY * Math.cos(-rotationAngle);

    return rotatedX >= -rectWidth / 2 &&
           rotatedX <= rectWidth / 2 &&
           rotatedY >= -rectHeight / 2 &&
           rotatedY <= rectHeight / 2;
}

function getHandleType(mousePos) {
    if (!selectedDraggable) return null;

    const centerX = selectedDraggable.x + selectedDraggable.width / 2;
    const centerY = selectedDraggable.y + selectedDraggable.height / 2;

    let handleRelativeX = selectedDraggable.width / 2 - HANDLE_SIZE / 2;
    let handleRelativeY = selectedDraggable.height / 2 - HANDLE_SIZE / 2;
    let rotatedHandlePos = rotatePoint({ x: handleRelativeX, y: handleRelativeY }, { x: 0, y: 0 }, selectedDraggable.rotation);
    let scaleHandleRectX = centerX + rotatedHandlePos.x - HANDLE_SIZE / 2;
    let scaleHandleRectY = centerY + rotatedHandlePos.y - HANDLE_SIZE / 2;


    if (isPointInRotatedRect(
        mousePos.x, mousePos.y,
        scaleHandleRectX, scaleHandleRectY,
        HANDLE_SIZE, HANDLE_SIZE,
        selectedDraggable.rotation
    )) {
        return 'scale';
    }

    let rotateHandleRelativeX = 0;
    let rotateHandleRelativeY = -selectedDraggable.height / 2 - ROTATE_HANDLE_OFFSET;
    let rotatedRotateHandlePos = rotatePoint({ x: rotateHandleRelativeX, y: rotateHandleRelativeY }, { x: 0, y: 0 }, selectedDraggable.rotation);
    let rotateHandleX = centerX + rotatedRotateHandlePos.x;
    let rotateHandleY = centerY + rotatedRotateHandlePos.y;

    if (distance(mousePos.x, mousePos.y, rotateHandleX, rotateHandleY) <= HANDLE_SIZE / 2) {
        return 'rotate';
    }

    return null;
}

function rotatePoint(point, origin, angle) {
    const s = Math.sin(angle);
    const c = Math.cos(angle);

    const px = point.x - origin.x;
    const py = point.y - origin.y;

    const xnew = px * c - py * s;
    const ynew = px * s + py * c;

    return { x: xnew + origin.x, y: ynew + origin.y };
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function handleMouseDown(e) {
    e.preventDefault();
    const mousePos = getEventCoordinates(e);
    startX = mousePos.x;
    startY = mousePos.y;

    const handleType = getHandleType(mousePos);
    if (handleType === 'scale') {
        isResizing = true;
        const centerX = selectedDraggable.x + selectedDraggable.width / 2;
        const centerY = selectedDraggable.y + selectedDraggable.height / 2;

        let pivotRelativeX = -selectedDraggable.width / 2;
        let pivotRelativeY = -selectedDraggable.height / 2;

        let rotatedPivot = rotatePoint({ x: pivotRelativeX, y: pivotRelativeY }, { x: 0, y: 0 }, selectedDraggable.rotation);
        pivotX = centerX + rotatedPivot.x;
        pivotY = centerY + rotatedPivot.y;

        initialDistanceToOppositeCorner = distance(pivotX, pivotY, startX, startY);
        return;
    } else if (handleType === 'rotate') {
        isRotating = true;
        initialRotation = selectedDraggable.rotation;
        return;
    }

    const allDraggables = [...stickers, ...texts];
    selectedDraggable = null;
    for (let i = allDraggables.length - 1; i >= 0; i--) {
        const obj = allDraggables[i];
        if (isPointInRotatedRect(mousePos.x, mousePos.y, obj.x, obj.y, obj.width, obj.height, obj.rotation)) {
            selectedDraggable = obj;
            isDragging = true;
            dragOffsetX = mousePos.x - obj.x;
            dragOffsetY = mousePos.y - obj.y;
            break;
        }
    }

    debouncedRenderCanvas();
}

function handleMouseMove(e) {
    e.preventDefault();
    const mousePos = getEventCoordinates(e);

    if (isDragging && selectedDraggable) {
        selectedDraggable.x = mousePos.x - dragOffsetX;
        selectedDraggable.y = mousePos.y - dragOffsetY;
        debouncedRenderCanvas();
    } else if (isResizing && selectedDraggable) {
        const currentDistance = distance(pivotX, pivotY, mousePos.x, mousePos.y);
        const scaleFactor = currentDistance / initialDistanceToOppositeCorner;

        if (selectedDraggable.img) { // Sticker
            selectedDraggable.width = selectedDraggable.originalWidth * scaleFactor;
            selectedDraggable.height = selectedDraggable.originalHeight * scaleFactor;
            const MIN_SIZE = 20;
            if (selectedDraggable.width < MIN_SIZE || selectedDraggable.height < MIN_SIZE) {
                const ratio = selectedDraggable.originalHeight / selectedDraggable.originalWidth;
                selectedDraggable.width = MIN_SIZE;
                selectedDraggable.height = MIN_SIZE * ratio;
            }
        } else if (selectedDraggable.content) { // Text
            selectedDraggable.size = selectedDraggable.textSize * scaleFactor;
            const MIN_FONT_SIZE = 10;
            const MAX_FONT_SIZE = 100;
            selectedDraggable.size = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, selectedDraggable.size));

            ctx.font = `${selectedDraggable.isBold ? 'bold ' : ''}${selectedDraggable.isItalic ? 'italic ' : ''}${selectedDraggable.size}px ${selectedDraggable.font}`;
            selectedDraggable.width = ctx.measureText(selectedDraggable.content).width;
            selectedDraggable.height = selectedDraggable.size;
        }

        // Adjust position so the pivot point remains fixed
        // This recalculates the object's top-left (x, y) based on the fixed pivot and new dimensions
        const centerOffsetFromPivotX = selectedDraggable.width / 2;
        const centerOffsetFromPivotY = selectedDraggable.height / 2;

        const rotatedCenterRelativeToPivot = rotatePoint({x: centerOffsetFromPivotX, y: centerOffsetFromPivotY}, {x:0,y:0}, selectedDraggable.rotation);

        selectedDraggable.x = pivotX - rotatedCenterRelativeToPivot.x;
        selectedDraggable.y = pivotY - rotatedCenterRelativeToPivot.y;


        debouncedRenderCanvas();
    } else if (isRotating && selectedDraggable) {
        const centerX = selectedDraggable.x + selectedDraggable.width / 2;
        const centerY = selectedDraggable.y + selectedDraggable.height / 2;

        const angleRad = Math.atan2(mousePos.y - centerY, mousePos.x - centerX);
        const initialAngle = Math.atan2(startY - centerY, startX - centerX);

        selectedDraggable.rotation = initialRotation + (angleRad - initialAngle);
        debouncedRenderCanvas();
    }
}

function handleMouseUp(e) {
    isDragging = false;
    isResizing = false;
    isRotating = false;
    // selectedDraggable = null; // Can uncomment if you want objects to deselect on mouse up
    // debouncedRenderCanvas(); // Re-render for final state if not already debounced
}

// --- Touch Event Handlers (Simplified for single touch) ---

function handleTouchStart(e) {
    if (e.touches.length === 1) {
        e.preventDefault();
        const touch = e.touches[0];
        handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} });
    }
}

function handleTouchMove(e) {
    if (e.touches.length === 1 && (isDragging || isResizing || isRotating)) {
        e.preventDefault();
        const touch = e.touches[0];
        handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} });
    }
}

function handleTouchEnd(e) {
    handleMouseUp(e);
}


// --- Event Listeners ---

addStickerBtn.addEventListener("click", async function() {
    const stickerSrc = stickerSelect.value;
    if (!stickerSrc) return;

    try {
        const img = await loadImage(stickerSrc);
        const initialWidth = 100;
        const initialHeight = (img.height / img.width) * initialWidth;
        const newSticker = {
            img: img,
            src: stickerSrc,
            x: (photoCanvas.width / 2) - (initialWidth / 2),
            y: (photoCanvas.height / 2) - (initialHeight / 2),
            width: initialWidth,
            height: initialHeight,
            originalWidth: initialWidth,
            originalHeight: initialHeight,
            rotation: 0
        };
        stickers.push(newSticker);
        selectedDraggable = newSticker;
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
    const text = textInput.value.trim();
    if (!text) {
        return;
    }

    const selectedTextSize = parseInt(textSizeInput.value, 10);
    const selectedTextFont = textFontSelect.value;
    const selectedTextColor = textColorInput.value;
    const isBold = textBoldBtn.classList.contains('active');
    const isItalic = textItalicBtn.classList.contains('active');
    const isUnderline = textUnderlineBtn.classList.contains('active');
    const textAlign = textAlignSelect.value;

    ctx.font = `${isBold ? 'bold ' : ''}${isItalic ? 'italic ' : ''}${selectedTextSize}px ${selectedTextFont}`;
    const textMetrics = ctx.measureText(text);
    const initialTextWidth = textMetrics.width;
    const initialTextHeight = selectedTextSize;

    const newTextObj = {
        text: text,
        x: (photoCanvas.width / 2) - (initialTextWidth / 2),
        y: (photoCanvas.height / 2) - (initialTextHeight / 2),
        font: selectedTextFont,
        textSize: selectedTextSize,
        size: selectedTextSize,
        color: selectedTextColor,
        align: textAlign,
        isBold: isBold,
        isItalic: isItalic,
        isUnderline: isUnderline,
        width: initialTextWidth,
        height: initialTextHeight,
        rotation: 0,
    };

    texts.push(newTextObj);
    textInput.value = "";
    selectedDraggable = newTextObj;
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
textUnderlineBtn.addEventListener('click', () => { textUnderlineBtn.classList.toggle('active'); renderCanvas(); });
textAlignSelect.addEventListener('change', () => { renderCanvas(); });


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

            if (currentStripConfig && currentStripConfig.defaultBackground) {
                finalCtx.fillStyle = currentStripConfig.defaultBackground;
                finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
            }
            if (currentFrameImgSrc) {
                loadImage(currentFrameImgSrc).then(frameImg => {
                    finalCtx.drawImage(frameImg, 0, 0, finalCanvas.width, finalCanvas.height);
                    drawPhotosAndDraggablesForDownload(finalCtx); // Draw photos, stickers, text
                    finalizeDownload(finalCanvas, mimeType, quality);
                }).catch(error => {
                    console.error("Error loading frame for download:", error);
                    drawPhotosAndDraggablesForDownload(finalCtx); // Draw without frame
                    finalizeDownload(finalCanvas, mimeType, quality);
                });
            } else {
                drawPhotosAndDraggablesForDownload(finalCtx); // Draw without frame
                finalizeDownload(finalCanvas, mimeType, quality);
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
            targetCtx.save();
            targetCtx.translate(sticker.x + sticker.width / 2, sticker.y + sticker.height / 2);
            targetCtx.rotate(sticker.rotation);
            targetCtx.drawImage(imgToDraw, -sticker.width / 2, -sticker.height / 2, sticker.width, sticker.height);
            targetCtx.restore();
        } catch (error) {
            console.error(`ERROR: Failed to draw sticker ${sticker.src} for download:`, error);
        }
    }

    for (const textObj of texts) {
        targetCtx.save();
        targetCtx.fillStyle = textObj.color;
        let fontStyle = '';
        if (textObj.isItalic) fontStyle += 'italic ';
        if (textObj.isBold) fontStyle += 'bold ';
        targetCtx.font = `${fontStyle}${textObj.size}px ${textObj.font}`;
        targetCtx.textAlign = textObj.align;
        targetCtx.textBaseline = 'middle';

        const centerX = textObj.x + textObj.width / 2;
        const centerY = textObj.y + textObj.height / 2;

        targetCtx.translate(centerX, centerY);
        targetCtx.rotate(textObj.rotation);
        targetCtx.fillText(textObj.content, 0, 0);

        if (textObj.isUnderline) {
            const textMetrics = targetCtx.measureText(textObj.content);
            const underlineHeight = textObj.size / 15;
            const underlineY = underlineHeight * 2;

            let underlineX = -textMetrics.width / 2;
            if (textObj.align === 'left') underlineX = 0;
            else if (textObj.align === 'right') underlineX = -textMetrics.width;

            targetCtx.beginPath();
            targetCtx.strokeStyle = textObj.color;
            targetCtx.lineWidth = underlineHeight;
            targetCtx.moveTo(underlineX, underlineY);
            targetCtx.lineTo(underlineX + textMetrics.width, underlineY);
            targetCtx.stroke();
        }
        targetCtx.restore();
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
    // Corrected path relative to base href="/odzbooth-beta/"
    window.location.href = 'layout-selection/layout-selection.html';
});

document.addEventListener('DOMContentLoaded', initializeEditor);
