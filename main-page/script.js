// main-page/main.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const DOMElements = {
        startSessionBtn: document.getElementById('startSessionBtn'),
        fullscreenToggle: document.getElementById('fullscreenToggle'),
    };

    // --- Utility Functions ---

    /**
     * Logs an analytics event to the console.
     * In a real application, this would send data to an analytics service (e.g., Google Analytics).
     * @param {string} eventName - The name of the event (e.g., "Session Started").
     * @param {object} [details={}] - Optional details related to the event.
     */
    function logAnalytics(eventName, details = {}) {
        console.log(`ANALYTICS: ${eventName} -`, { timestamp: new Date().toISOString(), ...details });
        // Example for real analytics (if you had Google Analytics initialized):
        // gtag('event', eventName, {
        //     'event_category': 'User Engagement',
        //     'event_label': eventName,
        //     ...details
        // });
    }

    // --- Core Logic ---

    /**
     * Toggles the browser's full-screen mode.
     */
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                logAnalytics('Fullscreen_Enable_Failed', { error: err.name });
            });
            logAnalytics('Fullscreen_Enabled');
        } else {
            document.exitFullscreen();
            logAnalytics('Fullscreen_Disabled');
        }
    }

    /**
     * Updates the fullscreen toggle button icon based on fullscreen state.
     */
    function updateFullscreenIcon() {
        const icon = DOMElements.fullscreenToggle.querySelector('i');
        if (document.fullscreenElement) {
            icon.classList.remove('bx-fullscreen');
            icon.classList.add('bx-exit-fullscreen');
        } else {
            icon.classList.remove('bx-exit-fullscreen');
            icon.classList.add('bx-fullscreen');
        }
    }

    /**
     * Starts a new photo booth session by navigating to the layout selection page.
     * Also logs a session start event.
     */
    function startSession() {
        logAnalytics('Session_Started');
        window.location.href = 'layout-selection/layout-selection.html';
    }

    // --- Event Listeners ---

    // Listen for clicks on the fullscreen toggle button
    DOMElements.fullscreenToggle.addEventListener('click', toggleFullscreen);

    // Listen for changes in the browser's fullscreen state to update the icon
    document.addEventListener('fullscreenchange', updateFullscreenIcon);

    // Listen for clicks on the "Start Your Session" button
    DOMElements.startSessionBtn.addEventListener('click', startSession);

    // --- Initialization ---

    /**
     * Initializes the main page logic when the DOM is fully loaded.
     */
    function initializeMainPage() {
        // Ensure the correct fullscreen icon is shown on initial load
        updateFullscreenIcon();
        logAnalytics('Main_Page_Loaded');
    }

    // Call the initialization function
    initializeMainPage();
});