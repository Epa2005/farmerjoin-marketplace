// Translation Fix - Ensure All Content is Translated

// Step 1: Force language initialization
const initializeTranslation = () => {
    // Set default language if not set
    if (!localStorage.getItem('language')) {
        localStorage.setItem('language', 'en');
    }
    
    // Set HTML lang attribute
    document.documentElement.lang = localStorage.getItem('language') || 'en';
    
    console.log('Translation initialized with language:', localStorage.getItem('language'));
};

// Step 2: Force translation updates
const forceTranslationUpdate = () => {
    // Dispatch language change event to update all components
    const currentLang = localStorage.getItem('language') || 'en';
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: currentLang } }));
    
    console.log('Translation update forced for language:', currentLang);
};

// Step 3: Debug translation system
const debugTranslation = () => {
    const lang = localStorage.getItem('language') || 'en';
    console.log('Current language:', lang);
    console.log('Available translations:', Object.keys(translations));
    console.log('Translation keys for current lang:', Object.keys(translations[lang] || {}));
};

// Step 4: Auto-translate all static text
const autoTranslateStaticText = () => {
    const lang = localStorage.getItem('language') || 'en';
    
    // Common static text that might not be translated
    const staticTextMap = {
        'Login': translations[lang]?.login || 'Login',
        'Register': translations[lang]?.register || 'Register',
        'Home': translations[lang]?.home || 'Home',
        'Dashboard': translations[lang]?.dashboard || 'Dashboard',
        'Products': translations[lang]?.products || 'Products',
        'Orders': translations[lang]?.orders || 'Orders',
        'Profile': translations[lang]?.profile || 'Profile',
        'Logout': translations[lang]?.logout || 'Logout',
        
        // Truth words
        'Integrity': translations[lang]?.integrity || 'Integrity',
        'Quality': translations[lang]?.quality || 'Quality',
        'Service': translations[lang]?.service || 'Service',
        'Community': translations[lang]?.community || 'Community',
        'Trust': translations[lang]?.trust || 'Trust',
        'Honesty': translations[lang]?.honesty || 'Honesty',
        'Transparency': translations[lang]?.transparency || 'Transparency',
        'Fairness': translations[lang]?.fairness || 'Fairness'
    };
    
    // Replace static text in DOM
    Object.entries(staticTextMap).forEach(([englishText, translation]) => {
        const elements = document.querySelectorAll('*');
        elements.forEach(element => {
            if (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3) {
                const textContent = element.childNodes[0].textContent;
                if (textContent === englishText) {
                    element.childNodes[0].textContent = translation;
                }
            } else if (element.textContent === englishText) {
                element.textContent = translation;
            }
        });
    });
};

// Step 5: Complete translation system initialization
const initializeCompleteTranslation = () => {
    initializeTranslation();
    forceTranslationUpdate();
    debugTranslation();
    
    // Auto-translate after page load
    setTimeout(() => {
        autoTranslateStaticText();
        console.log('Auto-translation completed');
    }, 1000);
};

// Initialize immediately
initializeCompleteTranslation();

// Export for manual use
export {
    initializeTranslation,
    forceTranslationUpdate,
    debugTranslation,
    autoTranslateStaticText
};
