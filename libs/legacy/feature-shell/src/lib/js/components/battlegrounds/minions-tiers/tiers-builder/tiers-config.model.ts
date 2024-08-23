export interface TierBuilderConfig {
	readonly groupMinionsIntoTheirTribeGroup?: boolean;
	readonly spells?: boolean;
	readonly showSpellsAtBottom?: boolean;
	readonly trinkets?: boolean;
	readonly showBuddiesTier?: boolean;
	readonly showAllBuddyCards?: boolean;
	readonly playerTrinkets: readonly string[];
}
