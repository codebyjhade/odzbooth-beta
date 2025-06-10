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

const startCameraButton = document.getElementById('startCameraButton'); 
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
let selectedCameraDeviceId = null; 
let selectedResolution = { width: 1280, height: 720 }; // Default to HD for better quality, but will try lower if fails

// Web Worker for image processing
let imageProcessorWorker = null;
let offscreenCanvasInstance = null;

// Flag to track user interaction for audio autoplay
let userInteracted = false;
let cameraActive = false; // New: Track if camera is streaming

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
 * @param {boolean} showStartButton - Whether to show the 'Start Camera' button.
 */
function displayCameraMessage(message, type = 'info', subMessage = '', showStartButton = false) {
    mainCameraMsg.innerText = message;
    subCameraMsg.innerText = subMessage;
    cameraAccessMessage.className = `message ${type}`; 
    cameraAccessMessage.style.display = 'flex'; 
    startCameraButton.style.display = showStartButton ? 'block' : 'none';
    video.style.display = 'none'; 
    countdownElement.style.display = 'none'; 
    visualCountdown.style.display = 'none'; 
    cameraLoadingSpinner.classList.add('hidden-spinner'); 
    // setCaptureControlsEnabled(true); // Don't disable here, updateButtonVisibility will handle it.
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
    photoProgressText.textContent = `Captured: ${capturedPhotos.length} of ${photosToCapture}`;
    if (photosToCapture > 0 && capturedPhotos.filter(p => p !== null).length === photosToCapture) { // Filter out nulls for accurate count
        photoProgressText.textContent += ' - All photos captured!';
    } else if (photosToCapture > 0 && capturedPhotos.filter(p => p !== null).length < photosToCapture) {
        photoProgressText.textContent += ` (${photosToCapture - capturedPhotos.filter(p => p !== null).length} remaining)`;
    }
    
    // Update visual progress dots
    photoProgressIndicator.innerHTML = '';
    for (let i = 0; i < photosToCapture; i++) {
        const dot = document.createElement('div');
        dot.classList.add('photo-progress-dot');
        if (i < capturedPhotos.length && capturedPhotos[i] !== undefined && capturedPhotos[i] !== null) {
            dot.classList.add('filled');
        }
        photoProgressIndicator.appendChild(dot);
    }

    updateButtonVisibility(); 
}

// --- Camera Management ---

/**
 * Attempts to initialize the camera stream with given constraints.
 * Tries with specific deviceId and resolution, then falls back to lower resolution if needed.
 * @param {string} deviceId - The deviceId of the camera to use.
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

    const preferredConstraints = {
        video: {
            deviceId: deviceId === 'auto' ? undefined : { exact: deviceId }, // Use undefined for facingMode based auto
            facingMode: deviceId === 'auto' ? 'user' : undefined, // Start with 'user' for 'auto'
            width: { ideal: resolution.width },
            height: { ideal: resolution.height },
        },
        audio: false 
    };

    const fallbackToSD = {
        video: {
            deviceId: deviceId === 'auto' ? undefined : { exact: deviceId },
            facingMode: deviceId === 'auto' ? 'user' : undefined,
            width: { ideal: 640 }, // Fallback to 640x480
            height: { ideal: 480 },
        },
        audio: false
    };

    const fallbackToAnyVideo = {
        video: true, // Try any available video source
        audio: false
    };

    let stream = null;
    let triedConstraints = [preferredConstraints, fallbackToSD, fallbackToAnyVideo];

    for (const constraints of triedConstraints) {
        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            break; // Success, exit loop
        } catch (error) {
            console.warn(`Attempt with constraints failed: ${JSON.stringify(constraints)}`, error);
            // If it's the last attempt and still fails, handle error
            if (constraints === triedConstraints[triedConstraints.length - 1]) {
                handleCameraError(error);
                return false;
            }
        }
    }

    if (!stream) {
        handleCameraError(new DOMException('Failed to get camera stream after multiple attempts.', 'MediaStreamError'));
        return false;
    }

    video.srcObject = stream;
    currentStream = stream;

    video.onloadedmetadata = () => {
        video.play();
        hideCameraMessage();
        cameraActive = true; 
        setCaptureControlsEnabled(false); // Enable selects and general controls
        showCameraLoadingSpinner(false); 
        initializeImageProcessorWorker();
        updateButtonVisibility('ready'); // Camera is ready to capture
    };

    return true; // Stream successfully obtained
}

/**
 * Populates the camera selection dropdown with available video input devices.
 * This function no longer attempts getUserMedia directly for permission,
 * but enumerates after initial permission is *expected* or granted by a user action.
 */
async function populateCameraListOptions() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        cameraSelect.innerHTML = ''; 

        const videoInputDevices = devices.filter(device => device.kind === 'videoinput');

        if (videoInputDevices.length === 0) {
            // If no cameras are found even after enumeration, display specific message
            displayCameraMessage(
                'No camera detected.',
                'error',
                'Please ensure your webcam is connected and enabled. Refresh to try again.',
                true
            );
            return false;
        }

        // Add a default 'Auto' option for facingMode preference on mobile
        const autoOption = document.createElement('option');
        autoOption.value = 'auto';
        autoOption.text = 'Auto (Front/Rear)';
        cameraSelect.appendChild(autoOption);

        videoInputDevices.forEach((device) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Camera ${cameraSelect.options.length}`;
            cameraSelect.appendChild(option);
        });

        // Select the first real camera if 'auto' is not present or desired
        if (cameraSelect.options.length > 1) { // If there's more than just 'auto'
            selectedCameraDeviceId = cameraSelect.options[1].value; // Select the first actual camera
            cameraSelect.selectedIndex = 1;
        } else {
            selectedCameraDeviceId = 'auto'; // Fallback if only 'auto' or no specific cameras
            cameraSelect.selectedIndex = 0;
        }
        
        // Populate resolution options - these are common ideals
        const resolutions = [
            { width: 640, height: 480, label: '640x480 (SD)' },
            { width: 1280, height: 720, label: '1280x720 (HD)' },
            { width: 1920, height: 1080, label: '1920x1080 (Full HD)' },
            { width: 3840, height: 2160, label: '3840x2160 (4K - Experimental)' } 
        ];
        resolutionSelect.innerHTML = ''; 
        resolutions.forEach(res => {
            const option = document.createElement('option');
            option.value = `${res.width}x${res.height}`;
            option.text = res.label;
            resolutionSelect.appendChild(option);
        });
        const hdOption = resolutionSelect.querySelector('option[value="1280x720"]');
        if (hdOption) {
            hdOption.selected = true;
            selectedResolution = { width: 1280, height: 720 };
        } else {
            selectedResolution = { width: 640, height: 480 };
        }

        return true; // Successfully populated
    } catch (error) {
        console.error('Error enumerating devices:', error);
        displayCameraMessage(
            'Failed to list cameras.',
            'error',
            `An error occurred: ${error.message}. Please refresh.`,
            true
        );
        return false;
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
    let showBtn = true;

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
        subMsg = `Your camera cannot provide the requested resolution (${selectedResolution.width}x${selectedResolution.height}). Try selecting a lower resolution.`;
        type = 'warning';
    } else if (error.name === 'SecurityError' && window.location.protocol === 'file:') {
        mainMsg = 'Camera access requires a secure context.';
        subMsg = 'Please open this page using a local server (e.g., via VS Code Live Server) or HTTPS.';
        showBtn = false; 
    } else if (error.name === 'MediaStreamError') { // Custom error for initCamera multiple attempts
        mainMsg = 'Could not start camera stream.';
        subMsg = 'Your camera might be unavailable or does not support requested settings.';
    }

    displayCameraMessage(mainMsg, type, subMsg, showBtn);
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
            true
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
    if (indexToReplace !== -1 && indexToReplace < capturedPhotos.length) {
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
        capturedPhotos.push(imgData); 
        addPhotoToGrid(imgData, capturedPhotos.length - 1); 
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
            true
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

    setCaptureControlsEnabled(true); 
    updateButtonVisibility('capturing');

    if (indexToRetake === -1) { // Clear all if starting a full new sequence or re-capturing remaining
        // Only clear if not already empty and we're starting a fresh sequence
        if (capturedPhotos.length !== 0 && capturedPhotos.filter(p => p !== null).length === photosToCapture) {
             // If all photos are already captured, and user clicked 'Start Capture' again (not retake all/individual),
             // then this implies restarting the full sequence.
             capturedPhotos = [];
             photoGrid.innerHTML = '';
        }
    }

    // Ensure placeholders for all photos
    for (let i = 0; i < photosToCapture; i++) {
        if (!capturedPhotos[i]) {
            capturedPhotos[i] = null; // Mark as null/undefined to ensure order
            addPhotoToGrid('data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=', i); // Transparent GIF placeholder
        }
    }
    updatePhotoProgressText(); // Update progress dots before starting capture

    if (indexToRetake !== -1) {
        // Retake a specific photo
        await runCountdown(3);
        flashOverlay.classList.add('active');
        setTimeout(() => { flashOverlay.classList.remove('active'); }, 100); 
        await sendFrameToWorker(indexToRetake);
    } else {
        // Capture all photos or remaining ones
        for (let i = 0; i < photosToCapture; i++) {
            if (capturedPhotos[i] === null) { // Only capture if slot is empty
                await runCountdown(3);
                flashOverlay.classList.add('active');
                setTimeout(() => { flashOverlay.classList.remove('active'); }, 100); 
                await sendFrameToWorker(i);
                
                // If there are still empty slots, wait a bit before the next shot
                if (capturedPhotos.filter(p => p !== null).length < photosToCapture) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); 
                }
            }
        }
    }

    // After sequence, re-enable controls and update button states
    setCaptureControlsEnabled(false); 
    updateButtonVisibility('captured'); 
    updatePhotoProgressText(); 
}

/**
 * Handles the retake all photos action.
 */
function retakeAllPhotos() {
    capturedPhotos = []; // Clear all photos
    photoGrid.innerHTML = ''; // Clear grid
    updatePhotoProgressText(); // Reset progress
    initiateCaptureSequence(); // Start a new full capture sequence
}

/**
 * Handles retaking a single selected photo.
 */
function retakeSelectedPhoto() {
    const selectedWrapper = photoGrid.querySelector('.captured-photo-wrapper.selected');
    if (selectedWrapper) {
        const indexToRetake = parseInt(selectedWrapper.dataset.index);
        initiateCaptureSequence(indexToRetake); // Start capture sequence for specific index
    } else {
        alert('Please select a photo to retake first!');
        updateButtonVisibility('captured'); // Ensure buttons are correct if no selection
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
    const allPhotosCaptured = (capturedPhotos.filter(p => p !== null).length === photosToCapture && photosToCapture > 0);
    const photoSelected = photoGrid.querySelector('.captured-photo-wrapper.selected');
    
    // Determine if camera options (selects) should be enabled
    const enableSelects = (state === 'initial' || state === 'ready' || state === 'captured' || state === 'error');
    setCaptureControlsEnabled(!(enableSelects && (cameraSelect.options.length > 0))); // Only enable if options exist

    // Default to hidden/disabled for most action buttons
    startCameraButton.style.display = 'none';
    captureBtnNormalMode.style.display = 'none';
    captureBtnFullscreen.style.display = 'none';
    nextBtn.style.display = 'none';
    retakePhotosBtn.style.display = 'none';
    retakeIndividualPhotoBtn.style.display = 'none';

    // General controls (initially visible, but might be disabled)
    invertCameraButton.style.display = 'block';
    backToLayoutBtn.style.display = 'block';
    fullscreenToggleBtn.style.display = 'block';

    // Always enable "Back to Layout" unless explicitly in capture sequence
    backToLayoutBtn.disabled = (state === 'capturing');

    if (state === 'initial' || state === 'error') {
        // Before camera stream starts or after an error
        startCameraButton.style.display = 'block';
        startCameraButton.disabled = false; 

        invertCameraButton.style.display = 'none'; 
        fullscreenToggleBtn.style.display = 'none'; 
        
        // If there are camera options, enable camera/resolution/filter selects
        cameraSelect.disabled = !(cameraSelect.options.length > 0);
        resolutionSelect.disabled = !(cameraSelect.options.length > 0);
        filterSelect.disabled = !(cameraSelect.options.length > 0);


    } else if (state === 'ready') {
        // Camera stream is active, ready to capture
        hideCameraMessage(); 
        // Selects already enabled by setCaptureControlsEnabled(false) earlier
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
        setCaptureControlsEnabled(false); // Enable selects (user can change filter for next capture)
        invertCameraButton.style.display = 'none'; // Hide general controls
        backToLayoutBtn.style.display = 'none';
        fullscreenToggleBtn.style.display = 'none';

        captureBtnNormalMode.style.display = 'none'; // Hide capture buttons
        captureBtnFullscreen.style.display = 'none';

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
    
    updateButtonVisibility('initial'); // Initial call to set button visibility

    // This listener will only fire once, attempting to unlock audio
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

startCameraButton.addEventListener('click', async () => {
    // 1. Populate camera list options (if not already done)
    // This will now trigger the permission prompt as it's the first `getUserMedia` call
    const populated = await populateCameraListOptions(); 

    if (populated) {
        // 2. If options are successfully populated, try to initialize the camera stream
        // The selectedCameraDeviceId and selectedResolution should now be set by populateCameraListOptions
        await initCamera(selectedCameraDeviceId, selectedResolution);
    } else {
        // populateCameraListOptions already handles displaying the error message
    }
});


cameraSelect.addEventListener('change', async (event) => {
    selectedCameraDeviceId = event.target.value;
    // Always restart camera when selection changes if camera was active or trying to start
    await initCamera(selectedCameraDeviceId, selectedResolution);
});

resolutionSelect.addEventListener('change', async (event) => {
    const [width, height] = event.target.value.split('x').map(Number);
    selectedResolution = { width, height };
    // Only restart camera when selection changes if camera was active or trying to start
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
        // Ensure all slots are filled before proceeding
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
