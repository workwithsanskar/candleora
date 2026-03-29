package com.candleora.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "aura_training_items")
public class AuraTrainingItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Lob
    @Column(nullable = false)
    private String question;

    @Column(nullable = false, length = 512)
    private String normalizedQuestion;

    @Column(length = 160)
    private String detectedIntent;

    @Column(length = 255)
    private String pagePath;

    @Lob
    @Column
    private String lastAssistantMessage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private AuraTrainingStatus status = AuraTrainingStatus.OPEN;

    @Column(nullable = false)
    private Integer occurrences = 1;

    @Lob
    @Column
    private String suggestedAnswer;

    @Column(length = 2000)
    private String resolutionNotes;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public String getNormalizedQuestion() {
        return normalizedQuestion;
    }

    public void setNormalizedQuestion(String normalizedQuestion) {
        this.normalizedQuestion = normalizedQuestion;
    }

    public String getDetectedIntent() {
        return detectedIntent;
    }

    public void setDetectedIntent(String detectedIntent) {
        this.detectedIntent = detectedIntent;
    }

    public String getPagePath() {
        return pagePath;
    }

    public void setPagePath(String pagePath) {
        this.pagePath = pagePath;
    }

    public String getLastAssistantMessage() {
        return lastAssistantMessage;
    }

    public void setLastAssistantMessage(String lastAssistantMessage) {
        this.lastAssistantMessage = lastAssistantMessage;
    }

    public AuraTrainingStatus getStatus() {
        return status;
    }

    public void setStatus(AuraTrainingStatus status) {
        this.status = status;
    }

    public Integer getOccurrences() {
        return occurrences;
    }

    public void setOccurrences(Integer occurrences) {
        this.occurrences = occurrences;
    }

    public void incrementOccurrences() {
        occurrences = occurrences == null ? 1 : occurrences + 1;
    }

    public String getSuggestedAnswer() {
        return suggestedAnswer;
    }

    public void setSuggestedAnswer(String suggestedAnswer) {
        this.suggestedAnswer = suggestedAnswer;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
