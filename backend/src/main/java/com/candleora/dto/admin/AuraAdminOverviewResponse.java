package com.candleora.dto.admin;

import java.math.BigDecimal;
import java.util.List;

public record AuraAdminOverviewResponse(
    long totalConversations,
    long aiPolishedReplies,
    long trainedReplyHits,
    long unresolvedReplies,
    long suggestionClicks,
    long productAddToCartActions,
    long openTrainingItems,
    BigDecimal resolutionRate,
    List<AdminDistributionItemResponse> topIntents,
    List<AdminDistributionItemResponse> eventMix,
    List<AuraAdminTrendPointResponse> trend
) {
}
