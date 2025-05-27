// Strict mode for cleaner code
"use strict";

// --- DOM Element References ---
const video = document.getElementById('cameraFeed');
const captureBtn = document.getElementById('captureBtn');
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
const undoLastPhotoBtn = document.getElementById('undoLastPhotoBtn'); 
const invertCameraButton = document.getElementById('invertCameraButton'); 

// --- Global State Variables ---
let currentStream = null; 
let capturedPhotos = []; // Stores base64 image data
let photosToCapture = 0; 
let photosCapturedCount = 0; 
let photoFrameAspectRatio = 4 / 3; 

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
}

/**
 * Updates the video preview area's aspect ratio based on the chosen photo strip layout.
 * @param {number} aspectRatio - The width/height aspect ratio of a single photo frame.
 */
function updateVideoAspectRatio(aspectRatio) {
    const videoPreviewArea = document.querySelector('.video-preview-area');
    if (videoPreviewArea) {
        videoPreviewArea.style.setProperty('--video-aspect-ratio', `${aspectRatio}`);
        console.log(`Video preview aspect ratio set to: ${aspectRatio}`);
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
        // Request media devices to get permission prompt early and enumerate devices
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
            startCamera(cameraSelect.options[0].value);
        } else {
            // This case should ideally not be reached if videoInputDevices.length > 0
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
 * It requests the highest available resolution *that the device is capable of providing by default*.
 * No explicit width/height constraints are set here to allow the browser to select the optimal
 * resolution for the camera, which is usually the best "good resolution" without forcing maxes.
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
                // By omitting specific width/height, the browser will attempt to use the camera's
                // native and typically highest available resolution that is considered "good" for streaming.
                // This aligns with "what the device is capable of, but at a good resolution."
            },
            audio: false // Ensure audio is not requested
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        currentStream = stream;

        video.onloadedmetadata = () => {
            video.play();
            hideCameraMessage();
            setCaptureControlsEnabled(false);
            showCameraLoadingSpinner(false); 
            console.log(`Camera active at resolution: ${video.videoWidth}x${video.videoHeight}`);
        };

    } catch (error) {
        console.error('Error starting camera stream:', error);
        handleCameraError(error);
        setCaptureControlsEnabled(true);
        showCameraLoadingSpinner(false); 
    }
}

// --- Photo Capture Logic ---

/**
 * Manages the entire photo capture sequence with countdowns and multiple shots.
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

    const storedPhotoCount = localStorage.getItem('selectedPhotoCount');
    photosToCapture = parseInt(storedPhotoCount, 10);

    if (isNaN(photosToCapture) || photosToCapture < 1 || photosToCapture > 6 || photosToCapture === 5) {
        console.warn(`Invalid or missing selectedPhotoCount (${storedPhotoCount}) from localStorage. Defaulting to 3 photos.`);
        photosToCapture = 3;
    }

    setCaptureControlsEnabled(true); // Disable all controls during capture
    captureBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    undoLastPhotoBtn.style.display = 'none'; 

    photosCapturedCount = 0;
    capturedPhotos = []; // Clear previously captured photos
    photoGrid.innerHTML = ''; // Clear displayed photos

    while (photosCapturedCount < photosToCapture) {
        await runCountdown(3);
        showPhotoProcessingSpinner(true); 
        takePhoto();
        showPhotoProcessingSpinner(false); 
        photosCapturedCount++;

        if (photosCapturedCount < photosToCapture) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Pause between shots
        }
    }

    setCaptureControlsEnabled(false); // Re-enable controls if appropriate
    captureBtn.style.display = 'block'; // Show capture button again
    nextBtn.style.display = 'block'; // Show next button
    updateUndoButtonVisibility(); 
}

/**
 * Handles the visual countdown display before each photo is taken.
 */
function runCountdown(duration) {
    return new Promise(resolve => {
        let count = duration;
        countdownElement.innerText = count;
        countdownElement.style.display = 'block';

        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                countdownElement.innerText = count;
            } else {
                clearInterval(timer);
                countdownElement.style.display = 'none';
                resolve();
            }
        }, 1000);
    });
}

/**
 * Captures a single frame from the video feed at its *actual active resolution*,
 * applies the selected filter, and crops it to the desired frame aspect ratio
 * before adding to the display and `capturedPhotos` array.
 */
function takePhoto() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const videoActualWidth = video.videoWidth;
    const videoActualHeight = video.videoHeight;
    const videoActualAspectRatio = videoActualWidth / videoActualHeight;

    let sx = 0; 
    let sy = 0; 
    let sWidth = videoActualWidth; 
    let sHeight = videoActualHeight; 

    // Calculate source cropping to match desired photoFrameAspectRatio
    if (videoActualAspectRatio > photoFrameAspectRatio) { 
        sWidth = videoActualHeight * photoFrameAspectRatio;
        sx = (videoActualWidth - sWidth) / 2; 
    } else if (videoActualAspectRatio < photoFrameAspectRatio) { 
        sHeight = videoActualWidth / photoFrameAspectRatio;
        sy = (videoActualHeight - sHeight) / 2; 
    }

    // Set canvas dimensions to the *effective* resolution of the cropped image
    canvas.width = sWidth; 
    canvas.height = sHeight;

    ctx.filter = filterSelect.value;
    // Draw the cropped portion of the video onto the canvas
    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

    const imgData = canvas.toDataURL('image/png');
    capturedPhotos.push(imgData);

    const imgElement = document.createElement('img');
    imgElement.src = imgData;
    imgElement.alt = `Captured Photo ${capturedPhotos.length}`; // Use actual length for alt text
    imgElement.classList.add('captured-photo-item');
    photoGrid.prepend(imgElement); // Prepend to show newest on top
    updateUndoButtonVisibility(); 
}

/**
 * Updates the visibility of the undo button based on whether photos have been captured.
 */
function updateUndoButtonVisibility() {
    if (capturedPhotos.length > 0) {
        undoLastPhotoBtn.style.display = 'block';
    } else {
        undoLastPhotoBtn.style.display = 'none';
    }
}

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    const storedAspectRatio = localStorage.getItem('selectedFrameAspectRatio');
    if (storedAspectRatio) {
        photoFrameAspectRatio = parseFloat(storedAspectRatio);
        updateVideoAspectRatio(photoFrameAspectRatio);
    } else {
        console.warn("No aspect ratio found in localStorage. Using default 4:3.");
        updateVideoAspectRatio(4 / 3); // Ensure a default is applied
    }
    populateCameraList();
    updateUndoButtonVisibility(); 
});

cameraSelect.addEventListener('change', (event) => {
    startCamera(event.target.value);
});

filterSelect.addEventListener('change', () => {
    video.style.filter = filterSelect.value;
});

captureBtn.addEventListener('click', initiateCaptureSequence);

nextBtn.addEventListener('click', () => {
    // Only proceed if at least one photo is captured
    if (capturedPhotos.length > 0) {
        localStorage.setItem('capturedPhotos', JSON.stringify(capturedPhotos));
        window.location.href = 'editing-page/editing-home.html';
    } else {
        alert("Please capture at least one photo before proceeding to the editor!");
    }
});

undoLastPhotoBtn.addEventListener('click', () => {
    if (capturedPhotos.length > 0) {
        capturedPhotos.pop(); 
        
        // Remove the last photo's image element from the DOM (which was prepended, so it's firstChild)
        if (photoGrid.firstChild) {
            photoGrid.removeChild(photoGrid.firstChild);
        }
        
        photosCapturedCount--; // Decrement the counter
        
        updateUndoButtonVisibility(); 
        
        // If all photos are undone, re-enable capture button and hide next/undo
        if (capturedPhotos.length === 0) {
            captureBtn.style.display = 'block';
            nextBtn.style.display = 'none';
            // Re-enable camera and filter selects only if a stream is active
            if (currentStream && video.srcObject && cameraAccessMessage.style.display === 'none') {
                 filterSelect.disabled = false;
                 cameraSelect.disabled = false;
                 invertCameraButton.disabled = false; 
            }
        }
    } else {
        alert("No photos to undo!");
    }
});

// Invert Camera Button Listener
invertCameraButton.addEventListener('click', () => {
    video.classList.toggle('inverted');
    // You might also want to save this preference if the user moves between pages
    // localStorage.setItem('isCameraInverted', video.classList.contains('inverted'));
});

// Optional: Apply initial inversion if saved preference exists
// document.addEventListener('DOMContentLoaded', () => {
//     if (localStorage.getItem('isCameraInverted') === 'true') {
//         video.classList.add('inverted');
//     }
// });