import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "../components/ChartCard";
import FiltersBar from "../components/FiltersBar";
import KPICard from "../components/KPICard";
import adminApi from "../services/adminApi";
import { FILTER_FIELD_CLASS, FILTER_LABEL_CLASS, resolveQuickRange } from "../helpers";
import { formatCurrency } from "../../utils/format";

const quickRanges = [
  { label: "Last 7 Days", value: "LAST_7_DAYS" },
  { label: "Last 30 Days", value: "LAST_30_DAYS" },
  { label: "Last 90 Days", value: "LAST_90_DAYS" },
];

const segmentColors = ["#17120f", "#f3b33d", "#9b7850", "#d5c2a5"];

function Analytics() {
  const initialRange = resolveQuickRange("LAST_30_DAYS");
  const [period, setPeriod] = useState("LAST_30_DAYS");
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);

  const filters = { startDate, endDate };

  const revenueQuery = useQuery({
    queryKey: ["admin", "revenue", startDate, endDate],
    queryFn: () => adminApi.getRevenueMetrics(filters),
  });

  const salesQuery = useQuery({
    queryKey: ["admin", "sales", period, startDate, endDate],
    queryFn: () => adminApi.getSalesInsights({ period, ...filters }),
  });

  const customersQuery = useQuery({
    queryKey: ["admin", "customer-insights", startDate, endDate],
    queryFn: () => adminApi.getCustomerInsights(filters),
  });

  const forecastQuery = useQuery({
    queryKey: ["admin", "forecast", 7],
    queryFn: () => adminApi.getForecast({ days: 7 }),
  });

  const metrics = revenueQuery.data;
  const customerInsights = customersQuery.data;

  if (revenueQuery.isError || salesQuery.isError || customersQuery.isError) {
    return (
      <div className="rounded-[28px] border border-danger/20 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl font-semibold text-brand-dark">Analytics unavailable</h2>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          One or more analytics endpoints failed to respond. Verify the admin analytics API and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FiltersBar
        title="Revenue intelligence"
        description="Track performance trends, customer mix, category contribution, and a short-term revenue forecast from one place."
        actions={
          quickRanges.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                period === option.value ? "bg-[#17120f] text-white" : "border border-black/10 bg-white text-brand-dark hover:border-black/20"
              }`}
              onClick={() => {
                setPeriod(option.value);
                const nextRange = resolveQuickRange(option.value);
                setStartDate(nextRange.startDate);
                setEndDate(nextRange.endDate);
              }}
            >
              {option.label}
            </button>
          ))
        }
      >
        <div className="flex flex-col gap-2">
          <label className={FILTER_LABEL_CLASS}>Start date</label>
          <input type="date" className={FILTER_FIELD_CLASS} value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label className={FILTER_LABEL_CLASS}>End date</label>
          <input type="date" className={FILTER_FIELD_CLASS} value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </div>
      </FiltersBar>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPICard title="Revenue" value={formatCurrency(metrics?.totalRevenue)} helper="Net booked revenue" isLoading={revenueQuery.isLoading} />
        <KPICard title="Orders" value={String(metrics?.totalOrders ?? "0")} helper="Tracked fulfilment orders" isLoading={revenueQuery.isLoading} />
        <KPICard title="AOV" value={formatCurrency(metrics?.averageOrderValue)} helper="Average order value" isLoading={revenueQuery.isLoading} />
        <KPICard
          title="Profit"
          value={formatCurrency(metrics?.totalProfit)}
          helper={`Margin ${Number(metrics?.profitMargin ?? 0).toFixed(1)}%`}
          isLoading={revenueQuery.isLoading}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <ChartCard title="Revenue trend" subtitle="Daily revenue, order count, and margin momentum." isLoading={salesQuery.isLoading}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesQuery.data?.trend ?? []}>
              <CartesianGrid stroke="#e7dfd0" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `₹${Number(value) / 1000}k`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value, name) => (name === "orders" ? [value, "Orders"] : [formatCurrency(value), name === "profit" ? "Profit" : "Revenue"])} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#17120f" strokeWidth={2.6} dot={false} />
              <Line type="monotone" dataKey="profit" stroke="#2E7D32" strokeWidth={2.6} dot={false} />
              <Line type="monotone" dataKey="orders" stroke="#f3b33d" strokeWidth={2.6} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Customer segments" subtitle="New versus returning buyers during the selected range." isLoading={customersQuery.isLoading}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={customerInsights?.segments ?? []}
                dataKey="value"
                nameKey="label"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={4}
              >
                {(customerInsights?.segments ?? []).map((entry, index) => (
                  <Cell key={entry.label} fill={segmentColors[index % segmentColors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <ChartCard title="Top products" subtitle="Products contributing the most unit volume across the current range." isLoading={salesQuery.isLoading}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salesQuery.data?.topProducts ?? []}>
              <CartesianGrid stroke="#efe7d9" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value, name) => (name === "revenue" ? [formatCurrency(value), "Revenue"] : [value, "Units Sold"])} />
              <Bar dataKey="unitsSold" fill="#f3b33d" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Forecast" subtitle="Seven-day forward look using a simple rolling revenue average." isLoading={forecastQuery.isLoading}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={forecastQuery.data ?? []}>
              <CartesianGrid stroke="#e7dfd0" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `₹${Number(value) / 1000}k`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [formatCurrency(value), "Forecast Revenue"]} />
              <Line type="monotone" dataKey="revenue" stroke="#9b7850" strokeWidth={2.6} dot={false} strokeDasharray="6 4" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <ChartCard title="Category revenue" subtitle="Where CandleOra revenue is concentrating across the catalog." isLoading={salesQuery.isLoading}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salesQuery.data?.revenueDistribution ?? []}>
              <CartesianGrid stroke="#efe7d9" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `₹${Number(value) / 1000}k`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [formatCurrency(value), "Revenue"]} />
              <Bar dataKey="value" fill="#17120f" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
          <div>
            <h3 className="font-display text-2xl font-semibold text-brand-dark">Top customers</h3>
            <p className="mt-1 text-sm leading-6 text-brand-muted">
              Buyers generating the highest spend in the current analytics window.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {(customerInsights?.topCustomers ?? []).map((customer) => (
              <div key={customer.id} className="rounded-[22px] border border-black/8 bg-[#fbf7f0] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-brand-dark">{customer.name}</p>
                    <p className="mt-1 text-xs text-brand-muted">{customer.email}</p>
                  </div>
                  <p className="font-medium text-brand-dark">{formatCurrency(customer.totalSpent)}</p>
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-brand-muted">
                  {customer.totalOrders} orders
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Analytics;
