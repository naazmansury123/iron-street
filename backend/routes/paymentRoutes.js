const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto'); // Built-in Node.js module for signature verification
const db = require('../config/db');

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// SERVER-SIDE PRICE CALCULATION IS CRITICAL
// backend/routes/paymentRoutes.js

// SERVER-SIDE PRICE CALCULATION IS CRITICAL
const calculateOrderAmount = async (cartItemsClient) => {
    let total = 0;
    const shippingCost = 5.00; // Example fixed shipping, adjust as needed

    const productIds = cartItemsClient.map(item => item.id);

    if (productIds.length === 0) {
        return shippingCost * 100; // Amount in paise
    }

    try {
        // Construct the placeholders for the IN clause: $1, $2, $3, etc.
        const placeholders = productIds.map((_, i) => `$${i + 1}`).join(',');
        const queryText = `SELECT id, price FROM products WHERE id IN (${placeholders})`; // <<< Query to DB
        
        // DEBUG: Log what's being sent to the database
        console.log("Backend: calculateOrderAmount - Product IDs from cart:", productIds);
        console.log("Backend: calculateOrderAmount - Query to DB:", queryText);

        const { rows: productsFromDB } = await db.query(queryText, productIds); // <<< Executing the query

        // DEBUG: Log what was received from the database
        console.log("Backend: calculateOrderAmount - Products fetched from DB:", productsFromDB);

        if (productsFromDB.length === 0 && cartItemsClient.length > 0) {
            console.error("Backend Error: Products from cart not found in DB for price calculation. IDs sent to DB query:", productIds);
            throw new Error("Could not calculate total. Product information error (some products not found in DB)."); // More specific error
        }

        for (const clientItem of cartItemsClient) {
            // Ensure consistent comparison (e.g., both strings, trim spaces)
            const dbProduct = productsFromDB.find(p => String(p.id).trim() === String(clientItem.id).trim());
            if (dbProduct && dbProduct.price !== null && !isNaN(parseFloat(dbProduct.price))) { // Check if price is a valid number
                total += parseFloat(dbProduct.price) * parseInt(clientItem.quantity, 10);
            } else {
                console.warn(`Backend Warning: Product ID '${clientItem.id}' (from cart) not found in DB product list OR price is invalid. Skipping. DB products checked:`, productsFromDB.map(p=>({id: p.id, price: p.price})));
                // For critical failure if any product is missing or has no price:
                throw new Error(`Product with ID ${clientItem.id} not found in database or has an invalid price. Order cannot be processed.`);
            }
        }
        const finalAmount = (total + shippingCost) * 100; // Amount in paise for Razorpay
        
        if (total > 0 && finalAmount < 100) { // Razorpay minimum is usually 1 INR (100 paise)
            console.error(`Backend Error: Calculated amount (Rs.${(total + shippingCost).toFixed(2)}) is too low for Razorpay.`);
            throw new Error("Order total is too low to process (minimum Rs. 1.00).");
        }
        if (total === 0 && cartItemsClient.length > 0) {
            // This means all items were either not found or had zero/invalid price
            console.error("Backend Error: Total calculated as zero despite items in cart. Check product prices in DB. Product IDs from cart:", productIds);
            throw new Error("Could not calculate order total due to missing product price information.");
        }
        
        return Math.round(finalAmount); // Ensure it's an integer

    } catch (dbError) {
        console.error("Backend: Database error during price calculation:", dbError);
        // Re-throw the original error if it's one we created, or a generic one
        if (dbError.message.includes("Product information error") || 
            dbError.message.includes("not found in database or has an invalid price") ||
            dbError.message.includes("missing product price information")) {
            throw dbError; 
        }
        throw new Error("Server error calculating order total. Check database connection and products table.");
    }
};
// Endpoint to create a Razorpay Order
router.post('/create-order', async (req, res) => {
    const { cartItems, contactInfo } = req.body; // Assuming contactInfo has email and phone

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty or invalid.' });
    }
    if (!contactInfo || !contactInfo.email || !contactInfo.phone) {
        return res.status(400).json({ error: 'Contact email and phone are required.' });
    }

    try {
        const amountInPaise = await calculateOrderAmount(cartItems);
        const currency = 'INR'; // Razorpay primarily uses INR

        const options = {
            amount: amountInPaise, // Amount in the smallest currency unit (paise for INR)
            currency: currency,
            receipt: `receipt_order_${Date.now()}`, // Unique receipt ID
            notes: {
                customer_email: contactInfo.email,
                customer_phone: contactInfo.phone,
                project_name: "IRON STREET Order",
                cart_summary: JSON.stringify(cartItems.map(item => ({id: item.id, qty: item.quantity})))
            }
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);

        if (!razorpayOrder) {
            return res.status(500).json({ error: 'Razorpay order creation failed.' });
        }

        res.json({
            orderId: razorpayOrder.id,
            currency: razorpayOrder.currency,
            amount: razorpayOrder.amount, // Amount in paise
            keyId: process.env.RAZORPAY_KEY_ID, // Send key_id to frontend for Razorpay Checkout
            customerName: contactInfo.name || "Guest Customer", // Optional: get name from form
            customerEmail: contactInfo.email,
            customerPhone: contactInfo.phone,
            notes: razorpayOrder.notes
        });

    } catch (error) {
        console.error('Error creating Razorpay order:', error.message);
        const userMessage = error.message.includes("Order total is too low") || error.message.includes("Product information error")
            ? error.message
            : 'Failed to create order. Please try again.';
        res.status(500).json({ error: userMessage, details: process.env.NODE_ENV !== 'production' ? error.stack : undefined });
    }
});

// Endpoint for Razorpay payment verification (Webhook is more robust for production)
router.post('/verify-payment', async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        // --- Order details to save in your DB ---
        userId, // from authenticated session or null for guest
        cartItems,
        totalAmountInRupees, // Make sure frontend sends this or recalculate
        shippingAddress,
        contactInfo
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing Razorpay payment details for verification.' });
    }
    if (!cartItems || typeof totalAmountInRupees === 'undefined' || !shippingAddress || !contactInfo) {
        return res.status(400).json({ error: 'Missing order details for saving.' });
    }


    const generated_signature_body = razorpay_order_id + "|" + razorpay_payment_id;
    const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(generated_signature_body.toString())
        .digest('hex');

    if (generated_signature === razorpay_signature) {
        // Payment is authentic. Save order details to your database.
        try {
            const dbResult = await db.query(
                `INSERT INTO orders (user_id, cart_items, total_amount, shipping_address, contact_info, payment_intent_id, status, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING id`,
                [
                    userId || null,
                    JSON.stringify(cartItems),
                    totalAmountInRupees, // Store amount in primary currency unit
                    JSON.stringify(shippingAddress),
                    JSON.stringify(contactInfo),
                    razorpay_payment_id, // Store Razorpay payment_id as reference
                    'paid'
                ]
            );
            console.log("Order saved to DB with ID:", dbResult.rows[0].id);
            res.json({
                status: 'success',
                message: 'Payment verified and order saved.',
                orderId: dbResult.rows[0].id,
                paymentId: razorpay_payment_id
            });
        } catch (dbError) {
            console.error('Error saving order to DB after Razorpay verification:', dbError);
            // Even if DB save fails, payment is successful with Razorpay.
            // Implement retry logic or manual reconciliation process.
            res.status(500).json({
                status: 'payment_success_db_error',
                message: 'Payment successful with Razorpay, but failed to save order details in our system. Please contact support.',
                paymentId: razorpay_payment_id
            });
        }
    } else {
        console.error('Razorpay signature mismatch.');
        res.status(400).json({ status: 'failure', message: 'Payment verification failed. Invalid signature.' });
    }
});

module.exports = router;