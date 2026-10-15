"use strict";

document.documentElement.classList.add("js");

// Keep navigation usable without JavaScript and accessible with a keyboard.
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#main-nav");
const mobileViewport = window.matchMedia("(max-width: 640px)");

function closeMenu({ restoreFocus = false } = {}) {
  menuButton.setAttribute("aria-expanded", "false");
  navigation.classList.remove("is-open");
  if (restoreFocus) menuButton.focus();
}

menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  navigation.classList.toggle("is-open", !isOpen);
});

navigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
    closeMenu({ restoreFocus: true });
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".site-header")) closeMenu();
});

mobileViewport.addEventListener("change", () => closeMenu());

// Highlight the section being read without changing history or scroll behavior.
const sectionLinks = [...navigation.querySelectorAll("a[href^='#']")];
const sections = sectionLinks.map((link) => document.querySelector(link.hash));
let scrollScheduled = false;

function updateCurrentSection() {
  const currentSection = [...sections].reverse().find((section) => section.getBoundingClientRect().top <= 160);
  sectionLinks.forEach((link) => {
    if (currentSection && link.hash === `#${currentSection.id}`) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
  scrollScheduled = false;
}

window.addEventListener("scroll", () => {
  if (scrollScheduled) return;
  scrollScheduled = true;
  window.requestAnimationFrame(updateCurrentSection);
}, { passive: true });
window.addEventListener("resize", updateCurrentSection);
updateCurrentSection();

// A real clipboard action with an honest fallback when access is unavailable.
const copyButton = document.querySelector(".copy-email");
const copyLabel = copyButton.querySelector(".copy-label");
const copyIcon = copyButton.querySelector("use");
const copyStatus = document.querySelector(".copy-status");
let copyResetTimer;

copyButton.addEventListener("click", async () => {
  window.clearTimeout(copyResetTimer);
  try {
    await navigator.clipboard.writeText(copyButton.dataset.email);
    copyLabel.textContent = "Email copied";
    copyIcon.setAttribute("href", "#icon-check");
    copyStatus.textContent = "Email address copied to clipboard.";
  } catch {
    copyLabel.textContent = "Select email to copy";
    copyStatus.textContent = "Clipboard access is unavailable. The email address has been selected so you can copy it manually.";
    const range = document.createRange();
    range.selectNodeContents(document.querySelector(".email-link"));
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
  copyResetTimer = window.setTimeout(() => {
    copyLabel.textContent = "Copy email";
    copyIcon.setAttribute("href", "#icon-copy");
  }, 4000);
});

document.querySelector("#year").textContent = new Date().getFullYear();
