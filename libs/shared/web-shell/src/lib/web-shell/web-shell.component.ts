import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DownloadButtonComponent } from '../components/common/download-button/download-button.component';

interface NavigationSection {
	id: string;
	label: string;
	icon: string;
	route: string;
	subItems: NavigationSubItem[];
	disabled?: boolean;
}

interface NavigationSubItem {
	id: string;
	label: string;
	route: string;
	disabled?: boolean;
}

@Component({
	selector: 'firestone-web-shell',
	imports: [RouterOutlet, RouterLink, RouterLinkActive, InlineSVGModule, CommonModule, DownloadButtonComponent],
	templateUrl: './web-shell.component.html',
	styleUrl: './web-shell.component.scss',
})
export class WebShellComponent implements OnInit, OnDestroy {
	@ViewChild('dropdownContainer', { read: ElementRef }) dropdownContainer?: ElementRef;

	isMobileMenuOpen = false;
	isDropdownOpen = false;
	currentSection: NavigationSection;
	private routerSubscription?: Subscription;

	navigationSections: NavigationSection[] = [];

	constructor(
		private readonly router: Router,
		private readonly i18n: ILocalizationService,
	) {
		this.navigationSections = this.buildNavigationSections();
		this.currentSection = this.navigationSections[0];
	}

	ngOnInit() {
		// Set up router subscription to update current section
		this.routerSubscription = this.router.events
			.pipe(filter((event) => event instanceof NavigationEnd))
			.subscribe((event: NavigationEnd) => {
				this.updateCurrentSection(event.url);
			});

		// Set initial section based on current route
		this.updateCurrentSection(this.router.url);
	}

	ngOnDestroy() {
		this.routerSubscription?.unsubscribe();
	}

	private updateCurrentSection(url: string) {
		const section = this.navigationSections.find((s) => url.startsWith(s.route));
		if (section) {
			this.currentSection = section;
		}
	}

	toggleDropdown() {
		this.isDropdownOpen = !this.isDropdownOpen;
	}

	selectSection(section: NavigationSection) {
		this.currentSection = section;
		this.isDropdownOpen = false;
		this.router.navigate([section.route]);
	}

	getCurrentSubItems(): NavigationSubItem[] {
		return this.currentSection?.subItems || [];
	}

	toggleMobileMenu() {
		this.isMobileMenuOpen = !this.isMobileMenuOpen;
	}

	closeMobileMenu() {
		this.isMobileMenuOpen = false;
	}

	private buildNavigationSections() {
		return [
			{
				id: 'battlegrounds',
				label: this.i18n.translateString('app.menu.battlegrounds-header'),
				icon: 'assets/svg/ftue/battlegrounds.svg',
				route: '/battlegrounds',
				subItems: [
					{
						id: 'bg-heroes',
						label: this.i18n.translateString('app.battlegrounds.menu.heroes'),
						route: '/battlegrounds/heroes',
					},
					{
						id: 'bg-comps',
						label: this.i18n.translateString('app.battlegrounds.menu.comps'),
						route: '/battlegrounds/comps',
					},
					{
						id: 'bg-cards',
						label: this.i18n.translateString('app.battlegrounds.menu.cards'),
						route: '/battlegrounds/cards',
						disabled: true,
					},
				],
			},
			{
				id: 'arena',
				label: this.i18n.translateString('app.menu.arena-header'),
				icon: 'assets/svg/ftue/arena.svg',
				route: '/arena',
				subItems: [
					{
						id: 'arena-stats',
						label: this.i18n.translateString('website.arena.classes'),
						route: '/arena/classes',
						disabled: true,
					},
					{
						id: 'arena-cards',
						label: this.i18n.translateString('website.arena.cards'),
						route: '/arena/cards',
						disabled: true,
					},
				],
			},
			{
				id: 'constructed',
				label: this.i18n.translateString('app.menu.constructed-header'),
				icon: 'assets/svg/ftue/decktracker.svg',
				route: '/constructed',
				subItems: [
					{
						id: 'constructed-meta',
						label: this.i18n.translateString('website.constructed.meta'),
						route: '/constructed/meta',
						disabled: true,
					},
					{
						id: 'constructed-decks',
						label: this.i18n.translateString('website.constructed.decks'),
						route: '/constructed/decks',
						disabled: true,
					},
				],
			},
		];
	}
}
