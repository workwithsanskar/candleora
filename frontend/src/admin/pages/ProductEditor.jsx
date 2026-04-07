import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import CandleCheckbox from "../../components/CandleCheckbox";
import AdminSelect from "../components/AdminSelect";
import {
  FILTER_FIELD_CLASS,
  FILTER_LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
} from "../helpers";
import { formatApiError } from "../../utils/format";
import adminApi from "../services/adminApi";

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
  similarProductIds: [],
  visible: true,
};

const PRODUCT_FORM_ID = "admin-product-page-form";
const ADMIN_FORM_SECTION_CLASS =
  "rounded-[26px] border border-black/8 bg-[#fffaf3] p-3.5 shadow-[0_12px_28px_rgba(23,18,15,0.04)] sm:p-4";
const ADMIN_FORM_SECTION_TITLE_CLASS =
  "text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-muted";
const ADMIN_FORM_SECTION_COPY_CLASS = "mt-1 text-[13px] leading-5 text-brand-muted";
const ADMIN_FORM_TEXTAREA_CLASS =
  `${FILTER_FIELD_CLASS} stealth-scrollbar h-auto min-h-[72px] resize-none py-2.5 leading-6`;
const ADMIN_FORM_TOGGLE_CARD_CLASS =
  "inline-flex items-center gap-3 rounded-[20px] border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-brand-dark";

function ProductEditor() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const queryClient = useQueryClient();
  const [similarProductSearch, setSimilarProductSearch] = useState("");
  const isEdit = Boolean(productId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: blankFormValues,
  });

  const productQuery = useQuery({
    queryKey: ["admin", "product", productId],
    queryFn: () => adminApi.getProduct(productId),
    enabled: isEdit,
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => adminApi.getCategories(),
  });

  const productOptionsQuery = useQuery({
    queryKey: ["admin", "product-options"],
    queryFn: () => adminApi.getProductOptions(),
  });

  useEffect(() => {
    if (isEdit) {
      if (productQuery.data) {
        reset(toFormValues(productQuery.data));
      }
      return;
    }

    reset(blankFormValues);
  }, [isEdit, productQuery.data, reset]);

  const selectedCategoryId = watch("categoryId");
  const selectedSimilarProductIds = watch("similarProductIds") ?? [];

  const saveProductMutation = useMutation({
    mutationFn: (payload) =>
      isEdit ? adminApi.updateProduct(productId, payload) : adminApi.createProduct(payload),
    onSuccess: async () => {
      toast.success(isEdit ? "Product updated." : "Product created.");
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      navigate("/admin/products");
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
      stock: isEdit ? undefined : values.stock ? Number(values.stock) : 0,
      lowStockThreshold: values.lowStockThreshold ? Number(values.lowStockThreshold) : 0,
      description: values.description || undefined,
      occasionTag: values.occasionTag || undefined,
      burnTime: values.burnTime || undefined,
      scentNotes: values.scentNotes || undefined,
      visible: Boolean(values.visible),
      imageUrls: parseImageUrls(values.imageUrls),
      similarProductIds: selectedSimilarProductIds.map((value) => Number(value)).filter(Boolean),
    };

    await saveProductMutation.mutateAsync(payload);
  });

  const selectedSimilarProductIdSet = useMemo(
    () => new Set(selectedSimilarProductIds.map((value) => Number(value))),
    [selectedSimilarProductIds],
  );

  const filteredSimilarProductOptions = useMemo(() => {
    const normalizedSearch = similarProductSearch.trim().toLowerCase();

    return (productOptionsQuery.data ?? [])
      .filter((option) => Number(option.id) !== Number(productQuery.data?.id ?? 0))
      .filter((option) => {
        if (!normalizedSearch) {
          return true;
        }

        return [option.name, option.sku, option.slug, option.categoryName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));
      })
      .sort((left, right) => {
        const leftSelected = selectedSimilarProductIdSet.has(Number(left.id)) ? 0 : 1;
        const rightSelected = selectedSimilarProductIdSet.has(Number(right.id)) ? 0 : 1;

        if (leftSelected !== rightSelected) {
          return leftSelected - rightSelected;
        }

        return String(left.name ?? "").localeCompare(String(right.name ?? ""));
      });
  }, [productOptionsQuery.data, productQuery.data?.id, selectedSimilarProductIdSet, similarProductSearch]);

  const selectedSimilarProducts = useMemo(
    () =>
      (productOptionsQuery.data ?? []).filter((option) =>
        selectedSimilarProductIdSet.has(Number(option.id)),
      ),
    [productOptionsQuery.data, selectedSimilarProductIdSet],
  );

  const toggleSimilarProduct = (productOptionId) => {
    const numericId = Number(productOptionId);
    const nextIds = selectedSimilarProductIdSet.has(numericId)
      ? selectedSimilarProductIds.filter((value) => Number(value) !== numericId)
      : [...selectedSimilarProductIds, numericId];

    setValue("similarProductIds", nextIds, { shouldDirty: true });
  };

  if (isEdit && productQuery.isLoading) {
    return (
      <div className="rounded-[28px] border border-black/10 bg-white p-8 shadow-sm">
        <div className="h-8 w-44 animate-pulse rounded-full bg-black/8" />
        <div className="mt-3 h-5 w-80 animate-pulse rounded-full bg-black/8" />
      </div>
    );
  }

  if (isEdit && productQuery.isError) {
    return (
      <div className="rounded-[28px] border border-danger/20 bg-white p-8 shadow-sm">
        <h2 className="font-display text-2xl font-semibold text-brand-dark">Product unavailable</h2>
        <p className="mt-3 text-sm leading-6 text-brand-muted">
          The product could not be loaded. Verify the backend and try again.
        </p>
        <button type="button" className={`${SECONDARY_BUTTON_CLASS} mt-5`} onClick={() => navigate("/admin/products")}>
          Back to products
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">Product editor</p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-brand-dark">
              {isEdit ? "Edit product" : "Add product"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-muted">
              Manage pricing, stock, content, and related products for this listing.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={() => navigate("/admin/products")}>
              Back to products
            </button>
            <button type="submit" form={PRODUCT_FORM_ID} className={PRIMARY_BUTTON_CLASS} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Save product" : "Create product"}
            </button>
          </div>
        </div>
      </section>

      <form id={PRODUCT_FORM_ID} className="space-y-4" onSubmit={onSubmit}>
        <section className={ADMIN_FORM_SECTION_CLASS}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={ADMIN_FORM_SECTION_TITLE_CLASS}>Catalog identity</p>
              <p className={ADMIN_FORM_SECTION_COPY_CLASS}>
                Set the product name, category, slug, and SKU.
              </p>
            </div>
            <span className="rounded-full border border-[#f3b33d]/35 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#986700]">
              {isEdit ? "Editing product" : "New product"}
            </span>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-12">
            <div className="flex flex-col gap-2 lg:col-span-12">
              <label className={FILTER_LABEL_CLASS}>Product name</label>
              <input className={FILTER_FIELD_CLASS} {...register("name")} />
            </div>

            <div className="flex flex-col gap-2 lg:col-span-4">
              <label className={FILTER_LABEL_CLASS}>Category</label>
              <AdminSelect
                value={selectedCategoryId || ""}
                onChange={(value) => setValue("categoryId", value, { shouldDirty: true })}
                options={[
                  { value: "", label: "Select a category" },
                  ...((categoriesQuery.data ?? []).map((item) => ({
                    value: String(item.id),
                    label: item.name,
                  }))),
                ]}
                placeholder="Select a category"
              />
            </div>

            <div className="flex flex-col gap-2 lg:col-span-4">
              <label className={FILTER_LABEL_CLASS}>Slug</label>
              <input className={FILTER_FIELD_CLASS} {...register("slug")} placeholder="Auto generated if left empty" />
            </div>

            <div className="flex flex-col gap-2 lg:col-span-4">
              <label className={FILTER_LABEL_CLASS}>SKU</label>
              <input className={FILTER_FIELD_CLASS} {...register("sku")} placeholder="Auto generated if left empty" />
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <section className={ADMIN_FORM_SECTION_CLASS}>
            <p className={ADMIN_FORM_SECTION_TITLE_CLASS}>Commerce setup</p>
            <p className={ADMIN_FORM_SECTION_COPY_CLASS}>
              Review pricing, stock, and low-stock settings.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
                <label className={FILTER_LABEL_CLASS}>Low-stock threshold</label>
                <input type="number" className={FILTER_FIELD_CLASS} {...register("lowStockThreshold")} />
              </div>

              {!isEdit ? (
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className={FILTER_LABEL_CLASS}>Opening stock</label>
                  <input type="number" className={FILTER_FIELD_CLASS} {...register("stock")} />
                </div>
              ) : (
                <div className="rounded-[24px] border border-black/8 bg-white p-4 sm:col-span-2">
                  <p className={FILTER_LABEL_CLASS}>Inventory snapshot</p>
                  <div className="mt-2.5 grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">On hand</p>
                      <p className="mt-1 text-lg font-semibold text-brand-dark">{productQuery.data?.stock}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">Reserved</p>
                      <p className="mt-1 text-lg font-semibold text-brand-dark">{productQuery.data?.reservedStock}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">Available</p>
                      <p className="mt-1 text-lg font-semibold text-brand-dark">{productQuery.data?.availableStock}</p>
                    </div>
                  </div>
                  <p className="mt-2.5 text-xs leading-5 text-brand-muted">
                    Update stock from Products & Inventory.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className={ADMIN_FORM_SECTION_CLASS}>
            <p className={ADMIN_FORM_SECTION_TITLE_CLASS}>Presentation details</p>
            <p className={ADMIN_FORM_SECTION_COPY_CLASS}>
              Add the short storefront details shown with this product.
            </p>

            <div className="mt-3 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className={FILTER_LABEL_CLASS}>Occasion tag</label>
                  <input className={FILTER_FIELD_CLASS} {...register("occasionTag")} placeholder="Signature" />
                </div>

                <div className="flex flex-col gap-2">
                  <label className={FILTER_LABEL_CLASS}>Burn time</label>
                  <input className={FILTER_FIELD_CLASS} {...register("burnTime")} placeholder="35-40 hours" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className={FILTER_LABEL_CLASS}>Scent notes</label>
                <input
                  className={FILTER_FIELD_CLASS}
                  {...register("scentNotes")}
                  placeholder="Vanilla, amber, sandalwood"
                />
              </div>

              <label className={ADMIN_FORM_TOGGLE_CARD_CLASS}>
                <CandleCheckbox className="h-4 w-4" {...register("visible")} />
                Product is visible on the storefront
              </label>
            </div>
          </section>
        </div>

        <section className={ADMIN_FORM_SECTION_CLASS}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={ADMIN_FORM_SECTION_TITLE_CLASS}>Story and media</p>
              <p className={ADMIN_FORM_SECTION_COPY_CLASS}>
                Add a short description and image links for this listing.
              </p>
            </div>
            <span className="rounded-full border border-black/8 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
              Copy + assets
            </span>
          </div>

          <div className="mt-3 grid gap-3 xl:grid-cols-[0.96fr_1.04fr]">
            <div className="flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS}>Description</label>
              <textarea rows="2" className={ADMIN_FORM_TEXTAREA_CLASS} {...register("description")} />
            </div>

            <div className="flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS}>Image URLs</label>
              <textarea
                rows="2"
                className={ADMIN_FORM_TEXTAREA_CLASS}
                {...register("imageUrls")}
                placeholder="One image URL per line"
              />
            </div>
          </div>
        </section>

        <section className={ADMIN_FORM_SECTION_CLASS}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={ADMIN_FORM_SECTION_TITLE_CLASS}>Similar products</p>
              <p className={ADMIN_FORM_SECTION_COPY_CLASS}>
                Choose which products should appear in Similar Products. Leave this empty to hide that section.
              </p>
            </div>
            <span className="rounded-full border border-black/8 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
              {selectedSimilarProductIds.length} linked
            </span>
          </div>

          <div className="mt-3 grid gap-3 xl:grid-cols-[0.72fr_1.28fr]">
            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <label className={FILTER_LABEL_CLASS}>Find products</label>
                <input
                  className={FILTER_FIELD_CLASS}
                  value={similarProductSearch}
                  onChange={(event) => setSimilarProductSearch(event.target.value)}
                  placeholder="Search by product name, SKU, slug, or category"
                />
              </div>

              {selectedSimilarProducts.length ? (
                <div className="rounded-[24px] border border-black/8 bg-white p-3.5">
                  <p className={FILTER_LABEL_CLASS}>Selected links</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedSimilarProducts.map((option) => (
                      <button
                        key={`selected-similar-${option.id}`}
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border border-[#f3b33d]/35 bg-[#fffaf3] px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:border-[#f3b33d]/60"
                        onClick={() => toggleSimilarProduct(option.id)}
                      >
                        <span className="max-w-[180px] truncate">{option.name}</span>
                        <span className="text-brand-muted">x</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-black/12 bg-white p-4 text-sm leading-6 text-brand-muted">
                  No similar products selected yet. The storefront will hide Similar Products until links are added.
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-black/8 bg-white">
              <div className="border-b border-black/8 px-4 py-2.5">
                <p className="text-[1.55rem] font-semibold leading-none text-brand-dark">Product links</p>
                <p className="mt-1 text-sm text-brand-muted">
                  Click products to add or remove them from this list.
                </p>
              </div>

              <div className="stealth-scrollbar max-h-[320px] overflow-y-auto px-4 py-3">
                {productOptionsQuery.isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={`similar-loading-${index}`} className="h-20 animate-pulse rounded-[22px] bg-black/8" />
                    ))}
                  </div>
                ) : filteredSimilarProductOptions.length ? (
                  <div className="space-y-3">
                    {filteredSimilarProductOptions.map((option) => {
                      const checked = selectedSimilarProductIdSet.has(Number(option.id));

                      return (
                        <label
                          key={option.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-[22px] border px-3.5 py-3 transition ${
                            checked
                              ? "border-[#f3b33d]/45 bg-[#fff8ea]"
                              : "border-black/8 bg-[#fcfaf6] hover:border-black/14"
                          }`}
                        >
                          <CandleCheckbox
                            className="mt-1 h-4 w-4"
                            checked={checked}
                            onChange={() => toggleSimilarProduct(option.id)}
                          />

                          <img
                            src={option.imageUrl || "https://placehold.co/88x88?text=CandleOra"}
                            alt=""
                            aria-hidden="true"
                            className="h-14 w-14 rounded-[16px] object-cover"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-brand-dark">{option.name}</p>
                            <p className="mt-1 text-xs text-brand-muted">
                              {[option.categoryName, option.sku || "SKU pending", option.visible ? "Visible" : "Hidden"]
                                .filter(Boolean)
                                .join(" | ")}
                            </p>
                            <p className="mt-1 truncate text-[11px] uppercase tracking-[0.14em] text-brand-muted">
                              {option.slug}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-[22px] border border-dashed border-black/12 bg-[#fcfaf6] p-5 text-center">
                    <p className="font-medium text-brand-dark">No products match this search.</p>
                    <p className="mt-2 text-sm leading-6 text-brand-muted">
                      Try a different product name, SKU, slug, or category to find items to link here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </form>
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
    similarProductIds: Array.isArray(product.similarProductIds) ? product.similarProductIds : [],
    visible: Boolean(product.visible),
  };
}

export default ProductEditor;
