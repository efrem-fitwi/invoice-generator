// Global variables
let currentUser = null;
let userTemplate = {};
let invoiceHistory = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    setTodaysDate();
    
    // Check if we should run in demo mode (for testing without Google auth)
    if (window.location.hash === '#demo') {
        enableDemoMode();
    }
});

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

// Google Sign-In with new Identity Services
function onSignIn(response) {
    // Decode the JWT token
    const userInfo = parseJwt(response.credential);
    
    currentUser = {
        id: userInfo.sub,
        name: userInfo.name,
        email: userInfo.email,
        imageUrl: userInfo.picture
    };
    
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');
    
    loadUserData();
}

function signOut() {
    google.accounts.id.disableAutoSelect();
    currentUser = null;
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('dashboardSection').classList.add('hidden');
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

// Load user data from localStorage
function loadUserData() {
    if (!currentUser) return;
    
    const userData = localStorage.getItem(`user_${currentUser.id}`);
    if (userData) {
        const data = JSON.parse(userData);
        userTemplate = data.template || {};
        invoiceHistory = data.history || [];
        
        // Load template data
        loadTemplateData();
        loadInvoiceHistory();
    }
}

// Save user data to localStorage
function saveUserData() {
    if (!currentUser) return;
    
    const userData = {
        template: userTemplate,
        history: invoiceHistory
    };
    
    localStorage.setItem(`user_${currentUser.id}`, JSON.stringify(userData));
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

// Save template
function saveTemplate() {
    const templateFields = [
        'businessName', 'businessAddress', 'businessPhone', 'businessEmail', 
        'memberID', 'bankName', 'accountHolder', 'sortCode', 'accountNumber'
    ];
    
    templateFields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            userTemplate[field] = element.value;
        }
    });
    
    saveUserData();
    alert('Template saved successfully!');
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

// Save to history
function saveToHistory(formData) {
    const historyItem = {
        id: Date.now(),
        invoiceNumber: formData.invoiceNumber,
        clientCompany: formData.clientCompany,
        amount: formData.unitCost,
        date: formData.invoiceDate,
        status: 'Generated',
        // Store complete form data for regeneration
        fullData: formData
    };
    
    invoiceHistory.unshift(historyItem);
    if (invoiceHistory.length > 50) {
        invoiceHistory = invoiceHistory.slice(0, 50); // Keep only last 50 invoices
    }
    
    saveUserData();
    loadInvoiceHistory();
}

// Load invoice history
function loadInvoiceHistory() {
    const historyContainer = document.getElementById('invoiceHistory');
    if (!historyContainer) return;
    
    if (invoiceHistory.length === 0) {
        historyContainer.innerHTML = '<p>No invoices generated yet.</p>';
        return;
    }
    
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

// Delete invoice from history
function deleteInvoice(id) {
    if (confirm('Are you sure you want to delete this invoice?')) {
        invoiceHistory = invoiceHistory.filter(item => item.id != id);
        saveUserData();
        loadInvoiceHistory();
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