// Press feedback: a ripple that grows from the pointer and fades out.
// Attach as onPointerDown to an element with `relative overflow-hidden`.
// Transform + opacity only (WAAPI, off the main thread), skipped entirely with
// prefers-reduced-motion, and the node is removed when the animation ends.

const DURATION = 550;
const EASING = "cubic-bezier(0.23, 1, 0.32, 1)"; // --ease-out-strong

export function ripple(event: React.PointerEvent<HTMLElement>) {
  if (event.button !== 0) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const host = event.currentTarget;
  const rect = host.getBoundingClientRect();
  const size = Math.hypot(rect.width, rect.height) * 2;

  const dot = document.createElement("span");
  dot.setAttribute("aria-hidden", "true");
  Object.assign(dot.style, {
    position: "absolute",
    left: `${event.clientX - rect.left - size / 2}px`,
    top: `${event.clientY - rect.top - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "9999px",
    background: "var(--ripple)",
    pointerEvents: "none",
  });
  host.appendChild(dot);

  // Grows with a strong ease-out; stays visible for the first half, then fades.
  const animation = dot.animate(
    [
      { transform: "scale(0.08)", opacity: 1, offset: 0 },
      { opacity: 0.85, offset: 0.45 },
      { transform: "scale(1)", opacity: 0, offset: 1 },
    ],
    { duration: DURATION, easing: EASING },
  );
  animation.onfinish = animation.oncancel = () => dot.remove();
}
