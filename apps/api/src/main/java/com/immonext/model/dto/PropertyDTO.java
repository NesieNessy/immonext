package com.immonext.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class PropertyDTO {

    @NotBlank(message = "Address is required")
    public String address;

    @NotBlank(message = "Property type is required")
    public String propertyType;

    @NotBlank(message = "Tenancy type is required")
    public String tenancyType;

    @NotNull(message = "Purchase price is required")
    @Positive(message = "Purchase price must be positive")
    public Double purchasePrice;

    @Positive(message = "Living space must be positive")
    public Double livingSpace;

    public Integer yearBuilt;
}
