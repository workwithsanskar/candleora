package com.candleora.dto.chat;

import java.math.BigDecimal;
import java.util.List;

public record AuraChatContext(
    String pagePath,
    Boolean authenticated,
    String customerName,
    List<AuraChatCartItem> cartItems,
    List<AuraChatWishlistItem> wishlistItems,
    BigDecimal cartTotal,
    String chatScope
) {
}
