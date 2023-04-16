export enum Feature {
    // just for jest testing
    testFeatureEnabled,
    testFeatureDisabled,
    // enables creeps with WORK part(s) to dismantle blocking walls if they are stuck
    dismantleBlockingWalls,
}

export interface FeatureFlagConfig {
    [Feature.testFeatureEnabled]: boolean
    [Feature.testFeatureDisabled]: boolean
    [Feature.dismantleBlockingWalls]: boolean
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

export const featureFlagConfig: FeatureFlagConfig = {
    [Feature.testFeatureEnabled]: false, // do not change!
    [Feature.testFeatureDisabled]: false, // do not change!
    // Enable creeps with WORK part(s) to dismantle blocking walls if they are stuck
    [Feature.dismantleBlockingWalls]: true,
}

export const FeatureFlags = new FeatureFlagManager(featureFlagConfig)
