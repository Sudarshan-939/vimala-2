// ============================================
// ADMIN APPLICATION LOGIC
// ============================================

// DOM Elements
const adminLoginModal = document.getElementById('admin-login-modal');
const adminUsernameInput = document.getElementById('admin-username');
const adminPasswordInput = document.getElementById('admin-password');
const adminLoginSubmit = document.getElementById('admin-login-submit');
const adminLoginError = document.getElementById('admin-login-error');
const adminPanel = document.getElementById('admin-panel');
const adminEquipmentList = document.getElementById('admin-equipment-list');
const adminTabs = document.querySelectorAll('.admin-tab');
const tabContents = document.querySelectorAll('.tab-content');
const bookingsContainer = document.getElementById('bookings-container');
const addEquipmentForm = document.getElementById('add-equipment-form');
const imageUpload = document.getElementById('image-upload');
const imagePreview = document.getElementById('image-preview');
const imageUploadContainer = document.getElementById('image-upload-container');

// Admin Search and Filter Elements
const adminSearch = document.getElementById('admin-search');
const adminSearchBtn = document.getElementById('admin-search-btn');
const filterStatus = document.getElementById('filter-status');
const filterDate = document.getElementById('filter-date');
const filterProject = document.getElementById('filter-project');
const resetFiltersBtn = document.getElementById('reset-filters');

// Gallery Elements
const galleryUpload = document.getElementById('gallery-upload');
const galleryPreview = document.getElementById('gallery-preview');
const galleryImagesList = document.getElementById('gallery-images-list');
const saveGalleryBtn = document.getElementById('save-gallery');

// Contact Info Elements
const contactForm = document.getElementById('contact-form');
const contactAddressInput = document.getElementById('contact-address');
const contactPhoneInput = document.getElementById('contact-phone');
const contactEmailInput = document.getElementById('contact-email');
const contactHoursInput = document.getElementById('contact-hours');
const currentContactInfo = document.getElementById('current-contact-info');

// State
let newGalleryImages = [];
let galleryImages = [];
let currentUser = null;

// ============================================
// ADMIN LOGIN & AUTH
// ============================================

// Handle admin login
async function handleAdminLogin() {
    const username = adminUsernameInput.value.trim();
    const password = adminPasswordInput.value.trim();

    if (!username || !password) {
        adminLoginError.textContent = 'Please enter both username and password';
        adminLoginError.style.display = 'block';
        return;
    }

    // Disable button and show loading state
    adminLoginSubmit.disabled = true;
    const originalText = adminLoginSubmit.textContent;
    adminLoginSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    adminLoginError.style.display = 'none';

    try {
        // Check credentials via API
        const result = await apiService.adminLogin({ username, password });

        if (result.success) {
            currentUser = result.data.user;

            // Hide login modal if present (for when login is part of admin.html startup)
            if (adminLoginModal) adminLoginModal.style.display = 'none';

            // Initialize dashboard
            await initAdminDashboard();

            // Clear form
            adminUsernameInput.value = '';
            adminPasswordInput.value = '';
            adminLoginError.style.display = 'none';
        } else {
            adminLoginError.textContent = result.error || 'Invalid username or password';
            adminLoginError.style.display = 'block';
        }
    } catch (error) {
        adminLoginError.textContent = 'Connection error. Please try again.';
        adminLoginError.style.display = 'block';
    } finally {
        // Re-enable button and restore text
        adminLoginSubmit.disabled = false;
        adminLoginSubmit.textContent = originalText;
    }
}

// Check if user is already logged in as admin
async function checkAdminAuth() {
    const response = await apiService.getCurrentUser();
    if (response.success && response.data.role === 'admin') {
        currentUser = response.data;
        if (adminLoginModal) adminLoginModal.style.display = 'none';
        await initAdminDashboard();
    } else {
        // Show login modal
        if (adminLoginModal) adminLoginModal.style.display = 'flex';
    }
}

async function initAdminDashboard() {
    await renderBookings();
    await loadContactFormData();
    await renderAdminEquipmentList();
    renderGalleryAdmin();
}

// ============================================
// EQUIPMENT MANAGEMENT
// ============================================

// Render admin equipment list
async function renderAdminEquipmentList() {
    const equipment = await fetchEquipment();
    if (!adminEquipmentList) return;

    adminEquipmentList.innerHTML = '';

    if (equipment.length === 0) {
        adminEquipmentList.innerHTML = '<p>No equipment found. Add some equipment using the form above.</p>';
        return;
    }

    equipment.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'equipment-card';
        itemElement.style.marginBottom = '20px';

        const imageSrc = item.image || `https://via.placeholder.com/100x70/2c3e50/ffffff?text=${encodeURIComponent(item.type.charAt(0).toUpperCase())}`;

        itemElement.innerHTML = `
            <div style="display: flex; gap: 20px; padding: 15px;">
                <img src="${imageSrc}" alt="${item.name}" style="width: 100px; height: 70px; object-fit: cover; border-radius: 5px;">
                <div style="flex: 1;">
                    <h4 style="margin-bottom: 5px;">${item.name}</h4>
                    <p style="font-size: 14px; color: #666; margin-bottom: 10px;">${item.type.charAt(0).toUpperCase() + item.type.slice(1)} • ${formatPrice(item.price)}/day • ${item.stock} available</p>
                    <div style="display: flex; gap: 10px;">
                        <button class="remove-equipment" data-id="${item.id}" style="background-color: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">Remove</button>
                    </div>
                </div>
            </div>
        `;

        adminEquipmentList.appendChild(itemElement);
    });

    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-equipment').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('Are you sure you want to remove this equipment?')) {
                const response = await apiService.deleteEquipment(id);
                if (response.success) {
                    await renderAdminEquipmentList();
                    showNotification(response.message);
                } else {
                    showNotification(response.error, 'error');
                }
            }
        });
    });
}

// Handle image upload
function handleImageUpload() {
    const file = imageUpload.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        imagePreview.innerHTML = `<img src="${e.target.result}" alt="Uploaded Image">`;
        imagePreview.style.display = 'block';
    };

    reader.readAsDataURL(file);
}

// ============================================
// BOOKINGS DASHBOARD
// ============================================

// Render bookings with search and filters
async function renderBookings() {
    if (!bookingsContainer) return;

    const response = await apiService.getBookings();
    const bookings = response.data || [];

    bookingsContainer.innerHTML = '';

    if (bookings.length === 0) {
        bookingsContainer.innerHTML = '<p>No bookings found.</p>';
        return;
    }

    // Apply search filter
    let filteredBookings = [...bookings];
    const searchTerm = adminSearch.value.toLowerCase();
    if (searchTerm) {
        filteredBookings = filteredBookings.filter(booking =>
            booking.customer.name.toLowerCase().includes(searchTerm) ||
            booking.customer.email.toLowerCase().includes(searchTerm) ||
            booking.bookingId.toLowerCase().includes(searchTerm) ||
            booking.customer.phone.includes(searchTerm)
        );
    }

    // Apply status filter
    if (filterStatus.value) {
        filteredBookings = filteredBookings.filter(booking => booking.status === filterStatus.value);
    }

    // Apply project type filter
    if (filterProject.value) {
        filteredBookings = filteredBookings.filter(booking =>
            booking.projectDetails.type === filterProject.value
        );
    }

    // Apply date filter
    if (filterDate.value) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

        filteredBookings = filteredBookings.filter(booking => {
            const bookingDate = new Date(booking.createdAt);

            switch (filterDate.value) {
                case 'today':
                    return bookingDate >= today;
                case 'week':
                    return bookingDate >= oneWeekAgo;
                case 'month':
                    return bookingDate >= oneMonthAgo;
                default:
                    return true;
            }
        });
    }

    if (filteredBookings.length === 0) {
        bookingsContainer.innerHTML = '<p>No bookings match your filters.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'bookings-table';

    table.innerHTML = `
        <thead>
            <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Project</th>
                <th>Equipment</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            ${filteredBookings.map(booking => `
                <tr>
                    <td>${booking.bookingId}</td>
                    <td>
                        <strong>${booking.customer.name}</strong><br>
                        <small>${booking.customer.email}</small><br>
                        <small>${booking.customer.phone}</small>
                    </td>
                    <td>${booking.projectDetails.type}<br><small>${booking.projectDetails.shootDate}</small></td>
                    <td>${booking.equipmentItems.map(item => `${item.quantity}x ${item.name}`).join(', ')}</td>
                    <td>${formatPrice(booking.totalAmount)}</td>
                    <td><span class="status-badge status-${booking.status}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span></td>
                    <td>
                        <button class="update-status" data-id="${booking.bookingId}" style="background-color: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Update</button>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    `;

    bookingsContainer.appendChild(table);

    // Add event listeners to update buttons
    document.querySelectorAll('.update-status').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const bookingId = e.target.getAttribute('data-id');
            const newStatus = prompt('Enter new status (pending, confirmed, completed):', 'confirmed');

            if (newStatus && ['pending', 'confirmed', 'completed'].includes(newStatus.toLowerCase())) {
                const response = await apiService.updateBookingStatus(bookingId, newStatus.toLowerCase());
                if (response.success) {
                    await renderBookings();
                    showNotification(response.message);
                } else {
                    showNotification(response.error, 'error');
                }
            }
        });
    });
}

// ============================================
// GALLERY MANAGEMENT
// ============================================

// Render gallery admin interface
async function renderGalleryAdmin() {
    const response = await apiService.getGalleryImages();
    if (response.success) {
        galleryImages = response.data;
    }

    // Render current gallery images
    if (galleryImagesList) {
        galleryImagesList.innerHTML = '';

        galleryImages.forEach((src, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-preview-item';
            item.innerHTML = `
                <img src="${src}" alt="Gallery Image">
                <button class="remove-gallery-item" data-index="${index}">&times;</button>
            `;
            galleryImagesList.appendChild(item);
        });

        // Add listeners to remove buttons
        document.querySelectorAll('.remove-gallery-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                removeGalleryImage(index);
            });
        });
    }
}

// Handle gallery upload
function handleGalleryUpload() {
    const files = galleryUpload.files;
    if (!files.length) return;

    galleryPreview.innerHTML = '';
    newGalleryImages = [];

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function (e) {
            newGalleryImages.push(e.target.result);

            const item = document.createElement('div');
            item.className = 'gallery-preview-item';
            item.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            galleryPreview.appendChild(item);
        };
        reader.readAsDataURL(file);
    });
}

// Save gallery changes
async function saveGalleryChanges() {
    if (newGalleryImages.length > 0) {
        const updatedGallery = [...galleryImages, ...newGalleryImages];
        const response = await apiService.updateGalleryImages(updatedGallery);

        if (response.success) {
            galleryImages = response.data;
            newGalleryImages = [];
            galleryUpload.value = '';
            galleryPreview.innerHTML = '';
            renderGalleryAdmin();
            showNotification(response.message);
        } else {
            showNotification(response.error, 'error');
        }
    } else {
        showNotification('No new images to save', 'warning');
    }
}

// Remove gallery image
async function removeGalleryImage(index) {
    const updatedGallery = galleryImages.filter((_, i) => i !== index);
    const response = await apiService.updateGalleryImages(updatedGallery);

    if (response.success) {
        renderGalleryAdmin();
        showNotification('Image removed from gallery');
    }
}

// ============================================
// CONTACT INFO MANAGEMENT
// ============================================

// Load contact form data
async function loadContactFormData() {
    const response = await apiService.getContactInfo();
    const contactInfo = response.data;

    if (contactInfo) {
        if (contactAddressInput) contactAddressInput.value = contactInfo.address;
        if (contactPhoneInput) contactPhoneInput.value = contactInfo.phone;
        if (contactEmailInput) contactEmailInput.value = contactInfo.email;
        if (contactHoursInput) contactHoursInput.value = contactInfo.hours;

        updateCurrentContactInfo(contactInfo);
    }
}

// Update current contact info display
function updateCurrentContactInfo(info) {
    if (currentContactInfo) {
        currentContactInfo.innerHTML = `
            <p><strong>Address:</strong> ${info.address}</p>
            <p><strong>Phone:</strong> ${info.phone}</p>
            <p><strong>Email:</strong> ${info.email}</p>
            <p><strong>Business Hours:</strong> ${info.hours}</p>
        `;
    }
}

// ============================================
// INITIALIZATION
// ============================================

// Wrappers for API functions that might be used by layout utils
async function fetchEquipment() {
    const response = await apiService.getEquipment();
    return response.success ? response.data : [];
}

// Setup event listeners
function setupEventListeners() {
    // Admin login submit
    if (adminLoginSubmit) {
        adminLoginSubmit.addEventListener('click', handleAdminLogin);
    }

    // Admin login form submit on enter
    if (adminPasswordInput) {
        adminPasswordInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') handleAdminLogin();
        });
    }

    // Admin tabs
    if (adminTabs) {
        adminTabs.forEach(tab => {
            tab.addEventListener('click', async () => {
                const tabId = tab.getAttribute('data-tab');

                // Update active tab
                adminTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Show corresponding content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === tabId) {
                        content.classList.add('active');
                    }
                });

                // Refresh content based on tab
                if (tabId === 'bookings-dashboard') {
                    await renderBookings();
                } else if (tabId === 'contact-info') {
                    await loadContactFormData();
                } else if (tabId === 'gallery-management') {
                    renderGalleryAdmin();
                } else if (tabId === 'manage-equipment') {
                    await renderAdminEquipmentList();
                }
            });
        });
    }

    // Admin search and filters
    if (adminSearchBtn) {
        adminSearchBtn.addEventListener('click', renderBookings);
    }
    if (adminSearch) {
        adminSearch.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') renderBookings();
        });
    }
    if (filterStatus) filterStatus.addEventListener('change', renderBookings);
    if (filterDate) filterDate.addEventListener('change', renderBookings);
    if (filterProject) filterProject.addEventListener('change', renderBookings);
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            adminSearch.value = '';
            filterStatus.value = '';
            filterDate.value = '';
            filterProject.value = '';
            renderBookings();
        });
    }

    // Add equipment form
    if (addEquipmentForm) {
        addEquipmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('equipment-name').value;
            const type = document.getElementById('equipment-type').value;
            const price = parseFloat(document.getElementById('equipment-price').value);
            const description = document.getElementById('equipment-description').value;
            const stock = parseInt(document.getElementById('equipment-stock').value);

            // Get uploaded image or use default
            let image = '';
            if (imagePreview.querySelector('img')) {
                image = imagePreview.querySelector('img').src;
            }

            // Create equipment object
            const equipmentData = {
                name,
                type,
                price,
                image,
                description,
                stock
            };

            const response = await apiService.addEquipment(equipmentData);

            if (response.success) {
                // Update displays
                await renderAdminEquipmentList();

                // Reset form and image preview
                addEquipmentForm.reset();
                imagePreview.style.display = 'none';
                imagePreview.innerHTML = '';
                showNotification(response.message);
            } else {
                showNotification(response.error, 'error');
            }
        });
    }

    // Image upload
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
    }

    // Drag and drop for image upload
    if (imageUploadContainer) {
        imageUploadContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            imageUploadContainer.style.borderColor = 'var(--primary-color)';
        });

        imageUploadContainer.addEventListener('dragleave', (e) => {
            e.preventDefault();
            imageUploadContainer.style.borderColor = '#ddd';
        });

        imageUploadContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            imageUploadContainer.style.borderColor = '#ddd';

            if (e.dataTransfer.files.length) {
                imageUpload.files = e.dataTransfer.files;
                handleImageUpload();
            }
        });

        // Click on container to trigger file input
        imageUploadContainer.addEventListener('click', () => {
            imageUpload.click();
        });
    }

    // Gallery upload
    if (galleryUpload) {
        galleryUpload.addEventListener('change', handleGalleryUpload);
    }

    // Save gallery changes
    if (saveGalleryBtn) {
        saveGalleryBtn.addEventListener('click', saveGalleryChanges);
    }

    // Contact form submission
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Update contact info
            const contactData = {
                address: contactAddressInput.value,
                phone: contactPhoneInput.value,
                email: contactEmailInput.value,
                hours: contactHoursInput.value
            };

            const response = await apiService.updateContactInfo(contactData);
            if (response.success) {
                updateCurrentContactInfo(response.data);
                showNotification(response.message);
            } else {
                showNotification(response.error, 'error');
            }
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await apiService.logout();
            window.location.reload();
        });
    }
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    checkAdminAuth();
});
