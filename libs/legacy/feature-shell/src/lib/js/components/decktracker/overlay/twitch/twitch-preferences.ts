export class TwitchPreferences {
	readonly locale: string = 'auto';
	readonly adaptativeScaling: boolean = true;
	readonly scale: number = 100;
	readonly showHeroCards: boolean = true;
	readonly showMinionsList: boolean = true;
	readonly showMinionsListGoldenCards: boolean = true;
	readonly showBattleSimulator: boolean = true;
	readonly showRelatedCards: boolean = true;
	readonly magnifierIconOnTop: boolean = false;
	readonly hideBattleOddsInCombat: 'auto' | 'true' | 'false' = 'auto';
	readonly hideBattleOddsInTavern: 'auto' | 'true' | 'false' = 'auto';
	readonly hideBattleOddsWhenEmpty: boolean = false;
	readonly bgsShowMechanicsTiers: boolean = false;
	readonly bgsShowTribeTiers: boolean = false;
	readonly bgsGroupMinionsIntoTheirTribeGroup: boolean = false;
}
