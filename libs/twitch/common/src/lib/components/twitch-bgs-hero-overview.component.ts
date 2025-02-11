/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-mixed-spaces-and-tabs */
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { CardIds, getBuddy, getHeroPower } from '@firestone-hs/reference-data';
import { BgsPlayer } from '@firestone/battlegrounds/core';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { Observable, from } from 'rxjs';
import { TwitchPreferencesService } from '../services/twitch-preferences.service';
import { AbstractSubscriptionTwitchResizableComponent } from './abstract-subscription-twitch-resizable.component';

@Component({
	selector: 'twitch-bgs-hero-overview',
	styleUrls: [
		'../../../../../legacy/feature-shell/src/lib/css/themes/battlegrounds-theme.scss',
		'../../../../../legacy/feature-shell/src/lib/css/component/battlegrounds/overlay/bgs-overlay-hero-overview.component.scss',
		'./twitch-bgs-hero-overview.component.scss',
	],
	template: `
		<div class="battlegrounds-theme container">
			<div class="bgs-hero-overview-tooltip scalable {{ leaderboardPositionClass }} ">
				<bgs-opponent-overview-big
					[opponent]="_opponent"
					[enableSimulation]="false"
					[maxBoardHeight]="-1"
					[currentTurn]="currentTurn"
					tavernTitle="Latest upgrade"
					[showTavernsIfEmpty]="false"
					[showQuestRewardsIfEmpty]="false"
				></bgs-opponent-overview-big>
			</div>
			<div class="cards" *ngIf="showHeroCards$ | async">
				<img class="card normal" [src]="heroPowerImage" />
				<ng-container *ngIf="rewards?.length">
					<div class="rewards" *ngFor="let reward of rewards" [ngClass]="{ unfinished: !reward.completed }">
						<img class="card buddy normal" [src]="reward.image" />
					</div>
				</ng-container>
				<ng-container *ngIf="trinkets?.length">
					<div class="trinkets" *ngFor="let trinket of trinkets">
						<img class="card buddy normal" *ngIf="!!trinket" [src]="trinket.image" />
					</div>
				</ng-container>
				<ng-container *ngIf="showBuddies">
					<img class="card buddy normal" [src]="buddyCardImage" />
					<img class="card buddy golden" [src]="buddyCardGoldenImage" />
				</ng-container>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwitchBgsHeroOverviewComponent extends AbstractSubscriptionTwitchResizableComponent {
	showHeroCards$: Observable<boolean | undefined>;

	_opponent: BgsPlayer;
	currentTurn: number;
	showLogo = true;
	heroPowerImage: string | null | undefined;
	leaderboardPositionClass: string;
	rewards: readonly Reward[] | undefined;
	trinkets: readonly (Trinket | null)[];

	showBuddies: boolean;
	buddyCardImage: string | null | undefined;
	buddyCardGoldenImage: string | null | undefined;

	@Input() set config(value: TwitchOpponentOverviewInput) {
		this.setConfig(value);
	}

	private async setConfig(value: TwitchOpponentOverviewInput) {
		this._opponent = value.player;
		this.currentTurn = value.currentTurn;
		this.showLogo = value.showLogo ?? true;
		this.leaderboardPositionClass = `position-${value.player.leaderboardPlace}`;
		this.rewards = await Promise.all(
			value.player.questRewards?.map(async (reward) => ({
				image: await this.i18n
					.getCardImage(reward.cardId, {
						isBgs: true,
						isHighRes: true,
					})!
					.toPromise(),
				completed: reward.completed,
			})),
		);
		this.showBuddies = value.config?.hasBuddies;
		const buddyCardId = getBuddy(value.player?.cardId as CardIds, this.cards.getService());
		const buddyCard = !!buddyCardId ? this.cards.getCard(buddyCardId) : null;
		const buddyCardGolden = !!buddyCard?.battlegroundsPremiumDbfId
			? this.cards.getCard(buddyCard.battlegroundsPremiumDbfId)
			: null;
		this.buddyCardImage = !!buddyCardId
			? await this.i18n
					.getCardImage(buddyCardId, {
						isBgs: true,
						isHighRes: true,
					})
					.toPromise()
			: null;
		this.buddyCardGoldenImage = !!buddyCardGolden
			? await this.i18n
					.getCardImage(buddyCardGolden.id, {
						isBgs: true,
						cardType: 'GOLDEN',
						isHighRes: true,
					})
					.toPromise()
			: null;
		const heroPowerCardId = getHeroPower(value.player?.cardId, this.cards.getService());
		this.heroPowerImage = await this.i18n
			.getCardImage(heroPowerCardId, {
				isHighRes: true,
			})
			.toPromise();
		if (value.player.lesserTrinket || value.player.greaterTrinket) {
			this.trinkets = await Promise.all([
				!!value.player.lesserTrinket
					? {
							image: await this.i18n
								.getCardImage(value.player.lesserTrinket, {
									isBgs: true,
									isHighRes: true,
								})!
								.toPromise(),
					  }
					: null,
				!!value.player.greaterTrinket
					? {
							image: await this.i18n
								.getCardImage(value.player.greaterTrinket, {
									isBgs: true,
									isHighRes: true,
								})!
								.toPromise(),
					  }
					: null,
			]);
		}
		super.listenForResize();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		protected override readonly prefs: TwitchPreferencesService,
		protected override readonly el: ElementRef,
		protected override readonly renderer: Renderer2,
		private readonly cards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr, prefs, el, renderer);
		this.showHeroCards$ = from(this.prefs.prefs.asObservable()).pipe(this.mapData((prefs) => prefs?.showHeroCards));
		this.elToResize = () => this.el.nativeElement.querySelector('.container > .scalable');
	}
}

export interface TwitchOpponentOverviewInput {
	player: BgsPlayer;
	currentTurn: number;
	showLogo: boolean;
	config: {
		hasBuddies: boolean;
	};
}

interface Reward {
	readonly image: string | null | undefined;
	readonly completed: boolean;
}

interface Trinket {
	readonly image: string | null | undefined;
}
