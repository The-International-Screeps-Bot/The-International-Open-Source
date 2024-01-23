import { Feature, FeatureFlagManager } from './featureFlags'

describe('Feature Flags', () => {
    FeatureFlagManager

    it('should return false when checking if a feature flag is turned on', () => {
        expect(FeatureFlagManager.flags[Feature.testFeatureDisabled]).toBe(false)
    })

    it('should return true when checking if a feature flag is turned on', () => {
        expect(FeatureFlagManager.flags[Feature.testFeatureEnabled]).toBe(true)
    })
})
