/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { formatGameType, GameFormat, GameType } from '@firestone-hs/reference-data';
import { GameStateFacadeService, Metadata } from '@firestone/game-state';
import { MatchInfo, PlayerInfo, Rank } from '@firestone/memory';
import { GameStatusService, PreferencesService } from '@firestone/shared/common/service';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { auditTime, BehaviorSubject, combineLatest, distinctUntilChanged, map, of, shareReplay, switchMap } from 'rxjs';
import { IN_GAME_TEXT_PLACEHOLDER } from './discord-presence-manager.service';

@Injectable()
export class PresenceManagerService {
	public presence$$ = new BehaviorSubject<Presence | null>(null);

	constructor(
		private readonly prefs: PreferencesService,
		private readonly gameStatus: GameStatusService,
		private readonly gameState: GameStateFacadeService,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
	) {
		this.init();
	}

	private async init() {
		await this.prefs.isReady();
		await this.gameStatus.isReady();
		await this.gameState.isReady();
		await this.allCards.waitForReady();

		this.prefs.preferences$$
			.pipe(
				map((prefs) => prefs.discordRichPresence),
				distinctUntilChanged(),
				switchMap((useRichPresence) => {
					// console.debug('[presence] new useRichPresence', useRichPresence);
					return !useRichPresence ? of({ enabled: false }) : this.buildPresence();
				}),
				// tap((update) => console.debug('[presence] new update', update)),
			)
			.subscribe(async (newPresence) => {
				// console.debug('[presence] new presence', newPresence);
				this.presence$$.next(newPresence);
			});
	}

	// TODO: support Arena (W-L), Battlegrounds (MMR), Mercs
	private buildPresence() {
		const metaData$ = this.gameState.gameState$$.pipe(
			auditTime(500),
			map((gameState) => gameState.metadata),
			distinctUntilChanged(),
			// tap((metadata) => console.debug('[presence] new metadata', metadata)),
			shareReplay(1),
		);
		const matchInfo$ = this.gameState.gameState$$.pipe(
			auditTime(500),
			map((gameState) => gameState.matchInfo),
			distinctUntilChanged(),
			// tap((matchInfo) => console.debug('[presence] new matchInfo', matchInfo)),
			shareReplay(1),
		);
		const playerHero$ = this.gameState.gameState$$.pipe(
			auditTime(500),
			map((gameState) => gameState.playerDeck?.hero?.cardId),
			distinctUntilChanged(),
			// tap((hero) => console.debug('[presence] new hero', hero)),
			shareReplay(1),
		);
		return combineLatest([
			this.gameStatus.inGame$$,
			//TODO: premium status. Wait until we migrate to tebex, so that we can use the refactored services?
			this.prefs.preferences$$.pipe(
				map((prefs) => ({
					enableCustomInGameText: prefs.discordRpcEnableCustomInGameText,
					enableCustomInMatchText: prefs.discordRpcEnableCustomInMatchText,
					gameText: prefs.discordRpcCustomInGameText,
					matchText: prefs.discordRpcCustomInMatchText,
				})),
				distinctUntilChanged(
					(a, b) =>
						a?.enableCustomInGameText === b?.enableCustomInGameText &&
						a?.gameText === b?.gameText &&
						a?.enableCustomInMatchText === b?.enableCustomInMatchText &&
						a?.matchText === b?.matchText,
				),
			),
			metaData$,
			matchInfo$,
			playerHero$,
		]).pipe(
			// tap((data) => console.debug('[presence] new data', data)),
			map(
				([
					inGame,
					{ enableCustomInGameText, enableCustomInMatchText, gameText, matchText },
					metaData,
					matchInfo,
					playerHero,
				]) => ({
					enabled: true,
					inGame: inGame ?? false,
					text: inGame
						? this.buildCustomText(
								enableCustomInGameText,
								enableCustomInMatchText,
								gameText,
								matchText,
								metaData,
								matchInfo,
								playerHero,
						  ) ?? IN_GAME_TEXT_PLACEHOLDER
						: null,
				}),
			),
		);
	}

	private buildCustomText(
		enableCustomInGameText: boolean | undefined,
		enableCustomInMatchText: boolean | undefined,
		gameText: string | null,
		matchText: string | null,
		metaData: Metadata | undefined,
		matchInfo: MatchInfo | undefined,
		playerHero: string | undefined,
		// additionalResult: string | undefined,
	): string | null | undefined {
		// console.debug(
		// 	'[presence] building custom text',
		// 	enableCustomInGameText,
		// 	enableCustomInMatchText,
		// 	gameText,
		// 	matchText,
		// 	metaData,
		// 	matchInfo,
		// 	playerHero,
		// );
		if (!enableCustomInGameText && !enableCustomInMatchText) {
			return null;
		}
		if (!enableCustomInMatchText || !metaData?.formatType || !metaData?.gameType) {
			return gameText;
		}

		const mode = this.i18n.translateString(`global.game-mode.${formatGameType(metaData.gameType)}`)!;
		const rank = !!matchInfo ? this.buildRankText(matchInfo, metaData) : '';
		// const [wins, losses] = additionalResult?.includes('-') ? additionalResult.split('-') : [null, null];
		const hero = this.allCards.getCard(playerHero ?? '')?.name ?? 'Unknown hero';
		const result = matchText
			?.replace('{rank}', rank ?? '')
			.replace('{mode}', mode)
			.replace('{hero}', hero);
		// console.debug('[presence] returning result', result, mode, rank, hero);
		return result;
		// .replace('{wins}', wins ?? '')
		// .replace('{losses}', losses ?? '');
	}

	private buildRankText(matchInfo: MatchInfo, metaData: Metadata): string | null {
		switch (metaData.gameType) {
			case GameType.GT_PVPDR:
			case GameType.GT_PVPDR_PAID:
				return this.i18n.translateString('settings.general.discord.in-game-text.mmr', {
					value: '???',
				});
			case GameType.GT_RANKED:
				return this.buildRankedRank(matchInfo.localPlayer, metaData.formatType);
			case GameType.GT_BATTLEGROUNDS:
			case GameType.GT_BATTLEGROUNDS_FRIENDLY:
			case GameType.GT_BATTLEGROUNDS_AI_VS_AI:
			case GameType.GT_BATTLEGROUNDS_PLAYER_VS_AI:
				return this.i18n.translateString('settings.general.discord.in-game-text.mmr', {
					value: '???',
				});
			case GameType.GT_BATTLEGROUNDS_DUO:
			case GameType.GT_BATTLEGROUNDS_DUO_VS_AI:
			case GameType.GT_BATTLEGROUNDS_DUO_FRIENDLY:
			case GameType.GT_BATTLEGROUNDS_DUO_AI_VS_AI:
				return this.i18n.translateString('settings.general.discord.in-game-text.mmr', {
					value: '???',
				});
			default:
				return null;
		}
	}

	private buildRankedRank(player: PlayerInfo, format: GameFormat): string | null {
		switch (format) {
			case GameFormat.FT_STANDARD:
				return this.toRankedString(player.standard);
			case GameFormat.FT_WILD:
				return this.toRankedString(player.wild);
			case GameFormat.FT_CLASSIC:
				return this.toRankedString(player.classic);
			case GameFormat.FT_TWIST:
				return this.toRankedString(player.twist);
			default:
				return null;
		}
	}

	private toRankedString(rank: Rank | undefined): string | null {
		if (!rank) {
			return 'Unknown rank';
		}
		if (rank.leagueId === 0) {
			return this.i18n.translateString('settings.general.discord.in-game-text.legend', { rank: rank.legendRank });
		} else {
			return this.i18n.translateString('settings.general.discord.in-game-text.rank', {
				league: this.i18n.translateString(`global.ranks.constructed.${this.rankToLeague(rank.leagueId)}`),
				rank: rank.rankValue,
			});
		}
	}

	private rankToLeague(rank: number): string | null {
		if (rank < 10) {
			return this.i18n.translateString('global.ranks.constructed.bronze');
		} else if (rank < 20) {
			return this.i18n.translateString('global.ranks.constructed.silver');
		} else if (rank < 30) {
			return this.i18n.translateString('global.ranks.constructed.gold');
		} else if (rank < 40) {
			return this.i18n.translateString('global.ranks.constructed.platinum');
		} else if (rank < 50) {
			return this.i18n.translateString('global.ranks.constructed.diamond');
		}
		return this.i18n.translateString('global.ranks.constructed.legend');
	}
}

export interface Presence {
	readonly enabled: boolean;
	readonly inGame?: boolean;
	readonly text?: string;
}
