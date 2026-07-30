namespace FirestoneGameEventsHelper
{
    using System;
    using System.Linq;
    using System.Threading;
    using HearthstoneReplays;
    using Newtonsoft.Json;
    using Newtonsoft.Json.Linq;

    /// <summary>
    /// Out-of-process replacement for Overwolf's edge-js-hosted StaticReplayConverterWrapper.
    /// Hosts <see cref="ReplayConverterPlugin"/> (a pure log parser — no memory reads, so no Wine
    /// concerns at all) and speaks newline-delimited JSON-RPC on stdin/stdout. Parsed game events
    /// are pushed as "gameEvent" events, already JSON-serialized by the plugin.
    /// stdout is protocol only; logs go to stderr.
    /// </summary>
    internal static class Program
    {
        private static readonly object WriteLock = new object();
        private static readonly ReplayConverterPlugin Plugin = new ReplayConverterPlugin();
        private static bool wired;

        private static void Main()
        {
            Log("started");
            WirePlugin();

            string line;
            while ((line = Console.In.ReadLine()) != null)
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
                ThreadPool.QueueUserWorkItem(_ => Handle(id, method, prms));
            }

            Log("stdin closed, exiting");
        }

        private static void WirePlugin()
        {
            if (wired)
            {
                return;
            }

            wired = true;

            // The plugin serializes each GameEvent to a JSON string before invoking the callback;
            // forward that string as-is. The Node consumer JSON.parses string events.
            Plugin.setGameEventCallback(evt => Emit("gameEvent", evt == null ? JValue.CreateNull() : new JValue(evt.ToString())));
            Plugin.setLogger((a, b) => Log($"{a} {b}"));
        }

        private static void Handle(int id, string method, JArray p)
        {
            try
            {
                switch (method)
                {
                    // Callback-completion methods: respond only once the plugin signals done.
                    case "initRealtimeLogConversion":
                        Plugin.initRealtimeLogConversion(_ => Ok(id, JValue.CreateNull()));
                        return;

                    case "realtimeLogProcessing":
                        Plugin.realtimeLogProcessing(LogLines(p), _ => Ok(id, JValue.CreateNull()));
                        return;

                    // Immediate methods.
                    case "initialize":
                        WirePlugin();
                        Ok(id, true);
                        return;
                    case "askForGameStateUpdate":
                        Plugin.askForGameStateUpdate();
                        Ok(id, JValue.CreateNull());
                        return;
                    case "tearDown":
                        Ok(id, JValue.CreateNull());
                        return;
                    default:
                        throw new InvalidOperationException($"Unknown method '{method}'");
                }
            }
            catch (Exception ex)
            {
                Respond(new JObject { ["id"] = id, ["ok"] = false, ["error"] = ex.Message.Split('\n')[0] });
            }
        }

        // Accepts either ["a","b"] or [{logLines:["a","b"]}] to match the Node bridge's payload.
        private static string[] LogLines(JArray p)
        {
            if (p.Count == 1 && p[0] is JObject wrapper && wrapper["logLines"] is JArray inner)
            {
                return inner.Select(t => t?.ToString() ?? string.Empty).ToArray();
            }

            if (p.Count == 1 && p[0] is JArray arr)
            {
                return arr.Select(t => t?.ToString() ?? string.Empty).ToArray();
            }

            return p.Select(t => t?.ToString() ?? string.Empty).ToArray();
        }

        private static void Ok(int id, JToken result) =>
            Respond(new JObject { ["id"] = id, ["ok"] = true, ["result"] = result });

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

        private static void Log(string msg) => Console.Error.WriteLine($"[game-events-helper] {msg}");
    }
}
