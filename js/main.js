// Main JavaScript entry point
document.addEventListener('DOMContentLoaded', () => {
	// Shared site navigation, including keyboard and mobile dismissal.
	const navToggle = document.getElementById('navToggle');
	const header = navToggle?.closest('.site-header');
	const primaryNav = document.getElementById('primaryNav');

	if (navToggle && header && primaryNav) {
		const closeMenu = () => {
			header.classList.remove('nav-open');
			navToggle.setAttribute('aria-expanded', 'false');
		};

		navToggle.addEventListener('click', () => {
			const expanded = navToggle.getAttribute('aria-expanded') === 'true';
			navToggle.setAttribute('aria-expanded', String(!expanded));
			header.classList.toggle('nav-open', !expanded);
		});
		primaryNav.querySelectorAll('a').forEach(link => {
			link.addEventListener('click', closeMenu);
		});
		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape' && header.classList.contains('nav-open')) {
				closeMenu();
				navToggle.focus();
			}
		});
		document.addEventListener('click', (event) => {
			if (!header.contains(event.target)) closeMenu();
		});
		header.addEventListener('focusout', (event) => {
			if (!header.contains(event.relatedTarget)) closeMenu();
		});
		window.matchMedia('(max-width: 900px)').addEventListener('change', closeMenu);
	}

	// Hero heading reveal (CSS-based to avoid layout shifts)
	const heroHeading = document.querySelector('#home .hero-left h1');
	if (heroHeading) {
		// keep server-rendered text to avoid CLS; use CSS reveal
		requestAnimationFrame(() => {
			heroHeading.classList.add('visible');
		});
	}

	// Reveal supporting case-study and skills content as it enters the viewport.
	const revealItems = document.querySelectorAll('[data-reveal]');
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (revealItems.length && !reducedMotion && 'IntersectionObserver' in window) {
		document.documentElement.classList.add('js-enhanced');
		const revealObserver = new IntersectionObserver((entries, observer) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) return;
				entry.target.classList.add('is-revealed');
				observer.unobserve(entry.target);
			});
		}, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

		revealItems.forEach((item) => {
			item.classList.add('reveal-on-scroll');
			revealObserver.observe(item);
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
	const skillsExplorer = document.querySelector('.skills-explorer');
	const skillsLayout = document.querySelector('.skills-explorer-layout');
	const skillsOrbit = document.querySelector('.skills-orbit');
	const orbitNodes = [...document.querySelectorAll('.skills-orbit-node[data-skill-filter]')];
	if (skillFilters.length && skillDomains.length && skillsExplorer && skillsLayout && skillsOrbit && orbitNodes.length) {
		const skillsReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		const skillsCompactOrbit = window.matchMedia('(max-width: 640px)');
		let orbitRotation = -90;
		let orbitFrame = 0;
		let previousFrameTime = 0;
		let explorerVisible = false;
		let pointerPaused = false;
		let focusPaused = false;
		let explorerState = 'idle';

		const renderOrbit = () => {
			if (skillsCompactOrbit.matches) {
				orbitNodes.forEach((node) => node.style.removeProperty('transform'));
				return;
			}

			const radius = Math.max(112, skillsOrbit.clientWidth * 0.34);
			orbitNodes.forEach((node, index) => {
				const angle = (orbitRotation + (index * 90)) * (Math.PI / 180);
				const x = Math.cos(angle) * radius;
				const y = Math.sin(angle) * radius;
				node.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0)`;
			});
		};

		const setIdleShift = () => {
			if (window.matchMedia('(max-width: 860px)').matches) {
				skillsOrbit.style.setProperty('--orbit-idle-shift', '0px');
				return;
			}
			const orbitCenter = skillsOrbit.offsetLeft + (skillsOrbit.offsetWidth / 2);
			const stageCenter = skillsLayout.clientWidth / 2;
			skillsOrbit.style.setProperty('--orbit-idle-shift', `${stageCenter - orbitCenter}px`);
		};

		const stopOrbit = () => {
			if (orbitFrame) window.cancelAnimationFrame(orbitFrame);
			orbitFrame = 0;
			previousFrameTime = 0;
		};

		const shouldRotate = () => explorerVisible
			&& explorerState === 'idle'
			&& !pointerPaused
			&& !focusPaused
			&& !skillsReducedMotion.matches
			&& !skillsCompactOrbit.matches;

		const rotateOrbit = (time) => {
			if (!shouldRotate()) {
				stopOrbit();
				return;
			}
			if (previousFrameTime) {
				const elapsed = Math.min(time - previousFrameTime, 40);
				orbitRotation = (orbitRotation + (elapsed * 0.009)) % 360;
				renderOrbit();
			}
			previousFrameTime = time;
			orbitFrame = window.requestAnimationFrame(rotateOrbit);
		};

		const startOrbit = () => {
			if (!shouldRotate() || orbitFrame) return;
			orbitFrame = window.requestAnimationFrame(rotateOrbit);
		};

		const animateOrbitTo = (targetRotation) => {
			stopOrbit();
			const delta = ((targetRotation - orbitRotation + 540) % 360) - 180;
			if (skillsReducedMotion.matches || skillsCompactOrbit.matches) {
				orbitRotation += delta;
				renderOrbit();
				return;
			}

			const startRotation = orbitRotation;
			const startTime = performance.now();
			const duration = 680;
			const step = (time) => {
				const progress = Math.min((time - startTime) / duration, 1);
				const eased = 1 - Math.pow(1 - progress, 3);
				orbitRotation = startRotation + (delta * eased);
				renderOrbit();
				if (progress < 1) orbitFrame = window.requestAnimationFrame(step);
				else orbitFrame = 0;
			};
			orbitFrame = window.requestAnimationFrame(step);
		};

		const setPressedState = (selectedDomain) => {
			skillFilters.forEach((filter) => {
				const isSelected = filter.dataset.skillFilter === selectedDomain;
				filter.setAttribute('aria-pressed', String(isSelected));
				filter.classList.toggle('is-active', isSelected);
			});
		};

		const showDomain = (selectedDomain) => {
			explorerState = 'focused';
			skillsLayout.dataset.skillsState = explorerState;
			setPressedState(selectedDomain);

			skillDomains.forEach((domain) => {
				const isSelected = domain.dataset.skillDomain === selectedDomain;
				domain.hidden = !isSelected;
				domain.classList.toggle('is-entering', isSelected);
			});

			const selectedNode = orbitNodes.find((node) => node.dataset.skillFilter === selectedDomain);
			const selectedIndex = Number(selectedNode?.dataset.orbitIndex || 0);
			animateOrbitTo(-(selectedIndex * 90));
		};

		const showAllDomains = () => {
			explorerState = 'all';
			skillsLayout.dataset.skillsState = explorerState;
			stopOrbit();
			setPressedState('all');
			skillDomains.forEach((domain) => {
				domain.hidden = false;
				domain.classList.remove('is-entering');
			});
		};

		skillFilters.forEach((filter) => {
			filter.addEventListener('click', () => {
				const selectedDomain = filter.dataset.skillFilter;
				if (selectedDomain === 'all') showAllDomains();
				else showDomain(selectedDomain);
			});
		});

		skillsOrbit.addEventListener('pointerenter', () => {
			pointerPaused = true;
			stopOrbit();
		});
		skillsOrbit.addEventListener('pointerleave', () => {
			pointerPaused = false;
			startOrbit();
		});
		skillsOrbit.addEventListener('focusin', () => {
			focusPaused = true;
			stopOrbit();
		});
		skillsOrbit.addEventListener('focusout', () => {
			window.requestAnimationFrame(() => {
				focusPaused = skillsOrbit.contains(document.activeElement);
				startOrbit();
			});
		});

		const orbitObserver = new IntersectionObserver((entries) => {
			explorerVisible = entries[0]?.isIntersecting || false;
			if (explorerVisible) startOrbit();
			else stopOrbit();
		}, { threshold: 0.28 });
		orbitObserver.observe(skillsExplorer);

		const handleOrbitLayoutChange = () => {
			setIdleShift();
			renderOrbit();
			startOrbit();
		};
		window.addEventListener('resize', handleOrbitLayoutChange);
		skillsReducedMotion.addEventListener('change', handleOrbitLayoutChange);
		skillsCompactOrbit.addEventListener('change', handleOrbitLayoutChange);

		skillsLayout.dataset.skillsState = 'idle';
		setPressedState('');
		skillDomains.forEach((domain) => { domain.hidden = true; });
		requestAnimationFrame(() => {
			setIdleShift();
			renderOrbit();
		});
	}

	/* Contact form validation (client-side) */
	const contactForm = document.getElementById('contactForm');
	const contactFormMessage = document.getElementById('contactFormMessage');
	if (contactForm) {
		const emailInput = contactForm.querySelector('#cf-email');

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

			// Names may contain characters from any language. Never render them as HTML.
			if (!name.value.trim()) {
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

	// A source is attached only after Play: neither posters nor browsing a gallery
	// should download a demo. Releasing the source also cancels hidden downloads.
	const createVideoPlayer = (video) => {
		if (!video) return null;
		const shell = document.createElement('div');
		shell.className = 'video-player';
		shell.hidden = true;
		video.before(shell);
		shell.append(video);
		video.controls = false;
		video.playsInline = true;
		video.preload = 'none';
		video.classList.add('video-player-media');
		const panel = document.createElement('div');
		panel.className = 'video-player-panel';
		const play = document.createElement('button');
		play.type = 'button';
		play.className = 'video-play-button';
		const status = document.createElement('p');
		status.className = 'video-player-status';
		status.setAttribute('role', 'status');
		const direct = document.createElement('a');
		direct.textContent = 'Open MP4';
		direct.target = '_blank';
		direct.rel = 'noopener';
		panel.append(play, status, direct);
		shell.append(panel);
		let media;
		let active = false;
		let generation = 0;
		let slowTimer;

		const clearSlowTimer = () => window.clearTimeout(slowTimer);
		const loading = (message) => {
			if (!active) return;
			shell.dataset.state = 'loading';
			status.textContent = message;
			clearSlowTimer();
			slowTimer = window.setTimeout(() => {
				if (active && shell.dataset.state === 'loading') {
					status.textContent = 'Taking a little longer. Keep this open, or try the MP4 link.';
				}
			}, 12000);
		};
		const failed = () => {
			if (!active) return;
			clearSlowTimer();
			shell.dataset.state = 'error';
			play.textContent = 'Retry video';
			status.textContent = 'Could not load. Check your connection and retry.';
		};
		const start = () => {
			active = true;
			const attempt = ++generation;
			loading('Loading video…');
			video.controls = true;
			video.src = media.src;
			video.preload = 'auto';
			video.play().then(() => {
				if (attempt === generation && active) video.focus({ preventScroll: true });
			}).catch((error) => {
				if (attempt !== generation || !active) return;
				if (error.name === 'NotAllowedError') {
					shell.dataset.state = 'ready';
					play.textContent = 'Play demo';
					status.textContent = 'Tap Play to start the video.';
					clearSlowTimer();
				} else if (error.name !== 'AbortError') {
					failed();
				}
			});
		};
		play.addEventListener('click', start);
		video.addEventListener('error', failed);
		video.addEventListener('waiting', () => loading('Buffering…'));
		video.addEventListener('playing', () => {
			clearSlowTimer();
			shell.dataset.state = 'playing';
			status.textContent = '';
		});
		video.addEventListener('canplay', () => {
			if (active && shell.dataset.state === 'loading') {
				clearSlowTimer();
				shell.dataset.state = 'playing';
				status.textContent = '';
			}
		});
		const stop = () => {
			active = false;
			generation++;
			clearSlowTimer();
			video.pause();
			if (video.hasAttribute('src')) {
				video.removeAttribute('src');
				video.load();
			}
			video.preload = 'none';
			video.controls = false;
			shell.hidden = true;
		};
		const prepare = (item) => {
			stop();
			media = item;
			video.poster = item.poster;
			video.setAttribute('aria-label', item.alt);
			video.hidden = false;
			shell.hidden = false;
			shell.dataset.state = 'ready';
			play.textContent = 'Play demo';
			status.textContent = item.info + ' · Loads only when you press play';
			direct.href = item.src;
		};
		return { shell, prepare, start, stop };
	};

	const galleryType = document.body.dataset.gallery || '';
	let galleryMedia = [];
	if (galleryType === 'telemetry') {
		galleryMedia = [1, 2, 3, 4, 5].map((n) => ({
			type: 'image', src: `../assets/images/tele_${n}.webp`, alt: `Telemetry image ${n}`
		}));
	} else if (galleryType === 'bible-quest') {
		galleryMedia = [1, 2, 3, 4, 5, 6].map((n) => ({
			type: 'image', src: `../assets/images/BQ_${n}.webp`, alt: `Bible Quest screenshot ${n}`
		}));
		galleryMedia.push({
			type: 'video', src: '../assets/images/BibleQuest-optimized.mp4',
			poster: '../assets/images/BQ_5.webp', alt: 'Bible Quest demo video',
			info: '52 seconds / 1.66 MB'
		});
	} else if (galleryType === 'cnc') {
		galleryMedia = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
			type: 'image', src: `../assets/images/CNC_${n}.webp`, alt: `CNC Simulator screenshot ${n}`
		}));
		galleryMedia.push({
			type: 'video', src: '../assets/images/cnc-optimized.mp4',
			poster: '../assets/images/CNC_1.webp', alt: 'CNC Simulator demo video',
			info: '65 seconds / 2.84 MB'
		});
	}

	if (galleryType === 'cnc') {
		const showcase = document.querySelector('.cnc-showcase');
		const showcaseImage = showcase?.querySelector('.cnc-showcase-image');
		const showcaseVideo = showcase?.querySelector('.cnc-showcase-video');
		const showcaseCaption = document.querySelector('.cnc-showcase-caption');
		const player = createVideoPlayer(showcaseVideo);
		const demoButton = document.querySelector('[data-cnc-demo]');
		const imagesButton = document.querySelector('[data-cnc-images]');
		let showcaseIndex = 0;
		const showCncMedia = (index) => {
			showcaseIndex = ((index % galleryMedia.length) + galleryMedia.length) % galleryMedia.length;
			const media = galleryMedia[showcaseIndex];
			const showVideo = media.type === 'video';
			showcaseImage.hidden = showVideo;
			if (showVideo) player.prepare(media);
			else {
				player.stop();
				showcaseImage.src = media.src;
				showcaseImage.alt = media.alt;
			}
			showcase.classList.toggle('is-video', showVideo);
			demoButton.setAttribute('aria-pressed', String(showVideo));
			imagesButton.setAttribute('aria-pressed', String(!showVideo));
			showcaseCaption.textContent = showVideo ? 'Demo video' : `Image ${showcaseIndex + 1} of 8`;
		};
		showcase?.querySelector('.cnc-showcase-prev')?.addEventListener('click', () => showCncMedia(showcaseIndex - 1));
		showcase?.querySelector('.cnc-showcase-next')?.addEventListener('click', () => showCncMedia(showcaseIndex + 1));
		demoButton?.addEventListener('click', () => showCncMedia(galleryMedia.length - 1));
		imagesButton?.addEventListener('click', () => showCncMedia(0));
	}

	const galleryItems = document.querySelectorAll('.gallery-item');
	const galleryModal = document.querySelector('.gallery-modal');
	const galleryViewer = document.querySelector('.gallery-viewer');
	const galleryCurrent = document.querySelector('.gallery-viewer img.gallery-current');
	const galleryCurrentSource = document.querySelector('.gallery-viewer picture source');
	const galleryCurrentVideo = document.querySelector('.gallery-viewer video.gallery-current-video');
	const galleryPlayer = createVideoPlayer(galleryCurrentVideo);
	const galleryCaption = document.querySelector('.gallery-caption');
	const galleryPrev = document.querySelector('.gallery-prev');
	const galleryNext = document.querySelector('.gallery-next');
	const galleryClose = document.querySelector('.gallery-close');
	let currentGalleryIndex = 0;
	let galleryOpener;
	let previousOverflow = '';

	const updateGallery = (index) => {
		if (!galleryMedia.length) return;
		currentGalleryIndex = ((index % galleryMedia.length) + galleryMedia.length) % galleryMedia.length;
		const current = galleryMedia[currentGalleryIndex];
		galleryPlayer?.stop();
		const showVideo = current.type === 'video';
		galleryViewer.classList.toggle('is-video', showVideo);
		galleryCaption.hidden = showVideo; // Never cover the native playback controls.
		galleryCurrent.style.display = showVideo ? 'none' : 'block';
		if (!showVideo) {
			if (galleryCurrentSource) galleryCurrentSource.srcset = current.src;
			galleryCurrent.src = current.src;
			galleryCurrent.srcset = current.src;
			galleryCurrent.alt = current.alt;
			const imageCount = galleryMedia.filter((item) => item.type === 'image').length;
			galleryCaption.textContent = `Image ${currentGalleryIndex + 1} of ${imageCount}`;
		} else {
			galleryPlayer?.prepare(current);
		}
	};
	const openGallery = (index, opener) => {
		galleryOpener = opener;
		updateGallery(index);
		galleryModal.classList.add('active');
		galleryModal.setAttribute('aria-hidden', 'false');
		previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		galleryClose.focus();
	};
	const closeGallery = () => {
		galleryPlayer?.stop();
		galleryModal.classList.remove('active');
		galleryModal.setAttribute('aria-hidden', 'true');
		document.body.style.overflow = previousOverflow;
		galleryOpener?.focus();
	};
	if (galleryItems.length && galleryModal && galleryCurrent && galleryPrev && galleryNext && galleryClose) {
		galleryItems.forEach((item) => item.addEventListener('click', () => {
			openGallery(Number(item.dataset.index) || 0, item);
		}));
		galleryPrev.addEventListener('click', () => updateGallery(currentGalleryIndex - 1));
		galleryNext.addEventListener('click', () => updateGallery(currentGalleryIndex + 1));
		galleryClose.addEventListener('click', closeGallery);
		galleryModal.addEventListener('click', (event) => {
			if (event.target === galleryModal || event.target.classList.contains('gallery-modal-overlay')) closeGallery();
		});
		document.addEventListener('keydown', (event) => {
			if (!galleryModal.classList.contains('active')) return;
			if (event.key === 'Escape') closeGallery();
			// Arrow keys belong to native video controls while watching a demo.
			if (galleryMedia[currentGalleryIndex].type !== 'video') {
				if (event.key === 'ArrowLeft') updateGallery(currentGalleryIndex - 1);
				if (event.key === 'ArrowRight') updateGallery(currentGalleryIndex + 1);
			}
			if (event.key === 'Tab') {
				const focusable = Array.from(galleryModal.querySelectorAll('button, a[href], video[controls]'))
					.filter((element) => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
				const first = focusable[0];
				const last = focusable[focusable.length - 1];
				if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
				else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
			}
		});
	}
});
