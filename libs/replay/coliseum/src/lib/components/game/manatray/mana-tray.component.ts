import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'mana-tray',
	styleUrls: ['../../../text.scss', './mana-tray.component.scss'],
	template: `
		<div class="mana-tray" cardElementResize [fontSizeRatio]="0.06">
			<div class="summary" resizeTarget>
				<span class="available">{{ _available }}</span>
				<span class="separator">/</span>
				<span class="total">{{ _total }}</span>
			</div>
			<div class="crystals">
				<ul class="present">
					<li class="mana" *ngFor="let mana of availableArray"></li>
					<li class="mana spent" *ngFor="let mana of emptyArray"></li>
					<li class="mana locked" *ngFor="let mana of lockedArray"></li>
				</ul>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManaTrayComponent {
	_total: number;
	_available: number;
	_empty: number;
	_locked: number;
	_futureLocked: number;

	availableArray: number[];
	emptyArray: number[];
	lockedArray: number[];

	@Input() set total(total: number) {
		// console.debug('[mana-tray] setting total crystals', total);
		this._total = total;
	}

	@Input() set available(available: number) {
		// console.debug('[mana-tray] setting available crystals', available);
		this._available = available;
		if (available >= 0) {
			this.availableArray = Array(available).fill(0);
		}
	}

	@Input() set empty(empty: number) {
		// console.debug('[mana-tray] setting empty crystals', empty);
		this._empty = empty;
		if (empty >= 0) {
			this.emptyArray = Array(empty).fill(0);
		}
	}

	@Input() set locked(locked: number) {
		// console.debug('[mana-tray] setting locked crystals', locked);
		this._locked = locked;
		if (locked >= 0) {
			this.lockedArray = Array(locked).fill(0);
		}
	}

	@Input() set futureLocked(futureLocked: number) {
		// console.debug('[mana-tray] setting futureLocked crystals', futureLocked);
		this._futureLocked = futureLocked;
	}
}
