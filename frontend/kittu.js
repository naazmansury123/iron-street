// IRON STREET - MASTER JAVASCRIPT (v3 - FINAL, ROBUST)

document.addEventListener('DOMContentLoaded', () => {

    // --- Mobile Navigation Toggle ---
    const navToggle = document.querySelector('.nav-toggle');
    const mainNavWrapper = document.querySelector('.main-nav-wrapper');
    const siteHeader = document.querySelector('.site-header');

    if (navToggle && mainNavWrapper) {
        navToggle.addEventListener('click', () => {
            // This toggles a class on the HEADER, not the nav itself.
            // This makes it easier to manage styles and layout shifts.
            siteHeader.classList.toggle('mobile-nav-active');
        });
    }

    // --- Animate on Scroll ---
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    if (animatedElements.length > 0) {
        // Use the modern Intersection Observer API for performance
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target); // Animate only once
                }
            });
        }, {
            threshold: 0.1 // Trigger when 10% of the element is visible
        });

        animatedElements.forEach(element => {
            observer.observe(element);
        });
    }

    // --- Set Current Year in Footer ---
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
});