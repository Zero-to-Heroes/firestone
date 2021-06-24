import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Optional,
} from '@angular/core';
import { decode } from 'deckstrings';
import { CardTooltipPositionType } from '../../directives/card-tooltip-position.type';
import { GameStateEvent } from '../../models/decktracker/game-state-event';
import { GameEvent } from '../../models/game-event';
import { DeckstringOverrideEvent } from '../../services/decktracker/event/deckstring-override-event';
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
			helpTooltip="Import a deck code from your clipboard"
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
		console.debug('set tooltip position in import', value);
		this._tooltipPosition = value;
	}

	deckName: string;
	_tooltipPosition: CardTooltipPositionType;

	confirmationTitle = 'Override deck list?';
	confirmationText = 'Override deck list?';
	validButtonText = 'Override';
	cancelButtonText = 'Cancel';
	showOk = true;

	private deckstring: string;

	private deckUpdater: EventEmitter<GameEvent | GameStateEvent>;

	constructor(private readonly cdr: ChangeDetectorRef, @Optional() private readonly ow: OverwolfService) {}

	ngAfterViewInit() {
		this.deckUpdater = this.ow.getMainWindow().deckUpdater;
	}

	async importDeckstring() {
		const clipboardContent = await this.ow.getFromClipboard();
		const { deckstring, deckName } = this.parseClipboardContent(clipboardContent);
		// console.debug('parsed', deckstring, deckName);
		if (!deckstring) {
			console.warn('invalid clipboard content', clipboardContent);
			this.confirmationTitle = 'Invalid deck code';
			this.confirmationText = `We couldn't recognize the deck code that was provided.`;
			this.validButtonText = null;
			this.cancelButtonText = 'Ok';
			this.showOk = false;
		} else {
			this.deckName = deckName;
			this.deckstring = deckstring;
			this.confirmationTitle = 'Override deck list?';
			this.confirmationText = `Use ${this.deckName}?`;
			this.validButtonText = 'Override';
			this.cancelButtonText = 'Cancel';
			this.showOk = true;
		}
	}

	confirmOverride() {
		// console.log('confirmed', this.deckName, this.deckstring);
		this.deckUpdater.next(new DeckstringOverrideEvent(this.deckName ?? 'Unkown deck', this.deckstring));
	}

	private parseClipboardContent(clipboardContent: string): { deckstring: string; deckName: string } {
		// console.debug('parsing clipboard content', clipboardContent);
		const lines = clipboardContent.split('\n');
		const linesReversed = lines.reverse();
		let deckName = null;
		let deckstring = null;
		for (const line of linesReversed) {
			if (!deckName && line.startsWith('### ')) {
				deckName = line.split('### ')[1];
				// console.debug('found deck name', deckName);
			} else if (!deckstring) {
				try {
					// console.debug('decoding', line);
					decode(line);
					// console.debug('result', result);
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
	}
}
