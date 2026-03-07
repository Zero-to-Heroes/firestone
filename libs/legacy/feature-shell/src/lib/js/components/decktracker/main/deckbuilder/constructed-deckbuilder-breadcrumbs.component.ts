import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import {
	ConstructedDeckbuilderGoBackEvent,
	ConstructedDeckbuilderImportDeckEvent,
} from '@firestone/mainwindow/common';
import { parseClipboardContent } from '../../import-deckstring.component';

export const DEFAULT_CARD_WIDTH = 170;
export const DEFAULT_CARD_HEIGHT = 221;
@Component({
	standalone: false,
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
	implements AfterContentInit
{
	currentStep$: Observable<string>;
	currentFormat$: Observable<SelectionStep>;
	currentClass$: Observable<SelectionStep>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly ow: OverwolfService,
		private readonly mainWindowState: MainWindowStateFacadeService,
	) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.currentStep$ = this.mainWindowState.mainWindowState$$
			.pipe(this.mapData((state) => state.decktracker.deckbuilder))
			.pipe(
				this.mapData((deckbuilder) => {
					if (!deckbuilder.currentFormat) {
						return this.i18n.translateString('app.decktracker.deckbuilder.choose-your-format-title');
					} else if (!deckbuilder.currentClass) {
						return this.i18n.translateString('app.decktracker.deckbuilder.choose-your-class-title');
					}
					return this.i18n.translateString('app.decktracker.deckbuilder.build-your-deck-title');
				}),
			);
		this.currentFormat$ = this.mainWindowState.mainWindowState$$
			.pipe(this.mapData((state) => state.decktracker.deckbuilder.currentFormat))
			.pipe(
				this.mapData((format) => {
					return !!format
						? {
								cardId: null,
								name: this.i18n.translateString(`global.format.${format}`),
								image: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/format/${format}.webp`,
							}
						: null;
				}),
			);
		this.currentClass$ = this.mainWindowState.mainWindowState$$
			.pipe(this.mapData((state) => state.decktracker.deckbuilder.currentClass))
			.pipe(
				this.mapData((currentClass) => {
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
		this.mainWindowState.send(new ConstructedDeckbuilderGoBackEvent(step));
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
		this.mainWindowState.send(new ConstructedDeckbuilderImportDeckEvent(deckstring, deckName));
	}
}

interface SelectionStep {
	readonly cardId: string;
	readonly name: string;
	readonly image: string;
}
