import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ReferenceCard, ReferenceCardAudio } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { SetCard } from '../../models/set';
import { SetsService } from '../../services/collection/sets-service.service';
import { formatClass } from '../../services/hs-utils';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { capitalizeEachWord, pickRandom } from '../../services/utils';

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
				<card-view [card]="card" [tooltips]="false" [showCounts]="showCount" [highRes]="true">/</card-view>
			</div>
			<div class="details" scrollable>
				<h1>{{ card.name }}</h1>
				<div class="card-details">
					<div class="card-info class" *ngIf="class && class !== 'global.class.undefined'">
						<span class="sub-title" [owTranslate]="'app.collection.card-details.class'"></span>
						<span class="value">{{ class }}</span>
					</div>
					<div class="card-info type">
						<span class="sub-title" [owTranslate]="'app.collection.card-details.type'"></span>
						<span class="value">{{ type }}</span>
					</div>
					<div class="card-info set" *ngIf="set">
						<span class="sub-title" [owTranslate]="'app.collection.card-details.set'"></span>
						<span class="value">{{ set }}</span>
					</div>
					<div class="card-info rarity" *ngIf="rarity">
						<span class="sub-title" [owTranslate]="'app.collection.card-details.rarity'"></span>
						<span class="value">{{ rarity }}</span>
					</div>
					<div class="card-info flavor-text" *ngIf="flavor">
						<span class="sub-title" [owTranslate]="'app.collection.card-details.flavor'"></span>
						<p class="value" [innerHTML]="flavor"></p>
					</div>
					<div class="card-info audio" *ngIf="audioClips && audioClips.length > 0">
						<span class="sub-title" [owTranslate]="'app.collection.card-details.sounds-title'"></span>
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

		console.debug('set card', selectedCard);
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
			card.classes?.length
			    ? card.classes.map((playerClass) => formatClass(playerClass, this.i18n)).join(', ')
			    : card.playerClass == 'Neutral'
			        ? formatClass('all', this.i18n)
			        : formatClass(card.playerClass, this.i18n);
				
		this.type = card.type;
		this.set = this.cards.setName(card.set);
		this.rarity = card.rarity;
		const flavorSource = card.flavor ?? card.text;
		this.flavor = flavorSource?.length
			? this.sanitizer.bypassSecurityTrustHtml(this.transformFlavor(flavorSource))
			: null;
	}

	constructor(
		private readonly i18n: LocalizationFacadeService,
		private readonly cards: SetsService,
		private readonly allCards: CardsFacadeService,
		private readonly sanitizer: DomSanitizer,
	) {}

	playSound(audioClip: AudioClip) {
		amplitude.getInstance().logEvent('sound', {
			'card-id': this.card.id,
		});
		this.cancelPlayingSounds();

		const audioGroup = audioClip.audioGroup;

		const mainFiles = Object.values(audioGroup)
			.flatMap((effect) => effect.mainSounds)
			.filter((sound) => !!sound);
		const randomSounds =
			Object.values(audioGroup)
				.filter((effect) => !!effect.randomSounds?.length)
				.map((effect) => pickRandom(effect.randomSounds).sound)
				.filter((sound) => sound) ?? [];
		const allSoundsToPlay = [...mainFiles, ...randomSounds];
		console.debug('will play', allSoundsToPlay, audioGroup);
		audioClip.audios
			.filter((audio) => allSoundsToPlay.includes((audio as any).key))
			.forEach((audio) => {
				audio.play();
			});
	}

	closeWindow() {
		this.close.emit(null);
	}

	private buildAudio(inputCard: ReferenceCard | SetCard): readonly AudioClipCategory[] {
		const card = this.allCards.getCard(inputCard.id);
		if (!(card as ReferenceCard).audio2) {
			return [];
		}

		const result = [
			{
				name: this.i18n.translateString('app.collection.card-details.sounds.category.basic'),
				clips: this.buildAudioClips(card.audio2, 'basic'),
			},
			{
				name: this.i18n.translateString('app.collection.card-details.sounds.category.spell'),
				clips: this.buildAudioClips(card.audio2, 'spell'),
			},
			{
				name: this.i18n.translateString('app.collection.card-details.sounds.category.emote'),
				clips: this.buildAudioClips(card.audio2, 'emote', 'emote'),
			},
			{
				name: this.i18n.translateString('app.collection.card-details.sounds.category.event'),
				clips: this.buildAudioClips(card.audio2, 'emote', 'event'),
			},
			{
				name: this.i18n.translateString('app.collection.card-details.sounds.category.error'),
				clips: this.buildAudioClips(card.audio2, 'emote', 'error'),
			},
		];
		const allMappedClips = result
			.map((cat) => cat.clips)
			.reduce((a, b) => a.concat(b), [])
			.map((clip) => clip.originalKey);
		const otherAudio = { ...card.audio2 };
		allMappedClips.forEach((key) => delete otherAudio[key]);
		const otherCategory = {
			name: this.i18n.translateString('app.collection.card-details.sounds.category.other'),
			clips: this.buildAudioClips(otherAudio, null),
		};

		return [...result, otherCategory].filter((cat) => cat.clips.length > 0);
	}

	private buildAudioClips(
		audio: ReferenceCardAudio,
		type: 'basic' | 'spell' | 'emote' | null,
		category?: string,
	): readonly AudioClip[] {
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
				const audioGroup = audio[key];
				const mainFiles = Object.values(audioGroup).flatMap((effect) => effect.mainSounds);
				const allRandomFiles =
					Object.values(audioGroup)
						.filter((effect) => !!effect.randomSounds?.length)
						.flatMap((effect) => effect.randomSounds)
						.map((sound) => sound.sound) ?? [];
				const files = [...mainFiles, ...allRandomFiles];
				const audioClip: AudioClip = {
					name: this.getSoundName(key),
					originalKey: key,
					audioGroup: audioGroup,
					audios: files.map((file) =>
						this.createAudio(file, `https://static.zerotoheroes.com/hearthstone/audio/${file}`),
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
			regex: /.*GREETINGS.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.greetings'),
			category: 'emote',
		},
		{
			regex: /.*GREETINGS_RESPONSE.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.greetings-response'),
			category: 'emote',
		},
		{
			regex: /.*WELL_PLAYED.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.well-played'),
			category: 'emote',
		},
		{
			regex: /.*OOPS.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.oops'),
			category: 'emote',
		},
		{
			regex: /.*THREATEN.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.threaten'),
			category: 'emote',
		},
		{
			regex: /.*THANKS.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.thanks'),
			category: 'emote',
		},
		{
			regex: /.*SORRY.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.sorry'),
			category: 'emote',
		},
		{
			regex: /.*WOW.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.wow'),
			category: 'emote',
		},
		{
			regex: /.*CONCEDE.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.concede'),
			category: 'emote',
		},
		{
			regex: /.*START.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.start'),
			category: 'emote',
		},
		{
			regex: /.*TIMER?.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.timer'),
			category: 'emote',
		},
		{
			regex: /.*THINK(?:ING_0)?1.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.think-1'),
			category: 'emote',
		},
		{
			regex: /.*THINK(?:ING_0)?2.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.think-2'),
			category: 'emote',
		},
		{
			regex: /.*THINK(?:ING_0)?3.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.think-3'),
			category: 'emote',
		},
		{
			regex: /.*LOW_?CARDS.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.low-cards'),
			category: 'emote',
		},
		{
			regex: /.*NO_?CARDS.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.no-cards'),
			category: 'emote',
		},
		{
			regex: /.*WON.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.won'),
			category: 'emote',
		},
		{
			regex: /.*MIRROR_START.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.mirror-start'),
			category: 'emote',
		},
		{
			regex: /.*ERROR_NEED_WEAPON.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-need-weapon'),
			category: 'error',
		},
		{
			regex: /.*ERROR_NEED_MANA.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-need-mana'),
			category: 'error',
		},
		{
			regex: /.*ERROR_MINION_ATTACKED.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-minion-attacked'),
			category: 'error',
		},
		{
			regex: /.*ERROR_I_ATTACKED.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-i-attacked'),
			category: 'error',
		},
		{
			regex: /.*ERROR_JUST_PLAYED.*|.*SUMMON_SICKNESS.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-just-played'),
			category: 'error',
		},
		{
			regex: /.*ERROR_HAND_FULL.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-hand-full'),
			category: 'error',
		},
		{
			regex: /.*ERROR_FULL_MINIONS.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-full-minions'),
			category: 'error',
		},
		{
			regex: /.*ERROR_STEALTH.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-stealth'),
			category: 'error',
		},
		{
			regex: /.*ERROR_PLAY.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-play'),
			category: 'error',
		},
		{
			regex: /.*ERROR_TARGET.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-target'),
			category: 'error',
		},
		{
			regex: /.*ERROR_TAUNT.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-taunt'),
			category: 'error',
		},
		{
			regex: /.*ERROR_GENERIC.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-generic'),
			category: 'error',
		},
		{
			regex: /.*WINTERVEIL_GREETINGS.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.winterveil-greetings'),
			category: 'event',
		},
		{
			regex: /.*HAPPY_HOLIDAYS.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.happy-holidays'),
			category: 'event',
		},
		{
			regex: /.*EVENT_LUNAR_NEW_YEAR.*|.*HAPPY_NEW_YEAR_LUNAR.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.lunar-new-year'),
			category: 'event',
		},
		{
			regex: /.*HAPPY_NEW_YEAR.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.happy-new-year'),
			category: 'event',
		},
		{
			regex: /.*FIRE_FESTIVAL.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.fire-festival'),
			category: 'event',
		},
		{
			regex: /.*PIRATE_DAY.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.pirate-day'),
			category: 'event',
		},
		{
			regex: /.*HALLOWS_END.*|.*HAPPY_HALLOWEEN.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.hallows-end'),
			category: 'event',
		},
		{
			regex: /.*NOBLEGARDEN.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.noblegarden'),
			category: 'event',
		},
		{
			regex: /.*PICKED.*/g,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.picked'),
			category: 'other',
		},
	];

	private getSoundName(key: string): string {
		if (!key) {
			return null;
		}

		key = key.toUpperCase();
		switch (key) {
			case 'BASIC_PLAY':
				return this.i18n.translateString('app.collection.card-details.sounds.effect.play');
			case 'BASIC_DEATH':
				return this.i18n.translateString('app.collection.card-details.sounds.effect.death');
			case 'BASIC_ATTACK':
				return this.i18n.translateString('app.collection.card-details.sounds.effect.attack');
		}
		for (const regex of this.REGEXES) {
			// I have no idea why, but testing the regex once doesn't always work for some,
			// while redoing the test fixes the isse
			if (regex.regex.test(key) || regex.regex.test(key)) {
				return regex.value;
			}
		}
		return key
			? capitalizeEachWord(
					key
						.replace(/SPELL/g, '')
						.replace(/Spell/g, '')
						.replace(/spell/g, '')
						// Order is important here
						.replace(/Hero(_\d*[a-z]?)?/g, '')
						.replace(/HERO(_\d*[a-z]?)?/g, '')
						.replace(/VO__Male/g, '')
						.replace(/VO__Female/g, '')
						.replace(/VO__(MALE)?/g, '')
						.replace(/VO__(FEMALE)?/g, '')
						.replace(/VO_/g, '')
						.replace(/MALE_/g, '')
						.replace(/Male_/g, '')
						.replace(/Female_/g, '')
						.replace(/_/g, ' ')
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

	private createAudio(key: string, src: string): any {
		const audio = new Audio();
		audio.src = src;
		(audio as any).key = key;
		return audio;
	}

	private transformFlavor(flavor: string): string {
		const result = flavor
			.replace(/\n/g, '<br>')
			.replace(/<i>/g, '')
			.replace(/<\/i>/g, '')
			.replace(/<br>/g, ' ')
			.replace(/[x]/g, '');
		return result;
	}
}

interface AudioClipCategory {
	name: string;
	clips: readonly AudioClip[];
}

interface AudioClip {
	name: string;
	originalKey: string;
	audioGroup: ReferenceCardAudio[0];
	audios: HTMLAudioElement[];
}

interface InternalReferenceCard extends ReferenceCard {
	ownedPremium: number;
	ownedNonPremium: number;
	owned: number;
}
