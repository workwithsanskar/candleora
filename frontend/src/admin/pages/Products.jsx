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
  statusClassName,
} from "../helpers";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { formatApiError, formatCurrency } from "../../utils/format";

const blankFormValues = {
  name: "",
  slug: "",
  categoryId: "",
  price: "",
  originalPrice: "",
  costPrice: "",
  stock: "",
  description: "",
  occasionTag: "",
  burnTime: "",
  scentNotes: "",
  imageUrls: "",
  visible: true,
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
  const [confirmingProduct, setConfirmingProduct] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: blankFormValues,
  });

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, category, stock]);

  useEffect(() => {
    if (modalOpen) {
      reset(editingProduct ? toFormValues(editingProduct) : blankFormValues);
    }
  }, [editingProduct, modalOpen, reset]);

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
      categoryId: values.categoryId ? Number(values.categoryId) : undefined,
      price: values.price ? Number(values.price) : undefined,
      originalPrice: values.originalPrice ? Number(values.originalPrice) : undefined,
      costPrice: values.costPrice ? Number(values.costPrice) : undefined,
      stock: values.stock ? Number(values.stock) : 0,
      description: values.description || undefined,
      occasionTag: values.occasionTag || undefined,
      burnTime: values.burnTime || undefined,
      scentNotes: values.scentNotes || undefined,
      visible: Boolean(values.visible),
      imageUrls: parseImageUrls(values.imageUrls),
    };

    await saveProductMutation.mutateAsync(payload);
  });

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
        key: "stock",
        header: "Stock",
        cell: (product) => product.stock,
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
        title="Product management"
        description="Update pricing, visibility, stock position, and catalog quality from a single operating table."
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
            {debouncedSearch ? debouncedSearch : "Use the topbar search to filter products"}
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
            <option value="in-stock">In stock</option>
            <option value="low-stock">Low stock</option>
            <option value="out-of-stock">Out of stock</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
      </FiltersBar>

      <DataTable
        columns={columns}
        rows={productsQuery.data?.content ?? []}
        isLoading={productsQuery.isLoading}
        emptyTitle="No products found"
        emptyDescription="Try adjusting the category or stock filters."
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

          <div className="flex flex-col gap-2">
            <label className={FILTER_LABEL_CLASS}>Stock</label>
            <input type="number" className={FILTER_FIELD_CLASS} {...register("stock")} />
          </div>

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
    categoryId: product.category?.id ? String(product.category.id) : "",
    price: product.price ?? "",
    originalPrice: product.originalPrice ?? "",
    costPrice: product.costPrice ?? "",
    stock: product.stock ?? "",
    description: product.description ?? "",
    occasionTag: product.occasionTag ?? "",
    burnTime: product.burnTime ?? "",
    scentNotes: product.scentNotes ?? "",
    imageUrls: Array.isArray(product.imageUrls) ? product.imageUrls.join("\n") : "",
    visible: Boolean(product.visible),
  };
}

export default Products;
