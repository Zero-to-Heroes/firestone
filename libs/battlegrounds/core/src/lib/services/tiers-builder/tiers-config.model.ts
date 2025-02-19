export interface TierBuilderConfig {
	readonly groupMinionsIntoTheirTribeGroup?: boolean;
	readonly includeTrinketsInTribeGroups?: boolean;
	readonly spells?: boolean;
	readonly showSpellsAtBottom?: boolean;
	readonly trinkets?: boolean;
	readonly anomalies?: readonly string[];
	readonly showBuddiesTier?: boolean;
	readonly showAllBuddyCards?: boolean;
	readonly playerTrinkets: readonly string[];
	readonly showProtossMinions: boolean;
	readonly showZergMinions: boolean;
}
