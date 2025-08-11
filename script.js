// Global variables
let currentUser = null;
let userTemplate = {};
let invoiceHistory = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    setTodaysDate();
    
    // Check if we should run in demo mode (for testing without Google auth)
    if (window.location.hash === '#demo') {
        enableDemoMode();
        return;
    }
    
    // Initialize Google Sign-In when available
    initializeGoogleSignIn();
    
    // Wait for Firebase to be ready
    const checkFirebase = () => {
        if (window.firebaseAuth) {
            console.log('Firebase Auth ready');
            // Firebase auth state listener will handle initial login state
        } else {
            setTimeout(checkFirebase, 100);
        }
    };
    checkFirebase();
});

// Handle Firebase Authentication State Changes
window.handleFirebaseAuthChange = async (user) => {
    if (user) {
        console.log('Firebase user logged in:', user);
        
        // Set current user
        currentUser = {
            id: user.uid,
            name: user.displayName || user.email,
            email: user.email,
            firstName: user.displayName ? user.displayName.split(' ')[0] : '',
            lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : ''
        };
        
        // Load user data from Firebase
        await loadUserDataFromFirebase();
        
        // Show dashboard
        loginSuccess();
        
    } else {
        console.log('Firebase user logged out');
        currentUser = null;
        userTemplate = {};
        invoiceHistory = [];
        
        // Show login screen
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('dashboardSection').classList.add('hidden');
    }
};

// Initialize Google Sign-In (Firebase only - legacy removed)
function initializeGoogleSignIn() {
    console.log('Using Firebase Google Auth - Legacy Google Identity Services disabled');
    
    // Remove legacy Google Sign-In initialization to prevent conflicts
    // All Google authentication now handled through Firebase Auth
}

// Demo mode for testing without Google authentication
function enableDemoMode() {
    currentUser = {
        id: 'demo123',
        name: 'Demo User',
        email: 'demo@example.com',
        imageUrl: ''
    };
    
    document.getElementById('userEmail').textContent = 'Demo Mode - ' + currentUser.email;
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');
    
    // Add demo banner
    const header = document.querySelector('header h1');
    header.textContent = '🔧 Invoice Generator (Demo Mode)';
    header.style.color = '#e74c3c';
    
    loadUserData();
    
    console.log('Demo mode enabled - you can test all features without Google authentication');
}

// Show Sign Up form
function showSignUp() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
}

// Show Sign In form
function showSignIn() {
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

// Handle Email Login with Firebase
async function handleEmailLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!window.firebaseSignIn) {
        showNotification('⏳ Firebase is loading... Please try again in a moment.', 'error');
        return;
    }
    
    showNotification('🔄 Signing in...', 'info');
    
    const result = await window.firebaseSignIn(email, password);
    
    if (result.success) {
        // Success handled by Firebase auth state listener
        console.log('Login successful');
    } else {
        let errorMessage = 'Login failed';
        if (result.error.includes('user-not-found')) {
            errorMessage = 'No account found with this email';
        } else if (result.error.includes('wrong-password')) {
            errorMessage = 'Incorrect password';
        } else if (result.error.includes('invalid-email')) {
            errorMessage = 'Invalid email address';
        } else if (result.error.includes('too-many-requests')) {
            errorMessage = 'Too many failed attempts. Please try again later';
        }
        showNotification('❌ ' + errorMessage, 'error');
    }
}

// Handle Email Signup with Firebase
async function handleEmailSignup(event) {
    event.preventDefault();
    
    const firstName = document.getElementById('signupFirstName').value;
    const lastName = document.getElementById('signupLastName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    // Validation
    if (password !== confirmPassword) {
        showNotification('❌ Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('❌ Password must be at least 6 characters long', 'error');
        return;
    }
    
    if (!window.firebaseSignUp) {
        showNotification('⏳ Firebase is loading... Please try again in a moment.', 'error');
        return;
    }
    
    showNotification('🔄 Creating account...', 'info');
    
    const result = await window.firebaseSignUp(email, password, firstName, lastName);
    
    if (result.success) {
        // Success handled by Firebase auth state listener
        if (result.message) {
            // Show recovery/existing account message
            showNotification('✅ ' + result.message, 'success');
        } else {
            console.log('Account created successfully');
            showNotification('✅ Account created successfully!', 'success');
        }
    } else {
        let errorMessage = 'Account creation failed';
        
        if (result.code === 'account-recovery-failed') {
            errorMessage = result.error;
        } else if (result.error.includes('email-already-in-use')) {
            errorMessage = 'An account with this email already exists. Please try signing in instead.';
        } else if (result.error.includes('weak-password')) {
            errorMessage = 'Password is too weak. Please choose a stronger password.';
        } else if (result.error.includes('invalid-email')) {
            errorMessage = 'Invalid email address format';
        } else if (result.error.includes('network-request-failed')) {
            errorMessage = 'Network error. Please check your internet connection.';
        }
        
        showNotification('❌ ' + errorMessage, 'error');
    }
}

// Handle Google Sign-In with Firebase
async function handleGoogleSignIn() {
    console.log('Google Sign-In button clicked');
    
    if (!window.firebaseGoogleSignIn) {
        showNotification('⏳ Firebase is loading... Please try again in a moment.', 'error');
        return;
    }
    
    try {
        showNotification('🔄 Signing in with Google...', 'info');
        
        const result = await window.firebaseGoogleSignIn();
        
        if (result.success) {
            if (result.redirected) {
                showNotification('🔄 Redirecting to Google... Please wait.', 'info');
                // User will be redirected, auth state will be handled on return
            } else {
                // Success handled by Firebase auth state listener
                console.log('Google Sign-In successful');
                showNotification('✅ Successfully signed in with Google!', 'success');
            }
        } else {
            let errorMessage = 'Google Sign-In failed';
            
            if (result.error.includes('popup-blocked') || result.error.includes('auth/popup-blocked')) {
                errorMessage = 'Google popup was blocked. Please allow popups and try again.';
            } else if (result.error.includes('popup-closed-by-user') || result.error.includes('auth/popup-closed-by-user')) {
                errorMessage = 'Google Sign-In was cancelled.';
            } else if (result.error.includes('network-request-failed')) {
                errorMessage = 'Network error. Please check your internet connection.';
            } else if (result.error.includes('auth/unauthorized-domain')) {
                errorMessage = 'Domain not authorized for Google Sign-In.';
            } else if (result.error.includes('auth/cancelled-popup-request')) {
                errorMessage = 'Another sign-in popup is already open. Please close it and try again.';
            }
            
            console.error('Google Sign-In Error Details:', result.error);
            showNotification('❌ ' + errorMessage + ' You can use email signup instead.', 'error');
        }
        
    } catch (error) {
        console.error('Google Sign-In Error:', error);
        showNotification('❌ Google Sign-In failed. Please try email signup or demo mode.', 'error');
    }
}

// Legacy Google Sign-In callback (disabled - Firebase handles auth)
function onSignIn(response) {
    console.log('Legacy Google Sign-In callback triggered - ignoring in favor of Firebase Auth');
    // This function is now disabled to prevent conflicts with Firebase Auth
    showNotification('ℹ️ Please use the "Sign in with Google" button below for authentication.', 'info');
}

// Login Success - Common function
function loginSuccess() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');
    document.getElementById('userEmail').textContent = currentUser.email;
    
    // Load user template with name
    if (currentUser.firstName && currentUser.lastName) {
        userTemplate.businessName = userTemplate.businessName || `${currentUser.firstName} ${currentUser.lastName}`;
        userTemplate.businessEmail = userTemplate.businessEmail || currentUser.email;
    }
    
    loadUserData();
}

// Sign Out with Firebase
async function signOut() {
    if (window.firebaseSignOut) {
        showNotification('🔄 Signing out...', 'info');
        const result = await window.firebaseSignOut();
        
        if (result.success) {
            // Clear Google Sign-In
            if (typeof google !== 'undefined' && google.accounts) {
                google.accounts.id.disableAutoSelect();
            }
            
            // Clear only invoice form fields, NOT template fields
            clearInvoiceForm();
            
            // Clear local user data
            currentUser = null;
            userTemplate = {};
            invoiceHistory = [];
            
            showNotification('👋 You have been signed out');
        } else {
            showNotification('❌ Sign out failed: ' + result.error, 'error');
        }
    } else {
        // Fallback for demo mode
        currentUser = null;
        userTemplate = {};
        invoiceHistory = [];
        clearInvoiceForm();
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('dashboardSection').classList.add('hidden');
        showNotification('👋 You have been signed out');
    }
}

// Clear only invoice form fields (not template fields)
function clearInvoiceForm() {
    const invoiceFields = [
        'clientCompany', 'clientAddress', 'clientVAT', 'clientEmail', 'clientPhone',
        'invoiceNumber', 'invoiceDate', 'yourRef', 'cxRef', 'customerRef',
        'deliveryDate', 'vehicleType', 'pickupAddress', 'deliveryAddress',
        'deliveryTime', 'receivedBy', 'leftAt', 'deliveryNotes', 'unitCost', 'paymentDays'
    ];
    
    invoiceFields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = false;
            } else {
                element.value = '';
            }
        }
    });
    
    // Reset dates to today
    setTodaysDate();
    
    // Clear textareas
    document.querySelectorAll('#createTab textarea').forEach(textarea => {
        textarea.value = '';
    });
    
    console.log('Invoice form cleared');
}

// Show Forgot Password (placeholder)
function showForgotPassword() {
    const email = prompt('Enter your email address to reset your password:');
    if (email) {
        showNotification('Password reset instructions would be sent to ' + email + ' (Demo: Feature not implemented)');
    }
}

// Debug user email status
function debugUserEmail() {
    const email = prompt('Enter the email address you want to check:');
    if (email && window.debugUserStatus) {
        showNotification('🔍 Checking email status... Check console for details.', 'info');
        window.debugUserStatus(email).then(result => {
            console.log('🔍 Email status result:', result);
            
            let message = `Email: ${email}\n`;
            if (result.authExists) {
                message += `✅ EXISTS in Firebase Auth\n`;
                message += `🔧 Sign-in methods: ${result.methods.join(', ')}\n`;
                if (result.firestoreExists === true) {
                    message += `✅ EXISTS in Firestore`;
                } else if (result.firestoreExists === false) {
                    message += `❌ MISSING from Firestore (This causes the error!)`;
                } else {
                    message += `❓ Firestore status unknown`;
                }
            } else {
                message += `❌ Does NOT exist in Firebase Auth\n✅ Safe to sign up!`;
            }
            
            alert(message);
            showNotification(result.authExists ? 
                '⚠️ User exists in Auth - check console for details' : 
                '✅ Email is available for signup', 
                result.authExists ? 'info' : 'success'
            );
        }).catch(error => {
            console.error('Debug error:', error);
            showNotification('❌ Debug failed: ' + error.message, 'error');
        });
    } else {
        showNotification('⚠️ Email check requires Firebase to be loaded', 'error');
    }
}

// Debug Firebase Functions
async function debugFirebaseFunctions() {
    console.log('=== FIREBASE DEBUG TEST ===');
    
    let debugInfo = '🔧 Firebase Functions Debug:\n\n';
    
    // Check if user is signed in
    debugInfo += `Current User: ${currentUser ? '✅ Signed in as ' + currentUser.email : '❌ Not signed in'}\n`;
    
    // Check Firebase functions
    const functions = ['saveUserTemplate', 'getUserData', 'getUserInvoices', 'saveInvoice'];
    functions.forEach(func => {
        debugInfo += `${func}: ${typeof window[func] === 'function' ? '✅ Available' : '❌ Missing'}\n`;
    });
    
    // Check Firebase auth
    debugInfo += `Firebase Auth: ${window.firebaseAuth ? '✅ Available' : '❌ Missing'}\n`;
    debugInfo += `Firebase DB: ${window.firebaseDB ? '✅ Available' : '❌ Missing'}\n`;
    
    console.log(debugInfo);
    alert(debugInfo);
    
    if (currentUser) {
        // Test loading user data
        showNotification('🔄 Testing user data loading...', 'info');
        
        try {
            if (window.getUserData) {
                const result = await window.getUserData(currentUser.id);
                console.log('getUserData result:', result);
                showNotification(`getUserData: ${result.success ? '✅ Success' : '❌ Failed - ' + result.error}`, result.success ? 'success' : 'error');
            }
            
            if (window.getUserInvoices) {
                const invoiceResult = await window.getUserInvoices(currentUser.id);
                console.log('getUserInvoices result:', invoiceResult);
                showNotification(`getUserInvoices: ${invoiceResult.success ? '✅ Success - Found ' + (invoiceResult.invoices ? invoiceResult.invoices.length : 0) + ' invoices' : '❌ Failed - ' + invoiceResult.error}`, invoiceResult.success ? 'success' : 'error');
            }
        } catch (error) {
            console.error('Error testing functions:', error);
            showNotification('❌ Error testing functions: ' + error.message, 'error');
        }
    } else {
        showNotification('ℹ️ Sign in first to test user-specific functions', 'info');
    }
}

// Debug Google Auth
function debugGoogleAuth() {
    let debugInfo = '🔍 Google Auth Debug Info:\n\n';
    
    // Check if Google object exists
    debugInfo += `Google object: ${typeof google !== 'undefined' ? '✅ Loaded' : '❌ Not loaded'}\n`;
    
    if (typeof google !== 'undefined') {
        debugInfo += `Google.accounts: ${google.accounts ? '✅ Available' : '❌ Missing'}\n`;
        
        if (google.accounts && google.accounts.id) {
            debugInfo += `Google.accounts.id: ✅ Available\n`;
        } else {
            debugInfo += `Google.accounts.id: ❌ Missing\n`;
        }
    }
    
    // Check current URL
    debugInfo += `Current URL: ${window.location.href}\n`;
    debugInfo += `Protocol: ${window.location.protocol}\n`;
    debugInfo += `Host: ${window.location.host}\n`;
    
    // Check if in iframe
    debugInfo += `In iframe: ${window !== window.top ? '⚠️ Yes (may block Google Auth)' : '✅ No'}\n`;
    
    // Check cookies enabled
    debugInfo += `Cookies enabled: ${navigator.cookieEnabled ? '✅ Yes' : '❌ No'}\n`;
    
    console.log(debugInfo);
    alert(debugInfo);
    
    // Try to initialize Google Auth
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        try {
            google.accounts.id.initialize({
                client_id: '558805332524-spou8m9s6i9fl5kusp430fmg3kttclo9.apps.googleusercontent.com',
                callback: onSignIn
            });
            showNotification('✅ Google Auth initialized successfully!', 'success');
        } catch (error) {
            showNotification('❌ Google Auth initialization failed: ' + error.message, 'error');
            console.error('Google Auth init error:', error);
        }
    }
}

// Helper function to decode JWT token
function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}

// Tab management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.remove('hidden');
    event.target.classList.add('active');
}

// Set today's date
function setTodaysDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoiceDate').value = today;
    document.getElementById('deliveryDate').value = today;
}

// Load user data from Firebase
async function loadUserDataFromFirebase() {
    if (!currentUser) {
        console.log('No current user, skipping data load');
        return;
    }
    
    try {
        // Ensure we have a valid user ID
        const userId = currentUser.id || currentUser.uid;
        if (!userId) {
            console.error('❌ No valid user ID found for data loading!', currentUser);
            showNotification('❌ Error: No valid user ID found', 'error');
            return;
        }
        
        console.log('Loading user data from Firebase for:', userId);
        showNotification('🔄 Loading your data...', 'info');
        
        // Load user profile and template
        if (window.getUserData) {
            const userResult = await window.getUserData(userId);
            if (userResult.success && userResult.data) {
                userTemplate = userResult.data.businessInfo || {};
                console.log('Loaded user template:', userTemplate);
                
                // Update template form immediately
                loadTemplateData();
            } else {
                console.log('No user template found or error:', userResult.error);
                userTemplate = {};
            }
        }
        
        // Load invoice history
        if (window.getUserInvoices) {
            const invoicesResult = await window.getUserInvoices(userId);
            if (invoicesResult.success && invoicesResult.invoices) {
                invoiceHistory = invoicesResult.invoices.map(invoice => ({
                    id: invoice.id,
                    invoiceNumber: invoice.invoiceNumber,
                    clientCompany: invoice.clientCompany || invoice.clientInfo?.clientCompany,
                    amount: invoice.amount || invoice.unitCost,
                    date: invoice.createdAt ? new Date(invoice.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    status: invoice.status || 'Generated',
                    fullData: invoice
                }));
                console.log('Loaded invoice history:', invoiceHistory.length, 'invoices');
                
                // Update history display immediately
                loadInvoiceHistory();
            } else {
                console.log('No invoices found or error:', invoicesResult.error);
                invoiceHistory = [];
                loadInvoiceHistory(); // Show empty state
            }
        }
        
        showNotification('✅ Data loaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('❌ Error loading your data: ' + error.message, 'error');
    }
}

// Save user template to Firebase
async function saveUserTemplateToFirebase() {
    if (!currentUser) {
        showNotification('❌ Please sign in to save your template', 'error');
        return;
    }
    
    if (!window.saveUserTemplate) {
        showNotification('⏳ Firebase is still loading... Please try again in a moment.', 'error');
        return;
    }
    
    const templateFields = [
        'businessName', 'businessAddress', 'businessPhone', 'businessEmail', 
        'memberID', 'bankName', 'accountHolder', 'sortCode', 'accountNumber'
    ];
    
    // Collect template data from form
    const templateData = {};
    templateFields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            templateData[field] = element.value.trim();
            userTemplate[field] = element.value.trim(); // Update local copy
        }
    });
    
    console.log('Saving template data:', templateData);
    console.log('Current user ID before Firebase call:', currentUser.id);
    console.log('Type of currentUser.id:', typeof currentUser.id);
    
    showNotification('🔄 Saving template...', 'info');
    
    // Ensure we have a valid user ID
    const userId = currentUser.id || currentUser.uid;
    if (!userId) {
        console.error('❌ No valid user ID found!', currentUser);
        showNotification('❌ Error: No valid user ID found', 'error');
        return;
    }
    
    console.log('Using user ID for save:', userId);
    
    try {
        // Test the function and parameters first
        console.log('About to call window.saveUserTemplate');
        console.log('Function exists:', typeof window.saveUserTemplate);
        console.log('userId parameter:', userId);
        console.log('templateData parameter:', templateData);
        
        // Direct call
        const saveFunc = window.saveUserTemplate;
        console.log('Extracted function:', typeof saveFunc);
        
        const result = await saveFunc(userId, templateData);
        
        if (result.success) {
            showNotification('✅ Template saved successfully!', 'success');
            console.log('Template saved to Firebase successfully');
        } else {
            console.error('Failed to save template:', result.error);
            showNotification('❌ Failed to save template: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error saving template:', error);
        showNotification('❌ Error saving template: ' + error.message, 'error');
    }
}

// Load template data into form
function loadTemplateData() {
    Object.keys(userTemplate).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.value = userTemplate[key];
        }
    });
}

// Save template (wrapper function for the button)
async function saveTemplate() {
    console.log('Save template button clicked');
    console.log('Current user:', currentUser);
    console.log('Firebase functions available:', {
        saveUserTemplate: typeof window.saveUserTemplate,
        getUserData: typeof window.getUserData,
        firebaseAuth: typeof window.firebaseAuth
    });
    
    if (!currentUser) {
        showNotification('❌ You must be signed in to save your template', 'error');
        return;
    }
    
    try {
        await saveUserTemplateToFirebase();
    } catch (error) {
        console.error('Error in saveTemplate wrapper:', error);
        showNotification('❌ Error saving template: ' + error.message, 'error');
    }
}

// Generate invoice number
function generateInvoiceNumber() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000);
    
    return `${userTemplate.memberID || '000000'}-${year}${month}${day}${random}`;
}

// Preview invoice
function previewInvoice() {
    const formData = getFormData();
    if (!formData) return;
    
    const invoiceHTML = generateInvoiceHTML(formData);
    document.getElementById('invoicePreview').innerHTML = invoiceHTML;
    document.getElementById('previewModal').classList.remove('hidden');
}

// Get form data
function getFormData() {
    const requiredFields = ['clientCompany', 'clientAddress', 'clientEmail', 'invoiceDate', 'deliveryDate', 'vehicleType', 'pickupAddress', 'deliveryAddress', 'unitCost'];
    
    for (let field of requiredFields) {
        if (!document.getElementById(field).value.trim()) {
            alert(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
            return null;
        }
    }
    
    return {
        // Client info
        clientCompany: document.getElementById('clientCompany').value,
        clientAddress: document.getElementById('clientAddress').value,
        clientVAT: document.getElementById('clientVAT').value,
        clientEmail: document.getElementById('clientEmail').value,
        clientPhone: document.getElementById('clientPhone').value,
        
        // Invoice details
        invoiceNumber: document.getElementById('invoiceNumber').value || generateInvoiceNumber(),
        invoiceDate: document.getElementById('invoiceDate').value,
        yourRef: document.getElementById('yourRef').value,
        cxRef: document.getElementById('cxRef').value,
        customerRef: document.getElementById('customerRef').value,
        
        // Delivery details
        deliveryDate: document.getElementById('deliveryDate').value,
        vehicleType: document.getElementById('vehicleType').value,
        pickupAddress: document.getElementById('pickupAddress').value,
        deliveryAddress: document.getElementById('deliveryAddress').value,
        deliveryTime: document.getElementById('deliveryTime').value,
        receivedBy: document.getElementById('receivedBy').value,
        leftAt: document.getElementById('leftAt').value,
        deliveryNotes: document.getElementById('deliveryNotes').value,
        
        // Pricing
        unitCost: parseFloat(document.getElementById('unitCost').value),
        paymentDays: document.getElementById('paymentDays').value || 30
    };
}

// Generate invoice HTML
function generateInvoiceHTML(data) {
    const paymentDate = new Date(data.invoiceDate);
    paymentDate.setDate(paymentDate.getDate() + parseInt(data.paymentDays));
    
    return `
        <div class="invoice-preview">
            <div class="invoice-header">
                <div class="business-info">
                    <strong>${userTemplate.businessName || 'Your Business Name'}</strong><br>
                    ${userTemplate.businessAddress || 'Your Address'}<br>
                    Tel: ${userTemplate.businessPhone || 'Your Phone'}<br>
                    Email: ${userTemplate.businessEmail || 'your@email.com'}
                </div>
                <div class="invoice-title">
                    <h1>INVOICE</h1>
                    <strong>Member ID: ${userTemplate.memberID || '000000'}</strong>
                </div>
            </div>
            
            <div class="invoice-details">
                <div class="invoice-to">
                    <strong>Invoice To:</strong><br>
                    ${data.clientCompany}<br>
                    ${data.clientAddress.replace(/\n/g, '<br>')}<br>
                    ${data.clientVAT ? `VAT: ${data.clientVAT}<br>` : ''}
                    ${data.clientPhone ? `Tel: ${data.clientPhone}<br>` : ''}
                    Email: ${data.clientEmail}
                </div>
                
                <div class="invoice-info">
                    <strong>Your Ref:</strong> ${data.yourRef}<br>
                    <strong>CX Ref:</strong> ${data.cxRef}<br>
                    <strong>Invoice No.:</strong> ${data.invoiceNumber}<br>
                    <strong>Invoice Date:</strong> ${formatDate(data.invoiceDate)}
                </div>
            </div>
            
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Qty</th>
                        <th>Description</th>
                        <th>Unit Cost</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1</td>
                        <td>
                            <strong>Date Ordered:</strong> ${formatDate(data.invoiceDate)}<br>
                            <strong>Our Ref:</strong> ${data.cxRef}<br>
                            <strong>Customer Ref:</strong> ${data.customerRef}<br>
                            <strong>Vehicle:</strong> ${data.vehicleType}<br>
                            <strong>Pick up from:</strong> ${data.pickupAddress}<br>
                            <strong>Delivered to:</strong> ${data.deliveryAddress}<br>
                            <strong>On:</strong> ${formatDate(data.deliveryDate)}<br>
                            ${data.receivedBy ? `<strong>Received by:</strong> ${data.receivedBy}<br>` : ''}
                            ${data.leftAt ? `<strong>Left at:</strong> ${data.leftAt}<br>` : ''}
                            ${data.deliveryTime ? `<strong>Delivered at:</strong> ${data.deliveryTime} ${formatDate(data.deliveryDate)}<br>` : ''}
                            ${data.deliveryNotes ? `<strong>Delivery notes:</strong> ${data.deliveryNotes}` : ''}
                        </td>
                        <td>£${data.unitCost.toFixed(2)}</td>
                        <td>£${data.unitCost.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="total-section">
                <strong>Please ensure payment is received by ${formatDate(paymentDate.toISOString().split('T')[0])}</strong><br>
                Payment terms: ${data.paymentDays} Days (End Of Month)<br><br>
                <strong>Total £${data.unitCost.toFixed(2)}</strong>
            </div>
            
            <div class="bank-details">
                <strong>Bank details</strong><br><br>
                <strong>Bank Name:</strong> ${userTemplate.bankName || 'Your Bank'}<br>
                <strong>Account Holder Name:</strong> ${userTemplate.accountHolder || 'Your Name'}<br>
                <strong>Sort Code:</strong> ${userTemplate.sortCode || '00-00-00'}<br>
                <strong>Account Number:</strong> ${userTemplate.accountNumber || '00000000'}
            </div>
        </div>
    `;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Generate PDF (simplified version - would need a proper PDF library)
function generatePDF() {
    const formData = getFormData();
    if (!formData) return;
    
    // Save to history first
    saveToHistory(formData);
    
    // Simple implementation - would use jsPDF or similar library
    const invoiceHTML = generateInvoiceHTML(formData);
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(`
        <html>
            <head>
                <title>Invoice ${formData.invoiceNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .invoice-preview { max-width: 800px; margin: 0 auto; padding: 20px; }
                    .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
                    .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
                    .invoice-to { padding: 15px; border: 2px solid #333; }
                    .invoice-info { text-align: right; }
                    .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    .invoice-table th { background: #f8f9fa; }
                    .total-section { text-align: right; margin-bottom: 30px; }
                    .bank-details { background: #f8f9fa; padding: 15px; border: 1px solid #ddd; }
                </style>
            </head>
            <body>${invoiceHTML}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
    
    alert('PDF generated! Use your browser\'s print function to save as PDF.');
}

// Send email (would integrate with email service)
function sendEmail() {
    const formData = getFormData();
    if (!formData) return;
    
    // Save to history
    saveToHistory(formData);
    
    // Simple implementation - would integrate with EmailJS or backend service
    const subject = `Invoice ${formData.invoiceNumber} from ${userTemplate.businessName || 'Your Business'}`;
    const body = `Dear ${formData.clientCompany},

Please find attached your invoice ${formData.invoiceNumber} for delivery services.

Invoice Details:
- Amount: £${formData.unitCost.toFixed(2)}
- Due Date: ${formatDate(new Date(Date.now() + formData.paymentDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0])}

Thank you for your business.

Best regards,
${userTemplate.businessName || 'Your Business'}`;
    
    const mailtoLink = `mailto:${formData.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    
    alert('Email client opened. Please attach the PDF before sending.');
}

// Save invoice to Firebase
async function saveToHistory(formData) {
    if (!currentUser || !window.saveInvoice) {
        console.log('Cannot save to Firebase, using demo mode');
        // Fallback for demo mode
        const historyItem = {
            id: Date.now(),
            invoiceNumber: formData.invoiceNumber,
            clientCompany: formData.clientCompany,
            amount: formData.unitCost,
            date: formData.invoiceDate,
            status: 'Generated',
            fullData: formData
        };
        
        invoiceHistory.unshift(historyItem);
        if (invoiceHistory.length > 50) {
            invoiceHistory = invoiceHistory.slice(0, 50);
        }
        
        loadInvoiceHistory();
        return;
    }
    
    try {
        console.log('Saving invoice to Firebase...');
        
        // Prepare invoice data for Firebase
        const invoiceData = {
            invoiceNumber: formData.invoiceNumber,
            clientCompany: formData.clientCompany,
            clientAddress: formData.clientAddress,
            clientVAT: formData.clientVAT,
            clientEmail: formData.clientEmail,
            clientPhone: formData.clientPhone,
            yourRef: formData.yourRef,
            cxRef: formData.cxRef,
            customerRef: formData.customerRef,
            deliveryDate: formData.deliveryDate,
            vehicleType: formData.vehicleType,
            pickupAddress: formData.pickupAddress,
            deliveryAddress: formData.deliveryAddress,
            deliveryTime: formData.deliveryTime,
            receivedBy: formData.receivedBy,
            leftAt: formData.leftAt,
            deliveryNotes: formData.deliveryNotes,
            unitCost: formData.unitCost,
            paymentDays: formData.paymentDays,
            amount: formData.unitCost,
            status: 'Generated'
        };
        
        const result = await window.saveInvoice(currentUser.id, invoiceData);
        
        if (result.success) {
            console.log('Invoice saved with ID:', result.id);
            
            // Add to local history for immediate UI update
            const historyItem = {
                id: result.id,
                invoiceNumber: formData.invoiceNumber,
                clientCompany: formData.clientCompany,
                amount: formData.unitCost,
                date: formData.invoiceDate,
                status: 'Generated',
                fullData: formData
            };
            
            invoiceHistory.unshift(historyItem);
            loadInvoiceHistory();
            
            showNotification('✅ Invoice saved successfully!', 'success');
        } else {
            console.error('Failed to save invoice:', result.error);
            showNotification('⚠️ Failed to save invoice: ' + result.error, 'error');
        }
        
    } catch (error) {
        console.error('Error saving invoice:', error);
        showNotification('❌ Error saving invoice: ' + error.message, 'error');
    }
}

// Load invoice history
function loadInvoiceHistory() {
    console.log('Loading invoice history...');
    console.log('Invoice history array:', invoiceHistory);
    console.log('Invoice history length:', invoiceHistory.length);
    
    const historyContainer = document.getElementById('invoiceHistory');
    if (!historyContainer) {
        console.error('History container element not found!');
        return;
    }
    
    if (invoiceHistory.length === 0) {
        console.log('No invoices found, showing empty state');
        historyContainer.innerHTML = '<p>No invoices generated yet.</p>';
        return;
    }
    
    console.log('Displaying', invoiceHistory.length, 'invoices');
    
    historyContainer.innerHTML = invoiceHistory.map(item => `
        <div class="history-item">
            <div class="history-item-info">
                <h4>Invoice ${item.invoiceNumber}</h4>
                <p>${item.clientCompany} - £${item.amount.toFixed(2)}</p>
                <small>${formatDate(item.date)} - ${item.status}</small>
            </div>
            <div class="history-item-actions">
                <button onclick="regenerateInvoice(${item.id})" type="button">Regenerate</button>
                <button onclick="deleteInvoice(${item.id})" type="button" style="background: #e74c3c;">Delete</button>
            </div>
        </div>
    `).join('');
    
    // Add event listeners as fallback (in case onclick doesn't work)
    setTimeout(() => {
        const regenerateButtons = document.querySelectorAll('button[onclick^="regenerateInvoice"]');
        const deleteButtons = document.querySelectorAll('button[onclick^="deleteInvoice"]');
        
        regenerateButtons.forEach((button, index) => {
            const item = invoiceHistory[index];
            if (item) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Button click detected for:', item.id);
                    regenerateInvoice(item.id);
                });
            }
        });
        
        deleteButtons.forEach((button, index) => {
            const item = invoiceHistory[index];
            if (item) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    deleteInvoice(item.id);
                });
            }
        });
    }, 100);
}

// Close modal
function closeModal() {
    document.getElementById('previewModal').classList.add('hidden');
}

// Regenerate invoice from history
function regenerateInvoice(id) {
    console.log('Regenerate clicked for ID:', id);
    
    try {
        const historyItem = invoiceHistory.find(item => item.id == id);
        console.log('Found history item:', historyItem);
        
        if (!historyItem) {
            console.error('Invoice not found in history');
            return;
        }
        
        // Switch to Create Invoice tab immediately
        showTabByName('create');
        
        // Fill form with saved data (both old and new format)
        if (historyItem.fullData) {
            // New format with complete data
            const data = historyItem.fullData;
            console.log('Loading full data:', data);
            
            fillFormWithData(data);
            
        } else {
            // Old format - create complete data from available info
            console.log('Converting old format to complete data');
            
            const completeData = {
                clientCompany: historyItem.clientCompany || '',
                clientAddress: '',
                clientVAT: '',
                clientEmail: '',
                clientPhone: '',
                invoiceNumber: generateInvoiceNumber(),
                invoiceDate: new Date().toISOString().split('T')[0],
                yourRef: '',
                cxRef: '',
                customerRef: '',
                deliveryDate: new Date().toISOString().split('T')[0],
                vehicleType: '',
                pickupAddress: '',
                deliveryAddress: '',
                deliveryTime: '',
                receivedBy: '',
                leftAt: '',
                deliveryNotes: '',
                unitCost: historyItem.amount || 0,
                paymentDays: '30'
            };
            
            fillFormWithData(completeData);
        }
        
        // Scroll to top of form
        document.getElementById('createTab').scrollIntoView({ behavior: 'smooth' });
        
        // Show a subtle notification instead of popup
        showNotification(`Invoice ${historyItem.invoiceNumber} data loaded. Ready to edit and generate new invoice.`);
        
    } catch (error) {
        console.error('Error in regenerateInvoice:', error);
        showNotification('Error loading invoice data', 'error');
    }
}

// Helper function to fill form with data
function fillFormWithData(data) {
    // Client info
    safeSetValue('clientCompany', data.clientCompany);
    safeSetValue('clientAddress', data.clientAddress);
    safeSetValue('clientVAT', data.clientVAT);
    safeSetValue('clientEmail', data.clientEmail);
    safeSetValue('clientPhone', data.clientPhone);
    
    // Invoice details (generate new invoice number and use today's date)
    safeSetValue('invoiceNumber', generateInvoiceNumber());
    safeSetValue('invoiceDate', new Date().toISOString().split('T')[0]);
    safeSetValue('yourRef', data.yourRef);
    safeSetValue('cxRef', data.cxRef);
    safeSetValue('customerRef', data.customerRef);
    
    // Delivery details (use today's date)
    safeSetValue('deliveryDate', new Date().toISOString().split('T')[0]);
    safeSetValue('vehicleType', data.vehicleType);
    safeSetValue('pickupAddress', data.pickupAddress);
    safeSetValue('deliveryAddress', data.deliveryAddress);
    safeSetValue('deliveryTime', data.deliveryTime);
    safeSetValue('receivedBy', data.receivedBy);
    safeSetValue('leftAt', data.leftAt);
    safeSetValue('deliveryNotes', data.deliveryNotes);
    
    // Pricing
    safeSetValue('unitCost', data.unitCost);
    safeSetValue('paymentDays', data.paymentDays || '30');
}

// Show notification instead of alert
function showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification && notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Helper function to safely set form values
function safeSetValue(elementId, value) {
    try {
        const element = document.getElementById(elementId);
        if (element && value !== undefined && value !== null) {
            element.value = value;
        }
    } catch (error) {
        console.error('Error setting value for', elementId, ':', error);
    }
}

// Helper function to switch tabs programmatically
function showTabByName(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.remove('hidden');
    
    // Activate the correct tab button
    const tabButtons = document.querySelectorAll('.tab');
    tabButtons.forEach(button => {
        if (button.textContent.toLowerCase().includes(tabName === 'create' ? 'create' : tabName)) {
            button.classList.add('active');
        }
    });
}

// Delete invoice from Firebase
async function deleteInvoice(id) {
    if (!confirm('Are you sure you want to delete this invoice?')) {
        return;
    }
    
    if (!currentUser || !window.deleteInvoice) {
        // Fallback for demo mode
        invoiceHistory = invoiceHistory.filter(item => item.id != id);
        loadInvoiceHistory();
        showNotification('🗑️ Invoice deleted', 'success');
        return;
    }
    
    try {
        showNotification('🔄 Deleting invoice...', 'info');
        
        const result = await window.deleteInvoice(id);
        
        if (result.success) {
            // Remove from local history
            invoiceHistory = invoiceHistory.filter(item => item.id != id);
            loadInvoiceHistory();
            showNotification('🗑️ Invoice deleted successfully!', 'success');
        } else {
            showNotification('❌ Failed to delete invoice: ' + result.error, 'error');
        }
        
    } catch (error) {
        console.error('Error deleting invoice:', error);
        showNotification('❌ Error deleting invoice: ' + error.message, 'error');
    }
}

// Auto-generate invoice number when form loads
document.addEventListener('DOMContentLoaded', function() {
    // Set auto-generated invoice number if empty
    setTimeout(() => {
        const invoiceNumberField = document.getElementById('invoiceNumber');
        if (invoiceNumberField && !invoiceNumberField.value) {
            invoiceNumberField.value = generateInvoiceNumber();
        }
    }, 1000);
});