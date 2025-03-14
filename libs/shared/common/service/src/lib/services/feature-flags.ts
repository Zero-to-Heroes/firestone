import { OverwolfService } from '@firestone/shared/framework/core';

export const ENABLE_BGS_COMPS = true;
export const BG_USE_ANOMALIES = true;
export const ENABLE_TEBEX = async (ow: OverwolfService) => {
	return true;
	// return ow.isBetaChannel();
};

// Shelved for now
export const ENABLE_MULTI_GRAPHS = false;
export const ENABLE_RANKED_ARCHETYPE = false;
