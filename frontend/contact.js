document.addEventListener('DOMContentLoaded', function() {
    // Get the form, email input, and message elements from the HTML
    const subscribeForm = document.getElementById('subscribe-form');
    const emailInput = document.getElementById('email-input');
    const messageElement = document.getElementById('message');

    // Add an event listener for the form submission
    subscribeForm.addEventListener('submit', function(event) {
        // Prevent the form from actually submitting and reloading the page
        event.preventDefault();

        // Get the email value entered by the user
        const email = emailInput.value;

        // Simple validation to check if email is not empty
        if (email) {
            // Display a success message
            messageElement.textContent = 'Thank You! We will notify you at launch.';
            messageElement.style.color = '#27ae60'; // Green color for success

            // Clear the input field after successful submission
            emailInput.value = '';

            // Optional: Hide the message after 5 seconds
            setTimeout(() => {
                messageElement.textContent = '';
            }, 5000);
            
        } else {
            // Display an error message if the input is empty
            messageElement.textContent = 'Please enter a valid email address.';
            messageElement.style.color = '#c0392b'; // Red color for error
        }
    });
});