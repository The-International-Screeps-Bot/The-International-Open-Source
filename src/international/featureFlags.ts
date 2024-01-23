export enum Feature {
    testFeatureEnabled,
    testFeatureDisabled,
}

interface FeatureFlagConfig {
    [Feature.testFeatureEnabled]: boolean
    [Feature.testFeatureDisabled]: boolean
}

export class FeatureFlagManager {
    // An object to hold the flag configuration
    static flags: FeatureFlagConfig = {
        [Feature.testFeatureEnabled]: false,
        [Feature.testFeatureDisabled]: false,
    }

    // Method to check if a combination of feature flags are turned on
    static areFlagsOn(flags: Feature[]): boolean {
        return flags.every(flag => !!flag) // Check if every flag in the array is turned on
    }
}
