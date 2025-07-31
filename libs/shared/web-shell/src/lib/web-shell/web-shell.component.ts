import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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
}

interface NavigationSubItem {
	id: string;
	label: string;
	route: string;
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

	navigationSections: NavigationSection[] = [
		{
			id: 'battlegrounds',
			label: 'Battlegrounds',
			icon: 'assets/svg/ftue/battlegrounds.svg',
			route: '/battlegrounds',
			subItems: [
				{ id: 'bg-heroes', label: 'Heroes', route: '/battlegrounds/heroes' },
				{ id: 'bg-comps', label: 'Compositions', route: '/battlegrounds/comps' },
				{ id: 'bg-cards', label: 'Cards', route: '/battlegrounds/cards' },
			],
		},
		{
			id: 'arena',
			label: 'Arena',
			icon: 'assets/svg/ftue/arena.svg',
			route: '/arena',
			subItems: [
				{ id: 'arena-stats', label: 'Stats', route: '/arena/stats' },
				{ id: 'arena-cards', label: 'Cards', route: '/arena/cards' },
			],
		},
		{
			id: 'constructed',
			label: 'Constructed',
			icon: 'assets/svg/ftue/constructed.svg',
			route: '/constructed',
			subItems: [
				{ id: 'constructed-decks', label: 'Decks', route: '/constructed/decks' },
				{ id: 'constructed-meta', label: 'Meta', route: '/constructed/meta' },
			],
		},
	];

	constructor(private router: Router) {
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
}
