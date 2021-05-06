import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	Output,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ReferenceCard } from '@firestone-hs/reference-data/lib/models/reference-cards/reference-card';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { SetCard } from '../../models/set';
import { SetsService } from '../../services/collection/sets-service.service';
import { formatClass } from '../../services/hs-utils';
import { PreferencesService } from '../../services/preferences.service';
import { capitalizeEachWord } from '../../services/utils';

declare let amplitude;

@Component({
	selector: 'full-card',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/global/scrollbar.scss`,
		`../../../css/component/collection/full-card.component.scss`,
	],
	template: `
		<div
			class="card-details-container"
			[ngClass]="{ 'owned': card.owned, 'missing': !card.owned, 'hero': isHero }"
			*ngIf="card"
		>
			<div class="card-view-container">
				<card-view [card]="card" [tooltips]="false" [showCounts]="showCount" [highRes]="!isHero">/</card-view>
			</div>
			<div class="details" scrollable>
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
					<div class="card-info set" *ngIf="set">
						<span class="sub-title">Set:</span>
						<span class="value">{{ set }}</span>
					</div>
					<div class="card-info rarity">
						<span class="sub-title">Rarity:</span>
						<span class="value">{{ rarity }}</span>
					</div>
					<div class="card-info flavor-text" *ngIf="flavor">
						<span class="sub-title">Flavor Text:</span>
						<p class="value" [innerHTML]="flavor"></p>
					</div>
					<div class="card-info audio" *ngIf="audioClips && audioClips.length > 0">
						<div class="sub-title">Sounds:</div>
						<div class="audio-category" *ngFor="let category of audioCategories">
							<span class="audio-category-title">{{ category.name }}</span>
							<li class="sound" *ngFor="let sound of category.clips" (mousedown)="playSound(sound)">
								<button class="i-30 brown-theme sound-button">
									<svg class="svg-icon-fill">
										<use xlink:href="assets/svg/sprite.svg#sound" />
									</svg>
								</button>
								<span class="label">{{ sound.name }}</span>
							</li>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullCardComponent {
	// eslint-disable-next-line @angular-eslint/no-output-native
	@Output() close = new EventEmitter();

	class: string;
	type: string;
	set: string;
	rarity: string;
	card: InternalReferenceCard;
	showCount: boolean;
	flavor: SafeHtml;
	isHero: boolean;

	audioCategories: readonly AudioClipCategory[];
	audioClips: readonly AudioClip[];

	// Soi we can cancel a playing sound if a new card is displayed
	private previousClips: readonly AudioClip[] = [];

	@Input() set selectedCard(selectedCard: SetCard | ReferenceCard) {
		if (!selectedCard) {
			return;
		}

		this.previousClips = this.audioClips || [];
		this.audioCategories = this.buildAudio(selectedCard);
		this.audioClips = this.audioCategories
			.map((cat: AudioClipCategory) => cat.clips)
			.reduce((a, b) => a.concat(b), []);

		const card = this.cards.getCard(selectedCard.id);
		// Because the high res images we have for the heroes are a bit weird
		this.isHero = card.type === 'Hero';
		this.card = card as InternalReferenceCard;
		if (
			(selectedCard as SetCard).ownedNonPremium ||
			(selectedCard as SetCard).ownedPremium ||
			(selectedCard as SetCard).ownedDiamond
		) {
			this.showCount = true;
			this.card.ownedPremium = (selectedCard as SetCard).ownedPremium + (selectedCard as SetCard).ownedDiamond;
			this.card.ownedNonPremium = (selectedCard as SetCard).ownedNonPremium;
		} else {
			this.showCount = false;
		}
		this.card.owned = this.card.ownedPremium || this.card.ownedNonPremium;
		this.class =
			card.playerClass !== 'Neutral'
				? card.playerClass
				: card.classes?.length
				? card.classes.map((playerClass) => formatClass(playerClass)).join(', ')
				: 'All classes';
		this.type = card.type;
		this.set = this.cards.setName(card.set);
		this.rarity = card.rarity;
		this.flavor = card.flavor ? this.sanitizer.bypassSecurityTrustHtml(this.transformFlavor(card.flavor)) : null;
	}

	constructor(
		private readonly prefs: PreferencesService,
		private readonly elRef: ElementRef,
		private readonly cards: SetsService,
		private readonly allCards: AllCardsService,
		private readonly sanitizer: DomSanitizer,
		private readonly cdr: ChangeDetectorRef,
	) {}

	playSound(audioClip) {
		amplitude.getInstance().logEvent('sound', {
			'card-id': this.card.id,
		});
		this.cancelPlayingSounds();
		audioClip.audios.forEach((audio) => {
			// console.log('playing', audioClip, audio, this.card.id, this.card.audio, this.card);
			audio.play();
		});
	}

	closeWindow() {
		this.close.emit(null);
	}

	private buildAudio(inputCard: ReferenceCard | SetCard): readonly AudioClipCategory[] {
		const card = this.allCards.getCard(inputCard.id);
		if (!(card as ReferenceCard).audio) {
			return [];
		}

		const result = [
			{
				name: 'Basic',
				clips: this.buildAudioClips(card.audio, 'basic'),
			},
			{
				name: 'Spells',
				clips: this.buildAudioClips(card.audio, 'spell'),
			},
			{
				name: 'Emotes',
				clips: this.buildAudioClips(card.audio, 'emote', 'emote'),
			},
			{
				name: 'Events',
				clips: this.buildAudioClips(card.audio, 'emote', 'event'),
			},
			{
				name: 'Errors',
				clips: this.buildAudioClips(card.audio, 'emote', 'error'),
			},
			{
				name: 'Other',
				clips: this.buildAudioClips(card.audio, null),
			},
		];
		return result.filter((cat) => cat.clips.length > 0);
	}

	private buildAudioClips(audio, type: 'basic' | 'spell' | 'emote' | null, category?: string): readonly AudioClip[] {
		return Object.keys(audio)
			.filter((key) =>
				type !== null
					? key.toLowerCase().includes(type + '_')
					: !key.toLowerCase().includes('basic_') &&
					  !key.toLowerCase().includes('spell_') &&
					  !key.toLowerCase().includes('emote_'),
			)
			.filter((key) => !category || this.REGEXES.find((regex) => regex.regex.test(key))?.category === category)
			.map((key) => {
				const files = [...audio[key]];
				const audioClip: AudioClip = {
					name: this.getSoundName(key),
					files: files,
					audios: files.map((file) =>
						this.createAudio(`https://static.zerotoheroes.com/hearthstone/audio/${file}?v=2`),
					),
				};
				audioClip.audios.forEach((audio) => audio.load());
				return audioClip;
			})
			.filter((audio) => audio.name);
	}

	// The order is important, as the first match is always returned
	private readonly REGEXES = [
		{
			regex: /.*GREETINGS_RESPONSE.*/g,
			value: 'Greetings Response',
			category: 'emote',
		},
		{
			regex: /.*WELL_PLAYED.*/g,
			value: 'Well played',
			category: 'emote',
		},
		{
			regex: /.*OOPS.*/g,
			value: 'Oops',
			category: 'emote',
		},
		{
			regex: /.*THREATEN.*/g,
			value: 'Threaten',
			category: 'emote',
		},
		{
			regex: /.*THANKS.*/g,
			value: 'Thanks',
			category: 'emote',
		},
		{
			regex: /.*SORRY.*/g,
			value: 'Sorry',
			category: 'emote',
		},
		{
			regex: /.*CONCEDE.*/g,
			value: 'Concede',
			category: 'emote',
		},
		{
			regex: /.*START.*/g,
			value: 'Start',
			category: 'emote',
		},
		{
			regex: /.*TIMER.*/g,
			value: 'Timer',
			category: 'emote',
		},
		{
			regex: /.*THINK1.*/g,
			value: 'Think 1',
			category: 'emote',
		},
		{
			regex: /.*THINK2.*/g,
			value: 'Think 2',
			category: 'emote',
		},
		{
			regex: /.*THINK3.*/g,
			value: 'Think 3',
			category: 'emote',
		},
		{
			regex: /.*LOW_CARDS.*/g,
			value: 'Low Cards',
			category: 'emote',
		},
		{
			regex: /.*NO_CARDS.*/g,
			value: 'No Cards',
			category: 'emote',
		},
		{
			regex: /.*WON.*/g,
			value: 'Won',
			category: 'emote',
		},
		{
			regex: /.*MIRROR_START.*/g,
			value: 'Mirror Start',
			category: 'emote',
		},
		{
			regex: /.*ERROR_NEED_WEAPON.*/g,
			value: 'Error Need Weapon',
			category: 'error',
		},
		{
			regex: /.*ERROR_NEED_MANA.*/g,
			value: 'Error Need Mana',
			category: 'error',
		},
		{
			regex: /.*ERROR_MINION_ATTACKED.*/g,
			value: 'Error Minion Attacked',
			category: 'error',
		},
		{
			regex: /.*ERROR_I_ATTACKED.*/g,
			value: 'Error I Attacked',
			category: 'error',
		},
		{
			regex: /.*ERROR_JUST_PLAYED.*/g,
			value: 'Error Just Played',
			category: 'error',
		},
		{
			regex: /.*ERROR_HAND_FULL.*/g,
			value: 'Error Hand Full',
			category: 'error',
		},
		{
			regex: /.*ERROR_FULL_MINIONS.*/g,
			value: 'Error Full Minions',
			category: 'error',
		},
		{
			regex: /.*ERROR_STEALTH.*/g,
			value: 'Error Stealth',
			category: 'error',
		},
		{
			regex: /.*ERROR_PLAY.*/g,
			value: 'Error Play',
			category: 'error',
		},
		{
			regex: /.*ERROR_TARGET.*/g,
			value: 'Error Target',
			category: 'error',
		},
		{
			regex: /.*ERROR_TAUNT.*/g,
			value: 'Error Taunt',
			category: 'error',
		},
		{
			regex: /.*ERROR_GENERIC.*/g,
			value: 'Error Generic',
			category: 'error',
		},
		{
			regex: /.*EVENT_LUNAR_NEW_YEAR.*/g,
			value: 'Lunar New Year',
			category: 'event',
		},
		{
			regex: /.*WINTERVEIL_GREETINGS.*/g,
			value: 'Winterveil Greetings',
			category: 'event',
		},
		{
			regex: /.*HAPPY_NEW_YEAR_20.*/g,
			value: 'Happy New Year 20',
			category: 'event',
		},
		{
			regex: /.*FIRE_FESTIVAL.*/g,
			value: 'Fire Festival',
			category: 'event',
		},
		{
			regex: /.*PIRATE_DAY.*/g,
			value: 'Pirate Day',
			category: 'event',
		},
		{
			regex: /.*HALLOWS_END.*/g,
			value: "Hallow's End",
			category: 'event',
		},
		{
			regex: /.*NOBLEGARDEN.*/g,
			value: 'Noblegarden',
			category: 'event',
		},
		{
			regex: /.*GREETINGS.*/g,
			value: 'Greetings',
			category: 'emote',
		},
	];

	private getSoundName(key: string): string {
		if (!key) {
			return null;
		}

		key = key.toUpperCase();
		switch (key) {
			case 'BASIC_PLAY':
				return 'Play';
			case 'BASIC_DEATH':
				return 'Death';
			case 'BASIC_ATTACK':
				return 'Attack';
		}
		for (const regex of this.REGEXES) {
			// I have no idea why, but testing the regex once doesn't always work for some,
			// while redoing the test fixes the isse
			if (regex.regex.test(key) || regex.regex.test(key)) {
				return regex.value;
			}
		}
		// console.debug('transformling', key);
		return key
			? capitalizeEachWord(
					key
						.replace(/.*/g, '')
						.replace(/SPELL.*/g, '')
						.replace(/Spell.*/g, '')
						.replace(/spell.*/g, '')
						// Order is important here
						.replace(/Hero(_\d*[a-z]?)?.*/g, '')
						.replace(/HERO(_\d*[a-z]?)?.*/g, '')
						.replace(/VO__Male.*/g, '')
						.replace(/VO__Female.*/g, '')
						.replace(/VO__(MALE)?.*/g, '')
						.replace(/VO__(FEMALE)?.*/g, '')
						.replace(/VO_.*/g, '')
						.replace(/MALE_.*/g, '')
						.replace(/Male_.*/g, '')
						.replace(/Female_.*/g, '')
						.replace(/_.*/g, ' ')
						.trim(),
			  )
			: '';
	}

	private cancelPlayingSounds() {
		this.previousClips.forEach((sound) => {
			sound.audios.forEach((audio) => {
				audio.pause();
				audio.currentTime = 0;
			});
		});
		this.audioClips.forEach((sound) => {
			sound.audios.forEach((audio) => {
				audio.pause();
				audio.currentTime = 0;
			});
		});
	}

	private createAudio(src: string): any {
		const audio = new Audio();
		audio.src = src;
		return audio;
	}

	private transformFlavor(flavor: string): string {
		const result = flavor
			.replace(/\n.*/g, '<br>')
			.replace(/<i>.*/g, '')
			.replace(/<\/i>.*/g, '');
		console.debug('flvor', flavor, result);
		return result;
	}
}

interface AudioClipCategory {
	name: string;
	clips: readonly AudioClip[];
}

interface AudioClip {
	name: string;
	files: string[];
	audios: HTMLAudioElement[];
}

interface InternalReferenceCard extends ReferenceCard {
	ownedPremium: number;
	ownedNonPremium: number;
	owned: number;
}
