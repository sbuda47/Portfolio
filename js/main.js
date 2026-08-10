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
		contactForm.addEventListener('submit', (ev) => {
			ev.preventDefault();
			const name = contactForm.querySelector('#cf-name');
			const email = contactForm.querySelector('#cf-email');
			const message = contactForm.querySelector('#cf-message');
			let ok = true;
			// simple validations
			if (!name.value.trim()) { ok = false; name.setAttribute('aria-invalid', 'true'); }
			else { name.removeAttribute('aria-invalid'); }
			if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) { ok = false; email.setAttribute('aria-invalid', 'true'); }
			else { email.removeAttribute('aria-invalid'); }
			if (!message.value.trim()) { ok = false; message.setAttribute('aria-invalid', 'true'); }
			else { message.removeAttribute('aria-invalid'); }

			if (!ok) {
				contactFormMessage.textContent = 'Please fill out all fields correctly.';
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
		galleryMedia = [
			{ type: 'image', src: '../assets/images/tele_1.png', alt: 'Telemetry image 1' },
			{ type: 'image', src: '../assets/images/tele_2.png', alt: 'Telemetry image 2' },
			{ type: 'image', src: '../assets/images/tele_3.png', alt: 'Telemetry image 3' },
			{ type: 'image', src: '../assets/images/tele_4.png', alt: 'Telemetry image 4' },
			{ type: 'image', src: '../assets/images/tele_5.png', alt: 'Telemetry image 5' }
		];
	} else if (galleryType === 'bible-quest') {
		galleryMedia = [
			{ type: 'image', src: '../assets/images/BQ_1.jpg', alt: 'Bible Quest screenshot 1' },
			{ type: 'image', src: '../assets/images/BQ_2.jpg', alt: 'Bible Quest screenshot 2' },
			{ type: 'image', src: '../assets/images/BQ_3.jpg', alt: 'Bible Quest screenshot 3' },
			{ type: 'image', src: '../assets/images/BQ_4.jpg', alt: 'Bible Quest screenshot 4' },
			{ type: 'image', src: '../assets/images/BQ_5.jpg', alt: 'Bible Quest screenshot 5' },
			{ type: 'image', src: '../assets/images/BQ_6.jpg', alt: 'Bible Quest screenshot 6' },
			{ type: 'video', src: '../assets/images/BibleQuest.mp4', alt: 'Bible Quest demo video' }
		];
	}

	const galleryItems = document.querySelectorAll('.gallery-item');
	const galleryModal = document.querySelector('.gallery-modal');
	const galleryViewer = document.querySelector('.gallery-viewer');
	const galleryCurrent = document.querySelector('.gallery-current');
	const galleryCurrentVideo = document.querySelector('.gallery-current-video');
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
		currentGalleryIndex = (index + galleryMedia.length) % galleryMedia.length;
		const current = galleryMedia[currentGalleryIndex];
		if (current.type === 'image') {
			if (galleryCurrent) {
				galleryCurrent.src = current.src;
				galleryCurrent.alt = current.alt;
				galleryCurrent.style.display = 'block';
			}
			if (galleryCurrentVideo) {
				galleryCurrentVideo.pause();
				galleryCurrentVideo.style.display = 'none';
				galleryCurrentVideo.removeAttribute('src');
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
				const index = Number(item.dataset.index);
				openGallery(index);
			});
		});

		galleryPrev.addEventListener('click', () => openGallery(currentGalleryIndex - 1));
		galleryNext.addEventListener('click', () => openGallery(currentGalleryIndex + 1));
		galleryClose.addEventListener('click', closeGallery);

		galleryModal.addEventListener('click', (event) => {
			if (event.target === galleryModal || event.target.classList.contains('gallery-modal-overlay')) {
				closeGallery();
			}
		});

		document.addEventListener('keydown', (event) => {
			if (!galleryModal.classList.contains('active')) return;
			if (event.key === 'Escape') closeGallery();
			if (event.key === 'ArrowLeft') openGallery(currentGalleryIndex - 1);
			if (event.key === 'ArrowRight') openGallery(currentGalleryIndex + 1);
		});
	}
});
