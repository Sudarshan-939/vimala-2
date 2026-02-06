// ============================================
// CUSTOMER APPLICATION LOGIC
// ============================================

// Application state
let cart = [];
let currentUser = null;
let contactInfo = null;
let galleryImages = [];

// DOM Elements
const equipmentContainer = document.getElementById('equipment-container');
const cartModal = document.getElementById('cart-modal');
const cartToggle = document.getElementById('cart-toggle');
const closeCart = document.getElementById('close-cart');
const cartItems = document.getElementById('cart-items');
const cartCount = document.querySelector('.cart-count');
const cartTotal = document.getElementById('cart-total');
const emptyCartMessage = document.getElementById('empty-cart-message');
const checkoutBtn = document.getElementById('checkout-btn');
const proceedToDetailsBtn = document.getElementById('proceed-to-details');
const filterBtns = document.querySelectorAll('.filter-btn');
const equipmentLinks = document.querySelectorAll('.equipment-link');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const hamburgerMenu = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');
const customerDetailsForm = document.getElementById('customer-details-form');
const homeLink = document.getElementById('home-link');
const footerLinks = document.querySelectorAll('.footer-link');
const imageScroller = document.getElementById('image-scroller');

// User Profile Elements
const userProfile = document.getElementById('user-profile');
const loginButton = document.getElementById('login-button');
const profileDropdown = document.getElementById('profile-dropdown');
const profileHeader = document.getElementById('profile-header');
const profileMenu = document.getElementById('profile-menu');

// Receipt Elements
const receiptModal = document.getElementById('receipt-modal');
const receiptContent = document.getElementById('receipt-content');
const closeReceipt = document.getElementById('close-receipt');
const printReceiptBtn = document.getElementById('print-receipt');
const downloadReceiptBtn = document.getElementById('download-receipt');

// User Bookings Section
const userBookingsSection = document.getElementById('user-bookings-section');
const userBookingsContainer = document.getElementById('user-bookings-container');

// Customer form elements
const customerNameInput = document.getElementById('customer-name');
const customerEmailInput = document.getElementById('customer-email');
const customerPhoneInput = document.getElementById('customer-phone');
const customerCompanyInput = document.getElementById('customer-company');
const projectTypeInput = document.getElementById('project-type');
const shootDateInput = document.getElementById('shoot-date');
const specialRequirementsInput = document.getElementById('special-requirements');

// Footer Contact Info
const footerAddress = document.getElementById('footer-address');
const footerPhone = document.getElementById('footer-phone');
const footerEmail = document.getElementById('footer-email');
const footerHours = document.getElementById('footer-hours');

// ============================================
// CORE FUNCTIONS
// ============================================

// Fetch and render gallery images
async function fetchGalleryImages() {
    try {
        const response = await apiService.getGalleryImages();
        if (response.success) {
            galleryImages = response.data;
            renderImageScroller();
        }
    } catch (error) {
        console.error('Error fetching gallery:', error);
    }
}

// Render image scroller
function renderImageScroller() {
    if (!imageScroller) return;

    imageScroller.innerHTML = '';

    // Duplicate images to create seamless loop
    const displayImages = [...galleryImages, ...galleryImages];

    displayImages.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = "Cinematic Shot";
        img.className = "scroller-image";
        imageScroller.appendChild(img);
    });
}

// ============================================
// CART MANAGEMENT
// ============================================

// Add item to cart
async function addToCart(id) {
    const equipment = await fetchEquipment();
    const item = equipment.find(e => e.id === id);

    if (!item) return;

    // Check if item is already in cart
    const existingItem = cart.find(cartItem => cartItem.id === id);

    if (existingItem) {
        // Check if we have enough stock
        if (existingItem.quantity < item.stock) {
            existingItem.quantity += 1;
        } else {
            showNotification(`Only ${item.stock} units of ${item.name} are available.`, 'error');
            return;
        }
    } else {
        // Add new item to cart
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: 1
        });
    }

    updateCart();
    showNotification(`${item.name} added to cart`);
}

// Update cart UI
function updateCart() {
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    renderCartItems();
}

// Render cart items
function renderCartItems() {
    cartItems.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        emptyCartMessage.style.display = 'block';
        cartTotal.textContent = formatPrice(0);
        return;
    }

    emptyCartMessage.style.display = 'none';

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const row = document.createElement('tr');
        const imageSrc = item.image || `https://via.placeholder.com/80x60/2c3e50/ffffff?text=${encodeURIComponent(item.name.substring(0, 10))}`;

        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${imageSrc}" alt="${item.name}" class="cart-item-img">
                    <div>
                        <strong>${item.name}</strong>
                    </div>
                </div>
            </td>
            <td>${formatPrice(item.price)}</td>
            <td>3 Days (Min)</td>
            <td>
                <div class="cart-item-quantity">
                    <button class="quantity-btn minus" data-id="${item.id}">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn plus" data-id="${item.id}">+</button>
                </div>
            </td>
            <td>${formatPrice(itemTotal * 3)}</td>
            <td>
                <i class="fas fa-trash remove-item" data-id="${item.id}"></i>
            </td>
        `;

        cartItems.appendChild(row);
    });

    // Update total (multiplied by rental days)
    cartTotal.textContent = formatPrice(total * 3);

    // Add event listeners to quantity buttons
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            const isPlus = e.target.classList.contains('plus');
            updateCartItemQuantity(id, isPlus);
        });
    });

    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            removeFromCart(id);
        });
    });
}

// Update cart item quantity
async function updateCartItemQuantity(id, isPlus) {
    const equipment = await fetchEquipment();
    const item = equipment.find(e => e.id === id);
    const cartItem = cart.find(item => item.id === id);

    if (!cartItem || !item) return;

    if (isPlus) {
        // Check if we have enough stock
        if (cartItem.quantity < item.stock) {
            cartItem.quantity += 1;
        } else {
            showNotification(`Only ${item.stock} units of ${item.name} are available.`, 'error');
            return;
        }
    } else {
        if (cartItem.quantity > 1) {
            cartItem.quantity -= 1;
        } else {
            // Remove item if quantity becomes 0
            cart = cart.filter(item => item.id !== id);
        }
    }

    updateCart();
}

// Remove item from cart
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCart();
    showNotification('Item removed from cart');
}

// Complete booking process
async function completeBooking() {
    // Validate customer details
    if (!customerNameInput.value || !customerEmailInput.value || !customerPhoneInput.value || !projectTypeInput.value || !shootDateInput.value) {
        showNotification('Please fill all required fields marked with *', 'error');
        return;
    }

    if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }

    // Calculate total
    const rentalDays = 3;
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity * rentalDays), 0);

    // Prepare booking data
    const bookingData = {
        customer: {
            name: customerNameInput.value,
            email: customerEmailInput.value,
            phone: customerPhoneInput.value,
            company: customerCompanyInput.value || '',
            address: ''
        },
        projectDetails: {
            type: projectTypeInput.value,
            shootDate: shootDateInput.value,
            specialRequirements: specialRequirementsInput.value || ''
        },
        equipmentItems: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        totalAmount: totalAmount,
        rentalDays: rentalDays
    };

    // Create booking via API
    const booking = await apiService.createBooking(bookingData);

    if (booking.success) {
        // Clear cart and close modal
        cart = [];
        updateCart();
        cartModal.style.display = 'none';

        // Reset customer form
        customerNameInput.value = '';
        customerEmailInput.value = '';
        customerPhoneInput.value = '';
        customerCompanyInput.value = '';
        projectTypeInput.value = '';
        shootDateInput.value = '';
        specialRequirementsInput.value = '';

        // Hide customer form and show proceed button
        customerDetailsForm.style.display = 'none';
        checkoutBtn.style.display = 'none';
        proceedToDetailsBtn.style.display = 'block';

        // Show receipt
        showReceipt(booking.data);

        // Refresh equipment
        await renderEquipment();

        // Update user bookings if logged in
        if (currentUser) {
            await loadUserBookings();
        }
    } else {
        showNotification(booking.error, 'error');
    }
}

// ============================================
// RECEIPT
// ============================================

function showReceipt(booking) {
    receiptModal.style.display = 'flex';

    receiptContent.innerHTML = `
        <div class="receipt-header">
            <div class="receipt-logo">Vimala Enterprises</div>
            <h2>Booking Receipt</h2>
            <p>Booking ID: #${booking.bookingId}</p>
            <p>Date: ${new Date(booking.createdAt).toLocaleDateString()}</p>
            <div class="status-badge status-${booking.status}" style="display: inline-block; margin-top: 10px;">
                ${booking.status.toUpperCase()}
            </div>
        </div>

        <div class="receipt-details">
            <div class="receipt-row">
                <span><strong>Customer:</strong></span>
                <span>${booking.customer.name}</span>
            </div>
            <div class="receipt-row">
                <span><strong>Email:</strong></span>
                <span>${booking.customer.email}</span>
            </div>
            <div class="receipt-row">
                <span><strong>Phone:</strong></span>
                <span>${booking.customer.phone}</span>
            </div>
            <div class="receipt-row">
                <span><strong>Project Type:</strong></span>
                <span>${booking.projectDetails.type}</span>
            </div>
            <div class="receipt-row">
                <span><strong>Shoot Date:</strong></span>
                <span>${booking.projectDetails.shootDate}</span>
            </div>
        </div>

        <div class="receipt-items">
            <h3>Equipment Details</h3>
            <table class="receipt-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price/Day</th>
                        <th>Total (3 Days)</th>
                    </tr>
                </thead>
                <tbody>
                    ${booking.equipmentItems.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>${formatPrice(item.price)}</td>
                            <td>${formatPrice(item.price * item.quantity * 3)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="receipt-total">
            <div class="receipt-row">
                <span><strong>Subtotal:</strong></span>
                <span>${formatPrice(booking.totalAmount)}</span>
            </div>
            <div class="receipt-row">
                <span><strong>Tax (18% GST):</strong></span>
                <span>${formatPrice(booking.totalAmount * 0.18)}</span>
            </div>
            <div class="receipt-row" style="font-size: 20px; color: var(--primary-color); border-top: 1px solid #ddd; margin-top: 10px; padding-top: 10px;">
                <span><strong>Grand Total:</strong></span>
                <span>${formatPrice(booking.totalAmount * 1.18)}</span>
            </div>
        </div>
    `;
}

// ============================================
// HELPER FUNCTIONS FROM API.JS NEEDED HERE
// ============================================

// Fetch equipment wrapper
async function fetchEquipment() {
    showLoading();
    try {
        const response = await apiService.getEquipment();
        hideLoading();
        if (response.success) return response.data;
        return [];
    } catch (error) {
        hideLoading();
        return [];
    }
}

// Render equipment cards
async function renderEquipment(equipment = null) {
    if (!equipment) {
        equipment = await fetchEquipment();

        // If no equipment exists, initialize with sample data
        if (equipment.length === 0) {
            const sampleEquipment = [
                {
                    id: 1,
                    name: "Sony FX6 Cinema Camera",
                    type: "camera",
                    price: 13500,
                    image: "",
                    description: "Full-frame cinema camera with advanced autofocus and 4K 120p recording",
                    stock: 5,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 2,
                    name: "ARRI SkyPanel S60-C",
                    type: "light",
                    price: 9000,
                    image: "",
                    description: "High-output LED soft light with full color spectrum control",
                    stock: 3,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 3,
                    name: "Canon C70 Cinema Camera",
                    type: "camera",
                    price: 11250,
                    image: "",
                    description: "Compact cinema camera with RF mount and dual gain output",
                    stock: 4,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 4,
                    name: "Kino Flo Celeb 200",
                    type: "light",
                    price: 6375,
                    image: "",
                    description: "LED fixture with high CRI and flicker-free operation",
                    stock: 7,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 5,
                    name: "Sigma 18-35mm T2 Cine Lens",
                    type: "lens",
                    price: 6750,
                    image: "",
                    description: "High-speed zoom lens with consistent T-stop throughout range",
                    stock: 2,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 6,
                    name: "Blackmagic Ursa Mini Pro 12K",
                    type: "camera",
                    price: 18750,
                    image: "",
                    description: "Professional cinema camera with 12K sensor and EF lens mount",
                    stock: 2,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];

            localStorage.setItem('cine_equipment', JSON.stringify(sampleEquipment));
            equipment = sampleEquipment;
        }
    }

    if (!equipmentContainer) return;
    equipmentContainer.innerHTML = '';

    if (equipment.length === 0) {
        equipmentContainer.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; padding: 40px; color: #666;">No equipment found. Add some equipment from the admin panel.</p>';
        return;
    }

    equipment.forEach(item => {
        const equipmentCard = document.createElement('div');
        equipmentCard.className = 'equipment-card';
        equipmentCard.setAttribute('data-type', item.type);

        const imageSrc = item.image || `https://via.placeholder.com/300x200/2c3e50/ffffff?text=${encodeURIComponent(item.name.substring(0, 20))}`;

        equipmentCard.innerHTML = `
            <img src="${imageSrc}" alt="${item.name}" class="equipment-img">
            <div class="equipment-info">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <div class="equipment-meta">
                    <div class="price">${formatPrice(item.price)}<span style="font-size: 14px; color: #666;">/day</span></div>
                    <div class="availability ${item.stock === 0 ? 'out-of-stock' : ''}">
                        ${item.stock === 0 ? 'Out of Stock' : `${item.stock} Available`}
                    </div>
                </div>
                <button class="add-to-cart" data-id="${item.id}" ${item.stock === 0 ? 'disabled' : ''}>
                    ${item.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
            </div>
        `;

        equipmentContainer.appendChild(equipmentCard);
    });

    // Add event listeners to add-to-cart buttons
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            addToCart(id);
        });
    });
}

// Update footer contact info
async function updateFooterContactInfo() {
    try {
        const response = await apiService.getContactInfo();
        if (response.success) {
            contactInfo = response.data;
            if (contactInfo) {
                footerAddress.textContent = contactInfo.address;
                footerPhone.innerHTML = `<i class="fas fa-phone"></i> ${contactInfo.phone}`;
                footerEmail.innerHTML = `<i class="fas fa-envelope"></i> ${contactInfo.email}`;
                footerHours.innerHTML = `<i class="fas fa-clock"></i> ${contactInfo.hours}`;
            }
        }
    } catch (error) {
        console.error("Error updating footer contact info", error);
    }
}

// ============================================
// USER PROFILE MANAGEMENT
// ============================================

// Update user profile display
async function updateUserProfile() {
    try {
        const response = await apiService.getCurrentUser();

        if (response.success) {
            currentUser = response.data;

            // Update login button to show profile icon
            loginButton.innerHTML = `<i class="fas fa-user"></i> ${currentUser.name || currentUser.email.split('@')[0]}`;
            loginButton.style.backgroundColor = '#28a745';

            // Update profile header
            profileHeader.innerHTML = `
                <h4>Welcome, ${currentUser.name || currentUser.email}</h4>
                <p>${currentUser.role === 'admin' ? 'Administrator' : 'Registered User'}</p>
            `;

            // Update profile menu
            let menuHTML = '';

            if (currentUser.role === 'admin') {
                menuHTML = `
                    <button class="dropdown-item" id="view-admin-dashboard">
                        <i class="fas fa-tachometer-alt"></i>
                        <span>Admin Dashboard</span>
                    </button>
                    <div class="dropdown-divider"></div>
                `;
            } else {
                menuHTML = `
                    <button class="dropdown-item" id="view-my-bookings">
                        <i class="fas fa-calendar-alt"></i>
                        <span>My Bookings</span>
                    </button>
                    <div class="dropdown-divider"></div>
                `;
            }

            menuHTML += `
                <button class="dropdown-item" id="view-profile">
                    <i class="fas fa-user-circle"></i>
                    <span>My Profile</span>
                </button>
                <button class="dropdown-item" id="logout-user">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                </button>
            `;

            profileMenu.innerHTML = menuHTML;

            // Show user bookings section if user has bookings
            if (currentUser.role !== 'admin') {
                await loadUserBookings();
                if (userBookingsSection) userBookingsSection.style.display = 'block';
            }

            // Auto-fill customer form with user data
            if (currentUser.email && !currentUser.role) {
                customerNameInput.value = currentUser.name || '';
                customerEmailInput.value = currentUser.email || '';
                customerPhoneInput.value = currentUser.phone || '';
                if (currentUser.company) customerCompanyInput.value = currentUser.company;
            }
        } else {
            currentUser = null;
            // Reset login button
            loginButton.innerHTML = `<i class="fas fa-user"></i> Login`;
            loginButton.style.backgroundColor = '';

            // Show login/signup form
            profileHeader.innerHTML = `
                <h4>Welcome Guest!</h4>
                <p>Login to access your bookings</p>
            `;

            profileMenu.innerHTML = `
                <div class="auth-form">
                    <div class="form-tabs">
                        <button class="form-tab active" data-form="login">Login</button>
                        <button class="form-tab" data-form="signup">Sign Up</button>
                    </div>

                    <div class="form-content active" id="login-form">
                        <div class="form-group" style="margin-bottom: 15px;">
                            <input type="email" id="login-email" placeholder="Email Address" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        </div>
                        <div class="form-group" style="margin-bottom: 15px;">
                            <input type="password" id="login-password" placeholder="Password" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        </div>
                        <button class="submit-btn" id="login-btn" style="width: 100%; padding: 10px; font-size: 14px;">
                            Login
                        </button>
                    </div>

                    <div class="form-content" id="signup-form">
                        <div class="form-group" style="margin-bottom: 15px;">
                            <input type="text" id="signup-name" placeholder="Full Name" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        </div>
                        <div class="form-group" style="margin-bottom: 15px;">
                            <input type="email" id="signup-email" placeholder="Email Address" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        </div>
                        <div class="form-group" style="margin-bottom: 15px;">
                            <input type="password" id="signup-password" placeholder="Password" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        </div>
                        <button class="submit-btn" id="signup-btn" style="width: 100%; padding: 10px; font-size: 14px;">
                            Sign Up
                        </button>
                    </div>
                </div>
            `;

            // Hide user bookings section
            if (userBookingsSection) userBookingsSection.style.display = 'none';
        }

        // Add event listeners to menu items
        setupProfileMenuListeners();
    } catch (error) {
        console.error("Error updating profile", error);
    }
}

// Load user bookings
async function loadUserBookings() {
    if (!currentUser || !userBookingsContainer) return;

    try {
        const response = await apiService.getUserBookings(currentUser.email);

        if (response.success && response.data.length > 0) {
            userBookingsContainer.innerHTML = '';

            response.data.forEach(booking => {
                const bookingCard = document.createElement('div');
                bookingCard.className = 'booking-card';

                bookingCard.innerHTML = `
                    <div class="booking-header">
                        <div>
                            <span class="booking-id">#${booking.bookingId}</span>
                            <span style="color: #666; font-size: 14px; margin-left: 10px;">
                                ${new Date(booking.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <span class="status-badge status-${booking.status}">
                            ${booking.status.toUpperCase()}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${booking.equipmentItems.length} Items</strong>
                            <p style="color: #666; font-size: 14px;">
                                ${booking.equipmentItems.map(i => i.name).join(', ')}
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: bold; color: var(--primary-color);">
                                ${formatPrice(booking.totalAmount)}
                            </div>
                            <button class="view-booking-receipt" data-booking='${JSON.stringify(booking).replace(/'/g, "&apos;")}' 
                                style="margin-top: 5px; background: none; border: none; color: var(--secondary-color); text-decoration: underline; cursor: pointer;">
                                View Receipt
                            </button>
                        </div>
                    </div>
                `;

                userBookingsContainer.appendChild(bookingCard);
            });

            // Add listeners for view receipt
            document.querySelectorAll('.view-booking-receipt').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const booking = JSON.parse(e.target.getAttribute('data-booking'));
                    showReceipt(booking);
                });
            });
        } else {
            userBookingsContainer.innerHTML = '<p>You haven\'t made any bookings yet.</p>';
        }
    } catch (error) {
        console.error("Error loading user bookings", error);
    }
}

// Setup profile menu event listeners
function setupProfileMenuListeners() {
    // Login/Signup tabs
    document.querySelectorAll('.form-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const formType = e.target.getAttribute('data-form');

            // Update active tab
            document.querySelectorAll('.form-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');

            // Show corresponding form
            document.querySelectorAll('.form-content').forEach(form => {
                form.classList.remove('active');
                if (form.id === `${formType}-form`) {
                    form.classList.add('active');
                }
            });
        });
    });

    // Login button
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (email && password) {
                const result = await apiService.login({ email, password });
                if (result.success) {
                    profileDropdown.classList.remove('active');
                    await updateUserProfile();
                    showNotification(result.message);
                } else {
                    showNotification(result.error, 'error');
                }
            } else {
                showNotification('Please enter email and password', 'error');
            }
        });
    }

    // Signup button
    const signupBtn = document.getElementById('signup-btn');
    if (signupBtn) {
        signupBtn.addEventListener('click', async () => {
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;

            if (name && email && password) {
                // For demo, we'll just login the user after "signup"
                const result = await apiService.login({ email, password });
                if (result.success) {
                    // Update user name since it might be new
                    let user = result.data.user;
                    user.name = name;
                    localStorage.setItem('cine_current_user', JSON.stringify(user));

                    profileDropdown.classList.remove('active');
                    await updateUserProfile();
                    showNotification("Account created successfully");
                }
            } else {
                showNotification('Please fill all fields', 'error');
            }
        });
    }

    // View my bookings
    const viewMyBookings = document.getElementById('view-my-bookings');
    if (viewMyBookings) {
        viewMyBookings.addEventListener('click', async (e) => {
            e.preventDefault();
            profileDropdown.classList.remove('active');
            if (userBookingsSection) userBookingsSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // View admin dashboard - Redirect to admin page
    const viewAdminDashboard = document.getElementById('view-admin-dashboard');
    if (viewAdminDashboard) {
        viewAdminDashboard.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'admin.html';
        });
    }

    // Logout
    const logoutUser = document.getElementById('logout-user');
    if (logoutUser) {
        logoutUser.addEventListener('click', async (e) => {
            e.preventDefault();
            const result = await apiService.logout();
            if (result.success) {
                currentUser = null;
                profileDropdown.classList.remove('active');
                await updateUserProfile();
                showNotification('Logged out successfully');
                // Hide Bookings if logout
                if (userBookingsSection) userBookingsSection.style.display = 'none';
            }
        });
    }
}

// ============================================
// INITIALIZATION
// ============================================

async function init() {
    // Load gallery images
    await fetchGalleryImages();

    // Load equipment
    await renderEquipment();

    // Load contact info
    await updateFooterContactInfo();

    // Check if user is logged in
    await updateUserProfile();

    // Set minimum date for shoot date to today
    if (shootDateInput) {
        const today = new Date().toISOString().split('T')[0];
        shootDateInput.min = today;
    }

    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Login button click
    if (loginButton) {
        loginButton.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (userProfile && !userProfile.contains(e.target)) {
            profileDropdown.classList.remove('active');
        }

        // Close modals when clicking outside
        if (e.target === cartModal) {
            cartModal.style.display = 'none';
        }
        if (e.target === receiptModal) {
            receiptModal.style.display = 'none';
        }
    });

    // Cart modal toggle
    if (cartToggle) {
        cartToggle.addEventListener('click', (e) => {
            e.preventDefault();
            cartModal.style.display = 'flex';
            renderCartItems();
            // Hide customer details form initially
            if (customerDetailsForm) customerDetailsForm.style.display = 'none';
            if (checkoutBtn) checkoutBtn.style.display = 'none';
            if (proceedToDetailsBtn) proceedToDetailsBtn.style.display = 'block';
        });
    }

    if (closeCart) {
        closeCart.addEventListener('click', () => {
            cartModal.style.display = 'none';
        });
    }

    if (closeReceipt) {
        closeReceipt.addEventListener('click', () => {
            receiptModal.style.display = 'none';
        });
    }

    // Print receipt
    if (printReceiptBtn) {
        printReceiptBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // Download receipt (simulated)
    if (downloadReceiptBtn) {
        downloadReceiptBtn.addEventListener('click', () => {
            showNotification('Receipt download started', 'success');
        });
    }

    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');
            const equipment = await fetchEquipment();

            if (filter === 'all') {
                renderEquipment(equipment);
            } else {
                const filtered = equipment.filter(item => item.type === filter);
                renderEquipment(filtered);
            }
        });
    });

    // Equipment navigation links
    equipmentLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const filter = link.getAttribute('data-filter');

            // Update filter buttons
            filterBtns.forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-filter') === filter) {
                    btn.classList.add('active');
                }
            });

            const equipment = await fetchEquipment();

            if (filter === 'all') {
                renderEquipment(equipment);
            } else {
                const filtered = equipment.filter(item => item.type === filter);
                renderEquipment(filtered);
            }

            // Close mobile menu if open
            if (navLinks) navLinks.classList.remove('active');
        });
    });

    // Footer links
    footerLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const filter = link.getAttribute('data-filter');

            // Update filter buttons
            filterBtns.forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-filter') === filter) {
                    btn.classList.add('active');
                }
            });

            const equipment = await fetchEquipment();

            if (filter === 'all') {
                renderEquipment(equipment);
            } else {
                const filtered = equipment.filter(item => item.type === filter);
                renderEquipment(filtered);
            }

            // Scroll to equipment section
            const sectionTitle = document.querySelector('.section-title');
            if (sectionTitle) sectionTitle.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Search functionality
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', async () => {
            const query = searchInput.value.toLowerCase().trim();
            const equipment = await fetchEquipment();

            if (!query) {
                renderEquipment(equipment);
                return;
            }

            const filtered = equipment.filter(item =>
                item.name.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query) ||
                item.type.toLowerCase().includes(query)
            );

            renderEquipment(filtered);
        });

        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') searchBtn.click();
        });
    }

    // Hamburger menu for mobile
    if (hamburgerMenu && navLinks) {
        hamburgerMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Checkout flow
    if (proceedToDetailsBtn) {
        proceedToDetailsBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                showNotification('Your cart is empty', 'error');
                return;
            }

            // Show customer details form
            if (customerDetailsForm) customerDetailsForm.style.display = 'block';
            proceedToDetailsBtn.style.display = 'none';
            if (checkoutBtn) checkoutBtn.style.display = 'block';

            // Scroll to the form
            if (customerDetailsForm) customerDetailsForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // Complete booking
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', completeBooking);
    }

    // Home link
    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            // Reset filters
            filterBtns.forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-filter') === 'all') {
                    btn.classList.add('active');
                }
            });
            // Close mobile menu if open
            if (navLinks) navLinks.classList.remove('active');
            // Reload equipment
            renderEquipment();
        });
    }
}

// Initialize the app
window.addEventListener('DOMContentLoaded', init);
