package com.candleora.dto.chat;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuraChatAction(
    String type,
    String label,
    String href,
    Map<String, Object> payload
) {
    public AuraChatAction(String label, String href) {
        this(null, label, href, null);
    }

    public AuraChatAction(String type, String label, String href) {
        this(type, label, href, null);
    }
}
