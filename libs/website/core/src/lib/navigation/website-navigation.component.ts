import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { filter } from 'rxjs';

@Component({
	selector: 'website-navigation',
	styleUrls: [`./website-navigation.component.scss`],
	template: `
		<nav class="menu-selection">
			<button
				[attr.tabindex]="0"
				type="button"
				class="menu-item"
				[attr.aria-label]="'app.menu.battlegrounds-header' | translate"
				[ngClass]="{ selected: selectedModule === 'battlegrounds' }"
				routerLink="battlegrounds"
				(click)="selectModule('battlegrounds')"
			>
				<div class="icon" inlineSVG="assets/svg/whatsnew/battlegrounds.svg"></div>
				<div class="menu-name" [translate]="'app.menu.battlegrounds-header'"></div>
			</button>
			<button
				[attr.tabindex]="0"
				type="button"
				class="menu-item"
				[attr.aria-label]="'app.menu.duels-header' | translate"
				[ngClass]="{ selected: selectedModule === 'duels' }"
				routerLink="duels"
				(click)="selectModule('duels')"
			>
				<div class="icon" inlineSVG="assets/svg/whatsnew/duels.svg"></div>
				<div class="menu-name" [translate]="'app.menu.duels-header'"></div>
			</button>

			<!-- Room for an ad -->

			<div class="desktop-app-cta">
				<div class="header" [translate]="'website.desktop-app.navigation-cta-header'"></div>
				<div class="text" [translate]="'website.desktop-app.navigation-cta-text'"></div>
				<a
					class="download-button"
					[translate]="'website.desktop-app.navigation-cta-button-text'"
					href="https://www.firestoneapp.com/"
					target="_blank"
				></a>
			</div>
		</nav>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteNavigationComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	selectedModule = 'battlegrounds';

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly router: Router) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		console.debug('router', this.router, this.router.routerState?.snapshot?.url);
		this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
			this.selectedModule = (event as NavigationEnd).url?.replaceAll('/', '');
		});
		this.selectedModule = this.router.routerState?.snapshot?.url?.replaceAll('/', '');
	}

	selectModule(module: string) {
		this.router.navigate([`/${module}`]);
	}
}
