# FarmerJoin Mobile App

A React Native mobile application for the FarmerJoin marketplace, allowing users to access the platform via smartphone.

## Features

- **User Authentication**: Login and registration screens
- **Product Browsing**: View and search for agricultural products
- **Shopping Cart**: Add products to cart and manage quantities
- **User Profile**: View and manage user information
- **Ban/Suspension Enforcement**: System-wide access control for banned/suspended users
- **Bottom Navigation**: Easy navigation between Home, Products, Cart, and Profile

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development) or Xcode (for iOS development)
- A physical device or emulator/simulator

## Installation

1. **Navigate to the mobile folder:**
   ```bash
   cd mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Update API Base URL:**
   
   Open `src/api.js` and update the `baseURL` to your computer's IP address:
   ```javascript
   const API = axios.create({
     baseURL: 'http://YOUR_COMPUTER_IP:5000', // Replace with your IP
   });
   ```
   
   To find your computer's IP:
   - Windows: Open Command Prompt and type `ipconfig`
   - Mac/Linux: Open Terminal and type `ifconfig`

4. **Start the backend server:**
   
   Make sure your backend server is running on port 5000 before starting the mobile app.

## Running the App

### Using Expo Go (Recommended for Testing)

1. **Start the development server:**
   ```bash
   npm start
   ```

2. **Install Expo Go on your mobile device:**
   - Android: Download from Google Play Store
   - iOS: Download from App Store

3. **Scan the QR code:**
   - The Expo CLI will display a QR code
   - Open Expo Go on your device and scan the QR code
   - The app will load on your device

### Using Android Emulator

1. **Start Android Studio and create an emulator**

2. **Run the app:**
   ```bash
   npm run android
   ```

### Using iOS Simulator

1. **Start the iOS Simulator**

2. **Run the app:**
   ```bash
   npm run ios
   ```

### Using Web Browser

For testing in a web browser:
```bash
npm run web
```

## Project Structure

```
mobile/
├── App.js                 # Main app entry point with navigation
├── package.json           # Dependencies and scripts
├── app.json              # Expo configuration
├── babel.config.js       # Babel configuration
└── src/
    ├── api.js            # API integration with backend
    └── screens/
        ├── LoginScreen.jsx       # Login screen
        ├── RegisterScreen.jsx    # Registration screen
        ├── HomeScreen.jsx        # Home screen with featured products
        ├── ProductsScreen.jsx    # Product browsing and search
        ├── CartScreen.jsx        # Shopping cart
        └── ProfileScreen.jsx     # User profile and settings
```

## Configuration

### API Configuration

Update the API base URL in `src/api.js`:
```javascript
const API = axios.create({
  baseURL: 'http://YOUR_COMPUTER_IP:5000',
});
```

### App Configuration

Modify app settings in `app.json`:
- App name
- Package name (Android)
- Bundle identifier (iOS)
- Icons and splash screens

## Authentication

The app uses JWT tokens for authentication. Tokens are stored using AsyncStorage and automatically included in API requests.

### Ban/Suspension Enforcement

The mobile app includes system-wide ban/suspension enforcement:
- Backend checks user status on every authenticated request
- Frontend displays alert message for banned/suspended users
- Users are logged out and redirected to login if banned/suspended

## Screens

### Login Screen
- Email and password authentication
- Token storage in AsyncStorage
- Error handling and validation

### Register Screen
- User registration (buyer role by default)
- Password confirmation
- Form validation

### Home Screen
- Featured products carousel
- Category grid
- Welcome message

### Products Screen
- Product listing with images
- Search functionality
- Add to cart functionality

### Cart Screen
- View cart items
- Quantity management
- Remove items
- Total price calculation
- Checkout button (placeholder)

### Profile Screen
- User information display
- Menu options (Orders, Addresses, etc.)
- Logout functionality

## Building for Production

### Android APK

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure EAS:**
   ```bash
   eas build:configure
   ```

4. **Build APK:**
   ```bash
   eas build --platform android
   ```

### iOS IPA

1. **Build IPA:**
   ```bash
   eas build --platform ios
   ```

## Troubleshooting

### API Connection Issues
- Ensure your backend server is running
- Check that your computer's IP address is correct in `src/api.js`
- Make sure your device and computer are on the same network
- Disable VPN if enabled

### Metro Bundler Issues
- Clear cache: `npm start -- --clear`
- Reset cache: `npx expo start -c`

### Dependency Issues
- Delete node_modules folder
- Delete package-lock.json
- Run `npm install` again

## Development

### Adding New Screens

1. Create a new screen file in `src/screens/`
2. Import the screen in `App.js`
3. Add the screen to the navigation stack

### API Integration

Use the configured API instance in `src/api.js`:
```javascript
import API from '../api';

const response = await API.get('/endpoint');
```

## Contributing

To contribute to the mobile app:
1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is part of the FarmerJoin marketplace platform.
