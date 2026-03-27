import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import DataTable from "../components/DataTable";
import FiltersBar from "../components/FiltersBar";
import Pagination from "../components/Pagination";
import adminApi from "../services/adminApi";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { FILTER_FIELD_CLASS, FILTER_LABEL_CLASS } from "../helpers";
import { formatCurrency, formatDate } from "../../utils/format";

function Customers() {
  const { search } = useOutletContext();
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const customersQuery = useQuery({
    queryKey: ["admin", "customers", debouncedSearch, page],
    queryFn: () => adminApi.getCustomers({ search: debouncedSearch, page, size: 10 }),
  });

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Customer",
        cell: (customer) => (
          <div>
            <p className="font-medium text-brand-dark">{customer.name}</p>
            <p className="mt-1 text-xs text-brand-muted">{customer.email}</p>
          </div>
        ),
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
        header: "Lifetime value",
        cell: (customer) => formatCurrency(customer.totalSpent),
      },
      {
        key: "lastOrderAt",
        header: "Last order",
        cell: (customer) => (customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "No orders yet"),
      },
      {
        key: "createdAt",
        header: "Joined",
        cell: (customer) => formatDate(customer.createdAt),
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
        title="Customer insights"
        description="Track buyer activity, lifetime value, and repeat purchase behavior from a single operating view."
      >
        <div className="flex flex-col gap-2">
          <label className={FILTER_LABEL_CLASS}>Global search</label>
          <div className={`${FILTER_FIELD_CLASS} flex items-center`}>
            {debouncedSearch ? debouncedSearch : "Use the topbar search to filter by name, email, or phone"}
          </div>
        </div>
      </FiltersBar>

      <DataTable
        columns={columns}
        rows={customersQuery.data?.content ?? []}
        isLoading={customersQuery.isLoading}
        emptyTitle="No customers found"
        emptyDescription="Try widening the search or wait for more customer accounts to be created."
      />

      <Pagination
        page={customersQuery.data?.page ?? 0}
        totalPages={customersQuery.data?.totalPages ?? 0}
        onPageChange={setPage}
      />
    </div>
  );
}

export default Customers;
