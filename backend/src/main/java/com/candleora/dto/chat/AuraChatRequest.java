package com.candleora.dto.chat;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record AuraChatRequest(
    @NotBlank String message,
    @Valid List<AuraChatMessage> history,
    @Valid AuraChatContext context
) {
}
