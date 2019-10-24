import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	Output,
	ViewEncapsulation,
} from '@angular/core';
import { SetCard } from '../../models/set';
import { AllCardsService } from '../../services/all-cards.service';
import { Events } from '../../services/events.service';

declare var amplitude;

@Component({
	selector: 'full-card',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/collection/full-card.component.scss`,
		`../../../css/global/scrollbar.scss`,
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="card-details-container" [ngClass]="{ 'owned': card.owned, 'missing': !card.owned }" *ngIf="card">
			<div class="card-view-container">
				<card-view [card]="card" [tooltips]="false" [showCounts]="true" [highRes]="true">/</card-view>
			</div>
			<div class="details">
				<h1>{{ card.name }}</h1>
				<div class="card-details">
					<div class="card-info class">
						<span class="sub-title">Class:</span>
						<span class="value">{{ class }}</span>
					</div>
					<div class="card-info type">
						<span class="sub-title">Type:</span>
						<span class="value">{{ type }}</span>
					</div>
					<div class="card-info set">
						<span class="sub-title">Set:</span>
						<span class="value">{{ set }}</span>
					</div>
					<div class="card-info rarity">
						<span class="sub-title">Rarity:</span>
						<span class="value">{{ rarity }}</span>
					</div>
					<div class="card-info audio" *ngIf="audioClips && audioClips.length > 0">
						<span class="sub-title">Sound:</span>
						<ul class="value">
							<li class="sound" *ngFor="let sound of audioClips" (mousedown)="playSound(sound)">
								<span class="label">{{ sound.name }}</span>
								<button class="i-30 brown-theme sound-button">
									<svg class="svg-icon-fill">
										<use xlink:href="/Files/assets/svg/sprite.svg#sound" />
									</svg>
								</button>
							</li>
						</ul>
					</div>
					<div class="card-info flavor-text">
						<span class="sub-title">Flavor Text:</span>
						<span class="value">{{ card.flavor }}</span>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
// 7.1.1.17994
export class FullCardComponent {
	@Output() close = new EventEmitter();

	class: string;
	type: string;
	set: string;
	rarity: string;
	audioClips: any[];
	// TODO: get rid of this and use a typed model for our own components at least
	card: any;

	// Soi we can cancel a playing sound if a new card is displayed
	private previousClips = [];

	constructor(private events: Events, private elRef: ElementRef, private cards: AllCardsService) {}

	@Input('selectedCard') set selectedCard(selectedCard: SetCard) {
		if (!selectedCard) {
			return;
		}
		this.previousClips = this.audioClips || [];
		this.audioClips = [];
		this.events.broadcast(Events.HIDE_TOOLTIP);
		const card = this.cards.getCard(selectedCard.id);
		// console.log('setting full card', card, selectedCard);
		if (card.audio) {
			Object.keys(card.audio).forEach((key, index) => {
				if (!card.audio[key] || card.audio[key].length === 0) {
					return;
				}
				const audioClip = {
					name: key,
					files: [...card.audio[key]],
					audios: [],
				};
				for (let i = 0; i < audioClip.files.length; i++) {
					if (!audioClip.files[i]) {
						console.warn('Missing audio file', card.name, selectedCard.id, card.audio, card);
						continue;
					}
					const audio = new Audio();
					audio.src = `https://static.zerotoheroes.com/hearthstone/audio/${audioClip.files[i]}`;
					audio.load();
					audioClip.audios.push(audio);
				}
				this.audioClips.push(audioClip);
			});
		}
		this.card = card;
		this.card.ownedPremium = selectedCard.ownedPremium;
		this.card.ownedNonPremium = selectedCard.ownedNonPremium;
		this.card.owned = this.card.ownedPremium || this.card.ownedNonPremium;
		this.class = card.playerClass === 'Neutral' ? 'All classes' : card.playerClass;
		this.type = card.type;
		this.set = this.cards.setName(card.set);
		this.rarity = card.rarity;
	}

	playSound(audioClip) {
		amplitude.getInstance().logEvent('sound', {
			'card-id': this.card.id,
		});
		this.cancelPlayingSounds();
		audioClip.audios.forEach(audio => {
			console.log('playing', audioClip, audio, this.card.id, this.card.audio, this.card);
			audio.play();
		});
	}

	closeWindow() {
		this.close.emit(null);
	}

	// Prevent the window from being dragged around if user scrolls with click
	@HostListener('mousedown', ['$event'])
	onHistoryClick(event: MouseEvent) {
		const rect = this.elRef.nativeElement.querySelector('.card-details').getBoundingClientRect();
		const scrollbarWidth = 5;
		// console.log('mousedown on sets container', rect, event);
		if (event.offsetX >= rect.width - scrollbarWidth) {
			event.stopPropagation();
		}
	}

	private cancelPlayingSounds() {
		this.previousClips.forEach(sound => {
			sound.audios.forEach(audio => {
				audio.pause();
				audio.currentTime = 0;
			});
		});
		this.audioClips.forEach(sound => {
			sound.audios.forEach(audio => {
				audio.pause();
				audio.currentTime = 0;
			});
		});
	}
}
