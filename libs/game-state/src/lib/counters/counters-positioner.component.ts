import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	OnDestroy,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { BehaviorSubject, debounceTime, takeUntil } from 'rxjs';
import { CounterWrapperComponent } from './counter-wrapper.component';

@Component({
	selector: 'counters-positioner',
	styleUrls: [`./counters-positioner.component.scss`],
	template: `
		<div class="positioner" [ngClass]="{ ready: ready }">
			<ng-content></ng-content>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountersPositionerComponent extends AbstractSubscriptionComponent implements OnDestroy, AfterContentInit {
	@Input() positionerId: string;

	ready: boolean;

	private children: CounterWrapperComponent[] = [];

	private refreshPositions$$ = new BehaviorSubject<boolean>(true);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly element: ElementRef,
		private readonly prefs: PreferencesService,
		private readonly renderer: Renderer2,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		this.refreshPositions$$.pipe(debounceTime(200), takeUntil(this.destroyed$)).subscribe((event) => {
			this.updateChildrenPositions();
		});
	}

	public registerChild(child: CounterWrapperComponent) {
		this.children.push(child);
		this.refreshPositions$$.next(true);
	}

	public unregisterChild(child: CounterWrapperComponent) {
		const index = this.children.indexOf(child);
		if (index !== -1) {
			this.children.splice(index, 1);
			this.refreshPositions$$.next(true);
		}
	}

	private async updateChildrenPositions() {
		console.debug('[debug] updating children', this.children);

		// Update positions and subscribe to new children
		for (let i = 0; i < this.children.length; i++) {
			const child = this.children[i];
			const savedPosition = await this.retrieveWidgetPosition(child);
			if (savedPosition) {
				// Modify the style of the child element
				this.renderer.setStyle(child.el.nativeElement, 'left', savedPosition.left + 'px');
				this.renderer.setStyle(child.el.nativeElement, 'top', savedPosition.top + 'px');
				console.debug('[debug] moving widget', i, savedPosition, child);
			}
		}

		if (this.children.length > 0) {
			this.ready = true;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}
	}

	public async saveWidgetPosition(child: CounterWrapperComponent, event: { left: number; top: number }) {
		const index = this.children.indexOf(child);
		console.debug('saving position', index, child, event);
		const prefs = await this.prefs.getPreferences();
		const positions = prefs[this.positionerId] || [];
		positions[index] = { left: event.left, top: event.top };
		prefs[this.positionerId] = positions;
		console.debug('saving position', prefs);
		await this.prefs.savePreferences(prefs);
	}

	public async retrieveWidgetPosition(child: CounterWrapperComponent): Promise<{ left: number; top: number }> {
		const index = this.children.indexOf(child);
		const prefs = await this.prefs.getPreferences();
		const positions = prefs[this.positionerId] || [];
		console.debug('retrieving position', index, child, positions);
		if (positions[index]) {
			console.debug('retrieving position', index, positions[index]);
			return positions[index];
		}

		const gameWidth = this.element.nativeElement.offsetWidth;
		const gameHeight = this.element.nativeElement.offsetHeight;
		const defaultLeft = gameWidth * (0.5 + index / 20) + gameHeight * 0.3;
		const defaultTop = this.positionerId.includes('player') ? gameHeight * 0.75 : gameHeight * 0.1;
		console.debug('retrieving default position', index, defaultLeft, defaultTop);
		return { left: defaultLeft, top: defaultTop };
	}
}
