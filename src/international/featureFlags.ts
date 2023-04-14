export enum Feature {
    testFeatureEnabled,
    testFeatureDisabled,
}

interface FeatureFlagConfig {
    [Feature.testFeatureEnabled]: boolean
    [Feature.testFeatureDisabled]: boolean
}

export class FeatureFlagManager {
    private readonly flags: FeatureFlagConfig // An object to hold the flag configuration

    constructor(config: FeatureFlagConfig) {
        this.flags = config // Set the flag configuration when creating a new instance
    }

    // Method to check if a feature flag is turned on
    isFlagOn(flag: Feature): boolean {
        return this.flags[flag] ?? false // Return the flag value if it exists, otherwise return false
    }

    // Method to check if a combination of feature flags are turned on
    areFlagsOn(flags: Feature[]): boolean {
        return flags.every(flag => this.isFlagOn(flag)) // Check if every flag in the array is turned on
    }
}

export const FeatureFlags = new FeatureFlagManager({
    [Feature.testFeatureEnabled]: false,
    [Feature.testFeatureDisabled]: false,
})
