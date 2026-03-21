package com.candleora.service;

import com.candleora.dto.order.OrderItemResponse;
import com.candleora.dto.order.OrderRequestItem;
import com.candleora.dto.order.OrderResponse;
import com.candleora.dto.order.PlaceOrderRequest;
import com.candleora.entity.AppUser;
import com.candleora.entity.CartItem;
import com.candleora.entity.CustomerOrder;
import com.candleora.entity.OrderItem;
import com.candleora.entity.Product;
import com.candleora.repository.CartItemRepository;
import com.candleora.repository.CustomerOrderRepository;
import com.candleora.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class OrderService {

    private final CustomerOrderRepository customerOrderRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public OrderService(
        CustomerOrderRepository customerOrderRepository,
        CartItemRepository cartItemRepository,
        ProductRepository productRepository
    ) {
        this.customerOrderRepository = customerOrderRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
    }

    public OrderResponse placeOrder(AppUser user, PlaceOrderRequest request) {
        List<CartItem> cartItems = cartItemRepository.findByUserOrderByIdAsc(user);

        if (cartItems.isEmpty() && (request.items() == null || request.items().isEmpty())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }

        CustomerOrder order = new CustomerOrder();
        order.setUser(user);
        order.setShippingName(request.shippingName());
        order.setPhone(request.phone());
        order.setAddressLine1(request.addressLine1());
        order.setAddressLine2(request.addressLine2());
        order.setCity(request.city());
        order.setState(request.state());
        order.setPostalCode(request.postalCode());
        order.setPaymentMethod(request.paymentMethod());

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        if (!cartItems.isEmpty()) {
            for (CartItem cartItem : cartItems) {
                OrderItem item = createOrderItem(cartItem.getProduct(), cartItem.getQuantity());
                item.setOrder(order);
                orderItems.add(item);
                totalAmount = totalAmount.add(
                    cartItem.getProduct().getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity()))
                );
            }
        } else {
            for (OrderRequestItem requestItem : request.items()) {
                Product product = productRepository.findById(requestItem.productId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
                OrderItem item = createOrderItem(product, requestItem.quantity());
                item.setOrder(order);
                orderItems.add(item);
                totalAmount = totalAmount.add(
                    product.getPrice().multiply(BigDecimal.valueOf(requestItem.quantity()))
                );
            }
        }

        order.setItems(orderItems);
        order.setTotalAmount(totalAmount);
        CustomerOrder savedOrder = customerOrderRepository.save(order);
        if (!cartItems.isEmpty()) {
            cartItemRepository.deleteByUser(user);
        }

        return toOrderResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrders(AppUser user) {
        return customerOrderRepository.findByUserOrderByCreatedAtDesc(user)
            .stream()
            .map(this::toOrderResponse)
            .toList();
    }

    private OrderItem createOrderItem(Product product, Integer quantity) {
        OrderItem item = new OrderItem();
        item.setProductId(product.getId());
        item.setProductName(product.getName());
        item.setImageUrl(product.getImageUrls().isEmpty() ? "" : product.getImageUrls().get(0));
        item.setQuantity(quantity);
        item.setPrice(product.getPrice());
        return item;
    }

    private OrderResponse toOrderResponse(CustomerOrder order) {
        return new OrderResponse(
            order.getId(),
            order.getStatus().name(),
            order.getTotalAmount(),
            order.getCreatedAt(),
            order.getItems().stream()
                .map(item -> new OrderItemResponse(
                    item.getId(),
                    item.getProductId(),
                    item.getProductName(),
                    item.getImageUrl(),
                    item.getQuantity(),
                    item.getPrice()
                ))
                .toList()
        );
    }
}
