namespace FirestoneMindVisionHelper
{
    using System;
    using System.Diagnostics;
    using System.Linq;
    using System.Threading;
    using HackF5.UnitySpy.HearthstoneLib;
    using Newtonsoft.Json;
    using Newtonsoft.Json.Linq;

    /// <summary>
    /// Out-of-process replacement for Overwolf's edge-js-hosted StaticMindVisionWrapper.
    /// Reads newline-delimited JSON-RPC requests on stdin, dispatches to the ported net8.0
    /// <see cref="MindVision"/>, and writes newline-delimited JSON responses on stdout.
    /// <para>
    /// stdout carries protocol only; every log line goes to stderr so the Node bridge never
    /// has to disambiguate. This exists because edge-js's in-process CoreCLR host is a
    /// .NET Core 2.x-era fx_muxer that will not host net8.0 on Linux (see tools/linux-probe).
    /// </para>
    /// </summary>
    internal static class Program
    {
        private static readonly object WriteLock = new object();
        private static MindVision mindVision;
        private static volatile bool polling;

        private static void Main()
        {
            Log("started");
            var stdin = Console.In;
            string line;
            while ((line = stdin.ReadLine()) != null)
            {
                if (line.Trim().Length == 0)
                {
                    continue;
                }

                JObject req;
                try
                {
                    req = JObject.Parse(line);
                }
                catch (Exception ex)
                {
                    Log($"unparseable request: {ex.Message}");
                    continue;
                }

                var id = req.Value<int?>("id") ?? -1;
                var method = req.Value<string>("method");
                var prms = req["params"] as JArray ?? new JArray();

                // Each request is handled on its own thread so a slow read can't stall the
                // pipe, matching the fire-and-forget shape the Node facade already assumes.
                ThreadPool.QueueUserWorkItem(_ => Handle(id, method, prms));
            }

            polling = false;
            Log("stdin closed, exiting");
        }

        private static void Handle(int id, string method, JArray p)
        {
            try
            {
                var result = Dispatch(method, p);
                Respond(new JObject { ["id"] = id, ["ok"] = true, ["result"] = result });
            }
            catch (Exception ex)
            {
                Respond(new JObject { ["id"] = id, ["ok"] = false, ["error"] = ex.Message.Split('\n')[0] });
            }
        }

        private static JToken Dispatch(string method, JArray p)
        {
            switch (method)
            {
                // ---- lifecycle -------------------------------------------------------
                case "initialize":
                case "initializePlugin":
                    Instance();
                    return true;
                case "reset":
                    lock (WriteLock) { mindVision = null; }
                    return JValue.CreateNull();
                case "tearDown":
                    polling = false;
                    lock (WriteLock) { mindVision = null; }
                    return JValue.CreateNull();
                case "isRunning":
                    return HearthstoneProcess() != null;
                case "isBootstrapped":
                    return Instance().IsBootstrapped();
                case "listenForUpdates":
                    StartPolling();
                    return JValue.CreateNull();
                case "stopListenForUpdates":
                    polling = false;
                    return JValue.CreateNull();
                case "getMemoryChanges":
                    return Wrap(Instance().GetMemoryChanges());

                // ---- collection ------------------------------------------------------
                case "getCollection":
                    return Wrap(Instance().GetCollectionCards());
                case "getCollectionSize":
                    return Instance().GetCollectionSize();
                case "getBattlegroundsOwnedHeroSkinDbfIds":
                    return Wrap(Instance().GetCollectionBattlegroundsHeroSkins());
                case "getCardBacks":
                    return Wrap(Instance().GetCollectionCardBacks());
                case "getCoins":
                    return Wrap(Instance().GetCollectionCoins());

                // ---- match / scene ---------------------------------------------------
                case "getMatchInfo":
                    return Wrap(Instance().GetMatchInfo());
                case "getCurrentBoard":
                    return Instance().GetBoard();
                case "getCurrentScene":
                    return (int?)Instance().GetSceneMode();
                case "getGameUniqueId":
                    return Instance().GetGameUniqueId();
                case "getRegion":
                    return (int?)Instance().GetCurrentRegion();

                // ---- battlegrounds ---------------------------------------------------
                case "getBgsPlayerTeammateBoard":
                    return Wrap(Instance().GetBgsPlayerTeammateBoard());
                case "getBgsPlayerBoard":
                    return Wrap(Instance().GetBgsPlayerBoard());
                case "getBattlegroundsInfo":
                    // Must serialize the whole object: the app reads Game.Players (leaderboard,
                    // tech levels, win streaks) and Game.AvailableRaces off this, and its BG parser
                    // dereferences Game unguarded.
                    return Wrap(Instance().GetBattlegroundsInfo());

                case "getBattlegroundsSelectedMode":
                {
                    var mode = Instance().GetBattlegroundsSelectedGameMode();
                    if (string.IsNullOrEmpty(mode))
                    {
                        return JValue.CreateNull();
                    }

                    return mode.IndexOf("duo", StringComparison.OrdinalIgnoreCase) >= 0 ? "duos" : "solo";
                }

                // ---- mercenaries -----------------------------------------------------
                case "getMercenariesInfo":
                    return Wrap(Instance().GetMercenariesInfo());
                case "getMercenariesCollectionInfo":
                    return Wrap(Instance().GetMercenariesCollectionInfo());

                // ---- arena -----------------------------------------------------------
                case "getArenaInfo":
                    return Wrap(Instance().GetArenaInfo());
                case "getArenaDeck":
                    return Wrap(Instance().GetArenaDeck());

                // ---- decks -----------------------------------------------------------
                case "getActiveDeck":
                    return Wrap(Instance().GetActiveDeck(AsLong(p, 0)));
                case "getSelectedDeckId":
                    return Instance().GetSelectedDeckId();
                case "getWhizbangDeck":
                    return Wrap(Instance().GetWhizbangDeck(AsLong(p, 0) ?? 0));

                // ---- rewards / progression ------------------------------------------
                case "getRewardsTrackInfo":
                    return Wrap(Instance().GetRewardTrackInfo());
                case "getBoostersInfo":
                    return Wrap(Instance().GetBoostersInfo());
                case "getActiveQuests":
                    return Wrap(Instance().GetQuests());

                // ---- achievements ----------------------------------------------------
                case "getAchievementsInfo":
                    return Wrap(Instance().GetAchievementsInfo());
                case "getAchievementCategories":
                    return Wrap(Instance().GetAchievementCategories());
                case "getInGameAchievementsProgressInfo":
                    return Wrap(Instance().GetInGameAchievementsProgressInfo(AsIntArray(p, 0)));
                case "getInGameAchievementsProgressInfoByIndex":
                    return Wrap(Instance().GetInGameAchievementsProgressInfoByIndex(AsIntArray(p, 0)));

                // ---- player ----------------------------------------------------------
                case "getPlayerProfileInfo":
                    return Wrap(Instance().GetPlayerProfileInfo());
                case "getAccountInfo":
                    return Wrap(Instance().GetAccountInfo());

                default:
                    throw new InvalidOperationException($"Unknown method '{method}'");
            }
        }

        // MindVision returns interface-typed objects; serialize to a JToken via Newtonsoft so
        // the Node side receives the same JSON shape Overwolf's wrapper produced.
        private static JToken Wrap(object value) =>
            value == null ? JValue.CreateNull() : JToken.FromObject(value);

        private static long? AsLong(JArray p, int i) =>
            p.Count > i && p[i].Type != JTokenType.Null ? p[i].Value<long?>() : null;

        private static int[] AsIntArray(JArray p, int i) =>
            p.Count > i && p[i] is JArray arr ? arr.Select(t => t.Value<int>()).ToArray() : Array.Empty<int>();

        private static MindVision Instance()
        {
            if (mindVision != null)
            {
                return mindVision;
            }

            lock (WriteLock)
            {
                if (mindVision != null)
                {
                    return mindVision;
                }

                var proc = HearthstoneProcess()
                           ?? throw new InvalidOperationException("Hearthstone is not running.");
                Log($"attaching to Hearthstone pid={proc.Id}");
                mindVision = new MindVision(null, "Hearthstone", proc.Id);
                return mindVision;
            }
        }

        private static Process HearthstoneProcess() =>
            Process.GetProcessesByName("Hearthstone").FirstOrDefault()
            ?? Process.GetProcessesByName("Hearthstone.exe").FirstOrDefault();

        private static void StartPolling()
        {
            if (polling)
            {
                return;
            }

            polling = true;

            // MindVision has its own change-detection loop; hand it a callback that forwards each
            // update straight down the pipe as a memoryUpdate event (1000ms cadence, as Overwolf used).
            Instance().ListenForChanges(1000, update =>
            {
                if (update != null)
                {
                    Emit("memoryUpdate", JToken.FromObject(update));
                }
            });
        }

        private static void Emit(string evt, JToken data) =>
            Respond(new JObject { ["event"] = evt, ["data"] = data });

        private static void Respond(JObject payload)
        {
            var text = payload.ToString(Formatting.None);
            lock (WriteLock)
            {
                Console.Out.Write(text);
                Console.Out.Write('\n');
                Console.Out.Flush();
            }
        }

        private static void Log(string msg) => Console.Error.WriteLine($"[helper] {msg}");
    }
}
