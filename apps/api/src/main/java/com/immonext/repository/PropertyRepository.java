package com.immonext.repository;

import com.immonext.model.entity.Property;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.UUID;

@ApplicationScoped
public class PropertyRepository implements PanacheRepositoryBase<Property, UUID> {

    public Property findByAddress(String address) {
        return find("address", address).firstResult();
    }
}
