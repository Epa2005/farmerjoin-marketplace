/**
 * FarmerJoin System Knowledge Base
 * ------------------------------------------------------------------
 * Because no external LLM/Ollama is available in production, the AI
 * Assistant answers every question from this built-in knowledge base
 * about the FarmerJoin marketplace and about agriculture. Each topic
 * carries weighted keywords used by the intent engine plus a `message`
 * renderer, which may tailor its answer using `ctx.role` (buyer,
 * farmer, cooperative, admin, sub_admin, null for guests).
 */

const topics = [
  {
    id: 'greeting',
    title: 'Greetings',
    keywords: ['hello', 'hi', 'hey', 'bonjour', 'muraho', 'witwa', 'bite', 'sasa', 'salut', 'good morning', 'good afternoon', 'good evening'],
    message: () =>
      `Welcome to the FarmerJoin Assistant! I am the built-in assistant of this marketplace and I know FarmerJoin well.\n\nI can help you with:\n\n• Creating an account and logging in\n• Buying, selling and managing products\n• Orders, checkout and mobile money payment\n• Delivery, reviews and messaging farmers\n• Your dashboard depending on your role\n• Agriculture topics, seasons, crops and the AgriAI tools\n\nJust ask me a question, e.g. "How do I register?" or "How do I add a product as a farmer?"`,
    followUps: ['How do I register?', 'How do I add a product as a farmer?', 'What payment methods are accepted?', 'How do I reset my password?']
  },
  {
    id: 'thanks',
    title: 'Thanks',
    keywords: ['thank', 'thanks', 'thx', 'merci', 'murakoze', 'uzima', 'appreciate', 'well done', 'great'],
    message: () =>
      `You are very welcome! If you need anything else about FarmerJoin — registration, selling, orders, payments, or farming guidance — just type your question below.`,
    followUps: ['How do I add a product?', 'How do I track an order?', 'Tell me about farming seasons in Rwanda']
  },
  {
    id: 'whoAreYou',
    title: 'Who you are',
    keywords: ['who are you', 'what are you', 'your name', 'nkora iki', 'uri nde', 'qui es', 'what can you do', 'what do you do'],
    message: () =>
      `I am the **FarmerJoin Assistant** — a built-in AI that lives inside this marketplace.\n\nUnlike an external chatbot, I am based on FarmerJoin itself: I know every page, every role, and how the whole system works, so I can answer correctly about:\n\n• Registration, login and password reset\n• Buyer, farmer, cooperative, admin and sub-admin roles\n• Products, orders, cart, checkout and mobile money\n• Delivery, reviews, messaging and profile photos\n• Security and privacy of your data\n• Agriculture, Rwanda seasons, crops and the AgriAI tools`,
    followUps: ['What is FarmerJoin?', 'How do I register?', 'What can I do as a buyer?']
  },
  {
    id: 'help',
    title: 'Help / capabilities',
    keywords: ['help', 'assist', 'support me', 'ufasha', 'tubafasha', 'mbufashije', 'gufasha', 'what can you help', 'what topics', 'menu', 'options', 'capabilities', 'what do you know'],
    message: (ctx) =>
      `Here is what I can help you with on FarmerJoin:\n\n**Accounts** — Register, login, forgot password, account roles.\n**Buying** — Browse products, cart, checkout, mobile money, orders, delivery.\n**Selling** — Add/edit products, farm profile, farmer details, pricing.\n**Dashboards** — What ${ctx.role || 'you'} can do on each dashboard.\n**Profile** — Photo upload, edit profile, reviews, messaging.\n**Admin** — User management, moderation, bans, reports.\n**Agriculture** — Crops, planting seasons A/B/C, weather, AgriAI crop scan.\n\nType a question like:\n• "How do I add a product?"\n• "Where is my order?"\n• "How do I reset my password?"`,
    followUps: ['How do I register?', 'How do I add a product?', 'How does delivery work?', 'Tell me about farming seasons']
  },
  {
    id: 'about',
    title: 'About the platform',
    keywords: ['what is farmerjoin', 'about the platform', 'about this app', 'about this system', 'what is this website', 'tell me about farmerjoin', 'what does farmerjoin do', 'who can use farmerjoin', 'who uses farmerjoin', 'how does farmerjoin work', 'what is farmerjoin used for', 'ubuhinzi bwa farmerjoin', 'farmerjoin ni iki'],
    message: () =>
      `**About FarmerJoin**\n\nFarmerJoin is an **agricultural marketplace** that connects farmers directly with buyers in Rwanda and the region.\n\n**Who uses it:**\n• **Farmers** — list products, manage their farm profile, receive orders.\n• **Buyers** — browse products, order, pay with mobile money, review quality.\n• **Cooperatives** — manage member farmers and bulk listings.\n• **Admins / Sub-admins** — manage users, moderate content, view reports.\n\n**Main features:**\n• Direct farmer-to-buyer connections (no middlemen)\n• Product catalogue by category (vegetables, fruits, grains, livestock)\n• Cart + checkout with **mobile money (MTN, Airtel)**, cash on delivery and cards\n• Order tracking, reviews and ratings\n• Farmer profiles with location (province, district, sector)\n• Multilingual interface — English, Kinyarwanda, French\n• Built-in AI assistant (me) and AgriAI tools (crop scan, weather)\n\n**Getting started:**\n1. Create an account (Buyer or Farmer)\n2. Farmers complete their farmer details (farm name, location)\n3. Browse products or list your produce\n4. Start trading!`,
    followUps: ['How do I register?', 'What payment methods are accepted?', 'What can farmers sell?']
  },
  {
    id: 'register',
    title: 'Registration',
    keywords: ['register', 'create account', 'sign up', 'signup', 'new account', 'make account', 'open account', 'kwiyandikisha', 'andika', 'create an account', 'create a new account', 'account create', 'inscription', 'créer un compte', 'sinscrire', 's\'inscrire', 'iyandikishe'],
    message: (ctx) =>
      `**Creating an account on FarmerJoin**\n\n1. Open the **Register** page (button in the top navigation).\n2. Choose your account type: **Buyer** or **Farmer**.\n3. Fill in the form:\n   • **Full name** — 2 to 100 characters (letters, spaces, hyphens, dots, apostrophes).\n   • **Email** — a valid address, e.g. name@example.com.\n   • **Phone** — with country code, e.g. +2507XXXXXXXX (International format).\n   • **Password** — 8 to 72 characters with at least one uppercase letter, one lowercase letter, one number and one special character (e.g. ! @ #).\n4. Click **Create Account**.\n\n**What happens next:**\n• **Farmers** are taken to the **Farmer Details** page to add their farm name, province, district, sector and bio.\n• **Buyers** are taken to **Login**, then to the **Buyer Dashboard**.\n\n**Common messages:**\n• *"Email already registered"* — that account already exists. Use **Forgot password?** on the Login page.\n• *"Please fix the highlighted fields"* — check the red fields and correct them.\n\n⚠️ Emails are stored **lowercase**, so MyName@x.com becomes myname@x.com automatically.`,
    followUps: ['Why is my password rejected?', 'I see "Email already registered", what do I do?', 'How do I log in after registering?']
  },
  {
    id: 'login',
    title: 'Login',
    keywords: ['login', 'log in', 'sign in', 'signin', 'kwinjira', 'connexion', 'connect', 'access my account', 'enter my account', 'loging', 'cant login', 'connecter', 'se connecter', 'acceder', 'accéder'],
    message: () =>
      `**Logging in on FarmerJoin**\n\n• Use the **email** and **password** you registered with.\n• Email matching is **case-insensitive** (MYname@x.com = myname@x.com).\n• Passwords are verified securely with bcrypt hashes.\n\n**If you see "Invalid email or password":**\n• Double-check the email (case does not matter) and the password.\n• Try the **Forgot password?** link to set a new password.\n\n**If the login "does not work":**\n• Clear your browser cache/cookies and reload.\n• Make sure you are on the right environment (production url.onrender.com).\n\nAfter login you are taken to the correct dashboard for your role (Buyer Dashboard, Farmer Dashboard, Admin Dashboard...).`,
    followUps: ['I forgot my password', 'Why do I get "Invalid email or password"?', 'Where does login take me?']
  },
  {
    id: 'forgotPassword',
    title: 'Forgot / reset password',
    keywords: ['forgot password', 'forget password', 'reset password', 'change password', 'new password', 'lost password', 'ibanga nawe', 'ijambo ryibanga', 'password reset', 'mot de passe', 'reset', 'forgot', 'my password', 'change my password', 'oublie', 'reinitialiser', 'réinitialiser'],
    message: () =>
      `**Resetting your password**\n\n1. On the **Login** page click **"Forgot password?"**.\n2. Enter your registered **email** and click **Verify Email**.\n3. Set a **new password**: 8 to 72 characters with at least one uppercase letter, one lowercase letter, one number and one special character.\n4. Confirm it and click **Reset Password**.\n5. You will be redirected to **Login** — sign in with your new password.\n\n**Tips:**\n• If you see *"No account found with this email"*, that email is not registered.\n• The reset keeps your role (farmer/buyer/cooperative) unchanged.`,
    followUps: ['Why is my new password rejected?', 'How do I log in after resetting?', 'How do I create a strong password?']
  },
  {
    id: 'roles',
    title: 'Account roles',
    keywords: ['role', 'account type', 'buyer', 'farmer', 'cooperative', 'sub admin', 'subadmin', 'admin role', 'different roles', 'who are the users', 'types of accounts', 'umuhinzi', 'umucuruzi', 'roles'],
    message: (ctx) =>
      `**Account roles on FarmerJoin**\n\n• **Buyer** — browses products, orders, pays, reviews. Dashboard: **Buyer Dashboard**.\n• **Farmer** — lists products, manages the farm profile and orders. Dashboard: **Farmer Dashboard** (Dashboard page).\n• **Cooperative** — manages multiple farmers and bulk listings.\n• **Sub-admin** — manages users within an assigned location (province/district).\n• **Admin** — full system control: users, moderation, reports.\n\n${ctx.role ? `You are currently signed in as **${ctx.role}**.` : 'You are currently browsing as a guest — create an account to unlock your role dashboards.'}\n\nAsk me "What can a buyer do?" or "What can I do as a farmer?" for details.`,
    followUps: ['What can a buyer do?', 'What can a farmer do?', 'What can an admin do?']
  },
  {
    id: 'buyerGuide',
    title: 'Buyer guide',
    keywords: ['what can a buyer', 'buyer do', 'as a buyer', 'buyer guide', 'buyer dashboard', 'buyer how', 'umucuruzi akora', 'how to buy', 'buy products', 'purchase', 'acheteur', 'acheter', 'buy', 'kugura', 'gura', 'kubona', 'find a farmer', 'find farmers', 'buy from a farmer', 'buy from farmers', 'search for a farmer', 'buy without registering', 'buy without an account', 'buy as a guest', 'as a guest', 'without registering', 'without an account'],
    message: (ctx) =>
      `**Buyer guide on FarmerJoin**\n\nOn your **Buyer Dashboard** you can:\n• Browse and search products by category\n• Open a product to see details, farmer and price\n• Add products to the **cart**\n• **Checkout** and pay (mobile money MTN/Airtel, cash on delivery, card)\n• Track your **orders** and their status\n• Save favorite farmers and leave **reviews/ratings**\n• Chat/message farmers directly\n\n**How to order:**\n1. Open a product → set quantity → **Add to cart**\n2. Open the cart → **Checkout**\n3. Confirm delivery address/phone and pay\n4. Follow the order in the **Orders** page\n\n${ctx.role === 'buyer' ? 'You are signed in as a buyer, so open **Buyer Dashboard** to start.' : 'To get these features, register/login as a Buyer.'}`,
    followUps: ['How do I pay?', 'How do I track my order?', 'How do I leave a review?']
  },
  {
    id: 'farmerGuide',
    title: 'Farmer / selling guide',
    keywords: ['what can a farmer', 'farmer do', 'as a farmer', 'farmer guide', 'farmer dashboard', 'sell my', 'how to sell', 'selling', 'umuhinzi akora', 'list my products', 'fermier', 'vendeur', 'vendre', 'ajouter un produit', 'add a product as', 'add a product as farmer', 'add a product as a farmer', 'vendre un produit', 'producteur', 'umuhinzi'],
    message: (ctx) =>
      `**Farmer & selling guide on FarmerJoin**\n\nOn the **Farmer Dashboard** (the main Dashboard) you can:\n• Add and manage **products** with photos, price, quantity and category\n• View orders for your products and update their status\n• See **analytics** on your sales\n• Manage your **farm profile** (farm name, location, bio)\n\n**After registration:** you are taken to **Farmer Details** to enter your farm name, province, district and sector. This completes your profile.\n\n**To add a product:**\n1. On the dashboard open **Add Product**\n2. Enter name, category, price, quantity and description\n3. Upload up to a few clear photos\n4. Save — your product appears in the catalogue\n\n${ctx.role === 'farmer' ? 'You are signed in as a farmer — open the **Dashboard** to get started.' : 'Register as a Farmer to sell. If you already have an account, log in.'}`,
    followUps: ['How do I add a product?', 'How do I change my farm profile?', 'How do I see my orders?']
  },
  {
    id: 'cooperativeGuide',
    title: 'Cooperative guide',
    keywords: ['what can a cooperative', 'cooperative do', 'as a cooperative', 'cooperative dashboard', 'koperative', 'coop', 'cooperative guide'],
    message: (ctx) =>
      `**Cooperative guide on FarmerJoin**\n\nAs a **Cooperative** you can:\n• Manage multiple member farmers\n• Create **bulk product listings**\n• Do collective marketing and set cooperative branding/pricing\n• Manage orders centrally and share revenue\n\nYour interface is the **Cooperative Dashboard**, which works like the farmer dashboard but for the whole cooperative.`,
    followUps: ['How do I add products for my cooperative?', 'How does revenue sharing work?']
  },
  {
    id: 'adminGuide',
    title: 'Admin guide',
    keywords: ['what can an admin', 'admin do', 'as an admin', 'admin dashboard', 'administrator', 'admin guide', 'manage users'],
    message: (ctx) =>
      `**Admin guide on FarmerJoin**\n\nThe **Admin Dashboard** gives you full system control:\n• **Manage all users** — view, ban, suspend or activate accounts\n• **User Management** page with search and role filtering\n• **Moderate content** — products, reviews, disputes\n• View **reports and analytics** on activity\n• Online status of users\n\n**Notes:**\n• Banned users are blocked from signing in.\n• Sub-admins are assigned to a specific province/district.\n\n${ctx.role === 'admin' ? 'You are signed in as admin — open **Admin Dashboard**.' : 'This guide is for administrators.'}`,
    followUps: ['How do I ban a user?', 'What is a sub-admin?', 'How do I see reports?']
  },
  {
    id: 'products',
    title: 'Products & categories',
    keywords: ['product', 'products', 'category', 'categories', 'list an item', 'listings', 'add a product', 'add product', 'create product', 'good to sell', 'ibicuruzwa', 'ibicuruzwa byiza', 'ibyatsi', 'vegetables', 'fruits', 'maize', 'beans', 'potatoes', 'sale', 'items', 'produit', 'produits', 'categorie', 'catégorie'],
    message: (ctx) =>
      `**Products on FarmerJoin**\n\n**Categories available:**\n• **Vegetables** — tomatoes, cabbage, carrots, onions, peppers, spinach...\n• **Fruits** — bananas, mangoes, pineapples, papayas, avocadoes...\n• **Grains** — rice, maize, beans, sorghum, millet...\n• **Livestock** — cattle, goats, sheep, poultry, pigs...\n\n**To add a product (farmers):**\n1. Go to your **Farmer Dashboard**\n2. Open **Add Product**\n3. Fill in name, category, price, quantity, description\n4. Add clear photos and save\n\n**Pricing tips:**\n• Research current market prices\n• Include production, transport and packaging costs\n• Offer bulk discounts for larger orders\n• Update quantity so availability is accurate\n\n**Quality:**\n• Premium / Standard / Economy grades\n• Rwanda Standards Board certification is a plus\n\n${ctx.role && ctx.role !== 'farmer' ? 'Note: only farmers (and cooperatives) can list products.' : ''}`,
    followUps: ['How much should I charge?', 'How do I add photos?', 'How do I edit a product?']
  },
  {
    id: 'editProduct',
    title: 'Edit / delete product',
    keywords: ['edit product', 'update product', 'delete product', 'remove product', 'change price', 'change photo', 'edit price', 'delete my product', 'remove my product', 'hinduza igicuruzwa'],
    message: () =>
      `**Editing or removing a product**\n\n1. Open your **Farmer Dashboard**\n2. Find the product (your products list) and open it\n3. Use **Edit** to change name, category, price, quantity, description or photos\n4. Use **Delete/Remove** if you no longer want to sell it\n\nPrices and stock should be kept up to date so buyers always see correct availability.`,
    followUps: ['How do I update my stock?', 'How do I add photos to a product?']
  },
  {
    id: 'cart',
    title: 'Cart',
    keywords: ['cart', 'basket', 'add to cart', 'basketball', 'shopping cart', 'shopping bag', 'shopping bags', 'ibiri mu gikorwa', 'remove from cart', 'cart page'],
    message: () =>
      `**Your cart on FarmerJoin**\n\n• Open a product and click **Add to Cart**\n• The cart holds your selected items, quantities and total price\n• You can change quantities or remove items before checkout\n\n**To order:**\n1. Open the **Cart** page\n2. Review the items and total\n3. Click **Checkout**\n4. Confirm your details and **pay** (mobile money, cash on delivery, card)`,
    followUps: ['How do I checkout and pay?', 'What payment methods are accepted?', 'How is delivery calculated?']
  },
  {
    id: 'checkout',
    title: 'Checkout',
    keywords: ['checkout', 'check out', 'place order', 'place order', 'confirm order', 'buy now', 'order now', 'gusaba', 'kwishyura', 'submit order'],
    message: () =>
      `**Checkout on FarmerJoin**\n\n1. Open the **Cart** and click **Checkout**\n2. Confirm your delivery details (location/address and phone)\n3. Choose a **payment method**:\n   • Mobile money (MTN Mobile Money, Airtel Money)\n   • Cash on delivery\n   • Card / bank\n4. Confirm and place the order\n\nAfter ordering you will see an **Order Success** confirmation, and the farmer is notified.`,
    followUps: ['How does mobile money work?', 'How do I track my order?', 'How do I cancel an order?']
  },
  {
    id: 'payment',
    title: 'Payment & mobile money',
    keywords: ['pay', 'payment', 'mobile money', 'mtn', 'airtel', 'mtn momo', 'airtel money', 'momo', 'money', 'kwishyura', 'dette', 'invoice', 'bill', 'bills', 'receipt', 'proof of payment', 'payment proof', 'cash on delivery', 'paiement', 'payer', 'paiement mobile', 'how to pay', 'pay for my order'],
    message: () =>
      `**Payments on FarmerJoin**\n\nAccepted methods:\n• **Mobile money** — MTN Mobile Money, Airtel Money (+250 numbers)\n• **Cash on delivery** — pay when the order arrives\n• **Card / bank transfer** for online payments\n\n**Mobile money tips:**\n• Make sure your MTN/Airtel number is active and has enough balance\n• Confirm the amounts on your phone when prompted\n• Keep the confirmation SMS as proof\n\n**Security:**\n• Transactions use the secure payment flow built into the app\n• Never share your PIN with anyone`,
    followUps: ['Why did my mobile money fail?', 'How do refunds work?']
  },
  {
    id: 'orders',
    title: 'Orders & tracking',
    keywords: ['order', 'orders', 'track', 'tracking', 'delivery status', 'where is my order', 'order list', 'status', 'isuda', 'command', 'commande', 'commandes', 'suivre', 'suivi', 'mon order', 'cancel order', 'cancel my order', 'cancel an order', 'cancel', 'cancel my order', 'track my order', 'where is my order', 'retourner la commande', 'annuler'],
    message: () =>
      `**Orders on FarmerJoin**\n\n• Buyers see their orders in the **Orders** page / buyer dashboard.\n• Farmers see orders for their products in the **Farmer Dashboard**.s\n\n**Typical order flow:**\n1. Placed (payment confirmed)\n2. Farmer prepares the products\n3. Delivery arranged / picked up\n4. Completed + reviewed\n\n**To track:** open the **Orders** page and check the current status. If something looks wrong, message the farmer directly or contact support.`,
    followUps: ['How do I cancel an order?', 'How do refunds work?', 'How do I message the farmer?']
  },
  {
    id: 'refunds',
    title: 'Refunds & returns',
    keywords: ['refund', 'refunds', 'refunded', 'get my money back', 'i want my money back', 'money back', 'my money', 'return money', 'reimbursement', 'reimburse', 'return a product', 'return an order', 'return my order', 'return items', 'partial refund', 'full refund', 'remboursement', 'rembourser', 'remboursement de commande', 'gukuzura', 'kusubiza amafaranga', 'retour'],
    message: (ctx) =>
      `**Refunds on FarmerJoin**\n\n• Refunds depend on the order status and the payment method used.\n• **Mobile money / card payments** are refunded back to the same account when the order is cancelled or the products were not delivered.\n• **Cash on delivery** orders have no money to refund — just confirm you did not receive delivery.\n\n**To request a refund:**\n1. Open the **Orders** page and find the order\n2. Cancel the order (if allowed) or contact the farmer/seller\n3. For unresolved issues, contact **support** with your order number\n\nRefund processing normally takes 1–5 business days once approved.`,
    followUps: ['How do I cancel an order?', 'How do I contact support?', 'Why did my refund take long?']
  },
  {
    id: 'delivery',
    title: 'Delivery',
    keywords: ['delivery', 'deliver', 'shipping', 'pickup', 'pick up', 'transport', 'utwari', 'kalite', 'driver', 'location delivery', 'livraison', 'remise', 'delivery charges', 'delivery cost', 'delivery fee', 'shipping cost', 'how much for delivery', 'delivery price'],
    message: () =>
      `**Delivery on FarmerJoin**\n\nOptions typically available:\n• **Home delivery** — products brought to you\n• **Pickup point / market delivery** — you collect at an agreed point\n\n**Timeframes:** same day, next day or 2-3 days depending on distance.\n\n**Cost:** based on distance and order size. Buyers usually confirm delivery details at checkout.\n\n**Coverage:** all provinces of Rwanda.\n\n💡 Tip: choosing a pickup point often lowers the delivery cost.`,
    followUps: ['How much does delivery cost?', 'Where can I pick up my order?']
  },
  {
    id: 'reviews',
    title: 'Reviews & ratings',
    keywords: ['review', 'reviews', 'rating', 'rate', 'feedback', 'stars', 'comment about', 'kunegura', 'evaluation', 'delete my review', 'remove my review', 'edit my review', 'supprimer mon avis'],
    message: () =>
      `**Reviews and ratings on FarmerJoin**\n\n• After an order you can leave a review and a star rating for the farmer/product\n• Reviews help other buyers choose quality suppliers\n• Farmers see feedback to improve quality\n\n**To review:**\n1. Go to your recent order\n2. Choose the star rating\n3. Write a short comment and submit`,
    followUps: ['How do I rate a farmer?', 'Can I delete a review?']
  },
  {
    id: 'messaging',
    title: 'Messaging / contact farmers',
    keywords: ['message', 'chat', 'contact farmer', 'talk to farmer', 'email farmer', 'call farmer', 'communication', 'nohereza', 'obutumwa'],
    message: () =>
      `**Messaging farmers on FarmerJoin**\n\n• Open the **farmer profile** or a product and use the contact/message option\n• Ask about availability, quality, delivery and prices before ordering\n• Farmers' contact phone and farm location are shown on the profile\n\nKeep communication respectful and inside the platform so we can protect both parties.`,
    followUps: ['How do I find a farmer\'s location?', 'How do I ask about a product?']
  },
  {
    id: 'profilePhoto',
    title: 'Profile photo',
    keywords: ['profile photo', 'profile picture', 'photo', 'picture', 'upload photo', 'change photo', 'avatar', 'ifoto', 'update photo', 'image shows wrong'],
    message: () =>
      `**Profile photo on FarmerJoin**\n\n• You can upload a photo from your **Edit Profile** page\n• The photo appears on your profile and in the navigation\n\n**If your photo is not showing correctly:**\n1. Re-upload the photo and save\n2. Refresh the page so the new link loads\n3. If a default (icon) still shows, the stored link may not have loaded — try re-uploading\n\n**Accepted:** JPG, PNG, GIF, WEBP — up to 5 MB.`,
    followUps: ['Why is my photo not showing?', 'How do I edit my profile?']
  },
  {
    id: 'editProfile',
    title: 'Edit profile / settings',
    keywords: ['edit profile', 'update profile', 'profile settings', 'change name', 'change email', 'change my email', 'update my email', 'change email address', 'change phone', 'change my phone', 'update my phone', 'update my phone number', 'my phone number', 'phone number', 'contact number', 'my account info', 'settings', 'amakuru yanjye', 'edit my info', 'change my information', 'update my information'],
    message: () =>
      `**Editing your profile**\n\n1. Open **Edit Profile** (from your account menu)\n2. Update your name, phone, location or upload a photo\n3. Save your changes\n\n⚠️ Your **email** stays the same address you registered with (it identifies your account). To change the login password use **Forgot password?** on the Login page.`,
    followUps: ['How do I change my password?', 'How do I change my photo?']
  },
  {
    id: 'deleteAccount',
    title: 'Delete / close account',
    keywords: ['delete my account', 'delete account', 'delete my profile', 'erase my account', 'close my account', 'close account', 'remove my account', 'cancel my account', 'destroy my account', 'remove my profile', 'stop using my account', 'delete all my data', 'supprimer mon compte', 'supprimer compte', 'fermer mon compte', 'souspression du compte', 'gusiba konti', 'gusiba'],
    message: () =>
      `**Deleting / closing your account on FarmerJoin**\n\nDeletion is handled carefully so nobody is stranded mid-order:\n1. If you have **active orders or products**, resolve them first (complete or cancel the orders, remove or finish your listings).\n2. Contact **support** through the Help page / footer contact info and ask to close your account — a support member deletes it securely on our side.\n3. Your personal data is removed; transaction records required by law may be kept anonymous.\n\n**Alternatives:**\n• Prefer to keep selling/buying? You can just **log out** or **edit your profile** instead.\n• If the reason is billing or quality, support can help correct it.\n\nAccount closure is permanent and cannot be undone.`,
    followUps: ['How do I contact support?', 'What happens to my data?', 'Can I come back after deleting?']
  },
  {
    id: 'subscription',
    title: 'Subscription boxes',
    keywords: ['subscription', 'subscription box', 'weekly box', 'subscribe', 'box', 'regular delivery', 'weekly delivery', 'abonnement'],
    message: () =>
      `**Subscription Boxes on FarmerJoin**\n\nA subscription gives you a **regular (e.g. weekly) box of fresh products** on a recurring schedule.\n\n• Visit the **Subscription Boxes** page\n• Choose a box size/frequency that fits you\n• Your box arrives on the agreed schedule\n\nThis is great for restaurants, shops or families that need steady supply.`,
    followUps: ['How much does a subscription cost?', 'What is inside a box?']
  },
  {
    id: 'language',
    title: 'Languages',
    keywords: ['language', 'english', 'kinyarwanda', 'french', 'translate', 'change language', 'urunimi', 'francais', 'indimi'],
    message: () =>
      `**Languages on FarmerJoin**\n\nThe platform supports:\n• **English**\n• **Kinyarwanda**\n• **French**\n\nUse the language switcher in the app header to change the interface language. The assistant also understands and answers questions written in Kinyarwanda or French.`,
    followUps: ['How do I switch to Kinyarwanda?', 'Ask me something in French']
  },
  {
    id: 'security',
    title: 'Security & privacy',
    keywords: ['security', 'secure', 'safe', 'privacy', 'password save', 'jwt', 'token', 'my data', 'data safe', 'encryption', 'umutekano', 'protected', 'hacking', 'phishing'],
    message: () =>
      `**Security on FarmerJoin**\n\n• Passwords are never stored in plain text — only **bcrypt hashes**.\n• Login issues a **JWT token** that expires automatically (default 7 days).\n• Your **email** is normalized (lowercase) to avoid duplicates.\n• Messages, orders and payments are handled server-side with parameterized queries (no SQL injection).\n\n**Best practices for you:**\n• Use a strong password (8+ chars with uppercase, lowercase, number, special)\n• Don't share your password or payment PIN\n• Log out on shared devices\n• If you suspect a problem, change your password via **Forgot password?**`,
    followUps: ['How do I make my password stronger?', 'What do you do with my email?']
  },
  {
    id: 'dataPrivacy',
    title: 'Data & database',
    keywords: ['database', 'where is my data', 'data stored', 'gdpr', 'backup', 'sql', 'postgres', 'mysql', 'storage', 'ibondeko', 'profile stored'],
    message: () =>
      `**Your data on FarmerJoin**\n\n• Accounts, profiles and products live in the **database** (PostgreSQL on the production server).\n• Profile photos are stored in object storage and linked to your account.\n• Orders link buyers to the products and farmers they ordered from.\n\n**Sensible by design:**\n• Session/token-based authentication\n• Server validation for registration and login\n• Banned/suspended accounts are blocked from signing in\n\nIf you want your data handled differently, contact support and we will help.`,
    followUps: ['How is my email used?', 'How do you protect payments?']
  },
  {
    id: 'support',
    title: 'Support & contacts',
    keywords: ['support', 'contact', 'helpdesk', 'customer service', 'complain', 'problem', 'issue', 'bug', 'not working', 'error', 'akazi', 'vubaka', 'report a problem', 'contact us', 'probleme', 'problème', 'aider', 'help me'],
    message: () =>
      `**Getting support on FarmerJoin**\n\n• Use **Help** in the navigation for the help page and FAQ\n• This assistant can answer most questions right here\n• For account/service issues: use the contact info on the platform (support email/phone in the Help and Footer)\n\n**Common quick fixes:**\n• *Can't log in?* — reset your password\n• *Payment failed?* — check mobile-money balance, contact your operator\n• *Photo not loading?* — re-upload it from Edit Profile\n• *Page slow?* — refresh or use a modern browser\n\nReport serious issues (banned incorrectly, disputes) via the Admin/Support channel.`,
    followUps: ['How do I reset my password?', 'How do I report a problem?']
  },
  {
    id: 'moderation',
    title: 'Moderation / bans / disputes',
    keywords: ['banned', 'ban', 'suspend', 'suspended', 'dispute', 'blocked', 'account locked', 'kubuza', 'status', 'deactivated', 'appeal'],
    message: (ctx) =>
      `**Account status and moderation**\n\n• Accounts can be **active**, **suspended** or **banned** (managed by admins/sub-admins).\n• A **suspended or banned** account cannot log in.\n• If you were blocked, contact support/a relevant admin to review your case.\n\n**For admins/sub-admins:**\n• Use **User Management** to change a user's status\n• Bans are logged with a reason for transparency\n\n${ctx.role === 'admin' ? 'You are signed in as admin — open **User Management** to moderate users.' : ''}`,
    followUps: ['How do I appeal a ban?', 'What does suspended mean?']
  },
  {
    id: 'agriAssistant',
    title: 'AgriAI page',
    keywords: ['agri ai', 'agriai', 'crop scan', 'scan crop', 'disease', 'plant disease', 'assistant page', 'ai crop', 'agri-ai', 'ai tools', 'camera crop'],
    message: () =>
      `**AgriAI tools on FarmerJoin**\n\nThe **AgriAI** page offers farming helpers:\n• **Crop scan** — upload a photo of a plant to detect diseases and get treatment advice\n• **Diseases** — list of common crop diseases with prevention\n• **Weather** — current conditions and forecast for Rwanda locations\n• **AI assistant** — agriculture advisor\n\nThese use the built-in knowledge base plus Rwanda agriculture data, so they work even without an internet AI service.`,
    followUps: ['How do I scan a crop?', 'Tell me about farming seasons', 'What crops are supported?']
  },
  {
    id: 'agriculture',
    title: 'General agriculture',
    keywords: ['agriculture', 'farming', 'crop', 'crops', 'plant', 'planting', 'soil', 'fertilizer', 'manure', 'harvest', 'ubuhinzi', 'gutera', 'imbuto', 'agronomy', 'grow', 'growing', 'saisons', 'saison', 'marais', 'récolte', 'seasons', 'farming seasons', 'planting seasons', 'growing seasons', 'seasons in rwanda', 'three seasons', 'water', 'watering', 'irrigation', 'irrigate', 'when to plant', 'how to plant', 'how to grow', 'cabbage', 'maize planting', 'beans planting', 'potatoes planting', 'dry season crops'],
    message: () =>
      `**Agriculture guidance (Rwanda)**\n\nRwanda has **three farming seasons**:\n• **Season A** — Sept–Dec (main season, maize, beans, cassava)\n• **Season B** — Feb–May (maize, beans, potatoes)\n• **Season C** — Jun–Aug (short season, vegetables, irrigation crops)\n\n**Practical tips:**\n• Prepare the soil early and use well-drained fields\n• Use improved seeds and proper spacing\n• Apply compost/manure and fertilizers as recommended locally\n• **Watering:** in Season C (Jun–Aug) supplement with irrigation; water in early morning or evening so the sun does not burn the leaves\n• Control weeds early and rotate crops to keep soil healthy\n• Ask your local agronomist / agriculture officer for site-specific advice\n\nOn FarmerJoin you can also use the **AgriAI** page (crop scan, weather) for more help.`,
    followUps: ['When should I plant maize?', 'How do I scan a crop disease?', 'Tell me about soil']
  },
  {
    id: 'weather',
    title: 'Weather & seasons',
    keywords: ['weather', 'rain', 'forecast', 'climate', 'seasons', 'season', 'ikirere', 'izuba', 'temperature', 'musanze', 'mu site', 'nyagatare', 'meteo', 'météo', 'pluie'],
    message: () =>
      `**Weather and seasons for farming**\n\nRwanda's rainfall is split into:\n• **Season A** (Sept–Dec) — main rains\n• **Season B** (Feb–May) — shorter rains\n• **Season C** (Jun–Aug) — dry season (irrigation helps)\n\nOn the **AgriAI** page you can check **current weather and forecast** for a location and see farming recommendations.\n\nFollow local weather alerts and plant with the season to reduce risk.`,
    followUps: ['How do I check the forecast?', 'What can I plant in the dry season?']
  },
  {
    id: 'systemChangelog',
    title: 'What is new / recent changes',
    keywords: ['what is new', 'whats new', "what's new", 'what changed', 'what has changed', 'recent changes', 'latest updates', 'latest update', 'latest', 'system changes', 'new features', 'updates', 'changelog', 'change log', 'news', 'version', 'anything new', 'nouveaute', 'nouveautes', 'nouveaux', 'amahinduka', 'ahinduye', 'byahindutse', 'icgihinduka'],
    message: () =>
      `I always keep an eye on what changes inside FarmerJoin, so I can tell you about the latest platform updates.\n\nAsk me "What's new?" at any time and I will list the most recent changes. Maintainers can also teach me new facts at any moment through the admin tools.`,
    followUps: ['What is new?', 'How do I register?', 'How do I add a product?']
  },
  {
    id: 'market',
    title: 'Prices, fees & market',
    keywords: ['price', 'prices', 'fee', 'fees', 'commission', 'cost', 'costs', 'cheap', 'expensive', 'overpriced', 'overpricing', 'discount', 'free', 'is it free', 'is farmerjoin free', 'free to use', 'free listings', 'igiciro', 'ubwizwe', 'market price', 'pricing', 'prix', 'frais', 'tarifs'],
    message: () =>
      `**Prices and fees on FarmerJoin**\n\n• **Buyers** pay for products + delivery (based on distance/size).\n• **Farmers** — basic product listings are free; a small commission/success fee may apply on sales depending on configuration.\n• Buying in **bulk** usually gets better prices.\n\n**Price tips for sellers:**\n• Compare local market prices at your district market\n• Add production, transport and packaging costs\n• Offer volume discounts to attract bigger orders\n\nPrices are set by sellers — compare offers in the catalogue before ordering.`,
    followUps: ['How is delivery cost calculated?', 'Are there hidden fees for buyers?', 'How should I price my maize?']
  }
];

/** Fallback message when no topic matches (a built-in helper that mistakes nothing) */
function fallbackMessage(lang) {
  if (lang === 'rw') {
    return 'Nta ngingo nzi yihariye inabiyeho, ariko nshobora kugufasha! "Ubwiyandikisho", "Kwinjira", "Igicuruzwa", "Icyo kugura", "Kurikira order", cyangwa "Agi AI". Kigisha ikibazo cyawe cyangwa uhindure ikintu.';
  }
  if (lang === 'fr') {
    return `Je n'ai pas bien compris votre question, mais je peux vous aider sur tout le système.\n\nEssayez de me demander par exemple :\n\n• **Comment créer un compte ?**\n• **Comment ajouter un produit ?**\n• **Comment payer par mobile money ?**\n• **Comment suivre ma commande ?**\n• **Quelles sont les saisons agricoles ?**\n\nOu reformulez votre question.`;
  }
  return `I'm not 100% sure I understood that, but I can help across the whole system.\n\nTry asking about one of these:\n\n• **Register / login / forgot password**\n• **Buying** — products, cart, checkout, mobile money, delivery\n• **Selling** — add/manage products, farm profile\n• **Dashboards** — what a buyer, farmer, admin can do\n• **AgriAI** — crop scan, weather, farming seasons\n\nOr rephrase your question, e.g. "How do I add a product?" or "How do I track my order?".`;
}

module.exports = { topics, fallbackMessage };