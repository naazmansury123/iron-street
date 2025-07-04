document.addEventListener('DOMContentLoaded', function() {
    const wishlistItemsGrid = document.getElementById('wishlist-items-list'); // Ensure ID matches HTML
    const emptyMessageContainer = document.querySelector('.wishlist-empty-message-container');
    const clearWishlistBtn = document.getElementById('clear-wishlist-btn');
    const wishlistFooterActions = document.querySelector('.wishlist-actions-footer');

    const WISHLIST_KEY = 'ecoWishlist'; // Use a constant for localStorage key
    const CART_KEY = 'ecoCart';       // Use a constant for localStorage key

    // --- Cart Utility Functions (for this page) ---
    function addToCart(product) {
        if (!product || !product.id) {
            console.error("Cart Error: Product details are missing.", product);
            return false;
        }
        let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
        const existingItemIndex = cart.findIndex(item => item.id === product.id);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 0) + 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                // Add any other properties your cart page/logic expects
                quantity: 1
            });
        }
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateWishlistPageHeaderCartCount(); // Update count on this page's header
        return true;
    }

    function updateWishlistPageHeaderCartCount() {
        const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const cartCountEl = document.querySelector('.cart-count-wishlist-header');
        if (cartCountEl) {
            cartCountEl.textContent = `(${totalItems})`;
        }
    }

    // --- Wishlist Core Functions ---
    function renderWishlistItems() {
        const wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];

        if (!wishlistItemsGrid || !emptyMessageContainer || !wishlistFooterActions) {
            console.error("Wishlist Error: Essential HTML elements (grid, empty message, or footer) not found.");
            return;
        }
        wishlistItemsGrid.innerHTML = ''; // Clear previous items

        if (wishlist.length === 0) {
            emptyMessageContainer.style.display = 'block';
            wishlistItemsGrid.style.display = 'none'; // Hide grid if empty
            wishlistFooterActions.style.display = 'none'; // Hide clear button footer
        } else {
            emptyMessageContainer.style.display = 'none';
            wishlistItemsGrid.style.display = 'grid'; // Ensure grid is visible
            wishlistFooterActions.style.display = 'block'; // Show clear button footer

            wishlist.forEach(item => {
                const itemCard = document.createElement('div');
                itemCard.classList.add('wishlist-item-card');
                itemCard.dataset.productId = item.id;

                // --- Prepare item data with fallbacks ---
                const itemName = item.name || 'Product Name Unavailable';
                const itemImage = item.image || 'path/to/default-placeholder.png'; // IMPORTANT: Have a real placeholder
                const itemPrice = typeof item.price === 'number' ? item.price.toFixed(2) : 'N/A';
                const itemOriginalPrice = (typeof item.originalPrice === 'number' && item.originalPrice > item.price) ? item.originalPrice.toFixed(2) : null;
                const itemSku = item.sku || '';
                const itemModel = item.model || '';
                const itemAddedOn = item.addedOn ? new Date(item.addedOn).toLocaleDateString() : 'Not specified';

                let stockStatus = false;
                let stockText = 'Info Unavailable';
                if (typeof item.availability === 'string') {
                    stockStatus = item.availability.toLowerCase() === 'in stock';
                    stockText = item.availability;
                } else if (typeof item.stock_quantity === 'number') {
                    stockStatus = item.stock_quantity > 0;
                    stockText = stockStatus ? 'In Stock' : 'Out of Stock';
                }

                const stockClass = stockStatus ? 'in-stock' : 'out-of-stock';

                let priceHtml = `<span class="wishlist-item-price">$${itemPrice}</span>`;
                if (itemOriginalPrice) {
                    priceHtml = `<span class="wishlist-item-price">$${itemPrice} <del>$${itemOriginalPrice}</del></span>`;
                }

                // --- Create Card HTML ---
                // Wrapped details in a .wishlist-item-content for better flex control
                itemCard.innerHTML = `
                    <div class="wishlist-item-image-wrapper">
                        <img src="${itemImage}" alt="${itemName}">
                    </div>
                    <div class="wishlist-item-content">
                        <div class="wishlist-item-details">
                            <h3><a href="#">${itemName}</a></h3>
                            ${itemSku ? `<p class="wishlist-item-sku">SKU: ${itemSku}</p>` : ''}
                            ${itemModel ? `<p class="wishlist-item-model">Model: ${itemModel}</p>` : ''}
                        </div>
                        <div class="wishlist-item-price-stock">
                            ${priceHtml}
                            <span class="wishlist-item-stock ${stockClass}">
                                <i class="fas ${stockStatus ? 'fa-check-circle' : 'fa-times-circle'}"></i> ${stockText}
                            </span>
                        </div>
                         <p class="wishlist-item-added-date">Added: ${itemAddedOn}</p>
                        <div class="wishlist-item-actions">
                            <button class="btn btn-primary btn-add-to-cart-wl" ${!stockStatus ? 'disabled title="Currently Out of Stock"' : ''}>
                                <i class="fas fa-cart-plus"></i> Add to Cart
                            </button>
                            <button class="btn btn-remove-wishlist btn-secondary-outline">
                                <i class="fas fa-trash-alt"></i> Remove
                            </button>
                        </div>
                    </div>
                `;
                wishlistItemsGrid.appendChild(itemCard);
            });
        }
        addEventListenersToWishlistActionButtons(); // Re-attach listeners after rendering
    }

    function addEventListenersToWishlistActionButtons() {
        document.querySelectorAll('.wishlist-item-card .btn-remove-wishlist').forEach(button => {
            // Remove old listener before adding new one to prevent duplicates if called multiple times
            button.replaceWith(button.cloneNode(true));
            document.querySelector(`[data-product-id="${button.closest('.wishlist-item-card').dataset.productId}"] .btn-remove-wishlist`).addEventListener('click', handleRemoveFromWishlist);

        });

        document.querySelectorAll('.wishlist-item-card .btn-add-to-cart-wl').forEach(button => {
            button.replaceWith(button.cloneNode(true));
             document.querySelector(`[data-product-id="${button.closest('.wishlist-item-card').dataset.productId}"] .btn-add-to-cart-wl`).addEventListener('click', handleAddToCartFromWishlist);
        });
    }

    function handleRemoveFromWishlist(event) {
        const button = event.currentTarget;
        const productCard = button.closest('.wishlist-item-card');
        if (productCard && productCard.dataset.productId) {
            const productId = productCard.dataset.productId;
            removeFromWishlist(productId);
        }
    }

    function handleAddToCartFromWishlist(event) {
        const button = event.currentTarget;
        if (button.disabled) return;

        const productCard = button.closest('.wishlist-item-card');
        if (productCard && productCard.dataset.productId) {
            const productId = productCard.dataset.productId;
            const wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
            const product = wishlist.find(p => p.id === productId);

            if (product) {
                if (addToCart(product)) { // Use the cart function defined in this script
                    button.innerHTML = '<i class="fas fa-check"></i> Added!';
                    button.disabled = true;
                    setTimeout(() => {
                        button.innerHTML = '<i class="fas fa-cart-plus"></i> Add to Cart';
                        // Re-check stock to set disabled state correctly
                        let stockStatus = false;
                        if (typeof product.availability === 'string') stockStatus = product.availability.toLowerCase() === 'in stock';
                        else if (typeof product.stock_quantity === 'number') stockStatus = product.stock_quantity > 0;
                        button.disabled = !stockStatus;
                    }, 2000);
                } else {
                    alert("Oops! Could not add this product to your cart.");
                }
            } else {
                alert("Product details not found for adding to cart.");
            }
        }
    }

    function removeFromWishlist(productId) {
        let wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
        const initialLength = wishlist.length;
        wishlist = wishlist.filter(item => item.id !== productId);

        if (wishlist.length < initialLength) { // Item was actually removed
            localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
            renderWishlistItems(); // Re-render the list to reflect removal
            // Note: If naaz.js is also loaded and has a global wishlist count update,
            // you might need a way to call it, or rely on naaz.js to update its own header
            // on its next page load/DOMContentLoaded.
        }
    }

    function clearAllWishlistItems() {
        if (confirm("Are you sure you want to remove all items from your Want Vault? This action cannot be undone.")) {
            localStorage.removeItem(WISHLIST_KEY);
            renderWishlistItems(); // Re-render to show empty state
        }
    }

    // --- Initial Setup ---
    if (clearWishlistBtn) {
        clearWishlistBtn.addEventListener('click', clearAllWishlistItems);
    } else {
        console.warn("Wishlist Warning: 'Clear All' button element not found in HTML.");
    }

    // Render items and update cart count in header when the page loads
    renderWishlistItems();
    updateWishlistPageHeaderCartCount();

}); // End DOMContentLoaded