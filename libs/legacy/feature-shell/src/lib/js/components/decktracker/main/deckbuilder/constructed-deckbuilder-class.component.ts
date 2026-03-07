import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { CardClass } from '@firestone-hs/reference-data';
import { classes } from '@firestone/game-state';
import { MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { ConstructedDeckbuilderClassSelectedEvent } from '@firestone/mainwindow/common';

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
export class ConstructedDeckbuilderClassComponent extends AbstractSubscriptionComponent implements AfterContentInit {
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
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.mainWindowStateFacade);

		this.classOptions$ = this.mainWindowStateFacade.mainWindowState$$
			.pipe(this.mapData((state) => state.decktracker.deckbuilder.currentFormat))
			.pipe(
				this.mapData((currentFormat) => {
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

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	trackByCardId(index: number, item: ClassOption) {
		return item.id;
	}

	onCardClicked(playerClass: ClassOption) {
		this.mainWindowStateFacade.send(new ConstructedDeckbuilderClassSelectedEvent(playerClass.id));
	}
}

interface ClassOption {
	readonly id: string;
	readonly name: string;
	readonly image: string;
}
