import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
	standalone: true,
	selector: 'web-in-game-replay-redirect',
	template: `<p>Redirecting to Firestone...</p>`,
})
export class InGameReplayRedirectComponent implements OnInit {
	constructor(private readonly route: ActivatedRoute) {}

	ngOnInit(): void {
		const reviewId = this.route.snapshot.paramMap.get('reviewId');
		if (reviewId) {
			window.location.replace(`firestoneapp://replay/in-game?reviewId=${reviewId}`);
		}
	}
}
