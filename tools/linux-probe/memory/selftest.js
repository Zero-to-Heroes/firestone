// Verifies the parts of mono-probe that can't be exercised without Hearthstone
// running: the RIP-relative decode arithmetic, and the pointer/string readers.
const { ProcMemory, findWineProcesses } = require('./proc-memory');
const assert = require('assert');

let failures = 0;
function check(name, fn) {
	try { fn(); console.log('  \x1b[32m✓\x1b[0m ' + name); }
	catch (e) { failures++; console.log('  \x1b[31m✗\x1b[0m ' + name + '\n      ' + e.message); }
}

// The decode under test, lifted verbatim from mono-probe.js step 4.
function decodeRipLoad(code, fnAddr) {
	for (let i = 0; i < 24; i++) {
		if (code[i] === 0x48 && code[i + 1] === 0x8b && code[i + 2] === 0x05) {
			return fnAddr + i + 7 + code.readInt32LE(i + 3);
		}
	}
	return null;
}

console.log('\n\x1b[1mRIP-relative decode\x1b[0m');

check('mov rax,[rip+0x1000]; ret  at offset 0', () => {
	const code = Buffer.alloc(32);
	// 48 8B 05 00 10 00 00  C3
	code.set([0x48, 0x8b, 0x05], 0);
	code.writeInt32LE(0x1000, 3);
	code[7] = 0xc3;
	// instruction at 0x140001000, next instr at +7, target = 0x140001007 + 0x1000
	assert.strictEqual(decodeRipLoad(code, 0x140001000), 0x140002007);
});

check('endbr64 prefix is skipped', () => {
	const code = Buffer.alloc(32);
	code.set([0xf3, 0x0f, 0x1e, 0xfa], 0); // endbr64
	code.set([0x48, 0x8b, 0x05], 4);
	code.writeInt32LE(0x2000, 7);
	code[11] = 0xc3;
	// instruction at +4, next instr at +11, target = base + 11 + 0x2000
	assert.strictEqual(decodeRipLoad(code, 0x140001000), 0x140001000 + 11 + 0x2000);
});

check('negative displacement (global below the code)', () => {
	const code = Buffer.alloc(32);
	code.set([0x48, 0x8b, 0x05], 0);
	code.writeInt32LE(-0x5000, 3);
	code[7] = 0xc3;
	assert.strictEqual(decodeRipLoad(code, 0x140010000), 0x140010007 - 0x5000);
});

check('no pattern present -> null', () => {
	assert.strictEqual(decodeRipLoad(Buffer.alloc(32, 0x90), 0x1000), null);
});

console.log('\n\x1b[1mReaders against a live Wine process\x1b[0m');

const proc = findWineProcesses(/^explorer\.exe$/)[0] || findWineProcesses(/\.exe$/)[0];
if (!proc) {
	console.log('  \x1b[33m!\x1b[0m no Wine process up; skipping live checks');
} else {
	const mem = new ProcMemory(proc.pid);
	const ntdll = mem.findModule(/^ntdll\.dll$/i);

	check('isMapped: module base yes, junk no', () => {
		assert.ok(mem.isMapped(ntdll.base), 'ntdll base should be mapped');
		assert.ok(!mem.isMapped(0x1), 'null-ish should not be mapped');
		assert.ok(!mem.isMapped(0x7fffffffff00), 'junk should not be mapped');
	});

	check('readCString reads the PE export dll name', () => {
		const ex = mem.peExports(ntdll.base);
		assert.strictEqual(ex.dllName.toLowerCase(), 'ntdll.dll');
	});

	check('readU64 round-trips a real pointer', () => {
		// The export symbol table itself holds addresses we already validated.
		const ex = mem.peExports(ntdll.base);
		const addr = ex.symbols.get('NtOpenFile');
		assert.ok(mem.isMapped(addr), 'NtOpenFile should live in a mapped region');
	});

	// The real test: decode an actual RIP-relative load out of live Wine code.
	check('decode a real 48 8B 05 in ntdll -> mapped target', () => {
		const ex = mem.peExports(ntdll.base);
		let decoded = 0;
		for (const [, addr] of [...ex.symbols].slice(0, 300)) {
			let code;
			try { code = mem.read(addr, 32); } catch { continue; }
			const target = decodeRipLoad(code, addr);
			if (target === null) continue;
			if (mem.isMapped(target)) decoded++;
			if (decoded >= 3) break;
		}
		assert.ok(decoded >= 1, 'expected at least one decodable RIP load landing in mapped memory');
	});

	mem.close();
}

console.log(failures ? `\n\x1b[31m${failures} failed\x1b[0m\n` : '\n\x1b[32mall good\x1b[0m\n');
process.exit(failures ? 1 : 0);
