import { Component } from '@angular/core';

@Component({
	selector: 'app-root',
	standalone: false,
	template: `
		<div class="electron-overlay-app">
			<router-outlet></router-outlet>
		</div>
	`,
	styles: [
		`
			.electron-overlay-app {
				width: 100vw;
				height: 100vh;
				background: transparent;
				overflow: hidden;
			}
		`,
	],
})
export class AppComponent {
	title = 'electron-overlay';
}
