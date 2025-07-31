import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DownloadButtonComponent } from './common/download-button/download-button.component';

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
	standalone: true,
	selector: 'web-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	imports: [RouterOutlet, RouterLink, RouterLinkActive, InlineSVGModule, CommonModule, DownloadButtonComponent],
})
export class AppComponent implements OnInit, OnDestroy {
	@ViewChild('dropdownContainer', { read: ElementRef }) dropdownContainer?: ElementRef;

	title = 'Firestone Web';
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
				{ id: 'arena-heroes', label: 'Heroes', route: '/arena/heroes' },
				{ id: 'arena-cards', label: 'Cards', route: '/arena/cards' },
				{ id: 'arena-runs', label: 'Runs', route: '/arena/runs' },
			],
		},
		{
			id: 'constructed',
			label: 'Constructed',
			icon: 'assets/svg/ftue/decktracker.svg',
			route: '/constructed',
			subItems: [
				{ id: 'constructed-classes', label: 'Classes', route: '/constructed/classes' },
				{ id: 'constructed-decks', label: 'Decks', route: '/constructed/decks' },
			],
		},
	];

	constructor(private router: Router) {
		// Set initial section based on current route or default to battlegrounds
		this.currentSection = this.navigationSections[0];
		this.updateCurrentSectionFromRoute(this.router.url);
	}

	ngOnInit() {
		// Listen to route changes to update the current section
		this.routerSubscription = this.router.events
			.pipe(filter((event) => event instanceof NavigationEnd))
			.subscribe((event: NavigationEnd) => {
				this.updateCurrentSectionFromRoute(event.url);
			});

		// Add click listener to document to close dropdown when clicking outside
		document.addEventListener('click', this.onDocumentClick.bind(this));
	}

	ngOnDestroy() {
		if (this.routerSubscription) {
			this.routerSubscription.unsubscribe();
		}
		document.removeEventListener('click', this.onDocumentClick.bind(this));
	}

	private updateCurrentSectionFromRoute(url: string) {
		const segment = url.split('/')[1];
		const section = this.navigationSections.find((s) => s.id === segment);
		if (section) {
			this.currentSection = section;
		}
	}

	private onDocumentClick(event: Event) {
		if (this.isDropdownOpen && this.dropdownContainer) {
			const target = event.target as Element;
			if (!this.dropdownContainer.nativeElement.contains(target)) {
				this.closeDropdown();
			}
		}
	}

	toggleMobileMenu() {
		this.isMobileMenuOpen = !this.isMobileMenuOpen;
	}

	closeMobileMenu() {
		this.isMobileMenuOpen = false;
	}

	toggleDropdown() {
		this.isDropdownOpen = !this.isDropdownOpen;
	}

	closeDropdown() {
		this.isDropdownOpen = false;
	}

	selectSection(section: NavigationSection) {
		this.currentSection = section;
		this.closeDropdown();
		// Navigate to the main route of the selected section
		this.router.navigate([section.route]);
	}

	getCurrentSubItems(): NavigationSubItem[] {
		return this.currentSection.subItems;
	}
}
