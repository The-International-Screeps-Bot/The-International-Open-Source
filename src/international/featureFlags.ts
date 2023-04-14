interface FeatureFlagConfig {
    [key: string]: boolean
}

class FeatureFlags {
    private readonly flags: FeatureFlagConfig // An object to hold the flag configuration

    constructor(config: FeatureFlagConfig) {
        this.flags = config // Set the flag configuration when creating a new instance
    }

    // Method to check if a feature flag is turned on
    isFlagOn(flag: string): boolean {
        return this.flags[flag] ?? false // Return the flag value if it exists, otherwise return false
    }

    // Method to check if a combination of feature flags are turned on
    areFlagsOn(flags: string[]): boolean {
        return flags.every(flag => this.isFlagOn(flag)) // Check if every flag in the array is turned on
    }
}

export const FeatureFlag = new FeatureFlags({})
