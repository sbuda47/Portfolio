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

	/* Contact page call to action and rotating prompt */
	const contactDialog = document.getElementById('contactDialog');
	const openContactForm = document.getElementById('openContactForm');
	const closeContactForm = document.getElementById('closeContactForm');
	if (contactDialog && openContactForm && closeContactForm) {
		const contactNameInput = contactDialog.querySelector('#cf-name');

		openContactForm.addEventListener('click', () => {
			contactDialog.showModal();
			contactNameInput.focus();
		});

		contactDialog.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				contactDialog.close();
			}
		});

		closeContactForm.addEventListener('click', () => contactDialog.close());
		contactDialog.addEventListener('click', (event) => {
			if (event.target === contactDialog) {
				contactDialog.close();
			}
		});
	}

	const contactLoopText = document.getElementById('contactLoopText');
	if (contactLoopText && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		const prompts = [
			'Building a prototype?',
			'Improving a control system?',
			'Making sense of sensor data?',
			'Turning an idea into a working system?'
		];
		let promptIndex = 0;
		let characterIndex = contactLoopText.textContent.length;
		let deleting = true;

		const typeNextPrompt = () => {
			const prompt = prompts[promptIndex];
			if (deleting) {
				characterIndex -= 1;
				contactLoopText.textContent = prompt.slice(0, characterIndex);
				if (characterIndex === 0) {
					deleting = false;
					promptIndex = (promptIndex + 1) % prompts.length;
					window.setTimeout(typeNextPrompt, 240);
					return;
				}
				window.setTimeout(typeNextPrompt, 32);
				return;
			}

			const nextPrompt = prompts[promptIndex];
			characterIndex += 1;
			contactLoopText.textContent = nextPrompt.slice(0, characterIndex);
			if (characterIndex === nextPrompt.length) {
				deleting = true;
				window.setTimeout(typeNextPrompt, 2400);
				return;
			}
			window.setTimeout(typeNextPrompt, 65);
		};

		window.setTimeout(typeNextPrompt, 2400);
	}

	/* Skills page domain selector */
	const skillFilters = document.querySelectorAll('[data-skill-filter]');
	const skillDomains = document.querySelectorAll('[data-skill-domain]');
	if (skillFilters.length && skillDomains.length) {
		const setSkillFilter = (selectedDomain) => {
			skillFilters.forEach((filter) => {
				const isSelected = filter.dataset.skillFilter === selectedDomain;
				filter.setAttribute('aria-pressed', String(isSelected));
				filter.classList.toggle('is-active', isSelected);
			});

			skillDomains.forEach((domain) => {
				domain.hidden = selectedDomain !== 'all' && domain.dataset.skillDomain !== selectedDomain;
			});
		};

		skillFilters.forEach((filter) => {
			filter.addEventListener('click', () => setSkillFilter(filter.dataset.skillFilter));
		});
		setSkillFilter('control');
	}

	/* Contact form validation (client-side) */
	const contactForm = document.getElementById('contactForm');
	const contactFormMessage = document.getElementById('contactFormMessage');
	if (contactForm) {
		const nameInput = contactForm.querySelector('#cf-name');
		const emailInput = contactForm.querySelector('#cf-email');

		// Restrict names to letters, spaces, hyphens, and apostrophes (no emojis)
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

		contactForm.addEventListener('submit', async (ev) => {
			ev.preventDefault();
			const name = contactForm.querySelector('#cf-name');
			const email = contactForm.querySelector('#cf-email');
			const message = contactForm.querySelector('#cf-message');
			const submitButton = contactForm.querySelector('[type="submit"]');
			let ok = true;

			// Validate name: not empty and limited to letters, spaces, hyphens, and apostrophes
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
				contactFormMessage.textContent = 'Please check your name, email address, and message.';
				contactFormMessage.classList.add('text-brandYellow');
				contactForm.querySelector('[aria-invalid="true"]').focus();
				return;
			}

			const formEndpoint = contactForm.getAttribute('action');
			if (!formEndpoint || !/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(formEndpoint)) {
				contactFormMessage.textContent = 'The form is not configured correctly. Please email me directly.';
				contactFormMessage.classList.add('text-brandYellow');
				return;
			}

			submitButton.disabled = true;
			contactForm.setAttribute('aria-busy', 'true');
			contactFormMessage.classList.remove('text-brandYellow');
			contactFormMessage.textContent = 'Sending your message...';

			let response;
			try {
				response = await fetch(formEndpoint, {
					method: 'POST',
					body: new FormData(contactForm),
					headers: { Accept: 'application/json' }
				});
			} catch (error) {
				console.error('Contact form request failed:', error);
				contactFormMessage.textContent = 'We could not connect to the form service. Please try again or email me directly.';
				contactFormMessage.classList.add('text-brandYellow');
				submitButton.disabled = false;
				contactForm.removeAttribute('aria-busy');
				return;
			}

			if (!response.ok) {
				console.error(`Contact form service returned HTTP ${response.status}.`);
				contactFormMessage.textContent = 'Your message could not be sent. Please try again or email me directly.';
				contactFormMessage.classList.add('text-brandYellow');
				submitButton.disabled = false;
				contactForm.removeAttribute('aria-busy');
				return;
			}

			contactForm.reset();
			contactFormMessage.textContent = 'Your message has been sent. Thank you.';
			submitButton.disabled = false;
			contactForm.removeAttribute('aria-busy');
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
