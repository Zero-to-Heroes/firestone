import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { CardIds } from '@firestone-hs/reference-data';
import { getBuddy, getHeroPower } from '@services/battlegrounds/bgs-utils';
import { CardsFacadeService } from '@services/cards-facade.service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';

@Component({
	selector: 'twitch-bgs-hero-overview',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/global/reset-styles.scss`,
		'../../../../../css/themes/battlegrounds-theme.scss',
		'../../../../../css/component/battlegrounds/overlay/bgs-overlay-hero-overview.component.scss',
		'../../../../../css/component/decktracker/overlay/twitch/twitch-bgs-hero-overview.component.scss',
	],
	template: `
		<div class="battlegrounds-theme bgs-hero-overview-tooltip {{ leaderboardPositionClass }}">
			<bgs-opponent-overview-big
				[opponent]="_opponent"
				[enableSimulation]="false"
				[maxBoardHeight]="-1"
				[currentTurn]="currentTurn"
				tavernTitle="Latest upgrade"
				[showTavernsIfEmpty]="false"
			></bgs-opponent-overview-big>
		</div>
		<div class="cards">
			<img class="card normal" [src]="heroPowerImage" />
			<img class="card buddy normal" [src]="buddyCardImage" />
			<img class="card buddy golden" [src]="buddyCardGoldenImage" />
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwitchBgsHeroOverviewComponent {
	_opponent: BgsPlayer;
	currentTurn: number;
	showLogo = true;
	heroPowerImage: string;
	buddyCardImage: string;
	buddyCardGoldenImage: string;
	leaderboardPositionClass: string;

	@Input() set config(value: { player: BgsPlayer; currentTurn: number; showLogo: boolean }) {
		this._opponent = value.player;
		this.currentTurn = value.currentTurn;
		this.showLogo = value.showLogo ?? true;
		this.leaderboardPositionClass = `position-${value.player.leaderboardPlace}`;
		const buddyCardId = getBuddy(value.player?.cardId as CardIds);
		const buddyCard = this.cards.getCard(buddyCardId);
		const buddyCardGolden = this.cards.getCardFromDbfId(buddyCard.battlegroundsPremiumDbfId);
		this.buddyCardImage = this.i18n.getCardImage(buddyCardId, {
			isBgs: true,
			isHighRes: true,
		});
		this.buddyCardGoldenImage = this.i18n.getCardImage(buddyCardGolden.id, {
			isBgs: true,
			isPremium: true,
			isHighRes: true,
		});
		const heroPowerCardId = getHeroPower(value.player?.cardId);
		this.heroPowerImage = this.i18n.getCardImage(heroPowerCardId, {
			isHighRes: true,
		});
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly cards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}
}
