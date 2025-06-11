// capture-page/capture.js

// Strict mode for cleaner code
"use strict";

// --- DOM Element References ---
const video = document.getElementById('cameraFeed');
// Renamed captureBtn to captureBtnFullscreen to reflect its primary role
const captureBtnFullscreen = document.getElementById('captureBtn'); 
// New reference for the button visible in normal mode
const captureBtnNormalMode = document.getElementById('captureBtnNormalMode'); 

const nextBtn = document.getElementById('nextBtn');
const photoGrid = document.getElementById('captured-photos-grid');
const filterSelect = document.getElementById('filter');
const cameraSelect = document.getElementById('cameraSelect');
const countdownElement = document.getElementById('countdown'); 
const cameraAccessMessage = document.getElementById('camera-access-message');
const mainCameraMsg = document.getElementById('main-camera-msg'); 
const subCameraMsg = document.getElementById('sub-camera-msg');   

const cameraLoadingSpinner = document.getElementById('camera-loading-spinner'); 
const photoProcessingSpinner = document.getElementById('photo-processing-spinner'); 

const invertCameraButton = document.getElementById('invertCameraButton'); 
const backToLayoutBtn = document.getElementById('backToLayoutBtn'); 
const fullscreenToggleBtn = document.getElementById('fullscreenToggleBtn'); 
const videoPreviewArea = document.querySelector('.video-preview-area'); 
const photoboothContainer = document.querySelector('.photobooth-container'); 
const actionButtonsDiv = document.querySelector('.action-buttons'); // New: Reference to the action-buttons div

// NEW DOM Element References
const getReadyMessage = document.getElementById('getReadyMessage'); // "Get Ready!" message
const postCapturePreview = document.getElementById('postCapturePreview'); // Post-capture temporary preview
const retakeLastPhotoBtn = document.getElementById('retakeLastPhotoBtn'); // Retake button
const captureProgressBar = document.getElementById('captureProgressBar'); // Progress bar container
const captureProgressFill = captureProgressBar ? captureProgressBar.querySelector('.progress-fill') : null; // Progress bar fill
const fullscreenHintOverlay = document.getElementById('fullscreenHintOverlay'); // Fullscreen exit hint
const selectedLayoutPreview = document.getElementById('selectedLayoutPreview'); // Layout preview placeholder

// Visual Countdown and Flash Overlay Elements
const visualCountdown = document.getElementById('visualCountdown');
const flashOverlay = document.getElementById('flashOverlay');

// Photo Progress Text Element
const photoProgressText = document.getElementById('photoProgressText');

// Audio Elements
const countdownBeep = document.getElementById('countdownBeep');
const cameraShutter = document.getElementById('cameraShutter');

// --- Global State Variables ---
let currentStream = null; 
let capturedPhotos = []; 
let photosToCapture = 0; 
let photosCapturedCount = 0; 
let photoFrameAspectRatio = 4 / 3; 

// NEW: Web Worker for image processing
let imageProcessorWorker = null;
let offscreenCanvasInstance = null;

// Flag to track user interaction for audio autoplay
let userInteracted = false;
let audioContext = null; // Declare AudioContext here

// --- Utility Functions ---

/**
 * Ensures AudioContext is resumed on first user interaction.
 */
function ensureAudioContextResumed() {
    if (!userInteracted) {
        // Initialize AudioContext on first interaction
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('AudioContext resumed successfully!');
                userInteracted = true;
            }).catch(e => console.error("Error resuming AudioContext:", e));
        } else {
            userInteracted = true;
        }
    }
}

/**
 * Plays a sound if user interaction has occurred.
 * @param {HTMLAudioElement} audioElem - The audio element to play.
 * @param {number} [volume=1] - The volume (0 to 1).
 */
function playSound(audioElem, volume = 1) {
    if (userInteracted) { // Only play if user has interacted and AudioContext is resumed
        audioElem.volume = volume;
        audioElem.currentTime = 0; // Rewind to start
        audioElem.play().catch(e => console.error("Error playing sound:", e));
    } else {
        // If no interaction yet, attempt to resume AudioContext and then play
        ensureAudioContextResumed();
        // Play again immediately if AudioContext was resumed, otherwise it will play on next interaction
        if (userInteracted) { 
            audioElem.volume = volume;
            audioElem.currentTime = 0;
            audioElem.play().catch(e => console.error("Error playing sound (after context resume attempt):", e));
        }
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
    countdownElement.style.display = 'none'; 
    visualCountdown.style.display = 'none'; 
    cameraLoadingSpinner.classList.add('hidden-spinner'); 
    getReadyMessage.style.display = 'none'; // Ensure "Get Ready" is hidden
    postCapturePreview.style.display = 'none'; // Ensure post-capture preview is hidden
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
 * Shows/hides the camera loading spinner.
 * @param {boolean} show - True to show, false to hide.
 * @param {string} [message="Loading Camera..."] - Message to display with the spinner.
 */
function showCameraLoadingSpinner(show, message = "Loading Camera...") {
    const spinnerP = cameraLoadingSpinner.querySelector('p');
    if (spinnerP) {
        spinnerP.textContent = message; // Update the message
    }
    if (show) {
        cameraLoadingSpinner.classList.remove('hidden-spinner');
        video.style.display = 'none'; 
        cameraAccessMessage.style.display = 'none'; 
        visualCountdown.style.opacity = 0; 
        getReadyMessage.style.display = 'none'; 
        postCapturePreview.style.display = 'none';
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
    captureBtnFullscreen.disabled = disabled; // Disable fullscreen capture button
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
 * Updates the photo progress text (e.g., "Captured: 2 of 4").
 * Also updates the visual progress bar.
 */
function updatePhotoProgressText() {
    photoProgressText.textContent = `Captured: ${capturedPhotos.length} of ${photosToCapture}`;
    if (photosToCapture > 0 && capturedPhotos.length === photosToCapture) {
        photoProgressText.textContent += ' - All photos captured!';
    } else if (photosToCapture > 0 && capturedPhotos.length < photosToCapture) {
        photoProgressText.textContent += ` (${photosToCapture - capturedPhotos.length} remaining)`;
    }
    
    // Update progress bar
    if (captureProgressFill && photosToCapture > 0) {
        const progress = (capturedPhotos.length / photosToCapture) * 100;
        captureProgressFill.style.width = `${progress}%`;
    } else if (captureProgressFill) {
        captureProgressFill.style.width = '0%';
    }

    // Control "Go to Editor" button visibility
    if (capturedPhotos.length === photosToCapture && photosToCapture > 0) {
        nextBtn.style.display = 'block';
        nextBtn.disabled = false;
    } else {
        nextBtn.style.display = 'none';
        nextBtn.disabled = true;
    }

    // Control "Retake Last Photo" button visibility
    if (capturedPhotos.length > 0) {
        retakeLastPhotoBtn.style.display = 'block';
    } else {
        retakeLastPhotoBtn.style.display = 'none';
    }
}

/**
 * Toggles the visibility of the capture buttons based on fullscreen mode.
 */
function toggleCaptureButtonVisibility() {
    if (document.fullscreenElement) {
        captureBtnNormalMode.style.display = 'none';
        captureBtnFullscreen.style.display = 'block';
    } else {
        captureBtnNormalMode.style.display = 'block';
        captureBtnFullscreen.style.display = 'none';
    }
}

// --- Camera Management ---

/**
 * Populates the camera selection dropdown with available video input devices.
 */
async function populateCameraList() {
    showCameraLoadingSpinner(true, "Warming up the camera..."); 
    setCaptureControlsEnabled(true); 

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
            setCaptureControlsEnabled(true);
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
            startCamera(cameraSelect.value); 
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

    showCameraLoadingSpinner(true, "Starting camera feed..."); 

    try {
        const constraints = {
            video: {
                deviceId: deviceId ? { exact: deviceId } : undefined,
                width: { ideal: 1280, min: 640 }, // Increased ideal resolution for better quality
                height: { ideal: 720, min: 480 }  
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
            updatePhotoProgressText(); // Update progress on load
            renderSelectedLayoutPreview(); // Render layout preview on load
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
            // Display post-capture preview
            const imageUrl = URL.createObjectURL(blob);
            postCapturePreview.src = imageUrl;
            postCapturePreview.style.display = 'block';
            video.style.display = 'none'; // Hide live feed temporarily

            setTimeout(() => {
                URL.revokeObjectURL(imageUrl); // Clean up Blob URL
                postCapturePreview.style.display = 'none';
                video.style.display = 'block'; // Show live feed again
                showPhotoProcessingSpinner(false);
                handleProcessedPhoto(blob, indexToReplace); // Pass blob directly
            }, 1000); // Display for 1 second
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

    imageProcessorWorker.postMessage({ type: 'UPDATE_SETTINGS', payload: { filter: filterSelect.value } });
}

// --- Photo Capture and Management Logic ---

/**
 * Adds a captured photo to the grid and the capturedPhotos array.
 * @param {Blob} photoBlob - The Blob of the image.
 * @param {number} index - The index in the capturedPhotos array this photo belongs to.
 */
function addPhotoToGrid(photoBlob, index) {
    const imageUrl = URL.createObjectURL(photoBlob);

    const wrapper = document.createElement('div');
    wrapper.classList.add('captured-photo-item'); // Changed class for better styling
    wrapper.dataset.index = index;

    const imgElement = document.createElement('img');
    imgElement.src = imageUrl;
    imgElement.alt = `Captured Photo ${index + 1}`;
    wrapper.appendChild(imgElement);

    const existingWrapper = photoGrid.querySelector(`[data-index="${index}"]`);
    if (existingWrapper) {
        // Revoke old URL before replacing
        const oldImg = existingWrapper.querySelector('img');
        if (oldImg && oldImg.src) {
            URL.revokeObjectURL(oldImg.src);
        }
        photoGrid.replaceChild(wrapper, existingWrapper);
    } else {
        photoGrid.appendChild(wrapper);
    }

    // Store Blob URL or Blob in capturedPhotos array
    // Storing the Blob directly is better for potential re-processing/saving later
    capturedPhotos[index] = photoBlob; 
}

/**
 * Renders all photos currently in the capturedPhotos array to the grid.
 * This is especially useful after retake or initial load if photos were saved.
 */
function renderPhotoGrid() {
    photoGrid.innerHTML = '';
    capturedPhotos.forEach((photoBlob, index) => {
        if (photoBlob) {
            addPhotoToGrid(photoBlob, index);
        }
    });
}

/**
 * Handles the photo data received back from the worker.
 * @param {Blob} photoBlob - The Blob of the processed image.
 * @param {number} indexToReplace - The index in capturedPhotos array that was processed.
 */
function handleProcessedPhoto(photoBlob, indexToReplace) {
    if (indexToReplace !== -1) {
        // Retake scenario: replace existing photo
        capturedPhotos[indexToReplace] = photoBlob;
        addPhotoToGrid(photoBlob, indexToReplace); // Update the specific image in the grid
        console.log(`Replaced photo at index ${indexToReplace}`);
    } else {
        // Normal capture scenario: add new photo
        capturedPhotos.push(photoBlob);
        addPhotoToGrid(photoBlob, capturedPhotos.length - 1);
        console.log(`Added new photo. Total: ${capturedPhotos.length}`);
    }
    updatePhotoProgressText();
    setCaptureControlsEnabled(false); // Re-enable controls after capture sequence
}


/**
 * Handles the visual countdown display before each photo is taken, including sound effects.
 * @param {number} duration - The duration of the countdown (e.g., 3 for 3-2-1).
 */
async function runCountdown(duration) {
    setCaptureControlsEnabled(true); // Disable controls during countdown and capture
    video.style.filter = filterSelect.value; // Apply selected filter visually
    
    // Display "Get Ready!" message
    getReadyMessage.style.display = 'flex';
    getReadyMessage.setAttribute('aria-live', 'polite'); // Announce "Get Ready!"
    await new Promise(resolve => setTimeout(resolve, 1500)); // Display for 1.5 seconds
    getReadyMessage.style.display = 'none';
    getReadyMessage.removeAttribute('aria-live');

    visualCountdown.style.opacity = 1;
    visualCountdown.style.display = 'block';
    visualCountdown.setAttribute('aria-live', 'polite'); // Announce countdown numbers

    let count = duration;
    visualCountdown.textContent = count;
    visualCountdown.classList.add('animate');
    playSound(countdownBeep);

    return new Promise(resolve => {
        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                playSound(countdownBeep);
                visualCountdown.textContent = count;
                visualCountdown.classList.remove('animate');
                void visualCountdown.offsetWidth; // Trigger reflow for animation reset
                visualCountdown.classList.add('animate');
            } else {
                clearInterval(timer);
                visualCountdown.classList.remove('animate');
                visualCountdown.style.opacity = 0;
                visualCountdown.style.display = 'none';
                visualCountdown.removeAttribute('aria-live');
                playSound(cameraShutter); // Play shutter sound right before capture
                resolve();
            }
        }, 1000);
    });
}

/**
 * Initiates the full capture sequence for a single photo.
 * @param {number} [indexToReplace=-1] - If retaking, the index of the photo to replace.
 */
async function initiateCaptureSequence(indexToReplace = -1) {
    if (!currentStream) {
        displayCameraMessage('Camera not ready.', 'warning', 'Please wait for camera to load or refresh.');
        return;
    }

    setCaptureControlsEnabled(true); // Disable controls during sequence

    try {
        if (indexToReplace === -1 && capturedPhotos.length >= photosToCapture) {
            alert('You have captured all required photos. Go to editor or retake a photo.');
            setCaptureControlsEnabled(false);
            return;
        }

        await runCountdown(3); 
        await flashOverlayEffect();
        await sendFrameToWorker(indexToReplace); // Pass indexToReplace to worker
        // handleProcessedPhoto is called by the worker's onmessage event
    } catch (error) {
        console.error("Capture sequence error:", error);
        displayCameraMessage(
            'Capture failed.',
            'error',
            `An error occurred during photo capture: ${error.message}`
        );
        setCaptureControlsEnabled(false); // Re-enable controls on error
        showPhotoProcessingSpinner(false);
    }
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
        imageProcessorWorker.postMessage({
            type: 'PROCESS_FRAME',
            payload: { imageBitmap, filter: filterSelect.value, indexToReplace } // Pass filter and indexToReplace
        }, [imageBitmap]);
    } catch (error) {
        console.error('Error creating ImageBitmap or posting to worker:', error);
        showPhotoProcessingSpinner(false);
        displayCameraMessage(
            'Image processing error.',
            'error',
            `Could not process video frame: ${error.message}`
        );
    }
}

/**
 * Simulates a camera flash effect.
 */
function flashOverlayEffect() {
    return new Promise(resolve => {
        flashOverlay.style.display = 'block';
        flashOverlay.style.opacity = '1';
        setTimeout(() => {
            flashOverlay.style.opacity = '0';
            setTimeout(() => {
                flashOverlay.style.display = 'none';
                resolve();
            }, 300); // Duration of fade-out
        }, 100); // Duration of full brightness
    });
}

/**
 * Handles selection of an already captured photo for potential re-ordering or deletion.
 * (Currently just logs, can be expanded for editing features)
 * @param {Event} event - The click event.
 */
function handlePhotoSelection(event) {
    const photoWrapper = event.target.closest('.captured-photo-item');
    if (photoWrapper) {
        const index = parseInt(photoWrapper.dataset.index);
        console.log('Photo selected:', capturedPhotos[index], 'at index:', index);
        // Implement logic for editing/deleting selected photo later
    }
}

/**
 * Removes the last captured photo and initiates a retake.
 */
function retakeLastPhoto() {
    if (capturedPhotos.length > 0) {
        const removedPhotoBlob = capturedPhotos.pop(); // Remove last photo from array
        // Revoke URL if it was a Blob URL
        if (removedPhotoBlob instanceof Blob) {
            // No need to revoke if we store Blob directly, only if storing Blob URLs.
            // If `addPhotoToGrid` creates Blob URL, revoke here.
        }

        const lastPhotoElement = photoGrid.lastElementChild;
        if (lastPhotoElement) {
            photoGrid.removeChild(lastPhotoElement); // Remove from DOM
        }
        
        updatePhotoProgressText(); // Update progress and button visibility
        console.log(`Retaking last photo. Photos remaining: ${capturedPhotos.length}`);
        
        // Initiate a capture sequence to replace the photo at the now empty last index
        initiateCaptureSequence(capturedPhotos.length); // Pass the index where the new photo should go
    } else {
        alert('No photos to retake!');
    }
}

/**
 * Toggles fullscreen mode for the photobooth container.
 */
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        photoboothContainer.requestFullscreen().then(() => {
            // Show fullscreen hint
            fullscreenHintOverlay.style.display = 'flex';
            setTimeout(() => {
                fullscreenHintOverlay.style.display = 'none';
            }, 5000); // Display for 5 seconds
            addFullscreenCursorHiding(); // Add cursor hiding
        }).catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message} (${err.name})`);
            alert('Fullscreen mode could not be activated. Your browser may block it or an error occurred.');
        });
    } else {
        document.exitFullscreen().then(() => {
            removeFullscreenCursorHiding(); // Remove cursor hiding
        }).catch(err => {
            console.error(`Error attempting to exit fullscreen: ${err.message} (${err.name})`);
        });
    }
}

// Fullscreen cursor hiding variables
let cursorHideTimeout;
function addFullscreenCursorHiding() {
    document.documentElement.style.cursor = ''; // Ensure cursor is visible initially
    document.addEventListener('mousemove', handleCursorMovement);
    document.addEventListener('keydown', handleCursorMovement); // Keyboard activity also shows cursor
    resetCursorHideTimeout();
}

function removeFullscreenCursorHiding() {
    document.documentElement.style.cursor = ''; // Ensure cursor is visible
    clearTimeout(cursorHideTimeout);
    document.removeEventListener('mousemove', handleCursorMovement);
    document.removeEventListener('keydown', handleCursorMovement);
}

function handleCursorMovement() {
    document.documentElement.style.cursor = ''; // Show cursor
    resetCursorHideTimeout();
}

function resetCursorHideTimeout() {
    clearTimeout(cursorHideTimeout);
    cursorHideTimeout = setTimeout(() => {
        document.documentElement.style.cursor = 'none'; // Hide cursor
    }, 3000); // Hide after 3 seconds of inactivity
}


/**
 * Renders a visual representation of the selected photo layout.
 */
function renderSelectedLayoutPreview() {
    selectedLayoutPreview.innerHTML = ''; // Clear previous preview
    const savedPhotoCount = localStorage.getItem('selectedPhotoCount');
    if (savedPhotoCount) {
        photosToCapture = parseInt(savedPhotoCount, 10);
        let layoutClass = '';
        switch(photosToCapture) {
            case 1: layoutClass = 'layout-1'; break;
            case 2: layoutClass = 'layout-2'; break;
            case 3: layoutClass = 'layout-3'; break;
            case 4: layoutClass = 'layout-4'; break;
            default: layoutClass = 'layout-4'; photosToCapture = 4; // Default to 4 if invalid
        }
        selectedLayoutPreview.classList.add('layout-preview-container', layoutClass);

        for (let i = 0; i < photosToCapture; i++) {
            const box = document.createElement('div');
            box.classList.add('layout-box');
            selectedLayoutPreview.appendChild(box);
        }
    } else {
        // Default to 4 photos if no layout is selected (e.g., direct access)
        photosToCapture = 4;
        selectedLayoutPreview.classList.add('layout-preview-container', 'layout-4');
        for (let i = 0; i < photosToCapture; i++) {
            const box = document.createElement('div');
            box.classList.add('layout-box');
            selectedLayoutPreview.appendChild(box);
        }
        console.warn("No selectedPhotoCount found in localStorage. Defaulting to 4 photos.");
    }
}


// --- Event Listeners ---

// Use a single event listener for initial user interaction to unlock AudioContext
document.addEventListener('click', ensureAudioContextResumed, { once: true });
document.addEventListener('keydown', ensureAudioContextResumed, { once: true });


cameraSelect.addEventListener('change', (event) => {
    startCamera(event.target.value);
});

filterSelect.addEventListener('change', (event) => {
    // Apply filter directly to the video feed for live preview
    video.style.filter = event.target.value;
    // Also inform the worker about the new filter
    if (imageProcessorWorker) {
        imageProcessorWorker.postMessage({
            type: 'UPDATE_SETTINGS',
            payload: { filter: event.target.value }
        });
    }
});

// Use the normal mode capture button for clicks when not in fullscreen
captureBtnNormalMode.addEventListener('click', () => {
    initiateCaptureSequence(); 
});

// Use the fullscreen capture button for clicks when in fullscreen
captureBtnFullscreen.addEventListener('click', () => {
    initiateCaptureSequence(); 
});

nextBtn.addEventListener('click', () => {
    if (capturedPhotos.length > 0 && capturedPhotos.length === photosToCapture) { 
        // Before saving, convert Blob to Data URL if needed for localStorage
        // Note: For large images, localStorage might hit limits. Consider IndexedDB or alternative.
        const photosForStorage = capturedPhotos.map(blob => {
            // This is a synchronous read, so it will block. 
            // For production, consider using FileReader in a promise or IndexedDB.
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            return new Promise(resolve => {
                reader.onloadend = () => resolve(reader.result);
            });
        });

        Promise.all(photosForStorage).then(dataUrls => {
            localStorage.setItem('capturedPhotos', JSON.stringify(dataUrls));
            window.location.href = 'editing-page/editing-home.html';
        }).catch(e => {
            console.error("Error preparing photos for storage:", e);
            alert("An error occurred while preparing photos for the editor.");
        });
    } else {
        const remaining = photosToCapture - capturedPhotos.length;
        alert(`Please capture ${remaining} more photo(s) before proceeding!`); 
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

retakeLastPhotoBtn.addEventListener('click', retakeLastPhoto); // New event listener for retake button

// Handle fullscreen change events to update UI
document.addEventListener('fullscreenchange', toggleCaptureButtonVisibility);
document.addEventListener('webkitfullscreenchange', toggleCaptureButtonVisibility);
document.addEventListener('mozfullscreenchange', toggleCaptureButtonVisibility);
document.addEventListener('MSFullscreenChange', toggleCaptureButtonVisibility);


window.addEventListener('beforeunload', () => {
    if (imageProcessorWorker) {
        imageProcessorWorker.postMessage({ type: 'CLOSE_WORKER' });
        imageProcessorWorker.terminate();
        imageProcessorWorker = null;
    }
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
    // Revoke all Blob URLs to prevent memory leaks if not handled by page unload
    capturedPhotos.forEach(blob => {
        if (blob instanceof Blob) {
            // If storing Blob directly, no URL to revoke here.
            // If you created Blob URLs and stored them, revoke them here.
        }
    });
});

// Initial setup on page load
document.addEventListener('DOMContentLoaded', () => {
    populateCameraList(); // Start camera detection
    updatePhotoProgressText(); // Initialize progress display
    renderSelectedLayoutPreview(); // Display initial layout
    // Ensure initial state of capture buttons is correct
    toggleCaptureButtonVisibility(); 
});
