
import { auth, googleProvider, signInWithPopup } from './firebase-config.js';

// Global function to handle Google Login
window.handleGoogleLogin = async () => {
    try {
        // Show loading state on button if possible, but here we just start the popup
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const token = await user.getIdToken();

        console.log("Google Login Success:", user.email);

        // Call backend to verify token and get session
        const apiResponse = await apiService.googleLogin(token);

        if (apiResponse.success) {
            // Update UI
            if (window.updateUserProfile) {
                window.updateUserProfile();
                // Close dropdown if open
                const dropdown = document.getElementById('profile-dropdown');
                if (dropdown) dropdown.classList.remove('active');
            }
        } else {
            alert("Login failed: " + apiResponse.error);
        }

    } catch (error) {
        console.error("Google Sign In Error:", error);
        alert("Google Sign In Failed: " + error.message);
    }
};
