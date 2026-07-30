# Building Mono offsets for a new Unity version

This document is the step-by-step playbook for adding support for a new Unity/Mono version (or a new
architecture, e.g. x86 -> x64) to UnitySpy. It exists so that the next time Hearthstone bumps Unity
and you get:

```
The unity version the process is running (2022.3.62.7762112 in 64 bits mode) is not supported
```

you can produce a validated offset set in well under an hour instead of re-deriving everything by
hand.

It was written after adding `Unity2022_3_62_x64_PE_Offsets`, and the concrete numbers used as
examples below come from that work.

---

## 1. Background: what the offsets are and why they change

UnitySpy reads a Unity game's **managed (C#) memory** directly out of the live process with
`ReadProcessMemory`. To walk from "the process" to "the value of field X on object Y" it has to
traverse Mono's internal C structs:

```
mono_get_root_domain()  ->  MonoDomain
MonoDomain              ->  list of MonoAssembly
MonoAssembly            ->  MonoImage
MonoImage              ->  class cache (MonoInternalHashTable of MonoClass*)
MonoClass / MonoClassDef / MonoClassGtd  ->  fields, parent, vtable, name, size, ...
MonoVTable             ->  static field storage
MonoString             ->  UTF-16 chars
```

Every arrow is "read the pointer/value at `base + offset`". Those `offset` numbers are what live in
[`MonoLibraryOffsets.cs`](../UnitySpy/Offsets/MonoLibraryOffsets.cs). They change because:

- **Architecture (x86 vs x64).** Pointers grow from 4 to 8 bytes and structs re-align. This is the
  big one and is mostly *mechanical* (see §4).
- **Unity / Mono version.** Unity ships a custom Mono fork
  ([Unity-Technologies/mono](https://github.com/Unity-Technologies/mono)). When they add/remove/reorder
  fields in the internal structs, offsets shift. These are *not* mechanical and must be discovered.

### Offset tiers

When porting, classify each offset:

- **Tier A — mechanical layout offsets.** Things inside `MonoClass`/`MonoClassDef`/`MonoVTable` etc.
  whose layout follows from C struct rules. For an x86 -> x64 port you can usually *derive* these by
  applying the per-field pointer-size deltas (see the existing `Unity2019_4_2020_3_x64_PE_Offsets`
  set, which is written as `x86value + delta` precisely to document the derivation).
- **Tier B — container-relative offsets.** Offsets into the bigger runtime containers
  (`MonoDomain.domain_assemblies`, `MonoImage.class_cache`, the hashtable size/table fields). These
  move around the most between versions and are the ones you almost always have to *scan for* against
  a live process.

The fields on `MonoLibraryOffsets` and which tier/struct they belong to are commented in
[`MonoLibraryOffsets.cs`](../UnitySpy/Offsets/MonoLibraryOffsets.cs) (search for `// MonoClass Offsets`,
`// MonoClassDef Offsets`, etc.).

---

## 2. How version selection works

`MonoLibraryOffsets.GetOffsets(gameExecutableFilePath, force)`:

1. Reads the EXE's `FileVersion` (e.g. `2022.3.62.7762112`) via `FileVersionInfo`.
2. Reads the PE header machine type (`0x3C` -> PE offset -> `+4` machine word) to decide x86
   (`0x14c`) vs x64 (`0x8664`).
3. Calls `GetOffsets(unityVersion, is64Bits, format, force)` which scans `SupportedVersions` for an
   entry where `Is64Bits`/`Format` match and `unityVersion.StartsWith(offsets.UnityVersion)`.

So `UnityVersion = "2022.3.62"` matches any `2022.3.62.*` build. If nothing matches and `force` is
true *and there is exactly one* offset set for that architecture, it falls back to that one (this is
why a clean single-entry x86 baseline is useful — see §3, step 1).

---

## 3. The workflow

### Step 0 — Confirm the symptom and gather the binaries

- Note the failing version string and bitness from the exception.
- Get the path to **both** a known-good build and the new build if possible. Diffing the two is the
  fastest sanity check on whether anything actually changed.
- Confirm bitness with the PE machine word (the library already does this; you can also just check in
  any PE viewer).

### Step 1 — Add a clean x86 baseline (optional but recommended)

If only the *version string* changed but the layout didn't, copy the closest existing x86 set and
just relabel its `UnityVersion`. Having a single clean baseline per architecture also lets the
`force` fallback work. (For 2022.3.62 the user pre-seeded `Unity2022_3_62_x86_PE_Offsets` as a copy
of the 2021.3.19 set.)

### Step 2 — Create the new offset set, derived from the matching x86 set

Add a new `public static readonly MonoLibraryOffsets Unity<ver>_<arch>_PE_Offsets` and register it in
`SupportedVersions`. Start the Tier A offsets from a mechanical x86 -> x64 derivation (§4) and the
Tier B offsets from the closest known x64 set (e.g. `Unity2019_4_2020_3_x64_PE_Offsets`). **Write the
x86 base and the delta in a comment for every field** — this is what makes the *next* port fast.

> The derived values are a *starting point*. Expect Tier B (and a few Tier A) to be wrong. Step 3
> finds the real values.

### Step 3 — Discover the real offsets against the live process

This is the core of the work. Use the diagnostic tooling (kept on purpose, see §6):

- [`AssemblyImageFactory.DebugScan(processId, log)`](../UnitySpy/AssemblyImageFactory.cs) — does **not**
  trust the container offsets. It:
  1. Finds the mono module + `mono_get_root_domain` and reads the root `MonoDomain` (this part is
     architecture-aware and already correct — see §5).
  2. **Scans** `MonoDomain` for the `domain_assemblies` list by trying every pointer-aligned offset
     and checking whether it yields a GSList whose assembly names include `Assembly-CSharp` and
     `mscorlib`. The winning offset is your `ReferencedAssemblies`.
  3. **Scans** `MonoImage` for the class cache by looking for a `MonoInternalHashTable` whose
     `size`/`table` produce a bucket array of readable, printable class names. The winning offset is
     your `ImageClassCache`.
  4. Dumps the first ~36 qwords of a few named classes so you can pin the trailing
     `MonoClass`/`MonoClassDef` offsets by eye.
- The diagnostic tests in
  [`DebugScanTests.cs`](../UnitySpy.HearthstoneLibTests/DebugScanTests.cs) drive this against a live
  Hearthstone process and write the output to text files (`scan-output.txt`, `netcache-output.txt`,
  `cardbacks-output.txt`, `services-output.txt`). `FindHearthstoneX64()` auto-locates the running
  game (preferring a `Hearthstone_Event_1` build if present).

Run a single diagnostic test (see §7 for the exact command), read its output file, update the offset,
rebuild, repeat.

### Step 4 — Validate with the real test suite

Run the offset-independent-of-game-state subset of `MindVisionTests` (see §7). They exercise NetCache
services, HashSet/Map structures, arrays, strings and nested objects, which collectively touch nearly
every offset. State-dependent tests (arena draft, in-game board, pack opening, selected deck,
mercenaries visitors, etc.) will `Assert.IsNotNull`-fail when the game is idle at the menu — that is
**not** an offset problem, so don't chase it.

---

## 4. x86 -> x64 mechanical derivation rules

For a struct laid out as a sequence of fields, the x64 offset of a field is the x86 offset plus the
accumulated growth of every pointer-sized field before it:

- Each `void*` / managed-ref field: **+4 bytes** of growth (4 -> 8).
- `intptr`/`size_t` fields: also **+4**.
- Plain `int`/`uint`/`short`/`byte` fields: **no growth**, but watch **alignment**: an 8-byte field
  forces the struct to re-pad to an 8-byte boundary, which can introduce padding that didn't exist in
  x86.
- A union of differently-sized members (e.g. Mono's `MonoClass.sizes` union of `class_size` /
  `element_size` / `generic_param_token`) is sized by its largest member; the *meaning* of the offset
  can shift even when the number looks "off by 4".

The cleanest reference for this is the existing `Unity2019_4_2020_3_x64_PE_Offsets` set, where every
field is literally written as `0x… /* x86 */ + 0x… /* delta */`. Copy that style.

### Gotcha that bit us: generic value-type fields and 64-bit alignment

This one is **not** an offset value — it's in the read path
([`ProcessFacade.ReadManagedVar`](../UnitySpy/Detail/ProcessFacade.cs)) — but it only manifests on
64-bit, so it belongs here.

Symptom: reading a generic-parameter field (e.g. `dictionary["_entries"][i]["value"]`, where `value`
is `TValue`) returned a garbage pointer of the very recognizable form `0x<low32>00000000` — high
dword looks like a real pointer, low dword is all zeros. e.g. `getActiveQuests` blew up with
`address=1492393108342571008` = `0x14B60BA000000000`.

Cause: `ReadManagedVar` used to "correct" the field address by subtracting
`(SizeOfPtr - sizeof(precedingValueTypeArg))` for each generic argument before the field, assuming a
*packed* struct layout. But Mono's stored field offset already comes from the fully-inflated generic
`MonoClass` (e.g. `Dictionary<int, QuestModel>+Entry`) and is the **real, alignment-correct** offset.
For `Dictionary<int, TRef>.Entry` on x64 the layout is `hashCode@0, next@4, key(int)@8, pad@12,
value@16`; the bogus correction dragged the `value` read from `+16` to `+12`, straight into the
4 bytes of alignment padding. The read then combined `pad(0)` (low dword) with the pointer's low
4 bytes (high dword) → `0x<ptrlow>00000000`.

Why it hid for so long: the correction is a **no-op** for reference-typed generic args (their size ==
pointer size) and for *all* args on 32-bit when the arg is pointer-sized (e.g. `int` == 4 == x86
pointer). It only does damage for sub-pointer value-type args (`int`/`short`/`byte`/...) on 64-bit —
i.e. exactly the common `Dictionary<int, SomethingRef>` shape, which is everywhere in Hearthstone.

Fix: trust Mono's field offset and **do not** apply the size-delta correction. If you ever see a
`0x<something>00000000`-shaped pointer on 64-bit, suspect this class of off-by-pointer-alignment bug,
not the version offsets. `DebugScanTests.DebugQuests` dumps a dictionary `Entry`'s field offsets and
raw bytes and is the quickest way to confirm where a value-type-keyed entry actually stores its
value.

### Gotcha that bit us: `TypeDefinitionSize`

`TypeDefinitionSize` points into the `sizes` union and is used as the **array element stride**. The
purely-mechanical guess (148) pointed one slot too far and read `element_size = 0`. With a zero
stride, *every* element of a struct array (`Entry[]`, `valueSlots`, etc.) resolved to element 0. The
visible symptom was: all ~197 services reported as `IErrorService` and `NetCache` came back empty. The
real value was **144** (the `element_size`, 24 bytes for the service `Entry` struct, read correctly
once fixed). **If arrays of structs misbehave, suspect `TypeDefinitionSize` first.**

---

## 5. The `mono_get_root_domain` / root-domain read (already architecture-correct)

You usually don't need to touch this, but verify it if the very first read fails. After locating the
exported `mono_get_root_domain` function:

- **x64:** the function body is `48 8B 05 <rel32> C3` (`mov rax, [rip + rel32]; ret`). Read the
  `rel32` at `funcAddr + 3`, then `domain = ReadPtr(funcAddr + (rel32 + 7))` (7 = length of the `mov`
  instruction; rip points at the next instruction).
- **x86:** `domainAddress = ReadPtr(funcAddr + 1)`, then `domain = ReadPtr(domainAddress)`.

Both branches live in `AssemblyImageFactory.GetAssemblyImage` (and are mirrored in `DebugScan`). If a
future Mono build changes this prologue (e.g. an endbr64 / different addressing), this is where you'd
adjust the rip-relative parsing.

---

## 6. The diagnostic tooling (kept for next time)

These are intentionally retained so the next port is cheap:

- [`AssemblyImageFactory.DebugScan`](../UnitySpy/AssemblyImageFactory.cs) — the scanner described in
  §3. It is a self-contained public method that is never called by the normal `Create` path, so it
  has no runtime impact.
- [`UnitySpy.HearthstoneLibTests/DebugScanTests.cs`](../UnitySpy.HearthstoneLibTests/DebugScanTests.cs)
  — `[TestMethod]`s that run the scan and assorted targeted dumps against the live game:
  - `DebugScan` — runs `AssemblyImageFactory.DebugScan`, finds `ReferencedAssemblies` /
    `ImageClassCache` and dumps sample classes.
  - `DebugNetCache` — lists services + NetCache services and tries a couple of reads end-to-end.
  - `DebugServices` — walks to the service-locator `_entries` array and dumps the `Entry[]` array
    class and `Entry` element class so you can pin `element_size` (this is how 144 was found).
  - `DebugCardBacks` — dumps a `HashSet<int>` backing store (`_count`, `_lastIndex`, `_slots`, the
    `Slot` field layout, and raw slot bytes) — useful for understanding any hashed collection.

  These tests require a live game and hard-code an output path / the `Hearthstone_Event_1` preference.
  They are throwaway-by-design; tweak them freely for whatever struct you're chasing.

> Note: `DebugScanTests.cs` uses `dynamic`, which is why the test project references `Microsoft.CSharp`
> and `System.Core`. Keep those references if you keep the file.

---

## 7. Running tests against the live game (Windows / Git Bash)

The game must be running. Build the test project, then run specific tests with
`vstest.console.exe`. **In Git Bash you must disable MSYS argument conversion**, otherwise `/Platform`,
`/Tests`, `/Framework` get mangled into Windows paths:

```bash
export MSYS2_ARG_CONV_EXCL="*"

MSBUILD="/c/Program Files/Microsoft Visual Studio/2022/Community/MSBuild/Current/Bin/amd64/MSBuild.exe"
VSTEST="/c/Program Files/Microsoft Visual Studio/2022/Community/Common7/IDE/CommonExtensions/Microsoft/TestWindow/vstest.console.exe"

# Build (x64 to match a 64-bit game)
"$MSBUILD" UnitySpy.HearthstoneLibTests/UnitySpy.HearthstoneLibTests.csproj \
  -t:Build -p:Configuration=Debug -p:Platform=x64 -v:m -nologo

# Run a single diagnostic test
"$VSTEST" "UnitySpy.HearthstoneLibTests/bin/x64/Debug/UnitySpy.HearthstoneLibTests.dll" \
  /Platform:x64 /Tests:DebugScan

# Run the full non-regression suite (see below)
"$VSTEST" "UnitySpy.HearthstoneLibTests/bin/x64/Debug/UnitySpy.HearthstoneLibTests.dll" \
  /Platform:x64 /TestCaseFilter:"TestCategory=Regression"
```

> Do **not** run the whole `MindVisionTests` class blindly: the change-listener tests
> (`TestListenForChanges`, `TestGetMemoryChanges`, `TestMemoryResetIssues`) poll and effectively hang
> a headless run.

### The `Regression` test category (use this after any memory-reader change)

The `MindVisionTests` whose result does **not** depend on the current game scene are tagged with
`[TestCategory("Regression")]`. Run them with the `/TestCaseFilter:"TestCategory=Regression"` filter
above. This is the suite to run after touching anything in the memory-reading stack
(`ProcessFacade`, `ManagedClassInstance`, `MonoLibraryOffsets`, the readers, etc.).

- ~35 tests, finishes in well under a minute, and exercises the breadth of the reader: the collection,
  `HashSet<int>` card backs, NetCache services, `Dictionary<int, …>`-backed readers (reward track,
  achievements, quests), arrays, strings, enums, generic `VAR` fields, and deeply nested objects.
- Requirements/assumptions: a supported Hearthstone build must be **running and logged in, sitting at
  a normal out-of-game screen** (menu/collection). Because these reads target persistent
  account/global state, a failure is a real regression signal — not scene noise.
- Explicitly **excluded** from the category (and why):
  - Scene-specific reads that legitimately return `null` at the menu — in-match (`TestRetrieveMatchInfo`,
    `TestRetrieveBoardInfo`), arena draft options/picks, BG player/teammate board, pack opening,
    mercenaries visitors/treasure, `TestGetSelectedDeckId`, `TestGetGameUniqueId`, etc.
  - The hanging `while(true)` tests (`TestListenForChanges`, `TestMemoryResetIssues`) and the
    state-dependent `TestGetMemoryChanges`.
  - `DebugScanTests.*` (live diagnostics that write files), `Generate*` data-dumpers, and the `List*`
    helpers.

If you add a new reader, tag its test `[TestCategory("Regression")]` **only if** it returns non-null
from a normal menu state; otherwise it will produce false failures and erode the suite's value.

---

## 8. Reader bugs vs offset bugs (a cautionary tale)

Not every failing test is an offset problem. While porting 2022.3.62, `TestRetrieveCardBacks` returned
55 card backs with `id == 0` instead of 1. The offsets were **correct** — the card-back collection is
a `HashSet<int>` whose `_slots` array (length 431) is larger than the live count (`_count` /
`_lastIndex` = 377), and the trailing unused slots are zero-initialized (`value == 0`). The reader was
iterating the whole `_slots.Length` and counting the empties.

The `Slot` struct layout (x64) is `{ int hashCode @0; int next @4; T value @8 }`. Occupied slots have
`next = -1`; truly-empty trailing slots are all-zero; removed slots have `hashCode < 0`. The correct
enumeration (now in
[`CollectionCardBackReader.cs`](../UnitySpy.HearthstoneLib/Detail/Collection/CollectionCardBackReader.cs))
is: iterate `0 .. _lastIndex-1` and skip slots with `hashCode < 0`, matching `HashSet<T>`'s own
enumerator. This was a latent, architecture-independent bug that the new build's data happened to
expose.

**Lesson:** before changing an offset, confirm the raw values being read are actually wrong. If the
data reads back sensibly but a *count/assertion* is off, the bug is probably in the reader, not the
offsets.

---

## 9. Checklist

- [ ] Confirm version string + bitness from the exception / PE header.
- [ ] Add (or relabel) a clean x86 baseline set; relabel `UnityVersion`.
- [ ] Add the new offset set, Tier A derived mechanically (with `x86 + delta` comments), Tier B seeded
      from the nearest known set of the same architecture.
- [ ] Register it in `SupportedVersions`.
- [ ] `DebugScan` against the live game; fix `ReferencedAssemblies`, `AssemblyImage`, `ImageClassCache`
      and the hashtable size/table offsets.
- [ ] Dump sample classes to pin trailing `MonoClass`/`MonoClassDef`/`MonoClassGtd` offsets.
- [ ] If struct arrays misread, fix `TypeDefinitionSize` (element stride).
- [ ] Run the core validation tests; confirm only state-dependent tests fail.
- [ ] Leave the `x86 + delta` comments in place for the next person.
