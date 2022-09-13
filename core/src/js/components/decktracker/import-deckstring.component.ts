import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input, Optional } from '@angular/core';
import { decode } from '@firestone-hs/deckstrings';
import { CardTooltipPositionType } from '../../directives/card-tooltip-position.type';
import { GameStateEvent } from '../../models/decktracker/game-state-event';
import { GameEvent } from '../../models/game-event';
import { DeckstringOverrideEvent } from '../../services/decktracker/event/deckstring-override-event';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'import-deckstring',
	styleUrls: [
		'../../../css/global/components-global.scss',
		'../../../css/component/decktracker/import-deckstring.component.scss',
	],
	template: `
		<div
			class="import-deckstring"
			[helpTooltip]="'decktracker.import.import-deckstring-tooltip' | owTranslate"
			(mousedown)="importDeckstring()"
			confirmationTooltip
			[askConfirmation]="true"
			[confirmationTitle]="confirmationTitle"
			[confirmationText]="confirmationText"
			[validButtonText]="validButtonText"
			[cancelButtonText]="cancelButtonText"
			[showOk]="showOk"
			[confirmationPosition]="_tooltipPosition"
			(onConfirm)="confirmOverride()"
		>
			<div class="icon" inlineSVG="assets/svg/import_deckstring.svg"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportDeckstringComponent implements AfterViewInit {
	@Input() set tooltipPosition(value: CardTooltipPositionType) {
		this._tooltipPosition = value;
	}

	@Input() side: 'player' | 'opponent';

	deckName: string;
	_tooltipPosition: CardTooltipPositionType;

	confirmationTitle = this.i18n.translateString('decktracker.import.confirmation-title');
	confirmationText = this.i18n.translateString('decktracker.import.confirmation-title');
	validButtonText = this.i18n.translateString('decktracker.import.button-text');
	cancelButtonText = this.i18n.translateString('decktracker.import.cancel-text');
	showOk = true;

	private deckstring: string;

	private deckUpdater: EventEmitter<GameEvent | GameStateEvent>;

	constructor(private readonly i18n: LocalizationFacadeService, @Optional() private readonly ow: OverwolfService) {}

	ngAfterViewInit() {
		this.deckUpdater = this.ow.getMainWindow().deckUpdater;
	}

	async importDeckstring() {
		const clipboardContent = await this.ow.getFromClipboard();
		const { deckstring, deckName } = parseClipboardContent(clipboardContent);

		if (!deckstring) {
			console.warn('invalid clipboard content', clipboardContent);
			this.confirmationTitle = this.i18n.translateString('decktracker.import.invalid-deck-code-title');
			this.confirmationText = this.i18n.translateString('decktracker.import.invalid-deck-code-text');
			this.validButtonText = null;
			this.cancelButtonText = this.i18n.translateString('decktracker.import.invalid-deck-code-button-text');
			this.showOk = false;
		} else {
			this.deckName = deckName;
			this.deckstring = deckstring;
			this.confirmationTitle = this.i18n.translateString('decktracker.import.confirmation-title');
			this.confirmationText = this.deckName
				? this.i18n.translateString('decktracker.import.use-deck-text', {
						value: this.deckName,
				  })
				: this.i18n.translateString('decktracker.import.use-deck-text-default');
			this.validButtonText = this.i18n.translateString('decktracker.import.button-text');
			this.cancelButtonText = this.i18n.translateString('decktracker.import.cancel-text');
			this.showOk = true;
		}
	}

	confirmOverride() {
		console.debug('confirming override', this.side, this.deckstring);
		this.deckUpdater.next(
			new DeckstringOverrideEvent(
				this.deckName ?? this.i18n.translateString('decktracker.deck-name.unknown-deck'),
				this.deckstring,
				this.side ?? 'opponent',
			),
		);
	}
}

export const parseClipboardContent = (clipboardContent: string): { deckstring: string; deckName: string } => {
	const lines = clipboardContent.split('\n');
	const linesReversed = lines.reverse();
	let deckName = null;
	let deckstring = null;
	for (const line of linesReversed) {
		if (!deckName && line.startsWith('### ')) {
			deckName = line.split('### ')[1];
		} else if (!deckstring) {
			try {
				decode(line);
				deckstring = line;
			} catch (e) {
				// Do nothing, this was not a deckstring line
			}
		}
		if (deckName && deckstring) {
			break;
		}
	}
	return {
		deckstring: deckstring,
		deckName: deckName,
	};
};
