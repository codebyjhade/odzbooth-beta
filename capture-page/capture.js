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
let photosCapturedCount = 0;
let photoFrameAspectRatio = 4 / 3;
let selectedPhotoIndex = -1; // NEW: To store the index of the photo selected for retake

// NEW: Web Worker for image processing
let imageProcessorWorker = null;
let offscreenCanvasInstance = null;

// Flag to track user interaction for audio autoplay
let userInteracted = false;

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
    nextBtn.disabled = disabled;
    captureBtnNormalMode.disabled = disabled;
    retakePhotoBtn.disabled = disabled;
    confirmPhotosBtn.disabled = disabled;
}

/**
 * Manages the display of main capture buttons and related controls during a capture sequence.
 * This directly controls the 'display' style property.
 * @param {boolean} isCapturing - True when a countdown/capture is active, false otherwise.
 */
function setCaptureControlsDuringCapture(isCapturing) {
    if (isCapturing) {
        // Hide all buttons except fullscreenToggleBtn
        captureBtnFullscreen.style.display = 'none';
        captureBtnNormalMode.style.display = 'none';
        nextBtn.style.display = 'none';
        confirmPhotosBtn.style.display = 'none';
        retakePhotoBtn.style.display = 'none';
        backToLayoutBtn.style.display = 'none'; // Ensure it's hidden
        invertCameraButton.style.display = 'none';
        // filterSelect and cameraSelect are handled by setCaptureControlsEnabled when capture starts
    } else {
        // Restore visibility based on usual logic
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
    photoProgressText.textContent = `Captured: ${capturedPhotos.length} of ${photosToCapture}`;
    if (photosToCapture > 0 && capturedPhotos.length === photosToCapture) {
        photoProgressText.textContent += ' - All photos captured!';
        confirmPhotosBtn.style.display = 'block'; // Show Confirm button
        confirmPhotosBtn.disabled = false;
        nextBtn.style.display = 'none'; // Hide Go to Editor until confirmed

        // Hide "Invert Camera" and "Back to Layout" when all photos are captured
        invertCameraButton.style.display = 'none';
        backToLayoutBtn.style.display = 'none';

        // Also hide retake button if not in retake process AND all photos are captured
        if (selectedPhotoIndex === -1) { // Only hide if no photo is actively selected for retake
            retakePhotoBtn.style.display = 'none';
        }


    } else if (photosToCapture > 0 && capturedPhotos.length < photosToCapture) {
        photoProgressText.textContent += ` (${photosToCapture - capturedPhotos.length} remaining)`;
        confirmPhotosBtn.style.display = 'none'; // Hide Confirm if not all captured
        nextBtn.style.display = 'none';

        // Show "Invert Camera" and "Back to Layout" when more photos are needed
        // Note: These might be temporarily hidden by setCaptureControlsDuringCapture(true)
        // during an active capture sequence.
        invertCameraButton.style.display = 'block';
        backToLayoutBtn.style.display = 'block';
        retakePhotoBtn.style.display = 'none'; // Ensure retake is hidden if more photos are needed
                                               // unless explicitly selected for retake
    } else {
        confirmPhotosBtn.style.display = 'none'; // Hide Confirm if no photos are expected yet
        nextBtn.style.display = 'none';
        invertCameraButton.style.display = 'block'; // Ensure visible on start
        backToLayoutBtn.style.display = 'block'; // Ensure visible on start
        retakePhotoBtn.style.display = 'none'; // Ensure retake is hidden on start
    }
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
        capturedPhotos[indexToReplace] = imgData;
        const imgElementInDom = photoGrid.querySelector(`[data-index="${indexToReplace}"] img`);
        if (imgElementInDom) {
            imgElementInDom.src = imgData;
        }
        // Deselect photo after retake
        const selectedWrapper = photoGrid.querySelector('.captured-photo-wrapper.selected');
        if (selectedWrapper) {
            selectedWrapper.classList.remove('selected');
        }
        selectedPhotoIndex = -1; // Reset selected photo index
        retakePhotoBtn.style.display = 'none'; // Hide retake button
    } else {
        capturedPhotos.push(imgData);
        photosCapturedCount++;
        addPhotoToGrid(imgData, capturedPhotos.length - 1);
    }
    updatePhotoProgressText();
    setCaptureControlsEnabled(false); // Re-enable controls' disabled state
}


/**
 * Manages the initial photo capture sequence with countdowns and multiple shots.
 */
async function initiateCaptureSequence() {
    // Explicitly hide backToLayoutBtn immediately upon function call
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


    if (capturedPhotos.length === photosToCapture && photosToCapture > 0) {
        alert('All photos have already been captured. Click "Confirm Photos" to proceed.');
        return;
    }

    const storedPhotoCount = localStorage.getItem('selectedPhotoCount');
    photosToCapture = parseInt(storedPhotoCount, 10);

    if (isNaN(photosToCapture) || photosToCapture < 1 || photosToCapture > 6 || photosToCapture === 5) {
        photosToCapture = 3;
    }

    setCaptureControlsEnabled(true); // Disable select elements etc.
    setCaptureControlsDuringCapture(true); // Hide all relevant buttons except fullscreen toggle

    if (capturedPhotos.length === 0) {
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

    // After the loop finishes (i.e., all photos are captured)
    setCaptureControlsEnabled(false); // Re-enable select elements etc.
    setCaptureControlsDuringCapture(false); // Restore button visibility based on photo count and fullscreen
}

/**
 * Allows the user to retake a previously captured photo.
 */
async function retakeSelectedPhoto() {
    // Explicitly hide backToLayoutBtn immediately upon function call
    backToLayoutBtn.style.display = 'none';

    // Check if photos have been confirmed; if so, disallow retake.
    if (nextBtn.style.display === 'block' && confirmPhotosBtn.style.display === 'none') {
        alert('Photos have been confirmed. You cannot retake photos now. Please go to the editor.');
        return;
    }

    if (selectedPhotoIndex === -1 || selectedPhotoIndex >= capturedPhotos.length) {
        alert('Please select a photo to retake first.');
        return;
    }

    if (!currentStream || video.srcObject === null || video.paused) {
        displayCameraMessage(
            'Camera not active or paused.',
            'warning',
            'Please ensure camera access is granted and the live feed is visible before retaking.'
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
            console.log("Audio context unlocked by Retake button click.");
        } catch (e) {
            console.warn("Audio autoplay blocked by explicit play attempt on retake:", e);
        }
    }

    setCaptureControlsEnabled(true); // Disable select elements etc.
    setCaptureControlsDuringCapture(true); // Hide all relevant buttons except fullscreen toggle

    await runCountdown(3);
    flashOverlay.classList.add('active');
    setTimeout(() => {
        flashOverlay.classList.remove('active');
    }, 100);

    await sendFrameToWorker(selectedPhotoIndex); // Send the index to replace

    setCaptureControlsEnabled(false); // Re-enable select elements etc.
    setCaptureControlsDuringCapture(false); // Restore button visibility based on photo count and fullscreen
}


/**
 * Handles selection/deselection of photos in the grid.
 * @param {Event} event - The click event.
 */
function handlePhotoSelection(event) {
    // If photos have been confirmed, do not allow selection for retake.
    if (nextBtn.style.display === 'block' && confirmPhotosBtn.style.display === 'none') {
        // Optionally, give visual feedback that selection is disabled.
        // event.preventDefault(); // Prevent default if any default action exists
        return;
    }

    const clickedWrapper = event.target.closest('.captured-photo-wrapper');
    if (!clickedWrapper) {
        // If clicked outside any photo, deselect
        const currentlySelected = photoGrid.querySelector('.captured-photo-wrapper.selected');
        if (currentlySelected) {
            currentlySelected.classList.remove('selected');
        }
        selectedPhotoIndex = -1;
        retakePhotoBtn.style.display = 'none'; // Hide retake button
        return;
    }

    const index = parseInt(clickedWrapper.dataset.index, 10);

    const currentlySelected = photoGrid.querySelector('.captured-photo-wrapper.selected');

    if (currentlySelected === clickedWrapper) {
        // If the same photo is clicked again, deselect it
        clickedWrapper.classList.remove('selected');
        selectedPhotoIndex = -1;
        retakePhotoBtn.style.display = 'none'; // Hide retake button
    } else {
        // Deselect previous, select new
        if (currentlySelected) {
            currentlySelected.classList.remove('selected');
        }
        clickedWrapper.classList.add('selected');
        selectedPhotoIndex = index;
        retakePhotoBtn.style.display = 'block'; // Show retake button
    }
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
 * Manages the visibility of the two capture buttons based on fullscreen mode.
 */
function toggleCaptureButtonVisibility() {
    if (document.fullscreenElement) {
        // In fullscreen: hide normal mode button, show fullscreen button
        captureBtnNormalMode.style.display = 'none';
        captureBtnFullscreen.style.display = 'block';
    } else {
        // Not in fullscreen: show normal mode button, hide fullscreen button
        captureBtnNormalMode.style.display = 'block';
        captureBtnFullscreen.style.display = 'none';
    }
    // Ensure both capture buttons' disabled state is correct based on photo count
    if (photosToCapture > 0 && capturedPhotos.length === photosToCapture) {
        captureBtnNormalMode.disabled = true;
        captureBtnFullscreen.disabled = true;
    } else {
        // Only enable if controls are not currently disabled by setCaptureControlsEnabled(true)
        if (!filterSelect.disabled) { // Check if general controls are not disabled
            captureBtnNormalMode.disabled = false;
            captureBtnFullscreen.disabled = false;
        }
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
        nextBtn.style.display = 'block'; // Show Go to Editor button
        nextBtn.disabled = false;
        confirmPhotosBtn.style.display = 'none'; // Hide Confirm button
        retakePhotoBtn.style.display = 'none'; // Permanently hide Retake button
        // Deselect any currently selected photo if present
        const currentlySelected = photoGrid.querySelector('.captured-photo-wrapper.selected');
        if (currentlySelected) {
            currentlySelected.classList.remove('selected');
        }
        selectedPhotoIndex = -1; // Reset selected index

        // Optional: Provide visual feedback that photos are confirmed
        // alert('Photos confirmed! You can now go to the editor.');
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
