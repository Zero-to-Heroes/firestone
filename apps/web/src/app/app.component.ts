import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { InlineSVGModule } from 'ng-inline-svg-2';

@Component({
	standalone: true,
	selector: 'web-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	imports: [RouterOutlet, RouterLink, RouterLinkActive, InlineSVGModule],
})
export class AppComponent {
	title = 'Firestone Web';
	isMobileMenuOpen = false;

	toggleMobileMenu() {
		this.isMobileMenuOpen = !this.isMobileMenuOpen;
	}

	closeMobileMenu() {
		this.isMobileMenuOpen = false;
	}
}
