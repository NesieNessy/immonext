package com.immonext.service;

import com.immonext.model.dto.PropertyDTO;
import com.immonext.model.entity.Property;
import com.immonext.repository.PropertyRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class PropertyService {

    @Inject
    PropertyRepository propertyRepository;

    public List<Property> getAllProperties() {
        return propertyRepository.listAll();
    }

    public Property getPropertyById(UUID id) {
        return propertyRepository.findById(id);
    }

    @Transactional
    public Property createProperty(PropertyDTO dto) {
        Property property = new Property();
        property.address = dto.address;
        property.propertyType = dto.propertyType;
        property.tenancyType = dto.tenancyType;
        property.purchasePrice = dto.purchasePrice;
        property.livingSpace = dto.livingSpace;
        property.yearBuilt = dto.yearBuilt;
        
        propertyRepository.persist(property);
        return property;
    }

    @Transactional
    public Property updateProperty(UUID id, PropertyDTO dto) {
        Property property = propertyRepository.findById(id);
        if (property == null) {
            return null;
        }

        property.address = dto.address;
        property.propertyType = dto.propertyType;
        property.tenancyType = dto.tenancyType;
        property.purchasePrice = dto.purchasePrice;
        property.livingSpace = dto.livingSpace;
        property.yearBuilt = dto.yearBuilt;

        return property;
    }

    @Transactional
    public boolean deleteProperty(UUID id) {
        return propertyRepository.deleteById(id);
    }
}
