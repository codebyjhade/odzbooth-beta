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
const resolutionSelect = document.getElementById('resolutionSelect'); 

const cameraAccessMessage = document.getElementById('camera-access-message');
const mainCameraMsg = document.getElementById('main-camera-msg'); 
const subCameraMsg = document.getElementById('sub-camera-msg');   

const cameraLoadingSpinner = document.getElementById('camera-loading-spinner'); 
const photoProcessingSpinner = document.getElementById('photo-processing-spinner'); 

const invertCameraButton = document.getElementById('invertCameraButton'); 
const backToLayoutBtn = document.getElementById('backToLayoutBtn'); 
const fullscreenToggleBtn = document.getElementById('fullscreenToggleBtn'); 
const videoPreviewArea = document.querySelector('.video-preview-area'); 

const startCameraButton = document.getElementById('startCameraButton'); 
const retryCameraButton = document.getElementById('retryCameraButton'); 
const retakePhotosBtn = document.getElementById('retakePhotosBtn'); 
const retakeIndividualPhotoBtn = document.getElementById('retakeIndividualPhotoBtn'); 

// Visual Countdown and Flash Overlay Elements
const visualCountdown = document.getElementById('visualCountdown');
const flashOverlay = document.getElementById('flashOverlay');

// Photo Progress Text Element
const photoProgressText = document.getElementById('photoProgressText');
const photoProgressIndicator = document.getElementById('photoProgressIndicator'); 

// Audio Elements
const countdownBeep = document.getElementById('countdownBeep');
const cameraShutter = document.getElementById('cameraShutter');

// --- Global State Variables ---
let currentStream = null; 
let capturedPhotos = []; 
let photosToCapture = 0; 
let photoFrameAspectRatio = 4 / 3; 
let selectedCameraDeviceId = 'auto'; // Default to 'auto' for initial camera, will be updated
let selectedResolution = { width: 1280, height: 720 }; 

let imageProcessorWorker = null;
let offscreenCanvasInstance = null;

let userInteracted = false; 
let cameraActive = false; 

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
 * @param {'info'|'warning'|'error'} type - The type of message for styling.
 * @param {string} [subMessage=''] - An optional secondary message.
 * @param {boolean} showStartButton - Show primary 'Start Camera' button.
 * @param {boolean} showRetryButton - Show secondary 'Retry Camera' button.
 */
function displayCameraMessage(message, type = 'info', subMessage = '', showStartButton = false, showRetryButton = false) {
    mainCameraMsg.innerText = message;
    subCameraMsg.innerText = subMessage;
    cameraAccessMessage.className = `message ${type}`; 
    cameraAccessMessage.style.display = 'flex'; 
    startCameraButton.style.display = showStartButton ? 'block' : 'none';
    retryCameraButton.style.display = showRetryButton ? 'block' : 'none'; 
    video.style.display = 'none'; 
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
 * Disables/enables main capture controls (selects).
 * Buttons are handled by updateButtonVisibility.
 * @param {boolean} disabled - True to disable, false to enable.
 */
function setCaptureControlsEnabled(disabled) {
    filterSelect.disabled = disabled;
    cameraSelect.disabled = disabled;
    resolutionSelect.disabled = disabled; 
    invertCameraButton.disabled = disabled; 
    backToLayoutBtn.disabled = disabled;
    fullscreenToggleBtn.disabled = disabled;
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
 * Updates the photo progress text and visual indicators (dots).
 */
function updatePhotoProgressText() {
    // Count actual captured photos (not null placeholders)
    const photosTaken = capturedPhotos.filter(p => p !== null).length; 
    photoProgressText.textContent = `Captured: ${photosTaken} of ${photosToCapture}`;
    if (photosToCapture > 0 && photosTaken === photosToCapture) {
        photoProgressText.textContent += ' - All photos captured!';
    } else if (photosToCapture > 0 && photosTaken < photosToCapture) {
        photoProgressText.textContent += ` (${photosToCapture - photosTaken} remaining)`;
    }
    
    // Update visual progress dots
    photoProgressIndicator.innerHTML = '';
    for (let i = 0; i < photosToCapture; i++) {
        const dot = document.createElement('div');
        dot.classList.add('photo-progress-dot');
        // Check if the slot in capturedPhotos array at index 'i' contains an actual image
        if (capturedPhotos[i] !== undefined && capturedPhotos[i] !== null) { 
            dot.classList.add('filled');
        }
        photoProgressIndicator.appendChild(dot);
    }

    updateButtonVisibility(); 
}

// --- Camera Management ---

/**
 * Attempts to initialize the camera stream with given constraints,
 * falling back to lower resolutions or generic video if needed.
 * This is the function that triggers the camera access prompt.
 * @param {string} deviceId - The deviceId of the camera to use, or 'auto' for facingMode.
 * @param {object} resolution - {width, height} ideal resolution.
 * @returns {Promise<boolean>} - True if stream started successfully, false otherwise.
 */
async function initCamera(deviceId, resolution) {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }

    showCameraLoadingSpinner(true); 
    cameraActive = false; 

    // Define a cascade of constraints to try
    const constraintsToTry = [
        // 1. Preferred deviceId and resolution
        { video: { deviceId: deviceId === 'auto' ? undefined : { exact: deviceId }, facingMode: deviceId === 'auto' ? 'user' : undefined, width: { ideal: resolution.width }, height: { ideal: resolution.height } }, audio: false },
        // 2. Preferred deviceId, fallback to 720p if higher fails (or 'auto' user facing)
        { video: { deviceId: deviceId === 'auto' ? undefined : { exact: deviceId }, facingMode: deviceId === 'auto' ? 'user' : undefined, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        // 3. Preferred deviceId, fallback to 480p if higher fails (or 'auto' user facing)
        { video: { deviceId: deviceId === 'auto' ? undefined : { exact: deviceId }, facingMode: deviceId === 'auto' ? 'user' : undefined, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
        // 4. Any video source (no specific deviceId or resolution) - Simplest, most compatible
        { video: true, audio: false }
    ];

    let stream = null;
    let lastError = null;

    for (const constraints of constraintsToTry) {
        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            break; // Success!
        } catch (error) {
            lastError = error;
            console.warn(`getUserMedia attempt failed with constraints: ${JSON.stringify(constraints)}, error: ${error.name}`);
            // Special handling for mobile 'auto' or 'environment' if 'user' fails
            if (deviceId === 'auto' && constraints.video.facingMode === 'user' && (error.name === 'NotFoundError' || error.name === 'ConstraintNotSatisfiedError')) {
                 // If 'user' (front) not found or not satisfied, try 'environment' (rear) for 'auto'
                 const environmentConstraints = { ...constraints, video: { ...constraints.video, facingMode: 'environment' } };
                 try {
                    stream = await navigator.mediaDevices.getUserMedia(environmentConstraints);
                    break;
                 } catch (envError) {
                    lastError = envError;
                    console.warn(`getUserMedia auto/environment fallback failed:`, envError);
                 }
            }
        }
    }

    if (!stream) {
        handleCameraError(lastError || new DOMException('Failed to get camera stream after multiple attempts.', 'MediaStreamError'));
        return false;
    }

    video.srcObject = stream;
    currentStream = stream;

    video.onloadedmetadata = () => {
        video.play();
        hideCameraMessage();
        cameraActive = true; 
        showCameraLoadingSpinner(false); 
        initializeImageProcessorWorker();
        populateCameraAndResolutionOptions(); // Populate dropdowns ONLY AFTER successful stream
        updateButtonVisibility('ready'); 
    };

    return true; 
}

/**
 * Populates the camera and resolution selection dropdowns.
 * This is called *after* `initCamera` successfully starts a stream,
 * ensuring `device.label`s are available.
 */
async function populateCameraAndResolutionOptions() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        cameraSelect.innerHTML = ''; 

        const videoInputDevices = devices.filter(device => device.kind === 'videoinput');

        // Add 'Auto' option first for mobile flexibility
        const autoOption = document.createElement('option');
        autoOption.value = 'auto';
        autoOption.text = 'Auto (Front/Rear)';
        cameraSelect.appendChild(autoOption);

        if (videoInputDevices.length === 0) {
            console.warn("No video input devices found during enumeration after camera start.");
        } else {
            videoInputDevices.forEach((device) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Camera ${cameraSelect.options.length}`;
                cameraSelect.appendChild(option);
            });
        }

        // Set initial selectedCameraDeviceId based on available options
        // If camera is already active, try to match the deviceId of the current stream
        if (currentStream && currentStream.getVideoTracks().length > 0) {
            const currentTrackId = currentStream.getVideoTracks()[0].getSettings().deviceId;
            const optionToSelect = cameraSelect.querySelector(`option[value="${currentTrackId}"]`);
            if (optionToSelect) {
                optionToSelect.selected = true;
                selectedCameraDeviceId = currentTrackId;
            } else { // Fallback if current track's ID isn't in the list (e.g., 'auto' selected)
                cameraSelect.value = 'auto';
                selectedCameraDeviceId = 'auto';
            }
        } else if (cameraSelect.options.length > 1) { 
            // Default to first actual camera if currentStream not available or couldn't match
            const defaultCamera = videoInputDevices.find(d => d.label.toLowerCase().includes('front') || d.label.toLowerCase().includes('user')) || videoInputDevices[0];
            if (defaultCamera) {
                selectedCameraDeviceId = defaultCamera.deviceId;
                cameraSelect.value = defaultCamera.deviceId;
            } else {
                selectedCameraDeviceId = cameraSelect.options[1].value; // Fallback to first non-auto option
                cameraSelect.selectedIndex = 1;
            }
        } else {
            selectedCameraDeviceId = 'auto'; // Default to 'auto' if only 'auto' or no specific cameras
            cameraSelect.selectedIndex = 0;
        }
        
        // Populate resolution options (from higher to lower for default selection)
        const resolutions = [
            { width: 3840, height: 2160, label: '3840x2160 (4K - Experimental)' },
            { width: 1920, height: 1080, label: '1920x1080 (Full HD)' },
            { width: 1280, height: 720, label: '1280x720 (HD)' },
            { width: 640, height: 480, label: '640x480 (SD)' }
        ];
        resolutionSelect.innerHTML = ''; 
        resolutions.forEach(res => {
            const option = document.createElement('option');
            option.value = `${res.width}x${res.height}`;
            option.text = res.label;
            resolutionSelect.appendChild(option);
        });

        // Try to match current stream's resolution, otherwise set HD as default
        if (currentStream && currentStream.getVideoTracks().length > 0) {
            const settings = currentStream.getVideoTracks()[0].getSettings();
            const currentRes = `${settings.width}x${settings.height}`;
            const optionToSelect = resolutionSelect.querySelector(`option[value="${currentRes}"]`);
            if (optionToSelect) {
                optionToSelect.selected = true;
                selectedResolution = { width: settings.width, height: settings.height };
            } else { // Fallback to HD if current resolution isn't an explicit option
                const hdOption = resolutionSelect.querySelector('option[value="1280x720"]');
                if (hdOption) hdOption.selected = true;
                selectedResolution = { width: 1280, height: 720 };
            }
        } else {
            const hdOption = resolutionSelect.querySelector('option[value="1280x720"]');
            if (hdOption) {
                hdOption.selected = true;
                selectedResolution = { width: 1280, height: 720 };
            } else { 
                selectedResolution = { width: 640, height: 480 };
                resolutionSelect.querySelector('option[value="640x480"]').selected = true;
            }
        }

    } catch (error) {
        console.error('Error enumerating devices or setting options:', error);
    }
}

/**
 * Handles common camera access errors and displays appropriate messages.
 * @param {DOMException} error - The error object from navigator.mediaDevices.getUserMedia.
 */
function handleCameraError(error) {
    cameraActive = false;
    let mainMsg = 'Failed to access camera.';
    let subMsg = `An unexpected error occurred: ${error.message}.`;
    let type = 'error';
    let showRetry = true; 

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        mainMsg = 'Camera access denied.';
        subMsg = 'Please enable camera permissions in your browser settings and try again.';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        mainMsg = 'No camera detected.';
        subMsg = 'Ensure your webcam is connected/enabled. Check if another app is using it. Try refreshing the page.';
    } else if (error.name === 'NotReadableError') {
        mainMsg = 'Camera is busy.';
        subMsg = 'Your camera might be in use by another application. Please close other apps and try again.';
        type = 'warning';
    } else if (error.name === 'OverconstrainedError') {
        mainMsg = 'Camera resolution not supported.';
        subMsg = `Your camera cannot provide the requested resolution. Try selecting a lower resolution.`;
        type = 'warning';
    } else if (error.name === 'SecurityError' && window.location.protocol === 'file:') {
        mainMsg = 'Camera access requires a secure context.';
        subMsg = 'Please open this page using a local server (e.g., via VS Code Live Server) or HTTPS.';
        showRetry = false; 
    } else if (error instanceof DOMException && error.message.includes('Multiple attempts')) { // Custom error for initCamera multiple attempts
        mainMsg = 'Could not start camera stream.';
        subMsg = 'Your camera might be unavailable or does not support requested settings. Try selecting a different camera or resolution.';
    }

    displayCameraMessage(mainMsg, type, subMsg, false, showRetry); 
    updateButtonVisibility('error'); 
}


/**
 * Initializes the Web Worker and OffscreenCanvas.
 */
function initializeImageProcessorWorker() {
    if (imageProcessorWorker) {
        imageProcessorWorker.postMessage({ type: 'CLOSE_WORKER' });
        imageProcessorWorker.terminate();
    }

    if (typeof OffscreenCanvas !== 'undefined') {
        const tempCanvas = document.createElement('canvas');
        offscreenCanvasInstance = tempCanvas.transferControlToOffscreen();
    } else {
        console.warn('OffscreenCanvas not supported, image processing will fallback to main thread (not implemented here).');
        displayCameraMessage(
            'Browser not fully supported.',
            'warning',
            'Your browser does not support advanced image processing. Please update or try a different browser.',
            false, 
            false
        );
        return; 
    }

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
            'A background process failed. Please refresh the page.',
            false,
            true 
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
    if (indexToReplace !== -1 && indexToReplace < photosToCapture) { 
        capturedPhotos[indexToReplace] = imgData; 
        const imgElementInDom = photoGrid.querySelector(`[data-index="${indexToReplace}"] img`); 
        if (imgElementInDom) {
            imgElementInDom.src = imgData;
        }
        // Remove selection after retaking
        const selectedWrapper = photoGrid.querySelector('.captured-photo-wrapper.selected');
        if (selectedWrapper) {
            selectedWrapper.classList.remove('selected');
        }

    } else {
        // This case should ideally not happen if indices are always provided
        // But as a fallback, push if it's a new photo
        if (capturedPhotos.length < photosToCapture) { 
            capturedPhotos.push(imgData); 
            addPhotoToGrid(imgData, capturedPhotos.length - 1); 
        } else {
            console.warn("Attempted to add more photos than 'photosToCapture' or invalid index.");
        }
    }
    updatePhotoProgressText(); 
}

/**
 * Manages the initial photo capture sequence with countdowns and multiple shots.
 * @param {number} [indexToRetake=-1] - If >=0, retakes only this specific index. Otherwise, captures all missing photos.
 */
async function initiateCaptureSequence(indexToRetake = -1) {
    if (!currentStream || video.srcObject === null || video.paused || !cameraActive) {
        displayCameraMessage(
            'Camera not active or paused.',
            'warning',
            'Please click "Start Camera" first.',
            true, 
            false 
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
            console.log("Audio context unlocked by user interaction.");
        } catch (e) {
            console.warn("Audio autoplay blocked by explicit play attempt:", e);
        }
    }

    const storedPhotoCount = localStorage.getItem('selectedPhotoCount');
    photosToCapture = parseInt(storedPhotoCount, 10);

    if (isNaN(photosToCapture) || photosToCapture < 1 || photosToCapture > 6 || photosToCapture === 5) {
        photosToCapture = 3;
    }

    setCaptureControlsEnabled(true); 
    updateButtonVisibility('capturing');

    // If starting a *new full sequence* (not a retake), clear existing photos
    const currentPhotosCount = capturedPhotos.filter(p => p !== null).length;
    if (indexToRetake === -1 && currentPhotosCount === photosToCapture) { 
        capturedPhotos = Array(photosToCapture).fill(null); // Reset all slots to null
        photoGrid.innerHTML = '';
    } else if (indexToRetake === -1 && currentPhotosCount === 0 && capturedPhotos.length !== photosToCapture) { 
        // If empty or partial, and starting new sequence
        capturedPhotos = Array(photosToCapture).fill(null); // Ensure fixed size with nulls
        photoGrid.innerHTML = '';
    }


    // Ensure DOM placeholders for all photo slots
    for (let i = 0; i < photosToCapture; i++) {
        if (!photoGrid.querySelector(`[data-index="${i}"]`)) { // Check if DOM element exists
            addPhotoToGrid('data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=', i); // Add transparent GIF placeholder
        }
    }
    updatePhotoProgressText(); 

    if (indexToRetake !== -1) {
        // Retake a specific photo
        await runCountdown(3);
        flashOverlay.classList.add('active');
        setTimeout(() => { flashOverlay.classList.remove('active'); }, 100); 
        await sendFrameToWorker(indexToRetake);
    } else {
        // Capture all missing photos (or all if array was just cleared)
        for (let i = 0; i < photosToCapture; i++) {
            if (capturedPhotos[i] === null) { // Only capture if slot is empty (null)
                await runCountdown(3);
                flashOverlay.classList.add('active');
                setTimeout(() => { flashOverlay.classList.remove('active'); }, 100); 
                await sendFrameToWorker(i);
                
                const photosStillMissing = photosToCapture - capturedPhotos.filter(p => p !== null).length;
                if (photosStillMissing > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); 
                }
            }
        }
    }

    setCaptureControlsEnabled(false); 
    updateButtonVisibility('captured'); 
    updatePhotoProgressText(); 
}

/**
 * Handles the retake all photos action.
 */
function retakeAllPhotos() {
    capturedPhotos = []; 
    photoGrid.innerHTML = ''; 
    updatePhotoProgressText(); 
    initiateCaptureSequence(); 
}

/**
 * Handles retaking a single selected photo.
 */
function retakeSelectedPhoto() {
    const selectedWrapper = photoGrid.querySelector('.captured-photo-wrapper.selected');
    if (selectedWrapper) {
        const indexToRetake = parseInt(selectedWrapper.dataset.index);
        initiateCaptureSequence(indexToRetake); 
    } else {
        alert('Please select a photo to retake first!');
        updateButtonVisibility('captured'); 
    }
}


/**
 * Handles selection/deselection of photos in the grid.
 * @param {Event} event - The click event.
 */
function handlePhotoSelection(event) {
    const clickedWrapper = event.target.closest('.captured-photo-wrapper');
    if (!clickedWrapper) return;

    // Deselect any previously selected photo
    const currentlySelected = photoGrid.querySelector('.captured-photo-wrapper.selected');
    if (currentlySelected && currentlySelected !== clickedWrapper) {
        currentlySelected.classList.remove('selected');
    }

    // Toggle the selected class on the clicked photo
    clickedWrapper.classList.toggle('selected');
    
    // Update button visibility based on selection
    updateButtonVisibility('captured'); 
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
 * Manages the visibility and disabled state of all relevant buttons based on application state.
 * @param {'initial'|'ready'|'capturing'|'captured'|'error'} state - The current state of the photo capture process.
 */
function updateButtonVisibility(state = 'initial') {
    const isFullscreen = document.fullscreenElement;
    const photosTakenCount = capturedPhotos.filter(p => p !== null).length; 
    const allPhotosCaptured = (photosTakenCount === photosToCapture && photosToCapture > 0);
    const photoSelected = photoGrid.querySelector('.captured-photo-wrapper.selected');
    
    // Determine if camera options (selects) should be enabled
    const enableSelects = (state === 'ready' || state === 'captured');
    setCaptureControlsEnabled(!enableSelects); 

    // Default to hidden/disabled for action buttons
    startCameraButton.style.display = 'none';
    retryCameraButton.style.display = 'none';
    captureBtnNormalMode.style.display = 'none';
    captureBtnFullscreen.style.display = 'none';
    nextBtn.style.display = 'none';
    retakePhotosBtn.style.display = 'none';
    retakeIndividualPhotoBtn.style.display = 'none';

    // General controls (invert, back to layout, fullscreen)
    invertCameraButton.style.display = 'block';
    backToLayoutBtn.style.display = 'block';
    fullscreenToggleBtn.style.display = 'block';

    // Back to Layout is always enabled unless capturing
    backToLayoutBtn.disabled = (state === 'capturing');

    if (state === 'initial') {
        // Initial load state, prompt user to start camera
        displayCameraMessage(
            'Welcome to ODZ Booth!',
            'info',
            'Click "Start Camera" to access your webcam.',
            true, 
            false 
        );
        invertCameraButton.style.display = 'none'; 
        fullscreenToggleBtn.style.display = 'none'; 
        
        // Selects remain disabled until camera is actually ready
        cameraSelect.disabled = true;
        resolutionSelect.disabled = true;
        filterSelect.disabled = true;

    } else if (state === 'ready') {
        // Camera stream is active, ready to capture
        hideCameraMessage(); 
        invertCameraButton.disabled = false;
        fullscreenToggleBtn.disabled = false;
        
        if (isFullscreen) {
            captureBtnFullscreen.style.display = 'block';
            captureBtnFullscreen.disabled = false;
        } else {
            captureBtnNormalMode.style.display = 'block';
            captureBtnNormalMode.disabled = false;
        }
        
    } else if (state === 'capturing') {
        // During capture sequence (countdown, flash, processing)
        setCaptureControlsEnabled(true); // Disable all controls
        invertCameraButton.style.display = 'none';
        backToLayoutBtn.style.display = 'none';
        fullscreenToggleBtn.style.display = 'none';
        captureBtnNormalMode.style.display = 'none';
        captureBtnFullscreen.style.display = 'none';

        nextBtn.disabled = true;
        retakePhotosBtn.disabled = true;
        retakeIndividualPhotoBtn.disabled = true;

    } else if (state === 'captured') {
        // All photos captured (or individual retake completed)
        setCaptureControlsEnabled(false); // Enable selects for reviewing
        invertCameraButton.style.display = 'none'; 
        backToLayoutBtn.style.display = 'none';
        fullscreenToggleBtn.style.display = 'none';

        // Hide main capture buttons once all are taken
        captureBtnNormalMode.style.display = 'none'; 
        captureBtnFullscreen.style.display = 'none';

        // Only show Go to Editor and Retake options
        nextBtn.style.display = 'block';
        nextBtn.disabled = false;
        retakePhotosBtn.style.display = 'block';
        retakePhotosBtn.disabled = false;

        if (photoSelected) {
            retakeIndividualPhotoBtn.style.display = 'block';
            retakeIndividualPhotoBtn.disabled = false;
        } else {
            retakeIndividualPhotoBtn.style.display = 'none';
            retakeIndividualPhotoBtn.disabled = true;
        }
    } else if (state === 'error') {
        // After a camera access error
        startCameraButton.style.display = 'none'; 
        retryCameraButton.style.display = 'block'; 
        retryCameraButton.disabled = false;
        invertCameraButton.style.display = 'none';
        fullscreenToggleBtn.style.display = 'none';
        
        setCaptureControlsEnabled(true); // Disable all selects and other general buttons
    }

    // Always adjust fullscreen body class
    if (isFullscreen) {
        document.body.classList.add('fullscreen-active');
    } else {
        document.body.classList.remove('fullscreen-active');
    }
}


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
    
    updateButtonVisibility('initial'); 

    const unlockAudio = () => {
        if (!userInteracted) {
            countdownBeep.muted = false;
            cameraShutter.muted = false;
            countdownBeep.play().then(() => {
                countdownBeep.pause();
                countdownBeep.currentTime = 0;
                userInteracted = true;
                console.log("Audio context unlocked by general DOM click/touch.");
            }).catch(e => {
                console.warn("Initial audio unlock failed via DOM click/touch:", e);
            });
        }
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchend', unlockAudio);
    };

    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchend', unlockAudio, { once: true });
});

startCameraButton.addEventListener('click', async () => {
    showCameraLoadingSpinner(true); 
    updateButtonVisibility('capturing'); // Temporarily set to capturing to disable all buttons
                                        // until camera is ready or errors

    // 1. Attempt to initialize camera stream. This will trigger the permission prompt.
    // It also internally handles populating dropdowns AFTER successful stream.
    const cameraStarted = await initCamera(selectedCameraDeviceId, selectedResolution);

    if (cameraStarted) {
        // initCamera already updates to 'ready' state
    } else {
        // initCamera already calls handleCameraError and updateButtonVisibility('error')
    }
});

retryCameraButton.addEventListener('click', async () => {
    showCameraLoadingSpinner(true);
    updateButtonVisibility('capturing'); // Temporarily disable buttons

    // Repopulate options just in case new devices are available or re-enumerated
    const cameraStarted = await initCamera(selectedCameraDeviceId, selectedResolution);

    if (cameraStarted) {
        // initCamera already updates to 'ready' state
    } else {
        // initCamera already calls handleCameraError
    }
});


cameraSelect.addEventListener('change', async (event) => {
    selectedCameraDeviceId = event.target.value;
    await initCamera(selectedCameraDeviceId, selectedResolution);
});

resolutionSelect.addEventListener('change', async (event) => {
    const [width, height] = event.target.value.split('x').map(Number);
    selectedResolution = { width, height };
    await initCamera(selectedCameraDeviceId, selectedResolution);
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

nextBtn.addEventListener('click', () => {
    if (capturedPhotos.filter(p => p !== null).length === photosToCapture && photosToCapture > 0) { 
        localStorage.setItem('capturedPhotos', JSON.stringify(capturedPhotos));
        window.location.href = 'editing-page/editing-home.html';
    } else {
        const remaining = photosToCapture - capturedPhotos.filter(p => p !== null).length;
        alert(`Please capture ${remaining} more photo(s) before proceeding!`); 
    }
});

retakePhotosBtn.addEventListener('click', retakeAllPhotos);
retakeIndividualPhotoBtn.addEventListener('click', retakeSelectedPhoto); 

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
