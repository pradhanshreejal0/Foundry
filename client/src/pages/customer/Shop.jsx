import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  Package,
  X,
  ArrowUpDown,
  Plus,
  Zap,
  Check,
  Star,
  Filter,
} from "lucide-react";
import { api } from "@/lib/api";
import { cloudinaryImage } from "@/lib/cloudinary";
import { PriceTag } from "@/components/PriceTag";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Shop() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryId = searchParams.get("category") || "";
  const qParam = searchParams.get("q") || searchParams.get("search") || "";
  const sortParam = searchParams.get("sort") || "newest";
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";
  const onSaleParam = searchParams.get("onSale") === "1";
  const brandParam = searchParams.get("brand") || "";
  const ratingParam = searchParams.get("rating") || "";
  const inStockParam = searchParams.get("inStock") === "1";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [brandSearch, setBrandSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(qParam);

  const [minPrice, setMinPrice] = useState(minPriceParam);
  const [maxPrice, setMaxPrice] = useState(maxPriceParam);

  useEffect(() => {
    setSearch(qParam);
  }, [qParam]);

  useEffect(() => {
    setMinPrice(minPriceParam);
    setMaxPrice(maxPriceParam);
  }, [minPriceParam, maxPriceParam]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        if (categoryId) params.set("category", categoryId);
        if (qParam) params.set("search", qParam);
        if (sortParam && sortParam !== "newest") params.set("sort", sortParam);
        if (minPriceParam) params.set("minPrice", minPriceParam);
        if (maxPriceParam) params.set("maxPrice", maxPriceParam);
        if (brandParam) params.set("brand", brandParam);
        if (ratingParam) params.set("minRating", ratingParam);
        if (inStockParam) params.set("inStock", "true");
        params.set("limit", "50"); // Fixed to 50 to adhere to backend MAX_LIMIT
        params.set("includeTotal", "false");

        const [productsRes, categoriesRes] = await Promise.all([
          api(`/products?${params.toString()}`),
          api("/categories"),
        ]);

        if (cancelled) return;

        const list = Array.isArray(productsRes)
          ? productsRes
          : productsRes?.products || [];
        setProducts(list);

        const extractedBrands = Array.from(
          new Set(
            list
              .map((p) => p.brand?.trim())
              .filter(Boolean)
          )
        ).sort();
        setBrandsList(extractedBrands);

        let cats = [];
        if (Array.isArray(categoriesRes)) cats = categoriesRes;
        else if (Array.isArray(categoriesRes?.data)) cats = categoriesRes.data;
        else if (Array.isArray(categoriesRes?.categories))
          cats = categoriesRes.categories;
        setCategories(cats);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load products");
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [categoryId, qParam, sortParam, minPriceParam, maxPriceParam, brandParam, ratingParam, inStockParam]);

  const getParentId = (c) => {
    if (!c?.parentCategory) return null;
    return typeof c.parentCategory === "object"
      ? c.parentCategory?._id
      : c.parentCategory;
  };

  const parents = useMemo(
    () => categories.filter((c) => !getParentId(c)),
    [categories]
  );

  const selectedCategory = useMemo(
    () => categories.find((c) => String(c._id) === String(categoryId)),
    [categories, categoryId]
  );

  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return brandsList;
    const term = brandSearch.toLowerCase();
    return brandsList.filter((b) => b.toLowerCase().includes(term));
  }, [brandsList, brandSearch]);

  const displayedProducts = useMemo(() => {
    let result = products;
    if (onSaleParam) {
      result = result.filter((p) => Number(p.discountPercentage || 0) > 0);
    }
    return result;
  }, [products, onSaleParam]);

  const activeFilterCount = [
    sortParam !== "newest" ? 1 : 0,
    minPriceParam ? 1 : 0,
    maxPriceParam ? 1 : 0,
    onSaleParam ? 1 : 0,
    brandParam ? 1 : 0,
    ratingParam ? 1 : 0,
    inStockParam ? 1 : 0,
    categoryId ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const updateParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === "" || value == null || value === false) {
        next.delete(key);
      } else if (value === true) {
        next.set(key, "1");
      } else {
        next.set(key, String(value));
      }
    });
    setSearchParams(next);
  };

  const applySearch = (e) => {
    e?.preventDefault?.();
    updateParams({ q: search.trim() || "" });
  };

  const applyPriceFilter = (e) => {
    e?.preventDefault?.();
    updateParams({
      minPrice: minPrice.trim(),
      maxPrice: maxPrice.trim(),
    });
  };

  const selectCategory = (id) => {
    updateParams({ category: id || "" });
  };

  const clearAllFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setBrandSearch("");
    setSearchParams({});
  };

  const getImage = (product) => {
    if (!product?.images?.length) return null;
    const first = product.images[0];
    return typeof first === "string" ? first : first?.url || null;
  };

  const renderProductCard = (product) => {
    const image = getImage(product);
    const inStock = product.stock == null || Number(product.stock) > 0 || product.inStock;

    return (
      <div
        key={product._id}
        className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
      >
        {Number(product.discountPercentage || 0) > 0 && (
          <div className="absolute left-2.5 top-2.5 z-10 rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm">
            {product.discountPercentage}% OFF
          </div>
        )}
        <Link
          to={`/products/${product._id}`}
          className="block aspect-4/5 overflow-hidden bg-muted"
        >
          {image ? (
            <img
              src={cloudinaryImage(image, { width: 400, height: 500 })}
              alt={product.title || "Product"}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}
        </Link>
        <div className="flex flex-1 flex-col p-3.5">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>{product.brand || product.category?.name || "Collection"}</span>
            {product.ratings?.average > 0 && (
              <span className="flex items-center gap-1 font-semibold text-amber-500">
                <Star className="h-3 w-3 fill-current" />
                {Number(product.ratings.average).toFixed(1)}
              </span>
            )}
          </div>
          <Link to={`/products/${product._id}`} className="mt-1">
            <h3 className="min-h-[2.5rem] line-clamp-2 text-[13px] font-semibold leading-snug hover:text-primary">
              {product.title}
            </h3>
          </Link>
          <div className="mt-2 flex items-center justify-between">
            <PriceTag product={product} />
            <span className="text-[11px] text-muted-foreground">
              {inStock ? "In stock" : "Sold out"}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1.5 border-t border-border/50 pt-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1 text-xs"
              disabled={actionLoadingId === product._id}
              onClick={async (e) => {
                e.preventDefault();
                if (!user) {
                  navigate("/login");
                  return;
                }
                if (user.role !== "customer") {
                  alert("Only customers can add items to cart");
                  return;
                }
                try {
                  setActionLoadingId(product._id);
                  await addToCart(product._id, 1, "");
                  alert("Added to cart successfully!");
                } catch (err) {
                  alert(err.message || "Failed to add to cart");
                } finally {
                  setActionLoadingId(null);
                }
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1 text-xs"
              disabled={actionLoadingId === product._id}
              onClick={async (e) => {
                e.preventDefault();
                if (!user) {
                  navigate("/login");
                  return;
                }
                if (user.role !== "customer") {
                  alert("Only customers can checkout");
                  return;
                }
                try {
                  setActionLoadingId(product._id);
                  await addToCart(product._id, 1, "");
                  navigate("/checkout");
                } catch (err) {
                  alert(err.message || "Failed to proceed to checkout");
                } finally {
                  setActionLoadingId(null);
                }
              }}
            >
              <Zap className="h-3.5 w-3.5" />
              Buy
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Search & Results Bar */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {selectedCategory ? selectedCategory.name : "Explore Products"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading
              ? "Loading..."
              : `${displayedProducts.length} product${
                  displayedProducts.length === 1 ? "" : "s"
                } available`}
            {selectedCategory ? ` in ${selectedCategory.name}` : ""}
            {qParam ? ` matching “${qParam}”` : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <form onSubmit={applySearch} className="flex w-full gap-2 sm:w-80">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products, brands..."
                className="pl-9 h-10"
              />
            </div>
            <Button type="submit" className="h-10">Search</Button>
          </form>

          <div className="hidden sm:flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select
              value={sortParam}
              onValueChange={(value) =>
                updateParams({ sort: value === "newest" ? "" : value })
              }
            >
              <SelectTrigger className="h-10 w-[170px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Layout: Left Sidebar Filters + Right Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar Filter Panel (Daraz Style) */}
        <aside className="space-y-6 lg:col-span-1 bg-card border rounded-xl p-5 h-fit shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2 font-semibold">
              <Filter className="h-4 w-4 text-primary" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="default" className="h-5 px-1.5 text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
            {activeFilterCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
              >
                Clear all
              </Button>
            )}
          </div>

          {/* Categories Filter with Clean Nesting */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Categories
            </h3>
            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => selectCategory("")}
                className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium transition-colors ${
                  !categoryId ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted"
                }`}
              >
                <span>All Departments</span>
                {!categoryId && <Check className="h-3.5 w-3.5" />}
              </button>
              {parents.map((cat) => {
                const isSelected = String(categoryId) === String(cat._id);
                const subcategories = categories.filter(
                  (c) => String(getParentId(c)) === String(cat._id)
                );
                return (
                  <div key={cat._id} className="space-y-1 pt-1">
                    <button
                      type="button"
                      onClick={() => selectCategory(String(cat._id))}
                      className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                        isSelected ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted font-medium"
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </button>
                    {subcategories.map((sub) => {
                      const isSubSelected = String(categoryId) === String(sub._id);
                      return (
                        <button
                          key={sub._id}
                          type="button"
                          onClick={() => selectCategory(String(sub._id))}
                          className={`flex w-full items-center justify-between rounded-md pl-6 pr-2.5 py-1 text-xs transition-colors ${
                            isSubSelected ? "bg-secondary text-secondary-foreground font-semibold" : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <span className="truncate">↳ {sub.name}</span>
                          {isSubSelected && <Check className="h-3.5 w-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          <hr />

          {/* Brand Search & Filter */}
          {brandsList.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Brand Search & Filter
              </h3>
              <Input
                type="text"
                placeholder="Search brand..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="h-8 text-xs mb-2"
              />
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {filteredBrands.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-1 px-1">No brands found</p>
                ) : (
                  filteredBrands.map((brandName) => {
                    const isChecked = brandParam.toLowerCase() === brandName.toLowerCase();
                    return (
                      <div
                        key={brandName}
                        onClick={() => updateParams({ brand: isChecked ? "" : brandName })}
                        className="flex items-center gap-2 cursor-pointer text-xs py-1.5 px-2 rounded hover:bg-muted transition-colors"
                      >
                        <Checkbox checked={isChecked} onCheckedChange={() => {}} />
                        <span className="truncate flex-1 font-medium">{brandName}</span>
                      </div>
                    );
                  })
                )}
              </div>
              <hr />
            </div>
          )}

          {/* Price Range Filter */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Price Range (RS)
            </h3>
            <form onSubmit={applyPriceFilter} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="h-8 text-xs"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <Button type="submit" size="sm" className="w-full h-8 text-xs">
                Apply Price
              </Button>
            </form>
          </div>

          <hr />

          {/* Customer Ratings Filter */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rating
            </h3>
            <div className="space-y-1.5">
              {[4, 3, 2].map((stars) => {
                const isChecked = ratingParam === String(stars);
                return (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => updateParams({ rating: isChecked ? "" : String(stars) })}
                    className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs transition-colors ${
                      isChecked ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${i < stars ? "fill-current" : "text-muted"}`}
                        />
                      ))}
                    </div>
                    <span>{stars} Stars & Up</span>
                  </button>
                );
              })}
            </div>
          </div>

          <hr />

          {/* Quick Toggles */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Availability & Deals
            </h3>
            <div className="space-y-2">
              <div
                onClick={() => updateParams({ onSale: !onSaleParam })}
                className="flex items-center gap-2 cursor-pointer text-xs py-1.5 px-2 rounded hover:bg-muted"
              >
                <Checkbox checked={onSaleParam} onCheckedChange={() => {}} />
                <span>On Sale / Discounted</span>
              </div>
              <div
                onClick={() => updateParams({ inStock: !inStockParam })}
                className="flex items-center gap-2 cursor-pointer text-xs py-1.5 px-2 rounded hover:bg-muted"
              >
                <Checkbox checked={inStockParam} onCheckedChange={() => {}} />
                <span>In Stock Only</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Product Grid Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Active Filter Badges Bar */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 p-3">
              <span className="text-xs font-semibold text-muted-foreground">Active Filters:</span>
              {sortParam !== "newest" && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  Sort: {sortParam}
                  <button onClick={() => updateParams({ sort: "" })}><X className="h-3 w-3" /></button>
                </Badge>
              )}
              {categoryId && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  Category: {selectedCategory?.name || "Selected"}
                  <button onClick={() => updateParams({ category: "" })}><X className="h-3 w-3" /></button>
                </Badge>
              )}
              {brandParam && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  Brand: {brandParam}
                  <button onClick={() => updateParams({ brand: "" })}><X className="h-3 w-3" /></button>
                </Badge>
              )}
              {minPriceParam && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  Min: RS {minPriceParam}
                  <button onClick={() => updateParams({ minPrice: "" })}><X className="h-3 w-3" /></button>
                </Badge>
              )}
              {maxPriceParam && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  Max: RS {maxPriceParam}
                  <button onClick={() => updateParams({ maxPrice: "" })}><X className="h-3 w-3" /></button>
                </Badge>
              )}
              {ratingParam && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  {ratingParam}+ Stars
                  <button onClick={() => updateParams({ rating: "" })}><X className="h-3 w-3" /></button>
                </Badge>
              )}
              {onSaleParam && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  On Sale
                  <button onClick={() => updateParams({ onSale: false })}><X className="h-3 w-3" /></button>
                </Badge>
              )}
              {inStockParam && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  In Stock
                  <button onClick={() => updateParams({ inStock: false })}><X className="h-3 w-3" /></button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-6 px-2 text-xs text-destructive hover:bg-destructive/10 ml-auto"
              >
                Reset All
              </Button>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                <div key={n} className="skeleton h-72 rounded-xl" />
              ))}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center bg-card">
              <Package className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 font-semibold text-lg">No products found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your left sidebar filters or search query.
              </p>
              <Button onClick={clearAllFilters} className="mt-5" variant="outline">
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedProducts.map(renderProductCard)}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
