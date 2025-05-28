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

let activeDraggable = null; 
let currentFrameImgSrc = ''; // NEW: To store the currently selected frame image path

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
            { id: 'option1', src: 'assets/strip-frame-3-photos-option1.png', name: 'balik-eskwela' },
            { id: 'option2', src: 'assets/strip-frame-3-photos-option2.png', name: 'option-2' },
            { id: 'option3', src: 'assets/strip-frame-3-photos-option3.png', name: 'option-3' }
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

    // MODIFIED: Use currentFrameImgSrc for drawing the frame
    if (currentFrameImgSrc) {
        try {
            const frameImg = await loadImage(currentFrameImgSrc);
            ctx.drawImage(frameImg, 0, 0, photoCanvas.width, photoCanvas.height);
        } catch (error) {
            console.warn(`WARNING: Could not load selected strip frame image: ${currentFrameImgSrc}. Ensure it exists and is correct.`, error);
            // Fallback to a plain background if frame image fails to load
            ctx.fillStyle = currentStripConfig.defaultBackground || '#CCCCCC';
            ctx.fillRect(0, 0, photoCanvas.width, photoCanvas.height);
        }
    } else {
        // Fallback if no frame is selected (shouldn't happen with default set)
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

            if (sticker.isDragging || (selectedDraggable === sticker)) { 
                targetCtx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
                targetCtx.lineWidth = 2;
                targetCtx.strokeRect(sticker.x, sticker.y, sticker.width, sticker.height);
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
        
        targetCtx.font = `${fontStyle}${textObj.textSize}px ${textObj.font}`; 
        targetCtx.textAlign = textObj.align;
        
        const textX = textObj.x;
        const textY = textObj.y;

        targetCtx.fillText(textObj.text, textX, textY);

        if (textObj.isUnderline) {
            const textMetrics = targetCtx.measureText(textObj.text);
            const underlineHeight = textObj.textSize / 15; 
            const underlineY = textY + underlineHeight * 2; 

            let underlineX = textX;
            if (textObj.align === 'center') underlineX -= textMetrics.width / 2;
            else if (textObj.align === 'right') underlineX -= textMetrics.width;

            targetCtx.beginPath();
            targetCtx.strokeStyle = textObj.color;
            targetCtx.lineWidth = underlineHeight;
            targetCtx.moveTo(underlineX, underlineY);
            targetCtx.lineTo(underlineX + textMetrics.width, underlineY);
            targetCtx.stroke();
        }

        if (textObj.isDragging || (selectedDraggable === textObj)) {
            targetCtx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
            targetCtx.lineWidth = 2;

            const metrics = targetCtx.measureText(textObj.text);
            const textWidth = metrics.width;
            const textHeight = textObj.textSize; 

            let rectX = textX;
            if (textObj.align === 'center') rectX -= textWidth / 2;
            else if (textObj.align === 'right') rectX -= textWidth;
            const rectY = textY - textHeight; 

            targetCtx.strokeRect(rectX, rectY, textWidth, textHeight + 5); 
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

    // MODIFIED: Populate frame options and set initial frame
    populateFrameOptions(currentStripConfig.availableFrames);
    if (!currentFrameImgSrc && currentStripConfig.availableFrames.length > 0) {
        currentFrameImgSrc = currentStripConfig.availableFrames[0].src; // Set first as default
        frameSelect.value = currentStripConfig.availableFrames[0].src; // Update dropdown to reflect default
    } else if (currentFrameImgSrc) {
        // If a frame was already selected (e.g., user navigated away and back),
        // ensure the dropdown reflects it.
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

    // Set the initial frame based on the default or first available
    // This is called AFTER currentStripConfig is set
    if (currentStripConfig.availableFrames && currentStripConfig.availableFrames.length > 0) {
        // If it's the very first load, set to the first option
        // Otherwise, `currentFrameImgSrc` might already have a value if user
        // navigates back/forward (though not saved across sessions).
        if (!currentFrameImgSrc) {
            currentFrameImgSrc = currentStripConfig.availableFrames[0].src;
        }
    }
    
    await preloadAllCapturedImages(); 
    updateCanvasAndRender(); // This will now also populate and set the frame dropdown
}


// --- Event Listeners ---

addStickerBtn.addEventListener("click", async function() {
    const stickerSrc = stickerSelect.value;
    if (!stickerSrc) return;

    try {
        const img = await loadImage(stickerSrc);
        stickers.push({
            img: img, 
            src: stickerSrc,
            x: (photoCanvas.width / 2) - 50, 
            y: (photoCanvas.height / 2) - 50, 
            width: 100,
            height: 100,
            isDragging: false,
            offsetX: 0,
            offsetY: 0
        });
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

    const lastFrame = currentStripConfig.frames[currentStripConfig.frames.length - 1];
    const lastPhotoBottomY = lastFrame.y + lastFrame.height;

    const initialTextX = (textAlign === 'center') ? currentStripConfig.stripWidth / 2 :
                         (textAlign === 'left') ? STRIP_COMMON_SETTINGS.photoSidePadding :
                         currentStripConfig.stripWidth - STRIP_COMMON_SETTINGS.photoSidePadding; 

    const initialTextY = lastPhotoBottomY + 10 + selectedTextSize; 
    
    const newTextObj = {
        text: text,
        x: initialTextX,
        y: initialTextY,
        font: textFontSelect.value, 
        textSize: selectedTextSize, 
        color: selectedTextColor,
        align: textAlign, 
        isBold: isBold, 
        isItalic: isItalic, 
        isUnderline: isUnderline, 
        isDragging: false,
        offsetX: 0,
        offsetY: 0
    };

    texts.push(newTextObj);
    textInput.value = ""; 
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


// --- Interactive Dragging (Stickers and Text) ---
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

function handleDragStart(coords) {
    if (selectedDraggable) {
        selectedDraggable = null;
        renderCanvas(); 
    }

    for (let i = stickers.length - 1; i >= 0; i--) {
        const s = stickers[i];
        if (coords.x > s.x && coords.x < s.x + s.width &&
            coords.y > s.y && coords.y < s.y + s.height) {
            activeDraggable = s;
            selectedDraggable = s; 
            s.isDragging = true;
            s.offsetX = coords.x - s.x;
            s.offsetY = coords.y - s.y;
            renderCanvas();
            return; 
        }
    }

    for (let i = texts.length - 1; i >= 0; i--) {
        const t = texts[i];
        ctx.font = `${t.isBold ? 'bold ' : ''}${t.isItalic ? 'italic ' : ''}${t.textSize}px ${t.font}`;
        const metrics = ctx.measureText(t.text);
        const textWidth = metrics.width;
        const textHeight = t.textSize; 

        let textRectX = t.x;
        if (t.align === 'center') textRectX -= textWidth / 2;
        else if (t.align === 'right') textRectX -= textWidth;
        const textRectY = t.y - textHeight; 

        if (coords.x > textRectX && coords.y > textRectY &&
            coords.x < textRectX + textWidth && coords.y < textRectY + textHeight) {
            activeDraggable = t;
            selectedDraggable = t; 
            t.isDragging = true;
            t.offsetX = coords.x - t.x; 
            t.offsetY = coords.y - t.y; 
            renderCanvas();
            return; 
        }
    }
}

function handleDragMove(coords) {
    if (activeDraggable) {
        activeDraggable.x = coords.x - activeDraggable.offsetX;
        activeDraggable.y = coords.y - activeDraggable.offsetY;
        debouncedRenderCanvas(); 
    }
}

function handleDragEnd() {
    if (activeDraggable) {
        activeDraggable.isDragging = false; 
        activeDraggable = null; 
        renderCanvas(); 
    }
}

photoCanvas.addEventListener('mousedown', (e) => {
    e.preventDefault(); 
    handleDragStart(getEventCoordinates(e));
});
photoCanvas.addEventListener('mousemove', (e) => {
    if (activeDraggable) e.preventDefault(); 
    handleDragMove(getEventCoordinates(e));
});
photoCanvas.addEventListener('mouseup', handleDragEnd);
photoCanvas.addEventListener('mouseleave', handleDragEnd); 

photoCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); 
    handleDragStart(getEventCoordinates(e));
}, { passive: false }); 
photoCanvas.addEventListener('touchmove', (e) => {
    if (activeDraggable) e.preventDefault();
    handleDragMove(getEventCoordinates(e));
}, { passive: false });
photoCanvas.addEventListener('touchend', handleDragEnd);

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
            const dataURL = photoCanvas.toDataURL(mimeType, quality);
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = `odz_photobooth_strip.${mimeType.split('/')[1].split(';')[0]}`; 
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading strip:', error);
            alert('Failed to download photo strip. See console for details.');
        } finally {
            showDownloadSpinner(false); 
        }
    }, 50); 
});

// NEW: Frame Selection Event Listener
frameSelect.addEventListener('change', (event) => {
    currentFrameImgSrc = event.target.value; // Update the current frame source
    renderCanvas(); // Re-render the canvas with the new frame
});

retakeBtn.addEventListener('click', () => {
    localStorage.removeItem('capturedPhotos');
    localStorage.removeItem('selectedPhotoCount'); 
    window.location.href = 'layout-selection/layout-selection.html'; 
});


document.addEventListener('DOMContentLoaded', initializeEditor);
