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
    '1': {
        stripWidth: 400,
        stripHeight: 430, // 40 + 240 + 150
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
        stripHeight: 690, // 40 + (240 * 2) + 20 + 150
        frames: [
            { x: 40, y: 40, width: 320, height: 240 },
            { x: 40, y: 300, width: 320, height: 240 }
        ],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-2-photos-option1.png', name: 'Silver Grey' },
            { id: 'option2', src: 'assets/strip-frame-2-photos-option2.png', name: 'Classic White' },
            { id: 'option3', src: 'assets/strip-frame-2-photos-option3.png', name: 'Light Sky Blue' },
            { id: 'option4', src: 'assets/strip-frame-2-photos-option4.png', name: 'Off-White' },
            { id: 'option5', src: 'assets/strip-frame-2-photos-option5.png', name: 'Periwinkle' },
            { id: 'option6', src: 'assets/strip-frame-2-photos-option6.png', name: 'Blush Pink' }
        ]
    },
    '3': {
        stripWidth: 400,
        stripHeight: 850, // 40 + (220 * 3) + (20 * 2) + 150
        frames: [
            { x: 40, y: 40, width: 320, height: 220 },
            { x: 40, y: 280, width: 320, height: 220 },
            { x: 40, y: 520, width: 320, height: 220 }
        ],
        defaultBackground: '#CCCCCC',
        frameAspectRatio: 320 / 220,
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-3-photos-option1.png', name: 'Classic White' },
            { id: 'option2', src: 'assets/strip-frame-3-photos-option2.png', name: 'Periwinkle' },
            { id: 'option3', src: 'assets/strip-frame-3-photos-option3.png', name: 'Blush Pink' },
            { id: 'option4', src: 'assets/strip-frame-3-photos-option4.png', name: 'Silver Grey' },
            { id: 'option5', src: 'assets/strip-frame-3-photos-option5.png', name: 'Off-White' },
            { id: 'option6', src: 'assets/strip-frame-3-photos-option6.png', name: 'Light Sky Blue' }
        ]
    },
    '4': {
        stripWidth: 400,
        stripHeight: 1154, // 40 + (226 * 4) + (20 * 3) + 150
        frames: [
            { x: 40, y: 40, width: 320, height: 226 },
            { x: 40, y: 292, width: 320, height: 226 },
            { x: 40, y: 544, width: 320, height: 226 },
            { x: 40, y: 796, width: 320, height: 226 }
        ],
        defaultBackground: '#CCCCCC',
        frameAspectRatio: 320 / 226,
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-4-photos-option1.png', name: 'Blush Pink' },
            { id: 'option2', src: 'assets/strip-frame-4-photos-option2.png', name: 'Classic White' },
            { id: 'option3', src: 'assets/strip-frame-4-photos-option3.png', name: 'Light Sky Blue' },
            { id: 'option4', src: 'assets/strip-frame-4-photos-option4.png', name: 'Off-White' },
            { id: 'option5', src: 'assets/strip-frame-4-photos-option5.png', name: 'Silver Grey' },
            { id: 'option6', src: 'assets/strip-frame-4-photos-option6.png', name: 'Periwinkle' }
        ]
    },
    '6': {
        stripWidth: 760,
        stripHeight: 850, // 40 + (220 * 3) + (20 * 2) + 150
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
            { id: 'option1', src: 'assets/strip-frame-6-photos-option1.png', name: 'Light Sky Blue' },
            { id: 'option2', src: 'assets/strip-frame-6-photos-option2.png', name: 'Classic White' },
            { id: 'option3', src: 'assets/strip-frame-6-photos-option3.png', name: 'Off-White' },
            { id: 'option4', src: 'assets/strip-frame-6-photos-option4.png', name: 'Silver Grey' },
            { id: 'option5', src: 'assets/strip-frame-6-photos-option5.png', name: 'Blush Pink' },
            { id: 'option6', src: 'assets/strip-frame-6-photos-option6.png', name: 'Periwinkle' }
        ]
    }
};

const DEFAULT_TEXT_SETTINGS = {
    color: '#333333', font: "'Poppins', sans-serif", size: 30, align: 'center',
    isBold: false, isItalic: false, isUnderline: false
};

const DEFAULT_DRAWING_SETTINGS = { color: '#FF0000', size: 5 };

const DOMElements = {
    photoCanvas: document.getElementById("photoCanvas"),
    ctx: null,
    canvasContainer: document.getElementById('canvasContainer'),
    frameSelect: document.getElementById("frameSelect"),
    titleSelect: document.getElementById("titleSelect"),
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

const appState = {
    capturedPhotosBase64: [],
    preloadedCapturedImages: [],
    stickers: [],
    texts: [],
    drawings: [],
    currentStripConfig: null,
    selectedDraggable: null,
    currentFrameImg: null,
    selectedTitle: '',
    isDragging: false,
    dragType: null,
    initialMouseX: 0, initialMouseY: 0,
    initialObjX: 0, initialObjY: 0,
    initialObjWidth: 0, initialObjHeight: 0,
    initialObjAngle: 0,
    isDrawMode: false,
    lastDrawX: 0, lastDrawY: 0,
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
    try {
        const promises = appState.capturedPhotosBase64.map(src => loadImage(src));
        appState.preloadedCapturedImages = await Promise.all(promises);
        logAnalytics("Captured_Photos_Preloaded", { count: appState.preloadedCapturedImages.length });
    } catch (error) {
        console.error("Error preloading captured images:", error);
        logAnalytics("Captured_Photos_Preload_Failed", { error: error.message });
    }
}

function getEventCoordinates(event) {
    const rect = DOMElements.photoCanvas.getBoundingClientRect();
    const scaleX = DOMElements.photoCanvas.width / rect.width;
    const scaleY = DOMElements.photoCanvas.height / rect.height;
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
}

function isPointInRotatedRect(px, py, obj) {
    if (obj.angle === 0) {
        return px >= obj.x && px <= obj.x + obj.width && py >= obj.y && py <= obj.y + obj.height;
    }
    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;
    const cosAngle = Math.cos(-obj.angle);
    const sinAngle = Math.sin(-obj.angle);
    const rotatedPx = (px - centerX) * cosAngle - (py - centerY) * sinAngle;
    const rotatedPy = (px - centerX) * sinAngle + (py - centerY) * cosAngle;
    return Math.abs(rotatedPx) <= obj.width / 2 && Math.abs(rotatedPy) <= obj.height / 2;
}

function checkHandleClick(px, py, obj) {
    const handleSize = 30;
    const halfHandleSize = handleSize / 2;
    const rotateHandleOffset = 30;
    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;
    const cosAngle = Math.cos(-obj.angle);
    const sinAngle = Math.sin(-obj.angle);
    const rotatedPx = (px - centerX) * cosAngle - (py - centerY) * sinAngle;
    const rotatedPy = (px - centerX) * sinAngle + (py - centerY) * cosAngle;
    const localPx = rotatedPx + obj.width / 2;
    const localPy = rotatedPy + obj.height / 2;

    const handles = {
        'resize-tl': { x: -halfHandleSize, y: -halfHandleSize, w: handleSize, h: handleSize },
        'resize-tr': { x: obj.width - halfHandleSize, y: -halfHandleSize, w: handleSize, h: handleSize },
        'resize-bl': { x: -halfHandleSize, y: obj.height - halfHandleSize, w: handleSize, h: handleSize },
        'resize-br': { x: obj.width - halfHandleSize, y: obj.height - halfHandleSize, w: handleSize, h: handleSize },
        'rotate': { x: obj.width / 2 - halfHandleSize, y: -rotateHandleOffset - halfHandleSize, w: handleSize, h: handleSize }
    };

    for (const type in handles) {
        const h = handles[type];
        if (localPx >= h.x && localPx <= h.x + h.w && localPy >= h.y && localPy <= h.y + h.h) {
            return type;
        }
    }
    return null;
}

// --- UI Feedback & State Update Functions ---

function displayCanvasMessage(mainMsg, type = 'info', subMsg = '') {
    DOMElements.noPhotosMessage.style.display = 'block';
    DOMElements.photoCanvas.style.display = 'none';
    DOMElements.downloadSpinner.classList.add('hidden-spinner');
    DOMElements.noPhotosMessage.className = `info-message ${type}`;
    DOMElements.noPhotosMessage.innerHTML = `<p>${mainMsg}</p><p class="sub-message">${subMsg}</p>`;
}

function hideCanvasMessage() {
    DOMElements.noPhotosMessage.style.display = 'none';
    if (DOMElements.downloadSpinner.classList.contains('hidden-spinner')) {
        DOMElements.photoCanvas.style.display = 'block';
    }
}

function toggleDownloadSpinner(show) {
    DOMElements.downloadSpinner.classList.toggle('hidden-spinner', !show);
    DOMElements.photoCanvas.style.display = show ? 'none' : 'block';
    DOMElements.noPhotosMessage.style.display = 'none';
}

function populateFrameOptions(frames) {
    DOMElements.frameSelect.innerHTML = '';
    if (frames?.length) {
        frames.forEach(frame => {
            const option = new Option(frame.name, frame.src);
            DOMElements.frameSelect.add(option);
        });
        DOMElements.frameSelect.disabled = false;
        DOMElements.frameSelect.value = frames[0].src;
    } else {
        DOMElements.frameSelect.add(new Option('No frames available', ''));
        DOMElements.frameSelect.disabled = true;
    }
}

function updateEditorUI() {
    const isTextSelected = appState.selectedDraggable?.type === 'text';
    const isStickerSelected = appState.selectedDraggable?.type === 'sticker';
    const textObj = isTextSelected ? appState.selectedDraggable : DEFAULT_TEXT_SETTINGS;

    DOMElements.textInput.value = isTextSelected ? textObj.content : '';
    DOMElements.textColorInput.value = textObj.color;
    DOMElements.textFontSelect.value = textObj.font;
    DOMElements.textSizeInput.value = textObj.size;
    DOMElements.textAlignSelect.value = textObj.align;

    DOMElements.textBoldBtn.classList.toggle('active', isTextSelected && textObj.isBold);
    DOMElements.textItalicBtn.classList.toggle('active', isTextSelected && textObj.isItalic);
    DOMElements.textUnderlineBtn.classList.toggle('active', isTextSelected && textObj.isUnderline);

    [
        DOMElements.textColorInput, DOMElements.textFontSelect, DOMElements.textSizeInput,
        DOMElements.textAlignSelect, DOMElements.textBoldBtn, DOMElements.textItalicBtn, DOMElements.textUnderlineBtn
    ].forEach(control => control.disabled = !isTextSelected);

    DOMElements.removeTextBtn.disabled = !isTextSelected;
    DOMElements.removeStickerBtn.disabled = !isStickerSelected;
}

function updateCanvasCursor(cursorType) {
    const container = DOMElements.canvasContainer;
    if (appState.isDrawMode && !['draw-mode', 'default'].includes(cursorType)) {
        container.className = 'canvas-container draw-mode';
        return;
    }
    container.className = 'canvas-container'; // Reset
    if (cursorType && cursorType !== 'default') {
        container.classList.add(cursorType);
    }
}

// --- Generic Canvas Rendering Engine ---

async function renderStripToContext(targetCtx, isFinalOutput = false) {
    const { width, height } = targetCtx.canvas;
    targetCtx.clearRect(0, 0, width, height);

    // 1. Draw Background
    if (appState.currentStripConfig) {
        targetCtx.fillStyle = appState.currentStripConfig.defaultBackground || '#CCCCCC';
        targetCtx.fillRect(0, 0, width, height);
    }

    // 2. Draw Frame
    if (appState.currentFrameImg) {
        targetCtx.drawImage(appState.currentFrameImg, 0, 0, width, height);
    }

    // 3. Draw Photos
    drawPhotosOnCanvas(targetCtx);

    // 4. Draw Decorations (Stickers, Text, Drawings)
    drawDraggableObjectsOnCanvas(targetCtx, appState.stickers);
    drawDraggableObjectsOnCanvas(targetCtx, appState.texts);
    drawDrawingsOnCanvas(targetCtx);

    // 5. Draw Static Overlays (Date, Title)
    drawDateOnCanvas(targetCtx);
    drawStripTitleToCanvas(targetCtx);

    // 6. Draw Selection Handles (only on main canvas, not for final output)
    if (!isFinalOutput && appState.selectedDraggable && !appState.isDrawMode) {
        drawSelectionHandles(targetCtx, appState.selectedDraggable);
    }
}

function drawPhotosOnCanvas(targetCtx) {
    const framesToUse = appState.currentStripConfig?.frames || [];
    appState.preloadedCapturedImages.forEach((img, i) => {
        const frame = framesToUse[i];
        if (frame && img?.complete) {
            targetCtx.drawImage(img, frame.x, frame.y, frame.width, frame.height);
        }
    });
}

function drawDraggableObjectsOnCanvas(targetCtx, objects) {
    objects.forEach(obj => {
        targetCtx.save();
        const centerX = obj.x + obj.width / 2;
        const centerY = obj.y + obj.height / 2;
        targetCtx.translate(centerX, centerY);
        targetCtx.rotate(obj.angle);
        targetCtx.translate(-centerX, -centerY);

        if (obj.type === 'sticker' && obj.img?.complete) {
            targetCtx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height);
        } else if (obj.type === 'text') {
            drawTextObject(targetCtx, obj);
        }
        targetCtx.restore();
    });
}

function drawTextObject(ctx, obj) {
    const fontStyle = `${obj.isItalic ? 'italic ' : ''}${obj.isBold ? 'bold ' : ''}`;
    ctx.font = `${fontStyle}${obj.size}px ${obj.font}`;
    ctx.textAlign = obj.align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = obj.color;

    const metrics = ctx.measureText(obj.content);
    obj.width = metrics.width;
    obj.height = obj.size;

    let textDrawX = obj.x;
    if (obj.align === 'center') textDrawX += obj.width / 2;
    else if (obj.align === 'right') textDrawX += obj.width;

    ctx.fillText(obj.content, textDrawX, obj.y + obj.height / 2);

    if (obj.isUnderline) {
        ctx.beginPath();
        ctx.strokeStyle = obj.color;
        ctx.lineWidth = Math.max(1, obj.size / 15);
        const underlineY = obj.y + obj.height;
        ctx.moveTo(obj.x, underlineY);
        ctx.lineTo(obj.x + obj.width, underlineY);
        ctx.stroke();
    }
}

function drawDrawingsOnCanvas(targetCtx) {
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';
    appState.drawings.forEach(drawing => {
        targetCtx.beginPath();
        targetCtx.strokeStyle = drawing.color;
        targetCtx.lineWidth = drawing.size;
        targetCtx.moveTo(drawing.points[0].x, drawing.points[0].y);
        for (let i = 1; i < drawing.points.length; i++) {
            targetCtx.lineTo(drawing.points[i].x, drawing.points[i].y);
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

    const handleSize = 30;
    const halfHandleSize = handleSize / 2;
    const rotateHandleOffset = 30;

    targetCtx.fillStyle = 'white';
    targetCtx.strokeStyle = 'black';
    targetCtx.lineWidth = 1;

    // Draw handles
    targetCtx.strokeRect(obj.x - halfHandleSize, obj.y - halfHandleSize, handleSize, handleSize); // TL
    targetCtx.strokeRect(obj.x + obj.width - halfHandleSize, obj.y - halfHandleSize, handleSize, handleSize); // TR
    targetCtx.strokeRect(obj.x - halfHandleSize, obj.y + obj.height - halfHandleSize, handleSize, handleSize); // BL
    targetCtx.strokeRect(obj.x + obj.width - halfHandleSize, obj.y + obj.height - halfHandleSize, handleSize, handleSize); // BR

    // Draw rotate handle
    const rotateHandleX = obj.x + obj.width / 2;
    const rotateHandleY = obj.y - rotateHandleOffset;
    targetCtx.beginPath();
    targetCtx.arc(rotateHandleX, rotateHandleY, halfHandleSize, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.stroke();

    targetCtx.restore();
}

function drawDateOnCanvas(targetCtx) {
    const dateString = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
    targetCtx.font = "21.3px 'Lato', sans-serif";
    targetCtx.fillStyle = '#333333';
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'bottom';
    targetCtx.fillText(dateString.replace(/-/g, '.'), targetCtx.canvas.width / 2, targetCtx.canvas.height - 15);
}

function drawStripTitleToCanvas(targetCtx) {
    if (!appState.selectedTitle) return;
    targetCtx.save();
    targetCtx.font = "35px 'Bebas Neue'";
    targetCtx.fillStyle = '#000000';
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';
    targetCtx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    targetCtx.shadowBlur = 4;
    targetCtx.shadowOffsetX = 1;
    targetCtx.shadowOffsetY = 1;
    targetCtx.fillText(appState.selectedTitle, targetCtx.canvas.width / 2, targetCtx.canvas.height - 85);
    targetCtx.restore();
}

// --- Draggable Object Management ---

async function addSticker(stickerSrc) {
    if (!stickerSrc) return alert("Please select a sticker first.");

    try {
        const img = await loadImage(stickerSrc);
        const initialWidth = 100;
        const initialHeight = (img.naturalHeight / img.naturalWidth) * initialWidth;
        const newSticker = {
            id: Date.now(),
            type: 'sticker',
            img,
            src: stickerSrc,
            x: (DOMElements.photoCanvas.width - initialWidth) / 2,
            y: (DOMElements.photoCanvas.height - initialHeight) / 2,
            width: initialWidth,
            height: initialHeight,
            originalWidth: img.naturalWidth,
            originalHeight: img.naturalHeight,
            angle: 0,
        };
        appState.stickers.push(newSticker);
        appState.selectedDraggable = newSticker;
        updateEditorUI();
        renderStripToContext(DOMElements.ctx);
        logAnalytics('Sticker_Added', { src: stickerSrc });
    } catch (error) {
        console.error("Failed to add sticker:", error);
        logAnalytics('Sticker_Add_Failed', { src: stickerSrc, error: error.message });
    }
}

function removeSelectedObject() {
    if (!appState.selectedDraggable) return;
    const { type, id } = appState.selectedDraggable;
    if (type === 'sticker') {
        appState.stickers = appState.stickers.filter(s => s.id !== id);
        logAnalytics('Sticker_Removed');
    } else if (type === 'text') {
        appState.texts = appState.texts.filter(t => t.id !== id);
        logAnalytics('Text_Removed');
    }
    appState.selectedDraggable = null;
    updateEditorUI();
    renderStripToContext(DOMElements.ctx);
}

function addText() {
    const content = DOMElements.textInput.value.trim();
    if (!content) return alert("Please enter some text to add.");

    const newText = {
        id: Date.now() + 1,
        type: 'text',
        content,
        color: DOMElements.textColorInput.value,
        font: DOMElements.textFontSelect.value,
        size: parseInt(DOMElements.textSizeInput.value, 10),
        align: DOMElements.textAlignSelect.value,
        isBold: DOMElements.textBoldBtn.classList.contains('active'),
        isItalic: DOMElements.textItalicBtn.classList.contains('active'),
        isUnderline: DOMElements.textUnderlineBtn.classList.contains('active'),
        angle: 0,
    };

    // Temporarily measure text to set initial position and dimensions
    drawTextObject(DOMElements.ctx, newText);
    newText.x = (DOMElements.photoCanvas.width - newText.width) / 2;
    newText.y = (DOMElements.photoCanvas.height - newText.height) / 2;
    newText.originalSize = newText.size;

    appState.texts.push(newText);
    DOMElements.textInput.value = "";
    appState.selectedDraggable = newText;
    updateEditorUI();
    renderStripToContext(DOMElements.ctx);
    logAnalytics('Text_Added', { content });
}

function toggleDrawMode() {
    appState.isDrawMode = !appState.isDrawMode;
    DOMElements.toggleDrawModeBtn.classList.toggle('active', appState.isDrawMode);
    if (appState.isDrawMode) {
        appState.selectedDraggable = null;
        updateCanvasCursor('draw-mode');
        logAnalytics('Draw_Mode_Enabled');
    } else {
        updateCanvasCursor('default');
        logAnalytics('Draw_Mode_Disabled');
    }
    updateEditorUI();
    renderStripToContext(DOMElements.ctx);
}

function clearAllDrawings() {
    if (confirm('Are you sure you want to clear all drawings?')) {
        appState.drawings = [];
        renderStripToContext(DOMElements.ctx);
        logAnalytics('All_Drawings_Cleared');
    }
}

// --- Canvas Interaction Logic ---

function handleCanvasPointerDown(e) {
    e.preventDefault();
    const { x, y } = getEventCoordinates(e);

    if (appState.isDrawMode) {
        appState.isDragging = true;
        appState.drawings.push({
            color: DOMElements.brushColorInput.value,
            size: parseInt(DOMElements.brushSizeInput.value, 10),
            points: [{ x, y }]
        });
        logAnalytics('Drawing_Started');
        return;
    }

    if (appState.selectedDraggable) {
        appState.dragType = checkHandleClick(x, y, appState.selectedDraggable);
        if (appState.dragType) {
            appState.isDragging = true;
            Object.assign(appState, {
                initialMouseX: x, initialMouseY: y,
                initialObjX: appState.selectedDraggable.x, initialObjY: appState.selectedDraggable.y,
                initialObjWidth: appState.selectedDraggable.width, initialObjHeight: appState.selectedDraggable.height,
                initialObjAngle: appState.selectedDraggable.angle
            });
            logAnalytics('Draggable_Handle_Clicked', { type: appState.dragType });
            return;
        }
    }

    const allDraggables = [...appState.stickers, ...appState.texts].slice().reverse();
    const clickedObject = allDraggables.find(obj => isPointInRotatedRect(x, y, obj));

    appState.selectedDraggable = clickedObject || null;

    if (clickedObject) {
        appState.isDragging = true;
        appState.dragType = 'drag';
        appState.dragOffsetX = x - clickedObject.x;
        appState.dragOffsetY = y - clickedObject.y;

        // Bring to top
        if (clickedObject.type === 'sticker') {
            appState.stickers = appState.stickers.filter(s => s !== clickedObject);
            appState.stickers.push(clickedObject);
        } else {
            appState.texts = appState.texts.filter(t => t !== clickedObject);
            appState.texts.push(clickedObject);
        }
        logAnalytics('Draggable_Selected', { type: clickedObject.type, id: clickedObject.id });
    }

    updateEditorUI();
    renderStripToContext(DOMElements.ctx);
}

function handleCanvasPointerMove(e) {
    if (!appState.isDragging) return; // Optimization
    e.preventDefault();
    const { x, y } = getEventCoordinates(e);

    if (appState.isDrawMode) {
        appState.drawings.at(-1).points.push({ x, y });
    } else if (appState.selectedDraggable) {
        const obj = appState.selectedDraggable;
        if (appState.dragType === 'drag') {
            obj.x = x - appState.dragOffsetX;
            obj.y = y - appState.dragOffsetY;
        } else if (appState.dragType?.startsWith('resize')) {
            // Complex resize logic - This part remains largely unchanged due to its complexity
            // but could be a candidate for further refactoring into smaller helpers.
            handleObjectResize(x, y, obj);
        } else if (appState.dragType === 'rotate') {
            handleObjectRotation(x, y, obj);
        }
    }
    renderStripToContext(DOMElements.ctx);
}

function handleObjectResize(mouseX, mouseY, obj) {
    // This logic is complex and kept similar for brevity.
    // Key idea: transform mouse coordinates into the object's un-rotated space
    // to calculate size changes, then apply them.
    const initialCenterX = appState.initialObjX + appState.initialObjWidth / 2;
    const initialCenterY = appState.initialObjY + appState.initialObjHeight / 2;

    const cos = Math.cos(-appState.initialObjAngle);
    const sin = Math.sin(-appState.initialObjAngle);

    const rotatedMouseX = (mouseX - initialCenterX) * cos - (mouseY - initialCenterY) * sin;
    const rotatedMouseY = (mouseX - initialCenterX) * sin + (mouseY - initialCenterY) * cos;

    const rotatedInitialMouseX = (appState.initialMouseX - initialCenterX) * cos - (appState.initialMouseY - initialCenterY) * sin;
    const rotatedInitialMouseY = (appState.initialMouseX - initialCenterX) * sin + (appState.initialMouseY - initialCenterY) * cos;
    
    const dx = rotatedMouseX - rotatedInitialMouseX;
    const dy = rotatedMouseY - rotatedInitialMouseY;

    let newWidth = appState.initialObjWidth;
    let newHeight = appState.initialObjHeight;

    if (appState.dragType.includes('r')) newWidth += dx;
    if (appState.dragType.includes('l')) newWidth -= dx;
    if (appState.dragType.includes('b')) newHeight += dy;
    if (appState.dragType.includes('t')) newHeight -= dy;

    // Maintain aspect ratio for stickers
    if (obj.type === 'sticker' && obj.originalWidth) {
        const aspectRatio = obj.originalWidth / obj.originalHeight;
        if (newWidth / appState.initialObjWidth > newHeight / appState.initialObjHeight) {
            newHeight = newWidth / aspectRatio;
        } else {
            newWidth = newHeight * aspectRatio;
        }
    }

    obj.width = Math.max(20, newWidth);
    obj.height = Math.max(20, newHeight);

    // Recalculate object's top-left (x, y) based on new center
    const deltaW = obj.width - appState.initialObjWidth;
    const deltaH = obj.height - appState.initialObjHeight;
    const cosA = Math.cos(appState.initialObjAngle);
    const sinA = Math.sin(appState.initialObjAngle);

    obj.x = appState.initialObjX - (deltaW / 2 * cosA - deltaH / 2 * sinA);
    obj.y = appState.initialObjY - (deltaW / 2 * sinA + deltaH / 2 * cosA);
    
    if (appState.dragType.includes('l')) obj.x += dx * cosA;
    if (appState.dragType.includes('t')) obj.x -= dy * sinA;
    if (appState.dragType.includes('l')) obj.y += dx * sinA;
    if (appState.dragType.includes('t')) obj.y += dy * cosA;


    if (obj.type === 'text') {
        obj.size = Math.max(10, (obj.originalSize || 30) * (obj.height / appState.initialObjHeight));
        updateEditorUI();
    }
}

function handleObjectRotation(mouseX, mouseY, obj) {
    const centerX = appState.initialObjX + appState.initialObjWidth / 2;
    const centerY = appState.initialObjY + appState.initialObjHeight / 2;
    const initialAngle = Math.atan2(appState.initialMouseY - centerY, appState.initialMouseX - centerX);
    const currentAngle = Math.atan2(mouseY - centerY, mouseX - centerX);
    obj.angle = appState.initialObjAngle + (currentAngle - initialAngle);
}


function handleCanvasPointerUp() {
    if (appState.isDragging) {
        logAnalytics('Interaction_Ended', { type: appState.isDrawMode ? 'draw' : appState.dragType });
    }
    appState.isDragging = false;
    appState.dragType = null;
    updateCanvasCursor(appState.isDrawMode ? 'draw-mode' : 'default');
    renderStripToContext(DOMElements.ctx);
}


// --- Editing Tool Event Handlers ---

function updateSelectedTextProperty(property, value) {
    if (appState.selectedDraggable?.type === 'text') {
        const textObj = appState.selectedDraggable;
        textObj[property] = value;
        // For size, ensure it's a number
        if (property === 'size') {
            textObj.size = parseInt(value, 10);
            textObj.originalSize = textObj.size; // Reset original size on manual change
        }
        renderStripToContext(DOMElements.ctx);
        logAnalytics('Text_Property_Updated', { property, value });
    }
}

// --- BUG FIX: Implement the missing handler ---
function handleTitleSelection(event) {
    appState.selectedTitle = event.target.value;
    renderStripToContext(DOMElements.ctx);
    logAnalytics('Title_Changed', { title: appState.selectedTitle });
}


// --- Download, Print, and Navigation Logic ---

async function createFinalStripCanvas() {
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = DOMElements.photoCanvas.width;
    finalCanvas.height = DOMElements.photoCanvas.height;
    await renderStripToContext(finalCanvas.getContext('2d'), true);
    return finalCanvas;
}

async function downloadStrip() {
    if (!appState.capturedPhotosBase64.length) return;
    toggleDownloadSpinner(true);
    logAnalytics('Download_Started');

    try {
        const finalCanvas = await createFinalStripCanvas();
        const [mimeType, quality] = DOMElements.downloadFormatSelect.value.split(';');
        const dataURL = finalCanvas.toDataURL(mimeType, quality ? parseFloat(quality) : 1.0);
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `odz_photobooth_strip_${Date.now()}.${mimeType.split('/')[1]}`;
        link.click();
        logAnalytics('Download_Successful', { format: mimeType });
    } catch (error) {
        console.error('Error during download:', error);
        logAnalytics('Download_Failed', { error: error.message });
    } finally {
        toggleDownloadSpinner(false);
    }
}

async function printStrip() {
    if (!appState.capturedPhotosBase64.length) return;
    toggleDownloadSpinner(true);
    logAnalytics('Print_Request_Started');

    try {
        const finalCanvas = await createFinalStripCanvas();
        const dataURL = finalCanvas.toDataURL('image/png');
        const printWindow = window.open('', '_blank');
        if (!printWindow) throw new Error('Popup blocked');

        printWindow.document.write(`
            <html><head><title>Print Strip</title><style>
                body { margin: 0; display: flex; justify-content: center; align-items: center; }
                img { max-width: 100%; max-height: 100vh; object-fit: contain; }
                @page { size: auto; margin: 0; }
            </style></head><body>
            <img src="${dataURL}" onload="window.focus(); window.print();">
            </body></html>
        `);
        printWindow.document.close();
        logAnalytics('Print_Dialog_Opened');
    } catch (error) {
        console.error("Error preparing for print:", error);
        alert('Print window may have been blocked. Please allow pop-ups.');
        logAnalytics('Print_Request_Failed', { error: error.message });
    } finally {
        toggleDownloadSpinner(false);
    }
}

function retakePhotos() {
    localStorage.removeItem('capturedPhotos');
    logAnalytics('Retake_Photos_Initiated');
    window.location.href = 'capture-page/capture-page.html';
}

// --- Event Listeners Setup ---

function setupEventListeners() {
    // Canvas Interaction
    const canvas = DOMElements.photoCanvas;
    canvas.addEventListener('mousedown', handleCanvasPointerDown);
    canvas.addEventListener('mousemove', handleCanvasPointerMove);
    canvas.addEventListener('mouseup', handleCanvasPointerUp);
    canvas.addEventListener('mouseout', handleCanvasPointerUp);
    canvas.addEventListener('touchstart', handleCanvasPointerDown, { passive: false });
    canvas.addEventListener('touchmove', handleCanvasPointerMove, { passive: false });
    canvas.addEventListener('touchend', handleCanvasPointerUp);

    // Controls
    DOMElements.frameSelect.addEventListener('change', async (e) => {
        try {
            appState.currentFrameImg = await loadImage(e.target.value);
            renderStripToContext(DOMElements.ctx);
            logAnalytics('Frame_Changed', { newFrame: e.target.value });
        } catch (error) {
            console.error("Failed to load selected frame:", error);
        }
    });

    DOMElements.titleSelect.addEventListener('change', handleTitleSelection);

    DOMElements.addStickerBtn.addEventListener("click", () => addSticker(DOMElements.stickerSelect.value));
    DOMElements.removeStickerBtn.addEventListener("click", removeSelectedObject);

    DOMElements.addTextBtn.addEventListener("click", addText);
    DOMElements.removeTextBtn.addEventListener("click", removeSelectedObject);
    DOMElements.textInput.addEventListener('input', (e) => updateSelectedTextProperty('content', e.target.value));
    DOMElements.textColorInput.addEventListener('input', (e) => updateSelectedTextProperty('color', e.target.value));
    DOMElements.textFontSelect.addEventListener('change', (e) => updateSelectedTextProperty('font', e.target.value));
    DOMElements.textSizeInput.addEventListener('input', (e) => updateSelectedTextProperty('size', e.target.value));
    DOMElements.textAlignSelect.addEventListener('change', (e) => updateSelectedTextProperty('align', e.target.value));

    ['Bold', 'Italic', 'Underline'].forEach(style => {
        const btn = DOMElements[`text${style}Btn`];
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            updateSelectedTextProperty(`is${style}`, btn.classList.contains('active'));
        });
    });

    DOMElements.toggleDrawModeBtn.addEventListener('click', toggleDrawMode);
    DOMElements.clearDrawingBtn.addEventListener('click', clearAllDrawings);

    DOMElements.downloadStripBtn.addEventListener('click', downloadStrip);
    DOMElements.printStripBtn.addEventListener('click', printStrip);
    DOMElements.retakeBtn.addEventListener('click', retakePhotos);
}

// --- Initialization ---

async function initializeEditorPage() {
    DOMElements.ctx = DOMElements.photoCanvas.getContext("2d");
    appState.capturedPhotosBase64 = JSON.parse(localStorage.getItem('capturedPhotos') || '[]');
    const photoCount = appState.capturedPhotosBase64.length;

    if (photoCount === 0) {
        displayCanvasMessage('No photos found.', 'error', 'Please go back to <a href="capture-page/capture-page.html">capture photos</a> first.');
        // Disable all controls except retake
        Object.values(DOMElements).forEach(el => {
            if (el?.nodeName === 'BUTTON' || el?.nodeName === 'SELECT') el.disabled = true;
        });
        DOMElements.retakeBtn.disabled = false;
        logAnalytics('Editor_Load_Failed', { reason: 'No photos' });
        return;
    }

    const configKey = String(photoCount);
    appState.currentStripConfig = STRIP_LAYOUT_CONFIGS[configKey];
    if (!appState.currentStripConfig) {
        // Fallback for unsupported photo counts (e.g., 5)
        displayCanvasMessage('Invalid photo count for layout.', 'error');
        return;
    }

    DOMElements.photoCanvas.width = appState.currentStripConfig.stripWidth;
    DOMElements.photoCanvas.height = appState.currentStripConfig.stripHeight;

    await preloadCapturedPhotos();
    populateFrameOptions(appState.currentStripConfig.availableFrames);
    if (DOMElements.frameSelect.value) {
        appState.currentFrameImg = await loadImage(DOMElements.frameSelect.value);
    }
    appState.selectedTitle = DOMElements.titleSelect.value;
    
    // Set initial tool settings
    DOMElements.textColorInput.value = DEFAULT_TEXT_SETTINGS.color;
    DOMElements.brushColorInput.value = DEFAULT_DRAWING_SETTINGS.color;
    DOMElements.brushSizeInput.value = DEFAULT_DRAWING_SETTINGS.size;

    setupEventListeners();
    updateEditorUI();
    renderStripToContext(DOMElements.ctx);
    logAnalytics('Editor_Page_Loaded', { layout: configKey });
}

document.addEventListener('DOMContentLoaded', initializeEditorPage);
