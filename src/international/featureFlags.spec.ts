import { Feature, FeatureFlagManager, featureFlagManager } from './featureFlags'

describe('Feature Flags', () => {
    featureFlagManager

    it('should return false when checking if a feature flag is turned on', () => {
        expect(featureFlagManager.flags[Feature.testFeatureDisabled]).toBe(false)
    })

    it('should return true when checking if a feature flag is turned on', () => {
        expect(featureFlagManager.flags[Feature.testFeatureEnabled]).toBe(true)
    })
})
