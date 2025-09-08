import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
	imports: [RouterModule],
	selector: 'app-root',
	template: `
		<div class="electron-overlay-app">
			<router-outlet></router-outlet>
		</div>
	`,
	styles: [`
		.electron-overlay-app {
			width: 100vw;
			height: 100vh;
			background: transparent;
			overflow: hidden;
		}
	`],
})
export class AppComponent {
	title = 'electron-overlay';
}
