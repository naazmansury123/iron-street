document.addEventListener('DOMContentLoaded', function() {

    // --- Preloader Variables & Setup ---
    const preloaderElement = document.getElementById('preloader');
    const loadingIconElement = document.getElementById('loadingIcon');
    const mainContentElement = document.getElementById('main-content');
    let preloaderFallbackTimeout;

    function hidePreloader(force = false) {
        if (preloaderElement && (force || !preloaderElement.classList.contains('loaded'))) {
            preloaderElement.classList.add('loaded');
        }
        if (mainContentElement && (mainContentElement.style.display === 'none' || force)) {
            mainContentElement.style.display = 'block';
            checkScrollAnimations();
        }
        document.body.classList.remove('preloader-active');
        if (preloaderFallbackTimeout) clearTimeout(preloaderFallbackTimeout);
    }

    if (preloaderElement && loadingIconElement) {
        document.body.classList.add('preloader-active');
        preloaderFallbackTimeout = setTimeout(() => hidePreloader(true), 7000);
        window.addEventListener('load', () => {
            setTimeout(() => hidePreloader(false), 300);
        });
    } else { 
        if (mainContentElement) mainContentElement.style.display = 'block';
        checkScrollAnimations();
    }

    // --- Hero Carousel ---
    const heroCarouselContainer = document.querySelector('.hero-section .carousel-container');
    if (heroCarouselContainer) {
        const heroSlides = Array.from(heroCarouselContainer.children).filter(child => child.classList.contains('carousel-slide'));
        const heroPrevButton = document.querySelector('.hero-section .carousel-control.prev');
        const heroNextButton = document.querySelector('.hero-section .carousel-control.next');
        let currentHeroSlideIndex = 0;
        let heroSlideInterval;
        const heroSlideDuration = 7000;

        function showHeroSlide(index) {
            heroSlides.forEach((slide) => slide.classList.remove('active-slide'));
            if (heroSlides[index]) {
                heroSlides[index].classList.add('active-slide');
            }
        }
        function nextHeroSlide() { currentHeroSlideIndex = (currentHeroSlideIndex + 1) % heroSlides.length; showHeroSlide(currentHeroSlideIndex); }
        function prevHeroSlide() { currentHeroSlideIndex = (currentHeroSlideIndex - 1 + heroSlides.length) % heroSlides.length; showHeroSlide(currentHeroSlideIndex); }
        function startHeroSlideShow() { stopHeroSlideShow(); heroSlideInterval = setInterval(nextHeroSlide, heroSlideDuration); }
        function stopHeroSlideShow() { clearInterval(heroSlideInterval); }

        if (heroSlides.length > 0) {
            showHeroSlide(currentHeroSlideIndex);
            if (heroNextButton && heroPrevButton) {
                heroNextButton.addEventListener('click', () => { nextHeroSlide(); stopHeroSlideShow(); startHeroSlideShow(); });
                heroPrevButton.addEventListener('click', () => { prevHeroSlide(); stopHeroSlideShow(); startHeroSlideShow(); });
            }
            startHeroSlideShow();
            heroCarouselContainer.addEventListener('mouseenter', stopHeroSlideShow);
            heroCarouselContainer.addEventListener('mouseleave', startHeroSlideShow);
        }
    }

    // --- Generic Slider Function ---
    function initializeSlider(sliderSelector, cardSelector) {
        const sliderContainer = document.querySelector(sliderSelector);
        if (!sliderContainer) return;

        const track = sliderContainer.querySelector(`${sliderSelector}-track`);
        const nextButton = sliderContainer.querySelector(`${sliderSelector}-control.next`);
        const prevButton = sliderContainer.querySelector(`${sliderSelector}-control.prev`);

        if (!track || !nextButton || !prevButton) return;

        const slides = Array.from(track.children).filter(child => child.matches(cardSelector));
        if (slides.length === 0) {
            if (nextButton) nextButton.style.display = 'none';
            if (prevButton) prevButton.style.display = 'none';
            return;
        }
        
        let currentIndex = 0;
        let itemsPerView = 3;
        let slideWidth = 0;

        function calculateSliderItemsAndWidth() {
            if (slides.length === 0) return;
            const screenWidth = window.innerWidth;

            if (sliderSelector.includes('testimonial')) {
                if (screenWidth <= 768) itemsPerView = 1;
                else if (screenWidth <= 1024) itemsPerView = 2;
                else itemsPerView = 3;
            } else { 
                if (screenWidth <= 768) itemsPerView = 1;
                else if (screenWidth <= 992) itemsPerView = 2;
                else itemsPerView = 3;
            }
            
            if (slides[0]) {
                const slideStyle = getComputedStyle(slides[0]);
                slideWidth = slides[0].offsetWidth + parseInt(slideStyle.marginLeft) + parseInt(slideStyle.marginRight);
            } else {
                slideWidth = 0;
            }
        }

        function updateSliderControls() {
            prevButton.disabled = currentIndex === 0;
            const maxPossibleIndex = slides.length - itemsPerView;
            nextButton.disabled = currentIndex >= maxPossibleIndex || slides.length <= itemsPerView;

        }

        function showSlides() {
            if (slides.length === 0 || !track || slideWidth === 0) {
                 updateSliderControls();
                return;
            }
            calculateSliderItemsAndWidth(); 

            const maxIndex = Math.max(0, slides.length - itemsPerView);
            currentIndex = Math.min(currentIndex, maxIndex);
            currentIndex = Math.max(0, currentIndex);

            const newTransformValue = -currentIndex * slideWidth;
            track.style.transform = `translateX(${newTransformValue}px)`;
            updateSliderControls();
        }

        nextButton.addEventListener('click', () => {
            if (currentIndex < slides.length - itemsPerView) {
                currentIndex++;
                showSlides();
            }
        });
        prevButton.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                showSlides();
            }
        });
        window.addEventListener('resize', showSlides);
        
        calculateSliderItemsAndWidth();
        showSlides(); 
    }

    initializeSlider('.testimonial-slider-container', '.testimonial-card');

    // =======================================================
    // --- MASTER PRODUCT DATA ARRAY ---
    // =======================================================
    const allProductsData = [
        // --- Featured Products (These will show on the main "All" view) ---
        { name: "Elegant Velvet Sofa", price: 55000, oldPrice: 75000, imageUrl: "https://ironstreets.com/storage/products/tables/5e51a3d1-b0ca-4f37-8ccb-d0f67041af5f-300x300.webp", badgeText: "Sale", badgeType: "sale", category: "Sofa", isFeatured: true },
        { name: "Modern Oak Bed Frame", price: 12600, oldPrice: 16800, imageUrl: "https://ironstreets.com/storage/products/beds/4c60c014-f0ce-4e3a-9e71-abb835bf8c21-300x300.webp", badgeText: "New", badgeType: "new", category: "Bed", isFeatured: true },
        { name: "Minimalist Dining Chair", price: 5500, oldPrice: 7200, imageUrl: "https://ironstreets.com/storage/products/chairs/29b965e0-52fc-4557-8128-11a71344966b-300x300.webp", badgeText: "Popular", badgeType: "popular", category: "Chair", isFeatured: true },
        { name: "Rustic Coffee Table", price: 9800, oldPrice: 11490, imageUrl: "https://ironstreets.com/storage/products/tables/97e2298b-71a5-4362-bcbd-4f70e3df6c50-300x300.webp", badgeText: null, badgeType: null, category: "Table", isFeatured: true },
        { name: "Plush L-Shape Sectional", price: 55000, oldPrice: null, imageUrl: "https://ironstreets.com/storage/products/tables/46a4c6ca-e356-4f4c-866e-15baf59ddde4-300x300.webp", badgeText: "Sale", badgeType: "sale", category: "Sofa", isFeatured: true },
        { name: "King Size Upholstered Bed", price: 12000, oldPrice: null, imageUrl: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcQ6gDKpF4uV3q7N9CK0dt3bnkrcEtbd6o1U9TE6NnX959weQcIUd2qhvJ3lqHTe66Jipfwh7yHsvG-o7I9ZIgpCaHur1PIawLMj6ozx711x", badgeText: "Eco Choice", badgeType: "eco-choice", category: "Bed", isFeatured: true },
        { name: "Industrial Bar Chair", price: 3999, oldPrice: 4999, imageUrl: "https://ironstreets.com/storage/products/chairs/fedd305c-94ab-4c04-94aa-535969c3f314-300x300.webp", badgeText: "New", badgeType: "new", category: "Chair", isFeatured: true },
        { name: "Sheesham Wood Study Table", price: 4999, oldPrice: 5999, imageUrl: "https://ironstreets.com/storage/products/tables/278f1035-cff3-4973-94ef-cf0cbf7cbf42-300x300.webp?v=1739363818", badgeText: "Sale", badgeType: "sale", category: "Table", isFeatured: true },
        { name: "Compact Two-Seater Sofa", price: 22000, oldPrice: 31600, imageUrl: "https://ironstreets.com/storage/general/208d2db8-f47a-4ae7-b416-d8ac794f96a6-300x300.webp?v=1738144471", badgeText: null, badgeType: null, category: "Sofa", isFeatured: true },
        { name: "Tribesigns 6-Tier Tall Metal Plant Stand", price: 12000, oldPrice: 15600, imageUrl: "https://ironstreets.com/storage/products/planter/a1c9b536-c7a0-4d62-96c5-e54b0b103c0d-300x300.webp", badgeText: "Popular", badgeType: "popular", category: "Planter", isFeatured: true },
        { name: "The Tranquil Garden Swing (3 seater)", price: 24300, oldPrice: 32400, imageUrl: "https://ironstreets.com/storage/products/swings/ac3ad56d-6fc8-44da-8bf6-27dc68c793d8-300x300.webp", badgeText: "New", badgeType: "new", category: "Swing", isFeatured: true },
        { name: "Illuminated Outdoor Plant Stand", price: 3500, oldPrice: 5000, imageUrl: "https://ironstreets.com/storage/products/planter/5ceb1b04-b665-410e-809a-49cf6a92c570-300x300.webp", badgeText: "Eco Choice", badgeType: "eco-choice", category: "Planter", isFeatured: true },

        // --- Additional Chairs (Not Featured) ---
        { name: "Modern Accent Chair", price: 8999, oldPrice: null, imageUrl: "images/chair0.jpg", category: "Chair", isFeatured: false },
        { name: "Classic Wooden Rocking Chair", price: 12500, oldPrice: 15000, imageUrl: "images/chair01.webp", category: "Chair", isFeatured: false },
        { name: "Velvet Wingback Chair", price: 11000, oldPrice: null, imageUrl: "images/chair.jpg", category: "Chair", isFeatured: false },
        { name: "Leather Lounge Chair", price: 21000, oldPrice: 25000, imageUrl: "images/chair12.jpeg", category: "Chair", isFeatured: false },
        { name: "Metal Cafe Chair (Set of 2)", price: 6500, oldPrice: null, imageUrl: "images/chair13.jpg", category: "Chair", isFeatured: false },
        { name: "Bohemian Rattan Chair", price: 9200, oldPrice: null, imageUrl: "images/chair14.jpg", category: "Chair", isFeatured: false },
        { name: "Ergonomic Study Chair", price: 7800, oldPrice: 9500, imageUrl: "images/chair14.jpg", category: "Chair", isFeatured: false },
        { name: "Folding Balcony Chair", price: 2999, oldPrice: null, imageUrl: "images/chair15.jpg", category: "Chair", isFeatured: false },
        { name: "Fabric Armchair", price: 14500, oldPrice: null, imageUrl: "images/chair16.jpg", category: "Chair", isFeatured: false },
        { name: "Puffy Ottoman Stool", price: 4200, oldPrice: 5500, imageUrl: "images/chair3.JPG", category: "Chair", isFeatured: false },
        
        // --- Additional Sofas (Not Featured) ---
        { name: "Reva Cocoon Outdoor Sofa", price: 15300, oldPrice: 18000, imageUrl: "https://ironstreets.com/storage/products/tables/44462891-ae87-4cd8-8d98-c1c4cdb52e38-300x300.webp", category: "Sofa", isFeatured: false },
        { name: "Sofa Cum Bed with Storage", price: 18000, oldPrice: 15300, imageUrl: "https://ironstreets.com/storage/products/sofa/efb96d83-fdc3-49fa-8e42-c601aa6435b8-300x300.JPG?v=1736846842", category: "Sofa", isFeatured: false },
        { name: "Nordic Style 3-Seater Sofa", price: 42500, oldPrice: 55000, imageUrl: "images/naac.webp", category: "Sofa", isFeatured: false },
        { name: "Sofa Design 1", price: 18000, oldPrice: 20000, imageUrl: "images/1sofa.jpg", category: "Sofa", isFeatured: false },
        { name: "Sofa Design 2", price: 18000, oldPrice: 20000, imageUrl: "images/sofaInter.JPG", category: "Sofa", isFeatured: false },
        { name: "Sofa Design 3", price: 18000, oldPrice: 20000, imageUrl: "images/sofa02.jpg", category: "Sofa", isFeatured: false },
        { name: "Sofa Design 4", price: 18000, oldPrice: 20000, imageUrl: "images/sofa4.jpg", category: "Sofa", isFeatured: false },
        { name: "Sofa Design 5", price: 18000, oldPrice: 20000, imageUrl: "images/sofaa2.jpg", category: "Sofa", isFeatured: false },
        { name: "Sofa Design 6", price: 18000, oldPrice: 20000, imageUrl: "images/sofaL.jpg", category: "Sofa", isFeatured: false },

        // --- Additional Planters (Not Featured) ---
        { name: "Minimalist Ceramic Planter Pot", price: 1200, oldPrice: 1500, imageUrl: "https://www.ironstreets.com/storage/products/planter/caa15cae-6c40-4f40-a6c3-bf4d9203c342-300x300.webp", badgeText: "Sale", badgeType: "sale", category: "Planter", isFeatured: false },
        { name: "Hanging Macrame Plant Holder", price: 899, oldPrice: null, imageUrl: "https://www.ironstreets.com/storage/products/planter/2bb94d6b-ddb2-4e99-bf3d-98960f324919-300x300.webp", badgeText: "New", badgeType: "new", category: "Planter", isFeatured: false },
        { name: "Tiered Wooden Plant Stand", price: 2800, oldPrice: 3500, imageUrl: "https://www.ironstreets.com/storage/products/planter/048ee25e-678d-404a-a795-b44eeb2af1ec-300x300.webp", badgeText: "Popular", badgeType: "popular", category: "Planter", isFeatured: false },
        { name: "Modern Metal Wall Planter", price: 2100, oldPrice: null, imageUrl: "https://www.ironstreets.com/storage/products/planter/cff6fc60-2156-473c-a572-eeed48589674-300x300.webp", badgeText: null, badgeType: null, category: "Planter", isFeatured: false },
        { name: "Self-Watering Planter Box", price: 1750, oldPrice: 2200, imageUrl: "https://www.ironstreets.com/storage/products/planter/3e7444f2-fbee-4dec-a285-2af6794409ff-300x300.webp", badgeText: "Sale", badgeType: "sale", category: "Planter", isFeatured: false },
        { name: "Geometric Terrarium Case", price: 3200, oldPrice: null, imageUrl: "https://www.ironstreets.com/storage/products/planter/9e57cda5-e055-4e9b-b79b-a6add79c1db3-300x300.webp", badgeText: "Eco Choice", badgeType: "eco-choice", category: "Planter", isFeatured: false },
        { name: "Rustic Barrel Planter", price: 4500, oldPrice: 5500, imageUrl: "https://www.ironstreets.com/storage/products/planter/184261cf-360f-4ac0-943a-247dec0b4fea-300x300.webp", badgeText: "New", badgeType: "new", category: "Planter", isFeatured: false },
        { name: "Set of 3 Small Succulent Pots", price: 999, oldPrice: 1300, imageUrl: "https://www.ironstreets.com/storage/products/planter/4e33e70f-5ba4-40cb-b961-2c8ca3e24412-300x300.webp", badgeText: null, badgeType: null, category: "Planter", isFeatured: false },
        { name: "Set of 3 Small Succulent Pots", price: 999, oldPrice: 1300, imageUrl: "https://www.ironstreets.com/storage/products/planter/55b3371b-5a0a-41ea-9b98-52e63b39460a-300x300.webp", badgeText: null, badgeType: null, category: "Planter", isFeatured: false },
        { name: "Set of 3 Small Succulent Pots", price: 999, oldPrice: 1300, imageUrl: "https://www.ironstreets.com/storage/products/planter/88906f7e-61a7-43e5-b57d-3b6117251f80-300x300.webp", badgeText: null, badgeType: null, category: "Planter", isFeatured: false }
    ];

    const productGrid = document.getElementById('product-listing-grid');

    function renderProducts(productsToDisplay) {
        if (!productGrid) return;
        productGrid.innerHTML = ''; // Clear existing products

        productsToDisplay.forEach((product, index) => {
            const productId = `sheet-prod-${product.name.replace(/\s+/g, '-')}-${index}`;
            const priceHTML = product.oldPrice 
                ? `<del>₹${product.oldPrice.toLocaleString('en-IN')}</del> ₹${product.price.toLocaleString('en-IN')}`
                : `₹${product.price.toLocaleString('en-IN')}`;
            
            const badgeHTML = product.badgeText 
                ? `<span class="product-badge ${product.badgeType || 'new'}">${product.badgeText}</span>` 
                : '';

            const productCardHTML = `
                <div class="product-card">
                    <div class="product-image-container">
                        <img src="${product.imageUrl}" alt="${product.name}">
                        <div class="product-hover-overlay">
                            <button class="btn btn-quick-view" data-product-id="${productId}"><i class="fas fa-eye"></i> Quick View</button>
                        </div>
                        ${badgeHTML}
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p class="product-price">${priceHTML}</p>
                        <div class="product-actions">
                            <button class="btn btn-add-to-cart"><i class="fas fa-cart-plus"></i> <span>Add to Cart</span></button>
                            <button class="btn-wishlist" aria-label="Add to wishlist"><i class="far fa-heart"></i></button>
                        </div>
                    </div>
                </div>
            `;
            productGrid.innerHTML += productCardHTML;
        });
        
        const cards = productGrid.querySelectorAll('.product-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('visible');
            }, index * 80);
        });

        initializeProductCardActions(productGrid);
    }
    
    function setupProductFilters() {
        const filterContainer = document.querySelector('.product-filters');
        if (!filterContainer) return;

        filterContainer.addEventListener('click', function(e) {
            if (e.target && e.target.matches('button.filter-btn')) {
                const category = e.target.dataset.category;

                filterContainer.querySelector('.active').classList.remove('active');
                e.target.classList.add('active');
                
                let filteredProducts;
                
                if (category === 'All') {
                    // If "All" is clicked, show ONLY the featured products
                    filteredProducts = allProductsData.filter(p => p.isFeatured);
                } else {
                    // If any other category is clicked, show ALL products from that category
                    filteredProducts = allProductsData.filter(p => p.category === category);
                }
                
                renderProducts(filteredProducts);
            }
        });
    }

    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.15 };
    function checkScrollAnimations() {
        const animatedElements = document.querySelectorAll('.animate-scroll, .section-title, .stagger-item');
        if (typeof IntersectionObserver === 'undefined') {
            animatedElements.forEach(el => el.classList.add('is-visible'));
            return;
        }
        const scrollObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    if (entry.target.classList.contains('stagger-item')) {
                        const parent = entry.target.parentElement;
                        if (parent && parent.children) {
                            const allStaggerItemsInParent = Array.from(parent.children).filter(el => el.classList.contains('stagger-item') && !el.classList.contains('is-visible'));
                            const itemIndex = allStaggerItemsInParent.indexOf(entry.target);
                            if (itemIndex > -1) entry.target.style.transitionDelay = `${itemIndex * 0.12}s`;
                        }
                    }
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        animatedElements.forEach(el => {
            if (!el.classList.contains('is-visible')) {
                scrollObserver.observe(el);
            }
        });
    }

    if (mainContentElement && mainContentElement.style.display !== 'none') {
        checkScrollAnimations();
    }

    const parallaxBanner = document.querySelector('.parallax-banner');
    if (parallaxBanner) {
        window.addEventListener('scroll', function() {
            if (window.innerWidth < 768) {
                parallaxBanner.style.backgroundAttachment = 'scroll';
                return;
            }
            parallaxBanner.style.backgroundAttachment = 'fixed';
            let offset = window.pageYOffset;
            const rect = parallaxBanner.getBoundingClientRect();
            if (rect.bottom >= 0 && rect.top <= window.innerHeight) {
                 parallaxBanner.style.backgroundPositionY = (offset - parallaxBanner.offsetTop) * 0.4 + "px";
            }
        });
    }
    
    function getProductDetails(buttonElement) {
        const productCard = buttonElement.closest('.product-card');
        if (!productCard) return null;

        const quickViewButton = productCard.querySelector('.btn.btn-quick-view');
        let productId = quickViewButton ? quickViewButton.dataset.productId : null;
        const productNameElement = productCard.querySelector('.product-info h3');
        const productName = productNameElement ? productNameElement.textContent.trim() : 'Unknown Product';
        if (!productId) productId = productName.replace(/\s+/g, '-').toLowerCase() + '-' + Math.random().toString(36).substr(2, 5);

        const productPriceElement = productCard.querySelector('.product-price');
        let productPrice = 0;
        if (productPriceElement) {
            const priceText = productPriceElement.textContent;
            const priceMatch = priceText.match(/₹([\d,]+\.?\d*)/);
            if (priceMatch && priceMatch[1]) productPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
             else console.warn(`Could not parse price for ${productName}: "${priceText}"`);
        } else {
            console.warn(`Price element not found for ${productName}`);
        }

        const productImageElement = productCard.querySelector('.product-image-container img');
        const productImage = productImageElement ? productImageElement.src : 'placeholder.png';
        const badgeElement = productCard.querySelector('.product-badge');
        let productBadge = null;
        if (badgeElement) productBadge = { text: badgeElement.textContent.trim(), type: badgeElement.className.split(' ').find(cls => cls !== 'product-badge') || 'new' };

        return { id: productId, name: productName, price: productPrice, image: productImage, badge: productBadge };
    }

    function addToCart(product) {
        if (!product || !product.id) { console.error("Product details missing for addToCart."); return; }
        let cart = JSON.parse(localStorage.getItem('ecoCart')) || [];
        const existingItemIndex = cart.findIndex(item => item.id === product.id);
        if (existingItemIndex > -1) cart[existingItemIndex].quantity += 1;
        else cart.push({ ...product, quantity: 1 });
        localStorage.setItem('ecoCart', JSON.stringify(cart));
        updateHeaderCartCount();
    }

    function updateHeaderCartCount() {
        const cart = JSON.parse(localStorage.getItem('ecoCart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        document.querySelectorAll('.cart-count').forEach(el => { if (el) el.textContent = `(${totalItems})`; });
    }

    function addToWishlistStorage(product) {
        if (!product || !product.id) { console.error("Product details missing for addToWishlistStorage."); return false; }
        let wishlist = JSON.parse(localStorage.getItem('ecoWishlist')) || [];
        if (!wishlist.find(item => item.id === product.id)) {
            wishlist.push(product);
            localStorage.setItem('ecoWishlist', JSON.stringify(wishlist));
            updateHeaderWishlistCount();
            return true;
        }
        return false;
    }

    function removeFromWishlistStorage(productId) {
        let wishlist = JSON.parse(localStorage.getItem('ecoWishlist')) || [];
        wishlist = wishlist.filter(item => item.id !== productId);
        localStorage.setItem('ecoWishlist', JSON.stringify(wishlist));
        updateHeaderWishlistCount();
    }

    function isProductInWishlist(productId) {
        const wishlist = JSON.parse(localStorage.getItem('ecoWishlist')) || [];
        return wishlist.some(item => item.id === productId);
    }

    function updateHeaderWishlistCount() {
        const wishlist = JSON.parse(localStorage.getItem('ecoWishlist')) || [];
        document.querySelectorAll('.wishlist-count').forEach(el => { if (el) el.textContent = `(${wishlist.length})`; });
    }

    function loadWishlistStatus(container) {
        container.querySelectorAll('.btn-wishlist').forEach(button => {
            const productDetails = getProductDetails(button);
            if (productDetails && isProductInWishlist(productDetails.id)) {
                button.classList.add('active');
                const heartIcon = button.querySelector('i');
                if (heartIcon) heartIcon.className = 'fas fa-heart';
            }
        });
    }
    
    function initializeProductCardActions(container) {
        container.querySelectorAll('.btn-quick-view').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.dataset.productId;
                alert(`Quick View for Product ID: ${productId}. Implement modal here.`);
            });
        });

        container.querySelectorAll('.btn-add-to-cart').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const productDetails = getProductDetails(this);
                if (!productDetails) { alert('Error: Could not get product details.'); return; }
                if (productDetails.price === 0) {
                     alert(`Error: Price for ${productDetails.name} is invalid. Cannot add to cart.`);
                     console.error(`Product price for ${productDetails.name} was parsed as 0.`);
                     return;
                }

                const buttonTextSpan = this.querySelector('span');
                const originalText = buttonTextSpan ? buttonTextSpan.textContent : 'Add to Cart';
                const icon = this.querySelector('i');
                const originalIconClass = icon ? icon.className : 'fas fa-cart-plus';
                if (this.classList.contains('adding')) return;
                this.classList.add('adding');
                if(buttonTextSpan) buttonTextSpan.textContent = 'Adding...';
                if(icon) icon.className = 'fas fa-spinner fa-spin';

                setTimeout(() => {
                    addToCart(productDetails);
                    if(icon) icon.className = 'fas fa-check';
                    if(buttonTextSpan) buttonTextSpan.textContent = 'Added!';
                    const cartIconHeader = document.querySelector('.header-actions .cart-link i.fa-shopping-cart');
                    if (cartIconHeader) {
                        cartIconHeader.classList.add('cart-icon-updated');
                        setTimeout(() => cartIconHeader.classList.remove('cart-icon-updated'), 600);
                    }
                    setTimeout(() => {
                        this.classList.remove('adding');
                        if(icon) icon.className = originalIconClass;
                        if(buttonTextSpan) buttonTextSpan.textContent = originalText;
                    }, 1800);
                }, 1000);
            });
        });

        container.querySelectorAll('.btn-wishlist').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const productDetails = getProductDetails(this);
                if (!productDetails) { alert('Error: Could not get product details for wishlist.'); return; }
                const heartIcon = this.querySelector('i');
                if (this.classList.contains('active')) {
                    removeFromWishlistStorage(productDetails.id);
                    this.classList.remove('active');
                    if (heartIcon) heartIcon.className = 'far fa-heart';
                } else {
                    if(addToWishlistStorage(productDetails)) {
                        this.classList.add('active');
                        if (heartIcon) heartIcon.className = 'fas fa-heart';
                    }
                }
            });
        });
        
        loadWishlistStatus(container);
    }
    
    window.addEventListener('scroll', function() {
        const header = document.querySelector('header');
        const scrollThreshold = 50;
        if (header) {
            if (window.pageYOffset > scrollThreshold) header.classList.add('header-scrolled');
            else header.classList.remove('header-scrolled');
        }
    });

    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // --- INITIALIZATION ---
    updateHeaderCartCount();
    updateHeaderWishlistCount();

    // This was the problematic line. It's now removed.
    // initializeProductCardActions(document); 
    
    const featuredProducts = allProductsData.filter(p => p.isFeatured);
    renderProducts(featuredProducts); 
    setupProductFilters();
    
    // --- NEW: Landing Page Slider ---
    function initializeLandingPageSlider() {
        const slider = document.querySelector('.landing-page-slider');
        if (!slider) return;

        const track = slider.querySelector('.lps-track');
        const slides = Array.from(track.querySelectorAll('.lps-slide'));
        const nextButton = slider.querySelector('.lps-arrow.next');
        const prevButton = slider.querySelector('.lps-arrow.prev');
        const dotsNav = slider.querySelector('.lps-dots');

        if (slides.length <= 1) {
            if(nextButton) nextButton.style.display = 'none';
            if(prevButton) prevButton.style.display = 'none';
            if(dotsNav) dotsNav.style.display = 'none';
            return;
        }

        let currentSlideIndex = 0;
        let slideInterval;

        // Create dots
        slides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.classList.add('lps-dot');
            dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
            dotsNav.appendChild(dot);
        });

        const dots = Array.from(dotsNav.querySelectorAll('.lps-dot'));

        const moveToSlide = (targetIndex) => {
            if (targetIndex === currentSlideIndex && slides[targetIndex].classList.contains('active')) return;

            slides.forEach(slide => slide.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));
            
            currentSlideIndex = targetIndex;

            slides[currentSlideIndex].classList.add('active');
            dots[currentSlideIndex].classList.add('active');
        };

        const startAutoplay = () => {
            stopAutoplay();
            slideInterval = setInterval(() => {
                const nextIndex = (currentSlideIndex + 1) % slides.length;
                moveToSlide(nextIndex);
            }, 6000); // 6-second interval
        };

        const stopAutoplay = () => {
            clearInterval(slideInterval);
        };

        nextButton.addEventListener('click', () => {
            const nextIndex = (currentSlideIndex + 1) % slides.length;
            moveToSlide(nextIndex);
            stopAutoplay();
            startAutoplay();
        });

        prevButton.addEventListener('click', () => {
            const prevIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
            moveToSlide(prevIndex);
            stopAutoplay();
            startAutoplay();
        });

        dotsNav.addEventListener('click', e => {
            const targetDot = e.target.closest('.lps-dot');
            if (!targetDot) return;

            const targetIndex = dots.findIndex(dot => dot === targetDot);
            if (targetIndex !== currentSlideIndex) {
                moveToSlide(targetIndex);
                stopAutoplay();
                startAutoplay();
            }
        });

        // Initialize
        moveToSlide(0);
        startAutoplay();
        
        slider.addEventListener('mouseenter', stopAutoplay);
        slider.addEventListener('mouseleave', startAutoplay);
    }
    
    // Call the new slider initialization function
    initializeLandingPageSlider();
});