import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { TwitchPreferencesService } from '@components/decktracker/overlay/twitch/twitch-preferences.service';
import { CardIds, getHeroPower } from '@firestone-hs/reference-data';
import { BgsPlayer } from '@firestone/battlegrounds/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { getBuddy } from '@legacy-import/src/lib/js/services/battlegrounds/bgs-utils';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable, from } from 'rxjs';
import { AbstractSubscriptionTwitchResizableComponent } from './abstract-subscription-twitch-resizable.component';

@Component({
	selector: 'twitch-bgs-hero-overview',
	styleUrls: [
		'../../../../../css/themes/battlegrounds-theme.scss',
		'../../../../../css/component/battlegrounds/overlay/bgs-overlay-hero-overview.component.scss',
		'../../../../../css/component/decktracker/overlay/twitch/twitch-bgs-hero-overview.component.scss',
	],
	template: `
		<div class="battlegrounds-theme container scalable">
			<div class="bgs-hero-overview-tooltip {{ leaderboardPositionClass }}">
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
				<img class="card buddy normal" [src]="buddyCardImage" />
				<img class="card buddy golden" [src]="buddyCardGoldenImage" />
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwitchBgsHeroOverviewComponent extends AbstractSubscriptionTwitchResizableComponent {
	showHeroCards$: Observable<boolean>;

	_opponent: BgsPlayer;
	currentTurn: number;
	showLogo = true;
	heroPowerImage: string;
	leaderboardPositionClass: string;
	rewards: readonly Reward[];
	buddyCardImage: string;
	buddyCardGoldenImage: string;

	@Input() set config(value: { player: BgsPlayer; currentTurn: number; showLogo: boolean }) {
		this._opponent = value.player;
		this.currentTurn = value.currentTurn;
		this.showLogo = value.showLogo ?? true;
		this.leaderboardPositionClass = `position-${value.player.leaderboardPlace}`;
		this.rewards = value.player.questRewards?.map((reward) => ({
			image: this.i18n.getCardImage(reward.cardId, {
				isBgs: true,
				isHighRes: true,
			}),
			completed: reward.completed,
		}));
		const buddyCardId = getBuddy(value.player?.cardId as CardIds, this.cards);
		const buddyCard = this.cards.getCard(buddyCardId);
		const buddyCardGolden = this.cards.getCardFromDbfId(buddyCard.battlegroundsPremiumDbfId);
		this.buddyCardImage = this.i18n.getCardImage(buddyCardId, {
			isBgs: true,
			isHighRes: true,
		});
		this.buddyCardGoldenImage = this.i18n.getCardImage(buddyCardGolden.id, {
			isBgs: true,
			cardType: 'GOLDEN',
			isHighRes: true,
		});
		const heroPowerCardId = getHeroPower(value.player?.cardId, this.cards.getService());
		this.heroPowerImage = this.i18n.getCardImage(heroPowerCardId, {
			isHighRes: true,
		});
		super.listenForResize();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		protected readonly prefs: TwitchPreferencesService,
		protected readonly el: ElementRef,
		protected readonly renderer: Renderer2,
		private readonly cards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(cdr, prefs, el, renderer);
		this.showHeroCards$ = from(this.prefs.prefs.asObservable()).pipe(this.mapData((prefs) => prefs?.showHeroCards));
	}
}

interface Reward {
	readonly image: string;
	readonly completed: boolean;
}
