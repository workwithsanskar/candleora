package com.candleora.service;

import com.candleora.dto.admin.AdminCustomerSummaryResponse;
import com.candleora.dto.common.PagedResponse;
import com.candleora.entity.AppUser;
import com.candleora.entity.CustomerOrder;
import com.candleora.entity.Role;
import com.candleora.repository.AppUserRepository;
import com.candleora.repository.CustomerOrderRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@Transactional(readOnly = true)
public class AdminCustomerService {

    private static final int MAX_PAGE_SIZE = 50;

    private final AppUserRepository appUserRepository;
    private final CustomerOrderRepository customerOrderRepository;

    public AdminCustomerService(
        AppUserRepository appUserRepository,
        CustomerOrderRepository customerOrderRepository
    ) {
        this.appUserRepository = appUserRepository;
        this.customerOrderRepository = customerOrderRepository;
    }

    public PagedResponse<AdminCustomerSummaryResponse> getCustomers(String search, int page, int size) {
        Specification<AppUser> specification = (root, query, criteriaBuilder) ->
            criteriaBuilder.equal(root.get("role"), Role.USER);

        if (StringUtils.hasText(search)) {
            String keyword = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, query, criteriaBuilder) ->
                criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), keyword),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), keyword),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("phoneNumber")), keyword)
                )
            );
        }

        Page<AppUser> users = appUserRepository.findAll(
            specification,
            PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by(Sort.Order.desc("createdAt"))
            )
        );

        List<AppUser> content = users.getContent();
        Map<Long, List<CustomerOrder>> ordersByUser = content.isEmpty()
            ? Map.of()
            : customerOrderRepository.findByUserIn(content).stream()
                .collect(Collectors.groupingBy(order -> order.getUser().getId()));

        List<AdminCustomerSummaryResponse> summaries = content.stream()
            .map(user -> toSummary(user, ordersByUser.getOrDefault(user.getId(), List.of())))
            .toList();

        return PagedResponse.from(new PageImpl<>(summaries, users.getPageable(), users.getTotalElements()));
    }

    private AdminCustomerSummaryResponse toSummary(AppUser user, List<CustomerOrder> orders) {
        BigDecimal totalSpent = orders.stream()
            .filter(order -> order.getStatus() != com.candleora.entity.OrderStatus.CANCELLED)
            .map(CustomerOrder::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        long totalOrders = orders.stream()
            .filter(order -> order.getStatus() != com.candleora.entity.OrderStatus.CANCELLED)
            .count();
        BigDecimal averageOrderValue = totalOrders == 0
            ? BigDecimal.ZERO
            : totalSpent.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP);
        Instant lastOrderAt = orders.stream()
            .map(CustomerOrder::getCreatedAt)
            .max(Instant::compareTo)
            .orElse(null);

        return new AdminCustomerSummaryResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getPhoneNumber(),
            totalOrders,
            totalSpent,
            averageOrderValue,
            lastOrderAt,
            user.getCreatedAt()
        );
    }
}
