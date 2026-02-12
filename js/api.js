// ============================================
// REAL API SERVICE (Connects to Flask Backend)
// ============================================

// TODO: Change this URL to your Render Backend URL after deployment
// Example: const API_BASE_URL = 'https://your-app-name.onrender.com';
const API_BASE_URL = 'https://vimala-25t1.onrender.com';

class ApiService {
    constructor() {
        // Backend URL
        this.baseUrl = `${API_BASE_URL}/api`;
    }

    // Helper for fetch requests
    async request(endpoint, method = 'GET', data = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const token = localStorage.getItem('cine_auth_token');
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, options);

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned an invalid response. Please check if the backend is running properly.');
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Network response was not ok');
            }
            return await response.json();
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);

            // Provide more helpful error messages
            let errorMessage = error.message;
            if (error.message.includes('<!doctype') || error.message.includes('Unexpected token')) {
                errorMessage = 'Backend server error. Please contact support.';
            }

            return {
                success: false,
                error: errorMessage || 'Something went wrong'
            };
        }
    }

    // ========== GALLERY API ==========

    async getGalleryImages() {
        return this.request('/gallery');
    }

    async updateGalleryImages(images) {
        return this.request('/gallery', 'POST', images);
    }

    // ========== EQUIPMENT API ==========

    async getEquipment() {
        return this.request('/equipment');
    }

    async addEquipment(equipmentData) {
        return this.request('/equipment', 'POST', equipmentData);
    }

    async deleteEquipment(id) {
        return this.request(`/equipment/${id}`, 'DELETE');
    }

    // ========== BOOKINGS API ==========

    async getBookings() {
        return this.request('/bookings');
    }

    async getUserBookings(userEmail) {
        // In a real app, you'd filter on backend. 
        // For now, getting all and filtering client-side or we could add a query param
        const response = await this.getBookings();
        if (response.success) {
            const userBookings = response.data.filter(b => b.customer.email === userEmail);
            return { success: true, data: userBookings };
        }
        return response;
    }

    async createBooking(bookingData) {
        return this.request('/bookings', 'POST', bookingData);
    }

    async updateBookingStatus(bookingId, status) {
        return this.request(`/bookings/${bookingId}`, 'PUT', { status });
    }

    // ========== CONTACT API ==========

    async getContactInfo() {
        return this.request('/contact');
    }

    async updateContactInfo(contactData) {
        return this.request('/contact', 'POST', contactData);
    }

    // ========== AUTH API ==========

    async login(credentials) {
        const response = await this.request('/auth/login', 'POST', credentials);
        if (response.success) {
            localStorage.setItem('cine_auth_token', response.data.token);
            localStorage.setItem('cine_current_user', JSON.stringify(response.data.user));
        }
        return response;
    }

    async adminLogin(credentials) {
        const response = await this.request('/auth/admin-login', 'POST', credentials);
        if (response.success) {
            localStorage.setItem('cine_auth_token', response.data.token);
            localStorage.setItem('cine_current_user', JSON.stringify(response.data.user));
        }
        return response;
    }

    async googleLogin(token) {
        const response = await this.request('/auth/google', 'POST', { token });
        if (response.success) {
            localStorage.setItem('cine_auth_token', response.data.token);
            localStorage.setItem('cine_current_user', JSON.stringify(response.data.user));
        }
        return response;
    }

    async register(userData) {
        const response = await this.request('/auth/register', 'POST', userData);
        if (response.success) {
            localStorage.setItem('cine_auth_token', response.data.token);
            localStorage.setItem('cine_current_user', JSON.stringify(response.data.user));
        }
        return response;
    }

    async logout() {
        localStorage.removeItem('cine_auth_token');
        localStorage.removeItem('cine_current_user');
        return { success: true, message: 'Logged out successfully' };
    }

    async getCurrentUser() {
        // In a real stateless JWT setup, we'd validate the token with backend
        // For simplicity, we trust localStorage, but real validation is better
        const userStr = localStorage.getItem('cine_current_user');
        if (userStr) {
            return { success: true, data: JSON.parse(userStr) };
        }
        return { success: false, error: 'Not authenticated' };
    }
}

// Global API Service Instance
const apiService = new ApiService();

// Shared Utility Functions
function formatPrice(price) {
    if (price === undefined || price === null) return '₹0';
    return '₹' + price.toLocaleString('en-IN');
}

function showNotification(message, type = 'success') {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '10000';
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.style.backgroundColor = type === 'success' ? '#28a745' : '#dc3545';
    notification.style.color = 'white';
    notification.style.padding = '15px 25px';
    notification.style.marginBottom = '10px';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.gap = '10px';
    notification.style.animation = 'slideIn 0.3s ease';
    notification.style.minWidth = '300px';

    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';

    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <div>${message}</div>
    `;

    container.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function showLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.style.display = 'flex';
}

function hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.style.display = 'none';
}
