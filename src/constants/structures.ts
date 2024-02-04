/**
 * These structures have seperate store capacities for different resources. For example, labs can hold minerals and energy, but at different amounts and without conflict
 */
export const separateStoreStructureTypes = new Set<StructureConstant>([
  STRUCTURE_LAB,
  STRUCTURE_NUKER,
  STRUCTURE_POWER_SPAWN,
])
