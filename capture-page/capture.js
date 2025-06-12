// capture-page/capture.js

// Strict mode for cleaner code
"use strict";

// --- DOM Element References ---
const video = document.getElementById('cameraFeed');
const captureBtnFullscreen = document.getElementById('captureBtn'); // Fullscreen capture button
const captureBtnNormalMode = document.getElementById('captureBtnNormalMode'); // Normal mode capture button
const nextBtn = document.getElementById('nextBtn');
const photoGrid = document.getElementById('captured-photos-grid');
const filterSelect = document.getElementById('filter');
const cameraSelect = document.getElementById('cameraSelect');
const countdownElement = document.getElementById('countdown');
const cameraAccessMessage = document.getElementById('camera-access-message');
const mainCameraMsg = document.getElementById('main-camera-msg');
const subCameraMsg = document.getElementById('sub-camera-msg');
const photoProgressText = document.getElementById('photoProgressText'); // Assuming you have this element in HTML

const cameraLoadingSpinner = document.getElementById('camera-loading-spinner');
const photoProcessingSpinner = document.getElementById('photo-processing-spinner');

const invertCameraButton = document.getElementById('invertCameraButton');
const backToLayoutBtn = document.getElementById('backToLayoutBtn');
const fullscreenToggleBtn = document.getElementById('fullscreenToggleBtn');
const videoPreviewArea = document.querySelector('.video-preview-area');
const photoboothContainer = document.querySelector('.photobooth-container');
const actionButtonsDiv = document.querySelector('.action-buttons');

const retakePhotoBtn = document.getElementById('retakePhotoBtn');
const confirmPhotosBtn = document.getElementById('confirmPhotosBtn');

// Visual Countdown and Flash Overlay Elements
const visualCountdown = document.getElementById('visualCountdown');
const flashOverlay = document.getElementById('flashOverlay');

// Audio Elements
const countdownBeep = document.getElementById('countdownBeep');
const cameraShutter = document.getElementById('cameraShutter');

// --- Global State Variables ---
let currentStream = null;
let capturedPhotos = [];
let photosToCapture = 0;
let photoFrameAspectRatio = 4 / 3;
let selectedPhotoIndex = -1; // To store the index of the photo selected for retake

let imageProcessorWorker = null;
let offscreenCanvasInstance = null;
let userInteracted = false; // Flag to track user interaction for audio autoplay

// --- UI State Object for better control ---
const uiState = {
    isCameraInitializing: true,
    isCameraActive: false,
    isCapturing: false, // True when countdown/capture sequence is active
    isPhotoProcessing: false,
    allPhotosCaptured: false,
    photoSelectedForRetake: false,
    isReadyForRetakeCapture: false, // True when 'Retake Photo' is clicked and user needs to click 'Start Capture'
    isFullscreen: false,
    cameraError: null // Stores error object if camera fails
};

/**
 * Updates the UI based on the current `uiState`. This is the central function
 * for managing visibility and enabled/disabled states of all relevant elements.
 */
function updateUI() {
    // Spinners & Messages
    cameraLoadingSpinner.classList.toggle('hidden-spinner', !uiState.isCameraInitializing);
    photoProcessingSpinner.classList.toggle('hidden-spinner', !uiState.isPhotoProcessing);

    if (uiState.cameraError) {
        displayCameraMessage(
            uiState.cameraError.mainMsg,
            uiState.cameraError.type,
            uiState.cameraError.subMsg
        );
    } else if (uiState.isCameraInitializing) {
        // Message handled by spinner
        cameraAccessMessage.style.display = 'none';
        video.style.display = 'none';
    } else if (!uiState.isCameraActive) {
        displayCameraMessage(
            'Camera not active.',
            'info',
            'Please select a camera to start the feed.'
        );
    } else {
        hideCameraMessage();
        video.style.display = 'block';
    }

    // Countdown Overlay
    visualCountdown.style.opacity = 0;
    visualCountdown.style.display = 'none';

    // Core Controls (Selects, Next, Confirm, Retake)
    filterSelect.disabled = uiState.isCapturing || uiState.isCameraInitializing;
    cameraSelect.disabled = uiState.isCapturing || uiState.isCameraInitializing;

    // Capture Buttons
    captureBtnNormalMode.style.display = 'none';
    captureBtnFullscreen.style.display = 'none';

    let showCaptureButton = false;
    let enableCaptureButton = false;

    if (uiState.isCameraActive && !uiState.isCapturing && !uiState.isPhotoProcessing) {
        if (uiState.isReadyForRetakeCapture) { // User clicked 'Retake Photo' and is awaiting 'Start Capture'
            showCaptureButton = true;
            enableCaptureButton = true;
        } else if (!uiState.allPhotosCaptured) { // Still need to take initial photos
            showCaptureButton = true;
            enableCaptureButton = true;
        }
    }

    if (showCaptureButton) {
        if (uiState.isFullscreen) {
            captureBtnFullscreen.style.display = 'block';
            captureBtnFullscreen.disabled = !enableCaptureButton;
        } else {
            captureBtnNormalMode.style.display = 'block';
            captureBtnNormalMode.disabled = !enableCaptureButton;
        }
    }

    // "Go to Editor" (Next) Button
    nextBtn.style.display = 'none'; // Initially hide, show only if confirm is clicked
    nextBtn.disabled = true;

    // "Confirm Photos" Button
    confirmPhotosBtn.style.display = uiState.allPhotosCaptured && !uiState.isCapturing ? 'block' : 'none';
    confirmPhotosBtn.disabled = !uiState.allPhotosCaptured || uiState.isCapturing;

    // "Retake Photo" Button
    retakePhotoBtn.style.display = (selectedPhotoIndex !== -1 && !uiState.isCapturing && uiState.allPhotosCaptured && !uiState.isReadyForRetakeCapture) ? 'block' : 'none';
    retakePhotoBtn.disabled = uiState.isCapturing; // Disable if a capture is active

    // "Invert Camera" and "Back to Layout" Buttons
    invertCameraButton.style.display = uiState.isCapturing ? 'none' : 'block';
    backToLayoutBtn.style.display = uiState.isCapturing ? 'none' : 'block';

    // Update Photo Progress Text
    let message = '';
    if (photosToCapture > 0) {
        message = `Captured: ${capturedPhotos.length} of ${photosToCapture}`;
        if (uiState.allPhotosCaptured) {
            message += ' - All photos captured!';
            if (uiState.isReadyForRetakeCapture) {
                message = `Photo ${selectedPhotoIndex + 1} selected for retake. Click 'Start Capture' to begin.`;
            }
        } else {
            message += ` (${photosToCapture - capturedPhotos.length} remaining)`;
        }
    } else {
        message = 'Select a layout to begin capturing photos.';
    }
    photoProgressText.textContent = message;
}

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
    countdownElement.style.display = 'none';
    visualCountdown.style.display = 'none';
}

/**
 * Hides the camera message and displays the video element.
 */
function hideCameraMessage() {
    cameraAccessMessage.style.display = 'none';
}

/**
 * Shows/hides the camera loading spinner.
 * @param {boolean} show - True to show, false to hide.
 */
function showCameraLoadingSpinner(show) {
    uiState.isCameraInitializing = show;
    updateUI();
}

/**
 * Shows/hides the photo processing spinner.
 * @param {boolean} show - True to show, false to hide.
 */
function showPhotoProcessingSpinner(show) {
    uiState.isPhotoProcessing = show;
    updateUI();
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

// --- Camera Management ---

/**
 * Populates the camera selection dropdown with available video input devices.
 */
async function populateCameraList() {
    showCameraLoadingSpinner(true);
    uiState.isCameraActive = false; // Reset camera active state
    updateUI();

    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        cameraSelect.innerHTML = '';

        const videoInputDevices = devices.filter(device => device.kind === 'videoinput');

        if (videoInputDevices.length === 0) {
            uiState.cameraError = {
                mainMsg: 'No camera found.',
                subMsg: 'Please ensure your webcam is connected and enabled, then refresh the page.',
                type: 'error'
            };
            updateUI();
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
            await startCamera(cameraSelect.value);
        } else {
            uiState.cameraError = {
                mainMsg: 'No selectable cameras.',
                subMsg: 'Despite enumerating devices, no suitable camera could be selected.',
                type: 'error'
            };
            updateUI();
        }

    } catch (error) {
        console.error('Error enumerating devices or getting initial permission:', error);
        handleCameraError(error);
    } finally {
        showCameraLoadingSpinner(false);
    }
}

/**
 * Handles common camera access errors and displays appropriate messages.
 * @param {DOMException} error - The error object from navigator.mediaDevices.getUserMedia.
 */
function handleCameraError(error) {
    let mainMsg = 'Failed to access camera.';
    let subMsg = `An unexpected error occurred: ${error.message}. Please check the browser console.`;
    let type = 'error';

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        mainMsg = 'Camera access denied.';
        subMsg = 'Please enable camera permissions in your browser settings and refresh the page.';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        mainMsg = 'No camera detected.';
        subMsg = 'Ensure your webcam is connected/enabled. Check if another app is using it.';
    } else if (error.name === 'NotReadableError') {
        mainMsg = 'Camera is busy.';
        subMsg = 'Your camera might be in use by another application. Please close other apps and refresh.';
        type = 'warning';
    } else if (error.name === 'SecurityError' && window.location.protocol === 'file:') {
        mainMsg = 'Camera access requires a secure context.';
        subMsg = 'Please open this page using a local server (e.g., via VS Code Live Server) or HTTPS.';
    }

    uiState.cameraError = { mainMsg, subMsg, type };
    uiState.isCameraActive = false; // Camera is not active if there's an error
    updateUI();
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
    uiState.cameraError = null; // Clear previous errors
    updateUI();

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
            uiState.isCameraActive = true;
            showCameraLoadingSpinner(false);
            initializeImageProcessorWorker();
            updateUI(); // Update UI after camera is active
        };

    } catch (error) {
        console.error('Error starting camera stream:', error);
        handleCameraError(error);
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
            };
            reader.readAsDataURL(blob);
        }
    }

    imageProcessorWorker.onerror = (error) => {
        console.error('Main Thread: Web Worker error:', error);
        showPhotoProcessingSpinner(false);
        uiState.cameraError = {
            mainMsg: 'Photo processing error.',
            subMsg: 'A background process failed. Please refresh the page.',
            type: 'error'
        };
        updateUI();
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

        visualCountdown.style.opacity = 1;
        visualCountdown.style.display = 'block';
        visualCountdown.textContent = count;
        visualCountdown.classList.add('animate');

        playSound(countdownBeep);

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
                playSound(cameraShutter);
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

    // Flash overlay effect
    flashOverlay.classList.add('active');
    setTimeout(() => {
        flashOverlay.classList.remove('active');
    }, 100);

    const imageBitmap = await createImageBitmap(video);

    imageProcessorWorker.postMessage({
        type: 'PROCESS_FRAME',
        payload: { imageBitmap, indexToReplace }
    }, [imageBitmap]);
}

/**
 * Handles the photo data received back from the worker.
 * @param {string} imgData - Base64 data URL of the processed image.
 * @param {number} indexToReplace - The index in capturedPhotos array that was processed.
 */
function handleProcessedPhoto(imgData, indexToReplace) {
    if (indexToReplace !== -1 && indexToReplace < capturedPhotos.length) {
        // Retake scenario
        capturedPhotos[indexToReplace] = imgData;
        const imgElementInDom = photoGrid.querySelector(`[data-index="${indexToReplace}"] img`);
        if (imgElementInDom) {
            imgElementInDom.src = imgData;
        }
        // Deselect photo and reset retake flags
        const selectedWrapper = photoGrid.querySelector('.captured-photo-wrapper.selected');
        if (selectedWrapper) {
            selectedWrapper.classList.remove('selected');
        }
        selectedPhotoIndex = -1;
        uiState.photoSelectedForRetake = false;
        uiState.isReadyForRetakeCapture = false;

    } else {
        // New photo capture scenario
        capturedPhotos.push(imgData);
        addPhotoToGrid(imgData, capturedPhotos.length - 1);
    }

    uiState.allPhotosCaptured = (capturedPhotos.length === photosToCapture && photosToCapture > 0);
    uiState.isCapturing = false; // Capture sequence is now done
    updateUI(); // Re-evaluate UI after photo is processed and state updated
}


/**
 * Manages the initial photo capture sequence or a single retake sequence.
 */
async function initiateCaptureSequence() {
    if (!currentStream || video.srcObject === null || video.paused) {
        uiState.cameraError = {
            mainMsg: 'Camera not active or paused.',
            subMsg: 'Please ensure camera access is granted and the live feed is visible before starting.',
            type: 'warning'
        };
        updateUI();
        return;
    }

    // Crucial: Attempt to unlock audio context directly on this user interaction
    if (!userInteracted) {
        try {
            countdownBeep.muted = false;
            cameraShutter.muted = false;
            await countdownBeep.play();
            countdownBeep.pause();
            countdownBeep.currentTime = 0;
            userInteracted = true;
            console.log("Audio context unlocked by Start Capture button click.");
        } catch (e) {
            console.warn("Audio autoplay blocked by explicit play attempt:", e);
        }
    }

    // Determine photosToCapture if not already set (initial capture scenario)
    if (photosToCapture === 0) {
        const storedPhotoCount = localStorage.getItem('selectedPhotoCount');
        photosToCapture = parseInt(storedPhotoCount, 10);
        if (isNaN(photosToCapture) || photosToCapture < 1 || photosToCapture > 6 || photosToCapture === 5) {
            photosToCapture = 3; // Default to 3 if invalid
        }
    }

    uiState.isCapturing = true; // Set flag that a capture sequence is active
    updateUI(); // Update UI to reflect capturing state (disable controls, hide buttons)

    if (selectedPhotoIndex !== -1 && uiState.isReadyForRetakeCapture) {
        // Retake scenario
        uiState.isReadyForRetakeCapture = false; // Reset the flag
        await runCountdown(3);
        await sendFrameToWorker(selectedPhotoIndex); // Send the index to replace
    } else {
        // New capture sequence or continuing existing one
        if (capturedPhotos.length === 0 && photosToCapture > 0) {
            photoGrid.innerHTML = ''; // Clear grid only if starting a brand new sequence
            capturedPhotos = [];
            selectedPhotoIndex = -1; // Ensure no photo is selected at start of new sequence
            uiState.photoSelectedForRetake = false;
            uiState.isReadyForRetakeCapture = false;
        } else if (capturedPhotos.length === photosToCapture && photosToCapture > 0) {
            alert('All photos have already been captured. Click "Confirm Photos" to proceed or select a photo to retake.');
            uiState.isCapturing = false; // Reset capture flag
            updateUI();
            return;
        }

        while (capturedPhotos.length < photosToCapture) {
            await runCountdown(3);
            await sendFrameToWorker();

            // Short pause between captures if more photos are needed
            if (capturedPhotos.length < photosToapture) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    uiState.isCapturing = false; // Capture sequence finished
    uiState.allPhotosCaptured = (capturedPhotos.length === photosToCapture && photosToCapture > 0);
    updateUI(); // Update UI to reflect post-capture state
}

/**
 * Handles the user clicking the "Retake Photo" button.
 * Its main role is to prepare the UI for a retake, not to initiate capture directly.
 */
function retakeSelectedPhoto() {
    if (selectedPhotoIndex === -1 || selectedPhotoIndex >= capturedPhotos.length) {
        alert('Please select a photo to retake first.');
        return;
    }

    // Remove visual selection from the photo grid immediately
    const selectedWrapper = photoGrid.querySelector('.captured-photo-wrapper.selected');
    if (selectedWrapper) {
        selectedWrapper.classList.remove('selected');
    }

    uiState.isReadyForRetakeCapture = true; // Set flag to allow 'Start Capture' for retake
    updateUI(); // Re-evaluate button visibility and text
}


/**
 * Handles selection/deselection of photos in the grid.
 * @param {Event} event - The click event.
 */
function handlePhotoSelection(event) {
    // Prevent selection if capture is active or if next/confirm buttons are visible (meaning sequence is done)
    if (uiState.isCapturing || uiState.allPhotosCaptured) {
        return;
    }

    const clickedWrapper = event.target.closest('.captured-photo-wrapper');
    const currentlySelected = photoGrid.querySelector('.captured-photo-wrapper.selected');

    if (clickedWrapper === currentlySelected) {
        // If the same photo is clicked again, deselect it
        if (currentlySelected) {
            currentlySelected.classList.remove('selected');
        }
        selectedPhotoIndex = -1;
        uiState.photoSelectedForRetake = false;
        uiState.isReadyForRetakeCapture = false; // Deselecting also cancels pending retake 'Start Capture'
    } else if (clickedWrapper) {
        // Deselect previous, select new
        if (currentlySelected) {
            currentlySelected.classList.remove('selected');
        }
        clickedWrapper.classList.add('selected');
        selectedPhotoIndex = parseInt(clickedWrapper.dataset.index, 10);
        uiState.photoSelectedForRetake = true;
        uiState.isReadyForRetakeCapture = false; // Selecting a photo does *not* immediately enable Start Capture
    } else {
        // Clicked outside any photo, deselect current
        if (currentlySelected) {
            currentlySelected.classList.remove('selected');
        }
        selectedPhotoIndex = -1;
        uiState.photoSelectedForRetake = false;
        uiState.isReadyForRetakeCapture = false;
    }
    updateUI();
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
    }
}

// Listen for fullscreen change events to update UI
document.addEventListener('fullscreenchange', () => {
    uiState.isFullscreen = !!document.fullscreenElement;
    updateUI();
});

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    localStorage.removeItem('capturedPhotos'); // Clear previous photos
    photoGrid.innerHTML = '';
    capturedPhotos = []; // Reset array

    const storedAspectRatio = localStorage.getItem('selectedFrameAspectRatio');
    if (storedAspectRatio) {
        photoFrameAspectRatio = parseFloat(storedAspectRatio);
        updateVideoAspectRatio(photoFrameAspectRatio);
    } else {
        updateVideoAspectRatio(4 / 3);
    }

    const storedPhotoCount = localStorage.getItem('selectedPhotoCount');
    photosToCapture = parseInt(storedPhotoCount, 10);
    if (isNaN(photosToCapture) || photosToCapture < 1 || photosToCapture > 6 || photosToCapture === 5) {
        photosToCapture = 3; // Default to 3 if invalid
    }

    populateCameraList(); // This will trigger the first UI update
    updateUI(); // Initial UI update based on default state

    // Unlock audio on first user interaction - this is a general fallback
    const unlockAudio = () => {
        if (!userInteracted) {
            countdownBeep.muted = false;
            cameraShutter.muted = false;
            countdownBeep.play().then(() => {
                countdownBeep.pause();
                countdownBeep.currentTime = 0;
                userInteracted = true;
                console.log("Audio context unlocked by general DOM click.");
            }).catch(e => {
                console.warn("Initial audio unlock failed via DOM click:", e);
            });
        }
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchend', unlockAudio);
    };

    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchend', unlockAudio, { once: true });
});

cameraSelect.addEventListener('change', (event) => {
    startCamera(event.target.value);
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

// Use the normal mode capture button for clicks when not in fullscreen
captureBtnNormalMode.addEventListener('click', initiateCaptureSequence);

// Use the fullscreen capture button for clicks when in fullscreen
captureBtnFullscreen.addEventListener('click', initiateCaptureSequence);

retakePhotoBtn.addEventListener('click', retakeSelectedPhoto);

confirmPhotosBtn.addEventListener('click', () => {
    if (capturedPhotos.length === photosToCapture && photosToCapture > 0) {
        localStorage.setItem('capturedPhotos', JSON.stringify(capturedPhotos));
        window.location.href = 'editing-page/editing-home.html';
    } else {
        alert('Please capture all photos before confirming.');
    }
});

// Assuming 'nextBtn' is now the 'Go to Editor' after confirmation.
// This button should only appear after confirmation for a cleaner flow.
nextBtn.addEventListener('click', () => {
    // This button should only be active if confirmation has occurred.
    localStorage.setItem('capturedPhotos', JSON.stringify(capturedPhotos));
    window.location.href = 'editing-page/editing-home.html';
});


photoGrid.addEventListener('click', handlePhotoSelection);

invertCameraButton.addEventListener('click', () => {
    video.classList.toggle('inverted');
});

backToLayoutBtn.addEventListener('click', () => {
    window.location.href = 'layout-selection/layout-selection.html';
});

fullscreenToggleBtn.addEventListener('click', toggleFullScreen);

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
