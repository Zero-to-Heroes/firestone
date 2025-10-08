import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CardClass } from '@firestone-hs/reference-data';
import { classes } from '@firestone/game-state';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { ConstructedDeckbuilderClassSelectedEvent } from '../../../../services/mainwindow/store/events/decktracker/constructed-deckbuilder-class-selected-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	standalone: false,
	selector: 'constructed-deckbuilder-class',
	styleUrls: [
		`../../../../../css/component/decktracker/main/deckbuilder/constructed-deckbuilder-class.component.scss`,
	],
	template: `
		<div class="constructed-deckbuilder-class" role="list">
			<div class="row-container {{ row.id }}" *ngFor="let row of rows">
				<button
					class="class"
					role="listitem"
					tabindex="0"
					*ngFor="
						let playerClass of classOptions$ | async | slice: row.startIndex : row.startIndex + row.items;
						trackBy: trackByCardId
					"
					(click)="onCardClicked(playerClass)"
				>
					<img [src]="playerClass.image" [alt]="playerClass.name" class="portrait" />
					<div class="class-name">{{ playerClass.name }}</div>
				</button>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedDeckbuilderClassComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	rows = [
		{
			id: 'top',
			items: 4,
			startIndex: 0,
		},
		{
			id: 'middle',
			items: 3,
			startIndex: 4,
		},
		{
			id: 'bottom',
			items: 4,
			startIndex: 7,
		},
	];
	classOptions$: Observable<readonly ClassOption[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.classOptions$ = this.store
			.listen$(([main, nav]) => main.decktracker.deckbuilder.currentFormat)
			.pipe(
				this.mapData(([currentFormat]) => {
					const validClasses =
						currentFormat === 'twist' || currentFormat === 'classic'
							? classes.filter(
									(c) =>
										c.toUpperCase() !== CardClass[CardClass.DEMONHUNTER] &&
										c.toUpperCase() !== CardClass[CardClass.DEATHKNIGHT],
								)
							: classes;
					console.debug('valid classes', validClasses, currentFormat);
					return validClasses.map((playerClass) => {
						return {
							id: playerClass,
							name: this.i18n.translateString(`global.class.${playerClass}`),
							image: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${playerClass}.png`,
						};
					});
				}),
			);
	}

	trackByCardId(index: number, item: ClassOption) {
		return item.id;
	}

	onCardClicked(playerClass: ClassOption) {
		this.store.send(new ConstructedDeckbuilderClassSelectedEvent(playerClass.id));
	}
}

interface ClassOption {
	readonly id: string;
	readonly name: string;
	readonly image: string;
}
