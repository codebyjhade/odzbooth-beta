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
        stripHeight: 40 + 240 + 20 + 240 + 150, // topPadding + photoHeight1 + gap + photoHeight2 + bottomSpaceForLogo
        frames: [
            { x: 40, y: 40, width: 320, height: 240 },
            { x: 40, y: 40 + 240 + 20, width: 320, height: 240 }
        ],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-2-photos-option1.png', name: 'Original Two' },
            { id: 'option2', src: 'assets/strip-frame-2-photos-option2.png', name: 'Clean White' },
            { id: 'option3', src: 'assets/strip-frame-2-photos-option3.png', name: 'Styled Border' }
        ]
    },
    // Configuration for a 3-photo strip
    '3': {
        stripWidth: 400,
        stripHeight: 40 + 220 + 20 + 220 + 20 + 220 + 150, // topPadding + 3*photoHeight + 2*gap + bottomSpaceForLogo
        frames: [
            { x: 40, y: 40, width: 320, height: 220 },
            { x: 40, y: 40 + 220 + 20, width: 320, height: 220 },
            { x: 40, y: 40 + 220 + 20 + 220 + 20, width: 320, height: 220 }
        ],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-3-photos-option1.png', name: 'Original Three' },
            { id: 'option2', src: 'assets/strip-frame-3-photos-option2.png', name: 'Clean White' },
            { id: 'option3', src: 'assets/strip-frame-3-photos-option3.png', name: 'Styled Border' }
        ]
    },
    // Configuration for a 4-photo strip
    '4': {
        stripWidth: 400,
        stripHeight: 40 + 226 + 20 + 226 + 20 + 226 + 20 + 226 + 150, // topPadding + 4*photoHeight + 3*gap + bottomSpaceForLogo
        frames: [
            { x: 40, y: 40, width: 320, height: 226 },
            { x: 40, y: 40 + 226 + 20, width: 320, height: 226 },
            { x: 40, y: 40 + 226 + 20 + 226 + 20, width: 320, height: 226 },
            { x: 40, y: 40 + 226 + 20 + 226 + 20 + 226 + 20, width: 320, height: 226 }
        ],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-4-photos.png', name: 'Original Four' },
            { id: 'option2', src: 'assets/strip-frame-4-photos-option2.png', name: 'Clean White' },
            { id: 'option3', src: 'assets/strip-frame-4-photos-option3.png', name: 'Styled Border' }
        ]
    },
    // Configuration for a 6-photo strip (2 columns of 3 photos)
    '6': {
        stripWidth: 700, // Wider for two columns
        stripHeight: 40 + 220 + 20 + 220 + 20 + 220 + 150, // topPadding + 3*photoHeight + 2*gap + bottomSpaceForLogo (same height as 3-photo for vertical arrangement)
        frames: [
            // Column 1
            { x: 40, y: 40, width: 280, height: 200 }, // Adjusted width/height for 2 columns
            { x: 40, y: 40 + 200 + 20, width: 280, height: 200 },
            { x: 40, y: 40 + 200 + 20 + 200 + 20, width: 280, height: 200 },
            // Column 2
            { x: 40 + 280 + 20, y: 40, width: 280, height: 200 }, // 20px gap between columns
            { x: 40 + 280 + 20, y: 40 + 200 + 20, width: 280, height: 200 },
            { x: 40 + 280 + 20, y: 40 + 200 + 20 + 200 + 20, width: 280, height: 200 }
        ],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-6-photos-option1.png', name: 'Original Six' },
            { id: 'option2', src: 'assets/strip-frame-6-photos-option2.png', name: 'Clean White' },
            { id: 'option3', src: 'assets/strip-frame-6-photos-option3.png', name: 'Styled Border' }
        ]
    }
};

// Default settings for text and drawing tools
const DEFAULT_TEXT_SETTINGS = {
    fontFamily: 'Poppins',
    size: 32,
    color: '#000000',
    align: 'center',
    bold: false,
    italic: false,
    outline: false,
    shadow: false,
    rotation: 0,
    x: 0, // Will be calculated based on canvas/photo
    y: 0, // Will be calculated based on canvas/photo
};

const DEFAULT_DRAWING_SETTINGS = {
    color: '#FF0000',
    size: 10,
};

// Available stickers
const STICKERS = [
    { id: 'star', src: 'assets/sticker-star.png', name: 'Star', defaultSize: 80 },
    { id: 'heart', src: 'assets/sticker-heart.png', name: 'Heart', defaultSize: 80 },
    { id: 'sunglasses', src: 'assets/sticker-sunglasses.png', name: 'Sunglasses', defaultSize: 100 },
    { id: 'hat', src: 'assets/sticker-hat.png', name: 'Party Hat', defaultSize: 120 },
    { id: 'speech-bubble', src: 'assets/sticker-speech-bubble.png', name: 'Speech Bubble', defaultSize: 150 },
    { id: 'mustache', src: 'assets/sticker-mustache.png', name: 'Mustache', defaultSize: 80 },
    { id: 'crown', src: 'assets/sticker-crown.png', name: 'Crown', defaultSize: 100 },
    { id: 'flower', src: 'assets/sticker-flower.png', name: 'Flower', defaultSize: 70 },
    { id: 'arrow', src: 'assets/sticker-arrow.png', name: 'Arrow', defaultSize: 90 },
    { id: 'lightning', src: 'assets/sticker-lightning.png', name: 'Lightning', defaultSize: 80 },
];


// --- Global State Variables ---
let currentStripConfig = null;
let capturedPhotos = []; // Stores base64 image data
let textElements = []; // Stores text objects { text, x, y, settings, rotation, selected }
let selectedTextIndex = -1; // Index of the currently selected text element
let stickers = []; // Stores sticker objects { image, x, y, size, rotation, selected }
let selectedStickerIndex = -1; // Index of the currently selected sticker
let drawingMode = false;
let lastX = 0;
let lastY = 0;
let isDrawing = false;
let drawings = []; // Stores drawing paths [{x, y, color, size, newPath: true/false}]

// --- DOM Element References (Declared globally) ---
const DOMElements = {
    canvas: null,
    ctx: null,
    downloadStripBtn: null,
    printStripBtn: null,
    retakeBtn: null,
    // Text controls
    addTextBtn: null,
    textInput: null,
    removeTextBtn: null,
    fontFamilySelect: null,
    fontSizeInput: null,
    textColorInput: null,
    textAlignSelect: null,
    textBoldToggle: null,
    textItalicToggle: null,
    textOutlineToggle: null,
    textShadowToggle: null,
    textRotateSlider: null,
    // Sticker controls
    stickerSelect: null,
    addStickerBtn: null,
    removeStickerBtn: null,
    stickerSizeSlider: null,
    stickerRotateSlider: null,
    // Drawing controls
    toggleDrawModeBtn: null,
    brushColorInput: null,
    brushSizeInput: null,
    clearDrawingsBtn: null,
    // Other
    downloadFormatSelect: null,
    framesSelect: null,
    backgroundColorInput: null,
    stripTitleInput: null,
    stripSubtitleInput: null,
    stripLogoInput: null,
    toggleLogoVisibilityBtn: null,
    logoPreview: null,
};


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
    //     'event_category': 'Editor Engagement',
    //     'event_label': eventName,
    //     ...details
    // });
}

/**
 * Helper to get query parameters from the URL.
 * @param {string} name - The name of the query parameter.
 * @returns {string|null} The value of the query parameter or null if not found.
 */
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

/**
 * Loads an image and returns a Promise that resolves with the Image object.
 * @param {string} src - The source URL of the image.
 * @returns {Promise<HTMLImageElement>} A promise that resolves with the loaded Image object.
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
 * Converts a base64 string to an Image object.
 * @param {string} base64String - The base64 encoded image data.
 * @returns {Promise<HTMLImageElement>} A promise that resolves with the loaded Image object.
 */
async function base64ToImage(base64String) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = base64String;
    });
}

/**
 * Downloads the current canvas content as an image.
 * @param {string} format - The image format (e.g., 'image/png', 'image/jpeg;0.9').
 */
function downloadStrip(format) {
    const quality = format.includes('jpeg') ? parseFloat(format.split(';')[1]) : 1.0;
    const mimeType = format.split(';')[0];
    const dataURL = DOMElements.canvas.toDataURL(mimeType, quality);
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `ODZ_Booth_Strip_${Date.now()}.${mimeType.split('/')[1]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    logAnalytics('Photo_Strip_Downloaded', { format: mimeType });
}

/**
 * Initiates the print process for the canvas content.
 */
function printStrip() {
    const dataURL = DOMElements.canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print ODZ Booth Strip</title>
            <style>
                @page { size: auto; margin: 0mm; }
                body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #eee; }
                img { max-width: 100%; max-height: 95vh; display: block; margin: auto; }
            </style>
        </head>
        <body>
            <img src="${dataURL}" onload="window.print();window.onafterprint=function(){window.close()};" />
        </body>
        </html>
    `);
    printWindow.document.close();
    // The actual print event is handled by the onload in the new window
    logAnalytics('Photo_Strip_Printed');
}


// --- Core Logic Functions ---

/**
 * Renders the entire photo strip on the canvas, including photos, frames, text, stickers, and drawings.
 */
async function renderCanvas() {
    DOMElements.ctx.clearRect(0, 0, DOMElements.canvas.width, DOMElements.canvas.height);

    // Draw background color if selected
    if (DOMElements.backgroundColorInput && DOMElements.backgroundColorInput.value) {
        DOMElements.ctx.fillStyle = DOMElements.backgroundColorInput.value;
        DOMElements.ctx.fillRect(0, 0, DOMElements.canvas.width, DOMElements.canvas.height);
    } else {
        DOMElements.ctx.fillStyle = currentStripConfig.defaultBackground;
        DOMElements.ctx.fillRect(0, 0, DOMElements.canvas.width, DOMElements.canvas.height);
    }


    // Load the selected frame image first
    let frameImage = null;
    const selectedFrameId = DOMElements.framesSelect ? DOMElements.framesSelect.value : 'option1'; // Default to option1
    const frameData = currentStripConfig.availableFrames.find(f => f.id === selectedFrameId);
    if (frameData) {
        try {
            frameImage = await loadImage(frameData.src);
            // Draw the frame image across the entire strip canvas
            DOMElements.ctx.drawImage(frameImage, 0, 0, DOMElements.canvas.width, DOMElements.canvas.height);
        } catch (error) {
            console.error('Error loading frame image:', error);
            // Fallback: draw a basic border if frame image fails to load
            DOMElements.ctx.strokeStyle = 'black';
            DOMElements.ctx.lineWidth = 5;
            DOMElements.ctx.strokeRect(0, 0, DOMElements.canvas.width, DOMElements.canvas.height);
        }
    }


    // Draw captured photos within their frames
    for (let i = 0; i < capturedPhotos.length && i < currentStripConfig.frames.length; i++) {
        const photoDataUrl = capturedPhotos[i];
        const frame = currentStripConfig.frames[i];

        if (photoDataUrl) {
            try {
                const img = await base64ToImage(photoDataUrl);

                // Calculate aspect ratios
                const imgAspectRatio = img.width / img.height;
                const frameAspectRatio = frame.width / frame.height;

                let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
                let dx = frame.x, dy = frame.y, dWidth = frame.width, dHeight = frame.height;

                // Center and crop/fit image within the frame while maintaining aspect ratio
                if (imgAspectRatio > frameAspectRatio) {
                    // Image is wider than frame, crop width
                    sWidth = img.height * frameAspectRatio;
                    sx = (img.width - sWidth) / 2;
                } else {
                    // Image is taller than frame, crop height
                    sHeight = img.width / frameAspectRatio;
                    sy = (img.height - sHeight) / 2;
                }
                DOMElements.ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

            } catch (error) {
                console.error('Error drawing captured photo:', error);
                // Draw a placeholder if image fails to load
                DOMElements.ctx.fillStyle = '#EEE';
                DOMElements.ctx.fillRect(frame.x, frame.y, frame.width, frame.height);
                DOMElements.ctx.font = '20px Poppins';
                DOMElements.ctx.fillStyle = '#AAA';
                DOMElements.ctx.textAlign = 'center';
                DOMElements.ctx.fillText('Image Error', frame.x + frame.width / 2, frame.y + frame.height / 2);
            }
        }
    }


    // Draw drawings first, so text and stickers appear on top
    drawings.forEach(draw => {
        DOMElements.ctx.strokeStyle = draw.color;
        DOMElements.ctx.lineWidth = draw.size;
        DOMElements.ctx.lineCap = 'round';
        DOMElements.ctx.lineJoin = 'round';

        if (draw.newPath) {
            DOMElements.ctx.beginPath();
            DOMElements.ctx.moveTo(draw.x, draw.y);
        } else {
            DOMElements.ctx.lineTo(draw.x, draw.y);
            DOMElements.ctx.stroke();
        }
    });


    // Draw text elements
    textElements.forEach((textEl, index) => {
        DOMElements.ctx.save(); // Save context state before applying transformations
        DOMElements.ctx.font = `${textEl.settings.bold ? 'bold ' : ''}${textEl.settings.italic ? 'italic ' : ''}${textEl.settings.size}px ${textEl.settings.fontFamily}`;
        DOMElements.ctx.fillStyle = textEl.settings.color;
        DOMElements.ctx.textAlign = textEl.settings.align;
        DOMElements.ctx.textBaseline = 'top'; // Align text from the top

        let textX = textEl.x;
        let textY = textEl.y;

        // Apply rotation around the text element's center
        const textMetrics = DOMElements.ctx.measureText(textEl.text);
        const textWidth = textMetrics.width;
        const textHeight = textEl.settings.size; // Approximation for height

        const centerX = textX + (textWidth / 2);
        const centerY = textY + (textHeight / 2);

        DOMElements.ctx.translate(centerX, centerY);
        DOMElements.ctx.rotate(textEl.rotation * Math.PI / 180);
        DOMElements.ctx.translate(-centerX, -centerY);


        if (textEl.settings.shadow) {
            DOMElements.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            DOMElements.ctx.shadowBlur = 5;
            DOMElements.ctx.shadowOffsetX = 3;
            DOMElements.ctx.shadowOffsetY = 3;
        } else {
            DOMElements.ctx.shadowColor = 'transparent'; // Reset shadow
            DOMElements.ctx.shadowBlur = 0;
            DOMElements.ctx.shadowOffsetX = 0;
            DOMElements.ctx.shadowOffsetY = 0;
        }

        DOMElements.ctx.fillText(textEl.text, textX, textY);

        if (textEl.settings.outline) {
            DOMElements.ctx.strokeStyle = '#FFFFFF'; // White outline
            DOMElements.ctx.lineWidth = 1;
            DOMElements.ctx.strokeText(textEl.text, textX, textY);
        }

        // Draw selection border if selected
        if (index === selectedTextIndex) {
            DOMElements.ctx.strokeStyle = 'var(--accent-color)';
            DOMElements.ctx.lineWidth = 2;
            const padding = 5;
            const bounds = {
                x: textX,
                y: textY,
                width: textWidth,
                height: textHeight,
            };
            DOMElements.ctx.strokeRect(bounds.x - padding, bounds.y - padding, bounds.width + padding * 2, bounds.height + padding * 2);
        }
        DOMElements.ctx.restore(); // Restore context state
    });

    // Draw stickers
    for (const sticker of stickers) {
        if (sticker.image) {
            DOMElements.ctx.save();
            const centerX = sticker.x + sticker.size / 2;
            const centerY = sticker.y + sticker.size / 2;

            DOMElements.ctx.translate(centerX, centerY);
            DOMElements.ctx.rotate(sticker.rotation * Math.PI / 180);
            DOMElements.ctx.translate(-centerX, -centerY);

            DOMElements.ctx.drawImage(sticker.image, sticker.x, sticker.y, sticker.size, sticker.size);

            // Draw selection border if selected
            if (sticker === stickers[selectedStickerIndex]) {
                DOMElements.ctx.strokeStyle = 'var(--accent-color)';
                DOMElements.ctx.lineWidth = 2;
                const padding = 5;
                DOMElements.ctx.strokeRect(sticker.x - padding, sticker.y - padding, sticker.size + padding * 2, sticker.size + padding * 2);
            }
            DOMElements.ctx.restore();
        }
    }


    // Draw custom title and subtitle (optional)
    const stripTitle = DOMElements.stripTitleInput ? DOMElements.stripTitleInput.value : '';
    const stripSubtitle = DOMElements.stripSubtitleInput ? DOMElements.stripSubtitleInput.value : '';

    if (stripTitle) {
        DOMElements.ctx.font = 'bold 48px Fredoka';
        DOMElements.ctx.fillStyle = 'var(--primary-brand-color)';
        DOMElements.ctx.textAlign = 'center';
        DOMElements.ctx.fillText(stripTitle, DOMElements.canvas.width / 2, 80);
    }

    if (stripSubtitle) {
        DOMElements.ctx.font = 'normal 24px Poppins';
        DOMElements.ctx.fillStyle = 'var(--text-dark)';
        DOMElements.ctx.textAlign = 'center';
        DOMElements.ctx.fillText(stripSubtitle, DOMElements.canvas.width / 2, 120);
    }

    // Draw ODZ BOOTH logo (fixed at the bottom)
    const logoText = "ODZ BOOTH";
    const logoFontSize = 50;
    const logoFontFamily = 'Fredoka';
    const logoColor = 'var(--primary-brand-color)';
    const logoBottomPadding = 60; // Distance from the bottom of the strip

    const logoX = DOMElements.canvas.width / 2;
    const logoY = DOMElements.canvas.height - logoBottomPadding;

    if (DOMElements.toggleLogoVisibilityBtn && DOMElements.toggleLogoVisibilityBtn.dataset.visible === 'true') {
        DOMElements.ctx.font = `${logoFontSize}px ${logoFontFamily}`;
        DOMElements.ctx.fillStyle = logoColor;
        DOMElements.ctx.textAlign = 'center';
        DOMElements.ctx.textBaseline = 'alphabetic'; // Ensure consistent baseline
        DOMElements.ctx.fillText(logoText, logoX, logoY);
    }

    // Draw custom logo image if provided and visible
    if (DOMElements.stripLogoInput && DOMElements.stripLogoInput.files.length > 0 && DOMElements.logoPreview.src) {
        if (DOMElements.toggleLogoVisibilityBtn && DOMElements.toggleLogoVisibilityBtn.dataset.customLogoVisible === 'true') {
            try {
                const customLogoImg = await loadImage(DOMElements.logoPreview.src);
                const logoWidth = 100; // Fixed width for the custom logo
                const logoHeight = (customLogoImg.height / customLogoImg.width) * logoWidth; // Maintain aspect ratio

                const customLogoX = DOMElements.canvas.width / 2 - logoWidth / 2;
                const customLogoY = DOMElements.canvas.height - logoBottomPadding - logoHeight - 10; // Above ODZ BOOTH text

                DOMElements.ctx.drawImage(customLogoImg, customLogoX, customLogoY, logoWidth, logoHeight);
            } catch (error) {
                console.error('Error drawing custom logo:', error);
            }
        }
    }
}


/**
 * Sets up all canvas event listeners for text and sticker manipulation.
 */
function setupCanvasEventListeners() {
    let isDraggingText = false;
    let isDraggingSticker = false;
    let dragStartX, dragStartY;

    DOMElements.canvas.addEventListener('mousedown', (e) => {
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;

        if (drawingMode) {
            isDrawing = true;
            lastX = mouseX;
            lastY = mouseY;
            drawings.push({ x: mouseX, y: mouseY, color: DOMElements.brushColorInput.value, size: DOMElements.brushSizeInput.value, newPath: true });
        } else {
            // Check if clicking on an existing sticker
            selectedStickerIndex = -1; // Deselect previous sticker
            for (let i = stickers.length - 1; i >= 0; i--) { // Iterate backwards to select top-most sticker
                const sticker = stickers[i];
                const stickerLeft = sticker.x;
                const stickerRight = sticker.x + sticker.size;
                const stickerTop = sticker.y;
                const stickerBottom = sticker.y + sticker.size;

                if (mouseX >= stickerLeft && mouseX <= stickerRight &&
                    mouseY >= stickerTop && mouseY <= stickerBottom) {
                    selectedStickerIndex = i;
                    isDraggingSticker = true;
                    dragStartX = mouseX - sticker.x;
                    dragStartY = mouseY - sticker.y;
                    updateStickerControlsFromSelection();
                    renderCanvas();
                    logAnalytics('Sticker_Selected', { stickerId: sticker.id });
                    return; // Stop checking further if a sticker is found
                }
            }

            // If no sticker was selected, check if clicking on existing text
            selectedTextIndex = -1; // Deselect previous text
            for (let i = textElements.length - 1; i >= 0; i--) { // Iterate backwards to select top-most text
                const textEl = textElements[i];
                DOMElements.ctx.font = `${textEl.settings.bold ? 'bold ' : ''}${textEl.settings.italic ? 'italic ' : ''}${textEl.settings.size}px ${textEl.settings.fontFamily}`;
                const textMetrics = DOMElements.ctx.measureText(textEl.text);
                const textWidth = textMetrics.width;
                const textHeight = textEl.settings.size; // Approximation

                // Adjust textX based on alignment for accurate bounding box
                let actualTextX = textEl.x;
                if (textEl.settings.align === 'center') {
                    actualTextX -= textWidth / 2;
                } else if (textEl.settings.align === 'right') {
                    actualTextX -= textWidth;
                }

                // Check bounds for text selection (add some padding for easier clicking)
                const padding = 5;
                if (mouseX >= actualTextX - padding && mouseX <= actualTextX + textWidth + padding &&
                    mouseY >= textEl.y - padding && mouseY <= textEl.y + textHeight + padding) {
                    selectedTextIndex = i;
                    isDraggingText = true;
                    dragStartX = mouseX - textEl.x;
                    dragStartY = mouseY - textEl.y;
                    updateTextControlsFromSelection();
                    renderCanvas();
                    logAnalytics('Text_Selected', { text: textEl.text });
                    return; // Stop checking further if text is found
                }
            }
            // If neither text nor sticker is selected, ensure controls are disabled
            updateTextControlsFromSelection();
            updateStickerControlsFromSelection();
            renderCanvas(); // Redraw to remove any selection borders
        }
    });

    DOMElements.canvas.addEventListener('mousemove', (e) => {
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;

        if (drawingMode && isDrawing) {
            drawings.push({ x: mouseX, y: mouseY, color: DOMElements.brushColorInput.value, size: DOMElements.brushSizeInput.value, newPath: false });
            renderCanvas();
            lastX = mouseX;
            lastY = mouseY;
        } else if (isDraggingText && selectedTextIndex !== -1) {
            textElements[selectedTextIndex].x = mouseX - dragStartX;
            textElements[selectedTextIndex].y = mouseY - dragStartY;
            renderCanvas();
        } else if (isDraggingSticker && selectedStickerIndex !== -1) {
            stickers[selectedStickerIndex].x = mouseX - dragStartX;
            stickers[selectedStickerIndex].y = mouseY - dragStartY;
            renderCanvas();
        }
    });

    DOMElements.canvas.addEventListener('mouseup', () => {
        isDraggingText = false;
        isDraggingSticker = false;
        isDrawing = false;
    });

    DOMElements.canvas.addEventListener('mouseleave', () => {
        isDraggingText = false;
        isDraggingSticker = false;
        isDrawing = false; // Stop drawing if mouse leaves canvas
    });
}

/**
 * Updates the state of text editing controls based on whether a text element is selected.
 */
function updateTextControlsFromSelection() {
    const isSelected = selectedTextIndex !== -1;
    const selectedText = isSelected ? textElements[selectedTextIndex] : null;

    DOMElements.removeTextBtn.disabled = !isSelected;
    DOMElements.fontFamilySelect.disabled = !isSelected;
    DOMElements.fontSizeInput.disabled = !isSelected;
    DOMElements.textColorInput.disabled = !isSelected;
    DOMElements.textAlignSelect.disabled = !isSelected;
    DOMElements.textBoldToggle.disabled = !isSelected;
    DOMElements.textItalicToggle.disabled = !isSelected;
    DOMElements.textOutlineToggle.disabled = !isSelected;
    DOMElements.textShadowToggle.disabled = !isSelected;
    DOMElements.textRotateSlider.disabled = !isSelected;

    if (isSelected) {
        DOMElements.textInput.value = selectedText.text;
        DOMElements.fontFamilySelect.value = selectedText.settings.fontFamily;
        DOMElements.fontSizeInput.value = selectedText.settings.size;
        DOMElements.textColorInput.value = selectedText.settings.color;
        DOMElements.textAlignSelect.value = selectedText.settings.align;
        DOMElements.textBoldToggle.classList.toggle('active', selectedText.settings.bold);
        DOMElements.textItalicToggle.classList.toggle('active', selectedText.settings.italic);
        DOMElements.textOutlineToggle.classList.toggle('active', selectedText.settings.outline);
        DOMElements.textShadowToggle.classList.toggle('active', selectedText.settings.shadow);
        DOMElements.textRotateSlider.value = selectedText.rotation;
    } else {
        DOMElements.textInput.value = '';
        // Reset to defaults or initial empty state when nothing is selected
        DOMElements.fontFamilySelect.value = DEFAULT_TEXT_SETTINGS.fontFamily;
        DOMElements.fontSizeInput.value = DEFAULT_TEXT_SETTINGS.size;
        DOMElements.textColorInput.value = DEFAULT_TEXT_SETTINGS.color;
        DOMElements.textAlignSelect.value = DEFAULT_TEXT_SETTINGS.align;
        DOMElements.textBoldToggle.classList.remove('active');
        DOMElements.textItalicToggle.classList.remove('active');
        DOMEElements.textOutlineToggle.classList.remove('active');
        DOMElements.textShadowToggle.classList.remove('active');
        DOMElements.textRotateSlider.value = 0;
    }
}

/**
 * Updates the state of sticker editing controls based on whether a sticker is selected.
 */
function updateStickerControlsFromSelection() {
    const isSelected = selectedStickerIndex !== -1;
    const selectedSticker = isSelected ? stickers[selectedStickerIndex] : null;

    DOMElements.removeStickerBtn.disabled = !isSelected;
    DOMElements.stickerSizeSlider.disabled = !isSelected;
    DOMElements.stickerRotateSlider.disabled = !isSelected;

    if (isSelected && selectedSticker) {
        DOMElements.stickerSizeSlider.value = selectedSticker.size;
        DOMElements.stickerRotateSlider.value = selectedSticker.rotation;
    } else {
        DOMElements.stickerSizeSlider.value = 100; // Default size
        DOMElements.stickerRotateSlider.value = 0; // Default rotation
    }
}


/**
 * Sets up all event listeners for UI controls.
 */
function setupEventListeners() {
    DOMElements.downloadStripBtn.addEventListener('click', () => {
        const format = DOMElements.downloadFormatSelect.value;
        downloadStrip(format);
    });

    DOMElements.printStripBtn.addEventListener('click', printStrip);
    DOMElements.retakeBtn.addEventListener('click', () => {
        logAnalytics('Retake_Photos');
        window.location.href = 'capture-page/capture-page.html';
    });


    // Text Controls
    DOMElements.addTextBtn.addEventListener('click', () => {
        const text = DOMElements.textInput.value.trim();
        if (text) {
            // Position new text element in the middle of the first photo frame if available
            let initialX = DOMElements.canvas.width / 2;
            let initialY = DOMElements.canvas.height / 2;

            if (currentStripConfig.frames && currentStripConfig.frames.length > 0) {
                const firstFrame = currentStripConfig.frames[0];
                initialX = firstFrame.x + firstFrame.width / 2;
                initialY = firstFrame.y + firstFrame.height / 2;
            }

            textElements.push({
                text: text,
                x: initialX,
                y: initialY,
                settings: { ...DEFAULT_TEXT_SETTINGS }, // Copy default settings
                rotation: 0
            });
            selectedTextIndex = textElements.length - 1; // Select the newly added text
            DOMElements.textInput.value = ''; // Clear input
            updateTextControlsFromSelection();
            renderCanvas();
            logAnalytics('Text_Added', { text: text });
        } else {
            alert('Please enter some text!');
        }
    });

    DOMElements.removeTextBtn.addEventListener('click', () => {
        if (selectedTextIndex !== -1) {
            const removedText = textElements.splice(selectedTextIndex, 1);
            selectedTextIndex = -1; // Deselect
            updateTextControlsFromSelection();
            renderCanvas();
            logAnalytics('Text_Removed', { text: removedText[0].text });
        }
    });

    // Update text content live
    DOMElements.textInput.addEventListener('input', () => {
        if (selectedTextIndex !== -1) {
            textElements[selectedTextIndex].text = DOMElements.textInput.value;
            renderCanvas();
        }
    });

    // Event listeners for text settings
    DOMElements.fontFamilySelect.addEventListener('change', (e) => {
        if (selectedTextIndex !== -1) {
            textElements[selectedTextIndex].settings.fontFamily = e.target.value;
            renderCanvas();
            logAnalytics('Text_Font_Changed', { font: e.target.value });
        }
    });
    DOMElements.fontSizeInput.addEventListener('input', (e) => {
        if (selectedTextIndex !== -1) {
            textElements[selectedTextIndex].settings.size = parseInt(e.target.value);
            renderCanvas();
        }
    });
    DOMElements.textColorInput.addEventListener('input', (e) => {
        if (selectedTextIndex !== -1) {
            textElements[selectedTextIndex].settings.color = e.target.value;
            renderCanvas();
        }
    });
    DOMElements.textAlignSelect.addEventListener('change', (e) => {
        if (selectedTextIndex !== -1) {
            textElements[selectedTextIndex].settings.align = e.target.value;
            renderCanvas();
        }
    });
    DOMElements.textBoldToggle.addEventListener('click', () => {
        if (selectedTextIndex !== -1) {
            const current = textElements[selectedTextIndex].settings.bold;
            textElements[selectedTextIndex].settings.bold = !current;
            DOMElements.textBoldToggle.classList.toggle('active', !current);
            renderCanvas();
            logAnalytics('Text_Bold_Toggled', { value: !current });
        }
    });
    DOMElements.textItalicToggle.addEventListener('click', () => {
        if (selectedTextIndex !== -1) {
            const current = textElements[selectedTextIndex].settings.italic;
            textElements[selectedTextIndex].settings.italic = !current;
            DOMElements.textItalicToggle.classList.toggle('active', !current);
            renderCanvas();
            logAnalytics('Text_Italic_Toggled', { value: !current });
        }
    });
    DOMElements.textOutlineToggle.addEventListener('click', () => {
        if (selectedTextIndex !== -1) {
            const current = textElements[selectedTextIndex].settings.outline;
            textElements[selectedTextIndex].settings.outline = !current;
            DOMElements.textOutlineToggle.classList.toggle('active', !current);
            renderCanvas();
            logAnalytics('Text_Outline_Toggled', { value: !current });
        }
    });
    DOMElements.textShadowToggle.addEventListener('click', () => {
        if (selectedTextIndex !== -1) {
            const current = textElements[selectedTextIndex].settings.shadow;
            textElements[selectedTextIndex].settings.shadow = !current;
            DOMElements.textShadowToggle.classList.toggle('active', !current);
            renderCanvas();
            logAnalytics('Text_Shadow_Toggled', { value: !current });
        }
    });
    DOMElements.textRotateSlider.addEventListener('input', (e) => {
        if (selectedTextIndex !== -1) {
            textElements[selectedTextIndex].rotation = parseInt(e.target.value);
            renderCanvas();
        }
    });


    // Sticker Controls
    // Populate sticker select options
    if (DOMElements.stickerSelect) {
        STICKERS.forEach(sticker => {
            const option = document.createElement('option');
            option.value = sticker.id;
            option.textContent = sticker.name;
            DOMElements.stickerSelect.appendChild(option);
        });
    }

    DOMElements.addStickerBtn.addEventListener('click', async () => {
        const selectedStickerId = DOMElements.stickerSelect.value;
        const stickerData = STICKERS.find(s => s.id === selectedStickerId);

        if (stickerData) {
            try {
                const img = await loadImage(stickerData.src);
                // Position new sticker in the middle of the first photo frame
                let initialX = DOMElements.canvas.width / 2 - stickerData.defaultSize / 2;
                let initialY = DOMElements.canvas.height / 2 - stickerData.defaultSize / 2;

                if (currentStripConfig.frames && currentStripConfig.frames.length > 0) {
                    const firstFrame = currentStripConfig.frames[0];
                    initialX = firstFrame.x + firstFrame.width / 2 - stickerData.defaultSize / 2;
                    initialY = firstFrame.y + firstFrame.height / 2 - stickerData.defaultSize / 2;
                }

                stickers.push({
                    id: stickerData.id,
                    image: img,
                    x: initialX,
                    y: initialY,
                    size: stickerData.defaultSize,
                    rotation: 0,
                    selected: false
                });
                selectedStickerIndex = stickers.length - 1;
                updateStickerControlsFromSelection();
                renderCanvas();
                logAnalytics('Sticker_Added', { stickerId: stickerData.id });
            } catch (error) {
                console.error('Failed to load sticker image:', error);
                alert('Failed to add sticker. Please try again.');
            }
        }
    });

    DOMElements.removeStickerBtn.addEventListener('click', () => {
        if (selectedStickerIndex !== -1) {
            const removedSticker = stickers.splice(selectedStickerIndex, 1);
            selectedStickerIndex = -1;
            updateStickerControlsFromSelection();
            renderCanvas();
            logAnalytics('Sticker_Removed', { stickerId: removedSticker[0].id });
        }
    });

    DOMElements.stickerSizeSlider.addEventListener('input', (e) => {
        if (selectedStickerIndex !== -1) {
            stickers[selectedStickerIndex].size = parseInt(e.target.value);
            renderCanvas();
        }
    });

    DOMElements.stickerRotateSlider.addEventListener('input', (e) => {
        if (selectedStickerIndex !== -1) {
            stickers[selectedStickerIndex].rotation = parseInt(e.target.value);
            renderCanvas();
        }
    });


    // Drawing Controls
    DOMElements.toggleDrawModeBtn.addEventListener('click', () => {
        drawingMode = !drawingMode;
        DOMElements.toggleDrawModeBtn.classList.toggle('active', drawingMode);
        // Disable text/sticker manipulation when in drawing mode
        DOMElements.canvas.style.cursor = drawingMode ? 'crosshair' : 'default';
        logAnalytics('Drawing_Mode_Toggled', { enabled: drawingMode });
    });

    DOMElements.clearDrawingsBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all drawings?')) {
            drawings = [];
            renderCanvas();
            logAnalytics('All_Drawings_Cleared');
        }
    });

    DOMElements.brushColorInput.addEventListener('input', renderCanvas);
    DOMElements.brushSizeInput.addEventListener('input', renderCanvas);


    // Other controls
    DOMElements.framesSelect.addEventListener('change', renderCanvas);
    DOMElements.backgroundColorInput.addEventListener('input', renderCanvas);
    DOMElements.stripTitleInput.addEventListener('input', renderCanvas);
    DOMElements.stripSubtitleInput.addEventListener('input', renderCanvas);

    DOMElements.stripLogoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                DOMElements.logoPreview.src = event.target.result;
                DOMElements.toggleLogoVisibilityBtn.dataset.customLogoVisible = 'true'; // Show custom logo by default
                renderCanvas();
                logAnalytics('Custom_Logo_Uploaded');
            };
            reader.readAsDataURL(file);
        } else {
            DOMElements.logoPreview.src = '';
            DOMElements.toggleLogoVisibilityBtn.dataset.customLogoVisible = 'false';
            renderCanvas();
        }
    });

    DOMElements.toggleLogoVisibilityBtn.addEventListener('click', () => {
        const isVisible = DOMElements.toggleLogoVisibilityBtn.dataset.visible === 'true';
        DOMElements.toggleLogoVisibilityBtn.dataset.visible = String(!isVisible); // Toggle global logo visibility
        const isCustomLogoVisible = DOMElements.toggleLogoVisibilityBtn.dataset.customLogoVisible === 'true';

        // Update button text/icon
        DOMElements.toggleLogoVisibilityBtn.querySelector('i').classList.toggle('bx-show', !isVisible);
        DOMElements.toggleLogoVisibilityBtn.querySelector('i').classList.toggle('bx-hide', isVisible);
        DOMElements.toggleLogoVisibilityBtn.innerHTML = `
            <i class='bx ${!isVisible ? 'bx-show' : 'bx-hide'}'></i> ${!isVisible ? 'Hide ODZ Booth Logo' : 'Show ODZ Booth Logo'}
        `;

        renderCanvas();
        logAnalytics('ODZ_Booth_Logo_Visibility_Toggled', { visible: !isVisible });
    });

    // Initial state for toggleLogoVisibilityBtn
    DOMElements.toggleLogoVisibilityBtn.dataset.visible = 'true'; // Default to visible
    DOMElements.toggleLogoVisibilityBtn.dataset.customLogoVisible = 'false'; // Default custom logo to hidden
}

/**
 * Initializes the editor page by loading data, setting up controls, and rendering the canvas.
 */
async function initializeEditorPage() {
    // Assign DOM elements to DOMElements properties
    DOMElements.canvas = document.getElementById('photoStripCanvas');
    DOMElements.ctx = DOMElements.canvas.getContext('2d');
    DOMElements.downloadStripBtn = document.getElementById('downloadStripBtn');
    DOMElements.printStripBtn = document.getElementById('printStripBtn');
    DOMElements.retakeBtn = document.getElementById('retakeBtn');

    // Text controls
    DOMElements.addTextBtn = document.getElementById('addTextBtn');
    DOMElements.textInput = document.getElementById('textInput');
    DOMElements.removeTextBtn = document.getElementById('removeTextBtn');
    DOMElements.fontFamilySelect = document.getElementById('fontFamilySelect');
    DOMElements.fontSizeInput = document.getElementById('fontSizeInput');
    DOMElements.textColorInput = document.getElementById('textColorInput');
    DOMElements.textAlignSelect = document.getElementById('textAlignSelect');
    DOMElements.textBoldToggle = document.getElementById('textBoldToggle');
    DOMElements.textItalicToggle = document.getElementById('textItalicToggle');
    DOMElements.textOutlineToggle = document.getElementById('textOutlineToggle');
    DOMElements.textShadowToggle = document.getElementById('textShadowToggle');
    DOMElements.textRotateSlider = document.getElementById('textRotateSlider');

    // Sticker controls
    DOMElements.stickerSelect = document.getElementById('stickerSelect');
    DOMElements.addStickerBtn = document.getElementById('addStickerBtn');
    DOMElements.removeStickerBtn = document.getElementById('removeStickerBtn');
    DOMElements.stickerSizeSlider = document.getElementById('stickerSizeSlider');
    DOMElements.stickerRotateSlider = document.getElementById('stickerRotateSlider');

    // Drawing controls
    DOMElements.toggleDrawModeBtn = document.getElementById('toggleDrawModeBtn');
    DOMElements.brushColorInput = document.getElementById('brushColorInput');
    DOMElements.brushSizeInput = document.getElementById('brushSizeInput');
    DOMElements.clearDrawingsBtn = document.getElementById('clearDrawingsBtn');

    // Other
    DOMElements.downloadFormatSelect = document.getElementById('downloadFormatSelect');
    DOMElements.framesSelect = document.getElementById('framesSelect');
    DOMElements.backgroundColorInput = document.getElementById('backgroundColorInput');
    DOMElements.stripTitleInput = document.getElementById('stripTitleInput');
    DOMElements.stripSubtitleInput = document.getElementById('stripSubtitleInput');
    DOMElements.stripLogoInput = document.getElementById('stripLogoInput');
    DOMElements.toggleLogoVisibilityBtn = document.getElementById('toggleLogoVisibilityBtn');
    DOMElements.logoPreview = document.getElementById('logoPreview');


    // Retrieve captured photos and selected layout from localStorage
    const storedPhotos = localStorage.getItem('capturedPhotos');
    if (storedPhotos) {
        capturedPhotos = JSON.parse(storedPhotos);
    } else {
        console.warn('No captured photos found in localStorage. Redirecting to capture page.');
        window.location.href = 'capture-page/capture-page.html';
        return; // Stop initialization if no photos
    }

    const selectedPhotoCount = localStorage.getItem('selectedPhotoCount');
    const selectedFrameAspectRatio = parseFloat(localStorage.getItem('selectedFrameAspectRatio'));

    if (!selectedPhotoCount || !STRIP_LAYOUT_CONFIGS[selectedPhotoCount]) {
        console.error('Invalid or no photo layout selected. Redirecting to layout selection.');
        window.location.href = 'layout-selection/layout-selection.html';
        return;
    }

    currentStripConfig = { ...STRIP_LAYOUT_CONFIGS.common, ...STRIP_LAYOUT_CONFIGS[selectedPhotoCount] };
    currentStripConfig.frameAspectRatio = selectedFrameAspectRatio;

    // Set canvas dimensions
    DOMElements.canvas.width = currentStripConfig.stripWidth;
    DOMElements.canvas.height = currentStripConfig.stripHeight;

    // Populate frame options
    if (DOMElements.framesSelect) {
        DOMElements.framesSelect.innerHTML = ''; // Clear existing options
        currentStripConfig.availableFrames.forEach(frame => {
            const option = document.createElement('option');
            option.value = frame.id;
            option.textContent = frame.name;
            DOMElements.framesSelect.appendChild(option);
        });
        DOMElements.framesSelect.value = 'option1'; // Select the first option by default
    }

    // Set default values for controls based on DEFAULT_TEXT_SETTINGS and DEFAULT_DRAWING_SETTINGS
    if (DOMElements.fontFamilySelect) DOMElements.fontFamilySelect.value = DEFAULT_TEXT_SETTINGS.fontFamily;
    if (DOMElements.fontSizeInput) DOMElements.fontSizeInput.value = DEFAULT_TEXT_SETTINGS.size;
    if (DOMElements.textColorInput) DOMElements.textColorInput.value = DEFAULT_TEXT_SETTINGS.color;
    if (DOMElements.textAlignSelect) DOMElements.textAlignSelect.value = DEFAULT_TEXT_SETTINGS.align;
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

    setupEventListeners(); // Attach all event listeners
    setupCanvasEventListeners(); // Setup canvas specific event listeners
    renderCanvas(); // Initial render of the photo strip
    logAnalytics('Editor_Page_Loaded_Successfully', { layout: selectedPhotoCount });
}

// Ensure the `initializeEditorPage` function runs only after the entire HTML document is loaded.
// This prevents errors where JavaScript tries to find elements before they exist on the page.
document.addEventListener('DOMContentLoaded', initializeEditorPage);
