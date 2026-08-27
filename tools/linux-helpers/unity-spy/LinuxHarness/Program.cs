using System;
using System.Diagnostics;
using System.Linq;
using HackF5.UnitySpy.HearthstoneLib;

internal static class Program
{
    private static void Main()
    {
        var proc = Process.GetProcessesByName("Hearthstone.exe").FirstOrDefault();
        if (proc == null)
        {
            Console.WriteLine("Hearthstone is not running.");
            return;
        }

        Console.WriteLine($"[harness] Hearthstone.exe pid={proc.Id}");
        Console.WriteLine($"[harness] exe path = {HackF5.UnitySpy.Util.LinuxProcessProbe.MainModule(proc.Id)}");
        Console.WriteLine($"[harness] unity ver = {HackF5.UnitySpy.Util.LinuxProcessProbe.Version(proc.Id)}");

        var sw = Stopwatch.StartNew();
        using var mv = new MindVision(null, "Hearthstone", proc.Id);
        Console.WriteLine($"[harness] MindVision constructed in {sw.ElapsedMilliseconds}ms");

        Try("GetSceneMode", () => mv.GetSceneMode()?.ToString());
        Try("GetCollectionSize", () => mv.GetCollectionSize().ToString());
        Try("GetBoostersCount", () => mv.GetBoostersCount().ToString());
        Try("GetMatchInfo", () => {
            var m = mv.GetMatchInfo();
            return m == null ? null : $"{m.LocalPlayer?.Name} vs {m.OpposingPlayer?.Name}";
        });
    }

    private static void Try(string name, Func<string> read)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            var value = read();
            Console.WriteLine($"  {name,-22} = {value ?? "<null>"}   ({sw.ElapsedMilliseconds}ms)");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"  {name,-22} ! {ex.GetType().Name}: {ex.Message.Split('\n')[0]}");
        }
    }
}
