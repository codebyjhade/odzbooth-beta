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
        stripHeight: 40 + (240 * 2) + (20 * 1) + 150, // topPadding + (photoHeight * 2) + gapBetweenPhotos + bottomSpaceForLogo
        frames: [
            { x: 40, y: 40, width: 320, height: 240 },
            { x: 40, y: 40 + 240 + 20, width: 320, height: 240 }
        ],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-2-photos-option1.png', name: 'Original Double' },
            { id: 'option2', src: 'assets/strip-frame-2-photos-option2.png', name: 'Minimalist Grid' },
            { id: 'option3', src: 'assets/strip-frame-2-photos-option3.png', name: 'Photo Booth Classic' }
        ]
    },
    // Configuration for a 3-photo strip
    '3': {
        stripWidth: 400,
        stripHeight: 40 + (240 * 3) + (20 * 2) + 150, // topPadding + (photoHeight * 3) + (gapBetweenPhotos * 2) + bottomSpaceForLogo
        frames: [
            { x: 40, y: 40, width: 320, height: 240 },
            { x: 40, y: 40 + 240 + 20, width: 320, height: 240 },
            { x: 40, y: 40 + (240 * 2) + (20 * 2), width: 320, height: 240 }
        ],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-3-photos-option1.png', name: 'Standard Triple' },
            { id: 'option2', src: 'assets/strip-frame-3-photos-option2.png', name: 'Retro Film' },
            { id: 'option3', src: 'assets/strip-frame-3-photos-option3.png', name: 'Grayscale Elegance' }
        ]
    },
    // Configuration for a 4-photo strip
    '4': {
        stripWidth: 400,
        stripHeight: 40 + (240 * 4) + (20 * 3) + 150, // topPadding + (photoHeight * 4) + (gapBetweenPhotos * 3) + bottomSpaceForLogo
        frames: [
            { x: 40, y: 40, width: 320, height: 240 },
            { x: 40, y: 40 + 240 + 20, width: 320, height: 240 },
            { x: 40, y: 40 + (240 * 2) + (20 * 2), width: 320, height: 240 },
            { x: 40, y: 40 + (240 * 3) + (20 * 3), width: 320, height: 240 }
        ],
        defaultBackground: '#CCCCCC',
        availableFrames: [
            { id: 'option1', src: 'assets/strip-frame-4-photos-option1.png', name: 'Classic Quad' },
            { id: 'option2', src: 'assets/strip-frame-4-photos-option2.png', name: 'Vibrant Squares' },
            { id: 'option3', src: 'assets/strip-frame-4-photos-option3.png', name: 'Film Strip Look' }
        ]
    }
};

const DEFAULT_TEXT_SETTINGS = {
    font: "'Poppins', sans-serif",
    size: 30,
    color: "#333333",
    shadowColor: "#000000",
    shadowBlur: 0,
    align: "center"
};

const DEFAULT_DRAWING_SETTINGS = {
    color: "#FF0000",
    size: 5
};

// --- State Variables ---
let capturedImages = [];
let currentConfig = null;
let currentFrame = null;
let customElements = []; // Stores text and sticker objects
let selectedElement = null; // Stores the currently selected text/sticker element
let isDrawingMode = false;
let lastX = 0;
let lastY = 0;
let drawings = []; // Stores paths of drawings
let showDateTimeOnStrip = false; // New state variable for date/time

// --- DOM Elements ---
// Caching DOM elements for efficient access.
const DOMElements = {
    canvasContainer: document.getElementById('canvasContainer'),
    photoStripCanvas: document.getElementById('photoStripCanvas'),
    backgroundSelect: document.getElementById('backgroundSelect'), // This is an input type="color" now
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
    toggleDateTime: document.getElementById('toggleDateTime'), // NEW: Date/Time toggle
    noPhotosMessage: document.getElementById('noPhotosMessage'),
    downloadSpinner: document.getElementById('downloadSpinner')
};

const ctx = DOMElements.photoStripCanvas ? DOMElements.photoStripCanvas.getContext('2d') : null;

// --- Utility Functions ---

// Function to log analytics events
function logAnalytics(eventName, properties = {}) {
    console.log(`ANALYTICS: ${eventName}`, properties);
    // In a real application, this would send data to an analytics service
}

// Function to get query parameters from the URL
function getQueryParams() {
    const params = {};
    window.location.search.substring(1).split("&").forEach(param => {
        const [key, value] = param.split("=");
        params[key] = decodeURIComponent(value);
    });
    return params;
}

// Function to populate select options (uses innerHTML)
function populateOptions(selectElement, optionsArray) {
    if (!selectElement) {
        console.error(`populateOptions: selectElement is null for ID: ${selectElement ? selectElement.id : 'N/A'}.`);
        return;
    }
    let html = '';
    if (selectElement.id === 'frameSelect') { // Check for frameSelect explicitly
        html += '<option value="">Select a frame</option>';
        html += '<option value="custom">Custom Color</option>';
    } else if (selectElement.id === 'stickerSelect') {
        html += '<option value="">Select a sticker</option>';
    }
    optionsArray.forEach(option => {
        if (option.optgroup) {
            html += `<optgroup label="${option.optgroup}">`;
            option.options.forEach(subOption => {
                html += `<option value="${subOption.value}">${subOption.name}</option>`;
            });
            html += `</optgroup>`;
        } else {
            html += `<option value="${option.value}">${option.name}</option>`;
        }
    });
    selectElement.innerHTML = html;
}

// Function to load captured images from session storage
function loadCapturedImages() {
    const imagesJson = sessionStorage.getItem('capturedImages');
    if (imagesJson) {
        const loadedUrls = JSON.parse(imagesJson);
        const imagePromises = loadedUrls.map(url => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => {
                    console.error('Error loading image:', url);
                    resolve(null); // Resolve with null to continue even if an image fails
                };
                img.src = url;
            });
        });

        Promise.all(imagePromises).then(images => {
            capturedImages = images.filter(img => img !== null); // Filter out failed images
            console.log(`Loaded ${capturedImages.length} captured photos.`);
            if (capturedImages.length > 0) {
                initializeEditorPage();
            } else {
                displayNoPhotosMessage();
            }
        });
    } else {
        displayNoPhotosMessage();
    }
}

// Function to display "No photos found" message
function displayNoPhotosMessage() {
    if (DOMElements.noPhotosMessage) {
        DOMElements.noPhotosMessage.style.display = 'block';
        DOMElements.photoStripCanvas.style.display = 'none'; // Hide canvas if no photos
    }
    // Optionally disable editing controls if no photos are available
    disableAllControls();
}

// Function to disable all editing controls
function disableAllControls() {
    const controls = document.querySelectorAll('.tools-panel button, .tools-panel select, .tools-panel input');
    controls.forEach(control => {
        if (control.id !== 'retakeBtn') { // Keep retake button enabled
            control.disabled = true;
        }
    });
}

// Function to enable all editing controls
function enableAllControls() {
    const controls = document.querySelectorAll('.tools-panel button, .tools-panel select, .tools-panel input');
    controls.forEach(control => {
        if (control.id !== 'retakeBtn') { // Keep retake button enabled
            control.disabled = false;
        }
    });
}

// Function to get current date in YYYY.MM.DD format
function getFormattedDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 0-indexed month, add leading zero
    const day = now.getDate().toString().padStart(2, '0'); // Add leading zero
    return `${year}.${month}.${day}`;
}

// --- Drawing Functions ---

// Function to draw the entire photo strip
function renderCanvas() {
    if (!ctx || !currentConfig || capturedImages.length === 0) {
        console.warn("Canvas context or config not ready, or no images to render.");
        return;
    }

    // Set canvas dimensions
    DOMElements.photoStripCanvas.width = currentConfig.stripWidth;
    DOMElements.photoStripCanvas.height = currentConfig.stripHeight;

    // Clear canvas
    ctx.clearRect(0, 0, DOMElements.photoStripCanvas.width, DOMElements.photoStripCanvas.height);

    // Draw background
    ctx.fillStyle = currentFrame && currentFrame.id === 'custom' && DOMElements.backgroundSelect ? DOMElements.backgroundSelect.value : currentConfig.defaultBackground;
    ctx.fillRect(0, 0, DOMElements.photoStripCanvas.width, DOMElements.photoStripCanvas.height);

    // Draw frame image if available and not 'custom'
    if (currentFrame && currentFrame.src && currentFrame.id !== 'custom') {
        const frameImg = new Image();
        frameImg.onload = () => {
            ctx.drawImage(frameImg, 0, 0, DOMElements.photoStripCanvas.width, DOMElements.photoStripCanvas.height);
            drawPhotos();
            drawCustomElements();
            drawDrawings();
            if (showDateTimeOnStrip) { // Draw date/time conditionally
                drawDateTime();
            }
        };
        frameImg.onerror = () => {
            console.error('Error loading frame image:', currentFrame.src);
            drawPhotos(); // Draw photos even if frame fails to load
            drawCustomElements();
            drawDrawings();
            if (showDateTimeOnStrip) { // Draw date/time conditionally
                drawDateTime();
            }
        };
        frameImg.src = currentFrame.src;
    } else {
        // If no frame or custom frame, just draw photos and elements
        drawPhotos();
        drawCustomElements();
        drawDrawings();
        if (showDateTimeOnStrip) { // Draw date/time conditionally
            drawDateTime();
        }
    }

    // Draw selection handles for the selected element (if any)
    if (selectedElement) {
        drawBoundingBox(selectedElement);
    }
}

// Function to draw photos onto the canvas
function drawPhotos() {
    currentConfig.frames.forEach((frame, index) => {
        if (capturedImages[index]) {
            const img = capturedImages[index];
            // Calculate aspect ratios
            const imgAspectRatio = img.width / img.height;
            const frameAspectRatio = frame.width / frame.height;

            let sx, sy, sWidth, sHeight; // Source (image) coordinates and dimensions
            let dx, dy, dWidth, dHeight; // Destination (canvas) coordinates and dimensions

            // Destination will be the frame dimensions
            dx = frame.x;
            dy = frame.y;
            dWidth = frame.width;
            dHeight = frame.height;

            // Calculate source dimensions to "cover" the frame, maintaining aspect ratio
            if (imgAspectRatio > frameAspectRatio) {
                // Image is wider than frame, crop left/right
                sHeight = img.height;
                sWidth = img.height * frameAspectRatio;
                sx = (img.width - sWidth) / 2;
                sy = 0;
            } else {
                // Image is taller than frame, crop top/bottom
                sWidth = img.width;
                sHeight = img.width / frameAspectRatio;
                sy = (img.height - sHeight) / 2;
                sx = 0;
            }
            ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        }
    });
}

// Function to draw custom text and stickers on the canvas
function drawCustomElements() {
    customElements.forEach(element => {
        if (element.type === 'text') {
            ctx.font = `${element.settings.bold ? 'bold ' : ''}${element.settings.italic ? 'italic ' : ''}${element.settings.size}px ${element.settings.font}`;
            ctx.fillStyle = element.settings.color;
            ctx.textAlign = element.settings.align;
            ctx.textBaseline = 'top'; // Align text from the top for consistent positioning

            // Apply text shadow
            if (element.settings.shadowBlur > 0) {
                ctx.shadowColor = element.settings.shadowColor;
                ctx.shadowBlur = element.settings.shadowBlur;
            } else {
                ctx.shadowColor = 'transparent'; // No shadow
                ctx.shadowBlur = 0;
            }
            
            const lines = element.text.split('\n');
            let currentY = element.y;

            // Calculate x-position based on alignment
            let xPos;
            if (element.settings.align === 'center') {
                xPos = element.x;
            } else if (element.settings.align === 'left') {
                xPos = element.x - (element.width / 2); // Adjust from center point
            } else { // right
                xPos = element.x + (element.width / 2); // Adjust from center point
            }

            lines.forEach(line => {
                ctx.fillText(line, xPos, currentY);
                currentY += element.settings.size * 1.2; // Line height
            });

            // Handle underline (draw after text to ensure shadow doesn't affect it)
            if (element.settings.underline) {
                ctx.shadowColor = 'transparent'; // Disable shadow for underline
                const textWidth = ctx.measureText(lines[lines.length - 1]).width;
                const underlineY = element.y + (lines.length * element.settings.size * 1.2) - (element.settings.size * 0.2); // Position relative to last line
                let underlineX;
                if (element.settings.align === 'center') {
                    underlineX = xPos - (textWidth / 2);
                } else if (element.settings.align === 'left') {
                    underlineX = xPos;
                } else { // right
                    underlineX = xPos - textWidth;
                }
                ctx.beginPath();
                ctx.strokeStyle = element.settings.color;
                ctx.lineWidth = element.settings.size * 0.08; // Adjust thickness
                ctx.moveTo(underlineX, underlineY);
                ctx.lineTo(underlineX + textWidth, underlineY);
                ctx.stroke();
            }

            // Reset shadow properties for next elements
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;


        } else if (element.type === 'sticker') {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, element.x - element.width / 2, element.y - element.height / 2, element.width, element.height);
                if (element === selectedElement) {
                    drawBoundingBox(element);
                }
            };
            img.src = element.src;
        }
    });
}

// Function to draw doodles/drawings on the canvas
function drawDrawings() {
    drawings.forEach(path => {
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        if (path.points.length > 0) {
            ctx.moveTo(path.points[0].x, path.points[0].y);
            path.points.forEach(point => {
                ctx.lineTo(point.x, point.y);
            });
        }
        ctx.stroke();
    });
}

// Function to draw the date/time stamp
function drawDateTime() {
    const formattedDate = getFormattedDate();

    ctx.font = "bold 24px Poppins"; // Fixed font size and style for date
    ctx.fillStyle = "#333333"; // Dark gray color
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle'; // Center text vertically

    // Position it centrally in the bottom space
    const dateX = DOMElements.photoStripCanvas.width / 2;
    // Calculate Y to be in the middle of the bottomSpaceForLogo
    const dateY = DOMElements.photoStripCanvas.height - (currentConfig.common.bottomSpaceForLogo / 2); 

    ctx.fillText(formattedDate, dateX, dateY);
}


// Function to draw a bounding box around a selected element
function drawBoundingBox(element) {
    if (!element) return;
    ctx.strokeStyle = '#00FFFF'; // Cyan color
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // Dashed line
    ctx.strokeRect(element.x - element.width / 2, element.y - element.height / 2, element.width, element.height);
    ctx.setLineDash([]); // Reset line dash
}

// --- Event Handlers ---

// Function to update text controls based on selected text
function updateTextControlsFromSelection() {
    const isTextSelected = selectedElement && selectedElement.type === 'text';

    // The text input and add button should always be available to add NEW text
    if (DOMElements.textInput) DOMElements.textInput.disabled = false;
    if (DOMElements.addTextBtn) DOMElements.addTextBtn.disabled = false;

    // Disable/enable controls for selected text
    if (DOMElements.fontSelect) DOMElements.fontSelect.disabled = !isTextSelected;
    if (DOMElements.fontSizeInput) DOMElements.fontSizeInput.disabled = !isTextSelected;
    if (DOMElements.textColorInput) DOMElements.textColorInput.disabled = !isTextSelected;
    if (DOMElements.textShadowColorInput) DOMElements.textShadowColorInput.disabled = !isTextSelected;
    if (DOMElements.textShadowBlurInput) DOMElements.textShadowBlurInput.disabled = !isTextSelected;
    if (DOMElements.boldToggleBtn) DOMElements.boldToggleBtn.disabled = !isTextSelected;
    if (DOMElements.italicToggleBtn) DOMElements.italicToggleBtn.disabled = !isTextSelected;
    if (DOMElements.textAlignSelect) DOMElements.textAlignSelect.disabled = !isTextSelected;
    if (DOMElements.removeTextBtn) DOMElements.removeTextBtn.disabled = !isTextSelected;


    if (isTextSelected) {
        if (DOMElements.textInput) DOMElements.textInput.value = selectedElement.text;
        if (DOMElements.fontSelect) DOMElements.fontSelect.value = selectedElement.settings.font;
        if (DOMElements.fontSizeInput) DOMElements.fontSizeInput.value = selectedElement.settings.size;
        if (DOMElements.textColorInput) DOMElements.textColorInput.value = selectedElement.settings.color;
        if (DOMElements.textShadowColorInput) DOMElements.textShadowColorInput.value = selectedElement.settings.shadowColor;
        if (DOMElements.textShadowBlurInput) DOMElements.textShadowBlurInput.value = selectedElement.settings.shadowBlur;
        if (DOMElements.textAlignSelect) DOMElements.textAlignSelect.value = selectedElement.settings.align;

        // Update button active states
        if (DOMElements.boldToggleBtn) DOMElements.boldToggleBtn.classList.toggle('active', selectedElement.settings.bold);
        if (DOMElements.italicToggleBtn) DOMElements.italicToggleBtn.classList.toggle('active', selectedElement.settings.italic);

    } else {
        // Reset controls if no text is selected
        if (DOMElements.textInput) DOMElements.textInput.value = '';
        if (DOMElements.boldToggleBtn) DOMElements.boldToggleBtn.classList.remove('active');
        if (DOMElements.italicToggleBtn) DOMElements.italicToggleBtn.classList.remove('active');
    }
}

// Function to update sticker controls based on selected sticker
function updateStickerControlsFromSelection() {
    const isStickerSelected = selectedElement && selectedElement.type === 'sticker';
    if (DOMElements.removeStickerBtn) DOMElements.removeStickerBtn.disabled = !isStickerSelected;
    // Sticker select and add button should always be available to add NEW stickers
    if (DOMElements.stickerSelect) DOMElements.stickerSelect.disabled = false;
    if (DOMElements.addStickerBtn) DOMElements.addStickerBtn.disabled = false;
}

// Event listener for canvas mouse down
function handleMouseDown(e) {
    if (isDrawingMode) {
        ctx.beginPath();
        const coords = getCanvasCoords(e);
        lastX = coords.x;
        lastY = coords.y;
        drawings.push({ color: DOMElements.brushColorInput.value, size: DOMElements.brushSizeInput.value, points: [{ x: lastX, y: lastY }] });
    } else {
        selectedElement = null; // Deselect any existing element
        const mouseX = getCanvasCoords(e).x;
        const mouseY = getCanvasCoords(e).y;

        // Check if a custom element is clicked
        for (let i = customElements.length - 1; i >= 0; i--) {
            const element = customElements[i];
            const halfWidth = element.width / 2;
            const halfHeight = element.height / 2;
            if (mouseX >= element.x - halfWidth && mouseX <= element.x + halfWidth &&
                mouseY >= element.y - halfHeight && mouseY <= element.y + halfHeight) {
                selectedElement = element;
                // Bring selected element to front for drawing and future interactions
                customElements.splice(i, 1);
                customElements.push(element);
                break;
            }
        }
    }
    renderCanvas();
    updateTextControlsFromSelection();
    updateStickerControlsFromSelection();
}

// Event listener for canvas mouse move
function handleMouseMove(e) {
    if (isDrawingMode && e.buttons === 1) { // Only draw if mouse button is down
        const coords = getCanvasCoords(e);
        const [x, y] = [coords.x, coords.y];
        drawings[drawings.length - 1].points.push({ x: x, y: y });
        lastX = x;
        lastY = y;
        renderCanvas();
    } else if (selectedElement && e.buttons === 1 && !isDrawingMode) {
        // Move selected element
        const coords = getCanvasCoords(e);
        selectedElement.x = coords.x + (selectedElement.x - lastX); // Adjust for movement
        selectedElement.y = coords.y + (selectedElement.y - lastY); // Adjust for movement
        lastX = coords.x;
        lastY = coords.y;
        renderCanvas();
    }
}

// Event listener for canvas mouse up
function handleMouseUp() {
    // No specific action needed on mouse up for drawing or moving
}

// --- Main Initialization ---

// Setup event listeners for UI controls
function setupEventListeners() {
    if (!ctx) {
        console.error("Cannot setup event listeners: Canvas context is null.");
        return;
    }

    DOMElements.photoStripCanvas.addEventListener('mousedown', handleMouseDown);
    DOMElements.photoStripCanvas.addEventListener('mousemove', handleMouseMove);
    DOMElements.photoStripCanvas.addEventListener('mouseup', handleMouseUp);
    DOMElements.photoStripCanvas.addEventListener('mouseleave', handleMouseUp); // End drawing if mouse leaves canvas

    // Frame selection
    if (DOMElements.frameSelect) {
        DOMElements.frameSelect.addEventListener('change', () => {
            const selectedFrameId = DOMElements.frameSelect.value;
            const frame = currentConfig.availableFrames.find(f => f.id === selectedFrameId);
            if (selectedFrameId === 'custom') {
                currentFrame = { id: 'custom' };
                if (DOMElements.backgroundSelect) DOMElements.backgroundSelect.style.display = 'block'; // Show color picker
            } else {
                currentFrame = frame;
                if (DOMElements.backgroundSelect) DOMElements.backgroundSelect.style.display = 'none'; // Hide color picker
            }
            renderCanvas();
        });
    }

    // Background color input for custom frame
    if (DOMElements.backgroundSelect) {
        DOMElements.backgroundSelect.addEventListener('input', renderCanvas);
    }

    // Toggle Date/Time Stamp
    if (DOMElements.toggleDateTime) {
        DOMElements.toggleDateTime.addEventListener('change', () => {
            showDateTimeOnStrip = DOMElements.toggleDateTime.checked;
            renderCanvas();
        });
    }

    // Add Text
    if (DOMElements.addTextBtn) {
        DOMElements.addTextBtn.addEventListener('click', () => {
            const text = DOMElements.textInput.value.trim();
            if (text) {
                const newTextElement = {
                    id: Date.now(), // Unique ID
                    type: 'text',
                    text: text,
                    x: DOMElements.photoStripCanvas.width / 2, // Center of canvas
                    y: DOMElements.photoStripCanvas.height / 2, // Center of canvas
                    width: 100, // Placeholder, will be measured
                    height: 30, // Placeholder, will be measured
                    settings: {
                        font: DOMElements.fontSelect ? DOMElements.fontSelect.value : DEFAULT_TEXT_SETTINGS.font,
                        size: DOMElements.fontSizeInput ? parseInt(DOMElements.fontSizeInput.value) : DEFAULT_TEXT_SETTINGS.size,
                        color: DOMElements.textColorInput ? DOMElements.textColorInput.value : DEFAULT_TEXT_SETTINGS.color,
                        shadowColor: DOMElements.textShadowColorInput ? DOMElements.textShadowColorInput.value : DEFAULT_TEXT_SETTINGS.shadowColor,
                        shadowBlur: DOMElements.textShadowBlurInput ? parseInt(DOMElements.textShadowBlurInput.value) : DEFAULT_TEXT_SETTINGS.shadowBlur,
                        bold: DOMElements.boldToggleBtn ? DOMElements.boldToggleBtn.classList.contains('active') : false,
                        italic: DOMElements.italicToggleBtn ? DOMElements.italicToggleBtn.classList.contains('active') : false,
                        underline: false // Assuming underline is not yet implemented or managed
                    }
                };
                customElements.push(newTextElement);
                selectedElement = newTextElement;
                renderCanvas();
                DOMElements.textInput.value = ''; // Clear input after adding
                updateTextControlsFromSelection();
            }
        });
    }

    // Text input changes
    if (DOMElements.textInput) {
        DOMElements.textInput.addEventListener('input', () => {
            if (selectedElement && selectedElement.type === 'text') {
                selectedElement.text = DOMElements.textInput.value;
                renderCanvas();
            }
        });
    }

    // Text font select
    if (DOMElements.fontSelect) {
        DOMElements.fontSelect.addEventListener('change', () => {
            if (selectedElement && selectedElement.type === 'text') {
                selectedElement.settings.font = DOMElements.fontSelect.value;
                renderCanvas();
            }
        });
    }

    // Font size input
    if (DOMElements.fontSizeInput) {
        DOMElements.fontSizeInput.addEventListener('input', () => {
            if (selectedElement && selectedElement.type === 'text') {
                selectedElement.settings.size = parseInt(DOMElements.fontSizeInput.value);
                renderCanvas();
            }
        });
    }

    // Text color input
    if (DOMElements.textColorInput) {
        DOMElements.textColorInput.addEventListener('input', () => {
            if (selectedElement && selectedElement.type === 'text') {
                selectedElement.settings.color = DOMElements.textColorInput.value;
                renderCanvas();
            }
        });
    }

    // Text shadow color input
    if (DOMElements.textShadowColorInput) {
        DOMElements.textShadowColorInput.addEventListener('input', () => {
            if (selectedElement && selectedElement.type === 'text') {
                selectedElement.settings.shadowColor = DOMElements.textShadowColorInput.value;
                renderCanvas();
            }
        });
    }

    // Text shadow blur input
    if (DOMElements.textShadowBlurInput) {
        DOMElements.textShadowBlurInput.addEventListener('input', () => {
            if (selectedElement && selectedElement.type === 'text') {
                selectedElement.settings.shadowBlur = parseInt(DOMElements.textShadowBlurInput.value);
                renderCanvas();
            }
        });
    }

    // Bold toggle
    if (DOMElements.boldToggleBtn) {
        DOMElements.boldToggleBtn.addEventListener('click', () => {
            if (selectedElement && selectedElement.type === 'text') {
                selectedElement.settings.bold = !selectedElement.settings.bold;
                DOMElements.boldToggleBtn.classList.toggle('active', selectedElement.settings.bold);
                renderCanvas();
            }
        });
    }

    // Italic toggle
    if (DOMElements.italicToggleBtn) {
        DOMElements.italicToggleBtn.addEventListener('click', () => {
            if (selectedElement && selectedElement.type === 'text') {
                selectedElement.settings.italic = !selectedElement.settings.italic;
                DOMElements.italicToggleBtn.classList.toggle('active', selectedElement.settings.italic);
                renderCanvas();
            }
        });
    }

    // Text alignment
    if (DOMElements.textAlignSelect) {
        DOMElements.textAlignSelect.addEventListener('change', () => {
            if (selectedElement && selectedElement.type === 'text') {
                selectedElement.settings.align = DOMElements.textAlignSelect.value;
                renderCanvas();
            }
        });
    }

    // Remove Text
    if (DOMElements.removeTextBtn) {
        DOMElements.removeTextBtn.addEventListener('click', () => {
            if (selectedElement && selectedElement.type === 'text') {
                customElements = customElements.filter(el => el !== selectedElement);
                selectedElement = null; // Deselect
                renderCanvas();
                updateTextControlsFromSelection();
            }
        });
    }


    // Add Sticker
    if (DOMElements.addStickerBtn) {
        DOMElements.addStickerBtn.addEventListener('click', () => {
            const selectedStickerSrc = DOMElements.stickerSelect.value;
            if (selectedStickerSrc) {
                const newStickerElement = {
                    id: Date.now(),
                    type: 'sticker',
                    src: selectedStickerSrc,
                    x: DOMElements.photoStripCanvas.width / 2, // Center of canvas
                    y: DOMElements.photoStripCanvas.height / 2, // Center of canvas
                    width: 100, // Default size for now
                    height: 100 // Default size for now
                };
                customElements.push(newStickerElement);
                selectedElement = newStickerElement;
                renderCanvas();
                DOMElements.stickerSelect.value = ''; // Reset sticker select
                updateStickerControlsFromSelection();
            }
        });
    }

    // Remove Sticker
    if (DOMElements.removeStickerBtn) {
        DOMElements.removeStickerBtn.addEventListener('click', () => {
            if (selectedElement && selectedElement.type === 'sticker') {
                customElements = customElements.filter(el => el !== selectedElement);
                selectedElement = null; // Deselect
                renderCanvas();
                updateStickerControlsFromSelection();
            }
        });
    }

    // Toggle Draw Mode
    if (DOMElements.toggleDrawModeBtn) {
        DOMElements.toggleDrawModeBtn.addEventListener('click', () => {
            isDrawingMode = !isDrawingMode;
            DOMElements.toggleDrawModeBtn.classList.toggle('active', isDrawingMode);
            DOMElements.photoStripCanvas.style.cursor = isDrawingMode ? 'crosshair' : 'default';
        });
    }

    // Brush color and size
    if (DOMElements.brushColorInput) DOMElements.brushColorInput.addEventListener('input', renderCanvas); // Doesn't need to render, just sets strokeStyle
    if (DOMElements.brushSizeInput) DOMElements.brushSizeInput.addEventListener('input', renderCanvas); // Doesn't need to render, just sets lineWidth

    // Clear Drawings
    if (DOMElements.clearDrawingsBtn) {
        DOMElements.clearDrawingsBtn.addEventListener('click', () => {
            drawings = []; // Clear all drawings
            renderCanvas();
        });
    }


    // Download Strip
    if (DOMElements.downloadStripBtn) {
        DOMElements.downloadStripBtn.addEventListener('click', () => {
            // Show spinner
            if (DOMElements.downloadSpinner) DOMElements.downloadSpinner.classList.remove('hidden-spinner');

            // Ensure the canvas is fully rendered with all current elements
            // A small delay might be needed for images/frames to load, if not already cached
            setTimeout(() => {
                const format = DOMElements.downloadFormatSelect.value;
                const quality = parseFloat(format.split(';')[1]) || 1.0; // Get quality for JPEG
                const mimeType = format.split(';')[0];

                const dataURL = DOMElements.photoStripCanvas.toDataURL(mimeType, quality);
                const a = document.createElement('a');
                a.href = dataURL;
                a.download = `ODZ_PhotoStrip_${new Date().toISOString().slice(0, 10)}.png`; // Default to png
                if (mimeType === 'image/jpeg') {
                    a.download = `ODZ_PhotoStrip_${new Date().toISOString().slice(0, 10)}.jpeg`;
                }
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                // Hide spinner
                if (DOMElements.downloadSpinner) DOMElements.downloadSpinner.classList.add('hidden-spinner');
                logAnalytics('Strip_Downloaded', { format: mimeType, quality: quality });
            }, 100); // Small delay to ensure render completes
        });
    }

    // Print Strip
    if (DOMElements.printStripBtn) {
        DOMElements.printStripBtn.addEventListener('click', () => {
            logAnalytics('Print_Initiated');
            const dataURL = DOMElements.photoStripCanvas.toDataURL('image/png'); // Print as PNG for quality
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print Photo Strip</title>
                        <style>
                            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                            img { max-width: 100%; max-height: 100vh; }
                            @media print {
                                body { margin: 0; }
                                img { width: auto; height: auto; max-width: 100%; max-height: none; }
                            }
                        </style>
                    </head>
                    <body>
                        <img src="${dataURL}" onload="window.print(); window.close();" />
                    </body>
                </html>
            `);
            printWindow.document.close();
        });
    }


    // Retake photos button
    if (DOMElements.retakeBtn) {
        DOMElements.retakeBtn.addEventListener('click', () => {
            sessionStorage.removeItem('capturedImages'); // Clear stored images
            window.location.href = 'capture-page/capture-page.html'; // Redirect to capture page
            logAnalytics('Retake_Photos');
        });
    }
}

// --- Initial Page Load Logic ---

// Main function to initialize the editor page
function initializeEditorPage() {
    console.log("initializeEditorPage called.");

    if (!ctx) {
        console.error("Canvas context is null. Cannot initialize editor page.");
        displayNoPhotosMessage();
        return;
    }

    // Determine layout configuration based on number of photos
    const numPhotos = capturedImages.length;
    if (numPhotos === 0) {
        displayNoPhotosMessage();
        return;
    }
    // Fixed: Ensure currentConfig is set based on available keys or a default if not matching
    const configKey = numPhotos.toString();
    currentConfig = STRIP_LAYOUT_CONFIGS[configKey];

    if (!currentConfig) {
        console.warn(`No specific layout for ${numPhotos} photos. Falling back to default (e.g., 4 photos).`);
        currentConfig = STRIP_LAYOUT_CONFIGS['4']; // Fallback to 4 photos config
        if (!currentConfig) { // If even fallback fails (shouldn't happen with defined configs)
             console.error("Critical: Default config also not found. Cannot proceed.");
             displayNoPhotosMessage();
             return;
        }
    }


    // Set initial frame (first one in the available frames for the current config)
    // Ensure currentFrame is properly set based on config.
    if (currentConfig.availableFrames && currentConfig.availableFrames.length > 0) {
        currentFrame = currentConfig.availableFrames[0];
    } else {
        currentFrame = { id: 'none', src: '' }; // Fallback for no frames
    }

    if (DOMElements.frameSelect) {
        // Populate options for frames and stickers
        populateOptions(DOMElements.frameSelect, currentConfig.availableFrames);
        DOMElements.frameSelect.value = currentFrame.id; // Select the default frame
    }

    const stickerCategories = [
        { optgroup: "Strand Stickers", options: [{ value: "assets/stickers/stem.png", name: "STEM Student" }, { value: "assets/stickers/humss.png", name: "HUMSS Student" }, { value: "assets/stickers/abm.png", name: "ABM Student" }] },
        { optgroup: "Hearts", options: [{ value: "assets/stickers/heart-pink-1.png", name: "heart-pink-1" }, { value: "assets/stickers/heart-pink-2.png", name: "heart-2" }, { value: "assets/stickers/loading-heart.png", name: "loading-heart" }, { value: "assets/stickers/blue-heart.png", name: "blue-heart" }] },
        { optgroup: "Random", options: [{ value: "assets/stickers/bunny.png", name: "bunny-1" }, { value: "assets/stickers/bunny-2.png", name: "bunny-2" }, { value: "assets/stickers/pink-ribbbon.png", name: "pink-ribbon" }, { value: "assets/stickers/flower-bouquet.png", name: "flower-bouquet" }, { value: "assets/stickers/paper-airplane.png", name: "paper-airplane" }, { value: "assets/stickers/star.png", name: "star" }] },
        { optgroup: "XOXO", options: [{ value: "assets/stickers/xoxo.png", name: "xoxo-1" }, { value: "assets/stickers/xoxo-2.png", name: "xoxo-2" }, { value: "assets/stickers/xoxo-3.png", name: "xoxo-3" }] }
    ];
    if (DOMElements.stickerSelect) {
        populateOptions(DOMElements.stickerSelect, stickerCategories);
    }

    // Initialize UI controls with default values
    if (DOMElements.fontSelect) DOMElements.fontSelect.value = DEFAULT_TEXT_SETTINGS.font;
    if (DOMElements.fontSizeInput) DOMElements.fontSizeInput.value = DEFAULT_TEXT_SETTINGS.size;
    if (DOMElements.textColorInput) DOMElements.textColorInput.value = DEFAULT_TEXT_SETTINGS.color;
    if (DOMElements.textShadowColorInput) DOMElements.textShadowColorInput.value = DEFAULT_TEXT_SETTINGS.shadowColor;
    if (DOMElements.textShadowBlurInput) DOMElements.textShadowBlurInput.value = DEFAULT_TEXT_SETTINGS.shadowBlur;
    if (DOMElements.textAlignSelect) DOMElements.textAlignSelect.value = DEFAULT_TEXT_SETTINGS.align;
    if (DOMElements.brushColorInput) DOMElements.brushColorInput.value = DEFAULT_DRAWING_SETTINGS.color;
    if (DOMElements.brushSizeInput) DOMElements.brushSizeInput.value = DEFAULT_DRAWING_SETTINGS.size;

    // Initially disable controls that depend on selection or specific modes
    updateTextControlsFromSelection();
    if (DOMElements.textInput) DOMElements.textInput.disabled = false;
    if (DOMElements.addTextBtn) DOMElements.addTextBtn.disabled = false;

    updateStickerControlsFromSelection(); // This will disable remove sticker button initially
    if (DOMElements.toggleDrawModeBtn) DOMElements.toggleDrawModeBtn.classList.remove('active'); // Ensure draw button isn't active by default

    // NEW: Initialize date/time controls
    if (DOMElements.toggleDateTime) DOMElements.toggleDateTime.checked = showDateTimeOnStrip;

    setupEventListeners(); // Attach all event listeners
    renderCanvas(); // Initial render of the photo strip
    logAnalytics('Editor_Page_Loaded_Successfully', { layout: configKey });
}

// Ensure the `initializeEditorPage` function runs only after the entire HTML document is loaded.
// This prevents errors where JavaScript tries to find elements before they exist on the page.
document.addEventListener('DOMContentLoaded', loadCapturedImages);
