// Proves the full UnitySpy chain against Hearthstone running under Wine/Proton:
//
//   find process -> find mono-2.0-bdwgc.dll -> resolve mono_get_root_domain
//   -> decode its RIP-relative operand to locate the mono_root_domain global
//   -> read MonoDomain* -> discover domain_assemblies -> list assembly names
//
// Offsets are DISCOVERED, not hardcoded. Mono struct layouts shift between
// builds, and UnitySpy carries a per-version offset table; scanning instead
// means this probe survives a Hearthstone patch and reports the offsets it
// found, which is what you'd feed back into MonoLibraryOffsets.
const { ProcMemory, findWineProcesses } = require('./proc-memory');

const argPid = process.argv.find((a) => a.startsWith('--pid='));
const argProc = process.argv.find((a) => a.startsWith('--process='));
const PROC_RE = argProc ? new RegExp(argProc.slice(10), 'i') : /^Hearthstone\.exe$/i;

function ok(msg) { console.log('  \x1b[32m✓\x1b[0m ' + msg); }
function bad(msg) { console.log('  \x1b[31m✗\x1b[0m ' + msg); }
function info(msg) { console.log('    ' + msg); }
function hex(n) { return '0x' + n.toString(16); }

// ---------------------------------------------------------------- 1. process
console.log('\n\x1b[1m[1] Locating the game process\x1b[0m');
let pid;
if (argPid) {
	pid = Number(argPid.slice(6));
	ok(`using --pid=${pid}`);
} else {
	const procs = findWineProcesses(PROC_RE);
	if (!procs.length) {
		bad(`no process matching ${PROC_RE} is running`);
		console.log('\n    Start Hearthstone, then re-run. Wine PE processes currently up:');
		for (const p of findWineProcesses(/\.exe$/)) info(`${String(p.pid).padEnd(8)} ${p.comm}`);
		info('\n    Or point the probe somewhere else:  node mono-probe.js --process=SomeGame');
		process.exit(1);
	}
	pid = procs[0].pid;
	ok(`${procs[0].comm}  pid=${pid}`);
}

const mem = new ProcMemory(pid);

// ----------------------------------------------------------------- 2. module
console.log('\n\x1b[1m[2] Locating the Mono runtime module\x1b[0m');
let mono = mem.findModule(/^mono-2\.0-bdwgc\.dll$/i) || mem.findModule(/mono.*\.dll$/i);
if (!mono) {
	bad('no mono module mapped - is this an IL2CPP build rather than Mono?');
	info('PE modules mapped in this process:');
	for (const m of mem.modules().filter((m) => /\.(dll|exe)$/i.test(m.name)).slice(0, 40)) info('  ' + m.name);
	process.exit(1);
}
ok(`${mono.name}`);
info(`base ${hex(mono.base)}  size ${hex(mono.size)}`);
info(mono.path);

// ---------------------------------------------------------------- 3. exports
console.log('\n\x1b[1m[3] Parsing the Mono export table\x1b[0m');
const ex = mem.peExports(mono.base);
if (!ex) { bad('not a readable PE image'); process.exit(1); }
ok(`${ex.dllName} - ${ex.count} exports, PE32+=${ex.plus}`);
const wanted = ['mono_get_root_domain', 'mono_assembly_foreach', 'mono_class_get_fields', 'mono_image_get_name'];
for (const w of wanted) {
	ex.symbols.has(w) ? ok(`${w} @ ${hex(ex.symbols.get(w))}`) : bad(`${w} MISSING`);
}

// ------------------------------------------------------------ 4. root domain
console.log('\n\x1b[1m[4] Resolving mono_root_domain\x1b[0m');
const fn = ex.symbols.get('mono_get_root_domain');
if (!fn) { bad('cannot continue without mono_get_root_domain'); process.exit(1); }

// Typical body:  [endbr64]  48 8B 05 <disp32>   mov rax,[rip+disp32]   C3 ret
const code = mem.read(fn, 32);
info('code: ' + [...code.slice(0, 16)].map((b) => b.toString(16).padStart(2, '0')).join(' '));

let domainPtrAddr = null;
for (let i = 0; i < 24; i++) {
	if (code[i] === 0x48 && code[i + 1] === 0x8b && code[i + 2] === 0x05) {
		const disp = code.readInt32LE(i + 3);
		domainPtrAddr = fn + i + 7 + disp; // RIP = address of next instruction
		info(`mov rax,[rip+${hex(disp)}] at +${i} -> global @ ${hex(domainPtrAddr)}`);
		break;
	}
}
if (domainPtrAddr === null) { bad('could not decode the RIP-relative load'); process.exit(1); }
ok(`mono_root_domain global @ ${hex(domainPtrAddr)}`);

const domain = mem.readU64(domainPtrAddr);
if (!mem.isMapped(domain)) { bad(`MonoDomain* ${hex(domain)} is not mapped - runtime may still be starting`); process.exit(1); }
ok(`MonoDomain* = ${hex(domain)} (mapped)`);

// -------------------------------------------------- 5. discover assembly list
// MonoDomain holds `GSList *domain_assemblies`. GSList = { data; next }.
// MonoAssembly = { int ref_count; char *basedir; MonoAssemblyName aname; ... }
// and MonoAssemblyName starts with `const char *name`, so name lives at +16.
console.log('\n\x1b[1m[5] Discovering domain_assemblies (scanning MonoDomain)\x1b[0m');

function readAssemblyName(assemblyPtr) {
	if (!mem.isMapped(assemblyPtr)) return null;
	try {
		const namePtr = mem.readU64(assemblyPtr + 16);
		if (!mem.isMapped(namePtr)) return null;
		const s = mem.readCString(namePtr, 96);
		return /^[\w.\-+ ]{2,64}$/.test(s) ? s : null;
	} catch { return null; }
}

function tryWalkGSList(head, limit = 400) {
	const names = [];
	let node = head;
	const seen = new Set();
	while (node && mem.isMapped(node) && names.length < limit && !seen.has(node)) {
		seen.add(node);
		let data, next;
		try {
			data = mem.readU64(node);
			next = mem.readU64(node + 8);
		} catch { break; }
		const name = readAssemblyName(data);
		if (!name) return null; // not an assembly list
		names.push(name);
		node = next;
	}
	return names.length ? names : null;
}

let found = null;
for (let off = 0; off <= 0x400 && !found; off += 8) {
	let candidate;
	try { candidate = mem.readU64(domain + off); } catch { continue; }
	if (!mem.isMapped(candidate)) continue;
	const names = tryWalkGSList(candidate);
	// mscorlib is always loaded; it's the giveaway that we found the real list.
	if (names && names.length >= 2 && names.some((n) => /^mscorlib$/i.test(n))) {
		found = { off, names };
	}
}

if (!found) {
	bad('could not locate domain_assemblies by scanning');
	info('The read chain works (we have a live MonoDomain); only the struct');
	info('layout guess failed. Widen the scan or compare against UnitySpy\'s');
	info('MonoLibraryOffsets for this Mono build.');
	mem.close();
	process.exit(1);
}

ok(`domain_assemblies at MonoDomain+${hex(found.off)}  (${found.names.length} assemblies)`);
console.log('');
for (const n of found.names) info('• ' + n);

const interesting = found.names.filter((n) => /Assembly-CSharp|Hearthstone|SimpleJSON|UnityEngine$/i.test(n));
console.log('');
if (interesting.length) {
	ok('game assemblies visible: ' + interesting.join(', '));
	console.log('\n\x1b[1;32mEnd-to-end chain proven. UnitySpy\'s approach ports to Linux.\x1b[0m');
	console.log(`\x1b[2mFeed back into MonoLibraryOffsets: domain_assemblies = +${hex(found.off)}\x1b[0m\n`);
} else {
	info('Runtime assemblies found, but no game assemblies yet - the game may still be loading.');
}

mem.close();
