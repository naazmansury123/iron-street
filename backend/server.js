// server.js (Complete Backend File - With Proper Verification)

const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
const crypto = require('crypto'); // Node.js built-in module for cryptography
require('dotenv').config();

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});
app.get('/', (req, res) => {
    res.send('Iron Street Backend is running!');
});

app.post('/api/payments/create-order', async (req, res) => {
    try {
        const { cartItems, contactInfo } = req.body;

        console.log("\n--- BACKEND: /create-order Request Received ---");
        console.log("Received Cart Items:", JSON.stringify(cartItems, null, 2));

        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            return res.status(400).json({ error: "Cart is empty or invalid." });
        }

        let calculatedSubtotalINR = 0;
        for (const item of cartItems) {
            const price = parseFloat(item.price);
            const quantity = parseInt(item.quantity);
            if (isNaN(price) || isNaN(quantity)) {
                return res.status(400).json({ error: `Invalid data for item ${item.name}.` });
            }
            calculatedSubtotalINR += price * quantity;
        }
        
        const shippingCostINR = calculatedSubtotalINR > 0 ? 10.00 : 0; // Your ₹10 shipping
        const discountAppliedINR = 0; // Assuming no discount for now
        const totalAmountINR = calculatedSubtotalINR + shippingCostINR - discountAppliedINR;
        
        console.log(`Backend Subtotal (INR): ${calculatedSubtotalINR.toFixed(2)}`);
        console.log(`Backend Shipping (INR): ${shippingCostINR.toFixed(2)}`);
        console.log(`Backend Final Total (INR): ${totalAmountINR.toFixed(2)}`);

        if (totalAmountINR <= 0) {
            return res.status(400).json({ error: "Total amount must be greater than 0." });
        }

        const amountInPaise = Math.round(totalAmountINR * 100);
        console.log(`Amount for Razorpay (PAISE): ${amountInPaise}`);

        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `receipt_order_${Date.now()}`,
            notes: {
                customerName: contactInfo.name || "Guest User",
                customerEmail: contactInfo.email,
            }
        };

        const order = await instance.orders.create(options);
        console.log("Razorpay Order Created Successfully:", order);
        console.log("----------------------------------------------\n");

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            notes: order.notes
        });

    } catch (error) {
        console.error("--- BACKEND ERROR in /create-order ---");
        console.error(error);
        res.status(500).json({ error: "Failed to create Razorpay order.", details: error.message });
    }
});

// --- YEH HAI IMPORTANT VERIFICATION LOGIC ---
app.post('/api/payments/verify-payment', (req, res) => {
    console.log("\n--- BACKEND: /verify-payment Request Received ---");
    console.log("Request Body:", req.body);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        console.error("Verification failed: Missing payment details in request.");
        return res.status(400).json({ status: 'failure', message: 'Payment details missing.' });
    }
    
    const body_data = razorpay_order_id + "|" + razorpay_payment_id;

    // HMAC-SHA256 algorithm to create the expected signature
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body_data)
        .digest('hex');

    console.log("Received Signature:", razorpay_signature);
    console.log("Expected Signature:", expectedSignature);

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (isSignatureValid) {
        console.log("Payment Verification Successful!");
        // Yahan aap database mein order status update kar sakte ho
        // For example: updateOrderStatus(razorpay_order_id, 'paid');
        
        // Send cartItems, shippingAddress etc. to save in DB if needed
        // const { cartItems, totalAmountInRupees, shippingAddress, contactInfo, discountApplied } = req.body;
        // console.log("Cart Items for DB:", cartItems);
        // console.log("Shipping Address for DB:", shippingAddress);

        console.log("-----------------------------------------------\n");
        res.json({ 
            status: 'success', 
            message: 'Payment verified successfully!',
            orderId: razorpay_order_id, 
            paymentId: razorpay_payment_id 
        });
    } else {
        console.error("Payment Verification Failed: Signature mismatch.");
        console.log("-----------------------------------------------\n");
        res.status(400).json({ status: 'failure', message: 'Payment verification failed. Signature mismatch.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});