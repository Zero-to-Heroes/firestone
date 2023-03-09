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
import { ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameStat, StatGameModeType } from '@firestone/stats/data-access';
import { Subscription } from 'rxjs';
import { RunStep } from '../../../models/duels/run-step';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { ShowReplayEvent } from '../../../services/mainwindow/store/events/replays/show-replay-event';
import { TriggerShowMatchStatsEvent } from '../../../services/mainwindow/store/events/replays/trigger-show-match-stats-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { capitalizeEachWord } from '../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';
import { extractTime } from './replay-info-ranked.component';

@Component({
	selector: 'replay-info-duels',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/replays/replay-info/replay-info.component.scss`,
	],
	template: `
		<div class="replay-info duels {{ visualResult }}">
			<div class="result-color-code {{ visualResult }}"></div>

			<div class="left-info">
				<div class="group mode">
					<rank-image class="player-rank" [stat]="replayInfo" [gameMode]="gameMode"></rank-image>
				</div>

				<div class="group player-images">
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

				<div class="group loot" *ngIf="displayLoot && loots?.length">
					<div
						class="icon"
						inlineSVG="assets/svg/loot.svg"
						[helpTooltip]="'app.replays.replay-info.loot-icon-tooltip' | owTranslate"
					></div>
					<img *ngFor="let loot of loots" class="pick" [src]="loot.icon" [cardTooltip]="loot.cardId" />
				</div>

				<div class="group short-loot" *ngIf="!displayLoot && displayShortLoot && loots?.length">
					<div
						class="icon"
						inlineSVG="assets/svg/loot.svg"
						[helpTooltip]="'app.replays.replay-info.loot-icon-tooltip' | owTranslate"
					></div>
					<img *ngFor="let loot of loots" class="pick" [src]="loot.icon" [cardTooltip]="loot.cardId" />
				</div>

				<div class="group treasure" *ngIf="displayLoot && treasure">
					<div
						class="icon"
						inlineSVG="assets/svg/treasure.svg"
						[helpTooltip]="'app.replays.replay-info.treasure-icon-tooltip' | owTranslate"
					></div>
					<img class="pick" [src]="treasure.icon" [cardTooltip]="treasure.cardId" />
				</div>

				<div class="group short-treasure" *ngIf="!displayLoot && displayShortLoot && treasure">
					<div
						class="icon"
						inlineSVG="assets/svg/treasure.svg"
						[helpTooltip]="'app.replays.replay-info.treasure-icon-tooltip' | owTranslate"
					></div>
					<img class="pick" [src]="treasure.icon" [cardTooltip]="treasure.cardId" />
				</div>

				<div class="group coin" *ngIf="displayCoin && playCoinIconSvg">
					<div
						class="play-coin-icon icon"
						[innerHTML]="playCoinIconSvg"
						[helpTooltip]="playCoinTooltip"
					></div>
				</div>

				<div class="group time" *ngIf="gameTime && displayTime">
					<div class="value">{{ gameTime }}</div>
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
export class ReplayInfoDuelsComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, OnDestroy
{
	@Input() showStatsLabel = this.i18n.translateString('app.replays.replay-info.show-stats-button');
	@Input() showReplayLabel = this.i18n.translateString('app.replays.replay-info.watch-replay-button');
	@Input() displayCoin = true;
	@Input() displayTime = true;
	@Input() displayLoot: boolean;
	@Input() displayShortLoot: boolean;

	@Input() set replay(value: GameStat | RunStep) {
		this.replayInfo = value;
		this.updateInfo();
	}

	replayInfo: GameStat;
	replaysShowClassIcon: boolean;

	visualResult: string;
	gameMode: StatGameModeType;
	playerClassImage: string;
	playerClassTooltip: string;
	opponentClassImage: string;
	opponentClassTooltip: string;

	opponentName: string;
	playCoinIconSvg: SafeHtml;
	playCoinTooltip: SafeHtml;
	reviewId: string;
	gameTime: string;

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

		[this.playCoinIconSvg, this.playCoinTooltip] = this.buildPlayCoinIconSvg(this.replayInfo);
		this.reviewId = this.replayInfo.reviewId;

		this.opponentName = this.sanitizeName(this.replayInfo.opponentName);
		this.visualResult = this.replayInfo.result;
		this.loots = [];
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
		}
		this.gameTime = this.i18n.translateString('global.duration.min-sec', {
			...extractTime(this.replayInfo.gameDurationSeconds),
		});
	}

	private buildPlayerClassImage(info: GameStat, isPlayer: boolean, replaysShowClassIcon: boolean): [string, string] {
		const heroCard: ReferenceCard = isPlayer
			? this.allCards.getCard(info.playerCardId)
			: this.allCards.getCard(info.opponentCardId);
		const name = heroCard.name;
		const encodedDeckName = info.playerDeckName;
		let decodedTeamName: string = null;
		try {
			decodedTeamName = decodeURIComponent(encodedDeckName);
		} catch (e) {
			console.error('Could not decode deck name', encodedDeckName, e);
		}
		const deckName = info.playerDeckName
			? this.i18n.translateString('app.replays.replay-info.deck-name-tooltip', {
					value: decodedTeamName,
			  })
			: '';
		const tooltip = isPlayer ? `${name} ${deckName}` : `${name}`;
		if (replaysShowClassIcon) {
			const image = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${heroCard.playerClass?.toLowerCase()}.png`;
			return [image, tooltip];
		} else {
			const image = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${heroCard.id}.jpg`;
			return [image, tooltip];
		}
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
