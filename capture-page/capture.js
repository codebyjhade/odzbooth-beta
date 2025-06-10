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

// New: Retake button reference
const retakeSelectedPhotoBtn = document.getElementById('retakeSelectedPhotoBtn');
// New: Resolution select reference
const resolutionSelect = document.getElementById('resolutionSelect');


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

// New: Variable to store the index of the photo to be retaken
let selectedIndexForRetake = -1;

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
 * Disables/enables capture controls (buttons, selects).
 * @param {boolean} disabled - True to disable, false to enable.
 */
function setCaptureControlsEnabled(disabled) {
    // captureBtn visibility/disabled state is now handled by toggleCaptureButtonPosition
    filterSelect.disabled = disabled;
    cameraSelect.disabled = disabled;
    resolutionSelect.disabled = disabled; // Disable resolution select
    invertCameraButton.disabled = disabled; 
    backToLayoutBtn.disabled = disabled;
    fullscreenToggleBtn.disabled = disabled;
    nextBtn.disabled = disabled; 
    captureBtnNormalMode.disabled = disabled; // Disable normal mode capture button
    retakeSelectedPhotoBtn.disabled = disabled || selectedIndexForRetake === -1; // Disable retake if no photo is selected
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
    } else if (photosToCapture > 0 && capturedPhotos.length < photosToCapture) {
        photoProgressText.textContent += ` (${photosToCapture - capturedPhotos.length} remaining)`;
    }
    
    // Control "Go to Editor" and "Retake Selected Photo" button visibility
    if (capturedPhotos.length === photosToCapture && photosToCapture > 0) {
        nextBtn.style.display = 'block';
        nextBtn.disabled = false;
        retakeSelectedPhotoBtn.style.display = 'block';
        retakeSelectedPhotoBtn.disabled = selectedIndexForRetake === -1; // Only enable if a photo is selected
    } else {
        nextBtn.style.display = 'none';
        nextBtn.disabled = true;
        retakeSelectedPhotoBtn.style.display = 'none'; // Hide retake button during active capture
        retakeSelectedPhotoBtn.disabled = true;
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
 * Starts the camera stream for the given device ID and resolution.
 */
async function startCamera(deviceId) {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }

    showCameraLoadingSpinner(true); 

    let width = 640;
    let height = 480;

    const selectedResolution = resolutionSelect.value;
    if (selectedResolution !== 'default') {
        [width, height] = selectedResolution.split('x').map(Number);
    }

    try {
        const constraints = {
            video: {
                deviceId: deviceId ? { exact: deviceId } : undefined,
                width: { ideal: width, min: 480 }, 
                height: { ideal: height, min: 360 }  
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
    } else {
        capturedPhotos.push(imgData); 
        photosCapturedCount++; 
        addPhotoToGrid(imgData, capturedPhotos.length - 1); 
    }
    updatePhotoProgressText(); 
    // After a photo is processed (either new or retaken), re-evaluate button visibility
    toggleCaptureButtonVisibility();
    if (capturedPhotos.length === photosToCapture) {
        showPostCaptureButtons();
    }
}

/**
 * Manages the initial photo capture sequence with countdowns and multiple shots.
 */
async function initiateCaptureSequence() {
    if (!currentStream || video.srcObject === null || video.paused) {
        displayCameraMessage(
            'Camera not active or paused.',
            'warning',
            'Please ensure camera access is granted and the live feed is visible before starting.'
        );
        return;
    }

    // Crucial: Attempt to unlock audio context directly on this user interaction
    // This will ensure the audio context is ready for the first beep.
    if (!userInteracted) {
        try {
            countdownBeep.muted = false;
            cameraShutter.muted = false;
            // Play a very brief, silent sound to explicitly unlock the audio context
            await countdownBeep.play();
            countdownBeep.pause();
            countdownBeep.currentTime = 0;
            userInteracted = true; // Mark as interacted
            console.log("Audio context unlocked by Start Capture button click.");
        } catch (e) {
            console.warn("Audio autoplay blocked by explicit play attempt:", e);
            // This could still happen in very strict environments, but less likely.
            // Consider showing a UI message if audio is critical and fails here.
        }
    }


    if (capturedPhotos.length === photosToCapture && photosToCapture > 0) {
        alert('All photos have already been captured. Click "Go to Editor" to proceed or select a photo to retake.');
        showPostCaptureButtons();
        return;
    }

    const storedPhotoCount = localStorage.getItem('selectedPhotoCount');
    photosToCapture = parseInt(storedPhotoCount, 10);

    if (isNaN(photosToCapture) || photosToCapture < 1 || photosToCapture > 6 || photosToCapture === 5) {
        photosToCapture = 3;
    }

    setCaptureControlsEnabled(true); 
    // Hide relevant buttons during capture sequence
    hideAllActionButtons();


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

    setCaptureControlsEnabled(false); 
    showPostCaptureButtons();
    toggleCaptureButtonVisibility(); // Update button visibility after capture sequence
    updatePhotoProgressText(); 
}

/**
 * Handles selection/deselection of photos in the grid.
 * @param {Event} event - The click event.
 */
function handlePhotoSelection(event) {
    const clickedWrapper = event.target.closest('.captured-photo-wrapper');
    if (!clickedWrapper) return;

    const index = parseInt(clickedWrapper.dataset.index, 10);

    // Deselect if the same photo is clicked again, or if a different one is selected
    if (clickedWrapper.classList.contains('selected')) {
        clickedWrapper.classList.remove('selected');
        selectedIndexForRetake = -1;
    } else {
        // Remove 'selected' from any previously selected photo
        const currentlySelected = photoGrid.querySelector('.captured-photo-wrapper.selected');
        if (currentlySelected) {
            currentlySelected.classList.remove('selected');
        }
        // Select the new photo
        clickedWrapper.classList.add('selected');
        selectedIndexForRetake = index;
    }
    
    // Enable/disable the retake button based on selection
    retakeSelectedPhotoBtn.disabled = selectedIndexForRetake === -1;
}

/**
 * Initiates the retake process for the currently selected photo.
 */
async function retakeSelectedPhoto() {
    if (selectedIndexForRetake === -1 || capturedPhotos.length === 0) {
        alert("Please select a photo to retake.");
        return;
    }

    // Deselect the photo visually
    const currentlySelected = photoGrid.querySelector('.captured-photo-wrapper.selected');
    if (currentlySelected) {
        currentlySelected.classList.remove('selected');
    }

    setCaptureControlsEnabled(true);
    hideAllActionButtons(); // Hide all buttons including capture during retake

    await runCountdown(3); // Run countdown for the retake
    flashOverlay.classList.add('active');
    setTimeout(() => {
        flashOverlay.classList.remove('active');
    }, 100); 
    
    await sendFrameToWorker(selectedIndexForRetake); // Send frame with the index to replace
    selectedIndexForRetake = -1; // Reset selected index

    setCaptureControlsEnabled(false);
    showPostCaptureButtons(); // Show post-capture buttons again
    updatePhotoProgressText();
    retakeSelectedPhotoBtn.disabled = true; // Disable until another selection
}

/**
 * Hides all main action buttons (capture, invert, fullscreen, back to layout, retake, next).
 */
function hideAllActionButtons() {
    captureBtnFullscreen.style.display = 'none'; 
    captureBtnNormalMode.style.display = 'none'; 
    nextBtn.style.display = 'none'; 
    backToLayoutBtn.style.display = 'none'; 
    fullscreenToggleBtn.style.display = 'none';
    invertCameraButton.style.display = 'none'; 
    retakeSelectedPhotoBtn.style.display = 'none'; 
}

/**
 * Shows buttons relevant after all photos are captured.
 */
function showPostCaptureButtons() {
    backToLayoutBtn.style.display = 'block'; 
    fullscreenToggleBtn.style.display = 'block';
    invertCameraButton.style.display = 'block'; 
    nextBtn.style.display = 'block'; // Show "Go to Editor"
    retakeSelectedPhotoBtn.style.display = 'block'; // Show "Retake Selected Photo"
    retakeSelectedPhotoBtn.disabled = selectedIndexForRetake === -1; // Initially disabled if no photo is selected
    nextBtn.disabled = false;
    toggleCaptureButtonVisibility(); // Update button visibility based on fullscreen status
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
 * Also ensures 'Go to Editor' and 'Retake' buttons are shown only when photos are captured.
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

    // Always disable capture buttons if all photos are captured
    if (capturedPhotos.length === photosToCapture && photosToCapture > 0) {
        captureBtnNormalMode.disabled = true;
        captureBtnFullscreen.disabled = true;
    } else {
        captureBtnNormalMode.disabled = false;
        captureBtnFullscreen.disabled = false;
    }
    
    // Ensure post-capture buttons are only shown when all photos are captured
    if (capturedPhotos.length === photosToCapture && photosToCapture > 0) {
        showPostCaptureButtons();
    } else {
        nextBtn.style.display = 'none';
        retakeSelectedPhotoBtn.style.display = 'none';
    }
}


// Listen for fullscreen change events to update UI
document.addEventListener('fullscreenchange', () => {
    toggleCaptureButtonVisibility();
    // In fullscreen, hide the control panel and captured photos display
    if (document.fullscreenElement) {
        document.body.classList.add('fullscreen-active');
    } else {
        document.body.classList.remove('fullscreen-active');
    }
});


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

resolutionSelect.addEventListener('change', () => {
    startCamera(cameraSelect.value); // Restart camera with new resolution
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

// New: Event listener for the retake button
retakeSelectedPhotoBtn.addEventListener('click', retakeSelectedPhoto);

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
