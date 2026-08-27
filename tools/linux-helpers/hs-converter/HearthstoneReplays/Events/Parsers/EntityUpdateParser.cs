using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;

namespace HearthstoneReplays.Events.Parsers
{
    public class EntityUpdateParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public EntityUpdateParser(ParserState ParserState, StateFacade facade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = facade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return false;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return stateType == StateType.PowerTaskList
                && node.Type == typeof(ShowEntity);
                // We need this so that cards that were unknown in the opponent's hand can be assigned
                // their info
                //&& !MindrenderIlluciaParser.IsProcessingMindrenderIlluciaEffect(node, GameState);
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        // Typically the case when the opponent plays a quest or a secret
        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            var showEntity = node.Object as ShowEntity;
            // Cards here are just created to show the info, then put aside. We don't want to 
            // show them in the "Other" zone, so we just ignore them
            if (showEntity.SubSpellInEffect?.Prefab == "DMFFX_SpawnToDeck_CthunTheShattered_CardFromScript_FX")
            {
                return null;
            }

            // CArds transformed by Oh My Yogg are instead reemitted as new card played
            if (showEntity.GetTag(GameTag.LAST_AFFECTED_BY) != -1 
                && GameState.CurrentEntities.ContainsKey(showEntity.GetTag(GameTag.LAST_AFFECTED_BY))
                && GameState.CurrentEntities[showEntity.GetTag(GameTag.LAST_AFFECTED_BY)].CardId == CardIds.OhMyYogg)
            {
                return null;
            }

            var cardId = showEntity.CardId;
            // Because Encumbered Pack Mule reveals itself if drawn during mulligan, we need to 
            // have a special rule
            var isBeforeMulligan = GameState.GetGameEntity().GetTag(GameTag.NEXT_STEP) == -1;
            if (isBeforeMulligan && cardId == CardIds.EncumberedPackMule && showEntity.GetEffectiveController() != StateFacade.LocalPlayer.PlayerId)
            {
                cardId = "";
            }
            if (showEntity.IsImmolateDiscard() && showEntity.GetEffectiveController() != StateFacade.LocalPlayer.PlayerId)
            {
                cardId = "";
            }
            // Info leak
            if (node.Parent?.Object is Action)
            {
                var parentAction = node.Parent.Object as Action;
                var parentEntity = GameState.CurrentEntities.GetValueOrDefault(parentAction.Entity);
                if (parentEntity?.CardId == CardIds.Kiljaeden_KiljaedensPortalEnchantment_GDB_145e)
                {
                    cardId = "";
                }
            }

            var controllerId = showEntity.GetEffectiveController();
            //var gameState = GameEvent.BuildGameState(ParserState, StateFacade, GameState, null, showEntity);
            var mercXp = showEntity.GetTag(GameTag.LETTUCE_MERCENARY_EXPERIENCE);
            var mercEquipmentId = showEntity.GetTag(GameTag.LETTUCE_EQUIPMENT_ID);
            var abilityOwner = showEntity.GetTag(GameTag.LETTUCE_ABILITY_OWNER);
            var abilityCooldownConfig = showEntity.GetTag(GameTag.LETTUCE_COOLDOWN_CONFIG);
            var abilityCurrentCooldown = showEntity.GetTag(GameTag.LETTUCE_CURRENT_COOLDOWN);
            var abilitySpeed = showEntity.GetTag(GameTag.COST);
            var zonePosition = showEntity.GetZonePosition();
            var dataNum1 = showEntity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1);
            var dataNum2 = showEntity.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_2);
            var eventName = showEntity.GetTag(GameTag.ZONE) == (int)Zone.LETTUCE_ABILITY
                ? showEntity.GetTag(GameTag.LETTUCE_IS_EQUPIMENT) == 1
                    ? "MERCENARIES_EQUIPMENT_UPDATE"
                    : "MERCENARIES_ABILITY_UPDATE"
                : "ENTITY_UPDATE";
            var zone = showEntity.GetZone();
            // When a card is played, the ShowEntity is inside a PLAY block with ZONE=PLAY. Playing a card
            // inherently reveals it to the opponent (e.g. Dryscale Deputy spell copy). The REVEALED tag may
            // not be set, so we treat PLAY block + ZONE=PLAY as revealed.
            var blockAction = node.Parent?.Object as Action;
            // The logs have very clear info leaks: SHOW_ENTITY blocks with REVEALED=1 and ZONE=HAND for START_OF_GAME cards
            // so we want to forcefully hide them, even if we risk not revealing something that should be revealed
            var revealed = (showEntity.GetTag(GameTag.REVEALED) == 1 && showEntity.GetTag(GameTag.START_OF_GAME_KEYWORD) != 1)
                || (blockAction != null && blockAction.Type == (int)BlockType.PLAY && zone == (int)Zone.PLAY);
            if (zone == -1)
            {
                zone = GameState.CurrentEntities.GetValueOrDefault(showEntity.Entity)?.GetZone() ?? -1;
            }
            return new List<GameEventProvider> { GameEventProvider.Create(
                showEntity.TimeStamp,
                eventName,
                GameEvent.CreateProvider(
                    eventName,
                    cardId,
                    controllerId,
                    showEntity.Entity,
                    StateFacade,
                    //gameState,
                    new {
                        MercenariesExperience = mercXp,
                        MercenariesEquipmentId = mercEquipmentId,
                        AbilityOwnerEntityId = abilityOwner,
                        AbilityCooldownConfig = abilityCooldownConfig == -1 ? (int?)null : abilityCooldownConfig,
                        AbilityCurrentCooldown = abilityCurrentCooldown == -1 ? (int?)null : abilityCurrentCooldown,
                        AbilitySpeed = abilitySpeed == -1 ? (int?)null : abilitySpeed,
                        ZonePosition = zonePosition,
                        Zone = zone,
                        Revealed = revealed,
                        DataNum1 = dataNum1,
                        DataNum2 = dataNum2,
                    }),
                true,
                node,
                // See comments in NodeParser
                new
                {
                    Mindrender = true,
                }
            )};
        }
    }
}
