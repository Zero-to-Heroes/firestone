import { Component, ViewEncapsulation, HostListener } from '@angular/core';

import { DebugService } from '../services/debug.service';

import * as Raven from 'raven-js';

declare var overwolf: any;

@Component({
	selector: 'welcome-page',
	styleUrls: [`../../css/component/welcome-page.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="root">
			<div class="app-container">
				<div class="menu-bar">
					<i class="glyphicon glyphicon-remove" (click)="closeWindow()"></i>
				</div>
				<div class="content-container">
					<div class="content">
						<h1>
							<img class="logo" src="/IconStore.png" />
							<div class="title-text">
								<span class="title">HS Collection Companion</span>
								<span class="subtitle">Pack Opening & Collection Assistant</span>
							</div>
						</h1>
						<div class="main-text">
							<span class="text">
								To begin, start opening packs in-game. <br />
								HS Collection Companion will automatically show you notifications for new cards and the amount of dust in case you open duplicates.
							</span>
							<span class="text">
								<b>NEW! </b>To display the Collection window in-game, press <span class="command">Alt</span> + <span class="command">C</span>.
							</span>
						</div>
					</div>
					<div class="actions">
						<div class="action" (click)="openDescription()">
							<i class="icon glyphicon glyphicon-home"></i>
							<span>What is HS Collection Companion?</span>
						</div>
						<div class="action" (click)="openIssuesPage()">
							<i class="icon glyphicon glyphicon-question-sign"></i>
							<span>Get help or send us feedback</span>
						</div>
					</div>
					<social-media></social-media>
					<version></version>
				</div>
			</div>
		</div>
	`,
})
// 7.1.1.17994
export class WelcomePageComponent {

	constructor(private debugService: DebugService) {
	}

	@HostListener('mousedown', ['$event'])
	private dragMove(event: MouseEvent) {
		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success"){
				overwolf.windows.dragMove(result.window.id);
			}
		});
	};

	private closeWindow() {
		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success"){
				overwolf.windows.close(result.window.id);
			}
		});
	};

	private openDescription() {
		window.open('http://support.overwolf.com/knowledge-base/hs-collection-companion-faq/');
	}

	private openIssuesPage() {
		window.open('https://docs.google.com/forms/d/e/1FAIpQLSfcGcV-kZHFshv8RIjMZYPbEHQEQwyo7e1IeXuZ4Tyyz4USiQ/viewform?usp=sf_link');
	}
}
