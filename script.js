// Global variables
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// API call helper function
async function apiCall(endpoint, options = {}) {
    const baseURL = window.location.origin;
    const url = `${baseURL}${endpoint}`;

    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        ...options
    };

    // Add authorization header if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, defaultOptions);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Check login status on page load
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
});

function checkLoginStatus() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    const isAdmin = localStorage.getItem('isAdmin') === '1';
    const loginBtn = document.getElementById('loginBtn');
    const profileSection = document.getElementById('profileSection');
    const profileUsername = document.getElementById('profileUsername');
    const adminPanelLink = document.getElementById('adminPanelLink');

    if (loggedInUser) {
        // User is logged in (including admin)
        if (loginBtn) loginBtn.style.display = 'none';
        if (profileSection) profileSection.style.display = 'block';
        if (profileUsername) profileUsername.textContent = loggedInUser;

        // Show admin panel link only for admin users
        if (adminPanelLink) {
            adminPanelLink.style.display = isAdmin ? 'block' : 'none';
        }

        // Setup profile dropdown
        setupProfileDropdown();
    } else {
        // User is not logged in
        if (loginBtn) loginBtn.style.display = 'block';
        if (profileSection) profileSection.style.display = 'none';
        if (adminPanelLink) {
            adminPanelLink.style.display = 'none';
        }
    }
}

function setupProfileDropdown() {
    const profileBtn = document.getElementById('profileBtn');
    const profileMenu = document.getElementById('profileMenu');
    const logoutBtn = document.getElementById('logoutBtn');
    const profileLink = document.getElementById('profileLink');

    if (!profileBtn || !profileMenu || !logoutBtn || !profileLink) {
        console.warn('Profile elements not found');
        return;
    }

    // Toggle dropdown menu or redirect to admin if admin
    profileBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const isAdmin = localStorage.getItem('isAdmin') === '1';
        if (isAdmin) {
            window.location.href = 'admin.html';
        } else {
            profileMenu.classList.toggle('show');
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
            profileMenu.classList.remove('show');
        }
    });

    // Logout functionality
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('isAdmin');
        location.reload();
    });

    // Profile link - redirect to admin panel if admin, otherwise profile page
    profileLink.addEventListener('click', function(e) {
        e.preventDefault();
        const isAdmin = localStorage.getItem('isAdmin') === '1';
        if (isAdmin) {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'profile.html';
        }
    });
}

// Game data loaded from admin
let GAME_DATA = {};

// Reliable default products (used as a last-resort fallback)
const DEFAULT_PRODUCTS = [
  { id: 'mobilelegends', title: 'Mobile Legends', image: 'https://sm.ign.com/ign_za/cover/m/mobile-leg/mobile-legends-bang-bang_c6z8.jpg', category: 'Games', description: 'Popular MOBA game with exciting gameplay.', packages: [ { id: 'p1', label: '500 Diamonds', value: 100 }, { id: 'p2', label: '1000 Diamonds', value: 200 } ] },
  { id: 'freefire', title: 'Free Fire', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8JMInACAGRr5zMiWcijo_VX2B_9-5vxucxg&s', category: 'Games', description: 'Fast-paced battle royale game.', packages: [ { id: 'p1', label: '100 Diamonds', value: 50 }, { id: 'p2', label: '300 Diamonds', value: 150 } ] },
  { id: 'roblox', title: 'Roblox', image: 'https://yt3.googleusercontent.com/xTxr7gmbkxiPKjrmN5ut0Kn8UcHpkkgyTv-_EeDPphcQusrWyKfSZw13EKCYXQyYdeoC3ON1zQ=s900-c-k-c0x00ffffff-no-rj', category: 'Games', description: 'Creative platform for building and playing games.', packages: [ { id: 'p1', label: '400 Robux', value: 30 }, { id: 'p2', label: '800 Robux', value: 60 }, { id: 'p3', label: '2000 Robux', value: 150 } ] },
  { id: 'pubg', title: 'PUBG Mobile', image: 'https://www.vice.com/wp-content/uploads/sites/2/2018/12/1545803974526-40176727491_31da2b03d8_b.jpeg', category: 'Games', description: 'Battle royale game with intense action.', packages: [ { id: 'p1', label: '30 UC', value: 30 }, { id: 'p2', label: '300 UC', value: 300 }, { id: 'p3', label: '1000 UC', value: 1000 } ] },
  { id: 'genshin', title: 'Genshin Impact', image: 'https://image.api.playstation.com/vulcan/ap/rnd/202509/0403/96df20a522e1004e3da998220ab2ded47797478ccda64bd8.png', category: 'Games', description: 'Open-world RPG with stunning visuals.', packages: [ { id: 'p1', label: '30 Primogems', value: 30 }, { id: 'p2', label: '60 Primogems', value: 60 }, { id: 'p3', label: '300 Primogems', value: 300 } ] },
  { id: 'bloodstrike', title: 'Blood Strike', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThWUdqCnnkYVy4kmDTkRycGXzMBnwyqua01S_-bnwWoxGDGCXOisqm7VuHphZxzh4b1Er5&s=10', category: 'Games', description: 'Tactical shooter with team-based gameplay.', packages: [ { id: 'p1', label: '25 Credits', value: 25 }, { id: 'p2', label: '50 Credits', value: 50 }, { id: 'p3', label: '100 Credits', value: 100 } ] },
  { id: 'netflix', title: 'Netflix', image: 'https://upload.wikimedia.org/wikipedia/commons/6/68/Netflix_logo.png', category: 'Subscriptions', description: 'Stream movies, series, and documentaries.', packages: [ { id: 'p1', label: 'Netflix Standard - 1 Month', value: 649 }, { id: 'p2', label: 'Netflix Premium - 1 Month', value: 799 } ] },
  { id: 'spotify', title: 'Spotify', image: 'https://upload.wikimedia.org/wikipedia/commons/7/74/Spotify_App_Logo.png', category: 'Subscriptions', description: 'Music streaming service.', packages: [ { id: 'p1', label: 'Spotify Premium - 1 Month', value: 99 } ] },
  { id: 'microsoft', title: 'Microsoft Office 365', image: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg', category: 'Subscriptions', description: 'Office productivity suite.', packages: [ { id: 'p1', label: 'Office 365 - 1 Year', value: 4999 } ] },
  { id: 'adobe', title: 'Adobe Creative Cloud', image: 'https://upload.wikimedia.org/wikipedia/commons/1/16/Adobe_Corporate_Logo.png', category: 'Subscriptions', description: 'Design tools.', packages: [ { id: 'p1', label: 'Adobe CC - 1 Month', value: 1999 } ] }
];
// Load game data from localStorage (admin managed)
function loadGameData() {
  try {
    console.debug('loadGameData: starting');
    const products = JSON.parse(localStorage.getItem('adminProducts') || '[]');
    const sections = JSON.parse(localStorage.getItem('adminSections') || '[]');
    console.debug('loadGameData: adminProducts', products);
    console.debug('loadGameData: adminSections', sections);

    // Build GAME_DATA from admin products
    GAME_DATA = {};
    products.forEach(product => {
      GAME_DATA[product.id] = {
        title: product.name,
        image: product.image,
        category: sections.find(s => s.id === product.section)?.name || 'Uncategorized',
        description: product.description,
        packages: product.packages
      };
    });

    // If no admin data, use minimal defaults for demo and persist them so games always appear
    if (Object.keys(GAME_DATA).length === 0) {
      const defaultSections = [
        { id: 'sec_games', name: 'Games' }
      ];

      const defaultProducts = [
        {
          id: 'mobilelegends',
          name: 'Mobile Legends',
          image: 'https://sm.ign.com/ign_za/cover/m/mobile-leg/mobile-legends-bang-bang_c6z8.jpg',
          section: 'sec_games',
          description: 'Popular MOBA game with exciting gameplay.',
          packages: [ { id: 'p1', label: '500 Diamonds', value: 100 }, { id: 'p2', label: '1000 Diamonds', value: 200 } ]
        },
        {
          id: 'freefire',
          name: 'Free Fire',
          image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8JMInACAGRr5zMiWcijo_VX2B_9-5vxucxg&s',
          section: 'sec_games',
          description: 'Fast-paced battle royale game.',
          packages: [ { id: 'p1', label: '100 Diamonds', value: 50 }, { id: 'p2', label: '300 Diamonds', value: 150 } ]
        },
        {
          id: 'roblox',
          name: 'Roblox',
          image: 'https://yt3.googleusercontent.com/xTxr7gmbkxiPKjrmN5ut0Kn8UcHpkkgyTv-_EeDPphcQusrWyKfSZw13EKCYXQyYdeoC3ON1zQ=s900-c-k-c0x00ffffff-no-rj',
          section: 'sec_games',
          description: 'Creative platform for building and playing games.',
          packages: [ { id: 'p1', label: '400 Robux', value: 30 }, { id: 'p2', label: '800 Robux', value: 60 }, { id: 'p3', label: '2000 Robux', value: 150 } ]
        },
        {
          id: 'pubg',
          name: 'PUBG Mobile',
          image: 'https://www.vice.com/wp-content/uploads/sites/2/2018/12/1545803974526-40176727491_31da2b03d8_b.jpeg',
          section: 'sec_games',
          description: 'Battle royale game with intense action.',
          packages: [ { id: 'p1', label: '30 UC', value: 30 }, { id: 'p2', label: '300 UC', value: 300 }, { id: 'p3', label: '1000 UC', value: 1000 } ]
        },
        {
          id: 'genshin',
          name: 'Genshin Impact',
          image: 'https://image.api.playstation.com/vulcan/ap/rnd/202509/0403/96df20a522e1004e3da998220ab2ded47797478ccda64bd8.png',
          section: 'sec_games',
          description: 'Open-world RPG with stunning visuals.',
          packages: [ { id: 'p1', label: '30 Primogems', value: 30 }, { id: 'p2', label: '60 Primogems', value: 60 }, { id: 'p3', label: '300 Primogems', value: 300 } ]
        },
        {
          id: 'bloodstrike',
          name: 'Blood Strike',
          image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThWUdqCnnkYVy4kmDTkRycGXzMBnwyqua01S_-bnwWoxGDGCXOisqm7VuHphZxzh4b1Er5&s=10',
          section: 'sec_games',
          description: 'Tactical shooter with team-based gameplay.',
          packages: [ { id: 'p1', label: '25 Credits', value: 25 }, { id: 'p2', label: '50 Credits', value: 50 }, { id: 'p3', label: '100 Credits', value: 100 } ]
        },
        {
          id: 'netflix',
          name: 'Netflix',
          image: 'https://upload.wikimedia.org/wikipedia/commons/6/68/Netflix_logo.png',
          section: 'sec_games',
          description: 'Stream movies, series, and documentaries.',
          packages: [ { id: 'p1', label: 'Netflix Standard - 1 Month', value: 649 }, { id: 'p2', label: 'Netflix Premium - 1 Month', value: 799 }, { id: 'p3', label: 'Netflix Standard - 3 Months', value: 1849 } ]
        },
        {
          id: 'spotify',
          name: 'Spotify',
          image: 'https://upload.wikimedia.org/wikipedia/commons/7/74/Spotify_App_Logo.png',
          section: 'sec_games',
          description: 'Music streaming service with millions of songs.',
          packages: [ { id: 'p1', label: 'Spotify Premium - 1 Month', value: 99 }, { id: 'p2', label: 'Spotify Premium - 3 Months', value: 299 }, { id: 'p3', label: 'Spotify Premium - 1 Year', value: 999 } ]
        },
        {
          id: 'microsoft',
          name: 'Microsoft Office 365',
          image: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
          section: 'sec_games',
          description: 'Productivity suite with Word, Excel, PowerPoint.',
          packages: [ { id: 'p1', label: 'Office 365 - 1 Year', value: 4999 }, { id: 'p2', label: 'Office 365 - 2 Years', value: 9499 } ]
        },
        {
          id: 'adobe',
          name: 'Adobe Creative Cloud',
          image: 'https://upload.wikimedia.org/wikipedia/commons/1/16/Adobe_Corporate_Logo.png',
          section: 'sec_games',
          description: 'Design tools: Photoshop, Illustrator, Premiere Pro.',
          packages: [ { id: 'p1', label: 'Adobe CC - 1 Month', value: 1999 }, { id: 'p2', label: 'Adobe CC - 1 Year', value: 19999 } ]
        }
      ];

      // Persist defaults so they appear reliably
      try {
        localStorage.setItem('adminSections', JSON.stringify(defaultSections));
        localStorage.setItem('adminProducts', JSON.stringify(defaultProducts));
      } catch (e) {
        console.warn('Could not persist default products to localStorage', e);
      }

      // Build GAME_DATA from defaults for immediate render
      GAME_DATA = {};
      defaultProducts.forEach(p => {
        GAME_DATA[p.id] = {
          title: p.name,
          image: p.image,
          category: 'Games',
          description: p.description,
          packages: p.packages
        };
      });
      console.debug('loadGameData: built GAME_DATA from defaults', GAME_DATA);
    }
    // final sanity check
    if (!GAME_DATA || Object.keys(GAME_DATA).length === 0) {
      console.warn('loadGameData: GAME_DATA empty after load — injecting minimal demo fallback');
      GAME_DATA = {
        demo: { title: 'Demo Game', image: 'https://via.placeholder.com/150?text=Demo', category: 'Games', description: 'Demo', packages: [{id:'p1',label:'Demo',value:10}] }
      };
    }
  } catch (error) {
    console.error('Error loading game data:', error);
    // Fallback to minimal data
    GAME_DATA = {
      'demo': {
        title: 'Demo Game',
        image: 'https://via.placeholder.com/150?text=Demo',
        category: 'Games',
        description: 'Demo game for testing.',
        packages: [{ id: 'p1', label: 'Demo Package', value: 10 }]
      }
    };
  }
}

// Render games grid based on loaded data
function renderGamesGrid() {
  const gamesGrid = document.getElementById('gamesGrid');
  if (!gamesGrid) return;

  console.debug('renderGamesGrid: GAME_DATA keys=', Object.keys(GAME_DATA));
  gamesGrid.innerHTML = '';

  Object.keys(GAME_DATA).forEach(gameId => {
    const game = GAME_DATA[gameId];
    const gameCard = document.createElement('div');
    gameCard.className = 'game-card';
    gameCard.setAttribute('data-game', gameId);
    gameCard.innerHTML = `
      <img src="${game.image}" alt="${game.title}" onerror="this.src='https://via.placeholder.com/150'">
      <h3>${game.title}</h3>
      <p>${game.category}</p>
    `;
    gameCard.addEventListener('click', () => openGameModal(gameId));
    gamesGrid.appendChild(gameCard);
  });
  // If nothing was appended, show a friendly message
  if (gamesGrid.children.length === 0) {
    gamesGrid.innerHTML = '<div class="empty-state"><p>No products found. If you are the site owner, check adminProducts in localStorage.</p></div>';
    console.warn('renderGamesGrid: no game cards appended');
  }
}

// Shopping Cart System

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function addToCart(gameId, packageId, packageLabel, price, quantity, accountUID, serverID) {
  const game = GAME_DATA[gameId];
  if (!game) return;

  const cartItem = {
    id: Date.now(),
    gameId: gameId,
    gameTitle: game.title,
    gameImage: game.image,
    packageId: packageId,
    packageLabel: packageLabel,
    price: price,
    quantity: quantity || 1,
    accountUID: accountUID || '',
    serverID: serverID || ''
  };

  cart.push(cartItem);
  saveCart();
  
  showNotification(`${game.title} added to cart!`);
}

function removeFromCart(itemId) {
  cart = cart.filter(item => item.id !== itemId);
  saveCart();
  updateCartDisplay();
}

function updateCartCount() {
  const count = cart.length;
  const cartBadge = document.getElementById('cartBadge');
  if (cartBadge) {
    cartBadge.textContent = count;
    cartBadge.style.display = count > 0 ? 'flex' : 'none';
  }
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function updateCartDisplay() {
  const cartList = document.getElementById('cartItemsList');
  const cartTotal = document.getElementById('cartTotal');
  const emptyCart = document.getElementById('emptyCartMsg');

  if (!cartList) return;

  if (cart.length === 0) {
    cartList.innerHTML = '';
    emptyCart.style.display = 'block';
    if (cartTotal) cartTotal.textContent = 'Rs0';
    return;
  }

  emptyCart.style.display = 'none';
  cartList.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.gameImage}" alt="${item.gameTitle}" class="cart-item-image">
      <div class="cart-item-details">
        <div class="cart-item-title">${item.gameTitle}</div>
        <div class="cart-item-package">${item.packageLabel}</div>
        <div class="cart-item-quantity">Qty: ${item.quantity}</div>
        <div class="cart-item-price">Rs${item.price * item.quantity}</div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${item.id})">×</button>
    </div>
  `).join('');

  if (cartTotal) cartTotal.textContent = 'Rs' + getCartTotal();
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Game card click handlers
document.addEventListener('DOMContentLoaded', function(){
  // Load game data from admin
  loadGameData();

  // Render games grid after a short delay to ensure DOM elements exist
  setTimeout(() => {
    try {
      renderGamesGrid();
      updateCartCount();
    } catch (err) {
      console.error('Error rendering games grid on DOMContentLoaded:', err);
    }
  }, 50);

  // Also attempt a final render on full window load as a fallback
  window.addEventListener('load', () => {
    try { renderGamesGrid(); } catch (e) { /* ignore */ }
  });

  // Make static .game-card elements open the shopping modal as well
  document.querySelectorAll('.game-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', function() {
      // Create a temporary GAME_DATA entry from the static card
      try {
        const img = card.querySelector('img');
        const titleEl = card.querySelector('h4');
        const imgSrc = img ? (img.src || img.getAttribute('src')) : '';
        const title = titleEl ? titleEl.textContent.trim() : 'Product';
        const tempId = 'static_' + Date.now() + '_' + Math.floor(Math.random()*1000);
        GAME_DATA[tempId] = {
          title: title,
          image: imgSrc || 'https://via.placeholder.com/150',
          category: 'Products',
          description: card.getAttribute('data-desc') || '',
          packages: [
            { id: 'p1', label: 'Default Package', value: 100 }
          ]
        };
        openGameModal(tempId);
      } catch (err) {
        console.error('Failed to open static product modal', err);
      }
    });
  });

  // Cart icon click handler
  const cartIcon = document.querySelector('.cart-wrapper');
  console.log('cartIcon found', cartIcon);
  if (cartIcon) {
    cartIcon.addEventListener('click', function() {
      console.log('Cart icon clicked');
      toggleCartDrawer();
    });
  }

  // Close modals on X button
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', function() {
      const modal = this.closest('.shopping-modal') || this.closest('.modal');
      if (modal) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  });

  // Close modal when clicking outside
  document.querySelectorAll('.shopping-modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('open');
        this.setAttribute('aria-hidden', 'true');
      }
    });
  });
});

function openGameModal(gameId) {
  const game = GAME_DATA[gameId];
  if (!game) return;

  document.getElementById('gameImage').src = game.image;
  document.getElementById('gameCategory').textContent = game.category;
  document.getElementById('gameTitle').textContent = game.title;
  document.getElementById('gameDescription').textContent = game.description;
  const accountInput = document.getElementById('accountUID');
  if (accountInput) {
    accountInput.value = '';
    // If this is Mobile Legends, prompt for UID + Server ID
    accountInput.placeholder = (gameId === 'mobilelegends')
      ? 'Enter game user id (UID) and Server id'
      : 'Enter your UID';
  }
  document.getElementById('quantity').value = 1;

  // Populate packages
  const packagesGrid = document.getElementById('packagesGrid');
  packagesGrid.innerHTML = game.packages.map(pkg => `
    <div class="package-option" data-package-id="${pkg.id}" data-price="${pkg.value}">
      <div class="package-name">${pkg.label}</div>
      <div class="package-price">Rs${pkg.value}</div>
    </div>
  `).join('');

  // Package selection handler
  let selectedPackage = null;
  packagesGrid.querySelectorAll('.package-option').forEach(option => {
    option.addEventListener('click', function() {
      packagesGrid.querySelectorAll('.package-option').forEach(o => o.classList.remove('selected'));
      this.classList.add('selected');
      selectedPackage = {
        id: this.getAttribute('data-package-id'),
        label: this.querySelector('.package-name').textContent,
        price: parseInt(this.getAttribute('data-price'))
      };
    });
  });

  // Select first package by default
  const firstOption = packagesGrid.querySelector('.package-option');
  if (firstOption) {
    firstOption.classList.add('selected');
    selectedPackage = {
      id: firstOption.getAttribute('data-package-id'),
      label: firstOption.querySelector('.package-name').textContent,
      price: parseInt(firstOption.getAttribute('data-price'))
    };
  }

  // Add to cart button
  document.getElementById('addToCartBtn').onclick = function() {
    const uid = document.getElementById('accountUID').value.trim();
    const serverId = (document.getElementById('serverID') && document.getElementById('serverID').value.trim()) || '';
    const quantity = parseInt(document.getElementById('quantity').value);

    if (!uid) {
      alert('Please enter your UID');
      return;
    }

    if (!selectedPackage) {
      alert('Please select a package');
      return;
    }

    addToCart(gameId, selectedPackage.id, selectedPackage.label, selectedPackage.price, quantity, uid, serverId);
    
    const modal = document.getElementById('gameShoppingModal');
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  };

  // Quantity handlers
  document.getElementById('qtyDecrement').onclick = function() {
    const qty = document.getElementById('quantity');
    if (qty.value > 1) qty.value = parseInt(qty.value) - 1;
  };

  document.getElementById('qtyIncrement').onclick = function() {
    const qty = document.getElementById('quantity');
    qty.value = parseInt(qty.value) + 1;
  };

  const modal = document.getElementById('gameShoppingModal');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function toggleCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  if (drawer) {
    drawer.classList.toggle('open');
    updateCartDisplay();
  }
}

function proceedToCheckout() {
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  
  const drawer = document.getElementById('cartDrawer');
  if (drawer) {
    drawer.classList.remove('open');
  }
  
  openCheckoutModal();
}

function openCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  if (!modal) return;

  const cartSummary = document.getElementById('checkoutCartSummary');
  const checkoutTotal = document.getElementById('checkoutTotal');

  cartSummary.innerHTML = cart.map((item, index) => `
    <div class="checkout-item">
      <span>${index + 1}. ${item.gameTitle} - ${item.packageLabel}</span>
      <span>Rs${item.price * item.quantity}</span>
    </div>
  `).join('');

  checkoutTotal.textContent = 'Rs' + getCartTotal();

  // Generate a unique eSewa code for this checkout session and show payment instructions
  const esewaCode = generateEsewaCode();
  const esewaCodeEl = document.getElementById('esewaCode');
  if (esewaCodeEl) {
    esewaCodeEl.textContent = esewaCode;
    esewaCodeEl.setAttribute('data-code', esewaCode);
  }

  // wire copy button
  const copyBtn = document.getElementById('copyEsewaCodeBtn');
  if (copyBtn) {
    copyBtn.onclick = function() {
      const code = (esewaCodeEl && esewaCodeEl.getAttribute('data-code')) || '';
      if (!code) return;
      navigator.clipboard.writeText(code).then(() => {
        showNotification('eSewa code copied to clipboard');
      }).catch(() => {
        alert('Copy not supported in this browser. Select and copy the code manually.');
      });
    };
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

// Generate a random code with 2 digits and 3 letters mixed (like 1RD2J)
function generateEsewaCode() {
  const digits = '0123456789';
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // excluding I and O to avoid confusion
  let code = [];
  
  // Add 2 random digits
  for (let i = 0; i < 2; i++) {
    code.push(digits.charAt(Math.floor(Math.random() * digits.length)));
  }
  
  // Add 3 random letters
  for (let i = 0; i < 3; i++) {
    code.push(letters.charAt(Math.floor(Math.random() * letters.length)));
  }
  
  // Shuffle the code array randomly
  for (let i = code.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [code[i], code[j]] = [code[j], code[i]];
  }
  
  return code.join('');
}

document.addEventListener('DOMContentLoaded', function() {
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Get logged-in user information
      const loggedInUser = localStorage.getItem('loggedInUser');
      if (!loggedInUser) {
        alert('Please login to place an order');
        window.location.href = 'login.html';
        return;
      }

      // Get user data
      const users = JSON.parse(localStorage.getItem('siteUsers') || '[]');
      const user = users.find(u => u.username === loggedInUser);

      if (!user) {
        alert('User data not found. Please login again.');
        localStorage.removeItem('loggedInUser');
        window.location.href = 'login.html';
        return;
      }

      const name = user.username;
      const email = user.email || '';
      const phone = 'N/A';
      const paymentMethod = document.getElementById('paymentMethod').value;

      if (!paymentMethod) {
        alert('Please select a payment method');
        return;
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Invalid email in user profile');
        return;
      }

      // Attach generated eSewa code (if available) and save individual order entries
      const esewaCodeEl = document.getElementById('esewaCode');
      const esewaCode = (esewaCodeEl && esewaCodeEl.getAttribute('data-code')) || generateEsewaCode();

      // Determine items to save: prefer in-memory `cart`, otherwise fallback to legacy `gameCart` key
      const storedCartFallback = JSON.parse(localStorage.getItem('gameCart') || '[]');
      const activeCartItems = (cart && cart.length) ? cart : storedCartFallback;

      if (!activeCartItems || activeCartItems.length === 0) {
        alert('Your cart is empty. Add items before placing an order.');
        return;
      }

      // Build per-item order entries for server
      const userId = localStorage.getItem('userId');

      if (!userId) {
        alert('User not authenticated. Please login again.');
        window.location.href = 'login.html';
        return;
      }

      const ordersData = activeCartItems.map(item => {
        const price = item.price || item.value || item.total || 0;
        const qty = item.quantity || item.qty || 1;
        const packLabel = item.packLabel || item.packageLabel || item.packLabel || item.pack || '';

        return {
          gameTitle: item.gameTitle || item.game || item.title || 'N/A',
          packLabel: packLabel,
          uid: item.uid || item.accountUID || '',
          serverId: item.serverId || item.serverID || '',
          quantity: qty,
          price: price,
          total: (price * qty) || item.total || 0,
          esewaCode: esewaCode,
          status: 'Pending'
        };
      });

      try {
        // Save orders to server
        await apiCall('/orders', {
          method: 'POST',
          body: JSON.stringify({ user_id: userId, orders: ordersData })
        });
      } catch (error) {
        alert('Failed to save order: ' + error.message);
        return;
      }

      showNotification('Order placed successfully! eSewa code: ' + esewaCode);

      // Clear cart to avoid stale items (do not remove admin 'gameCart' orders)
      cart = [];
      saveCart();
      updateCartDisplay();

      // Reset form
      this.reset();

      // Close the checkout modal
      const modal = document.getElementById('checkoutModal');
      if (modal) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
      }

      // Show order confirmation with instruction
      setTimeout(() => {
        alert('Thank you for your order!\n\nPlease copy the eSewa code and paste it into eSewa remarks before completing payment:\n' + esewaCode);
      }, 500);
    });
  }
});

function payNow(){
  alert('Payment integration placeholder. Integrate Stripe/Flutterwave/Nicepay on your server.');
}

// Game selection and package population
const GAME_PACKS = {
  'freefire': [
    {id:'ff1', label:'Free Fire 25 Diamonds', value:35 },
    {id:'ff2', label:'Free Fire 50 Diamonds', value:65},
    {id:'ff3', label:'Free Fire 115 Diamonds', value:99},
    {id:'ff4', label:'Free Fire 240 Diamonds', value:194},
    {id:'ff5', label:'Free Fire 355 Diamonds', value:284},
    {id:'ff6', label:'Free Fire 440 Diamonds', value:379},
    {id:'ff7', label:'Free Fire 610 Diamonds', value:474},
    {id:'ff8', label:'Free Fire 725 Diamonds', value:560},
    {id:'ff9', label:'Free Fire 840 Diamonds', value:655},
    {id:'ff10', label:'Free Fire 965 Diamonds', value:755},
    {id:'ff11', label:'Free Fire 1090 Diamonds', value:835},
    {id:'ff12', label:'Free Fire 1240 Diamonds', value:935},
    {id:'ff13', label:'Free Fire 2530 Diamonds', value:1864},
    {id:'ff14', label:'Free Fire 5060 Diamonds', value:3660}
  ],
  'mobilelegends': [
    {id:'ml1', label:'Mobile Legends 55 Diamonds', value:182},
    {id:'ml2', label:'Mobile Legends 275 Diamonds', value:862},
    {id:'ml3', label:'Mobile Legends 565 Diamonds', value:1712},
    {id:'ml4', label:'Mobile Legends 1160 Diamonds', value:3412},
    {id:'ml5', label:'Mobile Legends 1770 Diamonds', value:5112}
  ],
  'roblox': [
    {id:'r1', label:'Roblox $10 Robux', value:1725},
    {id:'r2', label:'Roblox $25 Robux', value:4270}
  ],
  'pubg': [
    {id:'pg1', label:'PUBG 60 UC', value:178},
    {id:'pg2', label:'PUBG 120 UC', value:399},
    {id:'pg3', label:'PUBG 325 UC', value:865},
    {id:'pg4', label:'PUBG 385 UC', value:1020},
    {id:'pg5', label:'PUBG 660 UC', value:1628},
    {id:'pg6', label:'PUBG 720 UC', value:1774},
    {id:'pg7', label:'PUBG 985 UC', value:2444},
    {id:'pg8', label:'PUBG 1800 UC', value:3915},
    {id:'pg9', label:'PUBG 3850 UC', value:7815},
    {id:'pg10', label:'PUBG 8100 UC', value:15142}
    ],
  'genshin': [
    {id:'gi1', label:'60 Genesis Crystals', value:180},
    {id:'gi2', label:'330 Genesis Crystals', value:860},
    {id:'gi3', label:'1,090 Genesis Crystals', value:2560},
    {id:'gi4', label:'Blessing of the Welkin Moon', value:860},
  ],
  'bloodstrike': [
    {id:'bs1', label:'Level-Up Pass', value:360},
    {id:'bs2', label:'Strike Pass Elite', value:520},
    {id:'bs3', label:'Strike Pass Elite', value:1540},
    {id:'bs4', label:'50 golds', value:96}
  ],
  'netflix': [
    {id:'nf1', label:'Netflix Standard - 1 Month', value:649},
    {id:'nf2', label:'Netflix Premium - 1 Month', value:799},
    {id:'nf3', label:'Netflix Standard - 3 Months', value:1849}
  ],
  'spotify': [
    {id:'sp1', label:'Spotify Premium - 1 Month', value:99},
    {id:'sp2', label:'Spotify Premium - 3 Months', value:299},
    {id:'sp3', label:'Spotify Premium - 1 Year', value:999}
  ],
  'microsoft': [
    {id:'ms1', label:'Microsoft Office 365 - 1 Year', value:4999},
    {id:'ms2', label:'Microsoft Office 365 - 2 Years', value:9499}
  ],
  'adobe': [
    {id:'ad1', label:'Adobe Creative Cloud - 1 Month', value:1999},
    {id:'ad2', label:'Adobe Creative Cloud - 1 Year', value:19999}
  ]
};

let currentGameData = null;
let currentGamePacks = null;

document.addEventListener('DOMContentLoaded', () => {
  const gameCards = document.querySelectorAll('.game-card');
  
  gameCards.forEach(card => {
    card.addEventListener('click', () => {
      const game = card.getAttribute('data-game');
      openGameShoppingModal(game);
    });
  });
  
  // Setup quantity buttons
  const qtyDecrement = document.getElementById('qtyDecrement');
  const qtyIncrement = document.getElementById('qtyIncrement');
  const quantity = document.getElementById('quantity');
  
  if(qtyDecrement) qtyDecrement.addEventListener('click', () => {
    const val = Math.max(1, parseInt(quantity.value) - 1);
    quantity.value = val;
  });
  
  if(qtyIncrement) qtyIncrement.addEventListener('click', () => {
    quantity.value = parseInt(quantity.value) + 1;
  });
  
  // Add to cart button
  const addToCartBtn = document.getElementById('addToCartBtn');
  // NOTE: per-modal handlers (set in `openGameModal`) already attach an onclick
  // directly to `addToCartBtn`. Keeping a global listener here caused the
  // button click to invoke both handlers and add the item twice. Commenting
  // out the global listener to prevent duplicate cart entries.
  // if(addToCartBtn) addToCartBtn.addEventListener('click', handleAddToCart);
  
  // Close modal
  const modal = document.getElementById('gameShoppingModal');
  const closeBtn = document.querySelector('.shopping-modal .modal-close');
  if(closeBtn) closeBtn.addEventListener('click', closeGameShoppingModal);
  if(modal) modal.addEventListener('click', (e) => {
    if(e.target === modal) closeGameShoppingModal();
  });

  // --- User login modal handling ---
  const userLoginModal = document.getElementById('userLoginModal');
  const userLoginClose = document.getElementById('userLoginClose');
  const userLoginForm = document.getElementById('userLoginForm');

  // User login modal handlers
  if (userLoginClose) {
    userLoginClose.addEventListener('click', () => closeUserLogin());
  }

  if (userLoginForm) {
    userLoginForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const identifier = document.getElementById('userUsername').value.trim();
      const password = document.getElementById('userPassword').value.trim();

      if (!identifier || !password) {
        alert('Please enter both username/email and password.');
        return;
      }

      // Check against siteUsers in localStorage
      const users = JSON.parse(localStorage.getItem('siteUsers') || '[]');
      const user = users.find(u => u.username.toLowerCase() === identifier.toLowerCase() || (u.email && u.email.toLowerCase() === identifier.toLowerCase()));

      if (!user || user.password !== password) {
        alert('Invalid credentials. Please check your username/email and password.');
        return;
      }

      // Successful login
      localStorage.setItem('loggedInUser', user.username);
      closeUserLogin();
      alert('Login successful! Welcome back.');
      // Optionally refresh or update UI
    });
  }

  // close user login modal when clicking outside
  if (userLoginModal) {
    userLoginModal.addEventListener('click', (e) => {
      if (e.target === userLoginModal) closeUserLogin();
    });
  }
});

function openGameShoppingModal(game) {
  const modal = document.getElementById('gameShoppingModal');
  const gameData = GAME_DATA[game];
  const packs = GAME_PACKS[game] || [];
  
  if(!gameData) return;
  
  currentGameData = { game, ...gameData };
  currentGamePacks = packs;
  
  // Update game info
  document.getElementById('gameImage').src = gameData.image;
  document.getElementById('gameTitle').textContent = gameData.title;
  document.getElementById('gameCategory').textContent = gameData.category;
  document.getElementById('gameDescription').textContent = gameData.description;
  
  // Populate packages
  const packagesGrid = document.getElementById('packagesGrid');
  packagesGrid.innerHTML = '';
  
  packs.forEach((pack, index) => {
    const packDiv = document.createElement('div');
    packDiv.className = 'package-option' + (index === 0 ? ' selected' : '');
    packDiv.setAttribute('data-pack-id', pack.id);
    packDiv.addEventListener('click', () => selectPackage(packDiv));
    
    packDiv.innerHTML = `
      <div class="package-name">${pack.label}</div>
      <div class="package-price">
        ${pack.original ? `<span class="package-original">Rs. ${pack.original}</span>` : ''}
        Rs. ${pack.value}
      </div>
    `;
    
    packagesGrid.appendChild(packDiv);
  });
  
  // Reset quantity and UID
  document.getElementById('quantity').value = 1;
  const accountInput2 = document.getElementById('accountUID');
  if (accountInput2) {
    accountInput2.value = '';
    accountInput2.placeholder = (game === 'mobilelegends')
      ? 'Enter game user id (UID) and Server id'
      : 'Enter your UID';
  }
  
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function selectPackage(element) {
  document.querySelectorAll('.package-option').forEach(el => el.classList.remove('selected'));
  element.classList.add('selected');
}

function closeGameShoppingModal() {
  const modal = document.getElementById('gameShoppingModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function handleAddToCart() {
  // Check if user is logged in
  const loggedInUser = localStorage.getItem('loggedInUser');
  if (!loggedInUser) {
    alert('Please login first to add items to cart.');
    // Redirect to login page
    window.location.href = 'login.html';
    return;
  }

  const uid = document.getElementById('accountUID').value.trim();
  const quantity = parseInt(document.getElementById('quantity').value);
  const selectedPack = document.querySelector('.package-option.selected');

  if(!uid) {
    alert('Please enter your UID');
    return;
  }

  if(!selectedPack) {
    alert('Please select a package');
    return;
  }

  const packId = selectedPack.getAttribute('data-pack-id');
  const pack = currentGamePacks.find(p => p.id === packId);

  if(!pack) return;

  // Add to the main cart array using the unified cart system
  const serverId = (document.getElementById('serverID') && document.getElementById('serverID').value.trim()) || '';
  addToCart(currentGameData.game, packId, pack.label, pack.value, quantity, uid, serverId);

  // Update cart display if drawer is currently open
  const cartDrawer = document.getElementById('cartDrawer');
  if (cartDrawer && cartDrawer.classList.contains('open')) {
    updateCartDisplay();
  }

  closeGameShoppingModal();
}

// --- Site admin helper functions ---
function isAdminLoggedIn(){
  return localStorage.getItem('isAdmin') === '1';
}

function updateHeaderForAdmin(){
  const loginBtn = document.getElementById('loginBtn');
  if(!loginBtn) return;
  loginBtn.textContent = 'Login';
  loginBtn.href = 'login.html';
  loginBtn.classList.remove('admin-link');
}

function closeSiteLogin(){
  const siteLoginModal = document.getElementById('siteLoginModal');
  if(!siteLoginModal) return;
  siteLoginModal.classList.remove('open');
  siteLoginModal.setAttribute('aria-hidden', 'true');
}

function closeUserLogin(){
  const userLoginModal = document.getElementById('userLoginModal');
  if(!userLoginModal) return;
  userLoginModal.classList.remove('open');
  userLoginModal.setAttribute('aria-hidden', 'true');
}

// --- Site admin modal handling ---
document.addEventListener('DOMContentLoaded', () => {
  const adminLink = document.getElementById('adminLink');
  const siteLoginModal = document.getElementById('siteLoginModal');
  const siteLoginClose = document.getElementById('siteLoginClose');
  const siteLoginForm = document.getElementById('siteLoginForm');

  // Open admin modal
  if (adminLink) {
    adminLink.addEventListener('click', (e) => {
      e.preventDefault();
      siteLoginModal.classList.add('open');
      siteLoginModal.setAttribute('aria-hidden', 'false');
    });
  }

  // Close admin modal
  if (siteLoginClose) {
    siteLoginClose.addEventListener('click', () => closeSiteLogin());
  }

  // Close admin modal when clicking outside
  if (siteLoginModal) {
    siteLoginModal.addEventListener('click', (e) => {
      if (e.target === siteLoginModal) closeSiteLogin();
    });
  }

  // Admin login form
  if (siteLoginForm) {
    siteLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('siteUsername').value.trim();
      const password = document.getElementById('sitePassword').value.trim();

      if (username === 'roshanshah' && password === 'killer3051Q') {
        localStorage.setItem('isAdmin', '1');
        localStorage.setItem('loggedInUser', 'roshanshah');
        closeSiteLogin();
        alert('Admin login successful!');
        // Redirect to admin page
        window.location.href = 'admin.html';
      } else {
        alert('Invalid admin credentials');
      }
    });
  }
});
