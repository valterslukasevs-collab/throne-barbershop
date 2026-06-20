/* ═══════════════════════════════════════════════
   THRONE — Premium Barbershop | GSAP Powered
   Custom cursor, magnetic buttons, GSAP reveals,
   preloader, ScrollTrigger parallax, 3D cards
   ═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    // Register GSAP plugins
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    /* ────────────────────────────────────────
       PRELOADER
       ──────────────────────────────────────── */
    const preloader     = document.getElementById('preloader');
    const preloaderFill = document.getElementById('preloaderFill');
    const preloaderNum  = document.getElementById('preloaderCounter');

    if (preloader && preloaderFill && preloaderNum) {
        document.body.style.overflow = 'hidden';
        let preloaderDone = false;

        function finishPreloader() {
            if (preloaderDone) return;
            preloaderDone = true;
            preloaderNum.textContent = '100';
            preloaderFill.style.width = '100%';

            setTimeout(() => {
                preloader.style.transition = 'opacity 0.6s ease, visibility 0.6s ease';
                preloader.style.opacity = '0';
                preloader.style.visibility = 'hidden';
                setTimeout(() => {
                    preloader.classList.add('done');
                    preloader.style.display = 'none';
                    document.body.style.overflow = '';
                    initGSAPAnimations();
                }, 600);
            }, 300);
        }

        // GSAP preloader counter (smooth visual)
        if (typeof gsap !== 'undefined') {
            const counter = { val: 0 };
            gsap.to(counter, {
                val: 100,
                duration: 1.8,
                ease: 'power4.out',
                onUpdate: () => {
                    const v = Math.round(counter.val);
                    preloaderNum.textContent = v;
                    preloaderFill.style.width = v + '%';
                },
                onComplete: finishPreloader
            });
        }

        // Fallback: force finish after 3 seconds no matter what
        // (handles background tab throttling in Chrome)
        setTimeout(finishPreloader, 3000);

    } else {
        // No preloader (booking page) — init immediately
        initGSAPAnimations();
    }


    /* ────────────────────────────────────────
       CUSTOM CURSOR
       ──────────────────────────────────────── */
    const cursor = document.getElementById('cursor');

    if (cursor && window.matchMedia('(pointer: fine)').matches) {
        let cx = 0, cy = 0;
        let tx = 0, ty = 0;

        document.addEventListener('mousemove', (e) => {
            tx = e.clientX;
            ty = e.clientY;
        }, { passive: true });

        // Smooth follow with GSAP ticker
        gsap.ticker.add(() => {
            cx += (tx - cx) * 0.15;
            cy += (ty - cy) * 0.15;
            gsap.set(cursor, { x: cx, y: cy });
        });

        // Hover state
        const hoverTargets = document.querySelectorAll('a, button, .magnetic, .service-card, .gallery__item, .review');
        hoverTargets.forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
        });

        // Click state
        document.addEventListener('mousedown', () => cursor.classList.add('clicking'));
        document.addEventListener('mouseup',   () => cursor.classList.remove('clicking'));
    }


    /* ────────────────────────────────────────
       MAGNETIC BUTTONS (GSAP powered)
       ──────────────────────────────────────── */
    const magnets = document.querySelectorAll('.magnetic');

    magnets.forEach(el => {
        const strength = parseFloat(el.dataset.strength) || 10;

        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            gsap.to(el, {
                x: x / (40 / strength),
                y: y / (40 / strength),
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        el.addEventListener('mouseleave', () => {
            gsap.to(el, {
                x: 0,
                y: 0,
                duration: 0.6,
                ease: 'elastic.out(1, 0.5)'
            });
        });
    });


    /* ────────────────────────────────────────
       HEADER SCROLL
       ──────────────────────────────────────── */
    const header = document.getElementById('header');
    const scrollProgress = document.getElementById('scrollProgress');

    const fixedBookBtn = document.getElementById('fixedBookBtn');
    const heroCtas = document.querySelector('.hero__ctas');

    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 80);

            if (scrollProgress) {
                const docH = document.documentElement.scrollHeight - window.innerHeight;
                const pct = docH > 0 ? (window.scrollY / docH) * 100 : 0;
                scrollProgress.style.width = pct + '%';
            }

            if (fixedBookBtn && heroCtas) {
                const heroBottom = heroCtas.getBoundingClientRect().bottom;
                fixedBookBtn.classList.toggle('visible', heroBottom < 0);
            }
        }, { passive: true });
    }


    /* ────────────────────────────────────────
       BURGER / MOBILE NAV
       ──────────────────────────────────────── */
    const burger    = document.getElementById('burger');
    const mobileNav = document.getElementById('mobileNav');

    if (burger && mobileNav) {
        burger.addEventListener('click', () => {
            const isOpening = !burger.classList.contains('active');
            burger.classList.toggle('active');
            mobileNav.classList.toggle('active');
            document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';

            // GSAP stagger mobile nav links
            if (isOpening) {
                gsap.from('.mobile-nav__link', {
                    y: 60,
                    opacity: 0,
                    duration: 0.5,
                    stagger: 0.08,
                    ease: 'power3.out',
                    delay: 0.2
                });
            }
        });

        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                burger.classList.remove('active');
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }


    /* ────────────────────────────────────────
       SMOOTH SCROLL (anchor links)
       ──────────────────────────────────────── */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });


    /* ────────────────────────────────────────
       GSAP ANIMATIONS MASTER FUNCTION
       ──────────────────────────────────────── */
    function initGSAPAnimations() {
        if (typeof gsap === 'undefined') return;

        // ── HERO TIMELINE ──
        const heroTitle = document.getElementById('heroTitle');
        if (heroTitle) {
            const heroTl = gsap.timeline({ delay: 0.2 });

            // Hero chars fly in with stagger
            heroTl.from('.hero__char', {
                y: 120,
                opacity: 0,
                rotateX: -90,
                duration: 0.8,
                stagger: 0.06,
                ease: 'back.out(1.7)'
            });

            // Subtitle line extends
            heroTl.from('.hero__line', {
                scaleX: 0,
                duration: 0.6,
                ease: 'power3.inOut'
            }, '-=0.3');

            // Subtitle text fades in
            heroTl.from('.hero__subtitle span:last-child', {
                opacity: 0,
                x: -30,
                duration: 0.5,
                ease: 'power2.out'
            }, '-=0.3');

            // Tagline
            heroTl.from('.hero__tagline', {
                opacity: 0,
                y: 30,
                duration: 0.6,
                ease: 'power2.out'
            }, '-=0.2');

            // CTA buttons stagger
            heroTl.from('.hero__ctas .btn', {
                opacity: 0,
                y: 40,
                scale: 0.9,
                duration: 0.5,
                stagger: 0.1,
                ease: 'power2.out'
            }, '-=0.3');

            // Scroll indicator
            heroTl.from('.hero__scroll', {
                opacity: 0,
                y: 20,
                duration: 0.5,
                ease: 'power2.out'
            }, '-=0.2');

            // Badge
            heroTl.from('.hero__badge', {
                opacity: 0,
                scale: 0.5,
                duration: 0.5,
                ease: 'back.out(2)'
            }, '-=0.3');

            // Hero background subtle zoom
            gsap.from('.hero__bg-img', {
                scale: 1.2,
                duration: 2,
                ease: 'power2.out'
            });
        }


        // ── HERO PARALLAX ON SCROLL ──
        if (document.querySelector('.hero__bg-img')) {
            gsap.to('.hero__bg-img', {
                yPercent: 30,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.hero',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true
                }
            });

            // Hero content fades out on scroll
            gsap.to('.hero__content', {
                opacity: 0,
                y: -100,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.hero',
                    start: '30% top',
                    end: 'bottom top',
                    scrub: true
                }
            });
        }


        // ── MARQUEE SPEED ON SCROLL ──
        const marqueeTrack = document.querySelector('.marquee__track');
        if (marqueeTrack) {
            // Marquee skews based on scroll velocity
            let lastScrollY = 0;
            ScrollTrigger.create({
                onUpdate: (self) => {
                    const velocity = self.getVelocity();
                    const skew = gsap.utils.clamp(-5, 5, velocity / 300);
                    gsap.to(marqueeTrack, {
                        skewX: skew,
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                }
            });

            // Marquee scale on scroll
            gsap.from('.marquee', {
                scrollTrigger: {
                    trigger: '.marquee',
                    start: 'top 90%',
                    end: 'top 50%',
                    scrub: 1
                },
                scaleX: 0.8,
                opacity: 0.3
            });
        }


        // ── ABOUT SECTION ──
        const about = document.querySelector('.about');
        if (about) {
            // Image clip-path reveal
            gsap.from('.about__image-wrap', {
                clipPath: 'inset(100% 0 0 0)',
                duration: 1.2,
                ease: 'power3.inOut',
                scrollTrigger: {
                    trigger: '.about',
                    start: 'top 70%'
                }
            });

            // Image overlay badge
            gsap.from('.about__image-overlay', {
                opacity: 0,
                scale: 0,
                duration: 0.6,
                ease: 'back.out(2)',
                scrollTrigger: {
                    trigger: '.about__image-wrap',
                    start: 'top 50%'
                },
                delay: 0.8
            });

            // Section tag
            gsap.from('.about .section-tag', {
                opacity: 0,
                x: -40,
                duration: 0.6,
                ease: 'power2.out',
                scrollTrigger: { trigger: '.about__right', start: 'top 75%' }
            });

            // Title words
            gsap.from('.about__title', {
                opacity: 0,
                y: 60,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: { trigger: '.about__title', start: 'top 80%' }
            });

            // Text paragraphs stagger
            gsap.from('.about__text', {
                opacity: 0,
                y: 40,
                duration: 0.6,
                stagger: 0.15,
                ease: 'power2.out',
                scrollTrigger: { trigger: '.about__text', start: 'top 85%' }
            });

            // Stats counter animation with GSAP
            gsap.from('.about__stats', {
                opacity: 0,
                y: 30,
                duration: 0.6,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: '.about__stats',
                    start: 'top 85%',
                    onEnter: () => animateCounters()
                }
            });
        }


        // ── TEAM SECTION ──
        const team = document.querySelector('.team');
        if (team) {
            gsap.from('.team .section-tag', {
                opacity: 0, x: -40, duration: 0.6, ease: 'power2.out',
                scrollTrigger: { trigger: '.team__header', start: 'top 80%' }
            });
            gsap.from('.team__title', {
                opacity: 0, y: 60, duration: 0.8, ease: 'power3.out',
                scrollTrigger: { trigger: '.team__title', start: 'top 85%' }
            });

            // Master cards stagger with 3D rotation
            gsap.from('.master-card', {
                opacity: 0,
                y: 80,
                rotateY: 15,
                scale: 0.9,
                duration: 0.8,
                stagger: 0.15,
                ease: 'power3.out',
                scrollTrigger: { trigger: '.team__grid', start: 'top 80%' }
            });
        }


        // ── SERVICES SECTION ──
        const services = document.querySelector('.services');
        if (services) {
            gsap.from('.services .section-tag', {
                opacity: 0, x: -40, duration: 0.6, ease: 'power2.out',
                scrollTrigger: { trigger: '.services__header', start: 'top 80%' }
            });
            gsap.from('.services__title', {
                opacity: 0, y: 60, duration: 0.8, ease: 'power3.out',
                scrollTrigger: { trigger: '.services__title', start: 'top 85%' }
            });

            // Service cards stagger from bottom with scale
            gsap.from('.service-card', {
                opacity: 0,
                y: 100,
                scale: 0.85,
                duration: 0.7,
                stagger: { each: 0.1, from: 'start' },
                ease: 'power3.out',
                scrollTrigger: { trigger: '.services__grid', start: 'top 80%' }
            });
        }


        // ── GALLERY SECTION ──
        const gallery = document.querySelector('.gallery');
        if (gallery) {
            gsap.from('.gallery .section-tag', {
                opacity: 0, x: -40, duration: 0.6, ease: 'power2.out',
                scrollTrigger: { trigger: '.gallery__header', start: 'top 80%' }
            });
            gsap.from('.gallery__title', {
                opacity: 0, y: 60, duration: 0.8, ease: 'power3.out',
                scrollTrigger: { trigger: '.gallery__title', start: 'top 85%' }
            });

            // Gallery items clip-path reveal
            document.querySelectorAll('.gallery__item').forEach((item, i) => {
                gsap.from(item, {
                    clipPath: 'inset(100% 0 0 0)',
                    duration: 1,
                    ease: 'power3.inOut',
                    scrollTrigger: { trigger: item, start: 'top 85%' },
                    delay: i * 0.08
                });
            });

            // Gallery images parallax inside container
            document.querySelectorAll('.gallery__img').forEach(img => {
                gsap.to(img, {
                    yPercent: -15,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: img.parentElement,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: 1
                    }
                });
            });
        }


        // ── BIG TEXT DIVIDER ──
        const bigText = document.querySelector('.big-text');
        if (bigText) {
            const bigWords = bigText.querySelectorAll('.big-text__word, .big-text__ampersand');
            bigWords.forEach((word, i) => {
                gsap.from(word, {
                    opacity: 0,
                    y: 100,
                    scale: 0.5,
                    duration: 0.8,
                    ease: 'power3.out',
                    scrollTrigger: { trigger: bigText, start: 'top 80%' },
                    delay: i * 0.15
                });
            });

            // Horizontal movement on scroll
            gsap.to('.big-text__wrap', {
                x: -50,
                ease: 'none',
                scrollTrigger: {
                    trigger: bigText,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1
                }
            });
        }


        // ── REVIEWS SECTION ──
        const reviews = document.querySelector('.reviews');
        if (reviews) {
            gsap.from('.reviews .section-tag', {
                opacity: 0, x: -40, duration: 0.6, ease: 'power2.out',
                scrollTrigger: { trigger: '.reviews__header', start: 'top 80%' }
            });
            gsap.from('.reviews__title', {
                opacity: 0, y: 60, duration: 0.8, ease: 'power3.out',
                scrollTrigger: { trigger: '.reviews__title', start: 'top 85%' }
            });

            // Review cards stagger with rotation
            gsap.from('.review', {
                opacity: 0,
                y: 80,
                rotateX: 10,
                duration: 0.7,
                stagger: 0.12,
                ease: 'power3.out',
                scrollTrigger: { trigger: '.reviews__grid', start: 'top 80%' }
            });
        }


        // ── CTA SECTION ──
        const cta = document.querySelector('.cta');
        if (cta) {
            gsap.from('.cta__eyebrow', {
                opacity: 0, y: 30, duration: 0.5, ease: 'power2.out',
                scrollTrigger: { trigger: cta, start: 'top 75%' }
            });

            gsap.from('.cta__title', {
                opacity: 0, y: 80, scale: 0.9, duration: 0.8, ease: 'power3.out',
                scrollTrigger: { trigger: cta, start: 'top 75%' },
                delay: 0.1
            });

            gsap.from('.cta .btn', {
                opacity: 0, y: 40, scale: 0.8, duration: 0.6, ease: 'back.out(2)',
                scrollTrigger: { trigger: cta, start: 'top 75%' },
                delay: 0.3
            });
        }


        // ── CONTACT SECTION ──
        const contact = document.querySelector('.contact');
        if (contact) {
            gsap.from('.contact .section-tag', {
                opacity: 0, x: -40, duration: 0.6, ease: 'power2.out',
                scrollTrigger: { trigger: '.contact__info', start: 'top 80%' }
            });
            gsap.from('.contact__title', {
                opacity: 0, y: 60, duration: 0.8, ease: 'power3.out',
                scrollTrigger: { trigger: '.contact__title', start: 'top 85%' }
            });
            gsap.from('.contact__item', {
                opacity: 0, x: -30, duration: 0.5, stagger: 0.1, ease: 'power2.out',
                scrollTrigger: { trigger: '.contact__details', start: 'top 85%' }
            });
            gsap.from('.contact__social', {
                opacity: 0, y: 20, duration: 0.4, stagger: 0.08, ease: 'power2.out',
                scrollTrigger: { trigger: '.contact__socials', start: 'top 90%' }
            });

            // Map reveal
            gsap.from('.contact__map', {
                clipPath: 'inset(0 100% 0 0)',
                duration: 1,
                ease: 'power3.inOut',
                scrollTrigger: { trigger: '.contact__map', start: 'top 75%' }
            });
        }


        // ── FOOTER ──
        const footer = document.querySelector('.footer');
        if (footer) {
            gsap.from('.footer__brand', {
                opacity: 0, y: 30, duration: 0.5, ease: 'power2.out',
                scrollTrigger: { trigger: footer, start: 'top 90%' }
            });
            gsap.from('.footer__links a', {
                opacity: 0, y: 20, duration: 0.4, stagger: 0.06, ease: 'power2.out',
                scrollTrigger: { trigger: '.footer__links', start: 'top 95%' }
            });
        }
    }


    /* ────────────────────────────────────────
       COUNTER ANIMATION (GSAP)
       ──────────────────────────────────────── */
    function animateCounters() {
        document.querySelectorAll('[data-count]').forEach(el => {
            const target = parseInt(el.dataset.count);
            const counter = { val: 0 };

            gsap.to(counter, {
                val: target,
                duration: 2,
                ease: 'power4.out',
                onUpdate: () => {
                    const current = Math.round(counter.val);
                    if (target >= 1000) {
                        el.textContent = current.toLocaleString('en-US') + '+';
                    } else if (target > 10) {
                        el.textContent = current + '+';
                    } else {
                        el.textContent = current;
                    }
                }
            });
        });
    }


    /* ────────────────────────────────────────
       SERVICE CARD 3D TILT (GSAP hover)
       ──────────────────────────────────────── */
    if (window.matchMedia('(pointer: fine)').matches) {
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const midX = rect.width / 2;
                const midY = rect.height / 2;

                const rotY = ((x - midX) / midX) * 8;
                const rotX = ((midY - y) / midY) * 8;

                gsap.to(card, {
                    rotateX: rotX,
                    rotateY: rotY,
                    y: -6,
                    duration: 0.3,
                    ease: 'power2.out',
                    transformPerspective: 800
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    rotateX: 0,
                    rotateY: 0,
                    y: 0,
                    duration: 0.6,
                    ease: 'elastic.out(1, 0.6)'
                });
            });
        });
    }


    /* ────────────────────────────────────────
       GALLERY HOVER PARALLAX (GSAP)
       ──────────────────────────────────────── */
    if (window.matchMedia('(pointer: fine)').matches) {
        document.querySelectorAll('.gallery__item').forEach(item => {
            const img = item.querySelector('.gallery__img');
            if (!img) return;

            item.addEventListener('mousemove', (e) => {
                const rect = item.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;

                gsap.to(img, {
                    scale: 1.08,
                    x: x * -15,
                    y: y * -15,
                    duration: 0.4,
                    ease: 'power2.out'
                });
            });

            item.addEventListener('mouseleave', () => {
                gsap.to(img, {
                    scale: 1,
                    x: 0,
                    y: 0,
                    duration: 0.6,
                    ease: 'power2.out'
                });
            });
        });
    }


    /* ────────────────────────────────────────
       HERO MOUSE PARALLAX
       ──────────────────────────────────────── */
    if (window.matchMedia('(min-width: 769px) and (pointer: fine)').matches) {
        const hero = document.getElementById('hero');
        if (hero) {
            document.addEventListener('mousemove', (e) => {
                const xRatio = e.clientX / window.innerWidth - 0.5;
                const yRatio = e.clientY / window.innerHeight - 0.5;

                const gradient = hero.querySelector('.hero__bg-overlay');
                if (gradient) {
                    gsap.to(gradient, {
                        x: xRatio * 30,
                        y: yRatio * 30,
                        duration: 0.8,
                        ease: 'power2.out'
                    });
                }
            }, { passive: true });
        }
    }


    /* ────────────────────────────────────────
       ACTIVE NAV LINK HIGHLIGHTING
       ──────────────────────────────────────── */
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.header__link');

    if (sections.length && navLinks.length) {
        sections.forEach(section => {
            ScrollTrigger.create({
                trigger: section,
                start: 'top 40%',
                end: 'bottom 40%',
                onEnter: () => setActiveNav(section.id),
                onEnterBack: () => setActiveNav(section.id)
            });
        });

        function setActiveNav(id) {
            navLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === '#' + id);
            });
        }
    }


    /* ────────────────────────────────────────
       LANGUAGE SWITCHER
       ──────────────────────────────────────── */
    const langToggle = document.getElementById('langToggle');
    let currentLang = localStorage.getItem('throne-lang') || 'en';

    function setLanguage(lang) {
        currentLang = lang;
        document.documentElement.lang = lang;
        localStorage.setItem('throne-lang', lang);

        // Update toggle UI
        if (langToggle) {
            const active = langToggle.querySelector('.lang-toggle__active');
            const inactive = langToggle.querySelector('.lang-toggle__inactive');
            active.textContent = lang.toUpperCase();
            inactive.textContent = lang === 'en' ? 'LV' : 'EN';
        }

        // Swap all text with data-en / data-lv attributes
        document.querySelectorAll('[data-en][data-lv]').forEach(el => {
            const text = el.dataset[lang];
            if (text !== undefined && text !== '') {
                if (text.includes('&') || text.includes('<')) {
                    el.innerHTML = text;
                } else {
                    el.textContent = text;
                }
            }
        });

        // Update placeholders
        document.querySelectorAll(`[data-${lang}-placeholder]`).forEach(el => {
            el.placeholder = el.dataset[`${lang}Placeholder`] || '';
        });

        // Notify booking wizard about language change
        window.dispatchEvent(new CustomEvent('throne-lang-change', { detail: { lang } }));
    }

    if (langToggle) {
        langToggle.addEventListener('click', () => {
            setLanguage(currentLang === 'en' ? 'lv' : 'en');
        });
    }

    // Apply saved language on load
    if (currentLang !== 'en') {
        setLanguage(currentLang);
    }

});
