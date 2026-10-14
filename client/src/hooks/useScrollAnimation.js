import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Hook to trigger fade-in animations when elements scroll into view.
 * Re-runs on route change so SPA navigations still animate.
 *
 * Usage: Add data-scroll-animate attribute to elements you want to animate
 *
 * Example:
 * <div data-scroll-animate="fade-in-up">Content</div>
 * <section data-scroll-animate="fade-in-left">Section</section>
 */
export const useScrollAnimation = () => {
  const location = useLocation();

  useEffect(() => {
    const observerOptions = {
      threshold: 0.08,
      rootMargin: "0px 0px -60px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const animationType =
            entry.target.getAttribute("data-scroll-animate") || "fade-in-up";
          entry.target.classList.add(`scroll-${animationType}`);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Small delay so newly mounted DOM is ready
    const timer = setTimeout(() => {
      const animatedElements = document.querySelectorAll(
        "[data-scroll-animate]:not([class*='scroll-fade'])"
      );
      animatedElements.forEach((element) => {
        element.classList.remove(
          "scroll-fade-in-up",
          "scroll-fade-in-down",
          "scroll-fade-in-left",
          "scroll-fade-in-right"
        );
        observer.observe(element);
      });
    }, 40);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [location.pathname]);
};
