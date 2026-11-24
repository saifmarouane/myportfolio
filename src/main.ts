import "./styles.css";

const root = document.documentElement;
const header = document.getElementById("site-header") as HTMLElement;
const menuButton = document.querySelector<HTMLButtonElement>(".menu-toggle")!;
const navigation = document.getElementById("main-nav") as HTMLElement;
const themeButton = document.querySelector<HTMLButtonElement>(".theme-toggle")!;
const progress = document.querySelector<HTMLElement>(".scroll-progress span")!;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setTheme(theme: "dark" | "light") {
  root.dataset.theme = theme;
  localStorage.setItem("saif-theme", theme);
  const next = theme === "dark" ? "clair" : "sombre";
  themeButton.setAttribute("aria-label", `Activer le thème ${next}`);
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#0b171b" : "#f3efe7");
}

themeButton.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));
setTheme(root.dataset.theme === "light" ? "light" : "dark");

function closeMenu() {
  root.classList.remove("menu-open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Ouvrir le menu");
}

menuButton.addEventListener("click", () => {
  const open = !root.classList.contains("menu-open");
  root.classList.toggle("menu-open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
});

navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

let scrollQueued = false;
function updateScrollUi() {
  scrollQueued = false;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const value = max > 0 ? window.scrollY / max : 0;
  progress.style.transform = `scaleX(${Math.min(1, Math.max(0, value))})`;
  header.classList.toggle("is-scrolled", window.scrollY > 24);
}

window.addEventListener(
  "scroll",
  () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(updateScrollUi);
  },
  { passive: true },
);
updateScrollUi();

const revealItems = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
if (reducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6%" },
  );
  revealItems.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 55}ms`);
    revealObserver.observe(item);
  });
}

const navLinks = Array.from(navigation.querySelectorAll<HTMLAnchorElement>("a"));
const observedSections = navLinks
  .map((link) => document.querySelector<HTMLElement>(link.hash))
  .filter((section): section is HTMLElement => section !== null);

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach((link) => link.classList.toggle("is-active", link.hash === `#${visible.target.id}`));
    },
    { rootMargin: "-20% 0px -58%", threshold: [0.05, 0.25, 0.5] },
  );
  observedSections.forEach((section) => sectionObserver.observe(section));
}

document.querySelectorAll<HTMLButtonElement>(".stack-filters button").forEach((button) => {
  button.addEventListener("click", () => {
    const category = button.dataset.filter ?? "all";
    document.querySelectorAll<HTMLButtonElement>(".stack-filters button").forEach((candidate) => {
      candidate.classList.toggle("is-active", candidate === button);
    });
    document.querySelectorAll<HTMLElement>(".stack-card").forEach((card) => {
      const visible = category === "all" || card.dataset.category === category;
      card.classList.toggle("is-filtered", !visible);
      card.setAttribute("aria-hidden", String(!visible));
    });
  });
});

if (!reducedMotion && window.matchMedia("(pointer: fine)").matches) {
  document.querySelectorAll<HTMLElement>(".project-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const bounds = card.getBoundingClientRect();
      card.style.setProperty("--pointer-x", `${event.clientX - bounds.left}px`);
      card.style.setProperty("--pointer-y", `${event.clientY - bounds.top}px`);
    });
  });
}

const copyButton = document.querySelector<HTMLButtonElement>(".copy-email")!;
const toast = document.querySelector<HTMLElement>(".toast")!;
let toastTimer = 0;

copyButton.addEventListener("click", async () => {
  const email = copyButton.dataset.email ?? "";
  try {
    await navigator.clipboard.writeText(email);
    toast.textContent = "Adresse copiée";
  } catch {
    toast.textContent = email;
  }
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
});

document.getElementById("year")!.textContent = String(new Date().getFullYear());
