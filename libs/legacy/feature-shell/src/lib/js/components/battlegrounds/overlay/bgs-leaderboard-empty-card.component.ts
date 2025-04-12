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
import { BgsPlayer, QuestReward } from '@firestone/battlegrounds/core';
import { CardMousedOverService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import {
	CardsFacadeService,
	ILocalizationService,
	OverwolfService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, takeUntil } from 'rxjs';
import { AdService } from '../../../services/ad.service';
import { BgsOverlayHeroOverviewComponent } from './bgs-overlay-hero-overview.component';
import { BgsOverlayHeroOverviewService, PlayerInfo } from './bgs-overlay-hero-overview.service';

@Component({
	selector: 'bgs-leaderboard-empty-card',
	styleUrls: ['./bgs-leaderboard-empty-card.component.scss'],
	template: `
		<div class="card">
			<div
				class="last-opponent-icon"
				*ngIf="isLastOpponent && showLastOpponentIcon"
				[helpTooltip]="'battlegrounds.in-game.opponents.last-opponent-icon-tooltip' | owTranslate"
				inlineSVG="assets/svg/last_opponent.svg"
			></div>
			<div class="name-container" *ngIf="_bgsPlayer?.player?.name && (showMmr$ | async)">
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
				[lesserTrinket]="lesserTrinket"
				[greaterTrinket]="greaterTrinket"
			></bgs-hero-short-recap>
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
		this._previousPlayer = value;
		this.updateInfo();
	}

	@Input() showLastOpponentIcon: boolean;
	@Input() buddiesEnabled: boolean;

	position: 'global-top-center' | 'global-top-left' | 'global-bottom-left' | 'right' = 'global-top-left';

	componentClass: string;
	_bgsPlayer: PlayerInfo;

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
	lesserTrinket: string;
	greaterTrinket: string;

	private callbackHandle;
	private isPremiumUser: boolean;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly ow: OverwolfService,
		private readonly i18n: ILocalizationService,
		private readonly prefs: PreferencesService,
		private readonly ads: AdService,
		private readonly mouseOver: CardMousedOverService,
		private readonly controller: BgsOverlayHeroOverviewService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.ads, this.mouseOver);

		// this.mouseOver.mousedOverCard$$.pipe(this.mapData((card) => card)).subscribe((card) => {
		// 	if (card?.PlayerId != null && card.PlayerId === this._previousPlayer.playerId) {
		// 		console.debug('show info', this._bgsPlayer, card)
		// 		this.controller.showInfo(this._bgsPlayer);
		// 	} else {
		// 		console.debug('hide info', this._bgsPlayer, card)
		// 		this.controller.hideInfo(this._bgsPlayer);
		// 	}
		// });

		// this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsOpponentOverlayAtTop)).subscribe((value) => {
		// 	this.position = value ? 'global-top-left' : 'global-bottom-left';
		// 	this.componentClass = value ? null : 'bottom';
		// 	this.updateInfo();
		// });

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
				lesserTrinket: this._previousPlayer?.lesserTrinket,
				greaterTrinket: this._previousPlayer?.greaterTrinket,
			}),
			config: {
				hasBuddies: this.buddiesEnabled,
				hasQuests: this._previousPlayer?.questRewards?.length > 0,
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
		this.lesserTrinket = this._previousPlayer.lesserTrinket;
		this.greaterTrinket = this._previousPlayer.greaterTrinket;
		this.mmr =
			this._bgsPlayer?.player?.mmr != null
				? this.i18n.translateString('battlegrounds.in-game.opponents.mmr', {
						value: this._bgsPlayer.player.mmr.toLocaleString(this.i18n.formatCurrentLocale()),
				  })
				: null;

		if (this.winStreak === 0 && this.damage > 0) {
			this.damage = -this.damage;
		}
		// console.debug('set trinkets', this.lesserTrinket, this.greaterTrinket, this._previousPlayer);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private isMousingOver = false;

	private simulateMouseOver(element: HTMLElement) {
		if (!this.isMousingOver) {
			console.debug('simulating mouse over', this._previousPlayer);
			this.isMousingOver = true;
			const event = new MouseEvent('mouseenter', {
				view: window,
				bubbles: false,
				cancelable: true,
			});
			element.dispatchEvent(event);
		}
	}

	private simulateMouseLeave(element: HTMLElement) {
		if (this.isMousingOver) {
			console.debug('simulating mouse leave', this._previousPlayer);
			this.isMousingOver = false;
			const event = new MouseEvent('mouseleave', {
				view: window,
				bubbles: false,
				cancelable: true,
			});
			element.dispatchEvent(event);
		}
	}
}
