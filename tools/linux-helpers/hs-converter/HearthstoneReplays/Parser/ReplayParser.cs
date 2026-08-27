#region

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.Handlers;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser;
using HearthstoneReplays.Events;
using System.Xml.Linq;
using System.Diagnostics.Eventing;
using System.Globalization;
using System.Runtime.CompilerServices;

#endregion

namespace HearthstoneReplays.Parser

{
    public class ReplayParser
    {
        public static DateTime start; // The log is not aware of absolute time, time zones, etc. So we just represent it based on the user's computer

        public CombinedState State;
        //private ParserState State;
        private DataHandler dataHandler;
        private PowerDataHandler powerDataHandler;
        private ChoicesHandler choicesHandler;
        private SendChoicesHandler sendChoicesHandler;
        private EntityChosenHandler entityChosenHandler;
        private OptionsHandler optionsHandler;
        private PowerProcessorHandler powerProcessorHandler;

        private Helper helper;

        private DateTime previousTimestamp;

        private List<string> processedLines = new List<string>();
        private long CurrentGameSeed;

        public ReplayParser()
        {
            State = new CombinedState();
            this.helper = new Helper(State);
            dataHandler = new DataHandler(helper);
            powerDataHandler = new PowerDataHandler(helper);
            choicesHandler = new ChoicesHandler(helper);
            sendChoicesHandler = new SendChoicesHandler(helper);
            entityChosenHandler = new EntityChosenHandler(helper);
            optionsHandler = new OptionsHandler(helper);
            powerProcessorHandler = new PowerProcessorHandler(helper);
            previousTimestamp = default;
            start = DateTime.Now; // Don't use UTC, otherwise it won't match with the log info
            Logger.Log("ReplayParser constructor over", State.GSState == null);
        }

        public HearthstoneReplay FromString(IEnumerable<string> lines, params GameType[] gameTypes)
        {
            Read(lines.ToArray());
            var finalState = State.GSState;
            for (var i = 0; i < finalState.Replay.Games.Count; i++)
            {
                if (gameTypes == null || gameTypes.Length == 1)
                    finalState.Replay.Games[i].Type = (int)gameTypes[0];
                else
                    finalState.Replay.Games[i].Type = gameTypes.Length > i ? (int)gameTypes[i] : 0;
            }
            return finalState.Replay;
        }

        public void Read(string[] lines)
        {
            Init();
            // Use chunks to recompute the game seed when parsing multiple games at the same time
            //int chunkSize = 500;
            //int totalLines = lines.Length;

            long gameSeed = ExtractGameSeed(lines);
            Logger.Log($"Extracted game seed = {gameSeed}", "");
            if (gameSeed > 0)
            {
                this.CurrentGameSeed = gameSeed;
            }

            for (int i = 0; i < lines.Length; i++)
            {
                var line = lines[i];
                //var debug = line.Contains("D 12:50:21.9664526 PowerTaskList.DebugPrintPower() -     TAG_CHANGE Entity=[entityName=Molten Rock id=524 zone=PLAY zonePos=1 cardId=BGS_127 player=12] tag=ZONE value=GRAVEYARD");
                var debug = i == 3458;
                ReadLine(line, this.CurrentGameSeed, i);
            }
        }

        public void Init()
        {
            Logger.Log("Calling reset from ReplayParser.init()", "");
            previousTimestamp = default;
            //State.Reset();
        }

        private bool resettingGame;
        private int currentResetBlockIndex;
        private List<dynamic> resettingGames = new List<dynamic>();
        // Track ignoring state and block depth SEPARATELY for each log stream
        // GameState and PowerTaskList are asynchronous - GS can finish its reset while PTL is still in alternate timeline
        private bool ignoringAlternateTimelineGS;
        private int alternateTimelineBlockDepthGS;
        private bool ignoringAlternateTimelinePTL;
        private int alternateTimelineBlockDepthPTL;
        private bool inResetBlockGS;
        private bool inResetBlockPTL;

        public void ReadLine(string line, long gameSeed, int lineIndex)
        {
            if (gameSeed != 0)
            {
                this.CurrentGameSeed = gameSeed;
            }

            // Manual parsing for PowerlogLineRegex - much faster than regex for the common case
            // Format: "D [timestamp] [method]() - [content]"
            string timestamp = null;
            string method = null;
            string content = null;
            bool matchSuccess = false;

            if (line.Length >= 3 && line[0] == 'D' && line[1] == ' ')
            {
                // Find the first space after "D " (start of timestamp)
                int timestampStart = 2;
                int timestampEnd = line.IndexOf(' ', timestampStart);
                if (timestampEnd > timestampStart)
                {
                    timestamp = line.Substring(timestampStart, timestampEnd - timestampStart);

                    // Find "() - " pattern to split method and content
                    int methodEnd = line.IndexOf("() - ", timestampEnd + 1);
                    if (methodEnd > timestampEnd)
                    {
                        method = line.Substring(timestampEnd + 1, methodEnd - timestampEnd - 1);
                        content = line.Substring(methodEnd + 5); // Skip "() - "
                        matchSuccess = true;
                    }
                }
            }

            if (!this.resettingGame && line.Contains("GameState") && line.Contains("CREATE_GAME"))
            {
                Logger.Log($"Clearing {this.processedLines.Count} processed lines", line);
                this.processedLines.Clear();
            }

            // Only check ResetStartMatchRegex if line contains "BLOCK_START"
            Match resetStartMatch = null;
            if (line.Contains("BLOCK_START"))
            {
                resetStartMatch = Regexes.ResetStartMatchRegex.Match(line);
            }
            if (!this.resettingGame)
            {
                if (resetStartMatch != null && resetStartMatch.Success && line.Contains("GameState.DebugPrintPower()"))
                {
                    //Logger.Log("askForGameStateUpdate", "built provider");
                    var normalizedTimestamp = matchSuccess ? NormalizeTimestamp(timestamp) : DateTime.Now;
                    State.PTLState.NodeParser.EnqueueGameEvent(new List<GameEventProvider> {
                        GameEventProvider.Create(normalizedTimestamp, "REWIND_STARTED", () => new GameEvent { Type = "REWIND_STARTED" }, true, null)
                    });
                    this.resettingGame = true;
                    this.currentResetBlockIndex = 0;
                    // Reset all stream-specific state for the new reset cycle
                    this.ignoringAlternateTimelineGS = false;
                    this.alternateTimelineBlockDepthGS = 0;
                    this.ignoringAlternateTimelinePTL = false;
                    this.alternateTimelineBlockDepthPTL = 0;
                    this.inResetBlockGS = false;
                    this.inResetBlockPTL = false;
                    // TODO: Enqueue reset game event
                    var rawEntity = resetStartMatch.Groups[1].Value;
                    var entityId = helper.ParseEntity(rawEntity);
                    
                    // Find the LAST PLAY block with this entity id before the GAME_RESET for EACH stream
                    // This is the alternate timeline we need to ignore. Previous PLAY blocks with the same entity id
                    // are from accepted timelines and should NOT be ignored.
                    int alternatePlayIndexGS = -1;
                    int alternatePlayIndexPTL = -1;
                    for (int i = this.processedLines.Count - 1; i >= 0; i--)
                    {
                        var prevLine = this.processedLines[i];
                        if (prevLine.Contains("BLOCK_START BlockType=PLAY") && prevLine.Contains($"id={entityId} "))
                        {
                            // GameState always happens earlier than PTL. So later in the processing, since
                            // we go in reverse order
                            // This means that if we process a GameState line and haven't processed a PTL line,
                            // the GAME_RESET occurred before the PTL line for the play happened, and trying to 
                            // find a PTL line can cause us to get something incorrect
                            // So we stop as soon as we find the GS info
                            if (prevLine.Contains("GameState.") && alternatePlayIndexGS == -1)
                            {
                                alternatePlayIndexGS = i;
                                break;
                            }
                            else if (prevLine.Contains("PowerTaskList.") && alternatePlayIndexPTL == -1)
                            {
                                alternatePlayIndexPTL = i;
                            }
                        }
                    }
                    
                    this.resettingGames.Clear();
                    this.resettingGames.Add(new { originEntity = entityId, alternatePlayIndexGS = alternatePlayIndexGS, alternatePlayIndexPTL = alternatePlayIndexPTL });
                    // We keep the "RESET_GAME" line so that we know when we need to start ignoring the "recreate game" effect
                    // and when it ends
                    this.processedLines.Add(line);
                    var linesCopy = this.processedLines.ToArray();
                    this.processedLines.Clear();
                    Read(linesCopy);
                    return;
                }
            }

            // Determine which log stream this line belongs to
            // GameState and PowerTaskList are ASYNCHRONOUS - GS can finish its reset while PTL is still in alternate timeline
            bool isGameState = line.Contains("GameState.");
            bool isPowerTaskList = line.Contains("PowerTaskList.");

            // Track GAME_RESET blocks separately for each stream
            if (resetStartMatch != null && resetStartMatch.Success)
            {
                if (isGameState)
                    this.inResetBlockGS = true;
                else if (isPowerTaskList)
                    this.inResetBlockPTL = true;
            }

            if (this.resettingGame)
            {
                var currentEntityIdBlockToIgnore = this.resettingGames[this.currentResetBlockIndex];

                // === GAMESTATE STREAM HANDLING ===
                if (isGameState)
                {
                    // Only ignore the specific PLAY block that is the alternate timeline (the last one before GAME_RESET)
                    // Previous PLAY blocks with the same entity id are from accepted timelines and should NOT be ignored
                    bool isAlternatePlayBlock = lineIndex == currentEntityIdBlockToIgnore.alternatePlayIndexGS;

                    // Start ignoring when we see THE alternate timeline PLAY block (exact line match)
                    if (isAlternatePlayBlock && line.Contains("BLOCK_START BlockType=PLAY") && line.Contains($"id={currentEntityIdBlockToIgnore.originEntity} ") 
                        && !this.ignoringAlternateTimelineGS)
                    {
                        this.ignoringAlternateTimelineGS = true;
                        this.alternateTimelineBlockDepthGS = 1;
                    }
                    // Track nested BLOCK_START
                    else if (this.ignoringAlternateTimelineGS && line.Contains("BLOCK_START"))
                    {
                        this.alternateTimelineBlockDepthGS++;
                    }
                    // Track BLOCK_END - stop ignoring alternate timeline when we exit the outermost block
                    else if (this.ignoringAlternateTimelineGS && line.Contains("BLOCK_END"))
                    {
                        this.alternateTimelineBlockDepthGS--;
                        if (this.alternateTimelineBlockDepthGS == 0)
                        {
                            this.ignoringAlternateTimelineGS = false;
                        }
                    }

                    // Handle GAME_RESET block end for GameState
                    if (this.inResetBlockGS && line.Contains("BLOCK_END"))
                    {
                        this.inResetBlockGS = false;
                    }

                    // Skip this line if GameState is ignoring alternate timeline or in reset block
                    if (this.ignoringAlternateTimelineGS || this.inResetBlockGS)
                    {
                        return;
                    }
                }

                // === POWERTASKLIST STREAM HANDLING ===
                if (isPowerTaskList)
                {
                    // Only ignore the specific PLAY block that is the alternate timeline (the last one before GAME_RESET)
                    // Previous PLAY blocks with the same entity id are from accepted timelines and should NOT be ignored
                    bool isAlternatePlayBlock = lineIndex == currentEntityIdBlockToIgnore.alternatePlayIndexPTL;

                    // Start ignoring when we see THE alternate timeline PLAY block (exact line match)
                    if (isAlternatePlayBlock && line.Contains("BLOCK_START BlockType=PLAY") && line.Contains($"id={currentEntityIdBlockToIgnore.originEntity} ") 
                        && !this.ignoringAlternateTimelinePTL)
                    {
                        this.ignoringAlternateTimelinePTL = true;
                        this.alternateTimelineBlockDepthPTL = 1;
                    }
                    // Track nested BLOCK_START
                    else if (this.ignoringAlternateTimelinePTL && line.Contains("BLOCK_START"))
                    {
                        this.alternateTimelineBlockDepthPTL++;
                    }
                    // Track BLOCK_END - stop ignoring alternate timeline when we exit the outermost block
                    else if (this.ignoringAlternateTimelinePTL && line.Contains("BLOCK_END"))
                    {
                        this.alternateTimelineBlockDepthPTL--;
                        if (this.alternateTimelineBlockDepthPTL == 0)
                        {
                            this.ignoringAlternateTimelinePTL = false;
                        }
                    }

                    // Handle GAME_RESET block end for PowerTaskList - this completes the reset process
                    if (this.inResetBlockPTL && line.Contains("BLOCK_END"))
                    {
                        this.inResetBlockPTL = false;
                        // Only mark reset as complete when PTL finishes (it's always last)
                        this.currentResetBlockIndex++;
                        if (this.currentResetBlockIndex == this.resettingGames.Count)
                        {
                            this.resettingGame = false;
                            var normalizedTimestamp = matchSuccess ? NormalizeTimestamp(timestamp) : DateTime.Now;
                            State.PTLState.NodeParser.EnqueueGameEvent(new List<GameEventProvider> {
                                GameEventProvider.Create(normalizedTimestamp, "REWIND_OVER", () => new GameEvent { Type = "REWIND_OVER" }, true, null)
                            });
                        }
                    }

                    // Skip this line if PowerTaskList is ignoring alternate timeline or in reset block
                    if (this.ignoringAlternateTimelinePTL || this.inResetBlockPTL)
                    {
                        return;
                    }
                }
            }

            this.processedLines.Add(line);
            if (!matchSuccess)
            {
                if (line.Contains("End Spectator Mode") || (line.Contains("Begin Spectating") && !line.Contains("2nd")))
                {
                    AddData(null, "Spectator", line, gameSeed);
                }
                else if (line != null && line.Trim().Length > 0)
                {
                    Logger.Log("No match", line);
                }
                return;
            }

            //if (!this.resettingGame)
            //{
            //}
            AddData(timestamp, method, content, gameSeed);

        }

        public void AskForGameStateUpdate()
        {
            //Logger.Log("askForGameStateUpdate", "Parser");
            GameStateShort gameState = null;
            try
            {
                gameState = GameEvent.BuildGameState(State.PTLState, State.StateFacade, State.PTLState.GameState);
            }
            catch (Exception ex)
            {
                Logger.Log("askForGameStateUpdate", $"Could not create game state: {ex.ToString()}");
            }
            //Logger.Log("askForGameStateUpdate", "Built game state");
            Func<GameEvent> eventSupplier = () =>
            {
                //Logger.Log("Returning new event", "GAME_STATE_UPDATE");
                return new GameEvent
                {
                    Type = "GAME_STATE_UPDATE",
                    Value = new { LocalPlayer = State.StateFacade.LocalPlayer, OpponentPlayer = State.StateFacade.OpponentPlayer, GameState = gameState, }
                };
            };
            var provider = GameEventProvider.Create(
            DateTime.Now,
            "GAME_STATE_UPDATE",
            eventSupplier,
            true,
            null
            );
            //Logger.Log("askForGameStateUpdate", "built provider");
            State.PTLState.NodeParser.EnqueueGameEvent(new List<GameEventProvider> { provider });
        }

        private void AddData(string timestamp, string method, string data, long gameSeed)
        {

            var normalizedTimestamp = NormalizeTimestamp(timestamp);
            switch (method)
            {
                case "GameState.DebugPrintPower":
                case "GameState.DebugPrintGame":
                case "Spectator":
                    dataHandler.Handle(normalizedTimestamp, data, State.GSState, StateType.GameState, previousTimestamp, State.StateFacade, gameSeed, this.resettingGame);
                    previousTimestamp = normalizedTimestamp;
                    State.StateFacade.LastProcessedGSLine = data;
                    break;
                //case "GameState.SendChoices":
                //    sendChoicesHandler.Handle(normalizedTimestamp, data, State.GSState);
                //    break;
                //case "GameState.DebugPrintChoices":
                case "GameState.DebugPrintEntityChoices":
                    choicesHandler.Handle(normalizedTimestamp, data, State.GSState);
                    // Assumption here is that the choices are highlighted once the PTL has caught up
                    // Update: that doesn't seem to be the case. Some choices appear after the GS has completed, 
                    // but the PTL FullEntity blocks have not appeared yet
                    // So for now keep the choices purely on the GS side - hoping the timings will be good enough
                    //choicesHandler.Handle(normalizedTimestamp, data, State.PTLState);
                    previousTimestamp = normalizedTimestamp;
                    break;
                case "GameState.DebugPrintEntitiesChosen":
                    entityChosenHandler.Handle(normalizedTimestamp, data, State.GSState);
                    //entityChosenHandler.Handle(normalizedTimestamp, data, State.PTLState);
                    previousTimestamp = normalizedTimestamp;
                    break;
                case "GameState.DebugPrintOptions":
                    optionsHandler.Handle(normalizedTimestamp, data, State.GSState, StateType.GameState, State.StateFacade);
                    optionsHandler.Handle(normalizedTimestamp, data, State.PTLState, StateType.PowerTaskList, State.StateFacade);
                    previousTimestamp = normalizedTimestamp;
                    break;
                case "PowerTaskList.DebugPrintPower":
                    // Process the actual stuff
                    dataHandler.Handle(normalizedTimestamp, data, State.PTLState, StateType.PowerTaskList, previousTimestamp, State.StateFacade, gameSeed, this.resettingGame);
                    // Update entity names
                    powerDataHandler.Handle(normalizedTimestamp, data, State.PTLState);
                    // See comment in OptionsHandler
                    if (State.StateFacade.ShouldUpdateToRoot(data))
                    {
                        Logger.Log("Update to root", data);
                        State.StateFacade.UpdatePTLToRoot();
                    }
                    previousTimestamp = normalizedTimestamp;
                    State.StateFacade.LastProcessedPTLLine = data;
                    break;
                //case "GameState.SendOption":
                //	SendOptionHandler.Handle(timestamp, data, State);
                //	break;
                //case "GameState.OnEntityChoices":
                //	// Spectator mode noise
                //	break;
                case "ChoiceCardMgr.WaitThenShowChoices":
                    choicesHandler.Handle(normalizedTimestamp, data, State.GSState);
                    previousTimestamp = normalizedTimestamp;
                    break;
                case "PowerProcessor.EndCurrentTaskList":
                    powerProcessorHandler.Handle(normalizedTimestamp, data, State.GSState, StateType.PowerTaskList, State.StateFacade);
                    previousTimestamp = normalizedTimestamp;
                    break;
                //case "GameState.DebugPrintChoice":
                //	Console.WriteLine("Warning: DebugPrintChoice was removed in 10357. Ignoring.");
                //                break;
                default:
                    //if(!method.StartsWith("PowerTaskList.") && !method.StartsWith("PowerProcessor.") && !method.StartsWith("PowerSpellController"))
                    //	Console.WriteLine("Warning: Unhandled method: " + method);
                    break;
            }
        }

        private DateTime NormalizeTimestamp(string timestamp)
        {
            if (string.IsNullOrEmpty(timestamp))
            {
                return default;
            }

            try
            {
                // Use DateTime.ParseExact for faster parsing with a known format
                var logDateTime = DateTime.ParseExact(timestamp, "HH:mm:ss.fffffff", null);
                // Avoid unnecessary comparison if the timestamp is already valid
                return logDateTime < start ? logDateTime.AddDays(1) : logDateTime;
            }
            // Sometimes the logs contain some poorly-formatted timestamps (saw that once)
            catch (Exception e)
            {
                var logDateTime = DateTime.Parse(timestamp);
                // Avoid unnecessary comparison if the timestamp is already valid
                return logDateTime < start ? logDateTime.AddDays(1) : logDateTime;
            }

        }

        public long ExtractGameSeed(string[] lines)
        {
            bool isGameCreation = false;
            for (int i = 0; i < lines.Length; i++)
            {
                var line = lines[i];
                if (line.Contains("CREATE_GAME"))
                {
                    isGameCreation = true;
                }
                if (!line.Contains("GAME_SEED"))
                {
                    continue;
                }

                // Manual parsing instead of regex: "tag=GAME_SEED value=(\d+)"
                int valueIndex = line.IndexOf("tag=GAME_SEED value=");
                if (valueIndex >= 0)
                {
                    int valueStart = valueIndex + "tag=GAME_SEED value=".Length;
                    int valueEnd = valueStart;
                    // Find the end of the number (space, end of line, or non-digit)
                    while (valueEnd < line.Length && char.IsDigit(line[valueEnd]))
                    {
                        valueEnd++;
                    }
                    if (valueEnd > valueStart)
                    {
                        string seedValue = line.Substring(valueStart, valueEnd - valueStart);
                        Logger.Log($"Extracted seed", seedValue);
                        return long.Parse(seedValue);
                    }
                }
            }
            // Special status if this includes a CREATE_GAME log but doesn't have the game seed, because
            // this will cause issues when trying to spot a reconnect
            if (isGameCreation)
            {
                Logger.Log($"CREATE_GAME without seed", lines[lines.Length - 1]);
            }
            return isGameCreation ? -1 : 0;
        }
    }
}