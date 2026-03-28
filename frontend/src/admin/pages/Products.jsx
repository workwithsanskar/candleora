import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useOutletContext } from "react-router-dom";
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
  formatAdminStatus,
  statusClassName,
} from "../helpers";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { formatApiError, formatCurrency, formatDateTime } from "../../utils/format";

const blankFormValues = {
  name: "",
  slug: "",
  sku: "",
  categoryId: "",
  price: "",
  originalPrice: "",
  costPrice: "",
  stock: "",
  lowStockThreshold: 5,
  description: "",
  occasionTag: "",
  burnTime: "",
  scentNotes: "",
  imageUrls: "",
  visible: true,
};

const blankAdjustmentValues = {
  adjustment: "",
  note: "",
};

function Products() {
  const { search } = useOutletContext();
  const debouncedSearch = useDebouncedValue(search, 300);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [inventoryProduct, setInventoryProduct] = useState(null);
  const [confirmingProduct, setConfirmingProduct] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: blankFormValues,
  });

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
  }, [debouncedSearch, category, stock]);

  useEffect(() => {
    if (modalOpen) {
      reset(editingProduct ? toFormValues(editingProduct) : blankFormValues);
    }
  }, [editingProduct, modalOpen, reset]);

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

  const saveProductMutation = useMutation({
    mutationFn: (payload) =>
      editingProduct
        ? adminApi.updateProduct(editingProduct.id, payload)
        : adminApi.createProduct(payload),
    onSuccess: async () => {
      toast.success(editingProduct ? "Product updated." : "Product created.");
      setModalOpen(false);
      setEditingProduct(null);
      reset(blankFormValues);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

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
      await queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      name: values.name,
      slug: values.slug || undefined,
      sku: values.sku || undefined,
      categoryId: values.categoryId ? Number(values.categoryId) : undefined,
      price: values.price ? Number(values.price) : undefined,
      originalPrice: values.originalPrice ? Number(values.originalPrice) : undefined,
      costPrice: values.costPrice ? Number(values.costPrice) : undefined,
      stock: editingProduct ? undefined : values.stock ? Number(values.stock) : 0,
      lowStockThreshold: values.lowStockThreshold ? Number(values.lowStockThreshold) : 0,
      description: values.description || undefined,
      occasionTag: values.occasionTag || undefined,
      burnTime: values.burnTime || undefined,
      scentNotes: values.scentNotes || undefined,
      visible: Boolean(values.visible),
      imageUrls: parseImageUrls(values.imageUrls),
    };

    await saveProductMutation.mutateAsync(payload);
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

  const inventorySummary = useMemo(() => {
    const rows = productsQuery.data?.content ?? [];
    return [
      {
        label: "Catalog items",
        value: productsQuery.data?.totalElements ?? 0,
        hint: "Products matching the current filters",
      },
      {
        label: "Low stock",
        value: rows.filter((product) => product.status === "Low stock").length,
        hint: "Low-stock products on this page",
      },
      {
        label: "Reserved units",
        value: rows.reduce((total, product) => total + Number(product.reservedStock ?? 0), 0),
        hint: "Units held for pending online orders",
      },
      {
        label: "Out of stock",
        value: rows.filter((product) => product.status === "Out of stock").length,
        hint: "Products with no available units",
      },
    ];
  }, [productsQuery.data]);

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
            <p className="font-medium text-brand-dark">
              {product.availableStock} available
            </p>
            <p className="mt-1 text-xs text-brand-muted">
              On hand {product.stock} · Reserved {product.reservedStock}
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
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(product.status)}`}>
            {product.status}
          </span>
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
              onClick={() => {
                setEditingProduct(product);
                setModalOpen(true);
              }}
            >
              Edit
            </button>
            <button
              type="button"
              className="rounded-2xl border border-black/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-dark transition hover:border-black/20 hover:bg-black/5"
              onClick={() => setInventoryProduct(product)}
            >
              Adjust stock
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
    [toggleVisibilityMutation],
  );

  if (productsQuery.isError) {
    return (
      <div className="rounded-[28px] border border-danger/20 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl font-semibold text-brand-dark">Products unavailable</h2>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          The admin product feed failed to load. Verify the backend and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FiltersBar
        title="Inventory control"
        description="Manage CandleOra catalog readiness with SKU structure, low-stock thresholds, reserved inventory, and a stock movement trail."
        actions={
          <button
            type="button"
            className={PRIMARY_BUTTON_CLASS}
            onClick={() => {
              setEditingProduct(null);
              setModalOpen(true);
            }}
          >
            Add product
          </button>
        }
      >
        <div className="flex flex-col gap-2">
          <label className={FILTER_LABEL_CLASS}>Search</label>
          <div className={`${FILTER_FIELD_CLASS} flex items-center bg-[#fbf7f0] text-brand-muted`}>
            {debouncedSearch ? debouncedSearch : "Use the topbar search to filter by name, SKU, slug, or description"}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className={FILTER_LABEL_CLASS}>Category</label>
          <select className={FILTER_FIELD_CLASS} value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {(categoriesQuery.data ?? []).map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className={FILTER_LABEL_CLASS}>Inventory</label>
          <select className={FILTER_FIELD_CLASS} value={stock} onChange={(event) => setStock(event.target.value)}>
            <option value="">All products</option>
            <option value="in-stock">Healthy stock</option>
            <option value="low-stock">Low stock</option>
            <option value="out-of-stock">Out of stock</option>
            <option value="reserved">Reserved stock</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
      </FiltersBar>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {inventorySummary.map((card) => (
          <div key={card.label} className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted">{card.label}</p>
            {productsQuery.isLoading ? (
              <div className="mt-4 h-10 animate-pulse rounded-full bg-black/8" />
            ) : (
              <>
                <p className="mt-4 font-display text-4xl font-semibold text-brand-dark">{card.value}</p>
                <p className="mt-2 text-sm text-brand-muted">{card.hint}</p>
              </>
            )}
          </div>
        ))}
      </section>

      <DataTable
        columns={columns}
        rows={productsQuery.data?.content ?? []}
        isLoading={productsQuery.isLoading}
        emptyTitle="No products found"
        emptyDescription="Try adjusting the category or inventory filters."
      />

      <Pagination
        page={productsQuery.data?.page ?? 0}
        totalPages={productsQuery.data?.totalPages ?? 0}
        onPageChange={setPage}
      />

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
        title={editingProduct ? `Edit ${editingProduct.name}` : "Add product"}
        size="lg"
        footer={
          <div className="flex items-center justify-between">
            <button
              type="button"
              className={SECONDARY_BUTTON_CLASS}
              onClick={() => {
                setModalOpen(false);
                setEditingProduct(null);
              }}
            >
              Cancel
            </button>
            <button type="button" className={PRIMARY_BUTTON_CLASS} disabled={isSubmitting} onClick={onSubmit}>
              {isSubmitting ? "Saving..." : editingProduct ? "Save product" : "Create product"}
            </button>
          </div>
        }
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className={FILTER_LABEL_CLASS}>Product name</label>
            <input className={FILTER_FIELD_CLASS} {...register("name")} />
          </div>

          <div className="flex flex-col gap-2">
            <label className={FILTER_LABEL_CLASS}>Category</label>
            <select className={FILTER_FIELD_CLASS} {...register("categoryId")}>
              <option value="">Select a category</option>
              {(categoriesQuery.data ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className={FILTER_LABEL_CLASS}>Slug</label>
            <input className={FILTER_FIELD_CLASS} {...register("slug")} placeholder="auto-generated-if-left-empty" />
          </div>

          <div className="flex flex-col gap-2">
            <label className={FILTER_LABEL_CLASS}>SKU</label>
            <input className={FILTER_FIELD_CLASS} {...register("sku")} placeholder="auto-generated-if-left-empty" />
          </div>

          <div className="flex flex-col gap-2">
            <label className={FILTER_LABEL_CLASS}>Low-stock threshold</label>
            <input type="number" className={FILTER_FIELD_CLASS} {...register("lowStockThreshold")} />
          </div>

          <div className="flex flex-col gap-2">
            <label className={FILTER_LABEL_CLASS}>Price</label>
            <input type="number" step="0.01" className={FILTER_FIELD_CLASS} {...register("price")} />
          </div>

          <div className="flex flex-col gap-2">
            <label className={FILTER_LABEL_CLASS}>Original price</label>
            <input type="number" step="0.01" className={FILTER_FIELD_CLASS} {...register("originalPrice")} />
          </div>

          <div className="flex flex-col gap-2">
            <label className={FILTER_LABEL_CLASS}>Cost price</label>
            <input type="number" step="0.01" className={FILTER_FIELD_CLASS} {...register("costPrice")} />
          </div>

          {!editingProduct ? (
            <div className="flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS}>Opening stock</label>
              <input type="number" className={FILTER_FIELD_CLASS} {...register("stock")} />
            </div>
          ) : (
            <div className="rounded-[22px] border border-black/8 bg-[#fbf7f0] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">Inventory snapshot</p>
              <p className="mt-3 text-sm font-medium text-brand-dark">
                On hand {editingProduct.stock} · Reserved {editingProduct.reservedStock}
              </p>
              <p className="mt-1 text-sm text-brand-muted">
                Available {editingProduct.availableStock} · Threshold {editingProduct.lowStockThreshold}
              </p>
              <p className="mt-3 text-xs leading-5 text-brand-muted">
                Use the dedicated inventory control action from the table to create logged stock adjustments.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className={FILTER_LABEL_CLASS}>Occasion tag</label>
            <input className={FILTER_FIELD_CLASS} {...register("occasionTag")} placeholder="Signature" />
          </div>

          <div className="flex flex-col gap-2">
            <label className={FILTER_LABEL_CLASS}>Burn time</label>
            <input className={FILTER_FIELD_CLASS} {...register("burnTime")} placeholder="35-40 hours" />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className={FILTER_LABEL_CLASS}>Scent notes</label>
            <input className={FILTER_FIELD_CLASS} {...register("scentNotes")} placeholder="Vanilla, amber, sandalwood" />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className={FILTER_LABEL_CLASS}>Description</label>
            <textarea rows="4" className={`${FILTER_FIELD_CLASS} h-auto min-h-[120px] py-3`} {...register("description")} />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className={FILTER_LABEL_CLASS}>Image URLs</label>
            <textarea
              rows="5"
              className={`${FILTER_FIELD_CLASS} h-auto min-h-[140px] py-3`}
              {...register("imageUrls")}
              placeholder="One image URL per line"
            />
          </div>

          <label className="inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-[#fbf7f0] px-4 py-3 text-sm text-brand-dark md:col-span-2">
            <input type="checkbox" className="h-4 w-4 rounded border-black/20" {...register("visible")} />
            Product is visible on the storefront
          </label>
        </form>
      </Modal>

      <Modal
        open={Boolean(inventoryProduct)}
        onClose={() => setInventoryProduct(null)}
        title={inventoryProduct ? `Inventory for ${inventoryProduct.name}` : "Inventory control"}
        size="lg"
        footer={
          <div className="flex items-center justify-between">
            <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={() => setInventoryProduct(null)}>
              Close
            </button>
            <button type="button" className={PRIMARY_BUTTON_CLASS} disabled={isAdjusting} onClick={onAdjustInventory}>
              {isAdjusting ? "Updating..." : "Apply adjustment"}
            </button>
          </div>
        }
      >
        {inventoryProduct ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <InventoryCard label="On hand" value={inventoryProduct.stock} hint="Total units physically held" />
              <InventoryCard label="Reserved" value={inventoryProduct.reservedStock} hint="Held for pending payment" />
              <InventoryCard label="Available" value={inventoryProduct.availableStock} hint="Units sellable right now" />
              <InventoryCard label="Threshold" value={inventoryProduct.lowStockThreshold} hint="Low-stock trigger" />
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-[24px] border border-black/8 bg-[#fbf7f0] p-5">
                <h3 className="font-display text-2xl font-semibold text-brand-dark">Manual adjustment</h3>
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  Use positive numbers to add stock and negative numbers to remove damaged, missing, or counted units.
                </p>

                <form className="mt-5 space-y-4" onSubmit={onAdjustInventory}>
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
                      rows="4"
                      className={`${FILTER_FIELD_CLASS} h-auto min-h-[120px] py-3`}
                      {...registerAdjustment("note")}
                      placeholder="Cycle count correction, damage write-off, supplier restock..."
                    />
                  </div>
                </form>
              </div>

              <div className="rounded-[24px] border border-black/8 bg-white">
                <div className="border-b border-black/8 px-5 py-4">
                  <h3 className="font-display text-2xl font-semibold text-brand-dark">Movement history</h3>
                  <p className="mt-1 text-sm text-brand-muted">Latest 25 inventory events for this product.</p>
                </div>

                <div className="max-h-[420px] overflow-y-auto px-5 py-4">
                  {inventoryHistoryQuery.isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="h-20 animate-pulse rounded-[22px] bg-black/8" />
                      ))}
                    </div>
                  ) : inventoryHistoryQuery.data?.length ? (
                    <div className="space-y-3">
                      {inventoryHistoryQuery.data.map((movement) => (
                        <article key={movement.id} className="rounded-[22px] border border-black/8 bg-[#fcfaf6] p-4">
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
                            After event: {movement.onHandAfter} on hand · {movement.reservedAfter} reserved · {movement.availableAfter} available
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
                      <h4 className="font-display text-2xl font-semibold text-brand-dark">No movement history yet</h4>
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
        title="Delete product"
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
              {deleteProductMutation.isPending ? "Deleting..." : "Delete permanently"}
            </button>
          </div>
        }
      >
        <p className="text-sm leading-6 text-brand-muted">
          This will remove <span className="font-medium text-brand-dark">{confirmingProduct?.name}</span> from the catalog. Existing order items keep a snapshot of product details, but live catalog access will be removed.
        </p>
      </Modal>
    </div>
  );
}

function InventoryCard({ label, value, hint }) {
  return (
    <div className="rounded-[22px] border border-black/8 bg-[#fbf7f0] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">{label}</p>
      <p className="mt-3 font-display text-3xl font-semibold text-brand-dark">{value}</p>
      <p className="mt-2 text-sm text-brand-muted">{hint}</p>
    </div>
  );
}

function parseImageUrls(value) {
  return String(value ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toFormValues(product) {
  return {
    name: product.name ?? "",
    slug: product.slug ?? "",
    sku: product.sku ?? "",
    categoryId: product.category?.id ? String(product.category.id) : "",
    price: product.price ?? "",
    originalPrice: product.originalPrice ?? "",
    costPrice: product.costPrice ?? "",
    stock: product.stock ?? "",
    lowStockThreshold: product.lowStockThreshold ?? 5,
    description: product.description ?? "",
    occasionTag: product.occasionTag ?? "",
    burnTime: product.burnTime ?? "",
    scentNotes: product.scentNotes ?? "",
    imageUrls: Array.isArray(product.imageUrls) ? product.imageUrls.join("\n") : "",
    visible: Boolean(product.visible),
  };
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
      return "Reserved stock committed";
    case "DIRECT_SALE_COMMITTED":
      return "Direct sale committed";
    case "ORDER_RESTOCKED":
      return "Restocked from cancelled order";
    default:
      return formatAdminStatus(type);
  }
}

function formatDelta(value) {
  const amount = Number(value ?? 0);
  if (amount > 0) {
    return `+${amount}`;
  }
  return String(amount);
}

function deltaClassName(value) {
  const amount = Number(value ?? 0);
  if (amount > 0) {
    return "bg-[#e7f7ea] text-success";
  }
  if (amount < 0) {
    return "bg-[#fdeaea] text-danger";
  }
  return "bg-[#fbf7f0] text-brand-muted";
}

export default Products;
