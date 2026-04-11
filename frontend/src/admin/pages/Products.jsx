import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate, useOutletContext } from "react-router-dom";
import ContentReveal from "../../components/ContentReveal";
import Skeleton from "../../components/Skeleton";
import AdminSelect from "../components/AdminSelect";
import DataTable from "../components/DataTable";
import FiltersBar from "../components/FiltersBar";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import adminApi from "../services/adminApi";
import {
  FILTER_FIELD_CLASS,
  FILTER_LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  statusClassName,
} from "../helpers";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { formatApiError, formatCurrency, formatDateTime } from "../../utils/format";

const blankAdjustmentValues = {
  adjustment: "",
  note: "",
};

const STOCK_FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "low-stock", label: "Low stock" },
  { value: "out-of-stock", label: "Out of stock" },
];

const VISIBILITY_FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "VISIBLE", label: "Visible" },
  { value: "HIDDEN", label: "Hidden" },
];

function Products() {
  const navigate = useNavigate();
  const { search } = useOutletContext();
  const debouncedSearch = useDebouncedValue(search, 300);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState("");
  const [stock, setStock] = useState("");
  const [inventoryProduct, setInventoryProduct] = useState(null);
  const [confirmingProduct, setConfirmingProduct] = useState(null);

  const {
    register: registerAdjustment,
    handleSubmit: handleAdjustmentSubmit,
    reset: resetAdjustment,
    formState: { isSubmitting: isAdjusting },
  } = useForm({
    defaultValues: blankAdjustmentValues,
  });

  useEffect(() => {
    setPage(0);
  }, [category, debouncedSearch, stock, visibility]);

  useEffect(() => {
    if (inventoryProduct) {
      resetAdjustment(blankAdjustmentValues);
    }
  }, [inventoryProduct, resetAdjustment]);

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => adminApi.getCategories(),
  });

  const productsQuery = useQuery({
    queryKey: ["admin", "products", debouncedSearch, category, stock, page],
    queryFn: () =>
      adminApi.getProducts({
        search: debouncedSearch,
        category,
        stock,
        page,
        size: 10,
      }),
  });

  const inventoryHistoryQuery = useQuery({
    queryKey: ["admin", "product-inventory-history", inventoryProduct?.id],
    queryFn: () => adminApi.getProductInventoryHistory(inventoryProduct.id),
    enabled: Boolean(inventoryProduct?.id),
  });

  const filteredRows = useMemo(() => {
    const rows = productsQuery.data?.content ?? [];

    if (!visibility) {
      return rows;
    }

    return rows.filter((product) =>
      visibility === "VISIBLE" ? Boolean(product.visible) : !product.visible,
    );
  }, [productsQuery.data?.content, visibility]);

  const adjustInventoryMutation = useMutation({
    mutationFn: ({ productId, payload }) => adminApi.adjustProductInventory(productId, payload),
    onSuccess: async (movement) => {
      toast.success("Inventory updated.");
      resetAdjustment(blankAdjustmentValues);
      setInventoryProduct((currentProduct) =>
        currentProduct
          ? {
              ...currentProduct,
              stock: movement.onHandAfter,
              reservedStock: movement.reservedAfter,
              availableStock: movement.availableAfter,
            }
          : currentProduct,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "overview"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "sales"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "product-inventory-history", inventoryProduct?.id] }),
      ]);
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (productId) => adminApi.deleteProduct(productId),
    onSuccess: async () => {
      toast.success("Product deleted.");
      setConfirmingProduct(null);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ id, visible }) => adminApi.updateProduct(id, { visible }),
    onSuccess: async () => {
      toast.success("Product visibility updated.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "overview"] }),
      ]);
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  const onAdjustInventory = handleAdjustmentSubmit(async (values) => {
    if (!inventoryProduct) {
      return;
    }

    await adjustInventoryMutation.mutateAsync({
      productId: inventoryProduct.id,
      payload: {
        adjustment: Number(values.adjustment),
        note: values.note || undefined,
      },
    });
  });

  const inventorySummary = useMemo(
    () => [
      {
        label: "Catalog items",
        value: filteredRows.length,
        hint: "Products matching the current filters",
      },
      {
        label: "Low stock",
        value: filteredRows.filter((product) => product.status === "Low stock").length,
        hint: "Low-stock products on this page",
      },
      {
        label: "Reserved units",
        value: filteredRows.reduce((total, product) => total + Number(product.reservedStock ?? 0), 0),
        hint: "Units held for pending orders",
      },
      {
        label: "Out of stock",
        value: filteredRows.filter((product) => product.status === "Out of stock").length,
        hint: "Products with no available units",
      },
    ],
    [filteredRows],
  );

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "All categories" },
      ...((categoriesQuery.data ?? []).map((item) => ({
        value: item.slug,
        label: item.name,
      }))),
    ],
    [categoriesQuery.data],
  );

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Product",
        cell: (product) => (
          <div className="flex items-center gap-4">
            <img
              src={product.imageUrls?.[0] || "https://placehold.co/96x96?text=CandleOra"}
              alt={product.name}
              className="h-14 w-14 rounded-2xl object-cover"
            />
            <div>
              <p className="font-medium text-brand-dark">{product.name}</p>
              <p className="mt-1 text-xs text-brand-muted">{product.category?.name}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-brand-muted">
                {product.sku || "SKU pending"}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "price",
        header: "Price",
        cell: (product) => (
          <div>
            <p className="font-medium text-brand-dark">{formatCurrency(product.price)}</p>
            <p className="mt-1 text-xs text-brand-muted">Cost {formatCurrency(product.costPrice)}</p>
          </div>
        ),
      },
      {
        key: "inventory",
        header: "Inventory",
        cell: (product) => (
          <div>
            <p className="font-medium text-brand-dark">{product.availableStock} available</p>
            <p className="mt-1 text-xs text-brand-muted">
              On hand {product.stock} | Reserved {product.reservedStock}
            </p>
            <p className="mt-1 text-xs text-brand-muted">
              Low-stock threshold {product.lowStockThreshold}
            </p>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (product) => (
          <div className="space-y-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(product.status)}`}>
              {product.status}
            </span>
            <p className="text-xs text-brand-muted">{product.visible ? "Visible" : "Hidden"}</p>
          </div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        cell: (product) => (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-2xl border border-black/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-dark transition hover:border-black/20 hover:bg-black/5"
              onClick={() => navigate(`/admin/products/${product.id}/edit`)}
            >
              Edit
            </button>
            <button
              type="button"
              className="rounded-2xl border border-black/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-dark transition hover:border-black/20 hover:bg-black/5"
              onClick={() => setInventoryProduct(product)}
            >
              Adjust Stock
            </button>
            <button
              type="button"
              className="rounded-2xl border border-black/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-dark transition hover:border-black/20 hover:bg-black/5"
              onClick={() =>
                toggleVisibilityMutation.mutate({
                  id: product.id,
                  visible: !product.visible,
                })
              }
            >
              {product.visible ? "Hide" : "Show"}
            </button>
            <button
              type="button"
              className="rounded-2xl border border-danger/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-danger transition hover:bg-danger/10"
              onClick={() => setConfirmingProduct(product)}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [navigate, toggleVisibilityMutation],
  );

  if (productsQuery.isError) {
    return (
      <div className="rounded-[28px] border border-danger/20 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-brand-dark">Products unavailable</h2>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          The admin product feed failed to load. Verify the backend and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FiltersBar
        title="Products & Inventory"
        description="Manage your CandleOra products, track stock levels, and monitor inventory easily."
        actions={
          <button
            type="button"
            className={PRIMARY_BUTTON_CLASS}
            onClick={() => navigate("/admin/products/new")}
          >
            Add product
          </button>
        }
      >
        <div className="flex flex-col gap-2">
          <label className={FILTER_LABEL_CLASS}>Search</label>
          <div className={`${FILTER_FIELD_CLASS} flex items-center bg-[#fbf7f0] text-brand-muted`}>
            {debouncedSearch ? debouncedSearch : "Search products..."}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className={FILTER_LABEL_CLASS}>Category</label>
          <AdminSelect
            value={category}
            onChange={setCategory}
            options={categoryOptions}
            placeholder="All categories"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className={FILTER_LABEL_CLASS}>Status</label>
          <AdminSelect
            value={visibility}
            onChange={setVisibility}
            options={VISIBILITY_FILTER_OPTIONS}
            placeholder="All products"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className={FILTER_LABEL_CLASS}>Stock</label>
          <AdminSelect
            value={stock}
            onChange={setStock}
            options={STOCK_FILTER_OPTIONS}
            placeholder="All products"
          />
        </div>
      </FiltersBar>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {inventorySummary.map((card) => (
          <div key={card.label} className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted">{card.label}</p>
            {productsQuery.isLoading ? (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-10 w-20 rounded-full" />
                <Skeleton className="h-4 w-36 rounded-full" />
              </div>
            ) : (
              <ContentReveal className="mt-4">
                <p className="text-4xl font-semibold text-brand-dark">{card.value}</p>
                <p className="mt-2 text-sm text-brand-muted">{card.hint}</p>
              </ContentReveal>
            )}
          </div>
        ))}
      </section>

      <DataTable
        columns={columns}
        rows={filteredRows}
        isLoading={productsQuery.isLoading}
        emptyTitle="No products found"
        emptyDescription="Try adjusting the category, status, or stock filters."
      />

      <Pagination
        page={productsQuery.data?.page ?? 0}
        totalPages={productsQuery.data?.totalPages ?? 0}
        onPageChange={setPage}
      />

      <Modal
        open={Boolean(inventoryProduct)}
        onClose={() => setInventoryProduct(null)}
        title={inventoryProduct ? `Inventory for ${inventoryProduct.name}` : "Inventory"}
        size="xl"
        footer={
          <div className="flex items-center justify-between gap-3">
            <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={() => setInventoryProduct(null)}>
              Close
            </button>
            <button type="button" className={PRIMARY_BUTTON_CLASS} disabled={isAdjusting} onClick={onAdjustInventory}>
              {isAdjusting ? "Updating..." : "Apply Adjustment"}
            </button>
          </div>
        }
      >
        {inventoryProduct ? (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <InventoryCard label="On hand" value={inventoryProduct.stock} hint="Total units physically held" />
              <InventoryCard label="Reserved" value={inventoryProduct.reservedStock} hint="Held for pending payment" />
              <InventoryCard label="Available" value={inventoryProduct.availableStock} hint="Units sellable right now" />
              <InventoryCard label="Threshold" value={inventoryProduct.lowStockThreshold} hint="Low-stock trigger" />
            </div>

            <div className="grid gap-3 xl:grid-cols-[0.76fr_1.24fr]">
              <div className="rounded-[24px] border border-black/8 bg-[#fbf7f0] p-3.5">
                <h3 className="text-[1.75rem] font-semibold leading-none text-brand-dark">Manual adjustment</h3>
                <p className="mt-1.5 text-sm leading-6 text-brand-muted">
                  Use positive numbers to add stock and negative numbers to remove damaged, missing, or counted units.
                </p>

                <form className="mt-3 space-y-2.5" onSubmit={onAdjustInventory}>
                  <div className="flex flex-col gap-2">
                    <label className={FILTER_LABEL_CLASS}>Adjustment amount</label>
                    <input
                      type="number"
                      className={FILTER_FIELD_CLASS}
                      {...registerAdjustment("adjustment")}
                      placeholder="+12 or -4"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={FILTER_LABEL_CLASS}>Reason</label>
                    <textarea
                      rows="3"
                      className={`${FILTER_FIELD_CLASS} h-auto min-h-[74px] py-3`}
                      {...registerAdjustment("note")}
                      placeholder="Cycle count correction, damage write-off, supplier restock..."
                    />
                  </div>
                </form>
              </div>

              <div className="rounded-[24px] border border-black/8 bg-white">
                <div className="border-b border-black/8 px-4 py-2.5">
                  <h3 className="text-[1.75rem] font-semibold leading-none text-brand-dark">Movement history</h3>
                  <p className="mt-1 text-sm text-brand-muted">Latest 25 inventory events for this product.</p>
                </div>

                <div className="mini-cart-scroll-view stealth-scrollbar max-h-[272px] overflow-y-auto overscroll-contain scroll-smooth px-4 py-3">
                  {inventoryHistoryQuery.isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="rounded-[22px] border border-black/8 bg-[#fcfaf6] p-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-32 rounded-full" />
                              <Skeleton className="h-3 w-24 rounded-full" />
                            </div>
                            <div className="flex gap-2">
                              <Skeleton className="h-6 w-24 rounded-full" />
                              <Skeleton className="h-6 w-24 rounded-full" />
                            </div>
                          </div>
                          <div className="mt-3 space-y-2">
                            <Skeleton className="h-3.5 w-full rounded-full" />
                            <Skeleton className="h-3.5 w-2/3 rounded-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : inventoryHistoryQuery.data?.length ? (
                    <div className="space-y-3">
                      {inventoryHistoryQuery.data.map((movement) => (
                        <article key={movement.id} className="rounded-[22px] border border-black/8 bg-[#fcfaf6] p-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-brand-dark">{formatMovementType(movement.type)}</p>
                              <p className="mt-1 text-xs text-brand-muted">{formatDateTime(movement.createdAt)}</p>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs font-semibold">
                              <span className={`rounded-full px-3 py-1 ${deltaClassName(movement.onHandDelta)}`}>
                                On hand {formatDelta(movement.onHandDelta)}
                              </span>
                              <span className={`rounded-full px-3 py-1 ${deltaClassName(movement.reservedDelta)}`}>
                                Reserved {formatDelta(movement.reservedDelta)}
                              </span>
                            </div>
                          </div>

                          <p className="mt-3 text-sm text-brand-muted">
                            After event: {movement.onHandAfter} on hand | {movement.reservedAfter} reserved | {movement.availableAfter} available
                          </p>

                          {movement.referenceType || movement.referenceId ? (
                            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-brand-muted">
                              {movement.referenceType || "Reference"} {movement.referenceId ? `#${movement.referenceId}` : ""}
                            </p>
                          ) : null}

                          {movement.note ? (
                            <p className="mt-2 text-sm leading-6 text-brand-dark">{movement.note}</p>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[22px] border border-dashed border-black/12 bg-[#fcfaf6] p-6 text-center">
                      <h4 className="text-2xl font-semibold text-brand-dark">No movement history yet</h4>
                      <p className="mt-2 text-sm leading-6 text-brand-muted">
                        Inventory events will appear here once this product is adjusted, reserved, sold, or restocked.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(confirmingProduct)}
        onClose={() => setConfirmingProduct(null)}
        title="Delete Product"
        footer={
          <div className="flex items-center justify-between">
            <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={() => setConfirmingProduct(null)}>
              Keep product
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-2xl bg-danger px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#b42525]"
              disabled={deleteProductMutation.isPending}
              onClick={() => {
                if (confirmingProduct) {
                  deleteProductMutation.mutate(confirmingProduct.id);
                }
              }}
            >
              {deleteProductMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-sm leading-6 text-brand-muted">
          <p>
            Are you sure you want to delete <span className="font-medium text-brand-dark">{confirmingProduct?.name}</span>?
          </p>
          <div>
            <p className="font-medium text-brand-dark">This action will:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Remove from catalog</li>
              <li>Not available for purchase</li>
            </ul>
          </div>
          <p>Note: Existing orders remain unaffected.</p>
        </div>
      </Modal>
    </div>
  );
}

function InventoryCard({ label, value, hint }) {
  return (
    <div className="rounded-[22px] border border-black/8 bg-[#fbf7f0] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">{label}</p>
      <p className="mt-2 text-[1.8rem] font-semibold leading-none text-brand-dark">{value}</p>
      <p className="mt-1.5 text-xs leading-5 text-brand-muted">{hint}</p>
    </div>
  );
}

function formatMovementType(type) {
  switch (type) {
    case "MANUAL_ADJUSTMENT":
      return "Manual adjustment";
    case "RESERVATION_CREATED":
      return "Stock reserved";
    case "RESERVATION_RELEASED":
      return "Reservation released";
    case "ORDER_COMMITTED":
      return "Order committed";
    default:
      return type ?? "Inventory event";
  }
}

function formatDelta(value) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) {
    return "0";
  }
  return amount > 0 ? `+${amount}` : String(amount);
}

function deltaClassName(value) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount) || amount === 0) {
    return "bg-black/8 text-brand-muted";
  }

  return amount > 0 ? "bg-[#e7f7ea] text-success" : "bg-[#fdeaea] text-danger";
}

export default Products;
