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
import { OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BgsPlayer, QuestReward } from '../../../models/battlegrounds/bgs-player';
import { getTribeIcon } from '../../../services/battlegrounds/bgs-utils';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';
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
				[componentInput]="_bgsPlayer"
				[componentTooltipPosition]="position"
			>
				<!-- transparent image with 1:1 intrinsic aspect ratio -->
				<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
				<div
					class="last-opponent-icon"
					*ngIf="isLastOpponent && showLastOpponentIcon"
					[helpTooltip]="'battlegrounds.in-game.opponents.last-opponent-icon-tooltip' | owTranslate"
					inlineSVG="assets/svg/last_opponent.svg"
				></div>

				<bgs-hero-short-recap
					class="short-recap"
					[ngClass]="{ active: showLiveInfo$ | async }"
					[tavernTier]="tavernTier"
					[triples]="triples"
					[winStreak]="winStreak"
					[tribeImage]="tribeImage"
					[tribeCount]="tribeCount"
					[damage]="damage"
					[questRewards]="questRewards"
				></bgs-hero-short-recap>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsLeaderboardEmptyCardComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, OnDestroy
{
	componentType: ComponentType<any> = BgsOverlayHeroOverviewComponent;
	showLiveInfo$: Observable<boolean>;
	showLiveInfo = new BehaviorSubject<boolean>(false);

	@Input() set currentTurn(value: number) {
		if (this._currentTurn === value) {
			return;
		}
		this._currentTurn = value;
		this.updateInfo();
	}

	@Input() set lastOpponentCardId(value: string) {
		if (this._lastOpponentCardId === value) {
			return;
		}
		this._lastOpponentCardId = value;
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

	position: 'global-top-center' | 'global-top-left' | 'global-bottom-left' | 'right' = 'global-top-left';

	componentClass: string;
	_bgsPlayer: {
		player: BgsPlayer;
		currentTurn: number;
		isLastOpponent: boolean;
		additionalClasses: string;
	};

	_previousPlayer: BgsPlayer;
	_currentTurn: number;
	_lastOpponentCardId: string;
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
	questRewards: readonly QuestReward[];

	private callbackHandle;

	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly ow: OverwolfService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		this.listenForBasicPref$((prefs) => prefs.bgsOpponentOverlayAtTop).subscribe((value) => {
			this.position = value ? 'global-top-left' : 'global-bottom-left';
			this.componentClass = value ? null : 'bottom';
			this.updateInfo();
		});
		this.showLiveInfo$ = this.showLiveInfo.asObservable().pipe(this.mapData((info) => info));
		this.callbackHandle = this.ow.addHotKeyHoldListener(
			'live-info',
			() => this.onTabDown(),
			() => this.onTabUp(),
		);
	}

	ngOnDestroy(): void {
		super.ngOnDestroy();
		if (this.callbackHandle) {
			this.ow.removeHotKeyHoldListener(this.callbackHandle);
		}
	}

	private onTabDown() {
		this.showLiveInfo.next(true);
	}

	private onTabUp() {
		this.showLiveInfo.next(false);
	}

	private updateInfo() {
		if (!this._previousPlayer) {
			return;
		}

		this.isLastOpponent = this._lastOpponentCardId === this._previousPlayer.getNormalizedHeroCardId(this.allCards);
		this._bgsPlayer = {
			player: BgsPlayer.create({
				cardId: this._previousPlayer.cardId,
				heroPowerCardId: this._previousPlayer.heroPowerCardId,
				initialHealth: this._previousPlayer.initialHealth,
				damageTaken: this._previousPlayer.damageTaken,
				isMainPlayer: this._previousPlayer.isMainPlayer,
				name: this._previousPlayer.name,
				leaderboardPlace: this._previousPlayer.leaderboardPlace,
				tavernUpgradeHistory: this._previousPlayer.tavernUpgradeHistory,
				tripleHistory: this._previousPlayer.tripleHistory,
				boardHistory: this._previousPlayer?.boardHistory ?? [],
				questRewards: this._previousPlayer?.questRewards,
				// buddyTurns: this._previousPlayer?.buddyTurns ?? [],
			}),
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
		if (this.winStreak === 0 && this.damage > 0) {
			this.damage = -this.damage;
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
