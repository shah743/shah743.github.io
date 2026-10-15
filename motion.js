"use strict";

// Motion enhances the page; content remains visible if scripting is unavailable.
(() => {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const root = document.documentElement;
  const toggle = document.querySelector(".motion-toggle");
  const storageKey = "shah-zaib-motion-paused";
  const pending = new Set();
  const animations = new Set();
  let userPaused = false;
  let observer;

  try {
    userPaused = localStorage.getItem(storageKey) === "true";
  } catch {
    // The page also works when browser storage is unavailable.
  }

  function reveal(element, delay = 0) {
    pending.delete(element);
    element.classList.remove("reveal-pending");
    if (root.dataset.motion !== "on" || !element.animate) return;

    const animation = element.animate([
      { opacity: 0, transform: "translateY(14px)" },
      { opacity: 1, transform: "translateY(0)" },
    ], { duration: 650, delay, easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards" });
    animations.add(animation);
    animation.addEventListener("finish", () => animations.delete(animation), { once: true });
  }

  function syncMotion() {
    const enabled = !preference.matches && !userPaused;
    root.dataset.motion = enabled ? "on" : "off";
    toggle.hidden = false;
    toggle.disabled = preference.matches;
    toggle.setAttribute("aria-pressed", String(!enabled));
    toggle.querySelector("span").textContent = preference.matches
      ? "Reduced motion"
      : enabled ? "Pause motion" : "Resume motion";
    toggle.querySelector("use").setAttribute("href", enabled ? "#icon-pause" : "#icon-play");

    if (!enabled) {
      observer?.disconnect();
      pending.forEach((element) => element.classList.remove("reveal-pending"));
      pending.clear();
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    }
    document.dispatchEvent(new CustomEvent("portfolio:motionchange", { detail: { enabled } }));
  }

  toggle.addEventListener("click", () => {
    userPaused = !userPaused;
    try {
      localStorage.setItem(storageKey, String(userPaused));
    } catch {
      // The in-page control still applies for this visit.
    }
    syncMotion();
  });
  preference.addEventListener("change", syncMotion);
  syncMotion();

  if (root.dataset.motion !== "on" || !("IntersectionObserver" in window)) return;

  // Reveal each section once. A hash/deep-link visit never replays the hero.
  if (!location.hash && window.scrollY < 80) {
    document.querySelectorAll(".hero-copy > .eyebrow, .hero h1, .hero-intro, .hero-actions, .hero-proof")
      .forEach((element, index) => reveal(element, index * 65));
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      reveal(entry.target);
    });
  }, { threshold: 0.04, rootMargin: "0px 0px -24px 0px" });

  document.querySelectorAll(".section-heading, .project, .principles article, .about-story, .toolkit, .timeline-item, .contact-inner")
    .forEach((element) => {
      if (element.getBoundingClientRect().top < window.innerHeight) return;
      element.classList.add("reveal-pending");
      pending.add(element);
      observer.observe(element);
    });
})();
