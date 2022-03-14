export type DuelsTopDecksDustFilterType = 'all' | '1000' | '500' | '200' | '100' | '40' | '0';
export type DuelsUnlocksFilterType =
	| 'all'
	| 'unlocked'
	// That third option is not available in the UI, but only for some services
	| 'reveal-locked-hero-powers';
