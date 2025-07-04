// cart.js (Corrected with Robust ID Handling for Universal Item Removal)
document.addEventListener('DOMContentLoaded', function() {
    const orderItemsContainer = document.getElementById('order-items-container');
    const summarySubtotalEl = document.getElementById('summary-subtotal');
    const summaryShippingEl = document.getElementById('summary-shipping');
    const summaryTotalEl = document.getElementById('summary-total');
    const discountCodeInput = document.getElementById('discount-code');
    const applyDiscountBtn = document.getElementById('apply-discount-btn');
    const removeDiscountBtn = document.getElementById('remove-discount-btn');
    const discountAppliedRow = document.getElementById('discount-applied-row');
    const summaryDiscountEl = document.getElementById('summary-discount');
    const payNowBtn = document.querySelector('.btn-pay-now');
    const deliveryOptions = document.querySelectorAll('.delivery-option input[name="delivery_method"]');
    const shippingAddressForm = document.getElementById('shipping-address-form');
    const pickupLocationInfo = document.getElementById('pickup-location-info');

    let currentSubtotal = 0;
    const shippingCost = 10.00; // Fixed shipping: ₹10.00
    let discountAmount = 0;
    const validDiscountCode = "SAVE10";
    let discountPercentage = 0.10;

    const BACKEND_URL = 'http://localhost:5001/api/payments';

    function updateHeaderCartCountGlobal() {
        const cart = JSON.parse(localStorage.getItem('ecoCart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const headerCartCountElements = document.querySelectorAll('.cart-count');
        headerCartCountElements.forEach(el => {
            if (el) el.textContent = `(${totalItems})`;
        });
    }

    function loadCartItems() {
        const cart = JSON.parse(localStorage.getItem('ecoCart')) || [];
        orderItemsContainer.innerHTML = '';
        currentSubtotal = 0;

        if (cart.length === 0) {
            orderItemsContainer.innerHTML = '<p style="text-align:center; color: var(--text-light);">Your cart is empty.</p>';
            payNowBtn.disabled = true;
            applyDiscountBtn.disabled = true;
            removeDiscountBtn.style.display = 'none';
            discountAppliedRow.style.display = 'none';
        } else {
            payNowBtn.disabled = false;
            cart.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('order-item');
                const itemPrice = parseFloat(item.price) || 0;
                const itemQuantity = parseInt(item.quantity) || 0;
                const itemTotal = itemPrice * itemQuantity;
                const itemTotalDisplayPrice = itemTotal.toFixed(2);
                itemElement.innerHTML = `
                    <div class="order-item-image">
                        <img src="${item.image || 'placeholder.png'}" alt="${item.name}">
                        <span class="item-quantity-badge">${itemQuantity}</span>
                    </div>
                    <div class="order-item-details">
                        <h4>${item.name}</h4>
                        <p>${item.variant || 'Standard'}</p> 
                    </div>
                    <div class="order-item-price-controls">
                         <strong class="order-item-price">₹${itemTotalDisplayPrice}</strong>
                         <button class="btn-remove-item" data-product-id="${item.id}" title="Remove item">
                            <i class="fas fa-times"></i> Remove
                         </button>
                    </div>`;
                orderItemsContainer.appendChild(itemElement);
                currentSubtotal += itemTotal;
            });
        }
        updateSummary();
        updateHeaderCartCountGlobal();
    }
    
    // Using Event Delegation on the container for robust event handling
    orderItemsContainer.addEventListener('click', function(event) {
        const removeButton = event.target.closest('.btn-remove-item');
        if (removeButton) {
            const productId = removeButton.dataset.productId;
            handleRemoveItem(productId);
        }
    });

    // ✅ ROBUST REMOVAL LOGIC
    function handleRemoveItem(productIdFromButton) {
        let cart = JSON.parse(localStorage.getItem('ecoCart')) || [];
        
        // This is the key fix: We compare by converting both the item's ID
        // and the button's ID to strings. This works for both numbers (5 vs "5")
        // and strings ("chair-abc" vs "chair-abc").
        const updatedCart = cart.filter(item => String(item.id) !== String(productIdFromButton));
        
        // Check if an item was actually removed before updating
        if (updatedCart.length < cart.length) {
            localStorage.setItem('ecoCart', JSON.stringify(updatedCart));
            loadCartItems(); // Reload the cart display and update totals
        } else {
            console.error(`Error: Could not remove item with ID "${productIdFromButton}". It was not found in the cart with a matching ID.`);
        }
    }

    function updateSummary() {
        summarySubtotalEl.textContent = `₹${currentSubtotal.toFixed(2)}`;
        let activeShippingCost = 0;
        const selectedDeliveryMethodEl = document.querySelector('input[name="delivery_method"]:checked');
        if (selectedDeliveryMethodEl) {
            if (selectedDeliveryMethodEl.value === 'ship' && currentSubtotal > 0) {
                activeShippingCost = shippingCost;
                summaryShippingEl.textContent = `₹${activeShippingCost.toFixed(2)}`;
            } else if (selectedDeliveryMethodEl.value === 'pickup') {
                summaryShippingEl.textContent = 'Store Pickup';
            } else {
                summaryShippingEl.textContent = 'Enter shipping address';
            }
        }
        if (discountAmount > 0) {
            summaryDiscountEl.textContent = `-₹${discountAmount.toFixed(2)}`;
            discountAppliedRow.style.display = 'flex';
        } else {
            discountAppliedRow.style.display = 'none';
        }
        const finalTotal = currentSubtotal - discountAmount + activeShippingCost;
        summaryTotalEl.textContent = `₹${(Math.max(0, finalTotal)).toFixed(2)}`;
        const currencyCodeEl = summaryTotalEl.parentElement.querySelector('.currency-code');
        if (currencyCodeEl) currencyCodeEl.textContent = "INR";

        if (discountAmount > 0) {
            discountCodeInput.disabled = true;
            applyDiscountBtn.style.display = 'none';
            removeDiscountBtn.style.display = 'inline-block';
        } else {
            discountCodeInput.disabled = false;
            applyDiscountBtn.style.display = 'inline-block';
            removeDiscountBtn.style.display = 'none';
            applyDiscountBtn.disabled = currentSubtotal === 0;
        }
    }

    applyDiscountBtn.addEventListener('click', function() {
        const code = discountCodeInput.value.trim().toUpperCase();
        if (code === validDiscountCode && currentSubtotal > 0) {
            discountAmount = currentSubtotal * discountPercentage;
            alert('Discount applied!');
            discountCodeInput.value = `Applied: ${code}`;
        } else if (currentSubtotal === 0) {
            alert('Cannot apply discount to an empty cart.');
        } else {
            alert('Invalid discount code.');
        }
        updateSummary();
    });

    removeDiscountBtn.addEventListener('click', function() {
        discountAmount = 0;
        discountCodeInput.value = '';
        alert('Discount removed.');
        updateSummary();
    });

    deliveryOptions.forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('.delivery-option').forEach(opt => opt.classList.remove('active'));
            this.closest('.delivery-option').classList.add('active');
            shippingAddressForm.style.display = this.value === 'ship' ? 'block' : 'none';
            pickupLocationInfo.style.display = this.value === 'pickup' ? 'block' : 'none';
            updateSummary();
        });
    });

    payNowBtn.addEventListener('click', async function(event) {
        event.preventDefault();
        payNowBtn.disabled = true;
        payNowBtn.textContent = 'Processing...';

        const getVal = id => document.getElementById(id)?.value.trim() || '';
        const email = getVal('email');
        const phone = getVal('phone');
        const lastName = getVal('last-name');
        const address = getVal('address');
        const city = getVal('city');
        const state = getVal('state');
        const zip = getVal('zip');

        if (!email || !phone || !lastName || !address || !city || !state || !zip) {
            alert('Please fill in all required contact and shipping fields.');
            payNowBtn.disabled = false;
            payNowBtn.textContent = 'Pay now';
            return;
        }

        const cart = JSON.parse(localStorage.getItem('ecoCart')) || [];
        if (cart.length === 0) {
            alert('Your cart is empty.');
            payNowBtn.disabled = false;
            payNowBtn.textContent = 'Pay now';
            return;
        }
        
        const calculatedFrontendSubtotal = cart.reduce((acc, item) => acc + (parseFloat(item.price || 0) * parseInt(item.quantity || 0)), 0);
        const frontendShippingValue = (document.querySelector('input[name="delivery_method"]:checked')?.value === 'ship' && calculatedFrontendSubtotal > 0) ? shippingCost : 0;
        const expectedFrontendTotalINR = calculatedFrontendSubtotal - discountAmount + frontendShippingValue;
        
        console.log("------ FRONTEND DATA FOR PAYMENT ------");
        console.log("Cart Items Sent to Backend:", JSON.stringify(cart, null, 2));
        console.log("Expected Frontend Final Total (INR):", Math.max(0, expectedFrontendTotalINR).toFixed(2));
        console.log("------------------------------------");

        const contactInfoForBackend = { email, phone, name: `${getVal('first-name')} ${lastName}`.trim() };
        const shippingAddressForBackend = { lastName, address, city, state, zip, phone };

        try {
            const response = await fetch(`${BACKEND_URL}/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cartItems: cart, contactInfo: contactInfoForBackend })
            });
            const orderData = await response.json();
            if (!response.ok) throw new Error(orderData.error || 'Failed to create order.');

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "IRON STREET",
                description: "Order Payment",
                image: "iron_logo.png",
                order_id: orderData.orderId,
                handler: async function(razorpayResponse) {
                    payNowBtn.textContent = 'Verifying Payment...';
                    const verificationResponse = await fetch(`${BACKEND_URL}/verify-payment`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...razorpayResponse,
                            cartItems: cart,
                            totalAmountInRupees: orderData.amount / 100,
                            shippingAddress: shippingAddressForBackend,
                            contactInfo: contactInfoForBackend,
                            discountApplied: discountAmount.toFixed(2)
                        })
                    });
                    const verificationData = await verificationResponse.json();
                    if (verificationResponse.ok && verificationData.status === 'success') {
                        alert(`Payment Successful! Order ID: ${verificationData.orderId}`);
                        localStorage.removeItem('ecoCart');
                        discountAmount = 0;
                        loadCartItems();
                        payNowBtn.textContent = 'Payment Complete!';
                        payNowBtn.style.backgroundColor = 'var(--success-color)';
                    } else {
                        throw new Error(verificationData.message || 'Payment verification failed.');
                    }
                },
                prefill: { name: contactInfoForBackend.name, email, contact: phone },
                theme: { color: "#AB241F" },
                modal: {
                    ondismiss: function() {
                        payNowBtn.disabled = false;
                        payNowBtn.textContent = 'Pay now';
                    }
                }
            };

            const rzp = new Razorpay(options);
            rzp.on('payment.failed', function(response) {
                alert(`Payment Failed: ${response.error.description}`);
                payNowBtn.disabled = false;
                payNowBtn.textContent = 'Payment Failed';
                payNowBtn.style.backgroundColor = 'var(--error-color)';
            });
            rzp.open();
        } catch (err) {
            console.error('Main Payment Flow Error:', err);
            alert(`Error: ${err.message}`);
            payNowBtn.disabled = false;
            payNowBtn.textContent = 'Pay now';
        }
    });

    loadCartItems();
    const initialDeliveryMethodEl = document.querySelector('input[name="delivery_method"]:checked');
    if (initialDeliveryMethodEl) {
        initialDeliveryMethodEl.closest('.delivery-option').classList.add('active');
        initialDeliveryMethodEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
});