package com.immonext.model.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "properties")
public class Property extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @Column(nullable = false)
    public String address;

    @Column(name = "property_type")
    public String propertyType;

    @Column(name = "tenancy_type")
    public String tenancyType;

    @Column(name = "purchase_price")
    public Double purchasePrice;

    @Column(name = "living_space")
    public Double livingSpace;

    @Column(name = "year_built")
    public Integer yearBuilt;

    @Column(name = "created_at", nullable = false, updatable = false)
    public LocalDateTime createdAt;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
