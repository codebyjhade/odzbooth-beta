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

// NEW: Retake and Confirm Buttons
const retakePhotoBtn = document.getElementById('retakePhotoBtn'); // NEW
const confirmPhotosBtn = document.getElementById('confirmPhotosBtn'); // NEW

// NEW: Resolution Select
const resolutionSelect = document.getElementById('resolutionSelect'); // NEW

// Visual Countdown and Flash Overlay Elements
const visualCountdown = document.getElementById('visualCountdown');
const flashOverlay = document.getElementById('flashOverlay');

// Audio Elements
const countdownBeep = document.getElementById('countdownBeep');
const cameraShutter = document.getElementById('cameraShutter');

// NEW: Reference to the new fullscreen button container
const fullscreenCaptureButtonContainer = document.getElementById('fullscreen-capture-button-container');


// --- Global State Variables ---
let currentStream = null;
let capturedPhotos = [];
let photosToCapture = 0;
let photosCapturedCount = 0;
let photoFrameAspectRatio = 4 / 3;
let selectedPhotoIndex = -1; // NEW: To store the index of the photo selected for retake

// NEW: Flag to control when 'Start Capture' is active for retakes
let isReadyForRetakeCapture = false;

// NEW: Web Worker for image processing
let imageProcessorWorker = null;
let offscreenCanvasInstance = null;

// Flag to track user interaction for audio autoplay
let userInteracted = false;

// NEW: Flag to indicate if a capture sequence is currently active
let isCaptureActive = false;

// NEW: Selected Resolution
let selectedResolution = { width: 640, height: 480 }; // Default resolution

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
 * Shows/hides the camera loading spinner.
 * @param {boolean} show - True to show, false to hide.
 */
function showCameraLoadingSpinner(show) {
    if (show) {
        cameraLoadingSpinner.classList.remove('hidden-spinner');
        video.style.display = 'none';
        cameraAccessMessage.style.display = 'none';
        visualCountdown.style.opacity = 0;
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
 * Disables/enables capture controls (buttons, selects). This primarily affects the 'disabled' attribute.
 * @param {boolean} disabled - True to disable, false to enable.
 */
function setCaptureControlsEnabled(disabled) {
    filterSelect.disabled = disabled;
    cameraSelect.disabled = disabled;
    resolutionSelect.disabled = disabled; // Disable resolution select
    nextBtn.disabled = disabled;
    // captureBtnNormalMode.disabled and captureBtnFullscreen.disabled are handled by toggleCaptureButtonVisibility
    retakePhotoBtn.disabled = disabled;
    confirmPhotosBtn.disabled = disabled;
}

/**
 * Manages the display of main capture buttons and related controls during a capture sequence.
 * This directly controls the 'display' style property.
 * @param {boolean} isCapturing - True when a countdown/capture is active, false otherwise.
 */
function setCaptureControlsDuringCapture(isCapturing) {
    isCaptureActive = isCapturing; // Set the global flag

    if (isCapturing) {
        // Hide all buttons except fullscreenToggleBtn and invertCameraButton
        captureBtnFullscreen.style.display = 'none'; // Hide the fullscreen capture button
        captureBtnNormalMode.style.display = 'none'; // Hide the normal mode capture button
        fullscreenCaptureButtonContainer.style.display = 'none'; // Hide the container too
        nextBtn.style.display = 'none';
        confirmPhotosBtn.style.display = 'none';
        retakePhotoBtn.style.display = 'none';
        backToLayoutBtn.style.display = 'none';

        // Explicitly ensure these remain visible during capture
        fullscreenToggleBtn.style.display = 'block';
        invertCameraButton.style.display = 'block';

        // filterSelect and cameraSelect are handled by setCaptureControlsEnabled when capture starts
    } else {
        // Restore visibility based on usual logic after capture is done
        updatePhotoProgressText(); // This handles visibility of confirm/next/invert/back based on photo count
        toggleCaptureButtonVisibility(); // This handles visibility of normal/fullscreen capture buttons based on fullscreen state
        // Retake button visibility is handled by selectedPhotoIndex and updatePhotoProgressText/handlePhotoSelection
    }
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
 */
function updatePhotoProgressText() {
    let message = `Captured: ${capturedPhotos.length} of ${photosToCapture}`;

    if (photosToCapture > 0 && capturedPhotos.length === photosToCapture) {
        message += ' - All photos captured!';
        confirmPhotosBtn.style.display = 'block'; // Show Confirm button
        confirmPhotosBtn.disabled = false;
        nextBtn.style.display = 'none'; // Hide Go to Editor until confirmed

        // Hide "Invert Camera" and "Back to Layout" when all photos are captured
        invertCameraButton.style.display = 'none';
        backToLayoutBtn.style.display = 'none';

        // Retake button is handled by handlePhotoSelection,
        // but if no photo is selected, ensure it's hidden here.
        if (selectedPhotoIndex === -1) {
            retakePhotoBtn.style.display = 'none';
        }

    } else if (photosToCapture > 0 && capturedPhotos.length < photosToCapture) {
        message += ` (${photosToCapture - capturedPhotos.length} remaining)`;
        confirmPhotosBtn.style.display = 'none'; // Hide Confirm if not all captured
        nextBtn.style.display = 'none';
        retakePhotoBtn.style.display = 'none'; // Ensure retake is hidden if more photos are needed

        // ONLY show "Invert Camera" and "Back to Layout" if NOT in an active capture sequence
        if (!isCaptureActive) {
            invertCameraButton.style.display = 'block';
            backToLayoutBtn.style.display = 'block';
        }
    } else {
        // This block runs on initial load or if photosToCapture is 0
        confirmPhotosBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        invertCameraButton.style.display = 'block';
        backToLayoutBtn.style.display = 'block';
        retakePhotoBtn.style.display = 'none';
    }
    photoProgressText.textContent = message;
    toggleCaptureButtonVisibility(); // Re-evaluate capture button visibility after text update
}

// --- Camera Management ---

/**
 * Populates the camera selection dropdown with available video input devices.
 */
async function populateCameraList() {
    showCameraLoadingSpinner(true);
    setCaptureControlsEnabled(true); // Enable select menus initially

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

    showCameraLoadingSpinner(true);

    // Get selected resolution
    const resolutionValue = resolutionSelect.value;
    switch (resolutionValue) {
        case 'default':
            selectedResolution = { width: 640, height: 480 };
            break;
        case 'hd':
            selectedResolution = { width: 1280, height: 720 };
            break;
        case 'fullhd':
            selectedResolution = { width: 1920, height: 1080 };
            break;
        default:
            selectedResolution = { width: 640, height: 480 };
    }

    try {
        const constraints = {
            video: {
                deviceId: deviceId ? { exact: deviceId } : undefined,
                width: { ideal: selectedResolution.width, min: 320 }, // Use selected width
                height: { ideal: selectedResolution.height, min: 240 } // Use selected height
            },
            audio: false
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        currentStream = stream;

        video.onloadedmetadata = () => {
            video.play();
            hideCameraMessage();
            setCaptureControlsEnabled(false); // Enable selects and initial buttons
            showCameraLoadingSpinner(false);
            initializeImageProcessorWorker();
            toggleCaptureButtonVisibility(); // Initial visibility of the capture button
            updatePhotoProgressText(); // Ensure correct initial state for other buttons
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
            };
            reader.readAsDataURL(blob);
        }
    }

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

        // Display the initial countdown number
        visualCountdown.style.opacity = 1;
        visualCountdown.style.display = 'block';
        visualCountdown.textContent = count;
        visualCountdown.classList.add('animate');

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

    // Determine if the final image should be flipped horizontally.
    // The video preview is flipped by default (like a mirror). The '.inverted' class makes it non-flipped.
    // The raw imageBitmap is always non-flipped.
    // To make the photo match the preview, we must flip it if the preview is flipped (i.e., when the '.inverted' class is NOT present).
    const shouldFlip = !video.classList.contains('inverted');

    const imageBitmap = await createImageBitmap(video);

    imageProcessorWorker.postMessage({
        type: 'PROCESS_FRAME',
        payload: {
            imageBitmap,
            indexToReplace,
            shouldFlip // Pass the flip status to the worker
        }
    }, [imageBitmap]);
}
/**
 * Handles the photo data received back from the worker.
 * @param {string} imgData - Base64 data URL of the processed image.
 * @param {number} indexToReplace - The index in capturedPhotos array that was processed.
 */
function handleProcessedPhoto(imgData, indexToReplace) {
    if (indexToReplace !== -1 && indexToReplace < capturedPhotos.length) {
        capturedPhotos[indexToReplace] = imgData;
        const imgElementInDom = photoGrid.querySelector(`[data-index="${indexToReplace}"] img`);
        if (imgElementInDom) {
            imgElementInDom.src = imgData;
        }
        // Deselect photo after retake (UI selection, not logical selectedPhotoIndex)
        const selectedWrapper = photoGrid.querySelector('.captured-photo-wrapper.selected');
        if (selectedWrapper) {
            selectedWrapper.classList.remove('selected');
        }
        selectedPhotoIndex = -1; // Reset logical selected photo index after retake
        retakePhotoBtn.style.display = 'none'; // Hide retake button
    } else {
        capturedPhotos.push(imgData);
        photosCapturedCount++;
        addPhotoToGrid(imgData, capturedPhotos.length - 1);
    }
    updatePhotoProgressText(); // Update progress text after each photo
    setCaptureControlsEnabled(false); // Re-enable controls' disabled state
}


/**
 * Manages the initial photo capture sequence or a single retake sequence.
 */
async function initiateCaptureSequence() {
    backToLayoutBtn.style.display = 'none';

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
            photosToCapture = 3;
        }
    }

    setCaptureControlsEnabled(true); // Disable select elements etc.
    setCaptureControlsDuringCapture(true); // Hide all relevant buttons except fullscreen toggle and invert camera

    if (selectedPhotoIndex !== -1) { // User clicked 'Start Capture' to retake a specific photo
        // Reset the flag as we are now performing the capture
        isReadyForRetakeCapture = false;

        // Perform a single capture for retake
        await runCountdown(3);
        flashOverlay.classList.add('active');
        setTimeout(() => {
            flashOverlay.classList.remove('active');
        }, 100);
        await sendFrameToWorker(selectedPhotoIndex); // Send the index to replace

    } else { // User clicked 'Start Capture' to take new photos or continue sequence
        if (photosToCapture > 0 && capturedPhotos.length === photosToCapture) {
            alert('All photos have already been captured. Click "Confirm Photos" to proceed or select a photo to retake.');
            setCaptureControlsEnabled(false);
            setCaptureControlsDuringCapture(false);
            return;
        }

        if (capturedPhotos.length === 0) { // Clear grid only if starting a brand new sequence
            photoGrid.innerHTML = '';
            capturedPhotos = [];
        }

        while (capturedPhotos.length < photosToCapture) {
            await runCountdown(3);
            flashOverlay.classList.add('active');
            setTimeout(() => {
                flashOverlay.classList.remove('active');
            }, 100);

            await sendFrameToWorker();

            if (capturedPhotos.length < photosToCapture) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    // After capture (either new or retake) finishes
    setCaptureControlsEnabled(false); // Re-enable select elements etc.
    setCaptureControlsDuringCapture(false); // Restore button visibility based on photo count and fullscreen
}

/**
 * Handles the user clicking the "Retake Photo" button.
 * Its main role is to prepare the UI for a retake, not to initiate capture directly.
 */
async function retakeSelectedPhoto() {
    if (selectedPhotoIndex === -1 || selectedPhotoIndex >= capturedPhotos.length) {
        alert('Please select a photo to retake first.');
        return;
    }

    // Remove visual selection from the photo grid immediately
    const selectedWrapper = photoGrid.querySelector('.captured-photo-wrapper.selected');
    if (selectedWrapper) {
        selectedWrapper.classList.remove('selected');
    }

    // Hide the dedicated retake button, as "Start Capture" will be used
    retakePhotoBtn.style.display = 'none';

    // Set the flag that allows 'Start Capture' to be visible/enabled for the retake
    isReadyForRetakeCapture = true;

    // Update progress text to guide the user
    photoProgressText.textContent = `Photo ${selectedPhotoIndex + 1} selected for retake. Click 'Start Capture' to begin.`;

    // Make the "Start Capture" button visible and enabled for the user to click
    // `toggleCaptureButtonVisibility` handles this by checking `isReadyForRetakeCapture`
    toggleCaptureButtonVisibility();
}


/**
 * Handles selection/deselection of photos in the grid.
 * @param {Event} event - The click event.
 */
function handlePhotoSelection(event) {
    if (nextBtn.style.display === 'block' && confirmPhotosBtn.style.display === 'none') {
        return;
    }

    const clickedWrapper = event.target.closest('.captured-photo-wrapper');
    if (!clickedWrapper) {
        // If clicked outside any photo, deselect current
        const currentlySelected = photoGrid.querySelector('.captured-photo-wrapper.selected');
        if (currentlySelected) {
            currentlySelected.classList.remove('selected');
        }
        selectedPhotoIndex = -1; // No photo selected
        retakePhotoBtn.style.display = 'none'; // Hide retake button
        isReadyForRetakeCapture = false; // Deselecting also cancels pending retake 'Start Capture'
        updatePhotoProgressText(); // Re-evaluate button visibility based on no selection
        return;
    }

    const index = parseInt(clickedWrapper.dataset.index, 10);

    const currentlySelected = photoGrid.querySelector('.captured-photo-wrapper.selected');

    if (currentlySelected === clickedWrapper) {
        // If the same photo is clicked again, deselect it
        clickedWrapper.classList.remove('selected');
        selectedPhotoIndex = -1;
        retakePhotoBtn.style.display = 'none'; // Hide retake button
        isReadyForRetakeCapture = false; // Deselecting also cancels pending retake 'Start Capture'
    } else {
        // Deselect previous, select new
        if (currentlySelected) {
            currentlySelected.classList.remove('selected');
        }
        clickedWrapper.classList.add('selected');
        selectedPhotoIndex = index;
        retakePhotoBtn.style.display = 'block'; // Show retake button

        isReadyForRetakeCapture = false; // Crucial: Selecting a photo does *not* immediately enable Start Capture
    }
    updatePhotoProgressText(); // Re-evaluate button visibility after selection change
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

/**
 * Manages the visibility and enabled state of the two capture buttons based on fullscreen mode
 * and the current state (capturing, all photos taken, photo selected for retake).
 */
function toggleCaptureButtonVisibility() {
    // --- ADD THESE console.log STATEMENTS AT THE TOP OF THIS FUNCTION ---
    console.log("--- toggleCaptureButtonVisibility called ---");
    console.log("  document.fullscreenElement:", document.fullscreenElement);
    console.log("  isCaptureActive:", isCaptureActive); // Should be false for the button to appear
    console.log("  photosToCapture:", photosToCapture); // Set by layout selection (e.g., 3, 4, 6)
    console.log("  capturedPhotos.length:", capturedPhotos.length); // How many photos you've taken
    console.log("  selectedPhotoIndex:", selectedPhotoIndex); // -1 unless a photo is selected for retake
    console.log("  isReadyForRetakeCapture:", isReadyForRetakeCapture); // True if 'Retake Photo' was clicked

    // If a capture sequence is active (countdown running), always hide capture buttons
    if (isCaptureActive) {
        console.log("  Reason for hiding: isCaptureActive is true.");
        captureBtnNormalMode.style.display = 'none';
        fullscreenCaptureButtonContainer.style.display = 'none'; // Hide fullscreen container
        return;
    }

    let isVisible = false; // Default to hidden
    let isDisabled = true; // Default to disabled

    if (filterSelect.disabled) { // This state is usually true when camera is loading or has issues
        console.log("  Reason for hiding/disabling: filterSelect is disabled (camera not ready or error).");
    }
    // Condition B: Brand new capture sequence or continuing existing one
    else if (photosToCapture === 0 || (capturedPhotos.length < photosToCapture && selectedPhotoIndex === -1)) {
        isVisible = true;
        isDisabled = false;
        console.log("  Condition Met (B): Ready for new/continue capture. isVisible=true, isDisabled=false.");
    }
    // Condition C: All photos captured, AND a specific photo is selected for retake, AND 'Retake Photo' was clicked
    else if (photosToCapture > 0 && capturedPhotos.length === photosToCapture && selectedPhotoIndex !== -1 && isReadyForRetakeCapture) {
        isVisible = true;
        isDisabled = false;
        console.log("  Condition Met (C): Ready for retake capture. isVisible=true, isDisabled=false.");
    }
    // Condition D: All photos captured, AND a specific photo is selected for retake, BUT 'Retake Photo' has NOT been clicked
    else if (photosToCapture > 0 && capturedPhotos.length === photosToCapture && selectedPhotoIndex !== -1 && !isReadyForRetakeCapture) {
        console.log("  Condition Met (D): Photo selected for retake, but 'Retake Photo' button not clicked yet. Button hidden.");
    } else {
        console.log("  No 'isVisible' condition met. Button will remain hidden/disabled by default.");
    }


    if (document.fullscreenElement) {
        console.log("  Applying FULLSCREEN button visibility rules.");
        captureBtnNormalMode.style.display = 'none'; // Ensure normal button is hidden
        fullscreenCaptureButtonContainer.style.display = isVisible ? 'block' : 'none'; // Set fullscreen button container display
        captureBtnFullscreen.disabled = isDisabled; // Set fullscreen button disabled state
        console.log(`  Fullscreen Button Container Display: ${fullscreenCaptureButtonContainer.style.display}`);
        console.log(`  Fullscreen Button Disabled State: ${captureBtnFullscreen.disabled}`);
    } else {
        console.log("  Applying NORMAL (non-fullscreen) button visibility rules.");
        captureBtnNormalMode.style.display = isVisible ? 'block' : 'none'; // Set normal button display
        fullscreenCaptureButtonContainer.style.display = 'none'; // Ensure fullscreen button container is hidden
        captureBtnNormalMode.disabled = isDisabled; // Set normal button disabled state
        console.log(`  Normal Button Display: ${captureBtnNormalMode.style.display}`);
        console.log(`  Normal Button Disabled State: ${captureBtnNormalMode.disabled}`);
    }
}


// Listen for fullscreen change events to update UI
document.addEventListener('fullscreenchange', toggleCaptureButtonVisibility);

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    localStorage.removeItem('capturedPhotos');
    photoGrid.innerHTML = '';

    const storedAspectRatio = localStorage.getItem('selectedFrameAspectRatio');
    if (storedAspectRatio) {
        photoFrameAspectRatio = parseFloat(storedAspectRatio);
        updateVideoAspectRatio(photoFrameAspectRatio);
    } else {
        updateVideoAspectRatio(4 / 3);
    }
    populateCameraList();
    updatePhotoProgressText();
    toggleCaptureButtonVisibility(); // Initial call to set button visibility

    // Unlock audio on first user interaction - this is a general fallback
    // The main unlock will now happen in initiateCaptureSequence
    const unlockAudio = () => {
        // Only attempt if not already interacted via the capture button
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

// NEW: Event listener for resolution select
resolutionSelect.addEventListener('change', () => {
    // Restart camera with the newly selected resolution
    startCamera(cameraSelect.value);
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
captureBtnNormalMode.addEventListener('click', () => {
    initiateCaptureSequence();
});

// Use the fullscreen capture button for clicks when in fullscreen
captureBtnFullscreen.addEventListener('click', () => {
    initiateCaptureSequence();
});

// NEW: Event listener for Retake Photo button
retakePhotoBtn.addEventListener('click', () => {
    retakeSelectedPhoto();
});

// NEW: Event listener for Confirm Photos button
confirmPhotosBtn.addEventListener('click', () => {
    if (capturedPhotos.length === photosToCapture && photosToCapture > 0) {
        localStorage.setItem('capturedPhotos', JSON.stringify(capturedPhotos));
        window.location.href = 'editing-page/editing-home.html';
    } else {
        alert('Please capture all photos before confirming.');
    }
});

nextBtn.addEventListener('click', () => {
    if (capturedPhotos.length > 0 && capturedPhotos.length === photosToCapture) {
        localStorage.setItem('capturedPhotos', JSON.stringify(capturedPhotos));
        window.location.href = 'editing-page/editing-home.html';
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
// capture-page/capture.js

// ... (your existing code) ...

function toggleCaptureButtonVisibility() {
    // --- ADD THESE console.log STATEMENTS AT THE TOP OF THIS FUNCTION ---
    console.log("--- toggleCaptureButtonVisibility called ---");
    console.log("  document.fullscreenElement:", document.fullscreenElement);
    console.log("  isCaptureActive:", isCaptureActive); // Should be false for the button to appear
    console.log("  photosToCapture:", photosToCapture); // Set by layout selection (e.g., 3, 4, 6)
    console.log("  capturedPhotos.length:", capturedPhotos.length); // How many photos you've taken
    console.log("  selectedPhotoIndex:", selectedPhotoIndex); // -1 unless a photo is selected for retake
    console.log("  isReadyForRetakeCapture:", isReadyForRetakeCapture); // True if 'Retake Photo' was clicked

    // If a capture sequence is active (countdown running), always hide capture buttons
    if (isCaptureActive) {
        console.log("  Reason for hiding: isCaptureActive is true.");
        captureBtnNormalMode.style.display = 'none';
        fullscreenCaptureButtonContainer.style.display = 'none'; // Hide fullscreen container
        return;
    }

    let isVisible = false; // Default to hidden
    let isDisabled = true; // Default to disabled

    if (filterSelect.disabled) { // This state is usually true when camera is loading or has issues
        console.log("  Reason for hiding/disabling: filterSelect is disabled (camera not ready or error).");
    }
    // Condition B: Brand new capture sequence or continuing existing one
    else if (photosToCapture === 0 || (capturedPhotos.length < photosToCapture && selectedPhotoIndex === -1)) {
        isVisible = true;
        isDisabled = false;
        console.log("  Condition Met (B): Ready for new/continue capture. isVisible=true, isDisabled=false.");
    }
    // Condition C: All photos captured, AND a specific photo is selected for retake, AND 'Retake Photo' was clicked
    else if (photosToCapture > 0 && capturedPhotos.length === photosToCapture && selectedPhotoIndex !== -1 && isReadyForRetakeCapture) {
        isVisible = true;
        isDisabled = false;
        console.log("  Condition Met (C): Ready for retake capture. isVisible=true, isDisabled=false.");
    }
    // Condition D: All photos captured, AND a specific photo is selected for retake, BUT 'Retake Photo' has NOT been clicked
    else if (photosToCapture > 0 && capturedPhotos.length === photosToCapture && selectedPhotoIndex !== -1 && !isReadyForRetakeCapture) {
        console.log("  Condition Met (D): Photo selected for retake, but 'Retake Photo' button not clicked yet. Button hidden.");
    } else {
        console.log("  No 'isVisible' condition met. Button will remain hidden/disabled by default.");
    }


    if (document.fullscreenElement) {
        console.log("  Applying FULLSCREEN button visibility rules.");
        captureBtnNormalMode.style.display = 'none'; // Ensure normal button is hidden
        fullscreenCaptureButtonContainer.style.display = isVisible ? 'block' : 'none'; // Set fullscreen button container display
        captureBtnFullscreen.disabled = isDisabled; // Set fullscreen button disabled state
        console.log(`  Fullscreen Button Container Display: ${fullscreenCaptureButtonContainer.style.display}`);
        console.log(`  Fullscreen Button Disabled State: ${captureBtnFullscreen.disabled}`);
    } else {
        console.log("  Applying NORMAL (non-fullscreen) button visibility rules.");
        captureBtnNormalMode.style.display = isVisible ? 'block' : 'none'; // Set normal button display
        fullscreenCaptureButtonContainer.style.display = 'none'; // Ensure fullscreen button container is hidden
        captureBtnNormalMode.disabled = isDisabled; // Set normal button disabled state
        console.log(`  Normal Button Display: ${captureBtnNormalMode.style.display}`);
        console.log(`  Normal Button Disabled State: ${captureBtnNormalMode.disabled}`);
    }
}
// ... (rest of your existing code) ...


// NEW: Keyboard shortcut for the capture button
document.addEventListener('keyup', (event) => {
    // Check if the 'Enter' or 'Space' key was pressed
    if (event.key === 'Enter' || event.key === ' ') {
        // Check if the normal mode button is visible and not disabled
        if (window.getComputedStyle(captureBtnNormalMode).display !== 'none' && !captureBtnNormalMode.disabled) {
            captureBtnNormalMode.click();
        } 
        // Otherwise, check if the fullscreen button is visible and not disabled
        else if (window.getComputedStyle(fullscreenCaptureButtonContainer).display !== 'none' && !captureBtnFullscreen.disabled) {
            captureBtnFullscreen.click();
        }
    }
});
