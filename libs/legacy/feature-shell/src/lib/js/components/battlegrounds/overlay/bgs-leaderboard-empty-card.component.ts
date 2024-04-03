import { ComponentType } from '@angular/cdk/portal';
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { getTribeIcon } from '@firestone-hs/reference-data';
import { BgsPlayer, QuestReward } from '@firestone/battlegrounds/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService, OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, takeUntil } from 'rxjs';
import { AdService } from '../../../services/ad.service';
import { BgsOverlayHeroOverviewComponent } from './bgs-overlay-hero-overview.component';

@Component({
	selector: 'bgs-leaderboard-empty-card',
	styleUrls: ['../../../../css/component/battlegrounds/overlay/bgs-leaderboard-empty-card.component.scss'],
	template: `
		<div class="card">
			<div
				class="mouse-leave-container"
				componentTooltip
				[componentType]="componentType"
				[componentInput]="opponentBoardMouseOver ? _bgsPlayer : null"
				[componentTooltipPosition]="position"
			>
				<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
				<div
					class="last-opponent-icon"
					*ngIf="isLastOpponent && showLastOpponentIcon"
					[helpTooltip]="'battlegrounds.in-game.opponents.last-opponent-icon-tooltip' | owTranslate"
					inlineSVG="assets/svg/last_opponent.svg"
				></div>
				<div class="name-container" *ngIf="showMmr$ | async">
					<div class="name">{{ _bgsPlayer?.player?.name }}</div>
					<div class="mmr" *ngIf="mmr">{{ mmr }}</div>
				</div>

				<bgs-hero-short-recap
					class="short-recap"
					[ngClass]="{ active: showLiveInfo$ | async }"
					[buddiesEnabled]="buddiesEnabled"
					[tavernTier]="tavernTier"
					[triples]="triples"
					[winStreak]="winStreak"
					[tribeImage]="tribeImage"
					[tribeCount]="tribeCount"
					[damage]="damage"
					[questRewards]="questRewards"
					[buddyImage]="buddyImage"
					[buddyClass]="buddyClass"
				></bgs-hero-short-recap>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsLeaderboardEmptyCardComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, OnDestroy
{
	componentType: ComponentType<BgsOverlayHeroOverviewComponent> = BgsOverlayHeroOverviewComponent;
	showLiveInfo$: Observable<boolean>;
	showMmr$: Observable<boolean>;

	showLiveInfo = new BehaviorSubject<boolean>(false);

	@Input() set currentTurn(value: number) {
		if (this._currentTurn === value) {
			return;
		}
		this._currentTurn = value;
		this.updateInfo();
	}

	@Input() set lastOpponentPlayerId(value: number) {
		if (this._lastOpponentPlayerId === value) {
			return;
		}
		this._lastOpponentPlayerId = value;
		this.updateInfo();
	}

	@Input() set bgsPlayer(value: BgsPlayer) {
		if (this._previousPlayer === value) {
			return;
		}
		this._previousPlayer = value;
		this.updateInfo();
	}

	@Input() showLastOpponentIcon: boolean;
	@Input() opponentBoardMouseOver: boolean;
	@Input() buddiesEnabled: boolean;

	position: 'global-top-center' | 'global-top-left' | 'global-bottom-left' | 'right' = 'global-top-left';

	componentClass: string;
	_bgsPlayer: {
		player: BgsPlayer;
		config: {
			hasBuddies: boolean;
		};
		currentTurn: number;
		isLastOpponent: boolean;
		additionalClasses: string;
	};

	_previousPlayer: BgsPlayer;
	_currentTurn: number;
	_lastOpponentPlayerId: number;
	isLastOpponent: boolean;

	tavernTier: number;
	triples: number;
	triplesImage = 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs_leaderboard_triple.png';
	winStreak: number;
	winStreakImage = 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs_leaderboard_winstreak.png';
	tribeCount: number;
	tribeImage: string;
	damageImage = 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs_leaderboard_damage.png';
	damage: number;

	mmr: string;

	questRewards: readonly QuestReward[];

	buddyImage: string;
	buddyClass: string;

	private callbackHandle;
	private isPremiumUser: boolean;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly ow: OverwolfService,
		private readonly i18n: ILocalizationService,
		private readonly prefs: PreferencesService,
		private readonly ads: AdService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.prefs.isReady();
		await this.ads.isReady();

		this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsOpponentOverlayAtTop)).subscribe((value) => {
			this.position = value ? 'global-top-left' : 'global-bottom-left';
			this.componentClass = value ? null : 'bottom';
			this.updateInfo();
		});

		this.ads.enablePremiumFeatures$$.pipe(takeUntil(this.destroyed$)).subscribe((premium) => {
			// console.debug('isPremiumUser', premium);
			this.isPremiumUser = premium;
		});
		this.showLiveInfo$ = this.showLiveInfo.pipe(this.mapData((info) => info));
		this.callbackHandle = this.ow.addHotKeyHoldListener(
			'live-info',
			() => this.onTabDown(),
			() => this.onTabUp(),
		);
		this.showMmr$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.bgsUseLeaderboardDataInOverlay && prefs.bgsShowMmrInLeaderboardOverlay),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngOnDestroy(): void {
		super.ngOnDestroy();
		if (this.callbackHandle) {
			this.ow.removeHotKeyHoldListener(this.callbackHandle);
		}
	}

	private onTabDown() {
		if (this.isPremiumUser) {
			this.showLiveInfo.next(true);
		}
	}

	private onTabUp() {
		this.showLiveInfo.next(false);
	}

	private updateInfo() {
		if (!this._previousPlayer) {
			return;
		}

		this.isLastOpponent = this._lastOpponentPlayerId === this._previousPlayer.playerId;
		this._bgsPlayer = {
			player: BgsPlayer.create({
				cardId: this._previousPlayer.cardId,
				heroPowerCardId: this._previousPlayer.heroPowerCardId,
				initialHealth: this._previousPlayer.initialHealth,
				damageTaken: this._previousPlayer.damageTaken,
				isMainPlayer: this._previousPlayer.isMainPlayer,
				name: this._previousPlayer.name,
				mmr: this._previousPlayer.mmr,
				leaderboardPlace: this._previousPlayer.leaderboardPlace,
				tavernUpgradeHistory: this._previousPlayer.tavernUpgradeHistory,
				tripleHistory: this._previousPlayer.tripleHistory,
				boardHistory: this._previousPlayer?.boardHistory ?? [],
				questRewards: this._previousPlayer?.questRewards,
				buddyTurns: this._previousPlayer?.buddyTurns ?? [],
			}),
			config: {
				hasBuddies: this.buddiesEnabled,
			},
			currentTurn: this._currentTurn,
			isLastOpponent: this.isLastOpponent,
			additionalClasses: this.componentClass,
		};
		this.tavernTier = this._previousPlayer.getCurrentTavernTier();
		this.triples = this._previousPlayer.totalTriples ?? 0;
		this.winStreak = this._previousPlayer.currentWinStreak ?? 0;
		const tribe = this._previousPlayer.getLastKnownComposition()?.tribe;
		// The game doesn't show any count when it's mixed minions
		this.tribeCount = tribe === 'mixed' ? null : this._previousPlayer.getLastKnownComposition()?.count ?? 0;
		this.tribeImage = getTribeIcon(tribe);
		this.damage = this._previousPlayer.getLastKnownBattleHistory()?.damage ?? 0;
		this.questRewards = this._bgsPlayer.player.questRewards;
		const buddyImageRoot = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images`;
		this.buddyImage =
			this._previousPlayer.buddyTurns.length > 1
				? `${buddyImageRoot}/bgs_buddies_meter_frame_golden.png`
				: `${buddyImageRoot}/bgs_buddies_meter_frame.png`;
		this.buddyClass = this._previousPlayer.buddyTurns.length === 0 ? 'missing' : '';
		this.mmr =
			this._bgsPlayer?.player?.mmr != null
				? this.i18n.translateString('battlegrounds.in-game.opponents.mmr', {
						value: this._bgsPlayer.player.mmr.toLocaleString(this.i18n.formatCurrentLocale()),
				  })
				: null;

		if (this.winStreak === 0 && this.damage > 0) {
			this.damage = -this.damage;
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
