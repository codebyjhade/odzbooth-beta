// editing-page/edit.js

"use strict";

// --- Configuration ---
const STRIP_LAYOUT_CONFIGS = {
    common: {
        photoSidePadding: 40,
        photoSlotWidth: 320,
        gapBetweenPhotos: 20,
        topPadding: 40,
        bottomSpaceForLogo: 150
    },
    '1': {
        stripWidth: 400,
        stripHeight: 40 + 240 + 150,
        frames: [{ x: 40, y: 40, width: 320, height: 240 }],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-1-photos-option1.png', name: 'Original Single' },
            { id: 'option2', src: 'assets/strip-frame-1-photos-option2.png', name: 'Clean White' },
            { id: 'option3', src: 'assets/strip-frame-1-photos-option3.png', name: 'Styled Border' }
        ]
    },
    '2': {
        stripWidth: 400,
        stripHeight: 40 + (240 * 2) + 20 + 150,
        frames: [
            { x: 40, y: 40, width: 320, height: 240 },
            { x: 40, y: 40 + 240 + 20, width: 320, height: 240 }
        ],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-2-photos-option1.png', name: 'Original Double' },
            { id: 'option2', src: 'assets/strip-frame-2-photos-option2.png', name: 'Minimal Lines' },
            { id: 'option3', src: 'assets/strip-frame-2-photos-option3.png', name: 'Decorative Duo' }
        ]
    },
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
            { id: 'option1', src: 'assets/strip-frame-3-photos-option1.png', name: 'Original Triple' },
            { id: 'option2', src: 'assets/strip-frame-3-photos-option2.png', name: 'Simple Border' },
            { id: 'option3', src: 'assets/strip-frame-3-photos-option3.png', name: 'Modern Style' }
        ]
    },
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
            { id: 'option1', src: 'assets/strip-frame-4-photos-option1.png', name: 'Original Quad' },
            { id: 'option2', src: 'assets/strip-frame-4-photos-option2.png', name: 'Vintage Edge' },
            { id: 'option3', src: 'assets/strip-frame-4-photos-option3.png', name: 'Clean Frame' }
        ]
    },
    '6': {
        stripWidth: 760,
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
            { id: 'option1', src: 'assets/strip-frame-6-photos-option1.png', name: 'Original Six' },
            { id: 'option2', src: 'assets/strip-frame-6-photos-option2.png', name: 'Two-Column Classic' }
        ]
    }
};

const DEFAULT_TEXT_SETTINGS = {
    color: '#333333',
    font: "'Poppins', sans-serif",
    size: 30,
    align: 'center',
    isBold: false,
    isItalic: false,
    isUnderline: false,
    outlineColor: '#000000',
    outlineWidth: 0,
    shadowColor: '#000000',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowBlur: 0
};

const DEFAULT_DRAWING_SETTINGS = {
    color: '#FF0000',
    size: 5
};

// --- DOM Element References ---
const DOMElements = {
    photoCanvas: document.getElementById("photoCanvas"),
    ctx: null, // Assigned in initializeEditorPage
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

    textOutlineColorInput: document.getElementById('textOutlineColorInput'),
    textOutlineWidthInput: document.getElementById('textOutlineWidthInput'),
    clearTextOutlineBtn: document.getElementById('clearTextOutlineBtn'),
    textShadowColorInput: document.getElementById('textShadowColorInput'),
    textShadowOffsetXInput: document.getElementById('textShadowOffsetXInput'),
    textShadowOffsetYInput: document.getElementById('textShadowOffsetYInput'),
    textShadowBlurInput: document.getElementById('textShadowBlurInput'),
    clearTextShadowBtn: document.getElementById('clearTextShadowBtn'),

    brushColorInput: document.getElementById('brushColorInput'),
    brushSizeInput: document.getElementById('brushSizeInput'),
    toggleDrawModeBtn: document.getElementById('toggleDrawModeBtn'),
    clearDrawingBtn: document.getElementById('clearDrawingBtn'),

    downloadStripBtn: document.getElementById("downloadStripBtn"),
    downloadFormatSelect: document.getElementById('downloadFormatSelect'),
    printStripBtn: document.getElementById('printStripBtn'), // Kept for direct print
    
    // Removed: showQrCodeBtn, closeQrBtn, qrCodeOverlay, qrcodeCanvas

    retakeBtn: document.getElementById("retakeBtn"),
    // Removed: newSessionBtn

    noPhotosMessage: document.getElementById('noPhotosMessage'),
    downloadSpinner: document.getElementById('downloadSpinner'),
};

// --- Global Application State Variables ---
const appState = {
    capturedPhotosBase64: [],
    preloadedCapturedImages: [],

    stickers: [],
    texts: [],
    drawings: [],

    currentStripConfig: null,
    selectedDraggable: null,
    currentFrameImg: null,

    isDragging: false,
    dragType: null,

    initialMouseX: 0,
    initialMouseY: 0,
    initialObjX: 0,
    initialObjY: 0,
    initialObjWidth: 0,
    initialObjHeight: 0,
    initialObjAngle: 0,

    isDrawMode: false,
    lastDrawX: 0,
    lastDrawY: 0,
};

// --- Utility Functions ---
function logAnalytics(eventName, details = {}) {
    console.log(`ANALYTICS: ${eventName} -`, { timestamp: new Date().toISOString(), ...details });
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });
}

async function preloadCapturedPhotos() {
    appState.preloadedCapturedImages = [];
    const promises = appState.capturedPhotosBase64.map(src => loadImage(src));
    try {
        appState.preloadedCapturedImages = await Promise.all(promises);
        logAnalytics("Captured_Photos_Preloaded", { count: appState.preloadedCapturedImages.length });
    } catch (error) {
        console.error("Error preloading captured images:", error);
        logAnalytics("Captured_Photos_Preload_Failed", { error: error.message });
    }
}

function getEventCoordinates(event) {
    const rect = DOMElements.photoCanvas.getBoundingClientRect();
    const canvasActualWidth = DOMElements.photoCanvas.width;
    const canvasActualHeight = DOMElements.photoCanvas.height;
    const scaleX = canvasActualWidth / rect.width;
    const scaleY = canvasActualHeight / rect.height;

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

function isPointInRotatedRect(px, py, obj) {
    if (obj.angle === 0) {
        return px >= obj.x && px <= obj.x + obj.width &&
               py >= obj.y && py <= obj.y + obj.height;
    }

    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;
    const translatedPx = px - centerX;
    const translatedPy = py - centerY;

    const cosAngle = Math.cos(-obj.angle);
    const sinAngle = Math.sin(-obj.angle);

    const rotatedPx = translatedPx * cosAngle - translatedPy * sinAngle;
    const rotatedPy = translatedPx * sinAngle + translatedPy * cosAngle;

    return rotatedPx >= -obj.width / 2 && rotatedPx <= obj.width / 2 &&
           rotatedPy >= -obj.height / 2 && rotatedPy <= obj.height / 2;
}

function checkHandleClick(px, py, obj) {
    const handleSize = 12;
    const halfHandleSize = handleSize / 2;

    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;

    const translatedPx = px - centerX;
    const translatedPy = py - centerY;

    const cosAngle = Math.cos(-obj.angle);
    const sinAngle = Math.sin(-obj.angle);

    const rotatedPx = translatedPx * cosAngle - translatedPy * sinAngle;
    const rotatedPy = translatedPx * sinAngle + translatedPy * cosAngle;

    const localPx = rotatedPx + obj.width / 2;
    const localPy = rotatedPy + obj.height / 2;

    const handles = {
        'resize-tl': { x: -halfHandleSize, y: -halfHandleSize, width: handleSize, height: handleSize },
        'resize-tr': { x: obj.width - halfHandleSize, y: -halfHandleSize, width: handleSize, height: handleSize },
        'resize-bl': { x: -halfHandleSize, y: obj.height - halfHandleSize, width: handleSize, height: handleSize },
        'resize-br': { x: obj.width - halfHandleSize, y: obj.height - halfHandleSize, width: handleSize, height: handleSize },
        'rotate': { x: obj.width / 2 - halfHandleSize, y: -20 - halfHandleSize, width: handleSize, height: handleSize }
    };

    for (const type in handles) {
        const hRect = handles[type];
        if (localPx >= hRect.x && localPx <= hRect.x + hRect.width &&
            localPy >= hRect.y && localPy <= hRect.y + hRect.height) {
            return type;
        }
    }
    return null;
}


// Removed: startNewSession function

// --- UI Feedback & State Update Functions ---

function displayCanvasMessage(mainMsg, type = 'info', subMsg = '') {
    DOMElements.noPhotosMessage.style.display = 'block';
    DOMElements.photoCanvas.style.display = 'none';
    DOMElements.downloadSpinner.classList.add('hidden-spinner');
    DOMElements.noPhotosMessage.className = `info-message ${type}`;

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
}

function hideCanvasMessage() {
    DOMElements.noPhotosMessage.style.display = 'none';
    if (DOMElements.downloadSpinner.classList.contains('hidden-spinner')) {
        DOMElements.photoCanvas.style.display = 'block';
    }
}

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

function populateFrameOptions(frames) {
    DOMElements.frameSelect.innerHTML = '';
    if (frames && frames.length > 0) {
        frames.forEach(frame => {
            const option = document.createElement('option');
            option.value = frame.src;
            option.textContent = frame.name;
            DOMElements.frameSelect.appendChild(option);
        });
        DOMElements.frameSelect.disabled = false;
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

// **Revised:** Update all text-related controls and remove button enabled state
function updateTextControlsFromSelection() {
    const isTextSelected = appState.selectedDraggable && appState.selectedDraggable.type === 'text';
    const textObj = isTextSelected ? appState.selectedDraggable : DEFAULT_TEXT_SETTINGS;

    DOMElements.textInput.value = isTextSelected ? textObj.content : '';
    DOMElements.textColorInput.value = textObj.color;
    DOMElements.textFontSelect.value = textObj.font;
    DOMElements.textSizeInput.value = textObj.size;
    DOMElements.textAlignSelect.value = textObj.align;

    DOMElements.textBoldBtn.classList.toggle('active', isTextSelected && textObj.isBold);
    DOMElements.textItalicBtn.classList.toggle('active', isTextSelected && textObj.isItalic);
    DOMElements.textUnderlineBtn.classList.toggle('active', isTextSelected && textObj.isUnderline);

    DOMElements.textOutlineColorInput.value = textObj.outlineColor;
    DOMElements.textOutlineWidthInput.value = textObj.outlineWidth;
    DOMElements.textShadowColorInput.value = textObj.shadowColor;
    DOMElements.textShadowOffsetXInput.value = textObj.shadowOffsetX;
    DOMElements.textShadowOffsetYInput.value = textObj.shadowOffsetY;
    DOMElements.textShadowBlurInput.value = textObj.shadowBlur;

    // Enable/disable all controls based on whether a text object is selected
    const textControls = [
        DOMElements.textInput, DOMElements.textColorInput, DOMElements.textFontSelect, DOMElements.textSizeInput,
        DOMElements.textAlignSelect, DOMElements.textBoldBtn, DOMElements.textItalicBtn, DOMElements.textUnderlineBtn,
        DOMElements.textOutlineColorInput, DOMElements.textOutlineWidthInput, DOMElements.clearTextOutlineBtn,
        DOMElements.textShadowColorInput, DOMElements.textShadowOffsetXInput, DOMElements.textShadowOffsetYInput,
        DOMElements.textShadowBlurInput, DOMElements.clearTextShadowBtn
    ];
    textControls.forEach(control => {
        if (control) control.disabled = !isTextSelected;
    });

    // Explicitly manage remove button state
    DOMElements.removeTextBtn.disabled = !isTextSelected;
}

// **Revised:** Update sticker remove button enabled state
function updateStickerControlsFromSelection() {
    DOMElements.removeStickerBtn.disabled = !(appState.selectedDraggable && appState.selectedDraggable.type === 'sticker');
}

function updateCanvasCursor(cursorType) {
    if (appState.isDrawMode && cursorType !== 'draw-mode' && cursorType !== 'default') {
        DOMElements.canvasContainer.classList.add('draw-mode');
        return;
    }
    DOMElements.canvasContainer.classList.remove(
        'resize-ns', 'resize-ew', 'resize-nwse', 'resize-nesw',
        'rotate', 'grab', 'grabbing', 'draw-mode'
    );
    if (cursorType && cursorType !== 'default') {
        DOMElements.canvasContainer.classList.add(cursorType);
    }
}


// --- Canvas Drawing Functions ---

async function renderCanvas() {
    DOMElements.ctx.clearRect(0, 0, DOMElements.photoCanvas.width, DOMElements.photoCanvas.height);

    if (appState.currentStripConfig && appState.currentStripConfig.defaultBackground) {
        DOMElements.ctx.fillStyle = appState.currentStripConfig.defaultBackground;
        DOMElements.ctx.fillRect(0, 0, DOMElements.photoCanvas.width, DOMElements.photoCanvas.height);
    }

    await drawFrameOnCanvas(DOMElements.ctx);
    drawPhotosOnCanvas(DOMElements.ctx);
    drawDraggableObjectsOnCanvas(DOMElements.ctx, appState.stickers);
    drawDraggableObjectsOnCanvas(DOMElements.ctx, appState.texts);
    drawDrawingsOnCanvas(DOMElements.ctx, appState.drawings);

    if (appState.selectedDraggable && !appState.isDrawMode) {
        drawSelectionHandles(DOMElements.ctx, appState.selectedDraggable);
    }
}

async function drawFrameOnCanvas(targetCtx) {
    if (DOMElements.frameSelect.value) {
        try {
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
        targetCtx.fillStyle = appState.currentStripConfig.defaultBackground || '#CCCCCC';
        targetCtx.fillRect(0, 0, DOMElements.photoCanvas.width, DOMElements.photoCanvas.height);
    }
}

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
            console.warn(`Preloaded image ${i} not ready. Attempting to load on demand.`);
            const imgSrc = appState.capturedPhotosBase64[i];
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

function drawDraggableObjectsOnCanvas(targetCtx, objects) {
    objects.forEach(obj => {
        targetCtx.save();

        const centerX = obj.x + obj.width / 2;
        const centerY = obj.y + obj.height / 2;
        targetCtx.translate(centerX, centerY);
        targetCtx.rotate(obj.angle);
        targetCtx.translate(-centerX, -centerY);

        if (obj.type === 'sticker') {
            const imgToDraw = obj.img || (() => {
                const img = new Image();
                img.src = obj.src;
                obj.img = img;
                return img;
            })();

            if (imgToDraw.complete) {
                targetCtx.drawImage(imgToDraw, obj.x, obj.y, obj.width, obj.height);
            } else {
                imgToDraw.onload = () => renderCanvas();
            }
        } else if (obj.type === 'text') {
            let fontStyle = '';
            if (obj.isItalic) fontStyle += 'italic ';
            if (obj.isBold) fontStyle += 'bold ';

            targetCtx.font = `${fontStyle}${obj.size}px ${obj.font}`;
            targetCtx.textAlign = obj.align;
            targetCtx.textBaseline = 'middle';

            const textMetrics = targetCtx.measureText(obj.content);
            obj.width = textMetrics.width;
            obj.height = obj.size;

            let textDrawX = obj.x;
            if (obj.align === 'center') {
                textDrawX = obj.x + obj.width / 2;
            } else if (obj.align === 'right') {
                textDrawX = obj.x + obj.width;
            }

            // Draw text outline
            if (obj.outlineWidth > 0 && obj.outlineColor) {
                targetCtx.strokeStyle = obj.outlineColor;
                targetCtx.lineWidth = obj.outlineWidth;
                targetCtx.strokeText(obj.content, textDrawX, obj.y + obj.height / 2);
            }

            // Apply text shadow
            if (obj.shadowColor && (obj.shadowOffsetX !== 0 || obj.shadowOffsetY !== 0 || obj.shadowBlur > 0)) {
                targetCtx.shadowColor = obj.shadowColor;
                targetCtx.shadowOffsetX = obj.shadowOffsetX;
                targetCtx.shadowOffsetY = obj.shadowOffsetY;
                targetCtx.shadowBlur = obj.shadowBlur;
            } else {
                targetCtx.shadowColor = 'rgba(0,0,0,0)';
                targetCtx.shadowBlur = 0;
                targetCtx.shadowOffsetX = 0;
                targetCtx.shadowOffsetY = 0;
            }

            targetCtx.fillStyle = obj.color;
            targetCtx.fillText(obj.content, textDrawX, obj.y + obj.height / 2);

            // Draw underline
            if (obj.isUnderline) {
                targetCtx.shadowColor = 'rgba(0,0,0,0)'; // Temporarily clear shadow for underline
                targetCtx.shadowBlur = 0;
                targetCtx.shadowOffsetX = 0;
                targetCtx.shadowOffsetY = 0;

                const underlineHeight = obj.size / 15;
                const underlineY = obj.y + obj.height / 2 + obj.size / 2 - underlineHeight / 2;

                let underlineStartX = obj.x;
                if (obj.align === 'center') {
                    underlineStartX = textDrawX - textMetrics.width / 2;
                } else if (obj.align === 'right') {
                    underlineStartX = textDrawX - textMetrics.width;
                }
                
                targetCtx.beginPath();
                targetCtx.strokeStyle = obj.color;
                targetCtx.lineWidth = underlineHeight;
                targetCtx.moveTo(underlineStartX, underlineY);
                targetCtx.lineTo(underlineStartX + textMetrics.width, underlineY);
                targetCtx.stroke();
            }
        }
        targetCtx.restore();
    });
}

function drawDrawingsOnCanvas(targetCtx, drawingsData) {
    drawingsData.forEach(drawing => {
        targetCtx.beginPath();
        targetCtx.strokeStyle = drawing.color;
        targetCtx.lineWidth = drawing.size;
        targetCtx.lineCap = 'round';
        targetCtx.lineJoin = 'round';

        if (drawing.points.length > 0) {
            targetCtx.moveTo(drawing.points[0].x, drawing.points[0].y);
            for (let i = 1; i < drawing.points.length; i++) {
                targetCtx.lineTo(drawing.points[i].x, drawing.points[i].y);
            }
        }
        targetCtx.stroke();
    });
}

function drawSelectionHandles(targetCtx, obj) {
    targetCtx.save();

    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;
    targetCtx.translate(centerX, centerY);
    targetCtx.rotate(obj.angle);
    targetCtx.translate(-centerX, -centerY);

    targetCtx.strokeStyle = '#00FFFF';
    targetCtx.lineWidth = 2;
    targetCtx.setLineDash([5, 5]);
    targetCtx.strokeRect(obj.x, obj.y, obj.width, obj.height);
    targetCtx.setLineDash([]);

    const handleSize = 12;
    const halfHandleSize = handleSize / 2;

    targetCtx.fillStyle = 'white';
    targetCtx.strokeStyle = 'black';
    targetCtx.lineWidth = 1;

    targetCtx.fillRect(obj.x - halfHandleSize, obj.y - halfHandleSize, handleSize, handleSize);
    targetCtx.strokeRect(obj.x - halfHandleSize, obj.y - halfHandleSize, handleSize, handleSize);
    targetCtx.fillRect(obj.x + obj.width - halfHandleSize, obj.y - halfHandleSize, handleSize, handleSize);
    targetCtx.strokeRect(obj.x + obj.width - halfHandleSize, obj.y - halfHandleSize, handleSize, handleSize);
    targetCtx.fillRect(obj.x - halfHandleSize, obj.y + obj.height - halfHandleSize, handleSize, handleSize);
    targetCtx.strokeRect(obj.x - halfHandleSize, obj.y + obj.height - halfHandleSize, handleSize, handleSize);
    targetCtx.fillRect(obj.x + obj.width - halfHandleSize, obj.y + obj.height - halfHandleSize, handleSize, handleSize);
    targetCtx.strokeRect(obj.x + obj.width - halfHandleSize, obj.y + obj.height - halfHandleSize, handleSize, handleSize);

    const rotateHandleX = obj.x + obj.width / 2;
    const rotateHandleY = obj.y - 20;
    targetCtx.beginPath();
    targetCtx.arc(rotateHandleX, rotateHandleY, halfHandleSize, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.stroke();

    targetCtx.beginPath();
    targetCtx.moveTo(obj.x + obj.width / 2, obj.y);
    targetCtx.lineTo(rotateHandleX, rotateHandleY + halfHandleSize);
    targetCtx.stroke();

    targetCtx.restore();
}


// --- Draggable Object Management ---

async function addSticker(stickerSrc) {
    if (!stickerSrc) {
        alert("Please select a sticker first.");
        return;
    }

    try {
        const img = await loadImage(stickerSrc);
        const initialWidth = 100;
        const initialHeight = (img.naturalHeight / img.naturalWidth) * initialWidth;
        const newSticker = {
            id: Date.now(),
            img: img,
            src: stickerSrc,
            x: (DOMElements.photoCanvas.width / 2) - (initialWidth / 2),
            y: (DOMElements.photoCanvas.height / 2) - (initialHeight / 2),
            width: initialWidth,
            height: initialHeight,
            originalWidth: img.naturalWidth,
            originalHeight: img.naturalHeight,
            angle: 0,
            type: 'sticker'
        };
        appState.stickers.push(newSticker);
        appState.selectedDraggable = newSticker;
        renderCanvas();
        updateStickerControlsFromSelection(); // Update UI
        logAnalytics('Sticker_Added', { src: stickerSrc });
    }
    catch (error) {
        console.error("Failed to add sticker:", error);
        alert("Error loading sticker image. Please ensure the file exists in the 'assets' folder.");
        logAnalytics('Sticker_Add_Failed', { src: stickerSrc, error: error.message });
    }
}

function removeSelectedSticker() {
    if (appState.selectedDraggable && appState.selectedDraggable.type === 'sticker') {
        appState.stickers = appState.stickers.filter(s => s !== appState.selectedDraggable);
        appState.selectedDraggable = null;
        renderCanvas();
        updateStickerControlsFromSelection();
        logAnalytics('Sticker_Removed');
    } else {
        alert("No sticker selected to remove. Click on a sticker on the canvas first to select it.");
    }
}

function addText() {
    const textContent = DOMElements.textInput.value.trim();
    if (!textContent) {
        alert("Please enter some text to add.");
        return;
    }

    DOMElements.ctx.font = `${DOMElements.textBoldBtn.classList.contains('active') ? 'bold ' : ''}` +
                         `${DOMElements.textItalicBtn.classList.contains('active') ? 'italic ' : ''}` +
                         `${parseInt(DOMElements.textSizeInput.value)}px ${DOMElements.textFontSelect.value}`;
    const textMetrics = DOMElements.ctx.measureText(textContent);
    const textWidth = textMetrics.width;
    const textHeight = parseInt(DOMElements.textSizeInput.value);

    const newTextObj = {
        id: Date.now() + 1,
        content: textContent,
        x: (DOMElements.photoCanvas.width / 2) - (textWidth / 2),
        y: (DOMElements.photoCanvas.height / 2) - (textHeight / 2),
        color: DOMElements.textColorInput.value,
        font: DOMElements.textFontSelect.value,
        size: textHeight,
        align: DOMElements.textAlignSelect.value,
        isBold: DOMElements.textBoldBtn.classList.contains('active'),
        isItalic: DOMElements.textItalicBtn.classList.contains('active'),
        isUnderline: DOMElements.textUnderlineBtn.classList.contains('active'),
        width: textWidth,
        height: textHeight,
        originalSize: textHeight,
        angle: 0,
        type: 'text',
        outlineColor: DOMElements.textOutlineColorInput.value,
        outlineWidth: parseInt(DOMElements.textOutlineWidthInput.value) || 0,
        shadowColor: DOMElements.textShadowColorInput.value,
        shadowOffsetX: parseInt(DOMElements.textShadowOffsetXInput.value) || 0,
        shadowOffsetY: parseInt(DOMElements.textShadowOffsetYInput.value) || 0,
        shadowBlur: parseInt(DOMElements.textShadowBlurInput.value) || 0,
    };

    appState.texts.push(newTextObj);
    DOMElements.textInput.value = "";
    appState.selectedDraggable = newTextObj;
    renderCanvas();
    updateTextControlsFromSelection();
    logAnalytics('Text_Added', { content: textContent });
}

function removeSelectedText() {
    if (appState.selectedDraggable && appState.selectedDraggable.type === 'text') {
        appState.texts = appState.texts.filter(t => t !== appState.selectedDraggable);
        appState.selectedDraggable = null;
        renderCanvas();
        updateTextControlsFromSelection();
        logAnalytics('Text_Removed');
    } else {
        alert("No text selected to remove. Click on a text element on the canvas first to select it.");
    }
}

function toggleDrawMode() {
    appState.isDrawMode = !appState.isDrawMode;
    if (appState.isDrawMode) {
        updateCanvasCursor('draw-mode');
        DOMElements.toggleDrawModeBtn.classList.add('active');
        appState.selectedDraggable = null;
        updateTextControlsFromSelection();
        updateStickerControlsFromSelection();
        logAnalytics('Draw_Mode_Enabled');
    } else {
        updateCanvasCursor('default');
        DOMElements.toggleDrawModeBtn.classList.remove('active');
        logAnalytics('Draw_Mode_Disabled');
    }
    renderCanvas();
}

function clearAllDrawings() {
    if (confirm('Are you sure you want to clear all drawings? This cannot be undone.')) {
        appState.drawings = [];
        renderCanvas();
        logAnalytics('All_Drawings_Cleared');
    }
}


// --- Canvas Interaction Logic (Mouse & Touch) ---
function handleCanvasPointerDown(e) {
    e.preventDefault();
    const { x, y } = getEventCoordinates(e);

    if (appState.isDrawMode) {
        appState.isDragging = true;
        appState.lastDrawX = x;
        appState.lastDrawY = y;
        appState.drawings.push({
            color: DOMElements.brushColorInput.value,
            size: parseInt(DOMElements.brushSizeInput.value),
            points: [{ x, y }]
        });
        logAnalytics('Drawing_Started');
    } else {
        if (appState.selectedDraggable) {
            appState.dragType = checkHandleClick(x, y, appState.selectedDraggable);
            if (appState.dragType) {
                appState.isDragging = true;
                appState.initialMouseX = x;
                appState.initialMouseY = y;
                appState.initialObjX = appState.selectedDraggable.x;
                appState.initialObjY = appState.selectedDraggable.y;
                appState.initialObjWidth = appState.selectedDraggable.width;
                appState.initialObjHeight = appState.selectedDraggable.height;
                appState.initialObjAngle = appState.selectedDraggable.angle;
                logAnalytics('Draggable_Handle_Clicked', { type: appState.dragType });
                return;
            }
        }

        const allDraggables = [...appState.stickers, ...appState.texts].slice().reverse();
        let clickedOnDraggable = false;
        for (const obj of allDraggables) {
            if (isPointInRotatedRect(x, y, obj)) {
                appState.selectedDraggable = obj;
                appState.isDragging = true;
                appState.dragType = 'drag';
                appState.dragOffsetX = x - obj.x;
                appState.dragOffsetY = y - obj.y;

                if (obj.type === 'sticker') {
                    appState.stickers = appState.stickers.filter(s => s !== obj);
                    appState.stickers.push(obj);
                } else if (obj.type === 'text') {
                    appState.texts = appState.texts.filter(t => t !== obj);
                    appState.texts.push(obj);
                }
                clickedOnDraggable = true;
                logAnalytics('Draggable_Selected_And_Dragged', { type: obj.type, id: obj.id });
                break;
            }
        }

        if (!clickedOnDraggable) {
            appState.selectedDraggable = null;
            appState.dragType = null;
            logAnalytics('Canvas_Clicked_Deselected_Object');
        }
    }
    renderCanvas();
    // Update UI for selection state
    updateTextControlsFromSelection();
    updateStickerControlsFromSelection();
}

function handleCanvasPointerMove(e) {
    const { x, y } = getEventCoordinates(e);

    if (appState.isDrawMode && appState.isDragging) {
        const lastDrawing = appState.drawings[appState.drawings.length - 1];
        if (lastDrawing) {
            lastDrawing.points.push({ x, y });
            renderCanvas();
            appState.lastDrawX = x;
            appState.lastDrawY = y;
        }
        return;
    }

    if (!appState.isDragging && !appState.isDrawMode) {
        updateCanvasCursor('default');
        if (appState.selectedDraggable) {
            const handleType = checkHandleClick(x, y, appState.selectedDraggable);
            if (handleType) {
                if (handleType.startsWith('resize')) {
                    updateCanvasCursor(handleType === 'resize-tl' || handleType === 'resize-br' ? 'resize-nwse' : 'resize-nesw');
                } else if (handleType === 'rotate') {
                    updateCanvasCursor('rotate');
                }
            } else if (isPointInRotatedRect(x, y, appState.selectedDraggable)) {
                updateCanvasCursor('grab');
            }
        }
    }

    if (!appState.isDragging || !appState.selectedDraggable) return;

    e.preventDefault();
    updateCanvasCursor('grabbing');

    const obj = appState.selectedDraggable;

    if (appState.dragType === 'drag') {
        obj.x = x - appState.dragOffsetX;
        obj.y = y - appState.dragOffsetY;
        logAnalytics('Draggable_Dragging', { type: obj.type, id: obj.id });
    } else if (appState.dragType.startsWith('resize')) {
        const initialCenterX = appState.initialObjX + appState.initialObjWidth / 2;
        const initialCenterY = appState.initialObjY + appState.initialObjHeight / 2;

        const currentMouseXTranslated = x - initialCenterX;
        const currentMouseYTranslated = y - initialCenterY;

        const cosInitialAngle = Math.cos(-appState.initialObjAngle);
        const sinInitialAngle = Math.sin(-appState.initialObjAngle);

        const rotatedMouseX = currentMouseXTranslated * cosInitialAngle - currentMouseYTranslated * sinInitialAngle;
        const rotatedMouseY = currentMouseXTranslated * sinInitialAngle + currentMouseYTranslated * cosInitialAngle;

        let newWidth = appState.initialObjWidth;
        let newHeight = appState.initialObjHeight;
        let newX = appState.initialObjX;
        let newY = appState.initialObjY;

        let dx_rotated = rotatedMouseX - ((appState.initialMouseX - initialCenterX) * cosInitialAngle - (appState.initialMouseY - initialCenterY) * sinInitialAngle);
        let dy_rotated = rotatedMouseY - ((appState.initialMouseX - initialCenterX) * sinInitialAngle + (appState.initialMouseY - initialCenterY) * cosInitialAngle);

        switch (appState.dragType) {
            case 'resize-br':
                newWidth = appState.initialObjWidth + dx_rotated;
                newHeight = appState.initialObjHeight + dy_rotated;
                break;
            case 'resize-tl':
                newWidth = appState.initialObjWidth - dx_rotated;
                newHeight = appState.initialObjHeight - dy_rotated;
                newX = appState.initialObjX + dx_rotated * Math.cos(appState.initialObjAngle) - dy_rotated * Math.sin(appState.initialObjAngle);
                newY = appState.initialObjY + dy_rotated * Math.cos(appState.initialObjAngle) + dx_rotated * Math.sin(appState.initialObjAngle);
                break;
            case 'resize-tr':
                newWidth = appState.initialObjWidth + dx_rotated;
                newHeight = appState.initialObjHeight - dy_rotated;
                newY = appState.initialObjY + dy_rotated * Math.cos(appState.initialObjAngle) + dx_rotated * Math.sin(appState.initialObjAngle);
                break;
            case 'resize-bl':
                newWidth = appState.initialObjWidth - dx_rotated;
                newHeight = appState.initialObjHeight + dy_rotated;
                newX = appState.initialObjX + dx_rotated * Math.cos(appState.initialObjAngle) - dy_rotated * Math.sin(appState.initialObjAngle);
                break;
        }

        if (obj.type === 'sticker' && obj.originalWidth && obj.originalHeight) {
            const aspectRatio = obj.originalWidth / obj.originalHeight;
            
            if (Math.abs(newWidth - appState.initialObjWidth) > Math.abs(newHeight - appState.initialObjHeight)) {
                newHeight = newWidth / aspectRatio;
            } else {
                newWidth = newHeight * aspectRatio;
            }

            const newCenterX = initialCenterX + (newWidth - appState.initialObjWidth) / 2 * Math.cos(appState.initialObjAngle) - (newHeight - appState.initialObjHeight) / 2 * Math.sin(appState.initialObjAngle);
            const newCenterY = initialCenterY + (newWidth - appState.initialObjWidth) / 2 * Math.sin(appState.initialObjAngle) + (newHeight - appState.initialObjHeight) / 2 * Math.cos(appState.initialObjAngle);

            newX = newCenterX - newWidth / 2;
            newY = newCenterY - newHeight / 2;
        }
        
        newWidth = Math.max(10, newWidth);
        newHeight = Math.max(10, newHeight);

        obj.width = newWidth;
        obj.height = newHeight;
        obj.x = newX;
        obj.y = newY;

        if (obj.type === 'text') {
            const newTextSize = (obj.originalSize || appState.initialObjHeight) * (newHeight / appState.initialObjHeight);
            obj.size = Math.max(10, Math.round(newTextSize));
            updateTextControlsFromSelection();
        }
        logAnalytics('Draggable_Resizing', { type: obj.type, id: obj.id, width: obj.width, height: obj.height });

    } else if (appState.dragType === 'rotate') {
        const obj = appState.selectedDraggable;
        const centerX = appState.initialObjX + appState.initialObjWidth / 2;
        const centerY = appState.initialObjY + appState.initialObjHeight / 2;

        const initialVectorX = appState.initialMouseX - centerX;
        const initialVectorY = appState.initialMouseY - centerY;

        const currentVectorX = x - centerX;
        const currentVectorY = y - centerY;

        const initialAngle = Math.atan2(initialVectorY, initialVectorX);
        const currentAngle = Math.atan2(currentVectorY, currentVectorX);

        const angleDelta = currentAngle - initialAngle;
        obj.angle = appState.initialObjAngle + angleDelta;
        logAnalytics('Draggable_Rotating', { type: obj.type, id: obj.id, angle: obj.angle });
    }
    renderCanvas();
}

function handleCanvasPointerUp(e) {
    if (appState.isDragging && appState.isDrawMode) {
        logAnalytics('Drawing_Ended');
    } else if (appState.isDragging && appState.selectedDraggable) {
        logAnalytics('Draggable_Interaction_Ended', { type: appState.dragType, id: appState.selectedDraggable.id });
    }
    appState.isDragging = false;
    appState.dragType = null;
    if (!appState.isDrawMode) {
        updateCanvasCursor('default');
    }
    renderCanvas();
}

function handleTouchStart(e) {
    if (e.touches.length === 1) {
        e.preventDefault();
        const touch = e.touches[0];
        handleCanvasPointerDown({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} });
    }
}

function handleTouchMove(e) {
    if (e.touches.length === 1 && appState.isDragging) {
        e.preventDefault();
        const touch = e.touches[0];
        handleCanvasPointerMove({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} });
    }
}

function handleTouchEnd(e) {
    handleCanvasPointerUp(e);
}


// --- Editing Tool Event Handlers (UI controls) ---
function updateSelectedTextProperty(property, value) {
    if (appState.selectedDraggable && appState.selectedDraggable.type === 'text') {
        appState.selectedDraggable[property] = value;

        if (property === 'content' || property === 'font' || property === 'size' || property === 'isBold' || property === 'isItalic') {
            DOMElements.ctx.font = `${appState.selectedDraggable.isBold ? 'bold ' : ''}${appState.selectedDraggable.isItalic ? 'italic ' : ''}${appState.selectedDraggable.size}px ${appState.selectedDraggable.font}`;
            appState.selectedDraggable.width = DOMElements.ctx.measureText(appState.selectedDraggable.content).width;
            appState.selectedDraggable.height = appState.selectedDraggable.size;
        }
        renderCanvas();
        logAnalytics('Text_Property_Updated', { property: property, value: value });
    }
}


// --- Download, Print Logic ---

async function createFinalStripCanvas() {
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = DOMElements.photoCanvas.width;
    finalCanvas.height = DOMElements.photoCanvas.height;
    const finalCtx = finalCanvas.getContext('2d');

    const tempSelected = appState.selectedDraggable;
    appState.selectedDraggable = null;

    if (appState.currentStripConfig && appState.currentStripConfig.defaultBackground) {
        finalCtx.fillStyle = appState.currentStripConfig.defaultBackground;
        finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    }

    await drawFrameOnCanvas(finalCtx);

    const numPhotosToDisplay = appState.capturedPhotosBase64.length;
    const framesToUse = appState.currentStripConfig ? appState.currentStripConfig.frames : [];
    for (let i = 0; i < Math.min(numPhotosToDisplay, framesToUse.length); i++) {
        const frame = framesToUse[i];
        if (!frame) continue;
        const img = appState.preloadedCapturedImages[i];
        if (img && img.complete) {
            finalCtx.drawImage(img, frame.x, frame.y, frame.width, frame.height);
        } else {
            try {
                const loadedImg = await loadImage(appState.capturedPhotosBase64[i]);
                finalCtx.drawImage(loadedImg, frame.x, frame.y, frame.width, frame.height);
            } catch (error) {
                console.error(`ERROR: Failed to draw photo ${i + 1} on final composite:`, error);
            }
        }
    }

    drawDraggableObjectsOnCanvas(finalCtx, appState.stickers);
    drawDraggableObjectsOnCanvas(finalCtx, appState.texts);
    drawDrawingsOnCanvas(finalCtx, appState.drawings);

    appState.selectedDraggable = tempSelected;
    renderCanvas();

    return finalCanvas;
}

async function downloadStrip() {
    if (appState.capturedPhotosBase64.length === 0) {
        alert('No photos found. Please capture photos first to download a strip.');
        return;
    }

    toggleDownloadSpinner(true);
    logAnalytics('Download_Started');

    try {
        const finalCanvas = await createFinalStripCanvas();
        const format = DOMElements.downloadFormatSelect.value.split(';');
        const mimeType = format[0];
        const quality = format.length > 1 ? parseFloat(format[1]) : 1.0;

        const dataURL = finalCanvas.toDataURL(mimeType, quality);
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `odz_photobooth_strip_${Date.now()}.${mimeType.split('/')[1].split(';')[0]}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        logAnalytics('Download_Successful', { format: mimeType, quality: quality });
    } catch (error) {
        console.error('Error during strip download:', error);
        alert('Failed to download photo strip. See console for details.');
        logAnalytics('Download_Failed', { error: error.message });
    } finally {
        toggleDownloadSpinner(false);
    }
}

// Removed: showQrCode function and its dependencies


async function printStrip() {
    if (appState.capturedPhotosBase64.length === 0) {
        alert('No photos found. Please capture photos first.');
        return;
    }

    toggleDownloadSpinner(true);
    logAnalytics('Print_Request_Started');

    try {
        const finalCanvas = await createFinalStripCanvas();
        const dataURL = finalCanvas.toDataURL('image/png');

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Print window was blocked. Please allow pop-ups for this site to print.');
            logAnalytics('Print_Request_Failed', { reason: 'Pop-up blocked' });
            return;
        }

        printWindow.document.write('<html><head><title>Print Photo Strip</title>');
        printWindow.document.write('<style>');
        printWindow.document.write(`
            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            img { max-width: 100%; max-height: 95vh; display: block; margin: 0 auto; }
            @page { margin: 0; size: auto; }
        `);
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(`<img src="${dataURL}" alt="Photo Strip for Printing">`);
        printWindow.document.close();

        printWindow.onload = function() {
            printWindow.focus();
            printWindow.print();
            logAnalytics('Print_Dialog_Opened');
        };
    } catch (error) {
        console.error("Error preparing strip for printing:", error);
        alert("Failed to prepare photo strip for printing. See console for details.");
        logAnalytics('Print_Request_Failed', { error: error.message });
    } finally {
        toggleDownloadSpinner(false);
    }
}

function retakePhotos() {
    localStorage.removeItem('capturedPhotos');
    window.location.href = 'layout-selection/layout-selection.html';
}


// --- Event Listeners ---

function setupEventListeners() {
    // Canvas interaction events
    DOMElements.photoCanvas.addEventListener('mousedown', handleCanvasPointerDown);
    DOMElements.photoCanvas.addEventListener('mousemove', handleCanvasPointerMove);
    DOMElements.photoCanvas.addEventListener('mouseup', handleCanvasPointerUp);
    DOMElements.photoCanvas.addEventListener('mouseout', handleCanvasPointerUp);

    DOMElements.photoCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    DOMElements.photoCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    DOMElements.photoCanvas.addEventListener('touchend', handleTouchEnd);
    DOMElements.photoCanvas.addEventListener('touchcancel', handleTouchEnd);

    // Frame selection
    DOMElements.frameSelect.addEventListener('change', async () => {
        try {
            appState.currentFrameImg = await loadImage(DOMElements.frameSelect.value);
            renderCanvas();
            logAnalytics('Frame_Changed', { newFrame: DOMElements.frameSelect.value });
        } catch (error) {
            console.error("Failed to load selected frame:", error);
            alert("Could not load selected frame. Using default background.");
            appState.currentFrameImg = null;
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

    // Text Outline/Shadow Event Listeners
    DOMElements.textOutlineColorInput.addEventListener('input', () => updateSelectedTextProperty('outlineColor', DOMElements.textOutlineColorInput.value));
    DOMElements.textOutlineWidthInput.addEventListener('input', () => updateSelectedTextProperty('outlineWidth', parseInt(DOMElements.textOutlineWidthInput.value) || 0));
    DOMElements.clearTextOutlineBtn.addEventListener('click', () => {
        DOMElements.textOutlineColorInput.value = DEFAULT_TEXT_SETTINGS.outlineColor;
        DOMElements.textOutlineWidthInput.value = DEFAULT_TEXT_SETTINGS.outlineWidth;
        updateSelectedTextProperty('outlineColor', DEFAULT_TEXT_SETTINGS.outlineColor);
        updateSelectedTextProperty('outlineWidth', DEFAULT_TEXT_SETTINGS.outlineWidth);
    });

    DOMElements.textShadowColorInput.addEventListener('input', () => updateSelectedTextProperty('shadowColor', DOMElements.textShadowColorInput.value));
    DOMElements.textShadowOffsetXInput.addEventListener('input', () => updateSelectedTextProperty('shadowOffsetX', parseInt(DOMElements.textShadowOffsetXInput.value) || 0));
    DOMElements.textShadowOffsetYInput.addEventListener('input', () => updateSelectedTextProperty('shadowOffsetY', parseInt(DOMElements.textShadowOffsetYInput.value) || 0));
    DOMElements.textShadowBlurInput.addEventListener('input', () => updateSelectedTextProperty('shadowBlur', parseInt(DOMElements.textShadowBlurInput.value) || 0));
    DOMElements.clearTextShadowBtn.addEventListener('click', () => {
        DOMElements.textShadowColorInput.value = DEFAULT_TEXT_SETTINGS.shadowColor;
        DOMElements.textShadowOffsetXInput.value = DEFAULT_TEXT_SETTINGS.shadowOffsetX;
        DOMElements.textShadowOffsetYInput.value = DEFAULT_TEXT_SETTINGS.shadowOffsetY;
        DOMElements.textShadowBlurInput.value = DEFAULT_TEXT_SETTINGS.shadowBlur;
        updateSelectedTextProperty('shadowColor', DEFAULT_TEXT_SETTINGS.shadowColor);
        updateSelectedTextProperty('shadowOffsetX', DEFAULT_TEXT_SETTINGS.shadowOffsetX);
        updateSelectedTextProperty('shadowOffsetY', DEFAULT_TEXT_SETTINGS.shadowOffsetY);
        updateSelectedTextProperty('shadowBlur', DEFAULT_TEXT_SETTINGS.shadowBlur);
    });

    DOMElements.addTextBtn.addEventListener("click", addText);
    DOMElements.removeTextBtn.addEventListener("click", removeSelectedText);

    // Drawing tool controls
    DOMElements.toggleDrawModeBtn.addEventListener('click', toggleDrawMode);
    DOMElements.clearDrawingBtn.addEventListener('click', clearAllDrawings);

    // Download, Print buttons
    DOMElements.downloadStripBtn.addEventListener('click', downloadStrip);
    DOMElements.printStripBtn.addEventListener('click', printStrip);
    
    // Removed: DOMElements.showQrCodeBtn.addEventListener('click', showQrCode);
    // Removed: DOMElements.closeQrBtn.addEventListener('click', ...)

    // Navigation buttons
    DOMElements.retakeBtn.addEventListener('click', retakePhotos);
    // Removed: DOMElements.newSessionBtn.addEventListener('click', startNewSession);

    DOMElements.brushColorInput.addEventListener('input', () => {
        if (appState.isDrawMode && appState.drawings.length > 0) {
            const lastDrawing = appState.drawings[appState.drawings.length - 1];
            if (lastDrawing && lastDrawing.points.length <= 1) {
                lastDrawing.color = DOMElements.brushColorInput.value;
                renderCanvas();
            }
        }
    });
    DOMElements.brushSizeInput.addEventListener('input', () => {
        if (appState.isDrawMode && appState.drawings.length > 0) {
            const lastDrawing = appState.drawings[appState.drawings.length - 1];
            if (lastDrawing && lastDrawing.points.length <= 1) {
                lastDrawing.size = parseInt(DOMElements.brushSizeInput.value);
                renderCanvas();
            }
        }
    });
}

// --- Initialization ---

async function initializeEditorPage() {
    DOMElements.ctx = DOMElements.photoCanvas.getContext("2d");

    appState.capturedPhotosBase64 = JSON.parse(localStorage.getItem('capturedPhotos') || '[]');
    const selectedPhotoCountStr = localStorage.getItem('selectedPhotoCount');
    const selectedPhotoCount = parseInt(selectedPhotoCountStr, 10);

    const configKey = isNaN(selectedPhotoCount) || selectedPhotoCount < 1 || selectedPhotoCount > 6 || selectedPhotoCount === 5
        ? '3'
        : selectedPhotoCount.toString();
    appState.currentStripConfig = STRIP_LAYOUT_CONFIGS[configKey];

    if (appState.capturedPhotosBase64.length === 0 || !appState.currentStripConfig || typeof appState.currentStripConfig.stripWidth === 'undefined') {
        displayCanvasMessage(
            'No photos found or invalid layout.',
            'info',
            'Please go back to <a href="capture-page/capture-page.html">capture photos</a> first.'
        );
        // Disable all editing controls if no photos or invalid setup
        Object.values(DOMElements).forEach(el => {
            if (el && typeof el.disabled !== 'undefined') el.disabled = true;
        });
        DOMElements.retakeBtn.disabled = false;
        // Removed: DOMElements.newSessionBtn.disabled = false;
        logAnalytics('Editor_Page_Load_Failed', { reason: 'No photos or invalid config' });
        return;
    }

    DOMElements.photoCanvas.width = appState.currentStripConfig.stripWidth;
    DOMElements.photoCanvas.height = appState.currentStripConfig.stripHeight;

    await preloadCapturedPhotos();
    populateFrameOptions(appState.currentStripConfig.availableFrames);

    if (DOMElements.frameSelect.value) {
        try {
            appState.currentFrameImg = await loadImage(DOMElements.frameSelect.value);
        } catch (error) {
            console.error("Failed to preload initial frame:", error);
        }
    }

    // Set initial values for text and drawing controls
    DOMElements.textColorInput.value = DEFAULT_TEXT_SETTINGS.color;
    DOMElements.textFontSelect.value = DEFAULT_TEXT_SETTINGS.font;
    DOMElements.textSizeInput.value = DEFAULT_TEXT_SETTINGS.size;
    DOMElements.textAlignSelect.value = DEFAULT_TEXT_SETTINGS.align; // Ensure this is set
    DOMElements.textOutlineColorInput.value = DEFAULT_TEXT_SETTINGS.outlineColor;
    DOMElements.textOutlineWidthInput.value = DEFAULT_TEXT_SETTINGS.outlineWidth;
    DOMElements.textShadowColorInput.value = DEFAULT_TEXT_SETTINGS.shadowColor;
    DOMElements.textShadowOffsetXInput.value = DEFAULT_TEXT_SETTINGS.shadowOffsetX;
    DOMElements.textShadowOffsetYInput.value = DEFAULT_TEXT_SETTINGS.shadowOffsetY;
    DOMElements.textShadowBlurInput.value = DEFAULT_TEXT_SETTINGS.shadowBlur;
    DOMElements.brushColorInput.value = DEFAULT_DRAWING_SETTINGS.color;
    DOMElements.brushSizeInput.value = DEFAULT_DRAWING_SETTINGS.size;

    // Initially disable controls that depend on selection or specific modes
    updateTextControlsFromSelection(); // This will disable text controls initially
    updateStickerControlsFromSelection(); // This will disable remove sticker button initially
    DOMElements.toggleDrawModeBtn.classList.remove('active'); // Ensure draw button isn't active by default

    setupEventListeners();
    renderCanvas();
    logAnalytics('Editor_Page_Loaded_Successfully', { layout: configKey });
}

document.addEventListener('DOMContentLoaded', initializeEditorPage);
