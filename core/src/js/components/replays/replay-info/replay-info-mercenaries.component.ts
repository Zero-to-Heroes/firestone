import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ScenarioId } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { combineLatest, Observable } from 'rxjs';
import { RunStep } from '../../../models/duels/run-step';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { StatGameModeType } from '../../../models/mainwindow/stats/stat-game-mode.type';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { getHeroRole, normalizeMercenariesCardId } from '../../../services/mercenaries/mercenaries-utils';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { capitalizeEachWord } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';
import { extractTime } from './replay-info-ranked.component';

@Component({
	selector: 'replay-info-mercenaries',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/replays/replay-info/replay-info.component.scss`,
		`../../../../css/component/replays/replay-info/replay-info-mercenaries.component.scss`,
	],
	template: `
		<div
			class="replay-info mercenaries {{ visualResult }}"
			[ngClass]="{ 'show-merc-details': showMercDetails$ | async }"
		>
			<div class="result-color-code {{ visualResult }}"></div>

			<div class="left-info">
				<div class="group mode">
					<rank-image class="player-rank" [stat]="replayInfo" [gameMode]="gameMode"></rank-image>
				</div>

				<div class="group mercenaries-player-images">
					<div class="images">
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
					</div>
					<div class="player-name opponent" *ngIf="opponentName">{{ opponentName }}</div>
				</div>

				<div
					class="group mmr"
					[ngClass]="{ 'positive': deltaMmr > 0, 'negative': deltaMmr < 0 }"
					*ngIf="deltaMmr != null"
				>
					<div class="value">{{ deltaMmr }}</div>
					<div class="text" [owTranslate]="'app.replays.replay-info.mmr'"></div>
				</div>

				<div class="group time" *ngIf="gameTime && displayTime">
					<div class="value">{{ gameTime }}</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayInfoMercenariesComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showMercDetails$: Observable<boolean>;

	@Input() showStatsLabel = this.i18n.translateString('app.replays.replay-info.show-stats-button');
	@Input() showReplayLabel = this.i18n.translateString('app.replays.replay-info.watch-replay-button');
	@Input() displayTime = true;

	@Input() set replay(value: GameStat | RunStep) {
		this.replayInfo = value;
		this.updateInfo();
	}

	replayInfo: GameStat;

	visualResult: string;
	gameMode: StatGameModeType;

	playerStartingTeam: readonly MercenaryHero[];
	playerBench: readonly MercenaryHero[];
	opponentStartingTeam: readonly MercenaryHero[];
	opponentBench: readonly MercenaryHero[];

	opponentName: string;
	reviewId: string;
	deltaMmr: number;
	gameTime: string;

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
		this.showMercDetails$ = combineLatest(
			this.listenForBasicPref$((prefs) => prefs.replaysActiveGameModeFilter),
			this.listenForBasicPref$((prefs) => prefs.replaysShowMercDetails),
		).pipe(
			this.mapData(([gameModeFilter, showDetails]) => {
				return showDetails && gameModeFilter?.startsWith('mercenaries');
			}),
		);
	}

	capitalize(input: string): string {
		return capitalizeEachWord(input);
	}

	private updateInfo() {
		if (!this.replayInfo) {
			return;
		}
		this.gameMode = this.replayInfo.gameMode;
		this.playerBench = this.buildPlayerTeam(this.replayInfo, true, false);
		this.playerStartingTeam = this.buildPlayerTeam(this.replayInfo, true, true);
		this.opponentStartingTeam = this.buildPlayerTeam(this.replayInfo, false, true);
		this.opponentBench = this.buildPlayerTeam(this.replayInfo, false, false);

		this.reviewId = this.replayInfo.reviewId;

		this.opponentName =
			this.replayInfo.scenarioId === ScenarioId.LETTUCE_PVP_VS_AI
				? this.i18n.translateString('app.replays.replay-info.mercenaries-bot-opponent-name')
				: this.sanitizeName(this.replayInfo.opponentName);
		this.visualResult = this.replayInfo.result;
		this.gameTime = this.i18n.translateString('global.duration', {
			...extractTime(this.replayInfo.gameDurationSeconds),
		});
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
						? `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_golden_${role}.png`
						: `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_neutral.png`,
					role: role,
				};
			});
	}

	private sanitizeName(name: string) {
		if (!name || name.indexOf('#') === -1) {
			return name;
		}
		return name.split('#')[0];
	}
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
					src="https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_equipment_frame.png"
				/>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayInfoMercPlayerComponent {
	@Input() hero: MercenaryHero;
}
