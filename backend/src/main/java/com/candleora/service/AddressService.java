package com.candleora.service;

import com.candleora.dto.address.AddressRequest;
import com.candleora.dto.address.AddressResponse;
import com.candleora.entity.Address;
import com.candleora.entity.AppUser;
import com.candleora.repository.AddressRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AddressService {

    private final AddressRepository addressRepository;

    public AddressService(AddressRepository addressRepository) {
        this.addressRepository = addressRepository;
    }

    public List<AddressResponse> getAddresses(AppUser user) {
        return addressRepository.findAllByUserIdOrderByIsDefaultDescUpdatedAtDescIdDesc(user.getId())
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public AddressResponse createAddress(AppUser user, AddressRequest request) {
        Address address = new Address();
        address.setUser(user);
        applyRequest(address, request);

        boolean firstAddress = addressRepository.countByUserId(user.getId()) == 0;
        boolean shouldBeDefault = firstAddress || Boolean.TRUE.equals(request.isDefault());
        address.setDefault(shouldBeDefault);

        Address saved = addressRepository.save(address);
        if (shouldBeDefault) {
            addressRepository.clearDefaultForUserExcept(user.getId(), saved.getId());
        }

        return toResponse(saved);
    }

    @Transactional
    public AddressResponse updateAddress(AppUser user, Long addressId, AddressRequest request) {
        Address address = addressRepository.findByIdAndUserId(addressId, user.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found"));

        applyRequest(address, request);

        boolean shouldBeDefault = Boolean.TRUE.equals(request.isDefault());
        if (!shouldBeDefault && addressRepository.countByUserId(user.getId()) == 1) {
            shouldBeDefault = true;
        }

        address.setDefault(shouldBeDefault);
        Address saved = addressRepository.save(address);

        if (saved.isDefault()) {
            addressRepository.clearDefaultForUserExcept(user.getId(), saved.getId());
        } else {
            ensureUserHasDefaultAddress(user.getId());
        }

        return toResponse(saved);
    }

    @Transactional
    public void deleteAddress(AppUser user, Long addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, user.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found"));

        boolean wasDefault = address.isDefault();
        addressRepository.delete(address);

        if (wasDefault) {
            ensureUserHasDefaultAddress(user.getId());
        }
    }

    private void ensureUserHasDefaultAddress(Long userId) {
        List<Address> remainingAddresses = addressRepository.findAllByUserIdOrderByIsDefaultDescUpdatedAtDescIdDesc(userId);
        if (remainingAddresses.isEmpty() || remainingAddresses.stream().anyMatch(Address::isDefault)) {
            return;
        }

        Address fallbackDefault = remainingAddresses.get(0);
        fallbackDefault.setDefault(true);
        Address saved = addressRepository.save(fallbackDefault);
        addressRepository.clearDefaultForUserExcept(userId, saved.getId());
    }

    private void applyRequest(Address address, AddressRequest request) {
        address.setLabel(trimToNull(request.label()));
        address.setFullName(trimRequired(request.recipientName(), "recipientName"));
        address.setAddressLine1(trimRequired(request.addressLine1(), "addressLine1"));
        address.setAddressLine2(trimToNull(request.addressLine2()));
        address.setCity(trimRequired(request.city(), "city"));
        address.setState(trimRequired(request.state(), "state"));
        address.setPostalCode(trimRequired(request.postalCode(), "postalCode"));
        address.setCountry(trimRequired(request.country(), "country"));
        address.setPhone(trimRequired(request.phoneNumber(), "phoneNumber"));
    }

    private AddressResponse toResponse(Address address) {
        return new AddressResponse(
            address.getId(),
            address.getLabel(),
            address.getFullName(),
            address.getAddressLine1(),
            address.getAddressLine2(),
            address.getCity(),
            address.getState(),
            address.getPostalCode(),
            address.getCountry(),
            address.getPhone(),
            address.isDefault(),
            address.getCreatedAt(),
            address.getUpdatedAt()
        );
    }

    private String trimRequired(String value, String fieldName) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required");
        }
        return trimmed;
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
