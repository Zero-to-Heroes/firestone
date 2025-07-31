import { Component } from '@angular/core';
import { WebShellComponent } from '@firestone/shared/web-shell';

@Component({
	standalone: true,
	selector: 'web-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	imports: [WebShellComponent],
})
export class AppComponent {
	title = 'Firestone Web';
}
