package com.candleora.controller;

import com.candleora.dto.address.AddressRequest;
import com.candleora.dto.address.AddressResponse;
import com.candleora.entity.AppUser;
import com.candleora.security.UserPrincipal;
import com.candleora.service.AddressService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping
    public List<AddressResponse> getAddresses(Authentication authentication) {
        return addressService.getAddresses(currentUser(authentication));
    }

    @PostMapping
    public AddressResponse createAddress(
        Authentication authentication,
        @Valid @RequestBody AddressRequest request
    ) {
        return addressService.createAddress(currentUser(authentication), request);
    }

    @PutMapping("/{addressId}")
    public AddressResponse updateAddress(
        Authentication authentication,
        @PathVariable Long addressId,
        @Valid @RequestBody AddressRequest request
    ) {
        return addressService.updateAddress(currentUser(authentication), addressId, request);
    }

    @DeleteMapping("/{addressId}")
    public ResponseEntity<Void> deleteAddress(Authentication authentication, @PathVariable Long addressId) {
        addressService.deleteAddress(currentUser(authentication), addressId);
        return ResponseEntity.noContent().build();
    }

    private AppUser currentUser(Authentication authentication) {
        return ((UserPrincipal) authentication.getPrincipal()).getUser();
    }
}
