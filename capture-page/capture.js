// capture-page/capture.js

// Strict mode for cleaner code
"use strict";

// --- DOM Element References ---
const video = document.getElementById('cameraFeed');
const captureBtnFullscreen = document.getElementById('captureBtn');
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
const actionButtonsDiv = document.querySelector('.action-buttons');

const retakePhotoBtn = document.getElementById('retakePhotoBtn');


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
let photosCapturedCount = 0; // This might be redundant with capturedPhotos.length, but kept for clarity if needed elsewhere.
let photoFrameAspectRatio = 4 / 3;

// NEW: Web Worker for image processing
let imageProcessorWorker = null;
let offscreenCanvasInstance = null;

// Flag to track user interaction for audio autoplay
let userInteracted = false;

// New: Variable to track the index of the photo selected for retake
let selectedPhotoIndex = -1;

// --- Utility Functions ---

/**
 * Plays a sound if user interaction has occurred.
 * @param {HTMLAudioElement} audioElem - The audio element to play.
 * @param {number} [volume=1] - The volume (0 to 1).
 */
function playSound(audioElem, volume = 1) {
    if (userInteracted) {
        audioElem.volume = volume;
        audioElem.currentTime = 0;
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
 * Disables/enables capture controls (buttons, selects).
 * This function is used for general disabling during active processes like camera loading or capture sequence.
 * Specific button visibility/disabled states are managed by `updatePhotoProgressText` and `toggleButtonsAfterCapture`.
 * @param {boolean} disabled - True to disable, false to enable.
 */
function setCaptureControlsEnabled(disabled) {
    filterSelect.disabled = disabled;
    cameraSelect.disabled = disabled;
    invertCameraButton.disabled = disabled;
    backToLayoutBtn.disabled = disabled;
    fullscreenToggleBtn.disabled = disabled;
    captureBtnNormalMode.disabled = disabled;
    captureBtnFullscreen.disabled = disabled; // Ensure fullscreen button is also disabled
    retakePhotoBtn.disabled = disabled;
    nextBtn.disabled = disabled; // Also disable nextBtn
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
 * Also controls the disabled state of the "Go to Editor" and "Retake Selected Photo" buttons.
 * Visibility of these buttons (and others) is handled by `toggleButtonsAfterCapture`.
 */
function updatePhotoProgressText() {
    photoProgressText.textContent = `Captured: ${capturedPhotos.length} of ${photosToCapture}`;

    if (photosToCapture > 0 && capturedPhotos.length === photosToCapture) {
        photoProgressText.textContent += ' - All photos captured!';
        nextBtn.disabled = false;
        retakePhotoBtn.disabled = (selectedPhotoIndex === -1); // Only enable retake if a photo is selected
        toggleButtonsAfterCapture(true); // All photos captured, show editor/retake, hide others
    } else if (photosToCapture > 0 && capturedPhotos.length < photosToCapture) {
        photoProgressText.textContent += ` (${photosToCapture - capturedPhotos.length} remaining)`;
        nextBtn.disabled = true;
        retakePhotoBtn.disabled = true; // Retake disabled if not all initial photos are captured
        toggleButtonsAfterCapture(false); // Still capturing, show capture buttons, hide editor/retake
    } else {
        // Initial state or no photos to capture set
        nextBtn.disabled = true;
        retakePhotoBtn.disabled = true;
        toggleButtonsAfterCapture(false); // Default state
    }
}

/**
 * Manages the visibility of various buttons based on whether the full set of photos has been captured.
 * @param {boolean} allPhotosCaptured - True if all photos for the strip have been captured.
 */
function toggleButtonsAfterCapture(allPhotosCaptured) {
    if (document.fullscreenElement) {
        // In fullscreen, only the fullscreen capture button or the editor/retake buttons might be relevant
        captureBtnNormalMode.style.display = 'none';
        backToLayoutBtn.style.display = 'none';
        fullscreenToggleBtn.style.display = 'none';
        invertCameraButton.style.display = 'none';
        filterSelect.parentElement.style.display = 'none'; // Hide filter select group
        cameraSelect.parentElement.style.display = 'none'; // Hide camera select group

        if (allPhotosCaptured) {
            captureBtnFullscreen.style.display = 'none'; // Hide capture button in fullscreen
            nextBtn.style.display = 'block';
            retakePhotoBtn.style.display = 'block';
            // Position nextBtn and retakePhotoBtn in fullscreen (adjust styles as needed)
            nextBtn.classList.add('fullscreen-bottom-btn');
            retakePhotoBtn.classList.add('fullscreen-bottom-btn-secondary'); // A new class for positioning
        } else {
            captureBtnFullscreen.style.display = 'block'; // Show capture button in fullscreen
            nextBtn.style.display = 'none';
            retakePhotoBtn.style.display = 'none';
            nextBtn.classList.remove('fullscreen-bottom-btn');
            retakePhotoBtn.classList.remove('fullscreen-bottom-btn-secondary');
        }
    } else {
        // Normal (non-fullscreen) mode
        backToLayoutBtn.style.display = 'block';
        fullscreenToggleBtn.style.display = 'block';
        invertCameraButton.style.display = 'block';
        filterSelect.parentElement.style.display = 'block'; // Show filter select group
        cameraSelect.parentElement.style.display = 'block'; // Show camera select group

        if (allPhotosCaptured) {
            captureBtnNormalMode.style.display = 'none';
            captureBtnFullscreen.style.display = 'none';
            nextBtn.style.display = 'block';
            retakePhotoBtn.style.display = 'block';
            // Remove fullscreen positioning classes
            nextBtn.classList.remove('fullscreen-bottom-btn');
            retakePhotoBtn.classList.remove('fullscreen-bottom-btn-secondary');
        } else {
            captureBtnNormalMode.style.display = 'block';
            captureBtnFullscreen.style.display = 'none';
            nextBtn.style.display = 'none';
            retakePhotoBtn.style.display = 'none';
        }
    }
}


// --- Camera Management ---

/**
 * Populates the camera selection dropdown with available video input devices.
 */
async function populateCameraList() {
    showCameraLoadingSpinner(true);
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
            setCaptureControlsEnabled(false); // Generally disable before fine-tuning
            showCameraLoadingSpinner(false);
            initializeImageProcessorWorker();
            // Re-evaluate button states after camera is ready
            updatePhotoProgressText(); // This will call toggleButtonsAfterCapture
            toggleCaptureButtonVisibility(); // For fullscreen button
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
                void visualCountdown.offsetWidth;
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
    } else {
        capturedPhotos.push(imgData);
        photosCapturedCount++;
        addPhotoToGrid(imgData, capturedPhotos.length - 1);
    }
    updatePhotoProgressText();
}


/**
 * Manages the initial photo capture sequence with countdowns and multiple shots.
 * @param {number} [targetIndex=-1] - If specified, only captures/retakes this single photo index.
 */
async function initiateCaptureSequence(targetIndex = -1) {
    if (!currentStream || video.srcObject === null || video.paused) {
        displayCameraMessage(
            'Camera not active or paused.',
            'warning',
            'Please ensure camera access is granted and the live feed is visible before starting.'
        );
        return;
    }

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

    const storedPhotoCount = localStorage.getItem('selectedPhotoCount');
    photosToCapture = parseInt(storedPhotoCount, 10);

    if (isNaN(photosToCapture) || photosToCapture < 1 || photosToCapture > 6 || photosToCapture === 5) {
        photosToCapture = 3;
    }

    // Disable all relevant buttons during capture sequence
    setCaptureControlsEnabled(true);
    toggleButtonsDuringCaptureSequence(true); // Hide all control buttons during capture

    if (targetIndex === -1) { // Normal capture sequence (not a retake)
        if (capturedPhotos.length === photosToCapture && photosToCapture > 0) {
            alert('All photos have already been captured. Click "Go to Editor" to proceed or select a photo to retake.');
            setCaptureControlsEnabled(false);
            toggleButtonsDuringCaptureSequence(false); // Re-enable for interaction
            updatePhotoProgressText();
            return;
        }

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
    } else { // Retake specific photo
        if (targetIndex < 0 || targetIndex >= photosToCapture) {
            console.error("Invalid index for retake:", targetIndex);
            alert("Invalid photo selected for retake.");
            setCaptureControlsEnabled(false);
            toggleButtonsDuringCaptureSequence(false); // Re-enable
            updatePhotoProgressText();
            return;
        }
        await runCountdown(3);
        flashOverlay.classList.add('active');
        setTimeout(() => {
            flashOverlay.classList.remove('active');
        }, 100);

        await sendFrameToWorker(targetIndex);
    }

    // Re-enable controls after capture sequence
    setCaptureControlsEnabled(false); // This re-enables selects, etc.
    toggleButtonsDuringCaptureSequence(false); // This re-displays relevant buttons based on capture state

    // Remove 'selected' class from any photo that might have it
    const currentlySelected = photoGrid.querySelector('.captured-photo-wrapper.selected');
    if (currentlySelected) {
        currentlySelected.classList.remove('selected');
    }
    selectedPhotoIndex = -1; // Reset selected photo after capture
    updatePhotoProgressText(); // Update progress text and button states
}

/**
 * Hides/shows all control buttons based on whether a capture sequence is active.
 * This is crucial for preventing interaction with other buttons during countdowns/captures.
 * @param {boolean} hide - True to hide buttons, false to show them.
 */
function toggleButtonsDuringCaptureSequence(hide) {
    const allControlButtons = [
        captureBtnFullscreen,
        captureBtnNormalMode,
        nextBtn,
        backToLayoutBtn,
        fullscreenToggleBtn,
        invertCameraButton,
        retakePhotoBtn,
        // Also consider the parent elements of selects to hide them entirely
        filterSelect.parentElement,
        cameraSelect.parentElement
    ];

    allControlButtons.forEach(btn => {
        if (btn) { // Check if element exists
            btn.style.display = hide ? 'none' : ''; // Use empty string to revert to default display
        }
    });

    // Re-apply specific visibility rules after the sequence (only if not hiding)
    if (!hide) {
        toggleCaptureButtonVisibility(); // Manages captureBtnFullscreen/NormalMode
        updatePhotoProgressText(); // Manages nextBtn and retakePhotoBtn visibility/disabled state
    }
}


/**
 * Allows the user to retake a specific photo.
 */
async function retakeSelectedPhoto() {
    if (selectedPhotoIndex === -1) {
        alert("Please select a photo from 'Your Shots' to retake.");
        return;
    }
    if (confirm(`Are you sure you want to retake photo number ${selectedPhotoIndex + 1}?`)) {
        console.log(`Retaking photo at index: ${selectedPhotoIndex}`);
        const currentlySelectedElement = photoGrid.querySelector(`[data-index="${selectedPhotoIndex}"]`);
        if (currentlySelectedElement) {
            currentlySelectedElement.classList.remove('selected');
        }
        await initiateCaptureSequence(selectedPhotoIndex);
    }
}


/**
 * Handles selection/deselection of photos in the grid.
 * @param {Event} event - The click event.
 */
function handlePhotoSelection(event) {
    const clickedWrapper = event.target.closest('.captured-photo-wrapper');
    if (!clickedWrapper) return;

    // Only allow selection if all photos have been captured
    if (capturedPhotos.length !== photosToCapture || photosToCapture === 0) {
        // Optionally, give feedback to the user that they can't select yet
        // alert("You can only select photos for retake once all shots are captured.");
        return;
    }

    const index = parseInt(clickedWrapper.dataset.index, 10);

    // Deselect any previously selected photo
    const currentlySelected = photoGrid.querySelector('.captured-photo-wrapper.selected');
    if (currentlySelected && currentlySelected !== clickedWrapper) {
        currentlySelected.classList.remove('selected');
    }

    // Toggle selection for the clicked photo
    if (clickedWrapper.classList.contains('selected')) {
        clickedWrapper.classList.remove('selected');
        selectedPhotoIndex = -1;
    } else {
        clickedWrapper.classList.add('selected');
        selectedPhotoIndex = index;
    }

    updatePhotoProgressText(); // Update retake button state based on selection
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
        document.body.classList.add('fullscreen-active'); // Add class to body
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
        document.body.classList.remove('fullscreen-active'); // Remove class from body
    }
}

/**
 * Manages the visibility of the two capture buttons based on fullscreen mode.
 * This function should ideally be called *after* `toggleButtonsAfterCapture`
 * to apply the correct capture button if not in the 'all photos captured' state.
 */
function toggleCaptureButtonVisibility() {
    // Only apply if not in a capture sequence and not in "all photos captured" state (which hides both capture buttons)
    if (photosToCapture > 0 && capturedPhotos.length < photosToCapture) {
        if (document.fullscreenElement) {
            captureBtnNormalMode.style.display = 'none';
            captureBtnFullscreen.style.display = 'block';
        } else {
            captureBtnNormalMode.style.display = 'block';
            captureBtnFullscreen.style.display = 'none';
        }
    } else {
        // If all photos are captured, or initially, both capture buttons should be hidden
        captureBtnNormalMode.style.display = 'none';
        captureBtnFullscreen.style.display = 'none';
    }
}


// Listen for fullscreen change events to update UI
document.addEventListener('fullscreenchange', () => {
    toggleCaptureButtonVisibility(); // Re-evaluate capture buttons on fullscreen change
    updatePhotoProgressText(); // This will re-trigger toggleButtonsAfterCapture for other buttons
});


// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    localStorage.removeItem('capturedPhotos');
    photoGrid.innerHTML = '';
    capturedPhotos = [];
    photosCapturedCount = 0;
    selectedPhotoIndex = -1;

    const storedAspectRatio = localStorage.getItem('selectedFrameAspectRatio');
    if (storedAspectRatio) {
        photoFrameAspectRatio = parseFloat(storedAspectRatio);
        updateVideoAspectRatio(photoFrameAspectRatio);
    } else {
        updateVideoAspectRatio(4 / 3);
    }
    populateCameraList();
    updatePhotoProgressText(); // Initial button states and progress text
    toggleCaptureButtonVisibility(); // Initial visibility of capture buttons

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

captureBtnNormalMode.addEventListener('click', () => {
    initiateCaptureSequence();
});

captureBtnFullscreen.addEventListener('click', () => {
    initiateCaptureSequence();
});

retakePhotoBtn.addEventListener('click', retakeSelectedPhoto);


nextBtn.addEventListener('click', () => {
    if (capturedPhotos.length > 0 && capturedPhotos.length === photosToCapture && !nextBtn.disabled) {
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
