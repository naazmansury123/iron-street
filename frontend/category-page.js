document.addEventListener('DOMContentLoaded', function() {
    // This is the same product data from naaz.js
    const allProductsData = [
        // --- COPY & PASTE the entire 'allProductsData' array from naaz.js here ---
        { name: "Elegant Velvet Sofa", price: 55000, oldPrice: 75000, imageUrl: "https://ironstreets.com/storage/products/tables/5e51a3d1-b0ca-4f37-8ccb-d0f67041af5f-300x300.webp", badgeText: "Sale", badgeType: "sale", category: "Sofa", isFeatured: true },
        // ... all other products
    ];

    // This function is also copied from naaz.js
    function assignHoverImages(products) {
        const categories = {};
        products.forEach(p => {
            if (!categories[p.category]) categories[p.category] = [];
            categories[p.category].push(p.imageUrl);
        });
        return products.map(p => {
            const categoryImages = categories[p.category];
            let hoverImage = p.imageUrl;
            if (categoryImages.length > 1) {
                let otherImages = categoryImages.filter(img => img !== p.imageUrl);
                if (otherImages.length > 0) {
                    hoverImage = otherImages[Math.floor(Math.random() * otherImages.length)];
                }
            }
            return { ...p, hoverImageUrl: hoverImage };
        });
    }

    const productsWithHover = assignHoverImages(allProductsData);
    const productGrid = document.getElementById('category-product-grid');

    // This function is also copied from naaz.js
    function renderProducts(productsToDisplay) {
        if (!productGrid) return;
        productGrid.innerHTML = '';
        if (productsToDisplay.length === 0) {
            productGrid.innerHTML = `<p class="no-products-message">No products found in this category yet. Check back soon!</p>`;
            return;
        }
        productsToDisplay.forEach((product, index) => {
            const productId = `cat-prod-${index}`;
            const priceHTML = product.oldPrice ? `<del>₹${product.oldPrice.toLocaleString('en-IN')}</del> ₹${product.price.toLocaleString('en-IN')}` : `₹${product.price.toLocaleString('en-IN')}`;
            const badgeHTML = product.badgeText ? `<span class="product-badge ${product.badgeType || 'new'}">${product.badgeText}</span>` : '';
            const productCardHTML = `
                <div class="product-card visible">
                    <div class="product-image-container">
                        <img class="product-img-primary" src="${product.imageUrl}" alt="${product.name}">
                        <img class="product-img-hover" src="${product.hoverImageUrl}" alt="${product.name} - hover view">
                        <div class="product-hover-overlay">
                            <button class="btn btn-quick-view" data-product-id="${productId}"><i class="fas fa-eye"></i> Quick View</button>
                        </div>
                        ${badgeHTML}
                    </div>
                    <div class="product-info"><h3>${product.name}</h3><p class="product-price">${priceHTML}</p><div class="product-actions"><button class="btn btn-add-to-cart"><i class="fas fa-cart-plus"></i> <span>Add to Cart</span></button><button class="btn-wishlist" aria-label="Add to wishlist"><i class="far fa-heart"></i></button></div></div>
                </div>`;
            productGrid.innerHTML += productCardHTML;
        });
        // You can add the logic for cart/wishlist buttons here if needed,
        // or link to a shared script file.
    }

    // ✅ NEW: Logic to determine the category from the filename
    function getCategoryFromURL() {
        const path = window.location.pathname;
        const filename = path.substring(path.lastIndexOf('/') + 1);
        
        // Map filenames to categories
        const categoryMap = {
            'living-room.html': ['Sofa', 'Table', 'Chair'], // Living room can have these
            'bedroom.html': ['Bed'],
            'dining.html': ['Table', 'Chair'],
            'outdoor-living.html': ['Swing', 'Planter', 'Chair'],
            'decor-lighting.html': ['Planter'], // Add more as needed
            'office-furniture.html': ['Table', 'Chair'],
            'new-arrivals.html': ['New'], // Filter by badge
            'collections.html': [] // Special case for all
        };

        const categories = categoryMap[filename] || [];
        
        if (filename === 'new-arrivals.html') {
             return productsWithHover.filter(p => p.badgeType === 'new');
        }
        if (filename === 'collections.html') {
            return productsWithHover; // Show all products
        }

        return productsWithHover.filter(p => categories.includes(p.category));
    }
    
    // Initial Load for the category page
    const categoryProducts = getCategoryFromURL();
    renderProducts(categoryProducts);

    // Set the active link in the navigation
    const navLinks = document.querySelectorAll('.main-nav a');
    const currentPath = window.location.pathname.split('/').pop();
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

});