package com.immonext.resource;

import com.immonext.model.dto.PropertyDTO;
import com.immonext.model.entity.Property;
import com.immonext.service.PropertyService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;
import java.util.UUID;

@Path("/api/properties")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Properties", description = "Property management endpoints")
public class PropertyResource {

    @Inject
    PropertyService propertyService;

    @GET
    @Operation(summary = "Get all properties", description = "Returns a list of all properties")
    public List<Property> getAllProperties() {
        return propertyService.getAllProperties();
    }

    @GET
    @Path("/{id}")
    @Operation(summary = "Get property by ID", description = "Returns a single property by its ID")
    public Response getPropertyById(@PathParam("id") UUID id) {
        Property property = propertyService.getPropertyById(id);
        if (property == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(property).build();
    }

    @POST
    @Operation(summary = "Create property", description = "Creates a new property")
    public Response createProperty(@Valid PropertyDTO dto) {
        Property property = propertyService.createProperty(dto);
        return Response.status(Response.Status.CREATED).entity(property).build();
    }

    @PUT
    @Path("/{id}")
    @Operation(summary = "Update property", description = "Updates an existing property")
    public Response updateProperty(@PathParam("id") UUID id, @Valid PropertyDTO dto) {
        Property property = propertyService.updateProperty(id, dto);
        if (property == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(property).build();
    }

    @DELETE
    @Path("/{id}")
    @Operation(summary = "Delete property", description = "Deletes a property by ID")
    public Response deleteProperty(@PathParam("id") UUID id) {
        boolean deleted = propertyService.deleteProperty(id);
        if (!deleted) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.noContent().build();
    }
}
