(function () {
    'use strict';

    /* ── State ── */
    var projects = [];
    var modalProject = null;
    var modalIndex = 0;

    /* ── DOM refs ── */
    var grid = document.getElementById('portfolioGrid');
    var modal = document.getElementById('portfolioModal');
    var modalOverlay = document.getElementById('modalOverlay');
    var modalClose = document.getElementById('modalClose');
    var modalImage = document.getElementById('modalImage');
    var modalPrev = document.getElementById('modalPrev');
    var modalNext = document.getElementById('modalNext');
    var modalDots = document.getElementById('modalDots');
    var modalTitle = document.getElementById('modalTitle');
    var modalDesc = document.getElementById('modalDesc');
    var modalTags = document.getElementById('modalTags');
    var modalLinks = document.getElementById('modalLinks');
    var modalCounter = document.getElementById('modalCounter');
    var modalImageWrapper = document.querySelector('.modal-image-wrapper');

    /* ── Config ── */
    var UPDATING_SITES = ['some-like-it-hot-power-yoga'];

    /* ── Fetch & Render ── */
    fetch('projects.json')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            projects = data;
            renderGrid();
        })
        .catch(function () {
            grid.innerHTML = '<div class="portfolio-loading">Failed to load projects.</div>';
        });

    function formatUrl(url) {
        return url.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    }

    function renderGrid() {
        grid.innerHTML = '';
        projects.forEach(function (project) {
            var card = document.createElement('div');
            card.className = 'portfolio-card';
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', 'View ' + project.name);

            /* Carousel */
            var carousel = document.createElement('div');
            carousel.className = 'card-carousel';

            var track = document.createElement('div');
            track.className = 'card-carousel-track';

            project.thumbnails.forEach(function (src) {
                var slide = document.createElement('div');
                slide.className = 'card-carousel-slide';
                var img = document.createElement('img');
                img.src = src;
                img.alt = project.name;
                img.loading = 'lazy';
                img.decoding = 'async';
                slide.appendChild(img);
                track.appendChild(slide);
            });

            carousel.appendChild(track);

            var slideIndex = 0;
            var autoplayTimer = null;

            function goToSlide(i) {
                slideIndex = i;
                track.style.transform = 'translateX(-' + (i * 100) + '%)';
                updateDots();
            }

            function nextSlide() {
                goToSlide((slideIndex + 1) % project.thumbnails.length);
            }

            function prevSlide() {
                goToSlide((slideIndex - 1 + project.thumbnails.length) % project.thumbnails.length);
            }

            function startAutoplay() {
                stopAutoplay();
                if (project.thumbnails.length > 1) {
                    autoplayTimer = setInterval(nextSlide, 3000);
                }
            }

            function stopAutoplay() {
                if (autoplayTimer) {
                    clearInterval(autoplayTimer);
                    autoplayTimer = null;
                }
            }

            /* Carousel nav buttons (only if multiple images) */
            if (project.thumbnails.length > 1) {
                var prevBtn = document.createElement('button');
                prevBtn.className = 'card-carousel-nav card-carousel-prev';
                prevBtn.innerHTML = '&#8249;';
                prevBtn.setAttribute('aria-label', 'Previous image');
                prevBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    prevSlide();
                    stopAutoplay();
                    startAutoplay();
                });

                var nextBtn = document.createElement('button');
                nextBtn.className = 'card-carousel-nav card-carousel-next';
                nextBtn.innerHTML = '&#8250;';
                nextBtn.setAttribute('aria-label', 'Next image');
                nextBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    nextSlide();
                    stopAutoplay();
                    startAutoplay();
                });

                carousel.appendChild(prevBtn);
                carousel.appendChild(nextBtn);

                /* Dots */
                var dotsContainer = document.createElement('div');
                dotsContainer.className = 'card-carousel-dots';

                project.thumbnails.forEach(function (_, di) {
                    var dot = document.createElement('button');
                    dot.className = 'card-carousel-dot' + (di === 0 ? ' active' : '');
                    dot.setAttribute('aria-label', 'Go to image ' + (di + 1));
                    dot.addEventListener('click', function (e) {
                        e.stopPropagation();
                        goToSlide(di);
                        stopAutoplay();
                        startAutoplay();
                    });
                    dotsContainer.appendChild(dot);
                });

                carousel.appendChild(dotsContainer);

                function updateDots() {
                    var dots = dotsContainer.querySelectorAll('.card-carousel-dot');
                    dots.forEach(function (d, i) {
                        d.classList.toggle('active', i === slideIndex);
                    });
                }

                carousel.addEventListener('mouseenter', stopAutoplay);
                carousel.addEventListener('mouseleave', startAutoplay);

                startAutoplay();
            }

            card.appendChild(carousel);

            /* Card Body */
            var body = document.createElement('div');
            body.className = 'card-body';

            var title = document.createElement('h3');
            title.className = 'card-title';
            title.textContent = project.name;
            body.appendChild(title);

            if (project.description) {
                var desc = document.createElement('p');
                desc.className = 'card-desc';
                desc.textContent = project.description;
                body.appendChild(desc);
            }

            if (project.techStack && project.techStack.length > 0) {
                var tags = document.createElement('div');
                tags.className = 'card-tags';
                project.techStack.forEach(function (tech) {
                    var tag = document.createElement('span');
                    tag.className = 'card-tag';
                    tag.textContent = tech;
                    tags.appendChild(tag);
                });
                body.appendChild(tags);
            }

            var footer = document.createElement('div');
            footer.className = 'card-footer';

            if (project.liveUrl) {
                var isUpdating = UPDATING_SITES.indexOf(project.id) !== -1;

                var liveLink = document.createElement('a');
                liveLink.className = 'card-link card-link-url';
                liveLink.href = project.liveUrl;
                liveLink.target = '_blank';
                liveLink.rel = 'noopener';
                liveLink.title = 'View live website in a new tab';
                liveLink.addEventListener('click', function (e) { e.stopPropagation(); });

                var urlText = document.createElement('span');
                urlText.className = 'card-link-domain';
                urlText.textContent = formatUrl(project.liveUrl);
                liveLink.appendChild(urlText);

                var viewHint = document.createElement('span');
                viewHint.className = 'card-link-hint';
                viewHint.textContent = 'view live website';
                liveLink.appendChild(viewHint);

                if (isUpdating) {
                    var badge = document.createElement('span');
                    badge.className = 'card-link-badge';
                    badge.textContent = 'undergoing updates';
                    liveLink.appendChild(badge);
                }

                footer.appendChild(liveLink);
            }

            if (project.githubUrl) {
                var ghLink = document.createElement('a');
                ghLink.className = 'card-link';
                ghLink.href = project.githubUrl;
                ghLink.target = '_blank';
                ghLink.rel = 'noopener';
                ghLink.textContent = 'GitHub';
                ghLink.addEventListener('click', function (e) { e.stopPropagation(); });
                footer.appendChild(ghLink);
            }

            var viewLabel = document.createElement('span');
            viewLabel.className = 'card-view-label';
            viewLabel.textContent = project.imageCount + ' screenshot' + (project.imageCount !== 1 ? 's' : '');
            footer.appendChild(viewLabel);

            body.appendChild(footer);
            card.appendChild(body);

            /* Open modal on card click */
            card.addEventListener('click', function () {
                openModal(project, 0);
            });
            card.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openModal(project, 0);
                }
            });

            grid.appendChild(card);
        });
    }

    /* ── Modal ── */
    function openModal(project, index) {
        modalProject = project;
        modalIndex = index;

        modalTitle.textContent = project.name;
        modalDesc.textContent = project.description || '';
        modalDesc.style.display = project.description ? '' : 'none';

        /* Tags */
        modalTags.innerHTML = '';
        if (project.techStack && project.techStack.length > 0) {
            project.techStack.forEach(function (tech) {
                var tag = document.createElement('span');
                tag.className = 'card-tag';
                tag.textContent = tech;
                modalTags.appendChild(tag);
            });
        }

        /* Links */
        modalLinks.innerHTML = '';
        if (project.liveUrl) {
            var isUpdating = UPDATING_SITES.indexOf(project.id) !== -1;
            var liveBtn = document.createElement('a');
            liveBtn.className = 'btn';
            liveBtn.href = project.liveUrl;
            liveBtn.target = '_blank';
            liveBtn.rel = 'noopener';
            liveBtn.textContent = 'View Live Website';
            if (isUpdating) {
                liveBtn.title = 'Site is currently undergoing updates';
            }
            modalLinks.appendChild(liveBtn);

            var urlLabel = document.createElement('span');
            urlLabel.className = 'modal-url-label';
            urlLabel.textContent = formatUrl(project.liveUrl);
            if (isUpdating) {
                urlLabel.textContent += ' (undergoing updates)';
            }
            modalLinks.appendChild(urlLabel);
        }
        if (project.githubUrl) {
            var ghBtn = document.createElement('a');
            ghBtn.className = 'btn btn-outline';
            ghBtn.href = project.githubUrl;
            ghBtn.target = '_blank';
            ghBtn.rel = 'noopener';
            ghBtn.textContent = 'View on GitHub';
            modalLinks.appendChild(ghBtn);
        }

        /* Dots */
        modalDots.innerHTML = '';
        project.images.forEach(function (_, i) {
            var dot = document.createElement('button');
            dot.className = 'modal-dot';
            dot.setAttribute('aria-label', 'Go to image ' + (i + 1));
            dot.addEventListener('click', function () {
                modalGoTo(i);
            });
            modalDots.appendChild(dot);
        });

        /* Show/hide nav if single image */
        var multi = project.images.length > 1;
        modalPrev.style.display = multi ? '' : 'none';
        modalNext.style.display = multi ? '' : 'none';
        modalDots.style.display = multi ? '' : 'none';
        modalCounter.style.display = multi ? '' : 'none';

        modalGoTo(index);

        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        modalProject = null;
    }

    function modalGoTo(index) {
        modalIndex = index;
        modalImage.src = modalProject.images[index];
        modalImage.alt = modalProject.name + ' — image ' + (index + 1);
        modalCounter.textContent = (index + 1) + ' / ' + modalProject.images.length;

        /* Scroll wrapper back to top when changing images */
        if (modalImageWrapper) {
            modalImageWrapper.scrollTop = 0;
        }

        /* Update dots */
        var dots = modalDots.querySelectorAll('.modal-dot');
        dots.forEach(function (d, i) {
            d.classList.toggle('active', i === index);
        });
    }

    function modalPrevImage() {
        if (!modalProject) return;
        var len = modalProject.images.length;
        modalGoTo((modalIndex - 1 + len) % len);
    }

    function modalNextImage() {
        if (!modalProject) return;
        modalGoTo((modalIndex + 1) % modalProject.images.length);
    }

    /* Modal controls */
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
    modalPrev.addEventListener('click', modalPrevImage);
    modalNext.addEventListener('click', modalNextImage);

    /* Keyboard navigation */
    document.addEventListener('keydown', function (e) {
        if (!modal.classList.contains('open')) return;
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowLeft') modalPrevImage();
        if (e.key === 'ArrowRight') modalNextImage();
    });

    /* ── Mobile Hamburger (same as index.html) ── */
    var hamburger = document.getElementById('hamburger');
    var navLinks = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function () {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('open');
        });

        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                hamburger.classList.remove('active');
                navLinks.classList.remove('open');
            });
        });
    }
})();
