// capture-page/capture.js

// Strict mode for cleaner code
"use strict";

// --- DOM Element References ---
const video = document.getElementById('cameraFeed');
const captureBtn = document.getElementById('captureBtn');
const nextBtn = document.getElementById('nextBtn');
const photoGrid = document.getElementById('captured-photos-grid');
const filterSelect = document.getElementById('filter');
const cameraSelect = document.getElementById('cameraSelect');
const countdownElement = document.getElementById('countdown'); // Old text countdown (will be hidden by CSS)
const cameraAccessMessage = document.getElementById('camera-access-message');
const mainCameraMsg = document.getElementById('main-camera-msg'); 
const subCameraMsg = document.getElementById('sub-camera-msg');   

const cameraLoadingSpinner = document.getElementById('camera-loading-spinner'); 
const photoProcessingSpinner = document.getElementById('photo-processing-spinner'); 

// Removed: const retakeSelectedPhotoBtn = document.getElementById('retakeSelectedPhotoBtn'); 
const invertCameraButton = document.getElementById('invertCameraButton'); 
const backToLayoutBtn = document.getElementById('backToLayoutBtn'); // New: Back to Layout Selection button
const fullscreenToggleBtn = document.getElementById('fullscreenToggleBtn'); // New: Fullscreen toggle button
const videoPreviewArea = document.querySelector('.video-preview-area'); // New: Reference to video preview area


// Visual Countdown and Flash Overlay Elements
const visualCountdown = document.getElementById('visualCountdown');
const flashOverlay = document.getElementById('flashOverlay');

// Photo Progress Text Element
const photoProgressText = document.getElementById('photoProgressText');


// --- Global State Variables ---
let currentStream = null; 
let capturedPhotos = []; // Stores base64 image data
let photosToCapture = 0; 
let photosCapturedCount = 0; // Tracks photos taken in current sequence (not total capturedPhotos.length)
let photoFrameAspectRatio = 4 / 3; 

// Removed: For selective retake functionality
// Removed: let selectedPhotoIndexForRetake = -1; // -1 means no photo is selected for retake

// Removed: NEW: State for retake preparation
// Removed: let isReadyToRetake = false; // True when a photo is selected and 'Retake Selected Photo' is pressed, waiting for 'Start Retake'

// NEW: Web Worker for image processing
let imageProcessorWorker = null;
let offscreenCanvasInstance = null;


// --- Utility Functions ---

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
    captureBtn.disabled = disabled;
    filterSelect.disabled = disabled;
    cameraSelect.disabled = disabled;
    invertCameraButton.disabled = disabled; 
    // Removed: retakeSelectedPhotoBtn is managed by updateRetakeButtonState()
    // nextBtn is managed separately
}

/**
 * Updates the video preview area's aspect ratio based on the chosen photo strip layout.
 * @param {number} aspectRatio - The width/height aspect ratio of a single photo frame.
 */
function updateVideoAspectRatio(aspectRatio) {
    if (videoPreviewArea) {
        videoPreviewArea.style.setProperty('--video-aspect-ratio', `${aspectRatio}`);
        console.log(`Video preview aspect ratio set to: ${aspectRatio}`);
    }
    // NEW: Also inform the worker about the aspect ratio change
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
}

// Removed: NEW: Updates the disabled state of the retake button based on selection and current state
// Removed: function updateRetakeButtonState() {
// Removed:     // Retake button enabled only if a photo is selected AND we are NOT in the 'ready to retake' state
// Removed:     retakeSelectedPhotoBtn.disabled = (selectedPhotoIndexForRetake === -1 || isReadyToRetake);
// Removed:     retakeSelectedPhotoBtn.style.display = isReadyToRetake ? 'none' : 'flex'; // Hide if ready to retake
// Removed: }

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

        // MODIFIED: Start camera only once after populating the list
        if (cameraSelect.options.length > 0) {
            // Select the first option and then start the camera with its value
            cameraSelect.selectedIndex = 0; 
            startCamera(cameraSelect.value); // This is the single initial call
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
        console.log('Main Thread: Existing camera stream stopped.');
    }

    showCameraLoadingSpinner(true); 
    console.log('Main Thread: Attempting to start camera stream...');

    try {
        const constraints = {
            video: {
                deviceId: deviceId ? { exact: deviceId } : undefined,
                // MODIFIED: Request a more common and compatible resolution (640x480)
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
            // Log the actual resolution obtained
            console.log(`Main Thread: Camera active at resolution: ${video.videoWidth}x${video.videoHeight}`);
            
            // NEW: Initialize OffscreenCanvas and Web Worker once video metadata is loaded
            initializeImageProcessorWorker();
        };

    } catch (error) {
        console.error('Error starting camera stream:', error);
        handleCameraError(error);
        setCaptureControlsEnabled(true);
        showCameraLoadingSpinner(false); 
    }
}

/**
 * NEW: Initializes the Web Worker and OffscreenCanvas.
 */
function initializeImageProcessorWorker() {
    if (imageProcessorWorker) {
        // If already initialized, send a message to clean up the old worker
        imageProcessorWorker.postMessage({ type: 'CLOSE_WORKER' });
        imageProcessorWorker.terminate();
        console.log('Main Thread: Existing Web Worker terminated.');
    }

    const tempCanvas = document.createElement('canvas');
    offscreenCanvasInstance = tempCanvas.transferControlToOffscreen();

    imageProcessorWorker = new Worker('capture-page/image-processor.js');
    console.log('Main Thread: Web Worker created.');

    imageProcessorWorker.postMessage({
        type: 'INIT',
        payload: {
            canvas: offscreenCanvasInstance,
            aspectRatio: photoFrameAspectRatio
        }
    }, [offscreenCanvasInstance]);

    // START OF FIX: Handle blob from worker and convert it on the main thread
    imageProcessorWorker.onmessage = (event) => {
        if (event.data.type === 'FRAME_PROCESSED') {
            const { blob, indexToReplace } = event.data.payload;
            console.log('Main Thread: Blob received from worker.');

            const reader = new FileReader();
            reader.onloadend = () => {
                const imgData = reader.result;
                handleProcessedPhoto(imgData, indexToReplace);
                showPhotoProcessingSpinner(false);
            };
            reader.readAsDataURL(blob);
        }
    };
    // END OF FIX

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
 * Handles the visual countdown display before each photo is taken.
 */
function runCountdown(duration) {
    return new Promise(resolve => {
        let count = duration;
        visualCountdown.style.opacity = 1;
        visualCountdown.style.display = 'block'; 
        visualCountdown.textContent = count;
        visualCountdown.classList.add('animate'); 

        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                visualCountdown.textContent = count;
                visualCountdown.classList.remove('animate');
                void visualCountdown.offsetWidth; 
                visualCountdown.classList.add('animate');
            } else {
                clearInterval(timer);
                visualCountdown.classList.remove('animate'); 
                visualCountdown.style.opacity = 0; 
                visualCountdown.style.display = 'none'; 
                resolve();
            }
        }, 1000);
    });
}

/**
 * NEW: Sends a video frame to the Web Worker for processing.
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
    console.log('Main Thread: ImageBitmap sent to worker.');
}

/**
 * NEW: Handles the photo data received back from the worker.
 * @param {string} imgData - Base64 data URL of the processed image.
 * @param {number} indexToReplace - The index in capturedPhotos array that was processed.
 */
function handleProcessedPhoto(imgData, indexToReplace) {
    // Modified: Logic to only add new photos, no retake
    if (indexToReplace === -1) { // Only add if it's a new photo
        capturedPhotos.push(imgData); 
        photosCapturedCount++; 
        addPhotoToGrid(imgData, capturedPhotos.length - 1); 
        console.log(`Main Thread: New photo added to grid at index ${capturedPhotos.length - 1}.`);
    }
    updatePhotoProgressText(); 
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

    if (capturedPhotos.length === photosToCapture && photosToCapture > 0) {
        // Modified: Removed retake alert, now just indicates all captured
        alert('All photos have already been captured. Click "Go to Editor" to proceed.');
        return;
    }

    const storedPhotoCount = localStorage.getItem('selectedPhotoCount');
    photosToCapture = parseInt(storedPhotoCount, 10);

    if (isNaN(photosToCapture) || photosToCapture < 1 || photosToCapture > 6 || photosToCapture === 5) {
        console.warn(`Invalid or missing selectedPhotoCount (${storedPhotoCount}) from localStorage. Defaulting to 3 photos.`);
        photosToCapture = 3;
    }

    setCaptureControlsEnabled(true); 
    captureBtn.style.display = 'none'; 
    nextBtn.style.display = 'none'; 
    // Removed: retakeSelectedPhotoBtn.style.display = 'none'; 
    backToLayoutBtn.style.display = 'none'; // Hide "Back to Layout" during capture
    fullscreenToggleBtn.style.display = 'none'; // Hide fullscreen toggle during capture


    if (capturedPhotos.length === 0) {
        photoGrid.innerHTML = ''; 
        capturedPhotos = []; // Clear array for a fresh capture sequence
    }
    
    while (capturedPhotos.length < photosToCapture) {
        console.log(`Main Thread: Starting countdown for photo ${capturedPhotos.length + 1} of ${photosToCapture}.`);
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

    // After capture, re-enable/show appropriate buttons
    setCaptureControlsEnabled(false); // Re-disable controls once capture is done
    captureBtn.style.display = 'block'; // Show capture button again
    captureBtn.textContent = 'Start Capture'; // Reset button text
    nextBtn.style.display = 'block'; // Show next button
    backToLayoutBtn.style.display = 'block'; // Show back to layout button
    fullscreenToggleBtn.style.display = 'block'; // Show fullscreen toggle again

    // Re-enable capture button if more photos are needed, or if it's a new sequence
    if (capturedPhotos.length < photosToCapture) {
        captureBtn.disabled = false;
    } else {
        captureBtn.disabled = true; // All photos captured, disable capture
    }

    console.log('Main Thread: Photo capture sequence completed.');
}

// Removed: Transitions the UI into a state where photos can be selected for retake.
// Removed: function enterRetakeMode() {
// Removed:     setCaptureControlsEnabled(false);
// Removed:     captureBtn.style.display = 'none';
// Removed:     nextBtn.style.display = 'block';
// Removed:     retakeSelectedPhotoBtn.style.display = 'flex';
    
// Removed:     selectedPhotoIndexForRetake = -1;
// Removed:     updateRetakeButtonState();
// Removed:     console.log('Main Thread: Entered retake mode.');
// Removed: }

// Removed: Handles selection/deselection of photos in the grid for retake.
function handlePhotoSelection(event) {
    // No longer for retake, but could be for future features if needed.
    // For now, it just prevents selection.
    const clickedWrapper = event.target.closest('.captured-photo-wrapper');
    if (!clickedWrapper) return;

    // Remove selection visuals if any were mistakenly applied
    const currentlySelected = photoGrid.querySelector('.captured-photo-wrapper.selected');
    if (currentlySelected) {
        currentlySelected.classList.remove('selected');
    }
    // Prevent selection if no retake feature
    console.log("Main Thread: Photo selection is currently disabled.");
}

// Removed: NEW: Prepares the UI for a single retake capture
// Removed: function prepareForRetake() {
// Removed:     isReadyToRetake = true;
// Removed:     setCaptureControlsEnabled(true);
    
// Removed:     retakeSelectedPhotoBtn.style.display = 'none';
// Removed:     nextBtn.style.display = 'none';

// Removed:     captureBtn.style.display = 'block';
// Removed:     captureBtn.textContent = `Start Retake Photo ${selectedPhotoIndexForRetake + 1}`;
// Removed:     captureBtn.disabled = false;
// Removed:     console.log(`Main Thread: Prepared for retake of photo ${selectedPhotoIndexForRetake + 1}.`);
// Removed: }

// Removed: NEW: Executes the single retake capture (countdown + take photo)
// Removed: async function executeRetakeCapture() {
// Removed:     if (selectedPhotoIndexForRetake === -1) {
// Removed:         console.error("Main Thread: No photo selected for retake, but executeRetakeCapture was called.");
// Removed:         exitRetakePreparationState();
// Removed:         return;
// Removed:     }

// Removed:     setCaptureControlsEnabled(true);
// Removed:     captureBtn.disabled = true;

// Removed:     console.log(`Main Thread: Starting countdown for retake of photo ${selectedPhotoIndexForRetake + 1}.`);
// Removed:     await runCountdown(3);
// Removed:     flashOverlay.classList.add('active');
// Removed:     setTimeout(() => {
// Removed:         flashOverlay.classList.remove('active');
// Removed:     }, 100); 
    
// Removed:     await sendFrameToWorker(selectedPhotoIndexForRetake);

// Removed:     console.log(`Main Thread: Retake capture for photo ${selectedPhotoIndexForRetake + 1} initiated.`);
// Removed:     exitRetakePreparationState();
// Removed: }

// Removed: NEW: Resets the UI state after a retake operation
// Removed: function exitRetakePreparationState() {
// Removed:     isReadyToRetake = false;
    
// Removed:     captureBtn.style.display = 'block';
// Removed:     captureBtn.textContent = 'Start Capture';
    
// Removed:     retakeSelectedPhotoBtn.style.display = 'flex';
// Removed:     nextBtn.style.display = 'block';

// Removed:     const selectedWrapper = photoGrid.querySelector('.captured-photo-wrapper.selected');
// Removed:     if (selectedWrapper) {
// Removed:         selectedWrapper.classList.remove('selected');
// Removed:     }
// Removed:     selectedPhotoIndexForRetake = -1;
// Removed:     updateRetakeButtonState();
// Removed:     setCaptureControlsEnabled(false);
// Removed:     console.log('Main Thread: Exited retake preparation state.');
// Removed: }

// Removed: Handles the click event for the "Retake Selected Photo" button.
// Removed: async function handleRetakeBtnClick() {
// Removed:     if (selectedPhotoIndexForRetake === -1) {
// Removed:         alert('Please select a photo to retake first!');
// Removed:         return;
// Removed:     }

// Removed:     const confirmRetake = confirm(`You are about to retake photo ${selectedPhotoIndexForRetake + 1}. Proceed?`);
// Removed:     if (!confirmRetake) {
// Removed:         const selectedWrapper = photoGrid.querySelector('.captured-photo-wrapper.selected');
// Removed:         if (selectedWrapper) {
// Removed:             selectedWrapper.classList.remove('selected');
// Removed:         }
// Removed:         selectedPhotoIndexForRetake = -1;
// Removed:         updateRetakeButtonState();
// Removed:         console.log('Main Thread: Retake cancelled by user.');
// Removed:         return;
// Removed:     }

// Removed:     prepareForRetake();

// Removed:     if (video.paused) {
// Removed:         console.log("Main Thread: Video was paused, attempting to play it again.");
// Removed:         try {
// Removed:             await video.play();
// Removed:             console.log("Main Thread: Video playback resumed successfully.");
// Removed:         } catch (error) {
// Removed:             console.error("Main Thread: Error trying to resume video playback:", error);
// Removed:             displayCameraMessage('Camera feed paused.', 'warning', 'Could not resume the camera feed. Please try again.');
// Removed:         }
// Removed:     }
// Removed: }


// --- Fullscreen and UI adjustments ---
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        if (videoPreviewArea.requestFullscreen) {
            videoPreviewArea.requestFullscreen();
        } else if (videoPreviewArea.mozRequestFullScreen) { // Firefox
            videoPreviewArea.mozRequestFullScreen();
        } else if (videoPreviewArea.webkitRequestFullscreen) { // Chrome, Safari and Opera
            videoPreviewArea.webkitRequestFullscreen();
        } else if (videoPreviewArea.msRequestFullscreen) { // IE/Edge
            videoPreviewArea.msRequestFullscreen();
        }
        // Add class to body to adjust styling for fullscreen mode
        document.body.classList.add('fullscreen-active');
        // Move capture button into video preview area
        videoPreviewArea.appendChild(captureBtn);
        captureBtn.classList.add('fullscreen-capture-btn');
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { // Firefox
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // IE/Edge
            document.msExitFullscreen();
        }
    }
}

// Listen for fullscreen change events to update UI
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        document.body.classList.remove('fullscreen-active');
        // Move capture button back to its original parent
        document.querySelector('.action-buttons').prepend(captureBtn); // Assuming it was first
        captureBtn.classList.remove('fullscreen-capture-btn');
    }
});

// Orientation change listener for fullscreen adjustments
window.addEventListener('orientationchange', () => {
    // This event fires when the device orientation changes.
    // CSS should handle most of the resizing based on the fullscreen-active class.
    // No direct JS manipulation needed here unless specific pixel-perfect adjustments are required.
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
        console.warn("No aspect ratio found in localStorage. Using default 4:3.");
        updateVideoAspectRatio(4 / 3); 
    }
    populateCameraList();
    updatePhotoProgressText(); 
    // Removed: updateRetakeButtonState(); 
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
    console.log(`Main Thread: Filter changed to ${selectedFilter}. Worker notified.`);
});

captureBtn.addEventListener('click', () => {
    // Modified: No longer checks for isReadyToRetake
    initiateCaptureSequence(); 
});

// Removed: retakeSelectedPhotoBtn.addEventListener('click', handleRetakeBtnClick);

nextBtn.addEventListener('click', () => {
    if (capturedPhotos.length > 0 && capturedPhotos.length === photosToCapture) { 
        localStorage.setItem('capturedPhotos', JSON.stringify(capturedPhotos));
        window.location.href = 'editing-page/editing-home.html';
    } else {
        const remaining = photosToCapture - capturedPhotos.length;
        alert(`Please capture ${remaining} more photo(s) before proceeding!`); 
    }
});

photoGrid.addEventListener('click', handlePhotoSelection); // Keeps the event listener, but its function is modified

invertCameraButton.addEventListener('click', () => {
    video.classList.toggle('inverted');
    console.log('Main Thread: Camera inversion toggled.');
});

backToLayoutBtn.addEventListener('click', () => {
    window.location.href = 'index.html'; // Adjust this path if your layout selection page is different
});

fullscreenToggleBtn.addEventListener('click', toggleFullScreen); // New: Fullscreen toggle event listener

window.addEventListener('beforeunload', () => {
    if (imageProcessorWorker) {
        imageProcessorWorker.postMessage({ type: 'CLOSE_WORKER' });
        imageProcessorWorker.terminate();
        imageProcessorWorker = null;
        console.log('Main Thread: Web Worker terminated on page unload.');
    }
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
        console.log('Main Thread: Camera stream stopped on page unload.');
    }
});
