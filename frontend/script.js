let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-slide');
const slideContainer = document.querySelector('.carousel-container');
const totalSlides = slides.length;

function showSlide(index) {
    if (index >= totalSlides) {
        currentSlide = 0;
    } else if (index < 0) {
        currentSlide = totalSlides - 1;
    } else {
        currentSlide = index;
    }
    slideContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
}

function moveSlide(n) {
    showSlide(currentSlide + n);
}

showSlide(currentSlide);
