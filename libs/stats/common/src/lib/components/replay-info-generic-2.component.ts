/* eslint-disable no-mixed-spaces-and-tabs */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ReferenceCard } from '@firestone-hs/reference-data';
import {
	AbstractSubscriptionComponent,
	capitalizeEachWord,
	capitalizeFirstLetter,
} from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameStat, StatGameModeType } from '@firestone/stats/data-access';

@Component({
	selector: 'replay-info-generic-2',
	styleUrls: [`./replay-info.component.scss`],
	template: `
		<div class="replay-info {{ gameMode }} {{ visualResult }}">
			<div class="result-color-code {{ visualResult }}"></div>

			<div class="left-info">
				<div class="group mode">
					<rank-image class="player-rank" [stat]="replayInfo" [gameMode]="gameMode"></rank-image>
				</div>

				<div class="group player-images">
					<img class="player-class player" [src]="playerClassImage" [helpTooltip]="playerClassTooltip" />
					<div class="vs" *ngIf="opponentClassImage" [fsTranslate]="'app.replays.replay-info.versus'"></div>
					<img
						class="player-class opponent"
						[src]="opponentClassImage"
						[helpTooltip]="opponentClassTooltip"
						*ngIf="opponentClassImage"
					/>
					<div class="player-name opponent" *ngIf="opponentName">{{ opponentName }}</div>
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

			<!-- <div class="right-info">
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
			</div> -->
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayInfoGeneric2Component extends AbstractSubscriptionComponent {
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

	playCoinIconSvg: SafeHtml;
	playCoinTooltip: SafeHtml | null;
	reviewId: string;
	gameTime: string | null;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly sanitizer: DomSanitizer,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr);
	}

	capitalize(input: string): string | null {
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
		this.gameTime = this.i18n.translateString('global.duration.min-sec', {
			...extractTime(this.replayInfo.gameDurationSeconds),
		});
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

		const encodedDeckName = info.playerDeckName ?? '';
		let decodedTeamName: string | null = null;
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

	private buildPlayCoinIconSvg(info: GameStat): [SafeHtml, string | null] {
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

export const extractTime = (durationInSeconds: number): { min: string; sec: string } => {
	const seconds = `${durationInSeconds % 60}`.padStart(2, '0');
	const minutes = `${Math.floor((durationInSeconds - (durationInSeconds % 60)) / 60)}`;
	return {
		min: minutes,
		sec: seconds,
	};
};
