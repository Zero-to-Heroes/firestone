/* eslint-disable @typescript-eslint/no-empty-function */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { BgsQuestStats } from '@firestone-hs/bgs-global-stats';
import { CardIds, GameType, SceneMode, normalizeHeroCardId } from '@firestone-hs/reference-data';
import { BattlegroundsQuestsService, IN_GAME_RANK_FILTER } from '@firestone/battlegrounds/common';
import { CardOption } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { deepEqual } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { Observable, combineLatest, distinctUntilChanged, filter, shareReplay, switchMap } from 'rxjs';
import { BG_USE_QUESTS } from '../../../services/feature-flags';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from '../_widget-wrapper.component';

@Component({
	selector: 'choosing-bgs-quest-widget-wrapper',
	styleUrls: ['./choosing-bgs-quest-widget-wrapper.component.scss'],
	template: `
		<div class="container" *ngIf="showWidget$ | async">
			<div
				class="choosing-card-container items-{{ value.options?.length }}"
				*ngIf="{ options: options$ | async } as value"
			>
				<!-- TODO: premium stuff -->
				<choosing-card-bgs-quest-option
					class="option-container"
					*ngFor="let option of value.options"
					[option]="option"
				></choosing-card-bgs-quest-option>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoosingBgsQuestWidgetWrapperComponent extends AbstractWidgetWrapperComponent implements AfterContentInit {
	protected defaultPositionLeftProvider = null;
	protected defaultPositionTopProvider = null;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = null;

	showWidget$: Observable<boolean>;
	options$: Observable<readonly BgsQuestCardChoiceOption[]>;

	windowWidth: number;
	windowHeight: number;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly scene: SceneService,
		private readonly quests: BattlegroundsQuestsService,
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	async ngAfterContentInit() {
		await this.scene.isReady();
		await this.quests.isReady();
		await this.prefs.isReady();

		this.showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.store.listen$(([main, nav, prefs]) => prefs.overlayEnableDiscoverHelp),
			this.store.listenDeckState$(
				(deckState) => deckState?.playerDeck?.currentOptions,
				(deckState) => deckState?.metadata?.gameType,
			),
		]).pipe(
			this.mapData(([currentScene, [displayFromPrefs], [currentOptions, gameType]]) => {
				if (!displayFromPrefs || !BG_USE_QUESTS) {
					return false;
				}

				// We explicitely don't check for null, so that if the memory updates are broken
				// we still somehow show the info
				if (currentScene !== SceneMode.GAMEPLAY) {
					return false;
				}

				if (!currentOptions?.length) {
					return false;
				}

				if (![GameType.GT_BATTLEGROUNDS, GameType.GT_BATTLEGROUNDS_FRIENDLY].includes(gameType)) {
					return false;
				}

				return true;
			}),
			this.handleReposition(),
		);

		const quests$: Observable<BgsQuestStats> = this.showWidget$.pipe(
			filter((show) => show),
			distinctUntilChanged(),
			switchMap(() => this.store.listenBattlegrounds$(([state]) => state?.currentGame?.hasQuests)),
			filter(([hasQuests]) => hasQuests),
			distinctUntilChanged(),
			switchMap(() =>
				this.store.listenBattlegrounds$(
					([state]) => state?.currentGame?.mmrAtStart,
					([state]) => state?.currentGame?.availableRaces,
				),
			),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			switchMap(([playerRank, availableRaces]) => {
				return this.quests.loadQuests('last-patch', IN_GAME_RANK_FILTER);
			}),
			// tap((info) => console.debug('[bgs-quest] quests', info)),
			this.mapData((quests) => {
				return quests;
			}),
			shareReplay(1),
		) as Observable<BgsQuestStats>;

		this.options$ = combineLatest([
			this.store.listenDeckState$((state) => state?.playerDeck?.currentOptions),
			this.prefs.preferences$((prefs) => prefs.bgsShowQuestStatsOverlay),
			quests$,
			this.store.listenBattlegrounds$(([state]) => state?.currentGame?.getMainPlayer()?.cardId),
		]).pipe(
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			filter(([[options], bgsShowQuestStatsOverlay, quests, [mainPlayerCardId]]) => {
				return options.every((o) => isBgQuestDiscover(o.source));
			}),
			this.mapData(([[options], bgsShowQuestStatsOverlay, quests, [mainPlayerCardId]]) => {
				if (!bgsShowQuestStatsOverlay) {
					return null;
				}
				return (
					options?.map((o) => buildBgsQuestCardChoiceValue(o, mainPlayerCardId, quests, this.allCards)) ?? []
				);
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

export interface BgsQuestCardChoiceOption {
	readonly cardId: string;
	readonly quest: {
		readonly dataPoints: number;
		readonly heroDataPoints: number;
		readonly difficultyDataPoints: number;
		readonly averageTurnsToComplete: number;
		readonly averageTurnsToCompleteForHero: number;
		readonly averageTurnsToCompleteForDifficulty: number;
	};
	readonly reward: {
		// readonly tier: string;
		readonly dataPoints: number;
		readonly averagePosition: number;
		readonly heroDataPoints: number;
		readonly averagePositionForHero: number;
	};
}

const isBgQuestDiscover = (source: string): boolean => {
	return source === CardIds.DiscoverQuestRewardDntToken;
};

const buildBgsQuestCardChoiceValue = (
	option: CardOption,
	mainPlayerCardId: string,
	bgsQuests: BgsQuestStats,
	allCards: CardsFacadeService,
): BgsQuestCardChoiceOption => {
	const bgQuestCardId = option.cardId;
	const questStat = bgsQuests?.questStats.find((s) => s.questCardId === bgQuestCardId);
	// console.debug('questStat', questStat, mainPlayerCardId);

	const rewardStat = bgsQuests.rewardStats.find((r) => r.rewardCardId === option.questReward?.CardId);
	// console.debug('rewardStat', rewardStat);
	if (!questStat || !rewardStat) {
		return null;
	}

	const questStatForHero = questStat?.heroStats.find(
		(s) => s.heroCardId === normalizeHeroCardId(mainPlayerCardId, allCards),
	);
	const filteredStatForHero = questStatForHero?.dataPoints > 20 ? questStatForHero : null;
	// console.debug('statForHero', questStatForHero, mainPlayerCardId, questStat.heroStats);

	const questStatForDifficulty = questStat?.difficultyStats?.find((s) => s.difficulty === option.questDifficulty);
	const filteredStatForDifficulty = questStatForDifficulty?.dataPoints > 20 ? questStatForDifficulty : null;
	// console.debug('statForDifficulty', questStatForDifficulty, option.questDifficulty);

	// const turnsToCompleteImpact = filteredStatForDifficulty?.impactTurnToComplete ?? 0;
	// console.debug('turnsToCompleteImpact', turnsToCompleteImpact, filteredStatForDifficulty);

	const rewardHeroStat = rewardStat.heroStats.find(
		(s) => s.heroCardId === normalizeHeroCardId(mainPlayerCardId, allCards),
	);
	const filteredRewardHeroStat = rewardHeroStat?.dataPoints > 20 ? rewardHeroStat : null;

	return {
		cardId: option.cardId,
		quest: {
			dataPoints: questStat.dataPoints,
			heroDataPoints: questStatForHero?.dataPoints ?? 0,
			difficultyDataPoints: questStatForDifficulty?.dataPoints ?? 0,
			averageTurnsToComplete: questStat.averageTurnToComplete / 2 + 1,
			averageTurnsToCompleteForHero: filteredStatForHero?.averageTurnToComplete
				? filteredStatForHero.averageTurnToComplete / 2 + 1
				: null,
			averageTurnsToCompleteForDifficulty: filteredStatForDifficulty?.averageTurnToComplete
				? filteredStatForDifficulty.averageTurnToComplete / 2 + 1
				: null,
		},
		reward: {
			dataPoints: rewardStat.dataPoints,
			heroDataPoints: rewardHeroStat?.dataPoints ?? 0,
			averagePosition: rewardStat.averagePlacement,
			averagePositionForHero: filteredRewardHeroStat?.averagePlacement,
		},
	};
};
