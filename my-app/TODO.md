# TODO - Remove i18n (Language) from the application

## Plan Status: IN PROGRESS

### Files to UPDATE (replace translations with hardcoded English text):
- [x] 1. src/components/Navbar.jsx - Remove language switcher UI and replace translations
- [x] 2. src/components/Footer.jsx - Replace translations with hardcoded text
- [ ] 3. src/pages/Home.jsx - Replace translations with hardcoded text
- [ ] 4. src/pages/Login.jsx - Replace translations with hardcoded text
- [ ] 5. src/pages/Register.jsx - Replace translations with hardcoded text

### Files to UPDATE (remove unused import only):
- [ ] 6. src/pages/Products.jsx - Remove unused `useTranslation` import

### Files to DELETE:
- [ ] 7. src/i18n.js - i18n configuration file
- [ ] 8. src/locales/ - Entire folder

### Files that don't need changes (verified):
- src/pages/Dashboard.jsx - no translations
- src/pages/AddProduct.jsx - no translations
- src/App.jsx - doesn't import i18n
- src/main.jsx - doesn't import i18n
