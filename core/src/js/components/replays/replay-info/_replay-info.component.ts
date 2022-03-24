import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Input,
	OnDestroy,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ReferenceCard, ScenarioId } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { RunStep } from '../../../models/duels/run-step';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { StatGameModeType } from '../../../models/mainwindow/stats/stat-game-mode.type';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { ShowReplayEvent } from '../../../services/mainwindow/store/events/replays/show-replay-event';
import { TriggerShowMatchStatsEvent } from '../../../services/mainwindow/store/events/replays/trigger-show-match-stats-event';
import {
	getHeroRole,
	isMercenaries,
	normalizeMercenariesCardId,
} from '../../../services/mercenaries/mercenaries-utils';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { capitalizeEachWord } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

declare let amplitude;
@Component({
	selector: 'replay-info',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/replays/replay-info/replay-info.component.scss`,
	],
	template: `
		<replay-info-ranked
			*ngIf="gameMode === 'ranked'"
			[showStatsLabel]="showStatsLabel"
			[showReplayLabel]="showReplayLabel"
			[displayCoin]="displayCoin"
			[replay]="replayInfo"
		></replay-info-ranked>
		<replay-info-battlegrounds
			*ngIf="gameMode === 'battlegrounds'"
			[showStatsLabel]="showStatsLabel"
			[showReplayLabel]="showReplayLabel"
			[replay]="replayInfo"
		></replay-info-battlegrounds>
		<div
			*ngIf="gameMode !== 'ranked' && gameMode !== 'battlegrounds'"
			class="replay-info {{ gameMode }} {{ visualResult }}"
			[ngClass]="{
				'mercenaries': isMercenariesGame,
				'show-merc-details': showMercDetails$ | async
			}"
		>
			<div class="result-color-code {{ visualResult }}"></div>

			<div class="left-info">
				<div class="group mode">
					<rank-image class="player-rank" [stat]="replayInfo" [gameMode]="gameMode"></rank-image>
				</div>

				<div class="group player-images" *ngIf="!isMercenariesGame">
					<img class="player-class player" [src]="playerClassImage" [helpTooltip]="playerClassTooltip" />
					<div class="vs" *ngIf="opponentClassImage" [owTranslate]="'app.replays.replay-info.versus'"></div>
					<img
						class="player-class opponent"
						[src]="opponentClassImage"
						[helpTooltip]="opponentClassTooltip"
						*ngIf="opponentClassImage"
					/>
					<div class="player-name opponent" *ngIf="opponentName">{{ opponentName }}</div>
				</div>

				<div class="group mercenaries-player-images" *ngIf="isMercenariesGame">
					<replay-info-merc-player
						class="portrait player bench"
						*ngFor="let hero of playerBench"
						[hero]="hero"
					></replay-info-merc-player>
					<replay-info-merc-player
						class="portrait player"
						*ngFor="let hero of playerStartingTeam"
						[hero]="hero"
					></replay-info-merc-player>
					<div class="vs" [owTranslate]="'app.replays.replay-info.versus' | owTranslate"></div>
					<replay-info-merc-player
						class="portrait opponent"
						*ngFor="let hero of opponentStartingTeam"
						[hero]="hero"
					></replay-info-merc-player>
					<replay-info-merc-player
						class="portrait opponent bench"
						*ngFor="let hero of opponentBench"
						[hero]="hero"
					></replay-info-merc-player>
					<div class="player-name opponent" *ngIf="opponentName">{{ opponentName }}</div>
				</div>

				<div class="group loot" *ngIf="_displayLoot && loots?.length">
					<div
						class="icon"
						inlineSVG="assets/svg/loot.svg"
						[helpTooltip]="'app.replays.loot-icon-tooltip' | owTranslate"
					></div>
					<img *ngFor="let loot of loots" class="pick" [src]="loot.icon" [cardTooltip]="loot.cardId" />
				</div>

				<div class="group short-loot" *ngIf="!_displayLoot && _displayShortLoot && loots?.length">
					<div
						class="icon"
						inlineSVG="assets/svg/loot.svg"
						[helpTooltip]="'app.replays.loot-icon-tooltip' | owTranslate"
					></div>
					<img *ngFor="let loot of loots" class="pick" [src]="loot.icon" [cardTooltip]="loot.cardId" />
				</div>

				<div class="group treasure" *ngIf="_displayLoot && treasure">
					<div
						class="icon"
						inlineSVG="assets/svg/treasure.svg"
						[helpTooltip]="'app.replays.treasure-icon-tooltip' | owTranslate"
					></div>
					<img class="pick" [src]="treasure.icon" [cardTooltip]="treasure.cardId" />
				</div>

				<div class="group short-treasure" *ngIf="!_displayLoot && _displayShortLoot && treasure">
					<div
						class="icon"
						inlineSVG="assets/svg/treasure.svg"
						[helpTooltip]="'app.replays.treasure-icon-tooltip' | owTranslate"
					></div>
					<img class="pick" [src]="treasure.icon" [cardTooltip]="treasure.cardId" />
				</div>

				<div
					class="group mmr"
					[ngClass]="{ 'positive': deltaMmr > 0, 'negative': deltaMmr < 0 }"
					*ngIf="deltaMmr != null"
				>
					<div class="value">{{ deltaMmr }}</div>
					<div class="text" [owTranslate]="'app.replays.replay-info.mmr'"></div>
				</div>

				<div class="group coin" *ngIf="displayCoin && playCoinIconSvg && !isMercenariesGame">
					<div
						class="play-coin-icon icon"
						[innerHTML]="playCoinIconSvg"
						[helpTooltip]="playCoinTooltip"
					></div>
				</div>
			</div>

			<div class="right-info">
				<div class="replay" *ngIf="reviewId" (click)="showReplay()">
					<div class="watch" *ngIf="showReplayLabel">{{ showReplayLabel }}</div>
					<div
						class="watch-icon"
						[helpTooltip]="
							!showReplayLabel
								? ('app.replays.replay-info.watch-replay-button-tooltip' | owTranslate)
								: null
						"
					>
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/replays/replays_icons.svg#match_watch" />
						</svg>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayInfoComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	showMercDetails$: Observable<boolean>;

	@Input() showStatsLabel = this.i18n.translateString('app.replays.replay-info.show-stats-button');
	@Input() showReplayLabel = this.i18n.translateString('app.replays.replay-info.watch-replay-button');
	@Input() displayCoin = true;
	@Input() set replay(value: GameStat | RunStep) {
		this.replayInfo = value;
		this.updateInfo();
	}
	@Input() set displayLoot(value: boolean) {
		this._displayLoot = value;
		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr.detectChanges();
		// }
	}
	@Input() set displayShortLoot(value: boolean) {
		this._displayShortLoot = value;
		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr.detectChanges();
		// }
	}

	replayInfo: GameStat;
	replaysShowClassIcon: boolean;

	_displayLoot: boolean;
	_displayShortLoot: boolean;

	visualResult: string;
	gameMode: StatGameModeType;
	isMercenariesGame: boolean;
	// deckName: string;
	playerClassImage: string;
	playerClassTooltip: string;
	opponentClassImage: string;
	opponentClassTooltip: string;

	playerStartingTeam: readonly MercenaryHero[];
	playerBench: readonly MercenaryHero[];
	opponentStartingTeam: readonly MercenaryHero[];
	opponentBench: readonly MercenaryHero[];

	opponentName: string;
	playCoinIconSvg: SafeHtml;
	playCoinTooltip: SafeHtml;
	reviewId: string;
	deltaMmr: number;

	treasure: InternalLoot;
	loots: InternalLoot[];

	private sub$$: Subscription;

	constructor(
		private readonly sanitizer: DomSanitizer,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.sub$$ = this.listenForBasicPref$((prefs) => prefs.replaysShowClassIcon).subscribe(
			(replaysShowClassIcon) => {
				this.replaysShowClassIcon = replaysShowClassIcon;
				this.updateInfo();
			},
		);
		this.showMercDetails$ = combineLatest(
			this.listenForBasicPref$((prefs) => prefs.replaysActiveGameModeFilter),
			this.listenForBasicPref$((prefs) => prefs.replaysShowMercDetails),
		).pipe(this.mapData(([gameMode, showDetails]) => showDetails && gameMode?.startsWith('mercenaries')));
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		super.ngOnDestroy();
		this.sub$$.unsubscribe();
	}

	showReplay() {
		this.store.send(new ShowReplayEvent(this.reviewId));
	}

	showStats() {
		this.store.send(new TriggerShowMatchStatsEvent(this.reviewId));
	}

	capitalize(input: string): string {
		return capitalizeEachWord(input);
	}

	private updateInfo() {
		if (!this.replayInfo) {
			return;
		}
		this.gameMode = this.replayInfo.gameMode;
		this.isMercenariesGame = isMercenaries(this.gameMode);
		[this.playerClassImage, this.playerClassTooltip] = this.buildPlayerClassImage(
			this.replayInfo,
			true,
			this.replaysShowClassIcon,
		);
		[this.opponentClassImage, this.opponentClassTooltip] = this.buildPlayerClassImage(
			this.replayInfo,
			false,
			this.replaysShowClassIcon,
		);
		this.playerBench = this.buildPlayerTeam(this.replayInfo, true, false);
		this.playerStartingTeam = this.buildPlayerTeam(this.replayInfo, true, true);
		this.opponentStartingTeam = this.buildPlayerTeam(this.replayInfo, false, true);
		this.opponentBench = this.buildPlayerTeam(this.replayInfo, false, false);

		[this.playCoinIconSvg, this.playCoinTooltip] = this.buildPlayCoinIconSvg(this.replayInfo);
		this.reviewId = this.replayInfo.reviewId;

		this.opponentName =
			this.isMercenariesGame && this.replayInfo.scenarioId === ScenarioId.LETTUCE_PVP_VS_AI
				? this.i18n.translateString('app.replays.replay-info.mercenaries-bot-opponent-name')
				: this.sanitizeName(this.replayInfo.opponentName);
		this.visualResult = this.replayInfo.result;
		this.loots = [];
		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr.detectChanges();
		// }

		// setTimeout(() => {
		const isDuelsInfo = (value: any): value is RunStep =>
			(this.replayInfo as RunStep).treasureCardId !== undefined ||
			(this.replayInfo as RunStep).lootCardIds !== undefined;
		if (isDuelsInfo(this.replayInfo)) {
			if (this.replayInfo.treasureCardId) {
				this.treasure = {
					cardId: this.replayInfo.treasureCardId,
					icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${this.replayInfo.treasureCardId}.jpg`,
				};
			}
			if (this.replayInfo.lootCardIds?.length) {
				this.loots = this.replayInfo.lootCardIds.map((loot) => ({
					cardId: loot,
					icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${loot}.jpg`,
				}));
			}
			// if (!(this.cdr as ViewRef)?.destroyed) {
			// 	this.cdr.detectChanges();
			// }
		}
		// });
	}

	private buildPlayerClassImage(info: GameStat, isPlayer: boolean, replaysShowClassIcon: boolean): [string, string] {
		const heroCard: ReferenceCard = isPlayer
			? this.allCards.getCard(info.playerCardId)
			: this.allCards.getCard(info.opponentCardId);
		const name = heroCard.name;
		const deckName = info.playerDeckName
			? this.i18n.translateString('app.replays.replay-info.deck-name-tooltip', {
					value: decodeURIComponent(info.playerDeckName),
			  })
			: '';
		const tooltip = isPlayer ? name + deckName : null;
		if (replaysShowClassIcon) {
			const image = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${heroCard.playerClass?.toLowerCase()}.png`;
			return [image, tooltip];
		} else {
			const image = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${heroCard.id}.jpg`;
			return [image, tooltip];
		}
	}

	private buildPlayerTeam(info: GameStat, isPlayer: boolean, isStarter: boolean): readonly MercenaryHero[] {
		if (!info.gameMode || !info.gameMode?.startsWith('mercenaries')) {
			return [];
		}

		const heroTimings = isPlayer ? info.mercHeroTimings : info.mercOpponentHeroTimings;
		if (!heroTimings?.length) {
			return [];
		}

		const equipments = isPlayer ? info.mercEquipments : info.mercOpponentEquipments;

		return heroTimings
			.filter((timing) => (isStarter ? timing.turnInPlay === 1 : timing.turnInPlay !== 1))
			.map((timing) => {
				const initialRole = this.allCards.getCard(timing.cardId).mercenaryRole;
				const role = initialRole ? getHeroRole(initialRole) : null;
				const equipment = (equipments ?? []).find(
					(equip) =>
						normalizeMercenariesCardId(equip.mercCardId) === normalizeMercenariesCardId(timing.cardId),
				);
				return {
					cardId: timing.cardId,
					portraitUrl: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${timing.cardId}.jpg`,
					equipmentCardId: equipment?.equipmentCardId,
					equipmentUrl: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${equipment?.equipmentCardId}.jpg`,
					frameUrl: role
						? `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_golden_${role}.png?v=2`
						: `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_neutral.png?v=3`,
					role: role,
				};
			});
	}

	private buildPlayCoinIconSvg(info: GameStat): [SafeHtml, string] {
		const iconName = info.coinPlay === 'coin' ? 'match_coin' : 'match_play';
		const tooltip =
			info.coinPlay === 'coin'
				? this.i18n.translateString('app.replays.replay-info.went-second-tooltip')
				: this.i18n.translateString('app.replays.replay-info.went-first-tooltip');
		return [
			this.sanitizer.bypassSecurityTrustHtml(`
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/replays/replays_icons.svg#${iconName}"/>
				</svg>
			`),
			tooltip,
		];
	}

	private sanitizeName(name: string) {
		if (!name || name.indexOf('#') === -1) {
			return name;
		}
		return name.split('#')[0];
	}
}

interface InternalLoot {
	icon: string;
	cardId: string;
}

interface MercenaryHero {
	readonly cardId: string;
	readonly portraitUrl: string;
	readonly equipmentCardId: string;
	readonly equipmentUrl: string;
	readonly frameUrl: string;
	readonly role: 'caster' | 'fighter' | 'protector';
}

@Component({
	selector: 'replay-info-merc-player',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/replays/replay-info/replay-info.component.scss`,
	],
	template: `
		<div class="merc-portrait player" [cardTooltip]="hero.cardId">
			<img class="icon" [src]="hero.portraitUrl" />
			<img class="frame" [src]="hero.frameUrl" />
			<div class="equipment" [cardTooltip]="hero.equipmentCardId" *ngIf="hero.equipmentCardId">
				<img class="icon" [src]="hero.equipmentUrl" />
				<img
					class="frame"
					src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_equipment_frame.png?v=3"
				/>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayInfoMercPlayerComponent {
	@Input() hero: MercenaryHero;
}
