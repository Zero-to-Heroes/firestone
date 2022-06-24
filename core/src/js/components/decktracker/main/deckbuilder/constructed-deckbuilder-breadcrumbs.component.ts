import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { ConstructedDeckbuilderGoBackEvent } from '../../../../services/mainwindow/store/events/decktracker/constructed-deckbuilder-go-back-event';
import { ConstructedDeckbuilderImportDeckEvent } from '../../../../services/mainwindow/store/events/decktracker/constructed-deckbuilder-import-deck-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';
import { parseClipboardContent } from '../../import-deckstring.component';

export const DEFAULT_CARD_WIDTH = 170;
export const DEFAULT_CARD_HEIGHT = 221;
@Component({
	selector: 'constructed-deckbuilder-breadcrumbs',
	styleUrls: [
		`../../../../../css/component/decktracker/main/deckbuilder/constructed-deckbuilder-breadcrumbs.component.scss`,
	],
	template: `
		<div class="constructed-deckbuilder-breadcrumbs">
			<div class="current-step">{{ currentStep$ | async }}</div>
			<div class="import-deck" *ngIf="!(currentFormat$ | async)">
				<div class="or" [owTranslate]="'app.duels.deckbuilder.or'"></div>
				<button
					class="import-button"
					(click)="importDeckFromClickpboard()"
					[helpTooltip]="'app.decktracker.deckbuilder.import-deck-button-tooltip' | owTranslate"
				>
					<div class="icon" inlineSVG="assets/svg/import_deckstring.svg"></div>
					{{ 'app.duels.deckbuilder.import-deck-button-title' | owTranslate }}
				</button>
			</div>
			<div class="recap">
				<div
					class="recap-item recap-format"
					*ngIf="currentFormat$ | async as currentFormat"
					(click)="goBack('format')"
					[helpTooltip]="heroTooltip('format', currentFormat.name)"
				>
					<img [src]="currentFormat.image" [alt]="currentFormat.name" />
				</div>
				<div
					class="recap-item recap-class"
					*ngIf="currentClass$ | async as currentClass"
					(click)="goBack('class')"
					[helpTooltip]="heroTooltip('class', currentClass.name)"
				>
					<img [src]="currentClass.image" [alt]="currentClass.name" />
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedDeckbuilderBreadcrumbsComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit {
	currentStep$: Observable<string>;
	currentFormat$: Observable<SelectionStep>;
	currentClass$: Observable<SelectionStep>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.currentStep$ = this.store
			.listen$(([main, nav]) => main.decktracker.deckbuilder)
			.pipe(
				this.mapData(([deckbuilder]) => {
					if (!deckbuilder.currentFormat) {
						return this.i18n.translateString('app.decktracker.deckbuilder.choose-your-format-title');
					} else if (!deckbuilder.currentClass) {
						return this.i18n.translateString('app.decktracker.deckbuilder.choose-your-class-title');
					}
					return this.i18n.translateString('app.decktracker.deckbuilder.build-your-deck-title');
				}),
			);
		this.currentFormat$ = this.store
			.listen$(([main, nav]) => main.decktracker.deckbuilder.currentFormat)
			.pipe(
				this.mapData(([format]) => {
					return !!format
						? {
								cardId: null,
								name: this.i18n.translateString(`global.format.${format}`),
								image: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/format/${format}.png`,
						  }
						: null;
				}),
			);
		this.currentClass$ = this.store
			.listen$(([main, nav]) => main.decktracker.deckbuilder.currentClass)
			.pipe(
				this.mapData(([currentClass]) => {
					return !!currentClass
						? {
								cardId: null,
								name: this.i18n.translateString(`global.class.${currentClass}`),
								image: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${currentClass}.png`,
						  }
						: null;
				}),
			);
	}

	goBack(step: 'format' | 'class') {
		this.store.send(new ConstructedDeckbuilderGoBackEvent(step));
	}

	heroTooltip(step: 'format' | 'class', name: string) {
		switch (step) {
			case 'format':
				return this.i18n.translateString('app.decktracker.deckbuilder.go-back-format', { formatName: name });
			case 'class':
				return this.i18n.translateString('app.decktracker.deckbuilder.go-back-class', {
					className: name,
				});
		}
	}

	async importDeckFromClickpboard() {
		const clipboardContent = await this.ow.getFromClipboard();
		const { deckstring, deckName } = parseClipboardContent(clipboardContent);
		this.store.send(new ConstructedDeckbuilderImportDeckEvent(deckstring, deckName));
	}
}

interface SelectionStep {
	readonly cardId: string;
	readonly name: string;
	readonly image: string;
}
