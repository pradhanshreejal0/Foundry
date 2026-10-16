import { Link } from "react-router-dom";

function getId(value) {
  if (!value) return "";
  return String(typeof value === "object" ? value._id || "" : value);
}

export function CategoryProductRows({
  categories = [],
  products = [],
  renderProduct,
}) {
  const categoriesById = new Map(
    categories.map((category) => [getId(category._id), category]),
  );
  const productsByParent = new Map();
  const uncategorized = [];

  products.forEach((product) => {
    const categoryId = getId(product.category);
    const category = categoriesById.get(categoryId) ||
      (typeof product.category === "object" ? product.category : null);

    if (!category || !getId(category._id)) {
      uncategorized.push(product);
      return;
    }

    const parentId = getId(category.parentCategory) || getId(category._id);
    const rows = productsByParent.get(parentId) || new Map();
    const rowProducts = rows.get(getId(category._id)) || [];
    rowProducts.push(product);
    rows.set(getId(category._id), rowProducts);
    productsByParent.set(parentId, rows);
  });

  const groups = categories
    .filter((category) => !getId(category.parentCategory))
    .map((parent) => {
      const rows = productsByParent.get(getId(parent._id));
      if (!rows) return null;

      return {
        category: parent,
        rows: [...rows.entries()].map(([categoryId, rowProducts]) => ({
          category: categoriesById.get(categoryId) || parent,
          products: rowProducts,
        })),
      };
    })
    .filter(Boolean);

  const groupedProductIds = new Set(
    groups.flatMap((group) => group.rows.flatMap((row) => row.products.map((p) => p._id))),
  );
  const ungroupedProducts = products.filter(
    (product) => !groupedProductIds.has(product._id),
  );

  if (ungroupedProducts.length) {
    groups.push({
      category: { _id: "other", name: "Other products" },
      rows: [{ category: { _id: "uncategorized", name: "Uncategorized" }, products: ungroupedProducts }],
    });
  }

  if (!groups.length) return null;

  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <section key={group.category._id} className="space-y-5">
          <h2 className="border-b border-border pb-2 font-heading text-xl font-bold text-foreground sm:text-2xl">
            {group.category.name}
          </h2>
          {group.rows.map((row) => (
            <section key={row.category._id}>
              <div className="mb-3 flex items-center justify-between gap-4">
                <h3 className="text-base font-semibold text-foreground">
                  {row.category.name}
                </h3>
                {row.category._id !== "uncategorized" && (
                  <Link
                    to={`/products?category=${row.category._id}`}
                    className="shrink-0 text-xs font-semibold text-primary hover:underline"
                  >
                    View all
                  </Link>
                )}
              </div>
              <div className="flex gap-4 overflow-x-auto pb-3">
                {row.products.map(renderProduct)}
              </div>
            </section>
          ))}
        </section>
      ))}
    </div>
  );
}