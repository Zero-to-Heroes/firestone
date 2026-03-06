import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
} from '@angular/core';
import { CardsHighlightFacadeService } from '@firestone/game-state';
import { DebugService } from '@firestone/legacy/feature-shell';
import { CurrentAppType, ScalingService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

@Component({
	standalone: false,
	selector: 'main-window',
	styleUrls: [],
	template: `
		<window-wrapper [activeTheme]="activeTheme$$ | async" [allowResize]="true" [avoidGameOverlap]="true">
			<main-window-root (activeTheme)="activeTheme$$.next($event)"></main-window-root>
		</window-wrapper>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainWindowComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	windowId: string;
	activeTheme$$ = new BehaviorSubject<CurrentAppType | 'decktracker-desktop'>('decktracker-desktop');

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly init_Debug: DebugService,
		private readonly init_ScalingService: ScalingService,
		private readonly init_cardsHighlight: CardsHighlightFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		const currentWindow = await this.ow.getCurrentWindow();
		this.windowId = currentWindow.id;
	}

	@HostListener('mousedown', ['$event'])
	dragMove(event: MouseEvent) {
		const path: any[] = event.composedPath();
		// Hack for drop-downs
		if (
			path.length > 2 &&
			path[0].localName === 'div' &&
			path[0].className?.includes('options') &&
			path[1].localName === 'div' &&
			path[1].className?.includes('below')
		) {
			return;
		}
		this.ow.dragMove(this.windowId);
	}
}
