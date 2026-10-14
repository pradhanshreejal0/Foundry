import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cloudinaryImage } from "@/lib/cloudinary";
import { getFinalPrice } from "@/lib/utils";

function getProductImage(product) {
  const image = product?.images?.[0];
  const url = typeof image === "string" ? image : image?.url || null;
  return url ? cloudinaryImage(url, { width: 480, height: 560 }) : null;
}

/**
 * Premium horizontal product carousel.
 * Use when a subcategory (or any list) has many products — smooth snap scroll + arrows.
 */
export function ProductCarousel({
  products = [],
  title,
  note,
  link,
  linkLabel = "View all",
  cardWidth = 220,
  className = "",
}) {
  const trackRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 8);
    setCanRight(scrollLeft + clientWidth < scrollWidth - 8);
  };

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [products]);

  const scrollBy = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.85, cardWidth * 2.5);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  if (!products?.length) return null;

  return (
    <section
      className={`relative ${className}`}
      data-scroll-animate="fade-in-up"
    >
      {(title || link) && (
        <div className="mb-6 flex items-end justify-between gap-4 px-1">
          <div>
            {note && (
              <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                {note}
              </p>
            )}
            {title && (
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
                {title}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            {link && (
              <Link
                to={link}
                className="hidden text-[13px] font-semibold text-primary transition hover:opacity-80 sm:inline-flex"
              >
                {linkLabel}
              </Link>
            )}
            <div className="flex gap-1.5">
              <button
                type="button"
                aria-label="Scroll left"
                disabled={!canLeft}
                onClick={() => scrollBy(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:bg-secondary disabled:pointer-events-none disabled:opacity-35"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                aria-label="Scroll right"
                disabled={!canRight}
                onClick={() => scrollBy(1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:bg-secondary disabled:pointer-events-none disabled:opacity-35"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        {/* Fade edges for premium feel */}
        <div
          className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-linear-to-r from-background to-transparent transition-opacity duration-300 sm:w-12 ${
            canLeft ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-linear-to-l from-background to-transparent transition-opacity duration-300 sm:w-12 ${
            canRight ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          ref={trackRef}
          className="product-carousel-track flex gap-4 overflow-x-auto scroll-smooth pb-2 pt-1"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {products.map((product, index) => {
            const img = getProductImage(product);
            const inStock =
              product.stock == null ||
              Number(product.stock) > 0 ||
              product.inStock;
            const id = product._id || product.slug;

            return (
              <article
                key={id || index}
                className="group shrink-0 snap-start"
                style={{ width: cardWidth, scrollSnapAlign: "start" }}
              >
                <Link
                  to={`/products/${id}`}
                  className="flex flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                >
                  <div className="relative aspect-4/5 overflow-hidden bg-muted">
                    {img ? (
                      <img
                        src={img}
                        alt={product.title || "Product"}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                        No image
                      </div>
                    )}
                    <span className="absolute left-2.5 top-2.5 rounded-md bg-card/95 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary shadow-sm backdrop-blur-sm">
                      {product.featured
                        ? "Curated"
                        : inStock
                          ? "In stock"
                          : "Sold out"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-1 px-3.5 pb-3.5 pt-3">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {product.category?.name ||
                        product.category ||
                        "Collection"}
                    </span>
                    <span className="line-clamp-2 min-h-[2.4rem] text-[13px] font-semibold leading-snug text-foreground group-hover:text-primary">
                      {product.title}
                    </span>
                    <div className="mt-auto flex items-center justify-between pt-1.5">
                      <span className="font-heading text-[15px] font-bold text-foreground">
                        RS {getFinalPrice(product).toFixed(0)}
                      </span>
                      {Number(product.discountPercentage) > 0 && (
                        <span className="text-xs text-muted-foreground line-through">
                          RS {Number(product.price).toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ProductCarousel;
