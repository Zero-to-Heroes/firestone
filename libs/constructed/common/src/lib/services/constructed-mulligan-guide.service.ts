import { Injectable } from '@angular/core';
import { GameFormat } from '@firestone-hs/constructed-deck-stats';
import { COIN_IDS, CardIds, SceneMode } from '@firestone-hs/reference-data';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import {
	ADS_SERVICE_TOKEN,
	AbstractFacadeService,
	AppInjector,
	IAdsService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { toFormatType } from '@firestone/stats/data-access';
import { BehaviorSubject, combineLatest, filter, map, switchMap, tap } from 'rxjs';
import { MulliganAdvice } from '../models/mulligan-advice';
import { ConstructedMetaDecksStateService } from './constructed-meta-decks-state-builder.service';
import { GameStateFacadeService } from './game-state-facade.service';

@Injectable()
export class ConstructedMulliganGuideService extends AbstractFacadeService<ConstructedMulliganGuideService> {
	public mulliganAdvice$$: BehaviorSubject<readonly MulliganAdvice[] | null>;

	private scene: SceneService;
	private prefs: PreferencesService;
	private gameState: GameStateFacadeService;
	private ads: IAdsService;
	private archetypes: ConstructedMetaDecksStateService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ConstructedMulliganGuideService', () => !!this.mulliganAdvice$$);
	}

	protected override assignSubjects() {
		this.mulliganAdvice$$ = this.mainInstance.mulliganAdvice$$;
	}

	protected async init() {
		this.mulliganAdvice$$ = new BehaviorSubject<readonly MulliganAdvice[] | null>(null);
		this.scene = AppInjector.get(SceneService);
		this.prefs = AppInjector.get(PreferencesService);
		this.gameState = AppInjector.get(GameStateFacadeService);
		this.ads = AppInjector.get(ADS_SERVICE_TOKEN);
		this.archetypes = AppInjector.get(ConstructedMetaDecksStateService);

		return;

		await Promise.all([this.scene.isReady(), this.prefs.isReady(), this.ads.isReady(), this.archetypes.isReady()]);

		const showWidget$ = combineLatest([
			this.scene.currentScene$$,
			this.prefs.preferences$((prefs) => prefs.decktrackerMulliganGuideOverlay),
			this.gameState.gameState$$,
			this.ads.hasPremiumSub$$,
		]).pipe(
			map(([currentScene, [displayFromPrefs], gameState, hasPremiumSub]) => {
				const gameStarted = gameState?.gameStarted;
				const gameEnded = gameState?.gameEnded;
				const mulliganOver = gameState?.mulliganOver;
				const isBgs = gameState?.isBattlegrounds();
				const isMercs = gameState?.isMercenaries();

				if (!gameStarted || mulliganOver || isBgs || isMercs || !displayFromPrefs) {
					return false;
				}

				// We explicitely don't check for null, so that if the memory updates are broken
				// we still somehow show the info
				if (currentScene !== SceneMode.GAMEPLAY) {
					return false;
				}

				if (gameEnded) {
					return false;
				}

				if (!hasPremiumSub) {
					return false;
				}

				return true;
			}),
			tap((showWidget) => console.log('[mulligan-guide] showWidget', showWidget)),
		);

		const cardsInHand$ = showWidget$.pipe(
			filter((showWidget) => showWidget),
			switchMap(() => this.gameState.gameState$$),
			map((gameState) => {
				// There should never be a "basic" coin in the mulligan AFAIK
				const cardsInHand =
					gameState?.playerDeck.hand?.map((c) => c.cardId).filter((c) => !COIN_IDS.includes(c as CardIds)) ??
					[];
				return cardsInHand.length > 0 ? cardsInHand : null;
			}),
			tap((cardsInHand) => console.log('[mulligan-guide] cardsInHand', cardsInHand)),
		);

		// const playerRank$ = showWidget$.pipe(
		// 	filter((showWidget) => showWidget),
		// 	switchMap(() => this.gameState.gameState$$),
		// 	map((gameState) => {
		//         gameState?.playerDeck?.
		// 	}),
		// );

		// TODO: get the correct rank
		const archetype$ = showWidget$.pipe(
			filter((showWidget) => showWidget),
			switchMap(() => this.gameState.gameState$$),
			map((gameState) => ({
				archetypeId: gameState?.playerDeck?.archetypeId,
				format: gameState?.metadata?.formatType,
			})),
			filter((info) => !!info.archetypeId && !!info.format),
			switchMap(({ archetypeId, format }) =>
				this.archetypes.loadNewArchetypeDetails(
					archetypeId as number,
					toFormatType(format as any) as GameFormat,
					'last-patch',
					'legend-diamond',
				),
			),
			tap((archetype) => console.log('[mulligan-guide] archetype', archetype)),
		);
		const mulliganAdvice$ = cardsInHand$.pipe(
			filter((cardsInHand) => !!cardsInHand),
			switchMap((cardsInHand) =>
				archetype$.pipe(
					map((archetype) => ({
						cardsInHand: cardsInHand,
						archetype: archetype,
					})),
				),
			),
			filter(({ cardsInHand, archetype }) => !!archetype),
			map(({ cardsInHand, archetype }) => {
				console.debug('[mulligan-guide] building advice', cardsInHand, archetype);
				return (
					cardsInHand?.map((cardId) => {
						const cardData = archetype?.cardsData?.find((card) => card.cardId === cardId);
						const mulliganAdvice: MulliganAdvice = {
							cardId: cardId,
							score: !!cardData?.inHandAfterMulligan
								? cardData.inHandAfterMulliganThenWin / cardData.inHandAfterMulligan
								: null,
						};
						// TODO: take the archetype winrate into account, and normalize the winrate
						return mulliganAdvice;
					}) ?? null
				);
			}),
			tap((mulliganAdvice) => console.log('[mulligan-guide] mulliganAdvice', mulliganAdvice)),
		);
		mulliganAdvice$.subscribe((value) => this.mulliganAdvice$$.next(value));
	}
}
