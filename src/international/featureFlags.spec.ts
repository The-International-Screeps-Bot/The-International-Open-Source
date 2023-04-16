import { Feature, FeatureFlags } from './featureFlags'

describe('Feature Flags', () => {
    it('should return false when checking if a feature flag is turned on', () => {
        expect(FeatureFlags.isFlagOn(Feature.testFeatureDisabled)).toBe(false)
    })

    it('should return true when checking if a feature flag is turned on', () => {
        expect(FeatureFlags.isFlagOn(Feature.testFeatureEnabled)).toBe(true)
    })
})
