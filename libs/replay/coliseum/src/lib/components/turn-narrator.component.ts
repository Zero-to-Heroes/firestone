import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'turn-narrator',
	styleUrls: ['./turn-narrator.component.scss'],
	template: `
		<div class="turn-narrator" [ngClass]="{ 'turn-narrator-disabled': !_active }">
			<span [innerHTML]="_text"></span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnNarratorComponent {
	_text: string;
	_active = false;

	@Input() set text(text: string | undefined) {
		if (!text) {
			return;
		}
		this._text = text.replace('\n', '<br/>');
	}

	@Input() set active(value: boolean) {
		this._active = value;
	}
}
