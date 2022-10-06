import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameType, ReferenceCard } from '@firestone-hs/reference-data';
import { PresenceInfo } from '@firestone-hs/twitch-presence';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { toFormatType } from '../../../models/mainwindow/stats/stat-game-format.type';
import { toGameType } from '../../../models/mainwindow/stats/stat-game-mode.type';
import { isBattlegrounds, normalizeHeroCardId } from '../../../services/battlegrounds/bgs-utils';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { isMercenaries } from '../../../services/mercenaries/mercenaries-utils';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'live-stream-info',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/menu-selection.component.scss`,
		`../../../../css/component/streams/desktop/live-stream-info.component.scss`,
	],
	template: `
		<div class="stream-info">
			<div class="left-info">
				<rank-image class="rank-image" [stat]="rankInfoStat"></rank-image>
				<div class="group name">{{ streamerName }}</div>
				<stream-hero-infos class="group player-images" [stream]="_stream"></stream-hero-infos>
				<div class="group viewers" *ngIf="currentViewers != null">
					<span class="viewers-value">{{ currentViewers }}</span>
					<span class="viewers-text" [owTranslate]="'app.streams.current-viewers'"></span>
				</div>
			</div>
			<div
				class="watch-button"
				inlineSVG="assets/svg/TwitchGlitchPurple.svg"
				[helpTooltip]="watchTooltip"
				(click)="watchOnTwitch()"
			></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveStreamInfoComponent {
	@Input() set stream(value: PresenceInfo) {
		this._stream = value;
		this.rankInfoStat = GameStat.create({
			playerRank: value.playerRank,
			gameMode: toGameType(value.gameType),
			gameFormat: toFormatType(value.formatType),
		});
		this.streamerName = value.twitchUserName;
		this.currentViewers = value.viewer_count;
		console.debug('set stream info', value, this.rankInfoStat, this.streamerName);
	}

	_stream: PresenceInfo;

	rankInfoStat: GameStat;
	streamerName: string;
	currentViewers: number;
	watchTooltip = 'Watch on Twitch';

	constructor(private readonly ow: OverwolfService) {}

	watchOnTwitch() {
		this.ow.openUrlInDefaultBrowser(`https://www.twitch.tv/${this.streamerName}`);
	}
}

@Component({
	selector: 'stream-hero-infos',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/menu-selection.component.scss`,
		`../../../../css/component/streams/desktop/live-stream-info.component.scss`,
	],
	template: `
		<div class="stream-hero-infos" *ngIf="playerClassImage">
			<img class="player-class player" [src]="playerClassImage" [helpTooltip]="playerClassTooltip" />
			<div class="vs" *ngIf="opponentClassImage" [owTranslate]="'app.replays.replay-info.versus'"></div>
			<img
				class="player-class opponent"
				[src]="opponentClassImage"
				[helpTooltip]="opponentClassTooltip"
				*ngIf="opponentClassImage"
			/>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreamHeroInfosComponent {
	@Input() set stream(value: PresenceInfo) {
		[this.playerClassImage, this.playerClassTooltip] = this.buildPlayerImage(value.playerCardId, value.gameType);
		if (!isBattlegrounds(value.gameType) && !isMercenaries(value.gameType)) {
			[this.opponentClassImage, this.opponentClassTooltip] = this.buildPlayerImage(
				value.opponentCardId,
				value.gameType,
			);
		}
		console.debug('set stream info', value);
	}

	playerClassImage: string;
	playerClassTooltip: string;
	opponentClassImage: string;
	opponentClassTooltip: string;

	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: LocalizationFacadeService) {}

	private buildPlayerImage(cardId: string, gameType: GameType): [string, string] {
		if (!cardId) {
			return [null, null];
		}

		if (isBattlegrounds(gameType)) {
			const normalizedCardId = normalizeHeroCardId(cardId, this.allCards);
			const heroCard: ReferenceCard = this.allCards.getCard(normalizedCardId);
			return [`https://static.zerotoheroes.com/hearthstone/cardart/256x/${heroCard.id}.jpg`, heroCard.name];
		} else if (isMercenaries(gameType)) {
			return [null, null];
		} else {
			const heroCard: ReferenceCard = this.allCards.getCard(cardId);
			return [
				`https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${heroCard.playerClass?.toLowerCase()}.png`,
				this.i18n.translateString(`global.class.${heroCard.playerClass.toLowerCase()}`),
			];
		}
	}
}
