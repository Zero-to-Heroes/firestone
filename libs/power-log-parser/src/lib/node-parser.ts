import { Node } from './models';
import { GameEventProvider } from './game-event';
import { EventQueueHandler } from './event-queue-handler';
import { ControlsManager } from './controls/controls-manager';
import { Logger } from './logger';
import type { ActionParser } from './action-parser';
import type { StateFacade } from './state/state-facade';
import type { ParserState } from './state/parser-state';
import { StateType, INodeParser } from './state/parser-state';
import {
	ArmorChangeParser,
	AttackOnBoardParser,
	AttackParser,
	BallerBuffChangedParser,
	BattlegroundFreezeParser,
	BattlegroundsActivePlayerBoardParser,
	BattlegroundsBattleOverParser,
	BattlegroundsBuddyGainedParser,
	BattlegroundsDuoTeammatePlayerBoardParser,
	BattlegroundsHeroKilledParser,
	BattlegroundsHeroRerollParser,
	BattlegroundsHeroSelectedParser,
	BattlegroundsHeroSelectionParser,
	BattlegroundsMinionsBoughtParser,
	BattlegroundsMinionsSoldParser,
	BattlegroundsNextOpponentParser,
	BattlegroundsOpponentRevealedParser,
	BattlegroundsPlayerBoardParser,
	BattlegroundsPlayerLeaderboardPlaceUpdatedParser,
	BattlegroundsPlayerTechLevelUpdatedParser,
	BattlegroundsQuestCompletedParser,
	BattlegroundsQuestRevealedParser,
	BattlegroundsQuestRewardDestroyedParser,
	BattlegroundsQuestRewardEquippedParser,
	BattlegroundsRerollParser,
	BattlegroundsRewardGainedParser,
	BattlegroundsTavernPrizesParser,
	BattlegroundsTimewarpedTavernActiveParser,
	BattlegroundsTrinketSelectedParser,
	BattlegroundsTrinketSelectionParser,
	BattlegroundsTriplesCountUpdatedParser,
	BeetleArmyChangedParser,
	BloodGemBuffChangedParser,
	BurnedCardParser,
	CardBackToDeckParser,
	CardBuffedInHandParser,
	CardChangedParser,
	CardDrawFromDeckParser,
	CardForgedParser,
	CardPlayedFromEffectParser,
	CardPlayedFromHandParser,
	CardPresentOnGameStartParser,
	CardRemovedFromBoardParser,
	CardRemovedFromDeckParser,
	CardRemovedFromHandParser,
	CardRevealedParser,
	CardStolenParser,
	CardTradedParser,
	CardUpdatedInDeckParser,
	CardsShuffledIntoDeckParser,
	ChangeCardCreatorParser,
	ChoosingOptionsParser,
	ConstructedAnomalyParser,
	CopiedFromEntityIdParser,
	CorpsesChangedParser,
	CorpsesSpentThisGameParser,
	CostChangedParser,
	CounterTriggerParser,
	CounterWillTriggerParser,
	CreateCardInDeckParser,
	CreateCardInGraveyardParser,
	CthunParser,
	DamageParser,
	DataScriptChangedParser,
	DeathrattleTriggeredParser,
	DecklistUpdateParser,
	DiscardedCardParser,
	DungeonRunStepParser,
	EndOfEchoInHandParser,
	EntityChosenParser,
	EntityUpdateParser,
	ExcavateTierChangedParser,
	FatigueParser,
	FirstPlayerParser,
	FullEntityParser,
	GalakrondInvokedParser,
	GameCleanupParser,
	GameEndParser,
	GameResetParser,
	GameRunningParser,
	HealingParser,
	HealthDefChangeParser,
	HeraldColossalAmountParser,
	HeroChangedParser,
	HeroEnchantmentAttachedParser,
	HeroEnchantmentDetachedParser,
	HeroPowerChangedParser,
	HeroPowerUsedParser,
	HeroRevealedParser,
	HideEntityParser,
	ImmolateChangedParser,
	InitialCardInDeckParser,
	JadeGolemParser,
	LinkedEntityParser,
	LocalPlayerLeaderboardPlaceChangedParser,
	LocationDestroyedParser,
	LocationUsedParser,
	MainStepReadyParser,
	MaxResourcesChangedParser,
	MercenariesAbilityActivatedParser,
	MercenariesAbilityCooldownUpdatedParser,
	MercenariesAbilityRevealedParser,
	MercenariesHeroRevealedParser,
	MercenariesQueuedAbilityParser,
	MercenariesSelectedTargetParser,
	MindrenderIlluciaParser,
	MinionBackOnBoardParser,
	MinionDiedParser,
	MinionGoDormantParser,
	MinionOnBoardAttackUpdatedParser,
	MinionSummonedParser,
	MinionsWillDieParser,
	MonsterRunStepParser,
	MulliganDealingParser,
	MulliganDoneParser,
	MulliganInputParser,
	NewGameParser,
	NumCardsDrawnThisTurnParser,
	NumCardsPlayedThisTurnParser,
	OverloadedCrystalsParser,
	ParentCardChangedParser,
	PassiveBuffParser,
	QuestCompletedParser,
	ReceiveCardInHandParser,
	RecruitParser,
	RemovedFromHistoryParser,
	ResourcesUsedThisTurnParser,
	RumbleRunStepParser,
	SecretCreatedInGameParser,
	SecretDestroyedParser,
	SecretPlayedFromDeckParser,
	SecretPlayedFromHandParser,
	SecretTriggeredParser,
	SecretWillTriggeredParser,
	ShowEntityParser,
	ShuffleDeckParser,
	SpecialCardPowerParser,
	SpecialTargetParser,
	SpawnTimeCountChangedParser,
	StarshipLaunchedParser,
	StartOfGameTriggerParser,
	TotalMagnetizeChangedParser,
	TouristRevealedParser,
	TurnCleanupParser,
	TurnDurationUpdateParser,
	TurnStartParser,
	WeaponDestroyedParser,
	WeaponEquippedParser,
	WheelOfDeathCounterParser,
	WhizbangDeckParser,
	WinnerParser,
	ZoneChangeParser,
	ZonePositionChangedParser,
} from './parsers';

export class NodeParser implements INodeParser {
	private QueueHandler: EventQueueHandler;
	private StateFacade: StateFacade;
	private ParserState!: ParserState;
	private StateType: StateType;
	private Controller: ControlsManager;

	private _parsers: ActionParser[] | null = null;
	private _unfilteredParsers: ActionParser[] | null = null;
	private get parsers(): ActionParser[] {
		if (this._parsers != null) {
			return this._parsers;
		}
		if (this.ParserState == null) {
			return [];
		}

		if (this._unfilteredParsers == null) {
			this._unfilteredParsers = this.BuildActionParsers(this.ParserState, this.StateType);
		}

		if (
			this.StateFacade?.GsState?.CurrentGame?.GameType == null ||
			this.StateFacade?.GsState?.CurrentGame?.GameType === -1
		) {
			return this._unfilteredParsers;
		}

		this._parsers = this._unfilteredParsers.filter((p) => this.Controller.Applies(p));
		return this._parsers;
	}

	constructor(queueHandler: EventQueueHandler, stateFacade: StateFacade, stateType: StateType) {
		this.QueueHandler = queueHandler;
		this.StateFacade = stateFacade;
		this.StateType = stateType;
		this.Controller = new ControlsManager(stateFacade, stateType);
	}

	Reset(parserState: ParserState, helper: StateFacade): void {
		this.StateFacade = helper;
		this.ParserState = parserState;
		this.QueueHandler.Reset(helper);
		this._parsers = null;
		this._unfilteredParsers = null;
	}

	NewNode(node: Node, stateType: StateType): void {
		if (node == null) {
			return;
		}
		for (const parser of this.parsers) {
			if (parser.AppliesOnNewNode(node, stateType)) {
				try {
					const providers = parser.CreateGameEventProviderFromNew(node);
					if (providers != null) {
						this.EnqueueGameEvent(providers);
					}
				} catch (e: any) {
					Logger.Log('ERROR: Exception while parsing node', e?.message ?? e);
					Logger.Log(node.CreationLogLine ?? '', '');
					Logger.Log(e?.stack ?? '', '');
				}
			}
		}
	}

	CloseNode(node: Node, stateType: StateType): void {
		if (node == null) {
			return;
		}
		for (const parser of this.parsers) {
			if (!node.Closed && parser.AppliesOnCloseNode(node, stateType)) {
				try {
					const providers = parser.CreateGameEventProviderFromClose(node);
					if (providers != null && providers.length > 0) {
						this.EnqueueGameEvent(providers);
					}
				} catch (e: any) {
					Logger.Log('ERROR: Exception while parsing node', e?.message ?? e);
					Logger.Log(node.CreationLogLine ?? '', '');
					Logger.Log(e?.stack ?? '', '');
				}
			}
		}
		node.Closed = true;
	}

	EnqueueGameEvent(providers: GameEventProvider[]): void {
		this.QueueHandler.EnqueueGameEvent(providers);
	}

	ClearQueue(): void {
		this.QueueHandler.ClearQueue();
	}

	private BuildActionParsers(parserState: ParserState, stateType: StateType): ActionParser[] {
		if (stateType === StateType.GameState) {
			return [
				new NewGameParser(parserState, this.StateFacade),
				new TurnCleanupParser(parserState, this.StateFacade),
				new GameCleanupParser(parserState, this.StateFacade),
				new SecretWillTriggeredParser(parserState, this.StateFacade),
				new CounterWillTriggerParser(parserState, this.StateFacade),
				new MinionsWillDieParser(parserState, this.StateFacade),
				new ChoosingOptionsParser(parserState, this.StateFacade),
				new EntityChosenParser(parserState, this.StateFacade),
				new BattlegroundsHeroSelectedParser(parserState, this.StateFacade),
				new BattlegroundsDuoTeammatePlayerBoardParser(parserState, this.StateFacade),
				new BattlegroundsActivePlayerBoardParser(parserState, this.StateFacade),
				new BattlegroundsPlayerBoardParser(parserState, this.StateFacade),
			];
		}
		return [
			new GameResetParser(parserState, this.StateFacade),

			new HideEntityParser(parserState, this.StateFacade),
			new ShowEntityParser(parserState, this.StateFacade),
			new FullEntityParser(parserState, this.StateFacade),

			new MinionSummonedParser(parserState, this.StateFacade),

			new CardRevealedParser(parserState, this.StateFacade),

			new MercenariesHeroRevealedParser(parserState, this.StateFacade),
			new MercenariesAbilityRevealedParser(parserState, this.StateFacade),
			new MercenariesAbilityActivatedParser(parserState, this.StateFacade),
			new MercenariesAbilityCooldownUpdatedParser(parserState, this.StateFacade),
			new MercenariesQueuedAbilityParser(parserState, this.StateFacade),
			new MercenariesSelectedTargetParser(parserState, this.StateFacade),

			new BattlegroundsPlayerBoardParser(parserState, this.StateFacade),
			new ShuffleDeckParser(parserState, this.StateFacade),

			new WinnerParser(parserState, this.StateFacade),
			new GameEndParser(parserState, this.StateFacade),
			new TurnStartParser(parserState, this.StateFacade),
			new FirstPlayerParser(parserState, this.StateFacade),
			new MainStepReadyParser(parserState, this.StateFacade),
			new CardPlayedFromHandParser(parserState, this.StateFacade),
			new CardPlayedFromEffectParser(parserState, this.StateFacade),
			new SecretPlayedFromHandParser(parserState, this.StateFacade),
			new MulliganInputParser(parserState),
			new MulliganDealingParser(parserState),
			new MulliganDoneParser(parserState),
			new RumbleRunStepParser(parserState, this.StateFacade),
			new DungeonRunStepParser(parserState, this.StateFacade),
			new MonsterRunStepParser(parserState, this.StateFacade),
			new PassiveBuffParser(parserState, this.StateFacade),
			new CardPresentOnGameStartParser(parserState, this.StateFacade),
			new CardDrawFromDeckParser(parserState, this.StateFacade),
			new ReceiveCardInHandParser(parserState, this.StateFacade),
			new CardBackToDeckParser(parserState, this.StateFacade),
			new CardTradedParser(parserState, this.StateFacade),
			new DiscardedCardParser(parserState, this.StateFacade),
			new CardRemovedFromDeckParser(parserState, this.StateFacade),
			new CreateCardInDeckParser(parserState, this.StateFacade),
			new EndOfEchoInHandParser(parserState, this.StateFacade),
			new CardChangedParser(parserState, this.StateFacade),
			new CardUpdatedInDeckParser(parserState, this.StateFacade),
			new CardRemovedFromHandParser(parserState, this.StateFacade),
			new CardRemovedFromBoardParser(parserState, this.StateFacade),
			new MinionOnBoardAttackUpdatedParser(parserState, this.StateFacade),
			new RecruitParser(parserState, this.StateFacade),
			new MinionBackOnBoardParser(parserState, this.StateFacade),
			new HeroRevealedParser(parserState, this.StateFacade),
			new InitialCardInDeckParser(parserState, this.StateFacade),
			new FatigueParser(parserState, this.StateFacade),
			new DamageParser(parserState, this.StateFacade),
			new HealingParser(parserState, this.StateFacade),
			new BurnedCardParser(parserState, this.StateFacade),
			new RemovedFromHistoryParser(parserState, this.StateFacade),
			new MinionDiedParser(parserState, this.StateFacade),
			new SecretPlayedFromDeckParser(parserState, this.StateFacade),
			new SecretCreatedInGameParser(parserState, this.StateFacade),
			new SecretDestroyedParser(parserState, this.StateFacade),
			new ArmorChangeParser(parserState, this.StateFacade),
			new CorpsesChangedParser(parserState, this.StateFacade),
			new HeraldColossalAmountParser(parserState, this.StateFacade),
			new MaxResourcesChangedParser(parserState, this.StateFacade),
			new ExcavateTierChangedParser(parserState, this.StateFacade),
			new CardStolenParser(parserState, this.StateFacade),
			new SecretTriggeredParser(parserState, this.StateFacade),
			new CounterTriggerParser(parserState, this.StateFacade),
			new QuestCompletedParser(parserState, this.StateFacade),
			new DeathrattleTriggeredParser(parserState, this.StateFacade),
			new HealthDefChangeParser(parserState, this.StateFacade),
			new ChangeCardCreatorParser(parserState, this.StateFacade),
			new LocalPlayerLeaderboardPlaceChangedParser(parserState, this.StateFacade),
			new HeroPowerChangedParser(parserState, this.StateFacade),
			new HeroChangedParser(parserState, this.StateFacade),
			new WeaponEquippedParser(parserState, this.StateFacade),
			new WeaponDestroyedParser(parserState, this.StateFacade),
			new LocationDestroyedParser(parserState, this.StateFacade),
			new HeroEnchantmentAttachedParser(parserState, this.StateFacade),
			new HeroEnchantmentDetachedParser(parserState, this.StateFacade),
			new CardsShuffledIntoDeckParser(parserState, this.StateFacade),

			new BattlegroundsPlayerTechLevelUpdatedParser(parserState, this.StateFacade),
			new BattlegroundsBuddyGainedParser(parserState, this.StateFacade),
			new BattlegroundsQuestRevealedParser(parserState, this.StateFacade),
			new BattlegroundsQuestCompletedParser(parserState, this.StateFacade),
			new BattlegroundsRewardGainedParser(parserState, this.StateFacade),
			new BattlegroundsPlayerLeaderboardPlaceUpdatedParser(parserState, this.StateFacade),
			new BattlegroundsHeroSelectionParser(parserState, this.StateFacade),
			new BattlegroundsHeroRerollParser(parserState, this.StateFacade),
			new BattlegroundsNextOpponentParser(parserState),
			new BattlegroundsTriplesCountUpdatedParser(parserState, this.StateFacade),
			new BattlegroundsOpponentRevealedParser(parserState, this.StateFacade),
			new BattlegroundsHeroSelectedParser(parserState, this.StateFacade),
			new BattlegroundsBattleOverParser(parserState, this.StateFacade),
			new BattlegroundsRerollParser(parserState, this.StateFacade),
			new BattlegroundFreezeParser(parserState, this.StateFacade),
			new BattlegroundsMinionsBoughtParser(parserState, this.StateFacade),
			new BattlegroundsMinionsSoldParser(parserState, this.StateFacade),
			new BattlegroundsHeroKilledParser(parserState, this.StateFacade),
			new BattlegroundsQuestRewardEquippedParser(parserState, this.StateFacade),
			new BattlegroundsQuestRewardDestroyedParser(parserState, this.StateFacade),
			new BloodGemBuffChangedParser(parserState, this.StateFacade),
			new BeetleArmyChangedParser(parserState, this.StateFacade),
			new BallerBuffChangedParser(parserState, this.StateFacade),
			new TotalMagnetizeChangedParser(parserState, this.StateFacade),
			new BattlegroundsTrinketSelectedParser(parserState, this.StateFacade),
			new BattlegroundsTrinketSelectionParser(parserState, this.StateFacade),
			new BattlegroundsTimewarpedTavernActiveParser(parserState, this.StateFacade),

			new DecklistUpdateParser(parserState, this.StateFacade),
			new GameRunningParser(parserState, this.StateFacade),
			new AttackParser(parserState, this.StateFacade),
			new NumCardsPlayedThisTurnParser(parserState, this.StateFacade),
			new NumCardsDrawnThisTurnParser(parserState, this.StateFacade),
			new HeroPowerUsedParser(parserState, this.StateFacade),
			new GalakrondInvokedParser(parserState, this.StateFacade),
			new CardBuffedInHandParser(parserState, this.StateFacade),
			new MinionGoDormantParser(parserState, this.StateFacade),
			new AttackOnBoardParser(parserState, this.StateFacade),
			new JadeGolemParser(parserState, this.StateFacade),
			new CthunParser(parserState, this.StateFacade),
			new EntityUpdateParser(parserState, this.StateFacade),
			new ResourcesUsedThisTurnParser(parserState, this.StateFacade),
			new WhizbangDeckParser(parserState, this.StateFacade),
			new BattlegroundsTavernPrizesParser(parserState),
			new LinkedEntityParser(parserState, this.StateFacade),
			new ZoneChangeParser(parserState, this.StateFacade),
			new ZonePositionChangedParser(parserState, this.StateFacade),
			new CostChangedParser(parserState, this.StateFacade),
			new SpawnTimeCountChangedParser(parserState, this.StateFacade),
			new TurnDurationUpdateParser(parserState, this.StateFacade),
			new StartOfGameTriggerParser(parserState, this.StateFacade),
			new DataScriptChangedParser(parserState, this.StateFacade),
			new ImmolateChangedParser(parserState, this.StateFacade),
			new OverloadedCrystalsParser(parserState, this.StateFacade),
			new CorpsesSpentThisGameParser(parserState, this.StateFacade),
			new ConstructedAnomalyParser(parserState, this.StateFacade),
			new TouristRevealedParser(parserState, this.StateFacade),
			new ParentCardChangedParser(parserState, this.StateFacade),
			new StarshipLaunchedParser(parserState, this.StateFacade),

			new CardForgedParser(parserState, this.StateFacade),
			new LocationUsedParser(parserState, this.StateFacade),
			new CreateCardInGraveyardParser(parserState, this.StateFacade),
			new MindrenderIlluciaParser(parserState, this.StateFacade),
			new SpecialCardPowerParser(parserState, this.StateFacade),
			new WheelOfDeathCounterParser(parserState, this.StateFacade),

			new CopiedFromEntityIdParser(parserState, this.StateFacade),
			new SpecialTargetParser(parserState, this.StateFacade),
		];
	}
}
