// capture-page/capture.js

// Strict mode for cleaner code
"use strict";

// --- Global State Variables (declared with let, assigned in DOMContentLoaded) ---
let video;
let captureBtnFullscreen;
let captureBtnNormalMode;
let nextBtn;
let photoGrid;
let filterSelect;
let cameraSelect;
let countdownElement; // This element is now mostly redundant, keeping for aria-live if needed
let cameraAccessMessage;
let mainCameraMsg;
let subCameraMsg;   
let cameraLoadingSpinner;
let photoProcessingSpinner; 
let invertCameraButton; 
let backToLayoutBtn; 
let fullscreenToggleBtn; 
let videoPreviewArea; 
let photoboothContainer; 
let actionButtonsDiv; 

// Visual Countdown and Flash Overlay Elements
let visualCountdown;
let flashOverlay;
let getReadyMessage; // NEW: "Get Ready!" Message Element
let postCapturePreview; // NEW: Post-Capture Preview Container
let retakeLastPhotoBtn; // NEW: Retake Last Photo Button
let fullscreenHintOverlay; // NEW: Fullscreen Exit Hint Overlay
let selectedLayoutPreview; // NEW: Layout Preview Placeholder
let captureProgressBar; // NEW: Progress Bar


let photoProgressText; // Photo Progress Text Element

// Audio Elements (declared with let, assigned in DOMContentLoaded)
let countdownBeep;
let cameraShutter;

// Other Global State Variables
let currentStream = null; 
let capturedPhotos = []; 
let photosToCapture = 0; 
let photoFrameAspectRatio = 4 / 3; 

// Web Worker for image processing
let imageProcessorWorker = null;
let offscreenCanvasInstance = null;

// Flag to track user interaction for audio autoplay
let userInteracted = false;

// Variables for fullscreen cursor hiding
let fullscreenTimeout;
const FULLSCREEN_CURSOR_HIDE_DELAY = 3000; // 3 seconds

// --- Utility Functions ---

/**
 * Plays a sound if user interaction has occurred.
 * @param {HTMLAudioElement} audioElem - The audio element to play.
 * @param {number} [volume=1] - The volume (0 to 1).
 */
function playSound(audioElem, volume = 1) {
    if (userInteracted) {
        audioElem.volume = volume;
        audioElem.currentTime = 0; // Rewind to start
        audioElem.play().catch(e => console.error("Error playing sound:", e));
    }
}

/**
 * Displays a message to the user in the camera preview area.
 * @param {string} message - The main message.
 * @param {'info'|'warning'|'error'} type - The type of message for styling (e.g., 'error' for red).
 * @param {string} [subMessage=''] - An optional secondary message for more detail.
 */
function displayCameraMessage(message, type = 'info', subMessage = '') {
    mainCameraMsg.innerText = message;
    subCameraMsg.innerText = subMessage;
    cameraAccessMessage.className = `message ${type}`; 
    cameraAccessMessage.style.display = 'flex'; 
    video.style.display = 'none'; 
    if (countdownElement) countdownElement.style.display = 'none'; // Keep countdownElement hidden
    visualCountdown.style.display = 'none'; 
    getReadyMessage.style.display = 'none'; // Ensure getReadyMessage is hidden
    cameraLoadingSpinner.classList.add('hidden-spinner'); 
}

/**
 * Hides the camera message and displays the video element.
 */
function hideCameraMessage() {
    cameraAccessMessage.style.display = 'none';
    video.style.display = 'block'; 
    cameraLoadingSpinner.classList.add('hidden-spinner'); 
}

/**
 * Shows/hides the camera loading spinner with a message.
 * @param {boolean} show - True to show, false to hide.
 * @param {string} message - The message to display (default: "Warming up the camera...").
 */
function showCameraLoadingSpinner(show, message = "Warming up the camera...") {
    const spinnerMessageElement = cameraLoadingSpinner.querySelector('p');
    if (spinnerMessageElement) {
        spinnerMessageElement.textContent = message;
    }
    if (show) {
        cameraLoadingSpinner.classList.remove('hidden-spinner');
        video.style.display = 'none'; 
        cameraAccessMessage.style.display = 'none'; 
        visualCountdown.style.opacity = 0; 
        getReadyMessage.style.opacity = 0; // Ensure getReadyMessage is hidden
    } else {
        cameraLoadingSpinner.classList.add('hidden-spinner');
        if (cameraAccessMessage.style.display === 'none') {
            video.style.display = 'block';
        }
    }
}

/**
 * Shows/hides the photo processing spinner.
 * @param {boolean} show - True to show, false to hide.
 */
function showPhotoProcessingSpinner(show) {
    if (show) {
        photoProcessingSpinner.classList.remove('hidden-spinner');
    } else {
        photoProcessingSpinner.classList.add('hidden-spinner');
    }
}

/**
 * Disables/enables capture controls (buttons, selects).
 * @param {boolean} disabled - True to disable, false to enable.
 */
function setCaptureControlsEnabled(disabled) {
    filterSelect.disabled = disabled;
    cameraSelect.disabled = disabled;
    invertCameraButton.disabled = disabled; 
    backToLayoutBtn.disabled = disabled;
    fullscreenToggleBtn.disabled = disabled;
    nextBtn.disabled = disabled; 
    captureBtnNormalMode.disabled = disabled;
    captureBtnFullscreen.disabled = disabled;
    retakeLastPhotoBtn.disabled = disabled; // Disable retake button
}

/**
 * Updates the video preview area's aspect ratio based on the chosen photo strip layout.
 * @param {number} aspectRatio - The width/height aspect ratio of a single photo frame.
 */
function updateVideoAspectRatio(aspectRatio) {
    if (videoPreviewArea) {
        videoPreviewArea.style.setProperty('--video-aspect-ratio', `${aspectRatio}`);
    }
    if (imageProcessorWorker) {
        imageProcessorWorker.postMessage({
            type: 'UPDATE_SETTINGS',
            payload: { aspectRatio: aspectRatio }
        });
    }
}

/**
 * Updates the photo progress text (e.g., "Captured: 2 of 4") and progress bar.
 */
function updatePhotoProgressText() {
    photoProgressText.textContent = `Captured: ${capturedPhotos.length} of ${photosToCapture}`;
    
    // Update progress bar
    if (photosToCapture > 0) {
        const progress = (capturedPhotos.length / photosToCapture) * 100;
        captureProgressBar.style.width = `${progress}%`;
    } else {
        captureProgressBar.style.width = '0%';
    }

    if (capturedPhotos.length === photosToCapture && photosToCapture > 0) {
        photoProgressText.textContent += ' - All photos captured!';
        nextBtn.style.display = 'block';
        nextBtn.disabled = false;
        retakeLastPhotoBtn.style.display = 'block'; // Show retake when all captured
    } else if (photosToCapture > 0 && capturedPhotos.length < photosToCapture) {
        photoProgressText.textContent += ` (${photosToCapture - capturedPhotos.length} remaining)`;
        nextBtn.style.display = 'none';
        nextBtn.disabled = true;
        retakeLastPhotoBtn.style.display = capturedPhotos.length > 0 ? 'block' : 'none'; // Show retake if at least one photo
    } else { // No photos to capture or 0 photos captured
        nextBtn.style.display = 'none';
        nextBtn.disabled = true;
        retakeLastPhotoBtn.style.display = 'none';
    }
}

// --- Camera Management ---

/**
 * Populates the camera selection dropdown with available video input devices.
 */
async function populateCameraList() {
    showCameraLoadingSpinner(true); 
    setCaptureControlsEnabled(true); // Temporarily disable controls during camera enumeration

    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        cameraSelect.innerHTML = ''; 

        const videoInputDevices = devices.filter(device => device.kind === 'videoinput');

        if (videoInputDevices.length === 0) {
            displayCameraMessage(
                'No camera found.',
                'error',
                'Please ensure your webcam is connected and enabled, then refresh the page.'
            );
            setCaptureControlsEnabled(true); // Re-enable controls if no camera (user can refresh)
            return;
        }

        videoInputDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Camera ${index + 1}`;
            cameraSelect.appendChild(option);
        });

        if (cameraSelect.options.length > 0) {
            cameraSelect.selectedIndex = 0; 
            await startCamera(cameraSelect.value); // Use await here
        } else {
            displayCameraMessage(
                'No selectable cameras.',
                'error',
                'Despite enumerating devices, no suitable camera could be selected.'
            );
            setCaptureControlsEnabled(true);
        }

    } catch (error) {
        console.error('Error enumerating devices or getting initial permission:', error);
        handleCameraError(error);
        setCaptureControlsEnabled(true);
        showCameraLoadingSpinner(false); 
    }
}

/**
 * Handles common camera access errors and displays appropriate messages.
 * @param {DOMException} error - The error object from navigator.mediaDevices.getUserMedia.
 */
function handleCameraError(error) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        displayCameraMessage(
            'Camera access denied.',
            'error',
            'Please enable camera permissions in your browser settings and refresh the page.'
        );
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        displayCameraMessage(
            'No camera detected.',
            'error',
            'Ensure your webcam is connected/enabled. Check if another app is using it.'
        );
    } else if (error.name === 'NotReadableError') {
        displayCameraMessage(
            'Camera is busy.',
            'warning',
            'Your camera might be in use by another application. Please close other apps and refresh.'
        );
    } else if (error.name === 'SecurityError' && window.location.protocol === 'file:') {
        displayCameraMessage(
            'Camera access requires a secure context.',
            'error',
            'Please open this page using a local server (e.g., via VS Code Live Server) or HTTPS.'
        );
    } else {
        displayCameraMessage(
            'Failed to access camera.',
            'error',
            `An unexpected error occurred: ${error.message}. Please check the browser console.`
        );
    }
}

/**
 * Starts the camera stream for the given device ID.
 */
async function startCamera(deviceId) {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }

    showCameraLoadingSpinner(true); 

    try {
        const constraints = {
            video: {
                deviceId: deviceId ? { exact: deviceId } : undefined,
                width: { ideal: 640, min: 480 }, 
                height: { ideal: 480, min: 360 }  
            },
            audio: false 
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        currentStream = stream;

        video.onloadedmetadata = () => {
            video.play();
            hideCameraMessage();
            setCaptureControlsEnabled(false); 
            showCameraLoadingSpinner(false); 
            initializeImageProcessorWorker();
            toggleCaptureButtonVisibility(); // Initial visibility of the capture button
        };

    } catch (error) {
        console.error('Error starting camera stream:', error);
        handleCameraError(error);
        setCaptureControlsEnabled(true);
        showCameraLoadingSpinner(false); 
    }
}

/**
 * Initializes the Web Worker and OffscreenCanvas.
 */
function initializeImageProcessorWorker() {
    if (imageProcessorWorker) {
        imageProcessorWorker.postMessage({ type: 'CLOSE_WORKER' });
        imageProcessorWorker.terminate();
    }

    const tempCanvas = document.createElement('canvas');
    offscreenCanvasInstance = tempCanvas.transferControlToOffscreen();

    imageProcessorWorker = new Worker('capture-page/image-processor.js');

    imageProcessorWorker.postMessage({
        type: 'INIT',
        payload: {
            canvas: offscreenCanvasInstance,
            aspectRatio: photoFrameAspectRatio
        }
    }, [offscreenCanvasInstance]);

    imageProcessorWorker.onmessage = (event) => {
        if (event.data.type === 'FRAME_PROCESSED') {
            const { blob, indexToReplace } = event.data.payload;

            const reader = new FileReader();
            reader.onloadend = () => {
                const imgData = reader.result;
                handleProcessedPhoto(imgData, indexToReplace);
                showPhotoProcessingSpinner(false);
                // Hide post-capture preview after it's been displayed
                postCapturePreview.style.display = 'none';
                postCapturePreview.src = ''; // Clear source
            };
            reader.readAsDataURL(blob);
        }
    };

    imageProcessorWorker.onerror = (error) => {
        console.error('Main Thread: Web Worker error:', error);
        showPhotoProcessingSpinner(false);
        displayCameraMessage(
            'Photo processing error.',
            'error',
            'A background process failed. Please refresh the page.'
        );
    };

    imageProcessorWorker.postMessage({
        type: 'UPDATE_SETTINGS',
        payload: { filter: filterSelect.value }
    });
}


// --- Photo Capture and Management Logic ---

/**
 * Adds a captured photo to the grid and the capturedPhotos array.
 * @param {string} imgData - Base64 data URL of the image.
 * @param {number} index - The index in the capturedPhotos array this photo belongs to.
 */
function addPhotoToGrid(imgData, index) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('captured-photo-wrapper');
    wrapper.dataset.index = index; 

    const imgElement = document.createElement('img');
    imgElement.src = imgData;
    imgElement.alt = `Captured Photo ${index + 1}`;
    
    wrapper.appendChild(imgElement);

    const existingWrapper = photoGrid.querySelector(`[data-index="${index}"]`);
    if (existingWrapper) {
        photoGrid.replaceChild(wrapper, existingWrapper);
    } else {
        photoGrid.appendChild(wrapper); 
    }
}

/**
 * Renders all photos currently in the capturedPhotos array to the grid.
 * This function is useful if the entire grid needs to be rebuilt.
 */
function renderPhotoGrid() {
    photoGrid.innerHTML = ''; 
    capturedPhotos.forEach((imgData, index) => {
        if (imgData) { 
            addPhotoToGrid(imgData, index);
        }
    });
}

/**
 * Handles the visual countdown display before each photo is taken, including sound effects.
 * @param {number} duration - The duration of the countdown (e.g., 3 for 3-2-1).
 */
function runCountdown(duration) {
    return new Promise(resolve => {
        let count = duration;

        // Hide video and show countdown
        video.style.display = 'none';
        visualCountdown.style.display = 'block'; 
        visualCountdown.textContent = count;
        visualCountdown.classList.add('animate'); 
        visualCountdown.style.opacity = 1; // Ensure it's visible

        // Play the sound for the initial countdown number immediately (e.g., the '3')
        playSound(countdownBeep); 

        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                playSound(countdownBeep); // Play beep for subsequent numbers (e.g., 2, 1)
                visualCountdown.textContent = count;
                visualCountdown.classList.remove('animate');
                void visualCountdown.offsetWidth; // Trigger reflow for animation reset
                visualCountdown.classList.add('animate');
            } else {
                clearInterval(timer);
                visualCountdown.classList.remove('animate'); 
                visualCountdown.style.opacity = 0; 
                visualCountdown.style.display = 'none'; 
                playSound(cameraShutter); // Play shutter sound right before capture
                video.style.display = 'block'; // Show video again after countdown
                resolve();
            }
        }, 1000);
    });
}

/**
 * Sends a video frame to the Web Worker for processing.
 * @param {number} [indexToReplace=-1] - The index in capturedPhotos array to replace. If -1, a new photo is added.
 */
async function sendFrameToWorker(indexToReplace = -1) {
    if (!imageProcessorWorker) {
        console.error('Main Thread: Image processing worker not initialized. Cannot send frame.');
        showPhotoProcessingSpinner(false);
        return;
    }
    
    showPhotoProcessingSpinner(true); 

    try {
        const imageBitmap = await createImageBitmap(video);

        // Display the captured image briefly before processing
        postCapturePreview.src = ''; // Clear previous
        postCapturePreview.style.display = 'block';
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = imageBitmap.width;
        tempCanvas.height = imageBitmap.width / photoFrameAspectRatio; // Use proportional height
        tempCtx.drawImage(imageBitmap, 0, 0, imageBitmap.width, imageBitmap.height, 0, 0, tempCanvas.width, tempCanvas.height);
        postCapturePreview.src = tempCanvas.toDataURL('image/jpeg', 0.8);

        // Hide video feed temporarily
        video.style.display = 'none';

        imageProcessorWorker.postMessage({
            type: 'PROCESS_FRAME',
            payload: { imageBitmap, indexToReplace }
        }, [imageBitmap]); // Transfer imageBitmap ownership
    } catch (error) {
        console.error('Error creating ImageBitmap or sending to worker:', error);
        showPhotoProcessingSpinner(false);
        video.style.display = 'block'; // Ensure video is back
        postCapturePreview.style.display = 'none';
    }
}

/**
 * Handles the photo data received back from the worker.
 * @param {string} imgData - Base64 data URL of the processed image.
 * @param {number} indexToReplace - The index in capturedPhotos array that was processed.
 */
function handleProcessedPhoto(imgData, indexToReplace) {
    if (indexToReplace !== -1 && indexToReplace < capturedPhotos.length) {
        // Replace existing photo
        capturedPhotos[indexToReplace] = imgData; 
        const imgElementInDom = photoGrid.querySelector(`[data-index="${indexToReplace}"] img`); 
        if (imgElementInDom) {
            imgElementInDom.src = imgData;
        }
    } else {
        // Add new photo
        capturedPhotos.push(imgData); 
        addPhotoToGrid(imgData, capturedPhotos.length - 1); 
    }
    updatePhotoProgressText(); 
}

/**
 * Manages the initial photo capture sequence with countdowns and multiple shots.
 */
async function initiateCaptureSequence(indexToRetake = -1) {
    if (!currentStream || video.srcObject === null || video.paused) {
        displayCameraMessage(
            'Camera not active or paused.',
            'warning',
            'Please ensure camera access is granted and the live feed is visible before starting.'
        );
        return;
    }

    // Crucial: Attempt to unlock audio context directly on this user interaction
    if (!userInteracted) {
        try {
            countdownBeep.muted = false;
            cameraShutter.muted = false;
            // Play a very brief, silent sound to explicitly unlock the audio context
            await countdownBeep.play();
            countdownBeep.pause();
            countdownBeep.currentTime = 0;
            userInteracted = true; // Mark as interacted
            console.log("Audio context unlocked by user interaction.");
        } catch (e) {
            console.warn("Audio autoplay blocked by explicit play attempt:", e);
        }
    }

    const storedPhotoCount = localStorage.getItem('selectedPhotoCount');
    photosToCapture = parseInt(storedPhotoCount, 10);

    if (isNaN(photosToCapture) || photosToCapture < 1) {
        photosToCapture = 3; // Default to 3 if invalid
    }

    // Determine how many photos to take in this sequence
    let photosToTakeInThisSequence = 0;
    if (indexToRetake !== -1) {
        // If retaking, we only take one photo
        photosToTakeInThisSequence = 1;
    } else {
        // Otherwise, take remaining photos
        photosToTakeInThisSequence = photosToCapture - capturedPhotos.length;
    }

    if (photosToTakeInThisSequence <= 0) {
        showCustomAlert('All photos have already been captured.', 'Click "Go to Editor" to proceed.');
        return;
    }

    setCaptureControlsEnabled(true); 
    // Hide all action buttons during capture sequence
    document.querySelectorAll('.action-buttons button, .bottom-action-buttons button').forEach(btn => {
        btn.style.display = 'none';
    });

    if (capturedPhotos.length === 0 && indexToRetake === -1) {
        photoGrid.innerHTML = ''; 
        capturedPhotos = [];
    }
    
    // Only set currentCaptureIndex if we are retaking, otherwise it's handled by push
    // For new captures, we'll let `capturedPhotos.push` determine the index.
    const actualIndexToSend = indexToRetake !== -1 ? indexToRetake : -1; 

    for (let i = 0; i < photosToTakeInThisSequence; i++) {
        // Display "Get Ready!" message
        getReadyMessage.style.display = 'block';
        getReadyMessage.classList.add('active'); // Apply animation/styling for visibility
        await new Promise(resolve => setTimeout(resolve, 1500)); // Display for 1.5 seconds
        getReadyMessage.classList.remove('active');
        getReadyMessage.style.display = 'none';

        // Run countdown
        await runCountdown(3);
        
        flashOverlay.classList.add('active');
        setTimeout(() => {
            flashOverlay.classList.remove('active');
        }, 100); 
        
        await sendFrameToWorker(actualIndexToSend); // Pass the index to replace if it's a retake
        
        if (indexToRetake === -1 && capturedPhotos.length < photosToCapture) { // Only delay if not retaking and more photos are needed
            await new Promise(resolve => setTimeout(resolve, 1000)); 
        }
    }

    // After capture sequence, re-enable and show relevant controls
    setCaptureControlsEnabled(false); 
    backToLayoutBtn.style.display = 'block'; 
    fullscreenToggleBtn.style.display = 'block';
    invertCameraButton.style.display = 'block'; 

    // Re-evaluate capture button visibility based on whether all photos are taken
    toggleCaptureButtonVisibility(); 
    updatePhotoProgressText(); 
}

/**
 * Handles selection/deselection of photos in the grid. (Currently not used for any specific selection logic)
 * @param {Event} event - The click event.
 */
function handlePhotoSelection(event) {
    // This function can be expanded later if selecting photos in the grid for other actions is needed.
    const clickedWrapper = event.target.closest('.captured-photo-wrapper');
    if (!clickedWrapper) return;

    // Example: toggle a 'selected' class if single selection was desired
    // const currentlySelected = photoGrid.querySelector('.captured-photo-wrapper.selected');
    // if (currentlySelected && currentlySelected !== clickedWrapper) {
    //     currentlySelected.classList.remove('selected');
    // }
    // clickedWrapper.classList.toggle('selected');
}

/**
 * Initiates the retake of the last captured photo.
 */
function retakeLastPhoto() {
    if (capturedPhotos.length === 0) {
        showCustomAlert('No photo to retake!', 'Please capture at least one photo first.');
        return;
    }

    const lastPhotoIndex = capturedPhotos.length - 1;
    
    // Visually remove the last photo from the grid
    const lastPhotoElement = photoGrid.querySelector(`[data-index="${lastPhotoIndex}"]`);
    if (lastPhotoElement) {
        lastPhotoElement.remove();
    }
    
    // We are not removing it from the array here, instead we pass the index
    // to initiateCaptureSequence so the worker can replace it.
    
    updatePhotoProgressText(); // Update progress text immediately

    // Re-initiate capture sequence, signaling to replace the last photo
    initiateCaptureSequence(lastPhotoIndex);
}

// --- Fullscreen and UI adjustments ---
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        if (videoPreviewArea.requestFullscreen) {
            videoPreviewArea.requestFullscreen();
        } else if (videoPreviewArea.mozRequestFullScreen) {
            videoPreviewArea.mozRequestFullScreen();
        } else if (videoPreviewArea.webkitRequestFullscreen) {
            videoPreviewArea.webkitRequestFullscreen();
        } else if (videoPreviewArea.msRequestFullscreen) {
            videoPreviewArea.msRequestFullscreen();
        }
        document.body.classList.add('fullscreen-active');
        showFullscreenHint();
        initiateCursorHiding();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.exitFullscreen();
        }
        document.body.classList.remove('fullscreen-active');
        clearTimeout(fullscreenTimeout); // Clear any pending cursor hide
        document.body.style.cursor = 'default'; // Ensure cursor is visible
    }
}

/**
 * Shows the fullscreen exit hint overlay temporarily.
 */
function showFullscreenHint() {
    if (!fullscreenHintOverlay) return; // Defensive check
    fullscreenHintOverlay.style.display = 'block';
    setTimeout(() => {
        fullscreenHintOverlay.style.display = 'none';
    }, 5000); // Display for 5 seconds
}

/**
 * Initiates cursor hiding on inactivity in fullscreen mode.
 */
function initiateCursorHiding() {
    clearTimeout(fullscreenTimeout);
    document.body.style.cursor = 'default'; // Always show cursor on movement

    const hideCursor = () => {
        if (document.fullscreenElement) {
            document.body.style.cursor = 'none';
        }
    };

    fullscreenTimeout = setTimeout(hideCursor, FULLSCREEN_CURSOR_HIDE_DELAY);

    // Reset timeout on mouse movement
    document.addEventListener('mousemove', () => {
        clearTimeout(fullscreenTimeout);
        document.body.style.cursor = 'default';
        if (document.fullscreenElement) {
            fullscreenTimeout = setTimeout(hideCursor, FULLSCREEN_CURSOR_HIDE_DELAY);
        }
    });
}

/**
 * Manages the visibility of the two capture buttons based on fullscreen mode and capture state.
 */
function toggleCaptureButtonVisibility() {
    if (document.fullscreenElement) {
        // In fullscreen: hide normal mode button, show fullscreen button
        if (captureBtnNormalMode) captureBtnNormalMode.style.display = 'none';
        if (captureBtnFullscreen) captureBtnFullscreen.style.display = 'block';
        // Disable fullscreen capture button if all photos are taken
        if (captureBtnFullscreen) {
             captureBtnFullscreen.disabled = (capturedPhotos.length === photosToCapture && photosToCapture > 0);
        }
    } else {
        // Not in fullscreen: show normal mode button, hide fullscreen button
        if (captureBtnNormalMode) captureBtnNormalMode.style.display = 'block';
        if (captureBtnFullscreen) captureBtnFullscreen.style.display = 'none';
        // Disable normal mode capture button if all photos are taken
        if (captureBtnNormalMode) {
            captureBtnNormalMode.disabled = (capturedPhotos.length === photosToCapture && photosToCapture > 0);
        }
    }
}


// Custom alert box instead of native alert
function showCustomAlert(title, message) {
    const alertModal = document.createElement('div');
    alertModal.classList.add('custom-alert-modal');
    alertModal.innerHTML = `
        <div class="custom-alert-content">
            <div class="custom-alert-header">
                <h3>${title}</h3>
                <button class="custom-alert-close-btn">&times;</button>
            </div>
            <p>${message}</p>
            <button class="custom-alert-ok-btn">OK</button>
        </div>
    `;
    document.body.appendChild(alertModal);

    const closeAlert = () => {
        alertModal.remove();
    };

    alertModal.querySelector('.custom-alert-close-btn').addEventListener('click', closeAlert);
    alertModal.querySelector('.custom-alert-ok-btn').addEventListener('click', closeAlert);

    // Close on escape key
    const escapeListener = (event) => {
        if (event.key === 'Escape') {
            closeAlert();
            document.removeEventListener('keydown', escapeListener);
        }
    };
    document.addEventListener('keydown', escapeListener);
}

/**
 * Dynamically generates a visual representation of the selected layout.
 */
function displaySelectedLayoutPreview() {
    if (!selectedLayoutPreview) return; // Defensive check

    const storedPhotoCount = localStorage.getItem('selectedPhotoCount');
    const count = parseInt(storedPhotoCount, 10);

    selectedLayoutPreview.innerHTML = ''; // Clear previous content
    selectedLayoutPreview.classList.remove('layout-1', 'layout-2', 'layout-3', 'layout-4', 'layout-6');

    if (isNaN(count) || count < 1) {
        selectedLayoutPreview.textContent = 'Layout: Not selected';
        return;
    }

    selectedLayoutPreview.classList.add(`layout-${count}`);
    let boxesHtml = '';
    for (let i = 0; i < count; i++) {
        boxesHtml += '<div class="layout-box"></div>';
    }
    selectedLayoutPreview.innerHTML = `Layout: ${count} photos<div class="layout-preview-boxes">${boxesHtml}</div>`;
}


// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', async () => {
    // Assign DOM element references here
    video = document.getElementById('cameraFeed');
    captureBtnFullscreen = document.getElementById('captureBtn'); 
    captureBtnNormalMode = document.getElementById('captureBtnNormalMode'); 
    nextBtn = document.getElementById('nextBtn');
    photoGrid = document.getElementById('captured-photos-grid');
    filterSelect = document.getElementById('filter');
    cameraSelect = document.getElementById('cameraSelect');
    countdownElement = document.getElementById('countdown'); 
    cameraAccessMessage = document.getElementById('camera-access-message');
    mainCameraMsg = document.getElementById('main-camera-msg'); 
    subCameraMsg = document.getElementById('sub-camera-msg');   
    cameraLoadingSpinner = document.getElementById('camera-loading-spinner'); 
    photoProcessingSpinner = document.getElementById('photo-processing-spinner'); 
    invertCameraButton = document.getElementById('invertCameraButton'); 
    backToLayoutBtn = document.getElementById('backToLayoutBtn'); 
    fullscreenToggleBtn = document.getElementById('fullscreenToggleBtn'); 
    videoPreviewArea = document.querySelector('.video-preview-area'); 
    photoboothContainer = document.querySelector('.photobooth-container'); 
    actionButtonsDiv = document.querySelector('.action-buttons'); 

    visualCountdown = document.getElementById('visualCountdown');
    flashOverlay = document.getElementById('flashOverlay');
    getReadyMessage = document.getElementById('getReadyMessage');
    postCapturePreview = document.getElementById('postCapturePreview');
    retakeLastPhotoBtn = document.getElementById('retakeLastPhotoBtn');
    fullscreenHintOverlay = document.getElementById('fullscreenHintOverlay');
    selectedLayoutPreview = document.getElementById('selectedLayoutPreview');
    captureProgressBar = document.getElementById('captureProgressBar');
    photoProgressText = document.getElementById('photoProgressText');
    countdownBeep = document.getElementById('countdownBeep');
    cameraShutter = document.getElementById('cameraShutter');

    // Proceed with initialization only after elements are assigned
    localStorage.removeItem('capturedPhotos'); 
    photoGrid.innerHTML = ''; 

    const storedAspectRatio = localStorage.getItem('selectedFrameAspectRatio');
    if (storedAspectRatio) {
        photoFrameAspectRatio = parseFloat(storedAspectRatio);
        updateVideoAspectRatio(photoFrameAspectRatio);
    } else {
        updateVideoAspectRatio(4 / 3); 
    }

    displaySelectedLayoutPreview(); // Display selected layout on load
    updatePhotoProgressText(); 
    toggleCaptureButtonVisibility(); // Initial call to set button visibility

    // Initial audio context unlock attempt on the very first DOM interaction
    const unlockAudioContext = async () => {
        if (!userInteracted && countdownBeep && cameraShutter) { // Check if elements exist
            try {
                // For browsers that require a real play to unlock
                countdownBeep.muted = false;
                cameraShutter.muted = false;
                await countdownBeep.play();
                countdownBeep.pause();
                countdownBeep.currentTime = 0;
                userInteracted = true;
                console.log("Audio context unlocked on initial click.");
            } catch (e) {
                console.warn("Initial audio context unlock failed:", e);
            }
        }
        document.removeEventListener('click', unlockAudioContext);
        document.removeEventListener('touchend', unlockAudioContext);
    };

    // Attach click/touchend listeners to the document for the initial audio unlock
    document.addEventListener('click', unlockAudioContext, { once: true });
    document.addEventListener('touchend', unlockAudioContext, { once: true });

    await populateCameraList(); // Ensure cameras are listed and started

    // Attach event listeners now that elements are guaranteed to exist
    cameraSelect.addEventListener('change', async (event) => {
        await startCamera(event.target.value);
    });

    filterSelect.addEventListener('change', () => {
        const selectedFilter = filterSelect.value;
        video.style.filter = selectedFilter; 
        if (imageProcessorWorker) {
            imageProcessorWorker.postMessage({
                type: 'UPDATE_SETTINGS',
                payload: { filter: selectedFilter }
            });
        }
    });

    captureBtnNormalMode.addEventListener('click', () => {
        initiateCaptureSequence(); 
    });

    captureBtnFullscreen.addEventListener('click', () => {
        initiateCaptureSequence(); 
    });

    retakeLastPhotoBtn.addEventListener('click', retakeLastPhoto);

    nextBtn.addEventListener('click', () => {
        if (capturedPhotos.length > 0 && capturedPhotos.length === photosToCapture) { 
            localStorage.setItem('capturedPhotos', JSON.stringify(capturedPhotos));
            window.location.href = 'editing-page/editing-home.html';
        } else {
            const remaining = photosToCapture - capturedPhotos.length;
            showCustomAlert('Action Required!', `Please capture ${remaining} more photo(s) before proceeding!`); 
        }
    });

    photoGrid.addEventListener('click', handlePhotoSelection);

    invertCameraButton.addEventListener('click', () => {
        video.classList.toggle('inverted');
    });

    backToLayoutBtn.addEventListener('click', () => {
        window.location.href = 'layout-selection/layout-selection.html'; 
    });

    fullscreenToggleBtn.addEventListener('click', toggleFullScreen);
    
    // Listen for fullscreen change events to update UI
    document.addEventListener('fullscreenchange', toggleCaptureButtonVisibility);

    window.addEventListener('beforeunload', () => {
        if (imageProcessorWorker) {
            imageProcessorWorker.postMessage({ type: 'CLOSE_WORKER' });
            imageProcessorWorker.terminate();
            imageProcessorWorker = null;
        }
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            currentStream = null;
        }
    });
});
