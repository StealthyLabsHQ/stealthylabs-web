// Lightbox for map/blueprint images
function openLightbox(imgSrc) {
    var img = document.getElementById('lightboxImage');
    var box = document.getElementById('mapLightbox');
    if (img && box) {
        img.src = imgSrc;
        box.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeLightbox() {
    var box = document.getElementById('mapLightbox');
    if (box) {
        box.classList.remove('active');
        document.body.style.overflow = '';
    }
}

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
});

// Bind data-action="open-image" elements
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-action="open-image"]').forEach(function (el) {
        el.addEventListener('click', function () {
            var src = el.getAttribute('data-src') || el.src;
            if (src) openLightbox(src);
        });
    });

    // Lightbox overlay click to close
    var lightbox = document.getElementById('mapLightbox');
    if (lightbox) {
        lightbox.addEventListener('click', function (e) {
            if (e.target === lightbox) closeLightbox();
        });
    }

    // Close button
    document.querySelectorAll('[data-action="close-lightbox"]').forEach(function (btn) {
        btn.addEventListener('click', closeLightbox);
    });
});
