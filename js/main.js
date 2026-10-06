// Main JavaScript entry point
document.addEventListener('DOMContentLoaded', () => {
	// Mobile nav toggle
	const navToggle = document.getElementById('navToggle');
	const header = document.querySelector('header');
	const primaryNav = document.querySelector('header nav ul');

	if (navToggle && header && primaryNav) {
		navToggle.addEventListener('click', () => {
			const expanded = navToggle.getAttribute('aria-expanded') === 'true';
			navToggle.setAttribute('aria-expanded', String(!expanded));
			header.classList.toggle('nav-open');
		});

		// Close mobile nav when a link is clicked
		primaryNav.querySelectorAll('a').forEach(a => {
			a.addEventListener('click', () => {
				if (header.classList.contains('nav-open')) {
					header.classList.remove('nav-open');
					navToggle.setAttribute('aria-expanded', 'false');
				}
			});
		});
	}

	// Hero heading reveal (CSS-based to avoid layout shifts)
	const heroHeading = document.querySelector('#home .hero-left h1');
	if (heroHeading) {
		// keep server-rendered text to avoid CLS; use CSS reveal
		requestAnimationFrame(() => {
			heroHeading.classList.add('visible');
		});
	}

	/* Contact form validation (client-side) */
	const contactForm = document.getElementById('contactForm');
	const contactFormMessage = document.getElementById('contactFormMessage');
	if (contactForm) {
		const nameInput = contactForm.querySelector('#cf-name');
		const emailInput = contactForm.querySelector('#cf-email');

		// Restrict name field to letters, spaces, and hyphens only (no emojis)
		if (nameInput) {
			nameInput.addEventListener('input', (e) => {
				e.target.value = e.target.value.replace(/[^a-zA-Z\s\-']/g, '');
			});
		}

		// Enhanced email validation
		if (emailInput) {
			emailInput.addEventListener('blur', (e) => {
				const email = e.target.value.trim();
				const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
				if (email && !isValidEmail) {
					emailInput.setAttribute('aria-invalid', 'true');
				} else {
					emailInput.removeAttribute('aria-invalid');
				}
			});
		}

		contactForm.addEventListener('submit', (ev) => {
			ev.preventDefault();
			const name = contactForm.querySelector('#cf-name');
			const email = contactForm.querySelector('#cf-email');
			const message = contactForm.querySelector('#cf-message');
			let ok = true;

			// Validate name: not empty and only letters/spaces/hyphens
			if (!name.value.trim()) {
				ok = false;
				name.setAttribute('aria-invalid', 'true');
			}
			else if (!/^[a-zA-Z\s\-']+$/.test(name.value.trim())) {
				ok = false;
				name.setAttribute('aria-invalid', 'true');
			}
			else {
				name.removeAttribute('aria-invalid');
			}

			// Validate email format
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
				ok = false;
				email.setAttribute('aria-invalid', 'true');
			}
			else {
				email.removeAttribute('aria-invalid');
			}

			// Validate message not empty
			if (!message.value.trim()) {
				ok = false;
				message.setAttribute('aria-invalid', 'true');
			}
			else {
				message.removeAttribute('aria-invalid');
			}

			if (!ok) {
				contactFormMessage.textContent = 'Please fill out all fields correctly. Name should contain only letters and spaces, and email must be valid.';
				contactFormMessage.classList.add('text-brandYellow');
				return;
			}

			// Demo submission: show success and reset form
			contactFormMessage.textContent = 'Message sent — thank you! (Demo)';
			contactFormMessage.classList.remove('text-brandYellow');
			contactForm.reset();
		});
	}

	const galleryType = document.body.dataset.gallery || '';
	let galleryMedia = [];

	if (galleryType === 'telemetry') {
		galleryMedia = [1, 2, 3, 4, 5].map((n) => ({
			type: 'image',
			src: `../assets/images/tele_${n}.webp`,
			alt: `Telemetry image ${n}`
		}));
	} else if (galleryType === 'bible-quest') {
		galleryMedia = [1, 2, 3, 4, 5, 6].map((n) => ({
			type: 'image',
			src: `../assets/images/BQ_${n}.webp`,
			alt: `Bible Quest screenshot ${n}`
		}));
		galleryMedia.push({ type: 'video', src: '../assets/images/BibleQuest.mp4', alt: 'Bible Quest demo video' });
	}

	const galleryItems = document.querySelectorAll('.gallery-item');
	const galleryModal = document.querySelector('.gallery-modal');
	const galleryViewer = document.querySelector('.gallery-viewer');
	// Scope the current media selectors to the gallery viewer to avoid picking up other page images
	const galleryCurrent = document.querySelector('.gallery-viewer img.gallery-current');
	const galleryCurrentSource = document.querySelector('.gallery-viewer picture source');
	const galleryCurrentVideo = document.querySelector('.gallery-viewer video.gallery-current-video');
	const galleryCaption = document.querySelector('.gallery-caption');
	const galleryPrev = document.querySelector('.gallery-prev');
	const galleryNext = document.querySelector('.gallery-next');
	const galleryClose = document.querySelector('.gallery-close');

	let currentGalleryIndex = 0;
	const defaultAspect = (galleryType === 'bible-quest') ? '9 / 16' : '16 / 9';

	const setViewerAspect = () => {
		if (!galleryViewer) return;
		galleryViewer.style.setProperty('aspect-ratio', defaultAspect);
	};

	const updateGallery = (index) => {
		if (!galleryMedia.length) return;
		currentGalleryIndex = ((index % galleryMedia.length) + galleryMedia.length) % galleryMedia.length;
		const current = galleryMedia[currentGalleryIndex];

		if (galleryCurrentVideo) {
			galleryCurrentVideo.pause();
			galleryCurrentVideo.removeAttribute('src');
			galleryCurrentVideo.style.display = 'none';
		}

		if (current.type === 'image') {
			if (galleryCurrentSource) {
				galleryCurrentSource.setAttribute('srcset', current.src);
			}
			if (galleryCurrent) {
				galleryCurrent.src = current.src;
				galleryCurrent.srcset = current.src;
				galleryCurrent.alt = current.alt;
				galleryCurrent.style.display = 'block';
			}
			if (galleryCaption) galleryCaption.textContent = `Image ${currentGalleryIndex + 1} of ${galleryMedia.length}`;
		} else {
			if (galleryCurrent) galleryCurrent.style.display = 'none';
			if (galleryCurrentVideo) {
				galleryCurrentVideo.src = current.src;
				galleryCurrentVideo.style.display = 'block';
				galleryCurrentVideo.load();
			}
			if (galleryCaption) galleryCaption.textContent = 'Demo video';
		}
	};

	const openGallery = (index) => {
		if (!galleryModal) return;
		setViewerAspect();
		updateGallery(index);
		galleryModal.classList.add('active');
		galleryModal.setAttribute('aria-hidden', 'false');
		document.body.style.overflow = 'hidden';
	};

	const closeGallery = () => {
		if (!galleryModal) return;
		galleryModal.classList.remove('active');
		galleryModal.setAttribute('aria-hidden', 'true');
		document.body.style.overflow = '';
		// cleanup video element to prevent playback overlap
		if (galleryCurrentVideo) {
			galleryCurrentVideo.pause();
			galleryCurrentVideo.removeAttribute('src');
			galleryCurrentVideo.style.display = 'none';
		}
		if (galleryCurrent) {
			galleryCurrent.style.display = 'block';
		}
	};

	if (galleryItems.length && galleryModal && galleryCurrent && galleryPrev && galleryNext && galleryClose) {
		galleryItems.forEach((item) => {
			item.addEventListener('click', () => {
			let index = Number(item.dataset.index);
			if (Number.isNaN(index)) index = 0;
			openGallery(index);
		});
				});

		galleryPrev.addEventListener('click', () => updateGallery(currentGalleryIndex - 1));
		galleryNext.addEventListener('click', () => updateGallery(currentGalleryIndex + 1));
		galleryClose.addEventListener('click', closeGallery);

		galleryModal.addEventListener('click', (event) => {
			if (event.target === galleryModal || event.target.classList.contains('gallery-modal-overlay')) {
				closeGallery();
			}
		});

		document.addEventListener('keydown', (event) => {
			if (!galleryModal.classList.contains('active')) return;
			if (event.key === 'Escape') closeGallery();
			if (event.key === 'ArrowLeft') updateGallery(currentGalleryIndex - 1);
			if (event.key === 'ArrowRight') updateGallery(currentGalleryIndex + 1);
		});
	}
});
