import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useOutletContext } from "react-router-dom";
import AdminSelect from "../components/AdminSelect";
import DataTable from "../components/DataTable";
import FiltersBar from "../components/FiltersBar";
import Pagination from "../components/Pagination";
import adminApi from "../services/adminApi";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { FILTER_FIELD_CLASS } from "../helpers";
import { formatCurrency, formatDate } from "../../utils/format";

const CUSTOMER_TYPE_OPTIONS = [
  { value: "ALL", label: "Customer Type" },
  { value: "NEW", label: "New Customer" },
  { value: "RETURNING", label: "Returning" },
  { value: "LOYAL", label: "Loyal" },
];

const ORDER_COUNT_OPTIONS = [
  { value: "ALL", label: "Orders Count" },
  { value: "NO_ORDERS", label: "No Orders" },
  { value: "ONE_TO_THREE", label: "1 to 3 Orders" },
  { value: "FOUR_PLUS", label: "4+ Orders" },
];

const LAST_ORDER_OPTIONS = [
  { value: "ALL", label: "Last Order" },
  { value: "LAST_30_DAYS", label: "Last 30 Days" },
  { value: "LAST_90_DAYS", label: "Last 90 Days" },
  { value: "NO_ORDERS", label: "No Orders Yet" },
];

function Customers() {
  const { search, setSearch } = useOutletContext();
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(0);
  const [customerType, setCustomerType] = useState("ALL");
  const [orderCount, setOrderCount] = useState("ALL");
  const [lastOrder, setLastOrder] = useState("ALL");

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, customerType, orderCount, lastOrder]);

  const customersQuery = useQuery({
    queryKey: ["admin", "customers", debouncedSearch, page],
    queryFn: () => adminApi.getCustomers({ search: debouncedSearch, page, size: 10 }),
  });

  const filteredRows = useMemo(() => {
    const rows = Array.isArray(customersQuery.data?.content) ? customersQuery.data.content : [];

    return rows.filter((customer) => {
      if (customerType !== "ALL" && resolveCustomerType(customer) !== customerType) {
        return false;
      }

      if (orderCount !== "ALL" && !matchesOrderCount(customer.totalOrders, orderCount)) {
        return false;
      }

      if (lastOrder !== "ALL" && !matchesLastOrder(customer.lastOrderAt, lastOrder)) {
        return false;
      }

      return true;
    });
  }, [customerType, customersQuery.data?.content, lastOrder, orderCount]);

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Customer",
        cell: (customer) => (
          <Link
            to={`/admin/customers/${customer.id}`}
            className="font-medium text-brand-dark transition hover:text-black"
          >
            {customer.name}
          </Link>
        ),
      },
      {
        key: "email",
        header: "Email",
        cell: (customer) => <span className="text-brand-muted">{customer.email}</span>,
      },
      {
        key: "phoneNumber",
        header: "Phone",
        cell: (customer) => customer.phoneNumber || "Not added",
      },
      {
        key: "totalOrders",
        header: "Orders",
      },
      {
        key: "totalSpent",
        header: "Total Spent",
        cell: (customer) => formatCurrency(customer.totalSpent),
      },
      {
        key: "lastOrderAt",
        header: "Last Order",
        cell: (customer) => (customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "No orders yet"),
      },
      {
        key: "createdAt",
        header: "Joined",
        cell: (customer) => formatDate(customer.createdAt),
      },
      {
        key: "actions",
        header: "Actions",
        cell: (customer) => (
          <div>
            <Link
              to={`/admin/customers/${customer.id}`}
              className="text-sm font-medium text-brand-dark transition hover:underline hover:underline-offset-4"
            >
              View Profile
            </Link>
          </div>
        ),
      },
    ],
    [],
  );

  if (customersQuery.isError) {
    return (
      <div className="rounded-[28px] border border-danger/20 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl font-semibold text-brand-dark">Customers unavailable</h2>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          CandleOra could not load customer summaries right now. Try again once the admin API is reachable.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FiltersBar
        title="Customer Insights"
        description="View customer activity and orders in one place."
      >
        <div className="min-w-[280px] flex-1 lg:min-w-[320px]">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={`${FILTER_FIELD_CLASS} w-full`}
            placeholder="Search customers by name, email, or phone"
          />
        </div>

        <div className="w-full min-w-[180px] md:max-w-[200px]">
          <AdminSelect
            value={customerType}
            onChange={setCustomerType}
            options={CUSTOMER_TYPE_OPTIONS}
            placeholder="Customer Type"
          />
        </div>

        <div className="w-full min-w-[180px] md:max-w-[200px]">
          <AdminSelect
            value={orderCount}
            onChange={setOrderCount}
            options={ORDER_COUNT_OPTIONS}
            placeholder="Orders Count"
          />
        </div>

        <div className="w-full min-w-[180px] md:max-w-[200px]">
          <AdminSelect
            value={lastOrder}
            onChange={setLastOrder}
            options={LAST_ORDER_OPTIONS}
            placeholder="Last Order"
          />
        </div>
      </FiltersBar>

      <DataTable
        columns={columns}
        rows={filteredRows}
        isLoading={customersQuery.isLoading}
        emptyTitle="No customers found"
        emptyDescription="Try a different search term or filter."
      />

      <Pagination
        page={customersQuery.data?.page ?? 0}
        totalPages={customersQuery.data?.totalPages ?? 0}
        onPageChange={setPage}
      />
    </div>
  );
}

function resolveCustomerType(customer) {
  const totalOrders = Number(customer?.totalOrders ?? 0);
  const totalSpent = Number(customer?.totalSpent ?? 0);

  if (totalOrders >= 4 || totalSpent >= 5000) {
    return "LOYAL";
  }

  if (totalOrders >= 2) {
    return "RETURNING";
  }

  return "NEW";
}

function matchesOrderCount(totalOrders, filter) {
  const count = Number(totalOrders ?? 0);

  if (filter === "NO_ORDERS") {
    return count === 0;
  }

  if (filter === "ONE_TO_THREE") {
    return count >= 1 && count <= 3;
  }

  if (filter === "FOUR_PLUS") {
    return count >= 4;
  }

  return true;
}

function matchesLastOrder(lastOrderAt, filter) {
  if (filter === "NO_ORDERS") {
    return !lastOrderAt;
  }

  if (!lastOrderAt) {
    return false;
  }

  const orderTime = new Date(lastOrderAt).getTime();
  if (!Number.isFinite(orderTime)) {
    return false;
  }

  const now = Date.now();
  const days = (now - orderTime) / 86400000;

  if (filter === "LAST_30_DAYS") {
    return days <= 30;
  }

  if (filter === "LAST_90_DAYS") {
    return days <= 90;
  }

  return true;
}

export default Customers;
