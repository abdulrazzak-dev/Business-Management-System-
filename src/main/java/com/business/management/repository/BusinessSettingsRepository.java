package com.business.management.repository;

import com.business.management.model.BusinessSettings;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BusinessSettingsRepository extends MongoRepository<BusinessSettings, String> {
}
