#region
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Events;
using HearthstoneReplays.Parser.ReplayData.Entities;
using HearthstoneReplays.Parser.ReplayData.GameActions;
#endregion

namespace HearthstoneReplays.Parser.ReplayData.Entities
{
    public class GameState
    {
        public ParserState ParserState;

        public Dictionary<int, FullEntity> CurrentEntities = new Dictionary<int, FullEntity>();
        public Dictionary<string, int> EntityNames = new Dictionary<string, int>();
        public int CurrentTurn = 0;
        public GameMetaData MetaData;
        // Because for BGS the first opponent player id is set as a tag of the player, instead 
        // of a tag change. At the time it is revealed, we don't have the opponent's entity yet
        // so we can't emit the event
        public int NextBgsOpponentPlayerId;
        public bool BattleResultSent;
        //public bool SimulationTriggered;
        public int LastCardPlayedEntityId;
        public int LastCardDrawnEntityId;
        // Most recent card is last, and grouped by turn
        public Dictionary<int, Dictionary<int, List<int>>> CardsPlayedByPlayerEntityIdByTurn = new Dictionary<int, Dictionary<int, List<int>>>();
        //public Dictionary<int, List<Tuple<DateTime, int>>> CardsPlayedByPlayerEntityIdByTimestamp = new Dictionary<int, List<Tuple<DateTime, int>>>();
        public Dictionary<int, List<int>> SpellsPlayedByPlayerOnFriendlyEntityIds = new Dictionary<int, List<int>>();
        public string BgsCurrentBattleOpponent;
        public int BgsCurrentBattleOpponentPlayerId;
        public bool BgsHasSentNextOpponent;

        public Dictionary<int, List<FullEntity>> EntityIdsOnBoardWhenPlayingPotionOfIllusion = null;

        private int gameEntityId;
        private Dictionary<int, int> controllerEntity = new Dictionary<int, int>();

        public void Reset(ParserState state)
        {
            ParserState = state;
            CurrentEntities = new Dictionary<int, FullEntity>();
            EntityNames = new Dictionary<string, int>();
            CurrentTurn = 0;
            MetaData = null;
            NextBgsOpponentPlayerId = -1;
            BattleResultSent = false;
            LastCardPlayedEntityId = -1;
            // Stored by turn as well
            CardsPlayedByPlayerEntityIdByTurn = new Dictionary<int, Dictionary<int, List<int>>>();
            SpellsPlayedByPlayerOnFriendlyEntityIds = new Dictionary<int, List<int>>();
            LastCardDrawnEntityId = -1;
            BgsCurrentBattleOpponent = null;
            BgsCurrentBattleOpponentPlayerId = 0;
            BgsHasSentNextOpponent = false;
            EntityIdsOnBoardWhenPlayingPotionOfIllusion = null;
            gameEntityId = -1;
            controllerEntity = new Dictionary<int, int>();
        }

        //public void StartTurn()
        //{
        //    if (CurrentTurn % 2 == 1)
        //    {
        //        BgCombatStarted = false;
        //    }
        //}

        public void GameEntity(GameEntity entity)
        {
            if (CurrentEntities.ContainsKey(entity.Id))
            {
                if (!this.ParserState.ReconnectionOngoing)
                {
                    Logger.Log("error while parsing GameEntity, playerEntity already present in memory", "" + entity.Id);
                }
                return;
            }
            var newTags = new List<Tag>();
            var fullEntity = new FullEntity { Id = entity.Id, Tags = newTags, TimeStamp = entity.TimeStamp };
            CurrentEntities.Add(entity.Id, fullEntity);
            gameEntityId = entity.Id;
        }

        public FullEntity GetGameEntity()
        {

            return CurrentEntities.GetValueOrDefault(gameEntityId);
        }

        public void UpdateEntityName(string rawEntity)
        {
            var match = Regexes.EntityWithNameAndId.Match(rawEntity);
            if (match.Success)
            {
                var entityName = match.Groups[1].Value;
                var entityId = match.Groups[2].Value;
                //Console.WriteLine("Adding entity mapping " + entityName + " " + entityId);
                EntityNames[entityName] = int.Parse(entityId);
            }
        }

        public GameStateReport BuildGameStateReport(StateFacade helper)
        {
            // Cna happen when joining a BG game as spectate
            if (helper.LocalPlayer == null)
            {
                return null;
            }
            return new GameStateReport
            {
                LocalPlayer = PlayerReport.BuildPlayerReport(this, helper.LocalPlayer.Id),
                OpponentReport = PlayerReport.BuildPlayerReport(this, helper.OpponentPlayer.Id),
            };
        }

        public void PlayerEntity(PlayerEntity entity)
        {
            if (CurrentEntities.ContainsKey(entity.Id))
            {
                if (!this.ParserState.ReconnectionOngoing)
                {
                    Logger.Log("error while parsing, playerEntity already present in memory", "" + entity.Id);
                }
                return;
            }
            var newTags = new List<Tag>();
            foreach (var oldTag in entity.Tags)
            {
                newTags.Add(new Tag { Name = oldTag.Name, Value = oldTag.Value });
            }
            var fullEntity = new FullEntity { Id = entity.Id, Tags = newTags, TimeStamp = entity.TimeStamp };
            CurrentEntities.Add(entity.Id, fullEntity);
            controllerEntity.Add(entity.PlayerId, entity.Id);
        }

        public FullEntity GetController(int controllerId)
        {
            return CurrentEntities.GetValueOrDefault(controllerEntity[controllerId]);
        }

        public void FullEntity(FullEntity entity, bool updating, string initialLog = null)
        {
            var debug = entity.Entity == 127;
            if (updating)
            {
                // This actually happens in a normal scenario, so we just ignore it
                return;
            }

            //if (this.ParserState.StateType == StateType.PowerTaskList)
            //{
            //    Logger.Log($"Adding FullEntity {entity.CardId}, zone={entity.GetZone()}", "");
            //}

            var newTags = entity.GetTagsCopy();
            // We need to do a copy because this otherwise we could mutate the entity from the log parser
            // This would mean that when a TagChange event occurs in the log, we also mutate the data inside the Game.Data
            // That data is supposed to be a snapshot of the current log lines, and should be immutable
            var fullEntity =
                // when reconnecting, we sometimes get udpated information on the FullEntity
                new FullEntity
                {
                    // Do that the other way around - first get the value from the incoming Entity
                    // Otherwise, when handling Rewinds, where the same entity ID gets reassigned, we run into issues
                    CardId = entity.CardId != null && entity.CardId.Length > 0 ? entity.CardId : CurrentEntities.GetValueOrDefault(entity.Id)?.CardId,
                    Id = entity.Id > 0 ? entity.Id : CurrentEntities.GetValueOrDefault(entity.Id)?.Id ?? entity.Id,
                    TimeStamp = entity.TimeStamp
                };
            fullEntity.Tags = newTags;
            fullEntity.TagsHistory = newTags?.Select(tag => new Tag() { Name = tag.Name, Value = tag.Value, }).ToList();
            if (CurrentEntities.ContainsKey(entity.Id))
            {
                CurrentEntities.Remove(entity.Id);
            }
            CurrentEntities.Add(entity.Id, fullEntity);

            //if (this.ParserState.StateType == StateType.PowerTaskList)
            //{
            //    Logger.Log($"After Adding FullEntity {entity.CardId}, zone={entity.GetZone()}", "");
            //}
        }

        public void ShowEntity(ShowEntity entity)
        {
            var debug = entity.Entity == 48;
            if (!CurrentEntities.ContainsKey(entity.Entity))
            {
                Logger.Log("error while parsing, showentity doesn't have an entity in memory yet", "" + entity.Entity);
                return;
            }

            //if (this.ParserState.StateType == StateType.PowerTaskList)
            //{
            //    Logger.Log($"Adding show Entity {entity.CardId}, existingZone={CurrentEntities[entity.Entity].GetZone()}", "");
            //}
            CurrentEntities[entity.Entity].CardId = entity.CardId;
            // Preseve the history
            CurrentEntities[entity.Entity].TagsHistory.Add(new Tag() { Name = (int)GameTag.SHOW_ENTITY_START, Value = 1, });
            CurrentEntities[entity.Entity].TagsHistory
                .AddRange(entity.Tags?.Select(tag => new Tag() { Name = tag.Name, Value = tag.Value, }).ToList());
            CurrentEntities[entity.Entity].TagsHistory.Add(new Tag() { Name = (int)GameTag.SHOW_ENTITY_END, Value = 1, });
            List<int> newTagIds = entity.Tags.Select(tag => tag.Name).ToList();
            List<Tag> oldTagsToKeep = CurrentEntities[entity.Entity].Tags
                .Where(tag => !newTagIds.Contains(tag.Name))
                .Select(tag => new Tag { Name = tag.Name, Value = tag.Value })
                .ToList();
            var newTags = new List<Tag>();
            foreach (var oldTag in entity.Tags)
            {
                newTags.Add(new Tag { Name = oldTag.Name, Value = oldTag.Value });
            }
            oldTagsToKeep.AddRange(newTags);
            CurrentEntities[entity.Entity].Tags = oldTagsToKeep;
            //if (this.ParserState.StateType == StateType.PowerTaskList)
            //{
            //    Logger.Log($"After adding show Entity {entity.CardId}, existingZone={CurrentEntities[entity.Entity].GetZone()}", "");
            //}
        }

        public string GetCardIdForEntity(int id)
        {
            var entity = CurrentEntities.GetValueOrDefault(id);
            if (entity == null)
            {
                return null;
            }

            if (entity.CardId != null)
            {
                return entity.CardId;
            }
            var test = CurrentEntities.Values
                .Where((e) => e.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO)
                .Where((e) => e.GetTag(GameTag.ZONE) == (int)Zone.PLAY)
                .ToList();
            return CurrentEntities.Values
                .Where((e) => e.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO)
                .Where((e) => e.GetTag(GameTag.ZONE) == (int)Zone.PLAY)
                .Where((e) => e.GetEffectiveController() == entity.GetEffectiveController())
                .First()
                .CardId;
        }

        public FullEntity GetPlayerHeroEntity(int entityId)
        {
            var entity = CurrentEntities.GetValueOrDefault(entityId);
            if (entity == null)
            {
                return null;
            }

            // No cardID is assigned to the player in Mercenaries, since there is no hero
            if (ParserState.IsMercenaries())
            {
                return entity;
            }

            if (entity.CardId != null)
            {
                return entity;
            }
            var heroesForController = CurrentEntities.Values
                .Where((e) => e.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO)
                .Where((e) => e.GetEffectiveController() == entity.GetEffectiveController())
                .Where((e) => e.GetTag(GameTag.ZONE) == (int)Zone.PLAY)
                // If there are several, we take the most recent one
                .OrderByDescending((e) => e.TimeStamp)
                .ToList();
            // Happens if the remaining hero is dead for instance
            if (heroesForController.Count() == 0)
            {
                heroesForController = CurrentEntities.Values
                .Where((e) => e.GetTag(GameTag.CARDTYPE) == (int)CardType.HERO)
                .Where((e) => e.GetEffectiveController() == entity.GetEffectiveController())
                // If there are several, we take the oldest one (as the most recent can be a hero card in hand)
                .OrderBy((e) => e.TimeStamp)
                .ToList();
            }
            return heroesForController.First();
        }

        public void ChangeEntity(ChangeEntity entity)
        {
            var debug = entity.Entity == 127;
            if (!CurrentEntities.ContainsKey(entity.Entity))
            {
                Logger.Log("error while parsing, changeEntity doesn't have an entity in memory yet", "" + entity.Entity);
                return;
            }

            //if (this.ParserState.StateType == StateType.PowerTaskList)
            //{
            //    Logger.Log($"ChangeEntity {entity.CardId}, existingZone={CurrentEntities[entity.Entity].GetZone()}", "");
            //}
            CurrentEntities[entity.Entity].CardId = entity.CardId;
            List<int> newTagIds = entity.Tags.Select(tag => tag.Name).ToList();
            List<Tag> oldTagsToKeep = CurrentEntities[entity.Entity].Tags
                .Where(tag => !newTagIds.Contains(tag.Name))
                .Select(tag => new Tag { Name = tag.Name, Value = tag.Value })
                .ToList();
            var newTags = new List<Tag>();
            foreach (var oldTag in entity.Tags)
            {
                newTags.Add(new Tag { Name = oldTag.Name, Value = oldTag.Value });
            }
            oldTagsToKeep.AddRange(newTags);
            CurrentEntities[entity.Entity].Tags = oldTagsToKeep;
            //if (this.ParserState.StateType == StateType.PowerTaskList)
            //{
            //    Logger.Log($"After ChangeEntity {entity.CardId}, existingZone={CurrentEntities[entity.Entity].GetZone()}", "");
            //}
        }
        public void TagChange(TagChange tagChange, string defChange)
        {
            if (!CurrentEntities.TryGetValue(tagChange.Entity, out var fullEntity))
            {
                return;
            }

            var newTags = fullEntity.GetTagsCopy();
            var existingTag = newTags.FirstOrDefault(tag => tag.Name == tagChange.Name);

            if (existingTag == null)
            {
                newTags.Add(new Tag { Name = tagChange.Name, Value = tagChange.Value });
            }
            else
            {
                existingTag.Value = tagChange.Value;
            }

            // Update tags and history
            fullEntity.Tags = newTags;
            fullEntity.TagsHistory.Add(new Tag { Name = tagChange.Name, Value = tagChange.Value });

            // Keep a history of previous tags
            if (existingTag != null)
            {
                fullEntity.AllPreviousTags.Add(new Tag { Name = existingTag.Name, Value = existingTag.Value });
            }
        }

        // Should only be used for ChangeEntity, and probably even this will be removed later on
        public void Tag(Tag tag, int entityId)
        {
            if (!CurrentEntities.ContainsKey(entityId))
            {
                Logger.Log("error while parsing, tag doesn't have an entity in memory yet", "" + entityId);
                return;
            }

            //if (tag.Name == (int)GameTag.ZONE)
            //{
            //    if (this.ParserState.StateType == StateType.PowerTaskList)
            //    {
            //        Logger.Log($"Zone TAG, cardId={CurrentEntities[entityId].CardId}, " +
            //        $"newZone={tag.Value}, " +
            //        $"existingZone={CurrentEntities[entityId].Tags.Find((t) => tag.Name == t.Name)?.Value}", "");
            //    }
            //}
            var existingTag = CurrentEntities[entityId].Tags.Find((t) => tag.Name == t.Name);
            if (existingTag == null)
            {
                existingTag = new Tag { Name = tag.Name };
                CurrentEntities[entityId].Tags.Add(existingTag);
            }
            existingTag.Value = tag.Value;
        }

        public int PlayerIdFromEntityName(string data)
        {
            int entityId;
            EntityNames.TryGetValue(data, out entityId);
            if (entityId != 0)
            {
                // Now find the player this entity is attached to
                int playerId = CurrentEntities.Values
                    .Where(e => e.Tags.Find(x => (x.Name == (int)GameTag.HERO_ENTITY && x.Value == entityId)) != null)
                    .Select(e => e.Id)
                    .FirstOrDefault();
                if (playerId == 0)
                {
                    var entity = CurrentEntities.Values.Where(x => x.Id == entityId).FirstOrDefault();
                    var entityControllerId = entity.GetEffectiveController();
                    //Console.WriteLine("Controller ID = " + entityControllerId);
                    playerId = ParserState.getPlayers().Find(x => x.PlayerId == entityControllerId).Id;
                }
                return playerId;
            }
            return 0;
        }

        public int GetActivePlayerId()
        {
            var activePlayer = CurrentEntities.Values
                    .Where(e => e.Tags.Find(x => (x.Name == (int)GameTag.CURRENT_PLAYER && x.Value == 1)) != null)
                    .FirstOrDefault();
            var activePlayerEntityId = activePlayer?.Id;
            foreach (var data in ParserState.CurrentGame.Data)
            {
                if (data.GetType() == typeof(PlayerEntity))
                {
                    var playerEntity = (PlayerEntity)data;
                    if (playerEntity?.Id == activePlayerEntityId)
                    {
                        return playerEntity.PlayerId;
                    }
                }
            }
            return -1;
            //var activePlayerEntity = ParserState.CurrentGame.FilterGameData(typeof(PlayerEntity))
            //    .Select(player => (PlayerEntity)player)
            //    .FirstOrDefault(player => player.Id == activePlayerEntityId);
            //return activePlayerEntity?.PlayerId ?? -1;
        }

        public void OnCardPlayed(int entityId, int? targetEntityId = null, FullEntity fullEntity = null)
        {
            LastCardPlayedEntityId = entityId;
            if (CurrentEntities.ContainsKey(entityId))
            {
                // Avoid concurrent modifications
                var currentEntitiesCopy = new List<FullEntity>(CurrentEntities.Values);

                // Add it to each owner
                var playedEntity = fullEntity ?? CurrentEntities[entityId];

                // Populate the list of each card played by each player, for each turn
                var cardsForPlayerByTurn = !CardsPlayedByPlayerEntityIdByTurn.ContainsKey(playedEntity.GetController())
                    ? null
                    : CardsPlayedByPlayerEntityIdByTurn[playedEntity.GetController()];
                if (cardsForPlayerByTurn == null)
                {
                    cardsForPlayerByTurn = new Dictionary<int, List<int>>();
                    CardsPlayedByPlayerEntityIdByTurn[playedEntity.GetController()] = cardsForPlayerByTurn;
                }
                var currentTurn = GetGameEntity().GetTag(GameTag.TURN);
                var cardsForTurn = !cardsForPlayerByTurn.ContainsKey(currentTurn) ? null : cardsForPlayerByTurn[currentTurn];
                if (cardsForTurn == null)
                {
                    cardsForTurn = new List<int>();
                    cardsForPlayerByTurn[currentTurn] = cardsForTurn;
                }
                cardsForTurn.Add(entityId);

                // Build the list of cards played, for each player, by timestamp
                //var cardsForPlayerByTimestamp = !CardsPlayedByPlayerEntityIdByTimestamp.ContainsKey(playedEntity.GetController()) 
                //    ? null 
                //    : CardsPlayedByPlayerEntityIdByTimestamp[playedEntity.GetController()];
                //if (cardsForPlayerByTimestamp == null)
                //{
                //    cardsForPlayerByTimestamp = new List<Tuple<DateTime, int>>();
                //    CardsPlayedByPlayerEntityIdByTimestamp[playedEntity.GetController()] = cardsForPlayerByTimestamp;
                //}
                //cardsForPlayerByTimestamp.Add(new Tuple<DateTime, int>(timestamp, entityId));

                // For each card in the player's hand, add a note that the entity has been played while it was in hand
                // For now, used only for Commander Sivara
                var cardsInHandForController = currentEntitiesCopy
                    .Where(e => e.GetZone() == (int)Zone.HAND)
                    .Where(e => e.GetController() == playedEntity.GetController())
                    .ToList();
                foreach (var cardInHand in cardsInHandForController)
                {
                    cardInHand.PlayedWhileInHand.Add(playedEntity.Entity);
                }

                // Plagiarize
                var plagiarizes = currentEntitiesCopy
                    //.Where(e => e.CardId == CardIds.Collectible.Rogue.Plagiarize) // We don't know it's plagiarize, so add it to all secrets
                    .Where(e => e.GetTag(GameTag.ZONE) == (int)Zone.SECRET)
                    .ToList();
                // Was countered
                if (plagiarizes.Count > 0 && playedEntity.GetTag(GameTag.CANT_PLAY) != 1)
                {
                    plagiarizes.ForEach(plagia => plagia.KnownEntityIds.Add(entityId));
                }

                // Potion of Illusion
                if (playedEntity.CardId == CardIds.PotionOfIllusion)
                {
                    this.EntityIdsOnBoardWhenPlayingPotionOfIllusion = currentEntitiesCopy
                        .Where(entity => (entity.GetTag(GameTag.ZONE) == (int)Zone.PLAY))
                        .Where(entity => entity.GetTag(GameTag.CARDTYPE) == (int)CardType.MINION)
                        .OrderBy(entity => entity.GetTag(GameTag.ZONE_POSITION))
                        .GroupBy(entity => entity.GetEffectiveController())
                        .ToDictionary(g => g.Key, g => g.ToList());
                }
                else
                {
                    this.EntityIdsOnBoardWhenPlayingPotionOfIllusion = null;
                }

                // Lady Liadrin
                // The spells are created in random order, so we can't flag them
                //if (playedEntity.GetCardType() == (int)CardType.SPELL)
                //{
                //    if (targetEntityId != null && CurrentEntities.ContainsKey((int)targetEntityId))
                //    {
                //        var targetEntity = CurrentEntities[(int)targetEntityId];
                //        var playedControllerId = playedEntity.GetController();
                //        var targetControllerId = targetEntity.GetController();
                //        if (playedControllerId == targetControllerId)
                //        {
                //            var spellsPlayedOnMinions = !SpellsPlayedByPlayerOnFriendlyEntityIds.ContainsKey(playedControllerId) 
                //                ? null 
                //                : SpellsPlayedByPlayerOnFriendlyEntityIds[playedControllerId];
                //            if (spellsPlayedOnMinions == null)
                //            {
                //                spellsPlayedOnMinions = new List<int>();
                //                SpellsPlayedByPlayerOnFriendlyEntityIds[playedControllerId] = spellsPlayedOnMinions;
                //            }
                //            spellsPlayedOnMinions.Add(entityId);
                //        }
                //    }
                //}
                //if (playedEntity.CardId == CardIds.Collectible.Paladin.LadyLiadrin)
                //{
                //    playedEntity.KnownEntityIds = SpellsPlayedByPlayerOnFriendlyEntityIds[playedEntity.GetController()];
                //}

            }
        }

        public void OnCardDrawn(int entityId)
        {
            LastCardDrawnEntityId = entityId;
        }

        public void OnCardDiscarded(int discardedEntityId, string discardedCardId, FullEntity source)
        {
            if (source == null)
            {
                return;
            }

            switch (source.CardId)
            {
                case CardIds.ExpiredMerchant:
                case CardIds.FelsoulJailer:
                case CardIds.FelsoulJailerLegacy:
                case CardIds.AmorphousSlime:
                    source.CardIdsToCreate.Add(discardedCardId);
                    break;
            }
        }

        public void OnNewTurn()
        {
            if (CurrentTurn % 2 == 1)
            {
                BgsCurrentBattleOpponent = null;
                BgsCurrentBattleOpponentPlayerId = 0;
            }
        }

        public void ClearPlagiarize()
        {
            // If there are secrets that work over several turns, this won't work
            var plagiarizes = CurrentEntities.Values
                    //.Where(e => e.CardId == CardIds.Collectible.Rogue.Plagiarize)
                    .Where(e => e.GetTag(GameTag.ZONE) == (int)Zone.SECRET)
                    .ToList();
            plagiarizes.ForEach(plagia => plagia.KnownEntityIds.Clear());
        }

        internal List<FullEntity> FindEnchantmentsAttachedTo(int entity)
        {
            if (!CurrentEntities.ContainsKey(entity))
            {
                return new List<FullEntity>();
            }
            return CurrentEntities.Values.Where(e => e.GetTag(GameTag.ATTACHED) == entity).ToList();
        }

    }
}