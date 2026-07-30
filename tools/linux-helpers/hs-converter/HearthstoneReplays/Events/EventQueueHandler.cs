#region
using System;
using System.Timers;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using HearthstoneReplays.Parser;
using HearthstoneReplays.Events.Parsers;
using System.Diagnostics;
using System.Linq.Expressions;
#endregion

namespace HearthstoneReplays.Events
{
    public class EventQueueHandler
    {
        public List<GameEventProvider> eventQueue;
        private Timer timer;

        private bool waitingForMetaData;

        private readonly Object listLock = new object();
        private StateFacade Helper;

        public EventQueueHandler(StateFacade helper)
        {
            Helper = helper;
            eventQueue = new List<GameEventProvider>();
            timer = new Timer(100);
            timer.Elapsed += ProcessGameEventQueue;
            timer.AutoReset = true;
            timer.Enabled = true;
        }

        public void Reset(StateFacade helper)
        {
            this.Helper = helper;
        }

        public void EnqueueGameEvent(List<GameEventProvider> providers)
        {
            //Logger.Log("Enqueuing game event", "");
            if (providers == null || providers.Count == 0)
            {
                return;
            }

            providers = providers.Where(provider => provider != null).ToList();

            lock (listLock)
            {
                // Remove outstanding events
                if (providers.Any(provider => (provider.CreationLogLine?.Contains("CREATE_GAME")) ?? false) && eventQueue.Count > 0)
                {
                    ClearQueue();
                }

                // Remove duplicate events
                // As we process the queue when the animation is ready, we should not have a race condition 
                // here, but it's still risky (vs preventing the insertion if a future event is a duplicate, but 
                // which requires a lot of reengineering of the loop)
                if (eventQueue != null && eventQueue.Count > 0)
                {
                    var shouldUnqueuePredicates = providers
                        .Where(provider => provider.isDuplicatePredicate != null)
                        .Select(provider => provider.isDuplicatePredicate)
                        .ToList();

                    if (shouldUnqueuePredicates.Count > 0)
                    {
                        eventQueue = eventQueue
                            .Where(queued => queued != null && !shouldUnqueuePredicates.Any(predicate => predicate(queued)))
                            .ToList();
                    }
                }

                eventQueue.AddRange(providers);
                eventQueue.Sort((a, b) =>
                {
                    int timestampComparison = a.Timestamp.CompareTo(b.Timestamp);
                    return timestampComparison != 0 ? timestampComparison : a.Index.CompareTo(b.Index);
                });
            }
        }

        public void ClearQueue()
        {
            // Logger.Log("Clearing queue", "");
            lock (listLock)
            {
                //Logger.Log("Acquierd list lock in clearqueue", "");
                // We process all pending events. It can happen (typically with the Hearthstone spell) that 
                // not all events receive their animation log, so we do it just to be sure there aren't any 
                // left overs
                eventQueue.ForEach(provider => ProcessGameEvent(provider));
                eventQueue.Clear();
            }
        }

        private bool processing;
        private void ProcessGameEventQueue(Object source, ElapsedEventArgs e)
        {
            _ = Task.Run(async () =>
            {
                if (processing)
                {
                    return;
                }

                while (IsEventToProcess())
                {
                    processing = true;
                    //Logger.Log("[csharp] Event to process", "");
                    GameEventProvider provider = null;

                    try
                    {
                        lock (listLock)
                        {
                            if (eventQueue.Count == 0)
                            {
                                //Logger.Log("No event", "");
                                processing = false;
                                return;
                            }

                            if (waitingForMetaData)
                            {
                                Logger.Log("Waiting for metadata", "");
                                processing = false;
                                return;
                            }

                            provider = eventQueue[0];
                            eventQueue.RemoveAt(0);
                        }
                        if (provider.NeedMetaData)
                        {
                            waitingForMetaData = true;
                            // Wait until we have all the necessary data
                            while (!Helper.HasMetaData())
                            {
                                Logger.Log($"Awaiting metadata {Helper.GsState.CurrentGame.FormatType}, {Helper.GsState.CurrentGame.GameType}," +
                                    $"{Helper.LocalPlayer}", provider.EventName);
                                await Task.Delay(100);
                            }
                            waitingForMetaData = false;
                        }
                        if (provider.WaitFor != 0)
                        {
                            await Task.Delay(provider.WaitFor);
                        }

                        lock (listLock)
                        {
                            ProcessGameEvent(provider);
                        }
                    }
                    catch (Exception ex)
                    {
                        Logger.Log("Exception while parsing event " + provider?.EventName, provider?.CreationLogLine);
                        Logger.Log("Exception while parsing event queue " + ex.Message, ex.StackTrace);
                        processing = false;
                        return;
                    }
                }
                processing = false;
            });
        }

        private void ProcessGameEvent(GameEventProvider provider)
        {
            if (provider.SupplyGameEvent == null && provider.GameEvent == null)
            {
                //Logger.Log("No game event", "");
                return;
            }
            var gameEvent = provider.GameEvent != null ? provider.GameEvent : provider.SupplyGameEvent();
            // This can happen because there are some conditions that are only resolved when we 
            // have the full meta data, like dungeon run step
            if (gameEvent != null)
            {
                gameEvent.Debug = new GameEventDebug()
                {
                    CreationLogLine = provider.CreationLogLine,
                    Timestamp = provider.Timestamp,
                    Index = provider.Index,
                };
                //Logger.Log("Handling game event", gameEvent.Type);
                GameEventHandler.Handle(gameEvent, false);
            }
        }

        private bool IsEventToProcess()
        {
            try
            {
                var isEvent = false;
                lock (listLock)
                {
                    // We leave some time so that events parsed later can be processed sooner (typiecally the case 
                    // for end-of-block events vs start-of-block events, like tag changes)
                    // Update: the 100ms ticks should be enough to play this role
                    isEvent = eventQueue.Count > 0;
                }
                //Logger.Log("Is event to process? " + isEvent + " // " + eventQueue.Count, 
                //    eventQueue.Count > 0 ? "" + DateTime.Now.Subtract(eventQueue.First().Timestamp).TotalMilliseconds : "");
                return isEvent;
            }
            catch (Exception ex)
            {
                Logger.Log(ex.StackTrace, "" + eventQueue.Count);
                Logger.Log("Exception while trying to determine event to process", ex.Message);
                return false;
            }
        }
    }
}