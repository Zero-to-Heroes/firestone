import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { duelsHeroConfigs } from '@firestone-hs/reference-data';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { DuelsDeckbuilderSignatureTreasureSelectedEvent } from '@services/mainwindow/store/events/duels/duels-deckbuilder-signature-treasure-selected-decks-event';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'duels-deckbuilder-signature-treasure',
	styleUrls: [
		`../../../../../css/component/duels/desktop/deckbuilder/duels-deckbuilder-signature-treasure.component.scss`,
	],
	template: `
		<div
			class="duels-deckbuilder-signature-treasure"
			role="list"
			*ngIf="signatureTreasureOptions$ | async as signatureTreasureOptions"
		>
			<button
				class="signature-treasure"
				role="listitem"
				tabindex="0"
				*ngFor="let signatureTreasure of signatureTreasureOptions; trackBy: trackByCardId"
				(click)="onSignatureTreasureCardClicked(signatureTreasure)"
			>
				<img [src]="signatureTreasure.cardImage" [alt]="signatureTreasure.name" class="icon" />
			</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDeckbuilderSignatureTreasureComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	signatureTreasureOptions$: Observable<readonly SignatureTreasureOption[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.signatureTreasureOptions$ = this.store
			.listen$(
				([main, nav]) => main.duels.deckbuilder.currentHeroCardId,
				([main, nav]) => main.duels.deckbuilder.currentHeroPowerCardId,
			)
			.pipe(
				this.mapData(([heroCardId, heroPowerCardId]) => {
					const heroConfig = duelsHeroConfigs.find((config) => config.hero === heroCardId);
					return (heroConfig?.signatureTreasures ?? []).map((signatureTreasure) => {
						return {
							cardId: signatureTreasure,
							cardImage: this.i18n.getCardImage(signatureTreasure),
							name: this.allCards.getCard(signatureTreasure).name,
						};
					});
				}),
			);
	}

	trackByCardId(index: number, item: SignatureTreasureOption) {
		return item.cardId;
	}

	onSignatureTreasureCardClicked(signatureTreasure: SignatureTreasureOption) {
		this.store.send(new DuelsDeckbuilderSignatureTreasureSelectedEvent(signatureTreasure.cardId));
	}
}

interface SignatureTreasureOption {
	readonly cardId: string;
	readonly cardImage: string;
	readonly name: string;
}
