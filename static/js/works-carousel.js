(function () {
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function initCarousel(root) {
    const ring = root.querySelector(".ring");
    const items = [...root.querySelectorAll(".item")];
    if (!ring || items.length === 0) return;

    let rotY = 0;          // 目前旋轉角度
    let dragging = false;
    let lastX = 0;
    let velocity = 0;

    // 半徑：依容器大小自動調
    const rect = root.getBoundingClientRect();
    const radius = clamp(rect.width * 0.45, 220, 520);

    // 初始化：把每張圖擺到圓環上
    const step = 360 / items.length;
    items.forEach((el, i) => {
      el.dataset.base = String(i * step);
      // 先放一個初始位置
      el.style.transform = `translate(-50%, -50%) rotateY(${i * step}deg) translateZ(${radius}px)`;
    });

    function render() {
      ring.style.transform = `rotateY(${rotY}deg)`;

      // 依照目前角度，算每張圖的前後（做 opacity/scale）
      items.forEach((el) => {
        const base = parseFloat(el.dataset.base || "0");
        // 這張圖相對於鏡頭的角度（0=正前方）
        const ang = ((base + rotY) % 360 + 360) % 360;
        // 把 0..360 映射到 -180..180，方便算前後
        const rel = ang > 180 ? ang - 360 : ang;

        // rel 越接近 0 越在前面
        const frontness = 1 - Math.min(Math.abs(rel) / 180, 1); // 0..1
        const scale = 0.78 + frontness * 0.28;                  // 0.78..1.06
        const opacity = 0.45 + frontness * 0.55;                // 0.45..1
        const blur = (1 - frontness) * 0.8;                     // 0..0.8px

        el.classList.toggle("is-back", frontness < 0.45);
        el.style.zIndex = String(Math.floor(frontness * 1000));

        const img = el.querySelector("img");
        if (img) {
          img.style.transform = `scale(${scale})`;
          img.style.opacity = String(opacity);
          img.style.filter = blur > 0.01 ? `blur(${blur}px)` : "";
        }
      });
    }

    // 惰性旋轉動畫
    function tick() {
      if (!dragging) {
        velocity *= 0.92;
        if (Math.abs(velocity) > 0.001) {
          rotY += velocity;
          render();
        }
      }
      requestAnimationFrame(tick);
    }
    tick();

    // 拖曳
    root.addEventListener("pointerdown", (e) => {
      dragging = true;
      lastX = e.clientX;
      velocity = 0;
      root.setPointerCapture?.(e.pointerId);
    });

    root.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;

      // 旋轉速度（可調）
      const delta = dx * 0.25;
      rotY += delta;
      velocity = delta;
      render();
    });

    root.addEventListener("pointerup", () => {
      dragging = false;
    });

    // 滾輪旋轉
    root.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY * 0.08;
      rotY += delta;
      velocity = delta;
      render();
    }, { passive: false });

    // 初次渲染
    render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".work-carousel").forEach(initCarousel);
  });
})();