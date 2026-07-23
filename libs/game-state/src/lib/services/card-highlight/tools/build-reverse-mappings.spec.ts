import {
	smartSplit,
	expandSelectorConditions,
	extractConditionsFromCleanedCode,
	analyzeSelectorFunction,
	convertToConditionString,
	buildReverseCondition,
	extractCardConditions,
	extractSelectorCardConditions,
	ConditionMapping,
} from './build-reverse-mappings';

// ─── 1. smartSplit (pure, no I/O) ───────────────────────────────────────────

describe('smartSplit', () => {
	it('splits simple comma-separated values', () => {
		expect(smartSplit('a, b, c', ',')).toEqual(['a', 'b', 'c']);
	});

	it('respects nested parentheses', () => {
		expect(smartSplit('or(a, b), c', ',')).toEqual(['or(a, b)', 'c']);
	});

	it('handles deeply nested parentheses', () => {
		expect(smartSplit("and(hasMechanicStr('X'), not(passive)), spell", ',')).toEqual([
			"and(hasMechanicStr('X'), not(passive))",
			'spell',
		]);
	});

	it('returns empty array for empty/whitespace string', () => {
		expect(smartSplit('', ',')).toEqual([]);
		expect(smartSplit('   ', ',')).toEqual([]);
	});

	it('handles single element with no delimiter', () => {
		expect(smartSplit('minion', ',')).toEqual(['minion']);
	});

	it('handles multiple levels of nesting', () => {
		expect(smartSplit('or(and(a, b), and(c, d)), e', ',')).toEqual(['or(and(a, b), and(c, d))', 'e']);
	});
});

// ─── 2. buildReverseCondition (pure, no I/O) ────────────────────────────────

describe('buildReverseCondition', () => {
	describe('card types', () => {
		it('MINION -> type check', () => {
			expect(buildReverseCondition('MINION')).toBe("refCard.type?.toUpperCase() === 'MINION'");
		});
		it('SPELL -> type check', () => {
			expect(buildReverseCondition('SPELL')).toBe("refCard.type?.toUpperCase() === 'SPELL'");
		});
		it('WEAPON -> type check', () => {
			expect(buildReverseCondition('WEAPON')).toBe("refCard.type?.toUpperCase() === 'WEAPON'");
		});
		it('LOCATION -> type check', () => {
			expect(buildReverseCondition('LOCATION')).toBe("refCard.type?.toUpperCase() === 'LOCATION'");
		});
	});

	describe('races', () => {
		const races = ['BEAST', 'MECH', 'DRAGON', 'MURLOC', 'PIRATE', 'DEMON', 'ELEMENTAL', 'UNDEAD', 'NAGA', 'TOTEM'];
		for (const race of races) {
			it(`${race} -> race includes check`, () => {
				const result = buildReverseCondition(race);
				expect(result).not.toBeNull();
				expect(result).toContain(`includes('${race}')`);
			});
		}
	});

	describe('spell schools', () => {
		const schools = ['HOLY', 'FROST', 'FIRE', 'NATURE', 'SHADOW', 'FEL', 'ARCANE'];
		for (const school of schools) {
			it(`${school} -> spell school check`, () => {
				const result = buildReverseCondition(school);
				expect(result).not.toBeNull();
				expect(result).toContain(`'${school}'`);
			});
		}
	});

	describe('compound conditions', () => {
		it('MINION + BEAST -> AND of type + race', () => {
			const result = buildReverseCondition('BEAST + MINION');
			expect(result).not.toBeNull();
			expect(result).toContain('&&');
			expect(result).toContain("'MINION'");
			expect(result).toContain("'BEAST'");
		});

		it('HOLY + SPELL -> AND of spell school + type', () => {
			const result = buildReverseCondition('HOLY + SPELL');
			expect(result).not.toBeNull();
			expect(result).toContain('&&');
		});
	});

	describe('cost conditions', () => {
		it('COST_MORE_5 -> cost > 5', () => {
			const result = buildReverseCondition('COST_MORE_5');
			expect(result).toContain('refCard.cost');
			expect(result).toContain('> 5');
		});
		it('COST_LESS_3 -> cost < 3', () => {
			const result = buildReverseCondition('COST_LESS_3');
			expect(result).toContain('< 3');
		});
		it('COST_EQUAL_1 -> cost === 1', () => {
			const result = buildReverseCondition('COST_EQUAL_1');
			expect(result).toContain('=== 1');
		});
	});

	describe('attack conditions', () => {
		it('ATTACK_MORE_4 -> attack > 4', () => {
			const result = buildReverseCondition('ATTACK_MORE_4');
			expect(result).toContain('refCard.attack');
			expect(result).toContain('> 4');
		});
	});

	describe('mechanic conditions', () => {
		it('HAS_MECHANIC_GENERATES_SPELL -> mechanics includes check', () => {
			const result = buildReverseCondition('HAS_MECHANIC_GENERATES_SPELL');
			expect(result).toContain("refCard.mechanics?.includes('GENERATES_SPELL')");
		});
		it('HAS_MECHANIC_RUSH -> mechanics includes check', () => {
			const result = buildReverseCondition('HAS_MECHANIC_RUSH');
			expect(result).toContain("refCard.mechanics?.includes('RUSH')");
		});
	});

	describe('other conditions', () => {
		it('LEGENDARY -> rarity check', () => {
			expect(buildReverseCondition('LEGENDARY')).toContain("'LEGENDARY'");
		});
		it('NEUTRAL -> classes includes check', () => {
			expect(buildReverseCondition('NEUTRAL')).toContain("'NEUTRAL'");
		});
		it('NOT_TRIBELESS -> races length check', () => {
			expect(buildReverseCondition('NOT_TRIBELESS')).toContain('refCard.races');
		});
		it('PROTOSS -> mechanics includes check', () => {
			expect(buildReverseCondition('PROTOSS')).toContain("'PROTOSS'");
		});
		it('ZERG -> mechanics includes check', () => {
			expect(buildReverseCondition('ZERG')).toContain("'ZERG'");
		});
		it('TERRAN -> mechanics includes check', () => {
			expect(buildReverseCondition('TERRAN')).toContain("'TERRAN'");
		});
		it('TEMPLAR -> returns null (not reversible)', () => {
			expect(buildReverseCondition('TEMPLAR')).toBeNull();
		});
	});

	describe('now-handled conditions (previously unhandled)', () => {
		it('HAS_SPELL_SCHOOL -> !!refCard.spellSchool', () => {
			expect(buildReverseCondition('HAS_SPELL_SCHOOL')).toBe('!!refCard.spellSchool');
		});
	});

	describe('still unhandled conditions', () => {
		const unhandled = [
			'STARSHIP_EXTENDED',
			'LOCATION_EXTENDED',
			'SPELL_EXTENDED',
			'DEALS_DAMAGE',
			'IMBUE',
			'SPEND_CORPSE',
			'GENERATES_PLAGUE',
			'DARK_GIFT',
			'PALADIN',
			'SELF_DAMAGE_HERO',
			'GENERATES_TEMPORARY_CARD',
			'GENERATE_CORPSE',
			'SHUFFLES_CARD_INTO_DECK',
			'LIBRAM_DISCOUNT',
			'RELIC',
			'GENERATE_SLAGCLAW',
			'IS_PLAGUE',
		];
		for (const condition of unhandled) {
			it(`${condition} -> returns null`, () => {
				expect(buildReverseCondition(condition)).toBeNull();
			});
		}
	});
});

// ─── 3. analyzeSelectorFunction (reads selectors.ts) ────────────────────────

describe('analyzeSelectorFunction', () => {
	describe('single-condition selectors that resolve', () => {
		it('spell -> ["SPELL"]', () => {
			const result = analyzeSelectorFunction('spell');
			expect(result).toEqual(['SPELL']);
		});

		it('minion -> ["MINION"] via cardType(CardType.MINION)', () => {
			const result = analyzeSelectorFunction('minion');
			expect(result).toEqual(['MINION']);
		});

		it('location -> ["LOCATION"]', () => {
			const result = analyzeSelectorFunction('location');
			expect(result).toEqual(['LOCATION']);
		});

		it('deathrattle -> HAS_MECHANIC via hasMechanic(GameTag.DEATHRATTLE)', () => {
			const result = analyzeSelectorFunction('deathrattle');
			expect(result).not.toBeNull();
			expect(result!.length).toBeGreaterThanOrEqual(1);
		});

		it('battlecry -> HAS_MECHANIC via hasMechanic(GameTag.BATTLECRY)', () => {
			const result = analyzeSelectorFunction('battlecry');
			expect(result).not.toBeNull();
		});

		it('taunt -> HAS_MECHANIC via hasMechanic(GameTag.TAUNT)', () => {
			const result = analyzeSelectorFunction('taunt');
			expect(result).not.toBeNull();
		});

		it('rush -> HAS_MECHANIC via hasMechanic(GameTag.RUSH)', () => {
			const result = analyzeSelectorFunction('rush');
			expect(result).not.toBeNull();
		});
	});

	describe('multi-condition (OR) selectors', () => {
		it('spellExtended -> ["SPELL", "HAS_MECHANIC_GENERATES_SPELL"]', () => {
			const result = analyzeSelectorFunction('spellExtended');
			expect(result).not.toBeNull();
			expect(result).toContain('SPELL');
			expect(result).toContain('HAS_MECHANIC_GENERATES_SPELL');
			expect(result!.length).toBe(2);
		});

		it('divineShield -> resolves (or of strict + givesDivineShield)', () => {
			const result = analyzeSelectorFunction('divineShield');
			expect(result).not.toBeNull();
			expect(result!.length).toBeGreaterThanOrEqual(1);
		});

		it('weapon -> resolves (or of cardType WEAPON + givesWeapon)', () => {
			const result = analyzeSelectorFunction('weapon');
			expect(result).not.toBeNull();
			expect(result).toContain('WEAPON');
		});
	});

	describe('selectors with spell schools', () => {
		it('arcane -> ["ARCANE"] via spellSchool(SpellSchool.ARCANE) recognition', () => {
			expect(analyzeSelectorFunction('arcane')).toEqual(['ARCANE']);
		});

		it('holy -> ["HOLY"] via spellSchool(SpellSchool.HOLY) recognition', () => {
			expect(analyzeSelectorFunction('holy')).toEqual(['HOLY']);
		});

		it('felStrict -> ["FEL"] via spellSchoolStrict(SpellSchool.FEL) recognition', () => {
			expect(analyzeSelectorFunction('felStrict')).toEqual(['FEL']);
		});

		it('arcaneStrict -> ["ARCANE"]', () => {
			expect(analyzeSelectorFunction('arcaneStrict')).toEqual(['ARCANE']);
		});

		it('fireStrict -> ["FIRE"]', () => {
			expect(analyzeSelectorFunction('fireStrict')).toEqual(['FIRE']);
		});

		it('frostStrict -> ["FROST"]', () => {
			expect(analyzeSelectorFunction('frostStrict')).toEqual(['FROST']);
		});

		it('holyStrict -> ["HOLY"]', () => {
			expect(analyzeSelectorFunction('holyStrict')).toEqual(['HOLY']);
		});

		it('natureStrict -> ["NATURE"]', () => {
			expect(analyzeSelectorFunction('natureStrict')).toEqual(['NATURE']);
		});

		it('shadowStrict -> ["SHADOW"]', () => {
			expect(analyzeSelectorFunction('shadowStrict')).toEqual(['SHADOW']);
		});
	});

	describe('previously failing multi-line definitions (now resolved)', () => {
		it('starshipExtended -> ["HAS_MECHANIC_STARSHIP_PIECE"]', () => {
			const result = analyzeSelectorFunction('starshipExtended');
			expect(result).toEqual(['HAS_MECHANIC_STARSHIP_PIECE']);
		});

		it('starshipPiece -> ["HAS_MECHANIC_STARSHIP_PIECE"]', () => {
			const result = analyzeSelectorFunction('starshipPiece');
			expect(result).toEqual(['HAS_MECHANIC_STARSHIP_PIECE']);
		});

		it('spendCorpse -> ["HAS_MECHANIC_SPEND_CORPSE"]', () => {
			const result = analyzeSelectorFunction('spendCorpse');
			expect(result).toEqual(['HAS_MECHANIC_SPEND_CORPSE']);
		});

		it('generateCorpse -> ["HAS_MECHANIC_GENERATE_CORPSE"]', () => {
			const result = analyzeSelectorFunction('generateCorpse');
			expect(result).toEqual(['HAS_MECHANIC_GENERATE_CORPSE']);
		});

		it('damage -> ["HAS_MECHANIC_DEAL_DAMAGE"]', () => {
			const result = analyzeSelectorFunction('damage');
			expect(result).toEqual(['HAS_MECHANIC_DEAL_DAMAGE']);
		});

		it('spellDamage -> ["HAS_MECHANIC_SPELLPOWER"]', () => {
			const result = analyzeSelectorFunction('spellDamage');
			expect(result).toEqual(['HAS_MECHANIC_SPELLPOWER']);
		});

		it('hasSpellSchool -> ["HAS_SPELL_SCHOOL"]', () => {
			expect(analyzeSelectorFunction('hasSpellSchool')).toEqual(['HAS_SPELL_SCHOOL']);
		});
	});

	describe('unknown selectors', () => {
		it('nonExistentSelector -> null', () => {
			expect(analyzeSelectorFunction('nonExistentSelector')).toBeNull();
		});
	});
});

// ─── 4. convertToConditionString ─────────────────────────────────────────────

describe('convertToConditionString', () => {
	describe('simple keyword mappings', () => {
		it('minion -> MINION', () => {
			expect(convertToConditionString('minion')).toBe('MINION');
		});
		it('spell -> SPELL', () => {
			expect(convertToConditionString('spell')).toBe('SPELL');
		});
		it('beast -> BEAST', () => {
			expect(convertToConditionString('beast')).toBe('BEAST');
		});
		it('dragon -> DRAGON', () => {
			expect(convertToConditionString('dragon')).toBe('DRAGON');
		});
		it('deathrattle -> HAS_MECHANIC_DEATHRATTLE (resolved via analyzeSelectorFunction)', () => {
			expect(convertToConditionString('deathrattle')).toBe('HAS_MECHANIC_DEATHRATTLE');
		});
		it('legendary -> LEGENDARY', () => {
			expect(convertToConditionString('legendary')).toBe('LEGENDARY');
		});
	});

	describe('cost/attack/health functions', () => {
		it('effectiveCostMore(5) -> COST_MORE_5', () => {
			expect(convertToConditionString('effectiveCostMore(5)')).toBe('COST_MORE_5');
		});
		it('effectiveCostLess(3) -> COST_LESS_3', () => {
			expect(convertToConditionString('effectiveCostLess(3)')).toBe('COST_LESS_3');
		});
		it('effectiveCostEqual(1) -> COST_EQUAL_1', () => {
			expect(convertToConditionString('effectiveCostEqual(1)')).toBe('COST_EQUAL_1');
		});
		it('attackGreaterThan(4) -> ATTACK_MORE_4', () => {
			expect(convertToConditionString('attackGreaterThan(4)')).toBe('ATTACK_MORE_4');
		});
	});

	describe('not() wrapper', () => {
		it('not(minion) -> NOT_MINION', () => {
			expect(convertToConditionString('not(minion)')).toBe('NOT_MINION');
		});
	});

	describe('selectors that fall through to hardcoded mappings', () => {
		it('starshipExtended -> HAS_MECHANIC_STARSHIP_PIECE (now resolved)', () => {
			expect(convertToConditionString('starshipExtended')).toBe('HAS_MECHANIC_STARSHIP_PIECE');
		});
		it('dealsDamage -> DEALS_DAMAGE', () => {
			expect(convertToConditionString('dealsDamage')).toBe('DEALS_DAMAGE');
		});
		it('givesArmor -> HAS_MECHANIC_GIVES_ARMOR (resolved via analyzeSelectorFunction)', () => {
			expect(convertToConditionString('givesArmor')).toBe('HAS_MECHANIC_GIVES_ARMOR');
		});
	});

	describe('selectors resolved via analyzeSelectorFunction', () => {
		it('spellExtended -> null (analyzed as multi-condition, caller handles)', () => {
			expect(convertToConditionString('spellExtended')).toBeNull();
		});
	});
});

// ─── 5. expandSelectorConditions (integration) ──────────────────────────────

describe('expandSelectorConditions', () => {
	it('simple minion selector', () => {
		const result = expandSelectorConditions('and(side(inputSide), or(inDeck, inHand), minion)');
		expect(result).toEqual(['MINION']);
	});

	it('simple spell selector', () => {
		const result = expandSelectorConditions('and(side(inputSide), or(inDeck, inHand), spell)');
		expect(result).toEqual(['SPELL']);
	});

	it('spell school + type combination', () => {
		const result = expandSelectorConditions('and(side(inputSide), or(inDeck, inHand), holy, spell)');
		expect(result).toEqual(['HOLY + SPELL']);
	});

	it('spell school + type with different order', () => {
		const result = expandSelectorConditions('and(side(inputSide), or(inDeck, inHand), spell, nature)');
		expect(result).toEqual(['NATURE + SPELL']);
	});

	it('minion + race combination', () => {
		const result = expandSelectorConditions('and(side(inputSide), or(inDeck, inHand), minion, dragon)');
		expect(result).toEqual(['DRAGON + MINION']);
	});

	it('minion + mechanic combination', () => {
		const result = expandSelectorConditions('and(side(inputSide), or(inDeck, inHand), minion, deathrattle)');
		expect(result).toEqual(['HAS_MECHANIC_DEATHRATTLE + MINION']);
	});

	it('spellExtended expands to two OR branches', () => {
		const result = expandSelectorConditions('and(side(inputSide), or(inDeck, inHand), spellExtended)');
		expect(result).toHaveLength(2);
		expect(result).toContain('SPELL');
		expect(result).toContain('HAS_MECHANIC_GENERATES_SPELL');
	});

	it('spellExtended + spell school produces combined conditions', () => {
		const result = expandSelectorConditions('and(side(inputSide), or(inDeck, inHand), arcane, spellExtended)');
		expect(result.length).toBeGreaterThanOrEqual(2);
		expect(result).toContain('ARCANE + SPELL');
	});

	it('compound with cost filter', () => {
		const result = expandSelectorConditions('and(side(inputSide), inDeck, minion, effectiveCostMore(5))');
		expect(result).toEqual(['COST_MORE_5 + MINION']);
	});

	it('single race selector', () => {
		const result = expandSelectorConditions('and(side(inputSide), or(inDeck, inHand), beast)');
		expect(result).toEqual(['BEAST']);
	});

	it('strips side(inputSide) and zone selectors cleanly', () => {
		const result = expandSelectorConditions('and(side(inputSide), inDeck, minion)');
		expect(result).toEqual(['MINION']);
	});

	it('handles selector with only generic parts -> empty', () => {
		const result = expandSelectorConditions('and(side(inputSide), or(inDeck, inHand))');
		expect(result).toEqual([]);
	});

	it('starshipExtended now resolves to HAS_MECHANIC_STARSHIP_PIECE', () => {
		const result = expandSelectorConditions('and(side(inputSide), or(inDeck, inHand), starshipExtended)');
		expect(result).toEqual(['HAS_MECHANIC_STARSHIP_PIECE']);
	});
});

// ─── 6. extractCardConditions (full pipeline snapshot) ──────────────────────

describe('extractCardConditions (full pipeline)', () => {
	let mappings: ConditionMapping[];

	beforeAll(() => {
		const origLog = console.log;
		console.log = () => {};
		try {
			mappings = extractCardConditions();
		} finally {
			console.log = origLog;
		}
	});

	it('produces a substantial number of mappings', () => {
		expect(mappings.length).toBeGreaterThan(500);
	});

	describe('cards using spellExtended (correctly expanded)', () => {
		it('AncientKrakenbane -> SPELL and HAS_MECHANIC_GENERATES_SPELL', () => {
			const card = mappings.find((m) => m.cardId === 'AncientKrakenbane');
			expect(card).toBeDefined();
			expect(card!.conditions).toContain('SPELL');
			expect(card!.conditions).toContain('HAS_MECHANIC_GENERATES_SPELL');
		});

		it('ArchmageAntonidas_CORE_EX1_559 -> SPELL and HAS_MECHANIC_GENERATES_SPELL', () => {
			const card = mappings.find((m) => m.cardId === 'ArchmageAntonidas_CORE_EX1_559');
			expect(card).toBeDefined();
			expect(card!.conditions).toContain('SPELL');
			expect(card!.conditions).toContain('HAS_MECHANIC_GENERATES_SPELL');
		});
	});

	describe('cards using starshipExtended (now resolved)', () => {
		it('BadOmen_GDB_124 -> HAS_MECHANIC_STARSHIP_PIECE', () => {
			const card = mappings.find((m) => m.cardId === 'BadOmen_GDB_124');
			expect(card).toBeDefined();
			expect(card!.conditions).toContain('HAS_MECHANIC_STARSHIP_PIECE');
		});

		it('LaserBarrage_GDB_845 -> HAS_MECHANIC_STARSHIP_PIECE', () => {
			const card = mappings.find((m) => m.cardId === 'LaserBarrage_GDB_845');
			expect(card).toBeDefined();
			expect(card!.conditions).toContain('HAS_MECHANIC_STARSHIP_PIECE');
		});
	});

	describe('cards with spell school + type combinations', () => {
		it('CarielRoame_BAR_902 -> HOLY + SPELL and HAS_MECHANIC_GENERATES_SPELL + HOLY', () => {
			const card = mappings.find((m) => m.cardId === 'CarielRoame_BAR_902');
			expect(card).toBeDefined();
			expect(card!.conditions).toContain('HOLY + SPELL');
		});

		it('DeviateDreadfang -> NATURE + SPELL and HAS_MECHANIC_GENERATES_SPELL + NATURE', () => {
			const card = mappings.find((m) => m.cardId === 'DeviateDreadfang');
			expect(card).toBeDefined();
			expect(card!.conditions).toContain('NATURE + SPELL');
		});

		it('Felgorger_SW_043 (uses felStrict) -> FEL + SPELL, not bare SPELL', () => {
			const card = mappings.find((m) => m.cardId === 'Felgorger_SW_043');
			expect(card).toBeDefined();
			expect(card!.conditions).toContain('FEL + SPELL');
			expect(card!.conditions).not.toContain('SPELL');
		});
	});

	describe('cards with minion + mechanic combinations', () => {
		it('DivingGryphon -> HAS_MECHANIC_RUSH + MINION', () => {
			const card = mappings.find((m) => m.cardId === 'DivingGryphon');
			expect(card).toBeDefined();
			expect(card!.conditions).toContain('HAS_MECHANIC_RUSH + MINION');
		});

		it('AmuletOfUndying -> HAS_MECHANIC_DEATHRATTLE + MINION', () => {
			const card = mappings.find((m) => m.cardId === 'AmuletOfUndying');
			expect(card).toBeDefined();
			expect(card!.conditions).toContain('HAS_MECHANIC_DEATHRATTLE + MINION');
		});
	});

	describe('cards with race selectors', () => {
		it('HarpoonGun -> BEAST', () => {
			const card = mappings.find((m) => m.cardId === 'HarpoonGun');
			expect(card).toBeDefined();
			expect(card!.conditions).toContain('BEAST');
		});

		it('DragonBreeder -> DRAGON', () => {
			const card = mappings.find((m) => m.cardId === 'DragonBreeder');
			expect(card).toBeDefined();
			expect(card!.conditions).toContain('DRAGON');
		});
	});

	describe('cards with cost conditions', () => {
		it('ScepterOfSummoning -> COST_MORE_5 + MINION', () => {
			const card = mappings.find((m) => m.cardId === 'ScepterOfSummoning');
			expect(card).toBeDefined();
			expect(card!.conditions).toContain('COST_MORE_5 + MINION');
		});
	});

	describe('cards with simple type selectors', () => {
		it('BalindaStonehearth -> SPELL', () => {
			const card = mappings.find((m) => m.cardId === 'BalindaStonehearth');
			expect(card).toBeDefined();
			expect(card!.conditions).toContain('SPELL');
		});
	});

	describe('cards using locationExtended', () => {
		it('BusyPeon_WORK_041 -> LOCATION (locationExtended resolves partially)', () => {
			const card = mappings.find((m) => m.cardId === 'BusyPeon_WORK_041');
			expect(card).toBeDefined();
			expect(card!.conditions).toContain('LOCATION');
		});
	});
});

// ─── 7. extractSelectorCardConditions (SelectorCard implementations) ────────

describe('extractSelectorCardConditions (SelectorCard implementations)', () => {
	let mappings: ConditionMapping[];

	beforeAll(() => {
		const origLog = console.log;
		console.log = () => {};
		try {
			mappings = extractSelectorCardConditions();
		} finally {
			console.log = origLog;
		}
	});

	it('produces a substantial number of mappings', () => {
		expect(mappings.length).toBeGreaterThan(30);
	});

	it('VigilantSentry_JAIL_035 -> NEUTRAL', () => {
		const card = mappings.find((m) => m.cardId === 'VigilantSentry_JAIL_035');
		expect(card).toBeDefined();
		expect(card!.conditions).toContain('NEUTRAL');
	});

	it('SewerSwimmer_JAIL_395 -> HAS_MECHANIC_DEATHRATTLE + MINION', () => {
		const card = mappings.find((m) => m.cardId === 'SewerSwimmer_JAIL_395');
		expect(card).toBeDefined();
		expect(card!.conditions).toContain('HAS_MECHANIC_DEATHRATTLE + MINION');
	});

	it('HeadhuntersHatchet (typed param, multiple cardIds) -> BEAST for both ids', () => {
		const core = mappings.find((m) => m.cardId === 'HeadhuntersHatchet_CORE_TRL_111');
		const classic = mappings.find((m) => m.cardId === 'HeadhuntersHatchet_TRL_111');
		expect(core).toBeDefined();
		expect(classic).toBeDefined();
		expect(core!.conditions).toContain('BEAST');
		expect(classic!.conditions).toContain('BEAST');
	});

	it('SpireSecurity_JAIL_379 (highlightConditions) -> multiple OR branches', () => {
		const card = mappings.find((m) => m.cardId === 'SpireSecurity_JAIL_379');
		expect(card).toBeDefined();
		expect(card!.conditions).toContain('SPELL');
		expect(card!.conditions).toContain('COST_MORE_4 + SPELL');
	});

	it('BloodscalpStrategist (differently named side param) -> WEAPON', () => {
		const card = mappings.find((m) => m.cardId === 'BloodscalpStrategist');
		expect(card).toBeDefined();
		expect(card!.conditions).toContain('WEAPON');
	});

	it('ChronoLordEpoch_TIME_714 (complex block-bodied selector) -> skipped', () => {
		const card = mappings.find((m) => m.cardId === 'ChronoLordEpoch_TIME_714');
		expect(card).toBeUndefined();
	});
});
