// layout-selection/layout-script.js

document.addEventListener('DOMContentLoaded', () => {
    const layoutCards = document.querySelectorAll('.layout-card');
    const proceedBtn = document.getElementById('proceedToCaptureBtn');
    const selectedLayoutText = document.getElementById('selectedLayoutText');
    const backToHomeBtn = document.getElementById('backToHomeBtn');

    let selectedPhotoCount = null; // Initialize to null
    let selectedFrameAspectRatio = null; // NEW: Store aspect ratio

    // Define frame dimensions based on your STRIP_CONFIGS in edit.js
    // These are the dimensions of a SINGLE photo frame within a strip
    const FRAME_DIMENSIONS = {
        '1': { width: 320, height: 240 }, // For 1-photo strip
        '2': { width: 320, height: 240 }, // For 2-photo strip
        '3': { width: 320, height: 220 }, // For 3-photo strip
        '4': { width: 320, height: 226 }, // For 4-photo strip
        '6': { width: 320, height: 220 }  // For 6-photo strip
    };

    // Add click listener to each layout card
    layoutCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove 'selected' class from all cards
            layoutCards.forEach(lc => lc.classList.remove('selected'));

            // Add 'selected' class to the clicked card
            card.classList.add('selected');

            // Get the photo count from the data attribute
            selectedPhotoCount = card.dataset.photoCount;
            
            // NEW: Calculate and store the aspect ratio for the selected frame
            const frameConfig = FRAME_DIMENSIONS[selectedPhotoCount];
            if (frameConfig) {
                selectedFrameAspectRatio = frameConfig.width / frameConfig.height;
            } else {
                // Fallback aspect ratio if config not found (e.g., 4:3)
                selectedFrameAspectRatio = 4 / 3; 
                console.warn(`Frame dimensions not found for layout ${selectedPhotoCount}. Using default 4:3 aspect ratio.`);
            }

            // Update button text and enable it
            selectedLayoutText.textContent = `(${selectedPhotoCount} Photos)`;
            proceedBtn.disabled = false;

            // Optional: Log selection to console for debugging
            console.log(`Layout selected: ${selectedPhotoCount} photos, Aspect Ratio: ${selectedFrameAspectRatio.toFixed(2)}`);
        });
    });

    // Add click listener to the proceed button
    proceedBtn.addEventListener('click', () => {
        if (selectedPhotoCount) {
            // Save the selected photo count to localStorage
            localStorage.setItem('selectedPhotoCount', selectedPhotoCount);
            // NEW: Save the selected frame aspect ratio to localStorage
            localStorage.setItem('selectedFrameAspectRatio', selectedFrameAspectRatio);

            console.log(`Saved selectedPhotoCount to localStorage: ${selectedPhotoCount}`); 
            console.log(`Saved selectedFrameAspectRatio to localStorage: ${selectedFrameAspectRatio}`); 

            // Navigate to the capture page
            // Path is now relative to the base href
            window.location.href = 'capture-page/capture-page.html'; 
        } else {
            alert('Please select a photo layout first!');
        }
    });

    // Add click listener to the back to home button
    // Path is now relative to the base href
    backToHomeBtn.addEventListener('click', () => {
        window.location.href = 'index.html'; // Navigate back to the main page
    });

    // Initial state: disable button and set default text
    proceedBtn.disabled = true;
    selectedLayoutText.textContent = ''; // Clear text until selection is made
});
