// edit.js - The core logic for the Photo Editing Page
"use strict";

// --- DOM Element References ---
const photoCanvas = document.getElementById("photoCanvas"); 
const ctx = photoCanvas.getContext("2d");

const stickerSelect = document.getElementById("stickerSelect");
const addStickerBtn = document.getElementById("addStickerBtn");
const removeStickerBtn = document.getElementById("removeStickerBtn"); 

const textInput = document.getElementById("textInput");
const textColorInput = document.getElementById("textColor");
const textFontSelect = document.getElementById("textFont");
const textSizeInput = document.getElementById("textSize");
const addTextBtn = document.getElementById("addTextBtn");
const removeTextBtn = document.getElementById("removeTextBtn"); 

// Text Style Option Buttons
const textBoldBtn = document.getElementById('textBoldBtn');
const textItalicBtn = document.getElementById('textItalicBtn');
const textUnderlineBtn = document.getElementById('textUnderlineBtn');
const textAlignSelect = document.getElementById('textAlignSelect'); 

const downloadStripBtn = document.getElementById("downloadStripBtn");
const downloadGifBtn = document.getElementById("downloadGifBtn");
const downloadFormatSelect = document.getElementById('downloadFormat'); 
const retakeBtn = document.getElementById("retakeBtn");

const noPhotosMessage = document.getElementById('no-photos-message');
const downloadSpinner = document.getElementById('download-spinner');

// --- Global State Variables ---
let capturedPhotosBase64 = []; // Stores base64 image data
let stickers = []; // Stores sticker objects
let texts = []; // Stores text objects

let currentStripConfig = null; 
let selectedDraggable = null; // Currently selected sticker/text for dragging/removal

// --- Draggable State for Mouse/Touch ---
let activeDraggable = null; // The item currently being dragged
let dragStart = { x: 0, y: 0 }; // Mouse/touch position when drag started

// --- Configuration: Fixed Strip Dimensions and Photo Frame Coordinates ---
const STRIP_COMMON_SETTINGS = {
    photoSidePadding: 40, 
    photoSlotWidth: 320, 
    gapBetweenPhotos: 20, 
    topPadding: 40, 
    bottomSpaceForLogo: 150 
};

// All defaultBackgrounds set to a consistent gray, matching your strip-frame images
const STRIP_CONFIGS = {
    '1': {
        stripWidth: 400,
        stripHeight: STRIP_COMMON_SETTINGS.topPadding + 240 + STRIP_COMMON_SETTINGS.bottomSpaceForLogo, 
        frames: [
            { x: STRIP_COMMON_SETTINGS.photoSidePadding, y: STRIP_COMMON_SETTINGS.topPadding, width: STRIP_COMMON_SETTINGS.photoSlotWidth, height: 240 }
        ],
        defaultBackground: '#CCCCCC', 
        frameAspectRatio: 320 / 240 
    },
    '2': {
        stripWidth: 400,
        stripHeight: STRIP_COMMON_SETTINGS.topPadding + (240 * 2) + STRIP_COMMON_SETTINGS.gapBetweenPhotos + STRIP_COMMON_SETTINGS.bottomSpaceForLogo, 
        frames: [
            { x: STRIP_COMMON_SETTINGS.photoSidePadding, y: STRIP_COMMON_SETTINGS.topPadding, width: STRIP_COMMON_SETTINGS.photoSlotWidth, height: 240 },
            { x: STRIP_COMMON_SETTINGS.photoSidePadding, y: STRIP_COMMON_SETTINGS.topPadding + 240 + STRIP_COMMON_SETTINGS.gapBetweenPhotos, width: STRIP_COMMON_SETTINGS.photoSlotWidth, height: 240 }
        ],
        defaultBackground: '#CCCCCC', 
        frameAspectRatio: 320 / 240 
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
        frameAspectRatio: 320 / 220 
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
        frameAspectRatio: 320 / 226 
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
        frameAspectRatio: 320 / 220 
    }
};

// --- Image Preloading Utility ---
// Preloads all captured photos and stores Image objects for efficient rendering
let preloadedCapturedImages = [];

async function preloadAllCapturedImages() {
    preloadedCapturedImages = []; // Clear previous images
    const promises = capturedPhotosBase64.map(src => loadImage(src));
    try {
        preloadedCapturedImages = await Promise.all(promises);
        console.log("All captured photos preloaded for editing.");
    } catch (error) {
        console.error("Error preloading captured images:", error);
        // Fallback: Continue with base64 strings if preloading fails
        // drawPhotosOnStrip will attempt to load them individually if not preloaded.
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
    photoCanvas.style.display = 'none'; // Ensure canvas is hidden when message is shown
}

/**
 * Hides the no photos message.
 */
function hideNoPhotosMessage() {
    noPhotosMessage.style.display = 'none';
    photoCanvas.style.display = 'block'; // Show canvas when message is hidden
}

/**
 * Shows/hides the download processing spinner.
 * @param {boolean} show - True to show, false to hide.
 */
function showDownloadSpinner(show) {
    if (show) {
        downloadSpinner.classList.remove('hidden-spinner');
        photoCanvas.style.display = 'none'; 
        noPhotosMessage.style.display = 'none'; 
    } else {
        downloadSpinner.classList.add('hidden-spinner');
        if (noPhotosMessage.style.display === 'none') { // Only show canvas if no other message is active
            photoCanvas.style.display = 'block';
        }
    }
}

// --- Canvas Drawing Functions (for the interactive editing canvas) ---

/**
 * Renders all elements (background, frame, photos, stickers, text) onto the main editing canvas.
 */
async function renderCanvas() {
    ctx.clearRect(0, 0, photoCanvas.width, photoCanvas.height);

    // 1. Draw solid background color based on the selected configuration.
    if (currentStripConfig && currentStripConfig.defaultBackground) {
        ctx.fillStyle = currentStripConfig.defaultBackground;
        ctx.fillRect(0, 0, photoCanvas.width, photoCanvas.height);
    }

    // 2. Draw the transparent strip frame overlay.
    const frameImgSrc = `assets/strip-frame-${currentStripConfig.frames.length}-photos.png`; 
    try {
        const frameImg = await loadImage(frameImgSrc);
        ctx.drawImage(frameImg, 0, 0, photoCanvas.width, photoCanvas.height);
    } catch (error) {
        console.warn(`WARNING: Could not load strip frame image: ${frameImgSrc}. Ensure it exists and is correct.`, error);
    }

    // 3. Draw captured photos
    drawPhotosOnStrip(ctx); // Pass context to generalized function
    drawStickersOnCanvas(ctx, stickers); 
    drawTextOnCanvas(ctx, texts); 
}

/**
 * Draws captured photos onto the given canvas context.
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

        const img = preloadedCapturedImages[i]; // Use preloaded image if available

        if (img && img.complete) { // Check if image is loaded
            targetCtx.drawImage(img, frame.x, frame.y, frame.width, frame.height);
        } else {
            // Fallback for cases where image might not be preloaded or failed
            console.warn(`Preloaded image ${i} not ready. Attempting to load on demand.`);
            const imgSrc = capturedPhotosBase64[i];
            loadImage(imgSrc).then(loadedImg => {
                targetCtx.drawImage(loadedImg, frame.x, frame.y, frame.width, frame.height);
                renderCanvas(); // Re-render once loaded to ensure proper placement
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
            
            // Ensure the image is loaded before drawing
            if (imgToDraw.complete) {
                targetCtx.drawImage(imgToDraw, sticker.x, sticker.y, sticker.width, sticker.height);
            } else {
                imgToDraw.onload = () => renderCanvas(); // Re-render once loaded
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
        
        targetCtx.font = `${fontStyle}${textObj.textSize}px ${textObj.font}`; // Use stored textSize and font family
        targetCtx.textAlign = textObj.align;
        
        const textX = textObj.x;
        const textY = textObj.y;

        targetCtx.fillText(textObj.text, textX, textY);

        // Draw underline if enabled
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


// --- Update Canvas Dimensions and Render ---
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

    renderCanvas();
}


// --- Initialization Function ---
async function initializeEditor() {
    const savedPhotosJson = localStorage.getItem("capturedPhotos");

    if (savedPhotosJson) {
        // FIX: Corrected variable name from capturedPhotosBase66 to capturedPhotosBase64
        capturedPhotosBase64 = JSON.parse(savedPhotosJson); 
    }

    if (capturedPhotosBase64.length === 0) {
        displayNoPhotosMessage(
            'No photos found.',
            'info',
            'Please go back to <a href="capture-page/capture-page.html">capture photos</a> first.' 
        );
        // Disable all controls if no photos
        downloadStripBtn.disabled = true;
        downloadGifBtn.disabled = true;
        addStickerBtn.disabled = true;
        removeStickerBtn.disabled = true; 
        addTextBtn.disabled = true;
        removeTextBtn.disabled = true; 
        stickerSelect.disabled = true;
        textInput.disabled = true;
        textColorInput.disabled = true;
        textFontSelect.disabled = true;
        textSizeInput.disabled = true;
        textBoldBtn.disabled = true;
        textItalicBtn.disabled = true;
        textUnderlineBtn.disabled = true;
        textAlignSelect.disabled = true;
        downloadFormatSelect.disabled = true; 
        return;
    } else {
        hideNoPhotosMessage(); 
        // Enable controls if photos are present
        downloadStripBtn.disabled = false;
        // The GIF button is always disabled for now as per prior request
        downloadGifBtn.disabled = true; 
        addStickerBtn.disabled = false;
        removeStickerBtn.disabled = false; 
        addTextBtn.disabled = false;
        removeTextBtn.disabled = false; 
        stickerSelect.disabled = false;
        textInput.disabled = false;
        textColorInput.disabled = false;
        textFontSelect.disabled = false;
        textSizeInput.disabled = false;
        textBoldBtn.disabled = false;
        textItalicBtn.disabled = false;
        textUnderlineBtn.disabled = false;
        textAlignSelect.disabled = false;
        downloadFormatSelect.disabled = false; 
    }

    await preloadAllCapturedImages(); // Preload images *before* rendering
    updateCanvasAndRender();
}


// --- Final Strip Composition and Download ---
downloadStripBtn.addEventListener("click", async function () { 
    showDownloadSpinner(true); 

    try {
        const finalCanvas = document.createElement('canvas');
        const finalCtx = finalCanvas.getContext('2d');

        finalCanvas.width = currentStripConfig.stripWidth;
        finalCanvas.height = currentStripConfig.stripHeight;

        if (currentStripConfig && currentStripConfig.defaultBackground) {
            finalCtx.fillStyle = currentStripConfig.defaultBackground;
            finalCtx.fillRect(0, 0, finalCanvas.width, finalCtx.height); 
        }

        const frameImgSrc = `assets/strip-frame-${currentStripConfig.frames.length}-photos.png`;
        try {
            const frameImg = await loadImage(frameImgSrc);
            finalCtx.drawImage(frameImg, 0, 0, finalCanvas.width, finalCanvas.height);
        } catch (error) {
            console.warn(`WARNING: Could not load strip frame image for final composite: ${frameImgSrc}.`, error);
        }

        // --- Draw captured photos onto the final canvas ---
        const numPhotosToDisplay = capturedPhotosBase64.length;
        const framesToUse = currentStripConfig ? currentStripConfig.frames : [];

        for (let i = 0; i < Math.min(numPhotosToDisplay, framesToUse.length); i++) {
            const frame = framesToUse[i];
            if (!frame) continue; 

            const img = preloadedCapturedImages[i]; // Use preloaded image

            if (img && img.complete) {
                finalCtx.drawImage(img, frame.x, frame.y, frame.width, frame.height);
            } else {
                 console.warn(`Preloaded image ${i} not ready for final composite. Attempting on-demand load.`);
                try {
                    const loadedImg = await loadImage(capturedPhotosBase64[i]);
                    finalCtx.drawImage(loadedImg, frame.x, frame.y, frame.width, frame.height);
                } catch (error) {
                     console.error(`ERROR: Failed to draw photo ${i + 1} on final composite:`, error);
                }
            }
        }

        drawStickersOnCanvas(finalCtx, stickers); 
        drawTextOnCanvas(finalCtx, texts); 

        const strandStickerSrc = stickerSelect.value; 

        if (strandStickerSrc) { 
            try {
                const strandStickerImage = await loadImage(strandStickerSrc);

                const stickerWidth = 150; 
                const stickerHeight = 150; 
                const padding = 30; 

                const xPos = padding;
                const yPos = finalCanvas.height - stickerHeight - padding;

                finalCtx.drawImage(strandStickerImage, xPos, yPos, stickerWidth, stickerHeight);
            } catch (error) {
                console.error("Failed to load bottom-left strand sticker for final composite:", strandStickerSrc, error);
            }
        }

        const link = document.createElement("a");
        const selectedFormat = downloadFormatSelect.value;
        let mimeType = selectedFormat;
        let quality = 1.0; 

        if (selectedFormat.includes(';')) {
            const parts = selectedFormat.split(';');
            mimeType = parts[0];
            quality = parseFloat(parts[1]);
        }
        
        link.download = `odz-photo-strip.${mimeType.split('/')[1]}`; 
        link.href = finalCanvas.toDataURL(mimeType, quality);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error("Error during strip generation:", error);
        alert("Failed to generate photo strip. Please try again. Check console for details.");
    } finally {
        showDownloadSpinner(false); 
    }
});

downloadGifBtn.addEventListener("click", function () {
    alert("GIF generation is a more advanced feature not fully implemented in this version. It typically requires a separate library (like gif.js) to create animated GIFs from multiple frames, or server-side processing.");
});

retakeBtn.addEventListener('click', () => {
    localStorage.removeItem('capturedPhotos');
    localStorage.removeItem('selectedPhotoCount'); 
    window.location.href = 'layout-selection/layout-selection.html'; 
});


// --- Event Handlers for Editing Tools ---

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
// Using a single activeDraggable to manage both mouse and touch drag state
// and a debounced render for performance during dragging.

let debounceRenderTimeout;
const DEBOUNCE_DELAY = 16; // Roughly 60 frames per second

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

    // Check stickers first (top layer)
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

    // Then check text (below stickers)
    for (let i = texts.length - 1; i >= 0; i--) {
        const t = texts[i];
        // Temporarily set font for accurate text measurement
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
        debouncedRenderCanvas(); // Use debounced render for smoother dragging
    }
}

function handleDragEnd() {
    if (activeDraggable) {
        activeDraggable.isDragging = false; 
        activeDraggable = null; 
        renderCanvas(); // Final render to ensure precise position and remove highlight
    }
}

// --- Event Listeners for Dragging (Unified) ---
photoCanvas.addEventListener('mousedown', (e) => {
    e.preventDefault(); // Prevent default browser drag behavior
    handleDragStart(getEventCoordinates(e));
});
photoCanvas.addEventListener('mousemove', (e) => {
    if (activeDraggable) e.preventDefault(); // Prevent text selection/scrolling during drag
    handleDragMove(getEventCoordinates(e));
});
photoCanvas.addEventListener('mouseup', handleDragEnd);
photoCanvas.addEventListener('mouseleave', handleDragEnd); // End drag if mouse leaves canvas

photoCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent scrolling/zooming on touch
    handleDragStart(getEventCoordinates(e));
}, { passive: false }); // `passive: false` is important for `preventDefault` in touchstart/touchmove
photoCanvas.addEventListener('touchmove', (e) => {
    if (activeDraggable) e.preventDefault();
    handleDragMove(getEventCoordinates(e));
}, { passive: false });
photoCanvas.addEventListener('touchend', handleDragEnd);

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', initializeEditor);