(() => {
  // Footer year
  const y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());

  // Lightbox
  const thumbs = Array.from(document.querySelectorAll(".thumb[data-full]"));
  const lb = document.getElementById("lightbox");
  if (!thumbs.length || !lb) return;

  const img = lb.querySelector(".lb-img");
  const btnClose = lb.querySelector(".lb-close");
  const btnPrev = lb.querySelector(".lb-prev");
  const btnNext = lb.querySelector(".lb-next");

  let idx = 0;

  function openAt(i) {
    idx = (i + thumbs.length) % thumbs.length;
    const src = thumbs[idx].getAttribute("data-full");
    img.src = src;
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
  }

  function close() {
    lb.classList.remove("open");
    lb.setAttribute("aria-hidden", "true");
    img.removeAttribute("src");
  }

  function prev() { openAt(idx - 1); }
  function next() { openAt(idx + 1); }

  thumbs.forEach((t, i) => {
    t.addEventListener("click", () => openAt(i));
    t.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openAt(i);
      }
    });
  });

  btnClose.addEventListener("click", close);
  btnPrev.addEventListener("click", prev);
  btnNext.addEventListener("click", next);

  lb.addEventListener("click", (e) => {
    if (e.target === lb) close();
  });

  window.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  });
})();
