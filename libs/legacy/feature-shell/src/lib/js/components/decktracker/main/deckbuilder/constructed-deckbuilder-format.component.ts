import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { GameFormatString } from '@firestone-hs/reference-data';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { ConstructedDeckbuilderFormatSelectedEvent } from '../../../../services/mainwindow/store/events/decktracker/constructed-deckbuilder-format-selected-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'constructed-deckbuilder-format',
	styleUrls: [
		`../../../../../css/component/decktracker/main/deckbuilder/constructed-deckbuilder-format.component.scss`,
	],
	template: `
		<div class="constructed-deckbuilder-format" role="list">
			<button
				class="format"
				role="listitem"
				tabindex="0"
				*ngFor="let format of formatOptions; trackBy: trackByCardId"
				(click)="onCardClicked(format)"
			>
				<img [src]="format.image" [alt]="format.name" class="portrait" />
				<div class="format-name">{{ format.name }}</div>
			</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedDeckbuilderFormatComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	formatOptions: readonly FormatOption[];

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.formatOptions = ['standard', 'wild', 'classic', 'twist'].map((format) => {
			return {
				id: format as GameFormatString,
				name: this.i18n.translateString(`global.format.${format}`),
				image: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/format/${format}.webp`,
			};
		});
	}

	trackByCardId(index: number, item: FormatOption) {
		return item.id;
	}

	onCardClicked(format: FormatOption) {
		this.store.send(new ConstructedDeckbuilderFormatSelectedEvent(format.id));
	}
}

interface FormatOption {
	readonly id: GameFormatString;
	readonly name: string;
	readonly image: string;
}
