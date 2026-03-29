package com.candleora.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "aura_chat_events")
public class AuraChatEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private AppUser user;

    @Column(length = 160)
    private String sessionScope;

    @Column(nullable = false, length = 32)
    private String channel = "web";

    @Column(nullable = false, length = 64)
    private String eventType;

    @Column(length = 255)
    private String pagePath;

    @Column(length = 160)
    private String intent;

    @Lob
    @Column
    private String customerMessage;

    @Lob
    @Column
    private String assistantMessage;

    @Column(length = 32)
    private String responseType;

    @Column(nullable = false)
    private boolean resolved;

    @Column(nullable = false)
    private boolean usedOpenAi;

    @Column(nullable = false)
    private boolean usedTrainingOverride;

    @Lob
    @Column
    private String metadataJson;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public AppUser getUser() {
        return user;
    }

    public void setUser(AppUser user) {
        this.user = user;
    }

    public String getSessionScope() {
        return sessionScope;
    }

    public void setSessionScope(String sessionScope) {
        this.sessionScope = sessionScope;
    }

    public String getChannel() {
        return channel;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getPagePath() {
        return pagePath;
    }

    public void setPagePath(String pagePath) {
        this.pagePath = pagePath;
    }

    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }

    public String getCustomerMessage() {
        return customerMessage;
    }

    public void setCustomerMessage(String customerMessage) {
        this.customerMessage = customerMessage;
    }

    public String getAssistantMessage() {
        return assistantMessage;
    }

    public void setAssistantMessage(String assistantMessage) {
        this.assistantMessage = assistantMessage;
    }

    public String getResponseType() {
        return responseType;
    }

    public void setResponseType(String responseType) {
        this.responseType = responseType;
    }

    public boolean isResolved() {
        return resolved;
    }

    public void setResolved(boolean resolved) {
        this.resolved = resolved;
    }

    public boolean isUsedOpenAi() {
        return usedOpenAi;
    }

    public void setUsedOpenAi(boolean usedOpenAi) {
        this.usedOpenAi = usedOpenAi;
    }

    public boolean isUsedTrainingOverride() {
        return usedTrainingOverride;
    }

    public void setUsedTrainingOverride(boolean usedTrainingOverride) {
        this.usedTrainingOverride = usedTrainingOverride;
    }

    public String getMetadataJson() {
        return metadataJson;
    }

    public void setMetadataJson(String metadataJson) {
        this.metadataJson = metadataJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
