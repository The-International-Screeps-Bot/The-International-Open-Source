import { Feature, FeatureFlagManager } from './featureFlags'

describe('Feature Flags', () => {
    const featureFlagInstance = new FeatureFlagManager({
        [Feature.testFeatureEnabled]: true,
        [Feature.testFeatureDisabled]: false,
    })

    it('should return false when checking if a feature flag is turned on', () => {
        expect(featureFlagInstance.isFlagOn(Feature.testFeatureDisabled)).toBe(false)
    })

    it('should return true when checking if a feature flag is turned on', () => {
        expect(featureFlagInstance.isFlagOn(Feature.testFeatureEnabled)).toBe(true)
    })
})
