# UnitySpy performance analysis

This document captures the performance characteristics of the memory-reading stack so they don't
have to be re-discovered. If you are asked to "improve performance", start here.

## What the tool does

UnitySpy reads the live Hearthstone (Unity/Mono) process memory via the Win32 `ReadProcessMemory`
syscall. There is **no offline/recorded dump** to replay: every read requires the game to be running
and is satisfied by reading bytes at an address in the target process.

## The read path

A single field access such as `image["CollectionManager"]["s_instance"]["m_collectibleCards"]` flows
through:

```
reader (dynamic indexer)
  -> ManagedObjectInstance.GetValue            (UnitySpy/Detail/ManagedObjectInstance.cs)
  -> FieldDefinition.GetValue                  (UnitySpy/Detail/FieldDefinition.cs)
  -> TypeInfo.GetValue                         (UnitySpy/Detail/TypeInfo.cs)
  -> ProcessFacade.ReadManaged                 (UnitySpy/Detail/ProcessFacade.cs)
  -> ReadBufferValue
  -> ReadProcessMemory                         (Win32 syscall)
```

### The dominant cost: one syscall per primitive value

`ReadBufferValue` in [`ProcessFacade.cs`](../UnitySpy/Detail/ProcessFacade.cs) issues a **separate
kernel call for every primitive** (int/ptr/byte/etc.), typically reading only 4-8 bytes, and each
call wraps the buffer in a `GCHandle.Alloc(Pinned)` / `Free`.

Readers walk large object graphs, so the syscall count dominates wall-clock time and CPU:

- Reading one card in
  [`CollectionCardReader.cs`](../UnitySpy.HearthstoneLib/Detail/Collection/CollectionCardReader.cs)
  costs ~10+ syscalls (class pointer for `m_EntityDef`, string pointer + length + buffer for the
  card id, several int fields, plus vtable + definition pointer for each `ManagedClassInstance`).
- A collection of several thousand cards therefore costs tens of thousands of syscalls per read.
- In production the library is polled continuously (a ~200ms timer running ~30 notifiers per tick),
  so this cost is paid over and over.

## Constraint: do NOT cache live instance data

A previous attempt to cache the resolved service-locator snapshot (`services["_entries"]` in
[`HearthstoneImage.cs`](../UnitySpy.HearthstoneLib/Detail/HearthstoneImage.cs)) produced
**stale / out-of-date reads** and was deliberately removed.

This is a fundamental constraint, not a bug to be fixed:

- A cached snapshot holds **target-process addresses** captured at one instant.
- Hearthstone's Mono runtime (`mono-2.0-bdwgc.dll`, Boehm GC) can free/reuse those objects, and when
  the service dictionary rehashes or resizes, the `_entries` array is reallocated. The cached
  snapshot then points at old or reclaimed memory.

Therefore:

- **Only structural data may be cached** (type definitions, field offsets) - the library already
  does this safely via `AssemblyImage.typeDefinitionsByAddress` and `TypeDefinition.fieldCache`.
- Anything that resolves to a **live object address must be re-read every call.** Performance work
  must make the live reads cheaper, not skip them.

## Bottlenecks (and the implemented improvements)

Ordered by impact-to-risk.

### Tier 1 - reduce the number of syscalls (biggest win)

- **1a. Block-read whole class/struct instances.** A `TypeDefinition` already knows its `Size`. When
  a `ManagedClassInstance` / `ManagedStructInstance` is created we can read the full object once into
  a buffer and serve primitive field reads from that buffer instead of one syscall per field.
  Pointers that escape the window (strings, nested classes, arrays) still fall back to a live read.
  Implemented behind an opt-in flag (`ProcessFacade.UseBlockReads`), **defaulted OFF**: when measured
  against a live client it was net-negative on the dominant `GetCollectionCards` path (~+8% latency
  and *more* syscalls), because card objects are dominated by string/reference fields that escape the
  window, so the extra whole-object read is pure overhead. Kept in place (flag-gated) for object
  shapes that are primitive-dense, but it is not enabled by default. See measured results below.
- **1b. Block-read arrays.** `ProcessFacade.ReadManagedArray` previously read each element with its
  own syscall and boxed it into `object[]`. The array body is now read in a single syscall and
  parsed locally; primitive element arrays avoid per-element boxing.
- **1c. Speed up the live service-locator walk** without caching instances - the entries scan reads
  fewer times by reusing the block reads above. The `<Service>` backing field and everything
  downstream is still read live, so results never go stale.

### Tier 2 - cut per-read overhead

- **2a. Avoid pinning on small reads.** Small reads (<= 8 bytes) use an `unsafe` `fixed` pointer
  instead of `GCHandle.Alloc(Pinned)` + the pool.
- **2b. Larger transient buffers.** Buffers above the small-read threshold are pooled/sized to avoid
  re-allocating a `byte[]` per string/array read (the old `ByteArrayPool` capped at 16 bytes).
- **2c. Trim `ManagedClassInstance.Init`.** It used to force `TypeDefinition?.Fields` twice per
  instance and ran a `Thread.Sleep(2)` retry loop on the hot path; the success path now does a single
  fields touch with no sleeps and only retries when a read actually throws.

### Tier 3 - lower-level / optional

- **3a. Reduce `dynamic` on hot paths.** The `dynamic this[string]` indexers route every navigation
  through the DLR; hot readers can use typed `GetValue<T>` instead.
- **3b. Micro-opts.** Cache conversion delegates; reuse `FieldDefinition` instances instead of
  re-indexing by string in tight loops.

## How to measure (what matters to the end user)

See [`UnitySpy.HearthstoneLibTests/PerformanceBenchmark.cs`](../UnitySpy.HearthstoneLibTests/PerformanceBenchmark.cs).
It requires a running Hearthstone client.

The metrics that matter are the ones the companion app and the user actually pay for:

- **Latency (wall-clock ms per operation)** - avg + p95 over many iterations; this is responsiveness.
- **CPU time consumed** - measured via the Win32 `GetThreadTimes` (kernel + user time) on the
  benchmark thread. This is the truer "resource used" number because `ReadProcessMemory` is largely a
  kernel-side memcpy, and it reflects the background CPU/battery load from continuous polling.

Syscall count is **not** a headline metric (it is an implementation detail). The benchmark can
optionally print `ProcessFacade.ReadProcessMemoryCallCount` purely as a sanity check that a change
had the intended structural effect.

> BenchmarkDotNet is intentionally not used: it assumes pure, repeatable microbenchmarks, but these
> reads depend on live external game state. A simple `Stopwatch` + CPU-time harness is used instead.

## Measured results (live client, A/B)

Measured against a live Hearthstone client (collection of 7,948 cards) using the public `MindVision`
API. "Before" is the original tree; "after" is this branch with all always-on tiers enabled
(2a/2b/2c, 1b, 1c, 3a/3b) and block reads (1a) OFF. Identical result sizes confirm correctness was
preserved. The A/B harness is
[`UnitySpy.HearthstoneLibTests/BaselineTiming.cs`](../UnitySpy.HearthstoneLibTests/BaselineTiming.cs)
(30 iterations, warmed up).

| Scenario | Before avg ms | After avg ms | Latency | Before CPU ms/it | After CPU ms/it |
| --- | ---: | ---: | ---: | ---: | ---: |
| GetCollectionCards | 518.6 | 374.9 | **-28%** | 509.4 | 366.1 (-28%) |
| GetCollectionCoins | 2.33 | 1.43 | **-39%** | 2.60 | 1.56 |
| GetCollectionCardBacks | 3.18 | 2.05 | **-36%** | 3.13 | 2.08 |
| GetCollectionSize | 1.34 | 0.64 | **-52%** | 1.04 | 0.52 |
| PollingTick (aggregate) | 2.81 | 1.39 | **-50%** | 3.13 | 1.04 (-67%) |

Takeaways:

- The continuous-polling cost (`PollingTick`, paid every ~200ms) roughly **halved** in latency and
  dropped ~2/3 in CPU - this is the number that matters most for background load/battery.
- The heaviest one-shot read (`GetCollectionCards`) is **~28% faster** in both latency and CPU.
- Block reads (Tier 1a) were measured separately via `PerformanceBenchmark.cs` and **regressed** the
  card path, which is why they ship disabled (see Tier 1a above).

## Round 2 optimizations (July 2026)

A second pass, measured step by step against a live client (each step committed separately with its
own numbers). All of these respect the no-live-data-caching constraint.

1. **Hoist array reads out of reader loops.** A dynamic indexer access on `_items` / `_entries` /
   `keySlots` / `valueSlots` re-reads (and re-materializes) the entire backing array from process
   memory, so indexing it inside a loop was O(N²) reads. ~15 reader files now resolve the array (and
   repeated field chains like `playerTile["m_entity"]`) once before the loop.
2. **Bulk-read array bodies for non-primitive arrays.** `ProcessFacade.ReadManagedArray` now reads
   the whole array body in one syscall for reference/string element arrays (null slots are skipped
   with no read at all) and for inline value-type element arrays (e.g. `Dictionary` entry structs).
   Struct elements share the body buffer as a snapshot, so their subsequent `key`/`value` field
   reads are served locally. This has the same freshness contract as the existing primitive-array
   fast path: values are captured when the array is materialized; pointers still resolve live.
3. **O(1) service lookups.** A new engine primitive
   (`ProcessFacade.ReadManagedArrayElement` / `IManagedObjectInstance.GetArrayValue`) reads a single
   array element, bounds-checked against the live length, without materializing the rest.
   `GetService` and `GetNetCacheService` slot hints use it: a hint hit re-validates the slot and
   returns the service with a handful of reads instead of materializing the whole entries array.
   Hints stay structural-only (names re-checked against live memory each call).
4. **BgsEntity tag index + pre-grouped enchantments.** Every tag query was a linear `Tags.Find`;
   `AddEnchantments` rescanned all entities per board minion. Tags are now indexed in a lazy
   per-entity dictionary, the player-board reader partitions entities by zone in one pass, and
   enchantments are grouped once into a (zone, attached-to) lookup. Micro-benchmark
   ([`BgsEntityBenchmark.cs`](../UnitySpy.HearthstoneLibTests/BgsEntityBenchmark.cs), 400 entities):
   10.60 -> 0.88 ms per board pass (**12x**), identical outputs.
5. **Typed `GetValue<T>` in hot loops** (Tier 3a executed): QuestsReader, ReadDustInfoCards,
   ActiveDeckReader, MatchInfoReader and the Battlegrounds tag loops no longer pay DLR dispatch per
   field read.
6. **Dictionary-based collection diff.** `CollectionInitNotifier.GetNewCards` scanned the whole
   previous collection per card (O(N²) over ~8k cards) when a change was detected; it now indexes
   the retained snapshot by card id. Micro-benchmark
   ([`MemoryChangesBenchmark.cs`](../UnitySpy.HearthstoneLibTests/MemoryChangesBenchmark.cs)):
   759.7 -> 1.7 ms per changed-collection diff (**449x**), identical outputs.

### Measured results (live client, A/B, before = start of round 2)

Both sides were measured back-to-back in the **same client session** with the **same test harness**
(`PerformanceBenchmark.cs`, 50 iterations, warmed up): the "before" run loads the libraries built
from the last pre-round-2 commit (via a `git worktree`), the "after" run loads this branch. The
client had 8,107 collectible cards. Identical result sizes on both sides confirm the readers still
return the same data.

| Scenario | Before avg ms | After avg ms | Latency | Before reads/it | After reads/it | Reads |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| GetCollectionCards | 585.2 | 531.1 | **-9%** | 198,015 | 176,675 | -11% |
| GetCollectionCoins | 1.92 | 0.93 | **-51%** | 801 | 343 | -57% |
| GetCollectionCardBacks | 3.37 | 1.20 | **-64%** | 1,128 | 250 | -78% |
| GetCollectionSize | 0.88 | 0.19 | **-78%** | 397 | 64 | -84% |
| GetBattlegroundsInfo | 1.00 | 0.63 | **-37%** | 403 | 200 | -50% |
| GetSceneMode | 0.018 | 0.019 | ~0% | 5 | 5 | 0% |
| PollingTick (aggregate) | 2.24 | 0.65 | **-71%** | 832 | 296 | -64% |

Takeaways:

- The continuous-polling cost (`PollingTick`) dropped another **~3x** in latency and syscalls on
  top of round 1 - service lookups (step 3) and struct-array bulk reads (step 2) are the largest
  contributors.
- `GetCollectionCards` gained ~9% latency / ~11% fewer reads. It is dominated by per-card
  string/class reads (its `m_collectibleCards` list is a reference array whose per-element instance
  construction still costs vtable+definition reads), which is why it moves less than the other
  scenarios.
- The Battlegrounds in-game readers (step 4) and the collection diff (step 6) are CPU-bound, not
  syscall-bound; they were measured with dedicated micro-benchmarks (12x and 449x respectively)
  because their end-to-end paths require specific game states (an active BG match / a collection
  change).

## Key files

- [`UnitySpy/Detail/ProcessFacade.cs`](../UnitySpy/Detail/ProcessFacade.cs) - the syscall layer and
  all `ReadManaged*` logic.
- [`UnitySpy/Detail/ManagedClassInstance.cs`](../UnitySpy/Detail/ManagedClassInstance.cs) - per-object
  construction / init.
- [`UnitySpy/Detail/TypeDefinition.cs`](../UnitySpy/Detail/TypeDefinition.cs) /
  [`FieldDefinition.cs`](../UnitySpy/Detail/FieldDefinition.cs) - structural metadata (safe to cache).
- [`UnitySpy/Util/ByteArrayPool.cs`](../UnitySpy/Util/ByteArrayPool.cs) - transient read buffers.
- [`UnitySpy.HearthstoneLib/Detail/HearthstoneImage.cs`](../UnitySpy.HearthstoneLib/Detail/HearthstoneImage.cs) -
  the service-locator walk (must stay live; see the caching constraint above).
