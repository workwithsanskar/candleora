import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "../components/ChartCard";
import DataTable from "../components/DataTable";
import FiltersBar from "../components/FiltersBar";
import KPICard from "../components/KPICard";
import adminApi from "../services/adminApi";
import { PRIMARY_BUTTON_CLASS, resolveQuickRange, statusClassName } from "../helpers";
import { formatAdminStatus } from "../helpers";
import { formatCurrency, formatDate } from "../../utils/format";

const quickRanges = [
  { label: "Last 7 Days", value: "LAST_7_DAYS" },
  { label: "Last 30 Days", value: "LAST_30_DAYS" },
  { label: "Last 90 Days", value: "LAST_90_DAYS" },
];

function Dashboard() {
  const [period, setPeriod] = useState("LAST_30_DAYS");
  const range = useMemo(() => resolveQuickRange(period), [period]);

  const overviewQuery = useQuery({
    queryKey: ["admin", "overview", range.startDate, range.endDate],
    queryFn: () => adminApi.getDashboardOverview(range),
  });

  const recentOrdersQuery = useQuery({
    queryKey: ["admin", "orders", "recent"],
    queryFn: () => adminApi.getOrders({ page: 0, size: 5 }),
  });

  const metrics = overviewQuery.data?.metrics;
  const salesTrend = overviewQuery.data?.salesTrend ?? [];
  const topProducts = overviewQuery.data?.topProducts ?? [];
  const recentOrders = recentOrdersQuery.data?.content ?? [];

  const columns = useMemo(
    () => [
      {
        key: "id",
        header: "Order",
        cell: (order) => (
          <div>
            <p className="font-medium text-brand-dark">#{order.id}</p>
            <p className="mt-1 text-xs text-brand-muted">{order.customerEmail}</p>
          </div>
        ),
      },
      {
        key: "customerName",
        header: "Customer",
        cell: (order) => (
          <div>
            <p className="font-medium text-brand-dark">{order.customerName}</p>
            <p className="mt-1 text-xs text-brand-muted">{formatDate(order.createdAt)}</p>
          </div>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        cell: (order) => formatCurrency(order.amount),
      },
      {
        key: "status",
        header: "Status",
        cell: (order) => (
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(order.status)}`}>
            {formatAdminStatus(order.status)}
          </span>
        ),
      },
    ],
    [],
  );

  if (overviewQuery.isError) {
    return (
      <div className="rounded-[28px] border border-danger/20 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl font-semibold text-brand-dark">Dashboard unavailable</h2>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          CandleOra could not load the admin overview right now. Try again after the backend is running.
        </p>
        <button type="button" className={`mt-4 ${PRIMARY_BUTTON_CLASS}`} onClick={() => overviewQuery.refetch()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FiltersBar
        title="Business snapshot"
        description="A live operational view of revenue, orders, customer activity, and the products driving CandleOra this week."
        actions={
          quickRanges.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                period === option.value ? "bg-[#17120f] text-white" : "border border-black/10 bg-white text-brand-dark hover:border-black/20"
              }`}
              onClick={() => setPeriod(option.value)}
            >
              {option.label}
            </button>
          ))
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPICard
          title="Revenue"
          value={formatCurrency(metrics?.totalRevenue)}
          helper="Booked revenue in range"
          change={metrics ? `${Number(metrics.revenueGrowth ?? 0).toFixed(1)}%` : ""}
          isLoading={overviewQuery.isLoading}
        />
        <KPICard
          title="Orders"
          value={String(metrics?.totalOrders ?? "0")}
          helper="Completed and in-flight orders"
          isLoading={overviewQuery.isLoading}
        />
        <KPICard
          title="Customers"
          value={String(metrics?.totalCustomers ?? "0")}
          helper="Registered customer accounts"
          isLoading={overviewQuery.isLoading}
        />
        <KPICard
          title="Profit"
          value={formatCurrency(metrics?.totalProfit)}
          helper={`Margin ${Number(metrics?.profitMargin ?? 0).toFixed(1)}%`}
          isLoading={overviewQuery.isLoading}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <ChartCard title="Sales trend" subtitle="Daily revenue and order flow across the selected window." isLoading={overviewQuery.isLoading}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={salesTrend}>
              <CartesianGrid stroke="#e7dfd0" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `₹${Number(value) / 1000}k`} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value, name) =>
                  name === "orders" ? [value, "Orders"] : [formatCurrency(value), "Revenue"]
                }
              />
              <Line type="monotone" dataKey="revenue" stroke="#17120f" strokeWidth={2.6} dot={false} />
              <Line type="monotone" dataKey="orders" stroke="#f3b33d" strokeWidth={2.6} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top products" subtitle="Best performing candles and accessories by units sold." isLoading={overviewQuery.isLoading}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topProducts.slice(0, 5)}>
              <CartesianGrid stroke="#efe7d9" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value, name) => (name === "revenue" ? [formatCurrency(value), "Revenue"] : [value, "Units Sold"])} />
              <Bar dataKey="unitsSold" fill="#f3b33d" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <DataTable
        columns={columns}
        rows={recentOrders}
        isLoading={recentOrdersQuery.isLoading}
        emptyTitle="No recent orders"
        emptyDescription="Orders will start appearing here once customers complete checkout."
      />
    </div>
  );
}

export default Dashboard;
