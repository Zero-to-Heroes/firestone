namespace HackF5.UnitySpy.HearthstoneLib.MemoryUpdate
{
    using System;
    using System.Diagnostics;
    using System.Threading.Tasks;
    using System.Timers;
    using HackF5.UnitySpy.HearthstoneLib.Detail.MemoryUpdate;
    using HackF5.UnitySpy.HearthstoneLib.Detail.RewardTrack;

    public class MindVisionNotifier : IDisposable
    {
        private AchievementToastNotifier AchievementToastNotifier = new AchievementToastNotifier();
        private CurrentSceneNotifier CurrentSceneNotifier = new CurrentSceneNotifier();
        private XpChangeNotifier XpChangeNotifier = new XpChangeNotifier();
        private ArenaRewardsNotifier ArenaRewardsNotifier = new ArenaRewardsNotifier();
        private ArenaDraftNotifier ArenaDraftNotifier = new ArenaDraftNotifier();
        private ArenaCurrentCardsInDeckNotifier ArenaCurrentCardsInDeckNotifier = new ArenaCurrentCardsInDeckNotifier();
        private ArenaDraftScreenHiddenNotifier ArenaDraftScreenHiddenNotifier = new ArenaDraftScreenHiddenNotifier();
        // To avoid having to rely on short timings in friendly matches
        private SelectedDeckNotifier SelectedDeckNotifier = new SelectedDeckNotifier();
        private IsOpeningPackNotifier UnopenedPacksCountNotifier = new IsOpeningPackNotifier();
        private MercenariesPendingTreasureSelectionNotifier MercenariesPendingTreasureSelectionNotifier = new MercenariesPendingTreasureSelectionNotifier();
        private BattlegroundsNewRatingNotifier BattlegroundsNewRatingNotifier = new BattlegroundsNewRatingNotifier();
        private BattlegroundsSelectedGameModeNotifier BattlegroundsSelectedGameModeNotifier = new BattlegroundsSelectedGameModeNotifier();
        private FriendsListOpenedNotifier FriendsListOpenedNotifier = new FriendsListOpenedNotifier();
        private CollectionCardsCountNotifier CollectionCardsCountNotifier = new CollectionCardsCountNotifier();
        private AchievementCompletionNotifier AchievementCompletionNotifier = new AchievementCompletionNotifier();
        private CardMouseOverNotifier CardMouseOverNotifier = new CardMouseOverNotifier();
        private ChoiceManagerNotifier ChoiceManagerNotifier = new ChoiceManagerNotifier();

        private OpenedPackNotifier OpenedPackNotifier = new OpenedPackNotifier();
        private CollectionInitNotifier CollectionNotifier = new CollectionInitNotifier();

        private Timer timer;
        public MemoryUpdateResult previousResult;

        private int loop = 0;

        public void ListenForChanges(int frequency, MindVision mindVision, Action<object> callback)
        {
            Logger.Log("ListenForChanges");
            if (timer != null)
            {
                timer.Stop();
                timer.Dispose();
            }
            timer = new Timer();
            timer.Elapsed += delegate { OnTimedEvent(mindVision, callback); };
            timer.Interval = frequency;
            timer.Enabled = true;

        }

        public void StopListening()
        {
            Logger.Log("Stop Listening");
            if (timer != null)
            {
                timer.Stop();
                timer.Dispose();
            }
            else
            {
                Logger.Log("Timer was null");
            }
            timer = null;
        }

        public void Dispose()
        {
            StopListening();
        }

        private int isProcessing;

        public void OnTimedEvent(MindVision mindVision, Action<object> callback)
        {
            if (System.Threading.Interlocked.CompareExchange(ref isProcessing, 1, 0) != 0)
            {
                return;
            }

            Task.Run(() =>
            {
                try
                {
                    var startDate = DateTime.Now.Ticks;
                    MemoryUpdateResult result = new MemoryUpdateResult();

                    SceneModeEnum? currentScene = null;
                    currentScene = CurrentSceneNotifier.HandleSceneMode(mindVision, result); 
                    XpChangeNotifier.HandleXpChange(mindVision, result, currentScene);
                    UnopenedPacksCountNotifier.HandleIsOpeningPack(mindVision, result, currentScene);
                    AchievementCompletionNotifier.HandleAchievementsCompleted(mindVision, result, currentScene);
                    AchievementToastNotifier.HandleDisplayingAchievementToast(mindVision, result, currentScene);
                    SelectedDeckNotifier.HandleSelectedDeck(mindVision, result, currentScene);
                    BattlegroundsNewRatingNotifier.HandleSelection(mindVision, result, currentScene);
                    BattlegroundsSelectedGameModeNotifier.HandleSelection(mindVision, result, currentScene);
                    ArenaRewardsNotifier.HandleArenaRewards(mindVision, result, currentScene);
                    ArenaDraftNotifier.HandleStep(mindVision, result, currentScene);
                    ArenaDraftNotifier.HandleMode(mindVision, result, currentScene);
                    ArenaDraftNotifier.HandleHeroes(mindVision, result, currentScene);
                    ArenaDraftNotifier.HandleHeroPowers(mindVision, result, currentScene);
                    ArenaDraftNotifier.HandleCards(mindVision, result, currentScene);
                    ArenaDraftNotifier.HandlePackageCards(mindVision, result, currentScene);
                    ArenaDraftNotifier.HandleGameMode(mindVision, result, currentScene);
                    ArenaDraftNotifier.HandleCardPick(mindVision, result, currentScene);
                    ArenaDraftNotifier.HandleClientState(mindVision, result, currentScene);
                    ArenaDraftNotifier.HandleSessionState(mindVision, result, currentScene);
                    ArenaDraftScreenHiddenNotifier.HandleDraftScreenHidden(mindVision, result, currentScene);
                    ArenaCurrentCardsInDeckNotifier.HandleSelection(mindVision, result, currentScene);
                    MercenariesPendingTreasureSelectionNotifier.HandleSelection(mindVision, result, currentScene);
                    CollectionNotifier.HandleCollectionInit(mindVision, result, currentScene);
                    CollectionCardsCountNotifier.HandleCollectionCardsCount(mindVision, result, currentScene);
                    CollectionCardsCountNotifier.HandleBoostersCount(mindVision, result, currentScene);
                    CollectionCardsCountNotifier.HandleCollectionCardBacksCount(mindVision, result, currentScene);
                    CollectionCardsCountNotifier.HandleCollectionBattlegroundsHeroSkinsCount(mindVision, result, currentScene);
                    CollectionCardsCountNotifier.HandleCollectionCoinsCount(mindVision, result, currentScene);
                    FriendsListOpenedNotifier.HandleSelection(mindVision, result, currentScene);
                    CardMouseOverNotifier.HandleMouseOver(mindVision, result, currentScene);
                    ChoiceManagerNotifier.HandleChoicesHidden(mindVision, result, currentScene);

                    result.TotalTimeElapsed = (long)(new TimeSpan(DateTime.Now.Ticks - startDate)).TotalMilliseconds;

                    if (result.HasUpdates)
                    {
                        callback(result);
                    }
                }
                catch (Exception e)
                {
                    Logger.Log("Exception in MindVisionNotifier memory read " + e.Message + " " + e.StackTrace);
                    callback(e.Message);
                    callback(e.StackTrace);
                    callback("reset");
                }
                finally
                {
                    System.Threading.Interlocked.Exchange(ref isProcessing, 0);
                }
            });
        }

        public MemoryUpdateResult GetMemoryChanges(MindVision mindVision)
        {
            MemoryUpdateResult result = new MemoryUpdateResult();
            OpenedPackNotifier.HandleOpenedPack(mindVision, result);
            CollectionNotifier.HandleNewCards(mindVision, result);
            if (result.HasUpdates)
            {
                return result;
            }

            return null;
        }
    }
}