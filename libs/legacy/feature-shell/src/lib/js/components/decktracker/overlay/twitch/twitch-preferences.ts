export class TwitchPreferences {
	readonly locale: string = 'auto';
	readonly adaptativeScaling: boolean = true;
	readonly scale: number = 100;
	readonly useModernTracker: boolean = false;
	readonly showHeroCards: boolean = true;
	readonly showMinionsList: boolean = true;
	readonly showMinionsListGoldenCards: boolean = true;
	readonly showBattleSimulator: boolean = true;
	readonly showRelatedCards: boolean = true;
	readonly overlayHighlightRelatedCards: boolean = true;
	readonly decktrackerColorManaCost: boolean = true;

	readonly decktrackerOpen: boolean = true;
	readonly magnifierIconOnTop: boolean = false;
	readonly hideBattleOddsInCombat: 'auto' | 'true' | 'false' = 'auto';
	readonly hideBattleOddsInTavern: 'auto' | 'true' | 'false' = 'auto';
	readonly hideBattleOddsWhenEmpty: boolean = false;
	readonly bgsShowMechanicsTiers: boolean = false;
	readonly bgsShowTribeTiers: boolean = false;
	readonly bgsShowTierSeven: boolean = false;
	readonly bgsGroupMinionsIntoTheirTribeGroup: boolean = false;
}
