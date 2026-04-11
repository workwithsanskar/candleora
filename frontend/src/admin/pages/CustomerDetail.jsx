import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import ContentReveal from "../../components/ContentReveal";
import {
  AdminListCardSkeleton,
  AdminMetricGridSkeleton,
  AdminPageHeroSkeleton,
  AdminPanelSkeleton,
} from "../components/AdminSkeletons";
import adminApi from "../services/adminApi";
import {
  SECONDARY_BUTTON_CLASS,
  formatAdminStatus,
  statusClassName,
} from "../helpers";
import {
  formatCurrency,
  formatDate,
  formatDateRange,
  formatDateTime,
  titleCase,
} from "../../utils/format";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function CustomerDetail() {
  const { customerId } = useParams();
  const prefersReducedMotion = useReducedMotion();
  const addressesScrollRef = useRef(null);
  const addressesScrollAnimationRef = useRef(null);
  const addressesScrollTargetRef = useRef(0);

  const customerQuery = useQuery({
    queryKey: ["admin", "customer", customerId],
    queryFn: () => adminApi.getCustomer(customerId),
    enabled: Boolean(customerId),
  });

  const summaryCards = useMemo(() => {
    if (!customerQuery.data) {
      return [];
    }

    return [
      { label: "Lifetime value", value: formatCurrency(customerQuery.data.totalSpent) },
      { label: "Total orders", value: customerQuery.data.totalOrders },
      { label: "Delivered", value: customerQuery.data.deliveredOrders },
      { label: "Average order", value: formatCurrency(customerQuery.data.averageOrderValue) },
    ];
  }, [customerQuery.data]);

  useEffect(() => {
    return () => {
      addressesScrollAnimationRef.current?.stop();
    };
  }, []);

  if (customerQuery.isError) {
    return (
      <div className="rounded-[28px] border border-danger/20 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl font-semibold text-brand-dark">Customer profile unavailable</h2>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          CandleOra could not load this customer right now. Please retry once the admin API is reachable.
        </p>
        <Link to="/admin/customers" className={`mt-4 inline-flex ${SECONDARY_BUTTON_CLASS}`}>
          Back to customers
        </Link>
      </div>
    );
  }

  if (customerQuery.isLoading || !customerQuery.data) {
    return (
      <div className="space-y-6">
        <AdminPageHeroSkeleton />
        <AdminMetricGridSkeleton />
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <AdminPanelSkeleton lines={4} />
          <AdminPanelSkeleton lines={5} />
        </div>
        <AdminPanelSkeleton heightClassName="min-h-[340px]" header={true} lines={2}>
          <AdminListCardSkeleton />
        </AdminPanelSkeleton>
      </div>
    );
  }

  const customer = customerQuery.data;
  const fallbackProfileAddress = buildFallbackProfileAddress(customer);
  const explicitAddresses = customer.addresses.length > 0
    ? customer.addresses
    : fallbackProfileAddress
      ? [fallbackProfileAddress]
      : [];
  const primaryAddress = explicitAddresses.find((address) => address.isDefault) ?? explicitAddresses[0] ?? null;
  const remainingAddresses = primaryAddress
    ? explicitAddresses.filter((address) => address.id !== primaryAddress.id)
    : [];
  const shouldEnableAddressScroller = remainingAddresses.length > 0;

  const syncAddressScrollTarget = () => {
    if (!addressesScrollRef.current) {
      return;
    }

    addressesScrollTargetRef.current = addressesScrollRef.current.scrollTop;
  };

  const handleAddressesWheel = (event) => {
    const scrollRegion = addressesScrollRef.current;
    if (!scrollRegion || !shouldEnableAddressScroller) {
      return;
    }

    const maxScrollTop = Math.max(0, scrollRegion.scrollHeight - scrollRegion.clientHeight);
    if (maxScrollTop <= 0) {
      return;
    }

    const normalizedDelta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    if (!normalizedDelta) {
      return;
    }

    const currentScrollTop = scrollRegion.scrollTop;
    const atTop = currentScrollTop <= 0;
    const atBottom = currentScrollTop >= maxScrollTop - 1;

    if ((normalizedDelta < 0 && atTop) || (normalizedDelta > 0 && atBottom)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const baseScrollTop = Number.isFinite(addressesScrollTargetRef.current)
      ? addressesScrollTargetRef.current
      : currentScrollTop;
    const nextScrollTop = clamp(baseScrollTop + normalizedDelta, 0, maxScrollTop);
    addressesScrollTargetRef.current = nextScrollTop;

    addressesScrollAnimationRef.current?.stop();

    if (prefersReducedMotion) {
      scrollRegion.scrollTop = nextScrollTop;
      return;
    }

    addressesScrollAnimationRef.current = animate(currentScrollTop, nextScrollTop, {
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        if (addressesScrollRef.current) {
          addressesScrollRef.current.scrollTop = latest;
        }
      },
    });
  };

  return (
    <ContentReveal className="space-y-6">
      <section className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <Link to="/admin/customers" className="inline-flex items-center gap-2 text-sm font-medium text-brand-muted transition hover:text-brand-dark">
              <span aria-hidden="true">←</span>
              Back to customers
            </Link>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">Customer profile</p>
              <h1 className="mt-2 font-display text-4xl font-semibold text-brand-dark">{customer.name}</h1>
              <p className="mt-2 text-base text-brand-muted">{customer.email}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusPill label={formatAuthProvider(customer.authProvider)} tone="bg-[#fbf7f0] text-brand-dark" />
              <StatusPill
                label={customer.emailVerified ? "Email verified" : "Email pending"}
                tone={customer.emailVerified ? "bg-[#e7f7ea] text-success" : "bg-[#fff3dd] text-[#986700]"}
              />
              <StatusPill
                label={customer.phoneVerified ? "Phone verified" : "Phone pending"}
                tone={customer.phoneVerified ? "bg-[#e7f7ea] text-success" : "bg-[#fff3dd] text-[#986700]"}
              />
              {customer.locationLabel ? (
                <StatusPill label={customer.locationLabel} tone="bg-[#ebf3ff] text-[#2659b7]" />
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <QuickMeta label="Joined" value={formatDate(customer.createdAt)} />
            <QuickMeta label="Last order" value={customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "No orders yet"} />
            <QuickMeta label="Primary phone" value={customer.phoneNumber || "Not added"} />
            <QuickMeta label="Cancelled orders" value={String(customer.cancelledOrders)} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted">{card.label}</p>
            <p className="mt-5 font-display text-4xl font-semibold text-brand-dark">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-stretch">
        <div className="flex h-full flex-col gap-6">
          <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
            <SectionHeader
              eyebrow="Identity"
              title="Profile details"
              description="Account information captured directly from registration and profile edits."
            />
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <DetailItem label="Full name" value={customer.name} />
              <DetailItem label="Gender" value={customer.gender || "Not added"} />
              <DetailItem label="Date of birth" value={customer.dateOfBirth ? formatDate(customer.dateOfBirth) : "Not added"} />
              <DetailItem label="Auth provider" value={formatAuthProvider(customer.authProvider)} />
              <DetailItem label="Email" value={customer.email} />
              <DetailItem label="Phone" value={customer.phoneNumber || "Not added"} />
              <DetailItem label="Alternate phone" value={customer.alternatePhoneNumber || "Not added"} />
              <DetailItem label="Location label" value={customer.locationLabel || "Not added"} />
            </dl>
          </div>

          <div className="flex min-h-0 flex-1 flex-col rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
            <SectionHeader
              eyebrow="Addresses"
              title="Saved delivery addresses"
              description="Profile address fields and explicit saved addresses are both surfaced for support and fulfilment review."
            />

            <div
              ref={addressesScrollRef}
              className={`mt-5 flex min-h-0 flex-col ${
                shouldEnableAddressScroller
                  ? "mini-cart-scroll-view stealth-scrollbar max-h-[19.5rem] overflow-y-auto overscroll-contain pr-3 scroll-smooth touch-pan-y"
                  : ""
              }`.trim()}
              data-lenis-prevent={shouldEnableAddressScroller ? "true" : undefined}
              data-lenis-prevent-wheel={shouldEnableAddressScroller ? "true" : undefined}
              data-lenis-prevent-touch={shouldEnableAddressScroller ? "true" : undefined}
              onScroll={shouldEnableAddressScroller ? syncAddressScrollTarget : undefined}
              onWheelCapture={shouldEnableAddressScroller ? handleAddressesWheel : undefined}
            >
              {primaryAddress ? (
                <>
                  <AddressCard
                    address={primaryAddress}
                    isFallback={fallbackProfileAddress?.id === primaryAddress.id}
                  />

                  {remainingAddresses.length > 0 ? (
                    <div className="mt-4 space-y-4">
                      {remainingAddresses.map((address) => (
                        <AddressCard key={address.id} address={address} />
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <EmptyState
                  title="No saved addresses yet"
                  description="This customer has not stored a reusable address in CandleOra so far."
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex h-full flex-col gap-6">
          <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
            <SectionHeader
              eyebrow="Account health"
              title="Verification and support signals"
              description="Use these details when validating account trust, delivery issues, or customer support requests."
            />

            <div className="mt-5 space-y-4">
              <SignalRow
                label="Email status"
                value={customer.emailVerified ? "Verified" : "Pending verification"}
                tone={customer.emailVerified ? "bg-[#e7f7ea] text-success" : "bg-[#fff3dd] text-[#986700]"}
              />
              <SignalRow
                label="Phone status"
                value={customer.phoneVerified ? "Verified" : "Pending verification"}
                tone={customer.phoneVerified ? "bg-[#e7f7ea] text-success" : "bg-[#fff3dd] text-[#986700]"}
              />
              <SignalRow label="Order cadence" value={describeOrderCadence(customer.totalOrders, customer.createdAt)} tone="bg-[#fbf7f0] text-brand-dark" />
              <SignalRow
                label="Geo coordinates"
                value={formatCoordinates(customer.latitude, customer.longitude)}
                tone="bg-[#fbf7f0] text-brand-dark"
              />
            </div>

            {customer.latitude != null && customer.longitude != null ? (
              <a
                href={`https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`}
                target="_blank"
                rel="noreferrer"
                className={`mt-5 inline-flex ${SECONDARY_BUTTON_CLASS}`}
              >
                Open mapped location
              </a>
            ) : null}
          </div>

          <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
            <SectionHeader
              eyebrow="Commerce overview"
              title="Relationship snapshot"
              description="A quick operational read on this customer before diving into each order."
            />

            <dl className="mt-5 space-y-4">
              <CommerceLine label="Lifetime value" value={formatCurrency(customer.totalSpent)} />
              <CommerceLine label="Average order value" value={formatCurrency(customer.averageOrderValue)} />
              <CommerceLine label="Delivered orders" value={String(customer.deliveredOrders)} />
              <CommerceLine label="Cancelled orders" value={String(customer.cancelledOrders)} />
              <CommerceLine label="Last purchase" value={customer.lastOrderAt ? formatDateTime(customer.lastOrderAt) : "No purchase yet"} />
            </dl>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
        <SectionHeader
          eyebrow="Orders"
          title="Full order history"
          description="Every order placed by this customer, including items, payment state, coupon usage, and shipping destination."
        />

        <div className="mt-6 space-y-5">
          {customer.orders.length > 0 ? (
            customer.orders.map((order) => (
              <article key={order.id} className="rounded-[28px] border border-black/8 bg-[#fcfaf6] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-2xl font-semibold text-brand-dark">Order #{order.id}</p>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(order.status)}`}>
                        {formatAdminStatus(order.status)}
                      </span>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${paymentStatusClassName(order.paymentStatus)}`}>
                        {formatAdminStatus(order.paymentStatus)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-brand-muted">
                      Placed {formatDateTime(order.createdAt)}
                      {order.paymentMethod ? ` · ${titleCase(order.paymentMethod)}` : ""}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <QuickMeta label="Total" value={formatCurrency(order.totalAmount)} />
                    <QuickMeta label="Items" value={String(order.itemsCount)} />
                    <QuickMeta label="Coupon" value={order.couponCode || "No coupon"} />
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                  <div className="rounded-[24px] border border-black/8 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">Shipping details</p>
                    <div className="mt-3 space-y-2 text-sm leading-6 text-brand-dark">
                      <p>{order.shippingName}</p>
                      <p>{order.contactEmail}</p>
                      <p>{order.phone}{order.alternatePhoneNumber ? ` · Alt ${order.alternatePhoneNumber}` : ""}</p>
                      <p>
                        {order.addressLine1}
                        {order.addressLine2 ? `, ${order.addressLine2}` : ""}
                        <br />
                        {order.city}, {order.state} {order.postalCode}
                        {order.country ? <><br />{order.country}</> : null}
                      </p>
                      {order.locationLabel ? (
                        <p className="text-brand-muted">Delivery marker: {order.locationLabel}</p>
                      ) : null}
                      <p className="text-brand-muted">
                        Delivery window: {formatDateRange(order.estimatedDeliveryStart, order.estimatedDeliveryEnd)}
                      </p>
                      {order.cancelledAt ? (
                        <p className="text-danger">
                          Cancelled on {formatDateTime(order.cancelledAt)}
                          {order.cancellationReason ? ` · ${order.cancellationReason}` : ""}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-black/8 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">Items ordered</p>
                      <p className="text-xs text-brand-muted">
                        Subtotal {formatCurrency(order.subtotalAmount)} · Discount {formatCurrency(order.discountAmount)}
                      </p>
                    </div>

                    <div className="mt-4 space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 rounded-[22px] border border-black/6 bg-[#fcfaf6] px-3 py-3">
                          <img src={item.imageUrl} alt={item.productName} className="h-16 w-16 rounded-2xl object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-brand-dark">{item.productName}</p>
                            <p className="mt-1 text-xs text-brand-muted">Qty {item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium text-brand-dark">{formatCurrency(item.price)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              title="No orders yet"
              description="This customer has an account, but no completed or in-flight CandleOra orders have been recorded yet."
            />
          )}
        </div>
      </section>
    </ContentReveal>
  );
}

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-semibold text-brand-dark">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-muted">{description}</p>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-[22px] border border-black/8 bg-[#fbf7f0] p-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">{label}</dt>
      <dd className="mt-2 text-sm leading-6 text-brand-dark">{value}</dd>
    </div>
  );
}

function QuickMeta({ label, value }) {
  return (
    <div className="rounded-[22px] border border-black/8 bg-[#fbf7f0] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">{label}</p>
      <p className="mt-2 text-sm font-medium text-brand-dark">{value}</p>
    </div>
  );
}

function StatusPill({ label, tone }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

function SignalRow({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[22px] border border-black/8 bg-[#fcfaf6] px-4 py-4">
      <p className="text-sm text-brand-muted">{label}</p>
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{value}</span>
    </div>
  );
}

function CommerceLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-black/8 pb-4 last:border-none last:pb-0">
      <p className="text-sm text-brand-muted">{label}</p>
      <p className="text-sm font-medium text-brand-dark">{value}</p>
    </div>
  );
}

function AddressCard({ address, isFallback = false }) {
  return (
    <article className="rounded-[24px] border border-black/8 bg-[#fcfaf6] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium text-brand-dark">{address.fullName}</p>
        {address.label ? <StatusPill label={address.label} tone="bg-[#fbf7f0] text-brand-dark" /> : null}
        {address.isDefault ? <StatusPill label="Default" tone="bg-[#17120f] text-white" /> : null}
        {isFallback ? <StatusPill label="Profile address" tone="bg-[#ebf3ff] text-[#2659b7]" /> : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-brand-dark">
        {address.addressLine1}
        {address.addressLine2 ? `, ${address.addressLine2}` : ""}
        <br />
        {address.city}, {address.state} {address.postalCode}
        {address.country ? <><br />{address.country}</> : null}
      </p>
      <p className="mt-3 text-sm text-brand-muted">{address.phone}</p>
      {address.updatedAt ? <p className="mt-1 text-xs text-brand-muted">Updated {formatDateTime(address.updatedAt)}</p> : null}
    </article>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[24px] border border-dashed border-black/12 bg-[#fcfaf6] p-6 text-center">
      <h3 className="font-display text-2xl font-semibold text-brand-dark">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-brand-muted">{description}</p>
    </div>
  );
}

function buildFallbackProfileAddress(customer) {
  if (!customer.addressLine1 && !customer.city && !customer.state && !customer.postalCode) {
    return null;
  }

  return {
    id: "profile-address",
    label: customer.locationLabel || "Account address",
    fullName: customer.name,
    phone: customer.phoneNumber || customer.alternatePhoneNumber || "Phone not added",
    addressLine1: customer.addressLine1 || "Address not added",
    addressLine2: customer.addressLine2,
    city: customer.city || "City not added",
    state: customer.state || "State not added",
    postalCode: customer.postalCode || "Postal code not added",
    country: customer.country,
    isDefault: true,
    updatedAt: null,
  };
}

function describeOrderCadence(totalOrders, createdAt) {
  if (!totalOrders) {
    return "No purchase yet";
  }

  const joinedMs = createdAt ? new Date(createdAt).getTime() : Date.now();
  const ageInDays = Math.max(Math.ceil((Date.now() - joinedMs) / 86400000), 1);

  if (totalOrders >= 6) {
    return "High repeat buyer";
  }

  if (totalOrders >= 3 || ageInDays <= 45) {
    return "Growing repeat behaviour";
  }

  return "Early relationship";
}

function formatCoordinates(latitude, longitude) {
  if (latitude == null || longitude == null) {
    return "Not captured";
  }

  return `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`;
}

function formatAuthProvider(value) {
  switch (String(value ?? "").toUpperCase()) {
    case "LOCAL":
      return "Email login";
    case "GOOGLE":
      return "Google";
    case "PHONE":
      return "Phone OTP";
    default:
      return value ? titleCase(value) : "Unknown";
  }
}

function paymentStatusClassName(value) {
  switch (String(value ?? "").toUpperCase()) {
    case "PAID":
      return "bg-[#e7f7ea] text-success";
    case "FAILED":
      return "bg-[#fdeaea] text-danger";
    case "PENDING":
    case "COD_PENDING":
      return "bg-[#fff3dd] text-[#986700]";
    default:
      return "bg-[#fbf7f0] text-brand-dark";
  }
}

export default CustomerDetail;
