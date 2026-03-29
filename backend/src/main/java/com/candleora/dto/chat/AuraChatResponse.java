package com.candleora.dto.chat;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuraChatResponse(
    String type,
    Object data,
    String message,
    List<String> suggestions,
    List<AuraChatAction> actions
) {
}
