// Firebase Configuration and Initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    fetchSignInMethodsForEmail
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    deleteDoc 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCuk2FdigZdnLPCm19eQ_dt77CAkcvR0jo",
    authDomain: "digital-invoice-generato-94a76.firebaseapp.com",
    projectId: "digital-invoice-generato-94a76",
    storageBucket: "digital-invoice-generato-94a76.firebasestorage.app",
    messagingSenderId: "911597112532",
    appId: "1:911597112532:web:92ae0dc6a017863e96ff41",
    measurementId: "G-67MCFJRJWB"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// Export Firebase services
window.firebaseAuth = auth;
window.firebaseDB = db;

// Firebase Authentication Functions
window.firebaseSignUp = async (email, password, firstName, lastName) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update user profile
        await updateProfile(user, {
            displayName: `${firstName} ${lastName}`
        });
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            firstName: firstName,
            lastName: lastName,
            email: email,
            createdAt: new Date().toISOString(),
            businessInfo: {
                businessName: `${firstName} ${lastName}`,
                businessEmail: email,
                businessPhone: '',
                businessAddress: '',
                memberID: '',
                bankName: '',
                accountHolder: `${firstName} ${lastName}`,
                sortCode: '',
                accountNumber: ''
            }
        });
        
        return { success: true, user: user };
    } catch (error) {
        console.error('Firebase signup error:', error);
        
        // If user exists in Auth but not in Firestore, recreate their document
        if (error.code === 'auth/email-already-in-use') {
            try {
                console.log('User exists in Auth but may be missing from Firestore. Attempting sign-in...');
                const signInResult = await signInWithEmailAndPassword(auth, email, password);
                const existingUser = signInResult.user;
                
                // Check if user document exists in Firestore
                const userDoc = await getDoc(doc(db, 'users', existingUser.uid));
                
                if (!userDoc.exists()) {
                    console.log('User missing from Firestore, recreating document...');
                    // Recreate the user document
                    await setDoc(doc(db, 'users', existingUser.uid), {
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        createdAt: new Date().toISOString(),
                        businessInfo: {
                            businessName: `${firstName} ${lastName}`,
                            businessEmail: email,
                            businessPhone: '',
                            businessAddress: '',
                            memberID: '',
                            bankName: '',
                            accountHolder: `${firstName} ${lastName}`,
                            sortCode: '',
                            accountNumber: ''
                        }
                    });
                    
                    return { 
                        success: true, 
                        user: existingUser, 
                        message: 'Account recovered and signed in successfully!' 
                    };
                } else {
                    return { 
                        success: true, 
                        user: existingUser, 
                        message: 'Account already exists. Signed in successfully!' 
                    };
                }
                
            } catch (signInError) {
                console.error('Error during account recovery:', signInError);
                return { 
                    success: false, 
                    error: 'Account exists but password is incorrect. Please use the correct password or reset it.',
                    code: 'account-recovery-failed'
                };
            }
        }
        
        return { success: false, error: error.message, code: error.code };
    }
};

window.firebaseSignIn = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

window.firebaseSignOut = async () => {
    try {
        await firebaseSignOut(auth);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Google Sign-In with Firebase
window.firebaseGoogleSignIn = async () => {
    try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        
        // Try popup first, fallback to redirect if blocked
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Create or update user document in Firestore
        const userData = {
            firstName: user.displayName ? user.displayName.split(' ')[0] : '',
            lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
            email: user.email,
            photoURL: user.photoURL,
            lastSignIn: new Date().toISOString(),
            businessInfo: {
                businessName: user.displayName || user.email.split('@')[0],
                businessEmail: user.email,
                businessPhone: '',
                businessAddress: '',
                memberID: '',
                bankName: '',
                accountHolder: user.displayName || user.email.split('@')[0],
                sortCode: '',
                accountNumber: ''
            }
        };
        
        // Check if user document exists, if not create it
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
                ...userData,
                createdAt: new Date().toISOString()
            });
        } else {
            // Update last sign in
            await setDoc(doc(db, 'users', user.uid), {
                ...userDoc.data(),
                lastSignIn: new Date().toISOString(),
                photoURL: user.photoURL
            }, { merge: true });
        }
        
        return { success: true, user: user };
        
    } catch (error) {
        console.error('Google Sign-In Error:', error);
        
        // If popup was blocked, try redirect
        if (error.code === 'auth/popup-blocked') {
            try {
                const provider = new GoogleAuthProvider();
                provider.setCustomParameters({
                    prompt: 'select_account'
                });
                await signInWithRedirect(auth, provider);
                return { success: true, redirected: true };
            } catch (redirectError) {
                return { success: false, error: redirectError.message };
            }
        }
        
        return { success: false, error: error.message };
    }
};

// Firestore Data Functions
window.saveUserTemplate = async (userId, templateData) => {
    console.log('💾 saveUserTemplate called with parameters:');
    console.log('💾 userId:', userId, 'type:', typeof userId);
    console.log('💾 templateData:', templateData, 'type:', typeof templateData);
    
    if (!userId) {
        console.error('❌ userId is null/undefined');
        return { success: false, error: 'User ID is required' };
    }
    
    if (!templateData) {
        console.error('❌ templateData is null/undefined');
        return { success: false, error: 'Template data is required' };
    }
    
    try {
        console.log('💾 Saving template for user:', userId);
        console.log('💾 Template data:', templateData);
        
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            businessInfo: templateData,
            lastUpdated: new Date().toISOString()
        });
        
        console.log('✅ Template saved successfully');
        return { success: true };
    } catch (error) {
        console.error('❌ Error saving template:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error details:', error.message);
        
        // If document doesn't exist, try to create it
        if (error.code === 'not-found') {
            try {
                console.log('📄 User document not found, creating new one...');
                await setDoc(doc(db, 'users', userId), {
                    businessInfo: templateData,
                    createdAt: new Date().toISOString(),
                    lastUpdated: new Date().toISOString()
                });
                console.log('✅ New user document created');
                return { success: true };
            } catch (createError) {
                console.error('❌ Error creating user document:', createError);
                return { success: false, error: `Failed to create user document: ${createError.message}` };
            }
        }
        
        return { success: false, error: error.message };
    }
};

window.getUserData = async (userId) => {
    try {
        console.log('📄 Getting user data for:', userId);
        
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('📄 User data found:', userData);
            return { success: true, data: userData };
        } else {
            console.log('📄 User document does not exist');
            return { success: false, error: 'User document not found' };
        }
    } catch (error) {
        console.error('❌ Error getting user data:', error);
        console.error('❌ Error code:', error.code);
        return { success: false, error: error.message };
    }
};

window.saveInvoice = async (userId, invoiceData) => {
    try {
        const docRef = await addDoc(collection(db, 'invoices'), {
            userId: userId,
            ...invoiceData,
            createdAt: new Date().toISOString()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

window.getUserInvoices = async (userId) => {
    try {
        console.log('📋 Getting invoices for user:', userId);
        
        // First try with ordering (requires index)
        try {
            const q = query(
                collection(db, 'invoices'), 
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const invoices = [];
            querySnapshot.forEach((doc) => {
                invoices.push({ id: doc.id, ...doc.data() });
            });
            console.log('📋 Found', invoices.length, 'invoices with ordering');
            return { success: true, invoices: invoices };
            
        } catch (indexError) {
            console.log('⚠️ Index missing, trying simple query:', indexError.message);
            
            // Fallback: simple query without ordering
            const simpleQuery = query(
                collection(db, 'invoices'), 
                where('userId', '==', userId)
            );
            const querySnapshot = await getDocs(simpleQuery);
            const invoices = [];
            querySnapshot.forEach((doc) => {
                invoices.push({ id: doc.id, ...doc.data() });
            });
            
            // Sort manually by createdAt
            invoices.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA; // Descending order
            });
            
            console.log('📋 Found', invoices.length, 'invoices with simple query');
            return { success: true, invoices: invoices };
        }
        
    } catch (error) {
        console.error('❌ Error getting invoices:', error);
        return { success: false, error: error.message };
    }
};

window.deleteInvoice = async (invoiceId) => {
    try {
        await deleteDoc(doc(db, 'invoices', invoiceId));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Handle redirect results on page load
getRedirectResult(auth).then((result) => {
    if (result) {
        console.log('Google Sign-In redirect result:', result);
        // User signed in via redirect - Firebase auth state listener will handle this
    }
}).catch((error) => {
    console.error('Redirect result error:', error);
});

// Authentication State Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User signed in:', user);
        window.currentFirebaseUser = user;
        
        // Trigger login success if the main script is loaded
        if (window.handleFirebaseAuthChange) {
            window.handleFirebaseAuthChange(user);
        }
    } else {
        console.log('User signed out');
        window.currentFirebaseUser = null;
        
        if (window.handleFirebaseAuthChange) {
            window.handleFirebaseAuthChange(null);
        }
    }
});

// Debug function to check user existence
window.debugUserStatus = async (email) => {
    try {
        console.log('🔍 Checking user status for:', email);
        
        // Try to sign in to see if user exists in Auth
        try {
            const methods = await fetchSignInMethodsForEmail(auth, email);
            console.log('📧 Sign-in methods for', email, ':', methods);
            
            if (methods.length > 0) {
                console.log('⚠️ User EXISTS in Firebase Auth with methods:', methods);
                
                // Check if user document exists in Firestore
                // We need to sign in first to get the UID
                const tempPassword = prompt('Enter the password for this account to check Firestore status (this is just for debugging):');
                if (tempPassword) {
                    try {
                        const signInResult = await signInWithEmailAndPassword(auth, email, tempPassword);
                        const userDoc = await getDoc(doc(db, 'users', signInResult.user.uid));
                        
                        console.log('📄 User document in Firestore:', userDoc.exists() ? 'EXISTS' : 'MISSING');
                        console.log('🆔 User UID:', signInResult.user.uid);
                        
                        // Sign out after debugging
                        await firebaseSignOut(auth);
                        
                        return {
                            authExists: true,
                            firestoreExists: userDoc.exists(),
                            uid: signInResult.user.uid,
                            methods: methods
                        };
                    } catch (signInError) {
                        console.log('❌ Could not sign in (wrong password?):', signInError.message);
                        return {
                            authExists: true,
                            firestoreExists: 'unknown',
                            methods: methods,
                            error: 'Could not verify Firestore status - wrong password?'
                        };
                    }
                }
            } else {
                console.log('✅ User does NOT exist in Firebase Auth');
                return { authExists: false };
            }
        } catch (error) {
            console.log('❌ Error checking sign-in methods:', error.message);
            return { error: error.message };
        }
    } catch (error) {
        console.error('❌ Debug function error:', error);
        return { error: error.message };
    }
};

// Enhanced signup with better debugging
window.firebaseSignUpEnhanced = async (email, password, firstName, lastName) => {
    try {
        console.log('🔄 Starting enhanced signup for:', email);
        
        // First check if user exists using debug function
        const debugResult = await window.debugUserStatus(email);
        console.log('🔍 Debug result:', debugResult);
        
        // If user exists in Auth, handle accordingly
        if (debugResult.authExists) {
            console.log('⚠️ User exists in Firebase Auth, attempting recovery...');
            
            try {
                const signInResult = await signInWithEmailAndPassword(auth, email, password);
                const existingUser = signInResult.user;
                
                // Check Firestore document
                const userDoc = await getDoc(doc(db, 'users', existingUser.uid));
                
                if (!userDoc.exists()) {
                    console.log('🔄 Recreating missing Firestore document...');
                    await setDoc(doc(db, 'users', existingUser.uid), {
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        createdAt: new Date().toISOString(),
                        recoveredAt: new Date().toISOString(),
                        businessInfo: {
                            businessName: `${firstName} ${lastName}`,
                            businessEmail: email,
                            businessPhone: '',
                            businessAddress: '',
                            memberID: '',
                            bankName: '',
                            accountHolder: `${firstName} ${lastName}`,
                            sortCode: '',
                            accountNumber: ''
                        }
                    });
                    
                    return { 
                        success: true, 
                        user: existingUser, 
                        message: 'Account recovered! Your Firestore data has been restored.' 
                    };
                } else {
                    return { 
                        success: true, 
                        user: existingUser, 
                        message: 'Welcome back! You were already signed up.' 
                    };
                }
                
            } catch (signInError) {
                console.error('❌ Sign-in failed during recovery:', signInError);
                return { 
                    success: false, 
                    error: 'An account with this email exists but the password is incorrect. Please use the correct password.',
                    suggestion: 'Try signing in instead of signing up, or use password reset.'
                };
            }
        }
        
        // If no existing user, proceed with normal signup
        console.log('✅ No existing user found, creating new account...');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, {
            displayName: `${firstName} ${lastName}`
        });
        
        await setDoc(doc(db, 'users', user.uid), {
            firstName: firstName,
            lastName: lastName,
            email: email,
            createdAt: new Date().toISOString(),
            businessInfo: {
                businessName: `${firstName} ${lastName}`,
                businessEmail: email,
                businessPhone: '',
                businessAddress: '',
                memberID: '',
                bankName: '',
                accountHolder: `${firstName} ${lastName}`,
                sortCode: '',
                accountNumber: ''
            }
        });
        
        return { success: true, user: user, message: 'Account created successfully!' };
        
    } catch (error) {
        console.error('❌ Enhanced signup error:', error);
        return { success: false, error: error.message };
    }
};

console.log('Firebase configured and ready!');