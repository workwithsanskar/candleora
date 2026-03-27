package com.candleora.service;

import com.candleora.dto.admin.AdminCustomerInsightsResponse;
import com.candleora.dto.admin.AdminDashboardOverviewResponse;
import com.candleora.dto.admin.AdminDistributionItemResponse;
import com.candleora.dto.admin.AdminRevenueMetricsResponse;
import com.candleora.dto.admin.AdminSalesInsightsResponse;
import com.candleora.dto.admin.AdminTopCustomerResponse;
import com.candleora.dto.admin.AdminTopProductResponse;
import com.candleora.dto.admin.AdminTrendPointResponse;
import com.candleora.entity.CustomerOrder;
import com.candleora.entity.OrderItem;
import com.candleora.entity.OrderStatus;
import com.candleora.entity.Product;
import com.candleora.entity.Role;
import com.candleora.repository.AppUserRepository;
import com.candleora.repository.CustomerOrderRepository;
import com.candleora.repository.ProductRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@Transactional(readOnly = true)
public class AdminAnalyticsService {

    private static final BigDecimal DEFAULT_COST_MULTIPLIER = BigDecimal.valueOf(0.58);

    private final CustomerOrderRepository customerOrderRepository;
    private final AppUserRepository appUserRepository;
    private final ProductRepository productRepository;
    private final ZoneId zoneId = ZoneId.systemDefault();

    public AdminAnalyticsService(
        CustomerOrderRepository customerOrderRepository,
        AppUserRepository appUserRepository,
        ProductRepository productRepository
    ) {
        this.customerOrderRepository = customerOrderRepository;
        this.appUserRepository = appUserRepository;
        this.productRepository = productRepository;
    }

    @Cacheable(cacheNames = "adminAnalytics", key = "'overview:' + #startDate + ':' + #endDate")
    public AdminDashboardOverviewResponse getDashboardOverview(LocalDate startDate, LocalDate endDate) {
        DateWindow window = resolveWindow(startDate, endDate, null, 30);
        List<CustomerOrder> orders = loadOrders(window);
        AdminCustomerInsightsResponse customerInsights = buildCustomerInsights(window);

        return new AdminDashboardOverviewResponse(
            buildRevenueMetrics(window, orders),
            buildTrend(window, orders),
            buildTopProducts(orders).stream().limit(5).toList(),
            buildRevenueDistribution(orders),
            customerInsights.segments()
        );
    }

    @Cacheable(cacheNames = "adminAnalytics", key = "'revenue:' + #startDate + ':' + #endDate")
    public AdminRevenueMetricsResponse getRevenueMetrics(LocalDate startDate, LocalDate endDate) {
        DateWindow window = resolveWindow(startDate, endDate, null, 30);
        return buildRevenueMetrics(window, loadOrders(window));
    }

    @Cacheable(cacheNames = "adminAnalytics", key = "'sales:' + #period + ':' + #startDate + ':' + #endDate")
    public AdminSalesInsightsResponse getSalesInsights(String period, LocalDate startDate, LocalDate endDate) {
        DateWindow window = resolveWindow(startDate, endDate, period, 30);
        List<CustomerOrder> orders = loadOrders(window);
        return new AdminSalesInsightsResponse(
            buildTrend(window, orders),
            buildTopProducts(orders),
            buildRevenueDistribution(orders)
        );
    }

    @Cacheable(cacheNames = "adminAnalytics", key = "'customers:' + #startDate + ':' + #endDate")
    public AdminCustomerInsightsResponse getCustomerInsights(LocalDate startDate, LocalDate endDate) {
        return buildCustomerInsights(resolveWindow(startDate, endDate, null, 30));
    }

    @Cacheable(cacheNames = "adminAnalytics", key = "'forecast:' + #days")
    public List<AdminTrendPointResponse> getForecast(int days) {
        int forecastDays = Math.min(Math.max(days, 7), 30);
        DateWindow historyWindow = new DateWindow(LocalDate.now(zoneId).minusDays(29), LocalDate.now(zoneId));
        List<CustomerOrder> historyOrders = loadOrders(historyWindow);
        Map<LocalDate, BigDecimal> revenueByDay = historyOrders.stream()
            .collect(Collectors.groupingBy(
                order -> toLocalDate(order.getCreatedAt()),
                Collectors.mapping(CustomerOrder::getTotalAmount, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
            ));

        ArrayDeque<BigDecimal> rolling = new ArrayDeque<>();
        for (LocalDate date = historyWindow.start(); !date.isAfter(historyWindow.end()); date = date.plusDays(1)) {
            rolling.addLast(revenueByDay.getOrDefault(date, BigDecimal.ZERO));
            if (rolling.size() > 7) {
                rolling.removeFirst();
            }
        }

        List<AdminTrendPointResponse> forecast = new ArrayList<>();
        LocalDate cursor = historyWindow.end().plusDays(1);
        for (int index = 0; index < forecastDays; index++) {
            BigDecimal average = rolling.stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(Math.max(rolling.size(), 1)), 2, RoundingMode.HALF_UP);
            forecast.add(new AdminTrendPointResponse(cursor.toString(), average, 0, BigDecimal.ZERO));
            rolling.addLast(average);
            if (rolling.size() > 7) {
                rolling.removeFirst();
            }
            cursor = cursor.plusDays(1);
        }
        return forecast;
    }

    private AdminCustomerInsightsResponse buildCustomerInsights(DateWindow window) {
        List<CustomerOrder> allOrders = customerOrderRepository.findAll().stream()
            .filter(this::isRevenueOrder)
            .toList();

        Map<Long, List<CustomerOrder>> ordersByUser = allOrders.stream()
            .collect(Collectors.groupingBy(order -> order.getUser().getId()));

        Map<Long, List<CustomerOrder>> windowOrdersByUser = allOrders.stream()
            .filter(order -> !toLocalDate(order.getCreatedAt()).isBefore(window.start()))
            .filter(order -> !toLocalDate(order.getCreatedAt()).isAfter(window.end()))
            .collect(Collectors.groupingBy(order -> order.getUser().getId()));

        long newCustomers = 0;
        long returningCustomers = 0;
        List<AdminTopCustomerResponse> topCustomers = new ArrayList<>();

        for (Map.Entry<Long, List<CustomerOrder>> entry : windowOrdersByUser.entrySet()) {
            List<CustomerOrder> lifetimeOrders = ordersByUser.getOrDefault(entry.getKey(), List.of());
            LocalDate firstOrderDate = lifetimeOrders.stream()
                .map(CustomerOrder::getCreatedAt)
                .min(Instant::compareTo)
                .map(this::toLocalDate)
                .orElse(window.start());

            if (!firstOrderDate.isBefore(window.start())) {
                newCustomers++;
            } else {
                returningCustomers++;
            }

            BigDecimal totalSpent = entry.getValue().stream()
                .map(CustomerOrder::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            CustomerOrder referenceOrder = entry.getValue().get(0);
            topCustomers.add(new AdminTopCustomerResponse(
                entry.getKey(),
                referenceOrder.getShippingName(),
                referenceOrder.getContactEmail(),
                totalSpent,
                entry.getValue().size()
            ));
        }

        topCustomers.sort(Comparator.comparing(AdminTopCustomerResponse::totalSpent).reversed());

        long totalCustomers = appUserRepository.countByRole(Role.USER);
        return new AdminCustomerInsightsResponse(
            totalCustomers,
            newCustomers,
            returningCustomers,
            List.of(
                new AdminDistributionItemResponse("New", BigDecimal.valueOf(newCustomers)),
                new AdminDistributionItemResponse("Returning", BigDecimal.valueOf(returningCustomers))
            ),
            topCustomers.stream().limit(5).toList()
        );
    }

    private AdminRevenueMetricsResponse buildRevenueMetrics(DateWindow window, List<CustomerOrder> orders) {
        BigDecimal totalRevenue = orders.stream()
            .map(CustomerOrder::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalProfit = calculateTotalProfit(orders);
        long totalOrders = orders.size();
        long totalCustomers = appUserRepository.countByRole(Role.USER);
        long purchasingCustomers = orders.stream()
            .map(order -> order.getUser().getId())
            .filter(Objects::nonNull)
            .distinct()
            .count();

        BigDecimal averageOrderValue = totalOrders == 0
            ? BigDecimal.ZERO
            : totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP);
        BigDecimal profitMargin = percentage(totalProfit, totalRevenue);
        BigDecimal conversionRate = totalCustomers == 0
            ? BigDecimal.ZERO
            : BigDecimal.valueOf(purchasingCustomers)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(totalCustomers), 2, RoundingMode.HALF_UP);

        long periodDays = ChronoUnit.DAYS.between(window.start(), window.end()) + 1;
        DateWindow previousWindow = new DateWindow(
            window.start().minusDays(periodDays),
            window.start().minusDays(1)
        );
        BigDecimal previousRevenue = loadOrders(previousWindow).stream()
            .map(CustomerOrder::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal revenueGrowth = previousRevenue.signum() == 0
            ? (totalRevenue.signum() == 0 ? BigDecimal.ZERO : BigDecimal.valueOf(100))
            : totalRevenue.subtract(previousRevenue)
                .multiply(BigDecimal.valueOf(100))
                .divide(previousRevenue, 2, RoundingMode.HALF_UP);

        return new AdminRevenueMetricsResponse(
            totalRevenue,
            totalOrders,
            totalCustomers,
            averageOrderValue,
            totalProfit,
            profitMargin,
            conversionRate,
            revenueGrowth
        );
    }

    private List<AdminTrendPointResponse> buildTrend(DateWindow window, List<CustomerOrder> orders) {
        Map<Long, Product> productsById = loadProducts(orders);
        Map<LocalDate, DailySnapshot> snapshots = new LinkedHashMap<>();

        for (LocalDate date = window.start(); !date.isAfter(window.end()); date = date.plusDays(1)) {
            snapshots.put(date, new DailySnapshot());
        }

        for (CustomerOrder order : orders) {
            LocalDate date = toLocalDate(order.getCreatedAt());
            DailySnapshot snapshot = snapshots.computeIfAbsent(date, ignored -> new DailySnapshot());
            snapshot.revenue = snapshot.revenue.add(order.getTotalAmount());
            snapshot.orders++;
            snapshot.profit = snapshot.profit.add(profitForOrder(order, productsById));
        }

        return snapshots.entrySet().stream()
            .map(entry -> new AdminTrendPointResponse(
                entry.getKey().toString(),
                entry.getValue().revenue,
                entry.getValue().orders,
                entry.getValue().profit
            ))
            .toList();
    }

    private List<AdminTopProductResponse> buildTopProducts(List<CustomerOrder> orders) {
        Map<Long, ProductRollup> rollups = new HashMap<>();
        Map<Long, Product> productsById = loadProducts(orders);

        for (CustomerOrder order : orders) {
            for (OrderItem item : order.getItems()) {
                ProductRollup rollup = rollups.computeIfAbsent(item.getProductId(), ignored -> new ProductRollup());
                rollup.name = item.getProductName();
                Product product = productsById.get(item.getProductId());
                rollup.category = product != null ? product.getCategory().getName() : "Archived";
                rollup.stock = product != null ? product.getStock() : 0;
                rollup.visible = product != null && product.isVisible();
                rollup.unitsSold += item.getQuantity();
                rollup.revenue = rollup.revenue.add(
                    item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
                );
            }
        }

        return rollups.entrySet().stream()
            .map(entry -> new AdminTopProductResponse(
                entry.getKey(),
                entry.getValue().name,
                entry.getValue().category,
                entry.getValue().unitsSold,
                entry.getValue().revenue,
                entry.getValue().stock,
                entry.getValue().visible
            ))
            .sorted(Comparator
                .comparing(AdminTopProductResponse::unitsSold)
                .reversed()
                .thenComparing(AdminTopProductResponse::revenue, Comparator.reverseOrder()))
            .limit(8)
            .toList();
    }

    private List<AdminDistributionItemResponse> buildRevenueDistribution(List<CustomerOrder> orders) {
        Map<Long, Product> productsById = loadProducts(orders);
        Map<String, BigDecimal> revenueByCategory = new HashMap<>();

        for (CustomerOrder order : orders) {
            for (OrderItem item : order.getItems()) {
                Product product = productsById.get(item.getProductId());
                String label = product != null ? product.getCategory().getName() : "Archived";
                BigDecimal lineRevenue = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                revenueByCategory.merge(label, lineRevenue, BigDecimal::add);
            }
        }

        return revenueByCategory.entrySet().stream()
            .map(entry -> new AdminDistributionItemResponse(entry.getKey(), entry.getValue()))
            .sorted(Comparator.comparing(AdminDistributionItemResponse::value).reversed())
            .toList();
    }

    private List<CustomerOrder> loadOrders(DateWindow window) {
        Specification<CustomerOrder> specification = Specification.where(null);
        Instant startInstant = window.start().atStartOfDay(zoneId).toInstant();
        Instant endInstant = window.end().plusDays(1).atStartOfDay(zoneId).toInstant();

        specification = specification.and((root, query, criteriaBuilder) ->
            criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), startInstant)
        );
        specification = specification.and((root, query, criteriaBuilder) ->
            criteriaBuilder.lessThan(root.get("createdAt"), endInstant)
        );

        return customerOrderRepository.findAll(specification).stream()
            .filter(this::isRevenueOrder)
            .toList();
    }

    private boolean isRevenueOrder(CustomerOrder order) {
        return order.getStatus() != OrderStatus.CANCELLED && order.getStatus() != OrderStatus.PENDING_PAYMENT;
    }

    private Map<Long, Product> loadProducts(List<CustomerOrder> orders) {
        List<Long> productIds = orders.stream()
            .flatMap(order -> order.getItems().stream())
            .map(OrderItem::getProductId)
            .distinct()
            .toList();

        return productRepository.findAllById(productIds).stream()
            .collect(Collectors.toMap(Product::getId, product -> product));
    }

    private BigDecimal calculateTotalProfit(List<CustomerOrder> orders) {
        Map<Long, Product> productsById = loadProducts(orders);
        return orders.stream()
            .map(order -> profitForOrder(order, productsById))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal profitForOrder(CustomerOrder order, Map<Long, Product> productsById) {
        return order.getItems().stream()
            .map(item -> {
                Product product = productsById.get(item.getProductId());
                BigDecimal cost = product != null && product.getCostPrice() != null
                    ? product.getCostPrice()
                    : item.getPrice().multiply(DEFAULT_COST_MULTIPLIER);
                return item.getPrice()
                    .subtract(cost)
                    .multiply(BigDecimal.valueOf(item.getQuantity()));
            })
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal percentage(BigDecimal numerator, BigDecimal denominator) {
        if (denominator == null || denominator.signum() == 0) {
            return BigDecimal.ZERO;
        }

        return numerator
            .multiply(BigDecimal.valueOf(100))
            .divide(denominator, 2, RoundingMode.HALF_UP);
    }

    private LocalDate toLocalDate(Instant instant) {
        return instant.atZone(zoneId).toLocalDate();
    }

    private DateWindow resolveWindow(LocalDate startDate, LocalDate endDate, String period, int defaultDays) {
        if (startDate != null && endDate != null && !endDate.isBefore(startDate)) {
            return new DateWindow(startDate, endDate);
        }

        LocalDate end = LocalDate.now(zoneId);
        int days = switch (StringUtils.hasText(period) ? period.trim().toUpperCase(Locale.ROOT) : "") {
            case "LAST_7_DAYS" -> 7;
            case "LAST_90_DAYS" -> 90;
            default -> defaultDays;
        };
        return new DateWindow(end.minusDays(days - 1L), end);
    }

    private record DateWindow(LocalDate start, LocalDate end) {
    }

    private static final class DailySnapshot {
        private BigDecimal revenue = BigDecimal.ZERO;
        private BigDecimal profit = BigDecimal.ZERO;
        private long orders;
    }

    private static final class ProductRollup {
        private String name;
        private String category;
        private long unitsSold;
        private BigDecimal revenue = BigDecimal.ZERO;
        private Integer stock = 0;
        private boolean visible;
    }
}
