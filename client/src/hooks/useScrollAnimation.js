import { useEffect } from "react";

/**
 * Hook to trigger fade-in animations when elements scroll into view
 * Usage: Add data-scroll-animate attribute to elements you want to animate
 *
 * Example:
 * <div data-scroll-animate="fade-in-up">Content</div>
 * <section data-scroll-animate="fade-in-left">Section</section>
 */
export const useScrollAnimation = () => {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const animationType = entry.target.getAttribute("data-scroll-animate") || "fade-in-up";
          entry.target.classList.add(`scroll-${animationType}`);

          // Optional: unobserve after animation to improve performance
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all elements with data-scroll-animate attribute
    const animatedElements = document.querySelectorAll("[data-scroll-animate]");
    animatedElements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      animatedElements.forEach((element) => {
        observer.unobserve(element);
      });
    };
  }, []);
};
