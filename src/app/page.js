"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const navLinks = ["Hire now", "Find a job", "Career centers", "Handshake AI", "Research"];
const ctas = ["Find a job", "Find AI work", "Hire now", "Train your model"];

function AutoWordScroller({ words, intervalMs = 1200, transitionMs = 420, visibleCount = 9 }) {
    const list = useMemo(() => {
        if (!words?.length) return [];
        return [...words, ...words, ...words];
    }, [words]);

    const n = words?.length ?? 0;
    const startIndex = n;
    const endIndexExclusive = n * 2;
    const centerSlot = Math.floor(visibleCount / 2);

    const [index, setIndex] = useState(startIndex);
    const [instant, setInstant] = useState(false);

    useEffect(() => {
        if (!n) return;
        const t = window.setInterval(() => setIndex((prev) => prev + 1), intervalMs);
        return () => window.clearInterval(t);
    }, [n, intervalMs]);

    useEffect(() => {
        if (!n) return;
        if (index < endIndexExclusive) return;

        const reset = window.setTimeout(() => {
            setInstant(true);
            setIndex(startIndex);
            window.requestAnimationFrame(() => setInstant(false));
        }, transitionMs);

        return () => window.clearTimeout(reset);
    }, [index, endIndexExclusive, n, startIndex, transitionMs]);

    return (
        <div
            className="word-marquee"
            style={{ "--wm-index": index, "--wm-center": centerSlot, "--wm-ms": `${transitionMs}ms`, "--wm-visible": visibleCount }}
            aria-label="Auto scrolling words"
        >
            <div className={`word-track ${instant ? "instant" : ""}`}>
                {list.map((w, i) => (
                    <div key={`${w}-${i}`} className={`word-item ${i === index ? "active" : ""}`}>
                        <span className="word-pill">{w}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}

function smoothstep(t) {
    const x = clamp01(t);
    return x * x * (3 - 2 * x);
}

const professions = ["lawyers", "engineers", "creators", "students", "founders", "doctors", "teachers", "bankers", "interns"];

export default function HomePage() {
    const [scrollProgress, setScrollProgress] = useState(0);
    const stageRef = useRef(null);
    const builtForRef = useRef(null);
    const [activeWho, setActiveWho] = useState(-1);
    const [isMobile, setIsMobile] = useState(false);
    const [currentProfession, setCurrentProfession] = useState(0);
    const [builtForProgress, setBuiltForProgress] = useState(0);

    const rafRef = useRef(0);
    const latestProgressRef = useRef(0);

    // Cycle through professions for center badge
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentProfession((prev) => (prev + 1) % professions.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 680);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const onScroll = () => {
            const stage = stageRef.current;
            if (!stage) {
                return;
            }

            const stageTop = stage.offsetTop;
            const stageEnd = stageTop + stage.offsetHeight - window.innerHeight;
            const distance = Math.max(1, stageEnd - stageTop);
            const progress = Math.max(0, Math.min(1, (window.scrollY - stageTop) / distance));

            latestProgressRef.current = progress;
            if (rafRef.current) {
                return;
            }

            rafRef.current = window.requestAnimationFrame(() => {
                rafRef.current = 0;
                const next = latestProgressRef.current;
                setScrollProgress((prev) => (Math.abs(prev - next) < 0.001 ? prev : next));
            });
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);

        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            if (rafRef.current) {
                window.cancelAnimationFrame(rafRef.current);
                rafRef.current = 0;
            }
        };
    }, []);

    // Built For section scroll-based animation
    useEffect(() => {
        const onScroll = () => {
            const section = builtForRef.current;
            if (!section) return;

            const rect = section.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            // Start animation when section enters viewport, complete when centered
            const entryPoint = windowHeight * 0.9;
            const exitPoint = windowHeight * 0.1;
            
            if (rect.top > entryPoint) {
                setBuiltForProgress(0);
            } else if (rect.top < exitPoint) {
                setBuiltForProgress(1);
            } else {
                const progress = 1 - (rect.top - exitPoint) / (entryPoint - exitPoint);
                setBuiltForProgress(Math.max(0, Math.min(1, progress)));
            }
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Phase 1: morph hero -> gradient
    // Phase 2: within gradient, heading -> scrolling words
    // Phase 3: within gradient, scrolling words -> rotating logo
    const morphStart = isMobile ? 0.04 : 0.06;
    const morphEnd = isMobile ? 0.45 : 0.6;
    const wordsStart = morphEnd;
    const wordsEnd = isMobile ? 0.72 : 0.84;
    const logoStart = wordsEnd;
    const logoEnd = 1;

    const morphSpan = Math.max(0.0001, morphEnd - morphStart);
    const wordsSpan = Math.max(0.0001, wordsEnd - wordsStart);
    const logoSpan = Math.max(0.0001, logoEnd - logoStart);

    const rawMorph = Math.max(0, Math.min(1, (scrollProgress - morphStart) / morphSpan));
    const morphProgress = smoothstep(rawMorph);

    const rawWords = Math.max(0, Math.min(1, (scrollProgress - wordsStart) / wordsSpan));
    const wordsProgress = smoothstep(rawWords);

    const rawLogo = Math.max(0, Math.min(1, (scrollProgress - logoStart) / logoSpan));
    const logoProgress = smoothstep(rawLogo);

    // Hold the heading centered for a bit, then crossfade to words.
    const headingFade = smoothstep((wordsProgress - (isMobile ? 0.12 : 0.18)) / 0.32);
    const wordsIn = smoothstep((wordsProgress - (isMobile ? 0.22 : 0.32)) / 0.32);

    // After words are visible, transition to the rotating logo.
    const wordsOut = smoothstep((logoProgress - 0.05) / 0.35);
    const logoIn = smoothstep((logoProgress - 0.08) / 0.35);

    return (
        <main className="page morph-page">
            <section ref={stageRef} className="morph-stage" aria-label="Hero transition stage">
                <div className="scene-sticky">
                    <div className="scene-bg hero-bg" style={{ opacity: 1 - morphProgress }} />
                    <div className="scene-bg next-bg" style={{ opacity: morphProgress }} />

                    <div className="scene-frame">
                        <header className="scene-nav nav-dark" style={{ opacity: 1 - morphProgress, transform: `translateY(${-30 * morphProgress}px)` }}>
                            <div className="mobile-h-badge">H</div>
                            <div className="brand">Handshake</div>

                            <nav className="links" aria-label="Primary">
                                {navLinks.map((item) => (
                                    <a key={item} href="#">
                                        {item}
                                    </a>
                                ))}
                            </nav>

                            <div className="actions">
                                <button className="btn btn-login">Log in</button>
                                <button className="btn btn-signup">Sign up</button>
                            </div>

                            <button className="mobile-menu-btn" type="button" aria-label="Open menu">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <line x1="4" y1="7" x2="20" y2="7"/>
                                    <line x1="4" y1="12" x2="20" y2="12"/>
                                    <line x1="4" y1="17" x2="20" y2="17"/>
                                </svg>
                            </button>
                        </header>

                        <header className="scene-nav nav-light" style={{ opacity: morphProgress, transform: `translateY(${28 * (1 - morphProgress)}px)` }}>
                            <div className="after-hero-nav">
                                <span className="after-brand">H</span>

                                <span className="after-wordmark">Handshake</span>

                                <div className="after-links" aria-label="Primary">
                                    {navLinks.map((item) => (
                                        <span key={`after-${item}`}>{item}</span>
                                    ))}
                                </div>

                                <div className="after-actions">
                                    <button className="after-btn">Log in</button>
                                    <button className="after-btn dark">Sign up</button>
                                </div>

                                <button className="after-menu-btn" type="button" aria-label="Open menu">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <line x1="4" y1="7" x2="20" y2="7"/>
                                        <line x1="4" y1="12" x2="20" y2="12"/>
                                        <line x1="4" y1="17" x2="20" y2="17"/>
                                    </svg>
                                </button>
                            </div>
                        </header>

                        <section
                            className="hero hero-morph"
                            aria-label="Hero"
                            style={{ transform: `translateY(${-74 * morphProgress}px) scale(${1 - 0.09 * morphProgress})`, opacity: 1 - morphProgress }}
                        >
                            <div className="hero-media">
                                <h1 className="hero-title">
                                    Grow Your
                                    <br />
                                    Career
                                </h1>
                            </div>

                            <button className="hero-app-btn" type="button">
                                Get the app
                            </button>

                            <div className="hero-mobile-photo" aria-hidden="true" />

                            <div className="cta-row">
                                {ctas.map((item) => (
                                    <div key={item} className="cta">
                                        <span>{item}</span>
                                        <span className="arrow">→</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section
                            className="after-hero"
                            aria-label="Transition section"
                            style={{ opacity: morphProgress, transform: isMobile ? 'none' : `translateY(${90 * (1 - morphProgress)}px)` }}
                        >
                            <div className="after-hero-content">
                                <h2 className="after-hero-title" style={{ opacity: 1 - headingFade, display: (1 - headingFade) < 0.01 ? 'none' : 'block' }}>
                                    We&apos;re here to <span>help you</span>
                                </h2>

                                <div className="after-hero-words" style={{ opacity: wordsIn * (1 - wordsOut), display: (wordsIn * (1 - wordsOut)) < 0.01 ? 'none' : 'flex' }}>
                                    <AutoWordScroller
                                        words={["get matched", "build experience", "hire better", "learn more", "find jobs", "work with AI"]}
                                        intervalMs={1150}
                                        transitionMs={420}
                                        visibleCount={isMobile ? 9 : 11}
                                    />
                                </div>

                                <div
                                    className="after-hero-logo"
                                    style={{ opacity: logoIn, transform: `translateY(${18 * (1 - logoIn)}px) scale(${0.98 + 0.02 * logoIn})`, display: logoIn < 0.01 ? 'none' : 'grid' }}
                                >
                                    <div className="rotating-logo" aria-hidden="true">
                                        <span className="rotating-logo-letter">H</span>
                                    </div>
                                    <div className="after-hero-logo-cta">Read the vision →</div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </section>

            <section className="stage-exit" aria-hidden="true" />

            <section className="who-uses" aria-label="Who uses Handshake">
                <div className="who-uses-inner">
                    <div className="who-uses-kicker">Who uses Handshake</div>
                    <h2 className="who-uses-title">The largest, most trusted network for work and careers</h2>

                    <div className={`who-uses-grid ${activeWho >= 0 ? "has-active" : ""}`} role="list">
                        <a
                            className={`who-card card-job ${activeWho === 0 ? "isActive" : activeWho >= 0 ? "isDim" : ""}`}
                            href="#"
                            role="listitem"
                            aria-label="Job seekers"
                            onMouseEnter={() => setActiveWho(0)}
                            onMouseLeave={() => setActiveWho(-1)}
                            onFocus={() => setActiveWho(0)}
                            onBlur={() => setActiveWho(-1)}
                        >
                            <div className="who-card-label">Job seekers</div>
                            <div className="who-card-copy">Find everything from full time jobs to AI gigs</div>
                            <div className="who-card-arrow" aria-hidden="true">↗</div>
                        </a>

                        <a
                            className={`who-card card-recruiters ${activeWho === 1 ? "isActive" : activeWho >= 0 ? "isDim" : ""}`}
                            href="#"
                            role="listitem"
                            aria-label="Recruiters"
                            onMouseEnter={() => setActiveWho(1)}
                            onMouseLeave={() => setActiveWho(-1)}
                            onFocus={() => setActiveWho(1)}
                            onBlur={() => setActiveWho(-1)}
                        >
                            <div className="who-card-label">Recruiters</div>
                            <div className="who-card-copy">Connect with tech-fluent candidates</div>
                            <div className="who-card-arrow" aria-hidden="true">↗</div>
                        </a>

                        <a
                            className={`who-card card-ai ${activeWho === 2 ? "isActive" : activeWho >= 0 ? "isDim" : ""}`}
                            href="#"
                            role="listitem"
                            aria-label="AI labs"
                            onMouseEnter={() => setActiveWho(2)}
                            onMouseLeave={() => setActiveWho(-1)}
                            onFocus={() => setActiveWho(2)}
                            onBlur={() => setActiveWho(-1)}
                        >
                            <div className="who-card-label">AI labs</div>
                            <div className="who-card-copy">Improve models with human intelligence</div>
                            <div className="who-card-arrow" aria-hidden="true">↗</div>
                        </a>

                        <a
                            className={`who-card card-highered ${activeWho === 3 ? "isActive" : activeWho >= 0 ? "isDim" : ""}`}
                            href="#"
                            role="listitem"
                            aria-label="Higher ed"
                            onMouseEnter={() => setActiveWho(3)}
                            onMouseLeave={() => setActiveWho(-1)}
                            onFocus={() => setActiveWho(3)}
                            onBlur={() => setActiveWho(-1)}
                        >
                            <div className="who-card-label">Higher ed</div>
                            <div className="who-card-copy">Power modern career services</div>
                            <div className="who-card-arrow" aria-hidden="true">↗</div>
                        </a>
                    </div>
                </div>
            </section>

            <section 
                ref={builtForRef}
                className="built-for" 
                aria-label="Built for everyone"
                style={{
                    '--bf-progress': builtForProgress,
                    '--bf-text-reveal': Math.min(1, builtForProgress * 1.5),
                    '--bf-badges-reveal': Math.max(0, (builtForProgress - 0.2) * 1.4),
                    '--bf-center-reveal': Math.max(0, (builtForProgress - 0.5) * 2)
                }}
            >
                <div className="built-for-inner">
                    <div 
                        className={`floating-badges ${builtForProgress > 0.3 ? 'is-visible' : ''}`}
                        style={{
                            opacity: Math.max(0, (builtForProgress - 0.3) * 2),
                            transform: `scale(${0.8 + builtForProgress * 0.2})`
                        }}
                    >
                        <span className="badge badge-cyan badge-pos-1" style={{ '--badge-delay': 0 }}>musicians</span>
                        <span className="badge badge-cyan badge-pos-2" style={{ '--badge-delay': 1 }}>creators</span>
                        <span className="badge badge-cyan badge-pos-3" style={{ '--badge-delay': 2 }}>bankers</span>
                        <span className="badge badge-lime badge-pos-4" style={{ '--badge-delay': 3 }}>lawyers</span>
                        <span className="badge badge-cyan badge-pos-5" style={{ '--badge-delay': 4 }}>engineers</span>
                        <span className="badge badge-cyan badge-pos-6" style={{ '--badge-delay': 5 }}>professionals</span>
                        <span className="badge badge-lime badge-pos-7" style={{ '--badge-delay': 6 }}>academics</span>
                        <span className="badge badge-violet badge-pos-8" style={{ '--badge-delay': 7 }}>interns</span>
                        <span className="badge badge-lime badge-pos-9" style={{ '--badge-delay': 8 }}>doctors</span>
                        <span className="badge badge-lime badge-pos-10" style={{ '--badge-delay': 9 }}>founders</span>
                        <span className="badge badge-cyan badge-pos-11" style={{ '--badge-delay': 10 }}>side hustlers</span>
                        <span className="badge badge-cyan badge-pos-12" style={{ '--badge-delay': 11 }}>teachers</span>
                        <span className="badge badge-violet badge-pos-13" style={{ '--badge-delay': 12 }}>students</span>
                    </div>
                    <div 
                        className="built-for-text"
                        style={{
                            opacity: builtForProgress,
                            transform: `translateY(${60 * (1 - builtForProgress)}px) scale(${0.9 + builtForProgress * 0.1})`,
                            clipPath: `inset(0 ${100 - builtForProgress * 100}% 0 0)`
                        }}
                    >
                        <span className="built-line">BUILT FOR</span>
                        <span className="built-line">EVERYONE</span>
                    </div>
                    <div 
                        className="center-badge"
                        style={{
                            opacity: Math.max(0, (builtForProgress - 0.6) * 2.5),
                            transform: `translate(-50%, -50%) scale(${0.5 + Math.min(1, (builtForProgress - 0.6) * 2.5) * 0.5})`
                        }}
                    >
                        <span className="badge-side">s</span>
                        <span className="badge badge-lime" key={currentProfession}>{professions[currentProfession]}</span>
                        <span className="badge-side">s</span>
                    </div>
                </div>
            </section>
        </main>
    );
}
