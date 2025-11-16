import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { PreferencesService } from '@firestone/shared/common/service';
import { capitalizeFirstLetter } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameStat, StatGameModeType } from '@firestone/stats/data-access';
import { Subscription } from 'rxjs';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { ShowReplayEvent } from '../../../services/mainwindow/store/events/replays/show-replay-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { capitalizeEachWord } from '../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';
import { extractTime } from './replay-info-ranked.component';

@Component({
	standalone: false,
	selector: 'replay-info-generic',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/replays/replay-info/replay-info.component.scss`,
	],
	template: `
		<div class="replay-info {{ gameMode }} {{ visualResult }}">
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
					<div class="player-name opponent" *ngIf="opponentName" [helpTooltip]="opponentBattleTag">
						{{ opponentName }}
					</div>
				</div>

				<div class="group coin" *ngIf="displayCoin && playCoinIconSvg">
					<div
						class="play-coin-icon icon"
						[innerHTML]="playCoinIconSvg"
						[helpTooltip]="playCoinTooltip"
					></div>
				</div>

				<div class="group time" *ngIf="gameTime && displayTime" [helpTooltip]="replayDate">
					<div class="value">{{ gameTime }}</div>
				</div>
			</div>

			<div class="right-info">
				<watch-replay-button
					class=""
					*ngIf="reviewId"
					[reviewId]="reviewId"
					[showReplayEvent]="showReplay"
				></watch-replay-button>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayInfoGenericComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, OnDestroy
{
	@Input() showStatsLabel = this.i18n.translateString('app.replays.replay-info.show-stats-button');
	@Input() showReplayLabel = this.i18n.translateString('app.replays.replay-info.watch-replay-button');
	@Input() displayCoin = true;
	@Input() displayTime = true;

	@Input() set replay(value: GameStat) {
		this.replayInfo = value;
		this.updateInfo();
	}

	gameMode: StatGameModeType;

	replayInfo: GameStat;
	visualResult: string;

	replaysShowClassIcon: boolean;
	playerClassImage: string;
	playerClassTooltip: string;
	opponentClassImage: string;
	opponentClassTooltip: string;
	opponentName: string;
	opponentBattleTag: string;
	playCoinIconSvg: SafeHtml;
	playCoinTooltip: SafeHtml;
	reviewId: string;
	gameTime: string;
	replayDate: string;

	private sub$$: Subscription;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly sanitizer: DomSanitizer,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await this.prefs.isReady();

		this.sub$$ = this.prefs.preferences$$
			.pipe(this.mapData((prefs) => prefs.replaysShowClassIcon))
			.subscribe((replaysShowClassIcon) => {
				this.replaysShowClassIcon = replaysShowClassIcon;
				this.updateInfo();
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		super.ngOnDestroy();
		this.sub$$?.unsubscribe();
	}

	showReplay = () => {
		this.store.send(new ShowReplayEvent(this.reviewId));
	};

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
		this.opponentBattleTag = this.replayInfo.opponentName;
		this.visualResult = this.replayInfo.result;
		this.gameTime = this.i18n.translateString('global.duration.min-sec', {
			...extractTime(this.replayInfo.gameDurationSeconds),
		});
		this.replayDate = new Date(this.replayInfo.creationTimestamp).toLocaleString(this.i18n.formatCurrentLocale());
	}

	private buildPlayerClassImage(info: GameStat, isPlayer: boolean, replaysShowClassIcon: boolean): [string, string] {
		const heroCard: ReferenceCard = isPlayer
			? this.allCards.getCard(info.playerCardId)
			: this.allCards.getCard(info.opponentCardId);
		let name = heroCard.name;
		if (!replaysShowClassIcon) {
			const className = capitalizeFirstLetter(
				this.i18n.translateString(`global.class.${heroCard.classes?.[0]?.toLowerCase()}`),
			);
			name += ` (${className})`;
		}

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
