import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
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
import AdminDatePicker from "../components/AdminDatePicker";
import FiltersBar from "../components/FiltersBar";
import KPICard from "../components/KPICard";
import adminApi from "../services/adminApi";
import { FILTER_LABEL_CLASS, formatCurrencyAxisTick, resolveQuickRange } from "../helpers";
import { formatApiError, formatCurrency, formatDateTime } from "../../utils/format";

const quickRanges = [
  { label: "Last 7 Days", value: "LAST_7_DAYS" },
  { label: "Last 30 Days", value: "LAST_30_DAYS" },
  { label: "Last 90 Days", value: "LAST_90_DAYS" },
];

const segmentColors = ["#17120f", "#f3b33d", "#9b7850", "#d5c2a5"];

function Analytics() {
  const initialRange = resolveQuickRange("LAST_30_DAYS");
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState("LAST_30_DAYS");
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [trainingDrafts, setTrainingDrafts] = useState({});
  const [trainingNotes, setTrainingNotes] = useState({});

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

  const auraOverviewQuery = useQuery({
    queryKey: ["admin", "aura", "overview", startDate, endDate],
    queryFn: () => adminApi.getAuraOverview(filters),
  });

  const auraTrainingQuery = useQuery({
    queryKey: ["admin", "aura", "training", "OPEN"],
    queryFn: () => adminApi.getAuraTrainingQueue({ status: "OPEN", limit: 6 }),
  });

  const updateAuraTrainingMutation = useMutation({
    mutationFn: ({ id, payload }) => adminApi.updateAuraTrainingItem(id, payload),
    onSuccess: async () => {
      toast.success("Aura training item updated.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "aura", "overview"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "aura", "training"] }),
      ]);
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  const metrics = revenueQuery.data;
  const customerInsights = customersQuery.data;
  const auraOverview = auraOverviewQuery.data;
  const auraTrainingItems = auraTrainingQuery.data ?? [];

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
          <AdminDatePicker value={startDate} onChange={setStartDate} maxDate={endDate} />
        </div>
        <div className="flex flex-col gap-2">
          <label className={FILTER_LABEL_CLASS}>End date</label>
          <AdminDatePicker value={endDate} onChange={setEndDate} minDate={startDate} />
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
              <YAxis tickFormatter={formatCurrencyAxisTick} tick={{ fontSize: 12 }} />
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
              <YAxis tickFormatter={formatCurrencyAxisTick} tick={{ fontSize: 12 }} />
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
              <YAxis tickFormatter={formatCurrencyAxisTick} tick={{ fontSize: 12 }} />
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

      <FiltersBar
        title="Aura intelligence"
        description="See what Aura is answering, where it struggles, and which weak replies need training attention."
      />

      {auraOverviewQuery.isError ? (
        <div className="rounded-[28px] border border-danger/20 bg-white p-6 shadow-sm">
          <h3 className="font-display text-2xl font-semibold text-brand-dark">Aura analytics unavailable</h3>
          <p className="mt-2 text-sm leading-6 text-brand-muted">
            Aura event logging or training endpoints did not respond. Verify the new Aura analytics API and refresh this page.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KPICard
              title="Aura chats"
              value={String(auraOverview?.totalConversations ?? "0")}
              helper="Tracked Aura conversations in the selected range"
              isLoading={auraOverviewQuery.isLoading}
            />
            <KPICard
              title="Resolved"
              value={`${Number(auraOverview?.resolutionRate ?? 0).toFixed(1)}%`}
              helper="Replies that did not fall into the review queue"
              isLoading={auraOverviewQuery.isLoading}
            />
            <KPICard
              title="AI polish"
              value={String(auraOverview?.aiPolishedReplies ?? "0")}
              helper="Replies refined through OpenAI copy polishing"
              isLoading={auraOverviewQuery.isLoading}
            />
            <KPICard
              title="Aura add to cart"
              value={String(auraOverview?.productAddToCartActions ?? "0")}
              helper={`${auraOverview?.openTrainingItems ?? 0} open training item${Number(auraOverview?.openTrainingItems ?? 0) === 1 ? "" : "s"}`}
              isLoading={auraOverviewQuery.isLoading}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <ChartCard title="Aura trend" subtitle="Daily conversations, unresolved replies, and Aura-driven add-to-cart actions." isLoading={auraOverviewQuery.isLoading}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={auraOverview?.trend ?? []}>
                  <CartesianGrid stroke="#e7dfd0" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="conversations" stroke="#17120f" strokeWidth={2.6} dot={false} />
                  <Line type="monotone" dataKey="unresolvedReplies" stroke="#c0504d" strokeWidth={2.4} dot={false} />
                  <Line type="monotone" dataKey="addToCartActions" stroke="#9b7850" strokeWidth={2.4} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Top Aura intents" subtitle="The intent buckets Aura is seeing most often in the selected window." isLoading={auraOverviewQuery.isLoading}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={auraOverview?.topIntents ?? []}>
                  <CartesianGrid stroke="#efe7d9" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} angle={-14} textAnchor="end" height={62} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#17120f" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <ChartCard title="Aura event mix" subtitle="How people are interacting with Aura beyond simple replies." isLoading={auraOverviewQuery.isLoading}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={auraOverview?.eventMix ?? []}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={62}
                    outerRadius={98}
                    paddingAngle={4}
                  >
                    {(auraOverview?.eventMix ?? []).map((entry, index) => (
                      <Cell key={entry.label} fill={segmentColors[index % segmentColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-brand-dark">Aura training queue</h3>
                  <p className="mt-1 text-sm leading-6 text-brand-muted">
                    Review weak or unanswered prompts, then train Aura with a cleaner answer or dismiss noise.
                  </p>
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-brand-muted">
                  {auraOverview?.openTrainingItems ?? 0} open items
                </p>
              </div>

              {auraTrainingQuery.isError ? (
                <div className="mt-5 rounded-[22px] border border-danger/20 bg-[#fff7f7] p-4 text-sm text-danger">
                  Aura training items could not be loaded right now.
                </div>
              ) : auraTrainingQuery.isLoading ? (
                <div className="mt-5 space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-32 animate-pulse rounded-[22px] bg-black/6" />
                  ))}
                </div>
              ) : auraTrainingItems.length ? (
                <div className="mt-5 space-y-4">
                  {auraTrainingItems.map((item) => {
                    const answerDraft = trainingDrafts[item.id] ?? item.suggestedAnswer ?? "";
                    const notesDraft = trainingNotes[item.id] ?? item.resolutionNotes ?? "";

                    return (
                      <div key={item.id} className="rounded-[22px] border border-black/8 bg-[#fbf7f0] p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-brand-muted">
                              {item.detectedIntent || "General"} · {item.occurrences} hit{item.occurrences === 1 ? "" : "s"}
                            </p>
                            <p className="mt-2 font-medium leading-6 text-brand-dark">{item.question}</p>
                          </div>
                          <p className="text-xs text-brand-muted">{formatDateTime(item.updatedAt)}</p>
                        </div>

                        {item.lastAssistantMessage ? (
                          <div className="mt-3 rounded-[18px] border border-black/6 bg-white px-4 py-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-brand-muted">Last Aura reply</p>
                            <p className="mt-2 text-sm leading-6 text-brand-dark">{item.lastAssistantMessage}</p>
                          </div>
                        ) : null}

                        <div className="mt-4 grid gap-3">
                          <textarea
                            value={answerDraft}
                            onChange={(event) =>
                              setTrainingDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                            }
                            rows={3}
                            className="min-h-[112px] rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition focus:border-black/20"
                            placeholder="Write the answer Aura should use next time..."
                          />

                          <input
                            type="text"
                            value={notesDraft}
                            onChange={(event) =>
                              setTrainingNotes((current) => ({ ...current, [item.id]: event.target.value }))
                            }
                            className="rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition focus:border-black/20"
                            placeholder="Optional review note for your team"
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateAuraTrainingMutation.mutate({
                                id: item.id,
                                payload: {
                                  status: "TRAINED",
                                  suggestedAnswer: answerDraft,
                                  resolutionNotes: notesDraft,
                                },
                              })
                            }
                            disabled={!answerDraft.trim() || updateAuraTrainingMutation.isPending}
                            className="rounded-full bg-[#17120f] px-4 py-2 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Mark trained
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateAuraTrainingMutation.mutate({
                                id: item.id,
                                payload: {
                                  status: "DISMISSED",
                                  suggestedAnswer: "",
                                  resolutionNotes: notesDraft,
                                },
                              })
                            }
                            disabled={updateAuraTrainingMutation.isPending}
                            className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-brand-dark transition hover:border-black/20"
                          >
                            Dismiss
                          </button>
                          {item.pagePath ? (
                            <span className="inline-flex items-center rounded-full border border-black/8 px-3 py-2 text-xs uppercase tracking-[0.16em] text-brand-muted">
                              {item.pagePath}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-[22px] border border-dashed border-black/12 bg-[#fbf7f0] px-4 py-5 text-sm text-brand-muted">
                  Aura has no open training items right now.
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default Analytics;
