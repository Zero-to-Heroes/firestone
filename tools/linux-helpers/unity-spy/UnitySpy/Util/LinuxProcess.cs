#if NET5_0_OR_GREATER
namespace HackF5.UnitySpy.Util
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Globalization;
    using System.IO;
    using System.Linq;
    using System.Text;
    using HackF5.UnitySpy.Detail;
    using Microsoft.Win32.SafeHandles;

    /// <summary>
    /// Linux equivalents of the psapi/kernel32 calls in <see cref="Native"/>, for reading a
    /// Hearthstone hosted by Wine/Proton from a native Linux process.
    /// <para>
    /// Wine is not an emulator: each Windows process is an ordinary Linux process, and Wine maps
    /// the PE images at the same virtual addresses the Windows-side pointers refer to. So the
    /// Windows pointer arithmetic everywhere above this class stays byte-for-byte correct, and
    /// only the two primitives at the bottom change:
    /// <c>ReadProcessMemory</c> becomes a pread on <c>/proc/pid/mem</c>, and
    /// <c>EnumProcessModulesEx</c> becomes a parse of <c>/proc/pid/maps</c>.
    /// </para>
    /// <para>
    /// Reading <c>/proc/pid/mem</c> requires PTRACE_MODE_ATTACH permission but not an actual
    /// ptrace attach, so the game is never stopped or otherwise perturbed. Callers need
    /// <c>kernel.yama.ptrace_scope=0</c>, CAP_SYS_PTRACE, or to be an ancestor of the game.
    /// </para>
    /// </summary>
    internal static class LinuxProcess
    {
        private static readonly ConcurrentDictionary<int, SafeFileHandle> MemHandles =
            new ConcurrentDictionary<int, SafeFileHandle>();

        public static bool IsSupported => OperatingSystem.IsLinux();

        /// <summary>
        /// Reads up to <paramref name="size"/> bytes. Returns the number actually read; a short
        /// read means the range crossed into unmapped memory, which is the analogue of Windows'
        /// ERROR_PARTIAL_COPY rather than an error in its own right.
        /// </summary>
        public static unsafe int Read(int processId, long address, byte* buffer, int size)
        {
            var handle = GetMemHandle(processId);
            var total = 0;
            while (total < size)
            {
                int read;
                try
                {
                    read = RandomAccess.Read(handle, new Span<byte>(buffer + total, size - total), address + total);
                }
                catch (Exception ex) when (ex is IOException || ex is UnauthorizedAccessException)
                {
                    break;
                }

                if (read <= 0)
                {
                    break;
                }

                total += read;
            }

            return total;
        }

        public static unsafe int Read(int processId, long address, byte[] buffer, int size)
        {
            fixed (byte* pinned = buffer)
            {
                return Read(processId, address, pinned, size);
            }
        }

        /// <summary>
        /// The <c>EnumProcessModulesEx</c> + <c>GetModuleFileNameEx</c> + <c>GetModuleInformation</c>
        /// equivalent. Wine maps each PE section separately, so a module's base is the lowest
        /// mapping of its backing file - which is what GetModuleInformation reports on Windows.
        /// </summary>
        public static List<ModuleInfo> GetModules(int processId)
        {
            var byPath = new Dictionary<string, (ulong Start, ulong End)>(StringComparer.Ordinal);

            foreach (var line in File.ReadLines($"/proc/{processId}/maps"))
            {
                // 7f1234500000-7f1234600000 r-xp 00000000 fe:05 1234  /path/to/mono-2.0-bdwgc.dll
                var pathStart = line.IndexOf('/');
                if (pathStart < 0)
                {
                    continue;
                }

                var dash = line.IndexOf('-');
                var space = line.IndexOf(' ');
                if (dash < 0 || space < 0 || dash > space)
                {
                    continue;
                }

                if (!ulong.TryParse(line.Substring(0, dash), NumberStyles.HexNumber, CultureInfo.InvariantCulture, out var start)
                    || !ulong.TryParse(line.Substring(dash + 1, space - dash - 1), NumberStyles.HexNumber, CultureInfo.InvariantCulture, out var end))
                {
                    continue;
                }

                var path = line.Substring(pathStart).Trim();
                if (path.Length == 0 || path.StartsWith("[", StringComparison.Ordinal))
                {
                    continue;
                }

                if (byPath.TryGetValue(path, out var existing))
                {
                    byPath[path] = (Math.Min(existing.Start, start), Math.Max(existing.End, end));
                }
                else
                {
                    byPath[path] = (start, end);
                }
            }

            return byPath
                .Select(kv => new ModuleInfo(
                    Path.GetFileName(kv.Key),
                    (IntPtr)(long)kv.Value.Start,
                    (uint)(kv.Value.End - kv.Value.Start)))
                .ToList();
        }

        /// <summary>
        /// The <c>QueryFullProcessImageName</c> equivalent, returning a Linux path to the game's
        /// PE image. <c>/proc/pid/exe</c> is useless here: it points at the Wine loader, not at
        /// Hearthstone.exe. The real image is whichever mapped .exe matches the process name.
        /// </summary>
        public static string GetMainModuleFileName(int processId)
        {
            var comm = File.ReadAllText($"/proc/{processId}/comm").Trim();

            var executables = GetModulePaths(processId)
                .Where(p => p.EndsWith(".exe", StringComparison.OrdinalIgnoreCase))
                .ToList();

            // comm is truncated to 15 chars by the kernel ("Hearthstone.exe" is exactly 15), so
            // match on prefix rather than equality.
            var match = executables.FirstOrDefault(
                p => Path.GetFileName(p).StartsWith(comm, StringComparison.OrdinalIgnoreCase));
            if (match != null)
            {
                return match;
            }

            // Fall back to the only .exe that isn't part of the Wine runtime itself.
            var gameExes = executables
                .Where(p => !p.Contains("/wine/", StringComparison.OrdinalIgnoreCase)
                            && !p.Contains("/windows/system32/", StringComparison.OrdinalIgnoreCase))
                .ToList();

            return gameExes.Count > 0 ? gameExes[0] : executables.FirstOrDefault();
        }

        /// <summary>
        /// Reads the Unity version out of a PE's version resource.
        /// <para>
        /// <see cref="System.Diagnostics.FileVersionInfo"/> cannot do this on Linux - it only
        /// understands managed assembly metadata and returns null for a native PE - so the
        /// resource is parsed by hand.
        /// </para>
        /// <para>
        /// The value must come from the StringFileInfo "FileVersion" entry, NOT from
        /// VS_FIXEDFILEINFO: Blizzard overwrites the fixed info with Hearthstone's own version
        /// (e.g. 36.0.3.49395) while Unity's version survives only in the string block
        /// (e.g. 2022.3.62.7762112), and MonoLibraryOffsets matches on the latter.
        /// </para>
        /// </summary>
        public static string GetPeFileVersion(string path)
        {
            var bytes = File.ReadAllBytes(path);

            var marker = Encoding.Unicode.GetBytes("StringFileInfo");
            var at = IndexOf(bytes, marker);
            if (at < 0)
            {
                return null;
            }

            var key = Encoding.Unicode.GetBytes("FileVersion");
            var keyAt = IndexOf(bytes, key, at);
            if (keyAt < 0)
            {
                return null;
            }

            // Value follows the key, padded to a 4-byte boundary, as a UTF-16 string.
            var cursor = keyAt + key.Length;
            while (cursor + 1 < bytes.Length && bytes[cursor] == 0 && bytes[cursor + 1] == 0)
            {
                cursor += 2;
            }

            var end = cursor;
            while (end + 1 < bytes.Length && !(bytes[end] == 0 && bytes[end + 1] == 0))
            {
                end += 2;
            }

            var value = Encoding.Unicode.GetString(bytes, cursor, end - cursor).Trim();
            return value.Length == 0 ? null : value;
        }

        /// <summary>Machine type from the PE header, for the 32/64-bit offsets selection.</summary>
        public static int GetPeMachineType(string path)
        {
            using var stream = File.OpenRead(path);
            using var reader = new BinaryReader(stream);

            stream.Seek(0x3c, SeekOrigin.Begin);
            var peOffset = reader.ReadInt32();
            stream.Seek(peOffset, SeekOrigin.Begin);

            if (reader.ReadUInt32() != 0x00004550)
            {
                throw new InvalidOperationException($"Can't find PE header in '{path}'.");
            }

            return reader.ReadUInt16();
        }

        private static IEnumerable<string> GetModulePaths(int processId)
        {
            var seen = new HashSet<string>(StringComparer.Ordinal);
            foreach (var line in File.ReadLines($"/proc/{processId}/maps"))
            {
                var pathStart = line.IndexOf('/');
                if (pathStart < 0)
                {
                    continue;
                }

                var path = line.Substring(pathStart).Trim();
                if (path.Length > 0 && seen.Add(path))
                {
                    yield return path;
                }
            }
        }

        private static SafeFileHandle GetMemHandle(int processId) =>
            MemHandles.GetOrAdd(
                processId,
                id => File.OpenHandle($"/proc/{id}/mem", FileMode.Open, FileAccess.Read));

        private static int IndexOf(byte[] haystack, byte[] needle, int start = 0)
        {
            for (var i = start; i <= haystack.Length - needle.Length; i++)
            {
                var found = true;
                for (var j = 0; j < needle.Length; j++)
                {
                    if (haystack[i + j] != needle[j])
                    {
                        found = false;
                        break;
                    }
                }

                if (found)
                {
                    return i;
                }
            }

            return -1;
        }
    }
}
#endif
