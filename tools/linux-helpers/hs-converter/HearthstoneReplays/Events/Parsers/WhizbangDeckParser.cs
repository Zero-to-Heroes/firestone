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
    public class WhizbangDeckParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade Helper { get; set; }

        public WhizbangDeckParser(ParserState ParserState, StateFacade helper)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.Helper = helper;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            return false;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            var oldWhizbangAndLegacy = node.Type == typeof(PlayerEntity);
            var newWhizbang = node.Type == typeof(FullEntity) || node.Type == typeof(ShowEntity);
            return stateType == StateType.PowerTaskList 
                && (oldWhizbangAndLegacy || newWhizbang);
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            return null;
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            if (node.Type == typeof(PlayerEntity))
            {
                return CreateFromPlayerEntity(node);
            }
            else if (node.Type == typeof(FullEntity))
            {
                return CreateFromFullEntity(node);
            }
            else
            {
                return CreateFromShowEntity(node);
            }
        }

        public List<GameEventProvider> CreateFromFullEntity(Node node)
        {
            var entity = node.Object as FullEntity;
            var parentAction = node.Parent?.Type == typeof(Action) ? node.Parent.Object as Action : null;
            if (parentAction == null)
            {
                return null;
            }

            var whizbangDeckId = GetSplendiferousDeckId(entity.CardId);
            if (whizbangDeckId == -1)
            {
                return null;
            }

            return new List<GameEventProvider> { GameEventProvider.Create(
                entity.TimeStamp,
                "WHIZBANG_DECK_ID",
                GameEvent.CreateProvider(
                    "WHIZBANG_DECK_ID",
                    null,
                    entity.GetEffectiveController(),
                    entity.Id,
                    Helper,
                    //null,
                    new {
                        DeckId = whizbangDeckId,
                    }),
                true,
                node) };
        }

        public List<GameEventProvider> CreateFromShowEntity(Node node)
        {
            var entity = node.Object as ShowEntity;
            var parentAction = node.Parent?.Type == typeof(Action) ? node.Parent.Object as Action : null;
            if (parentAction == null)
            {
                return null;
            }

            var whizbangDeckId = GetSplendiferousDeckId(entity.CardId);
            if (whizbangDeckId == -1)
            {
                return null;
            }

            return new List<GameEventProvider> { GameEventProvider.Create(
                entity.TimeStamp,
                "WHIZBANG_DECK_ID",
                GameEvent.CreateProvider(
                    "WHIZBANG_DECK_ID",
                    null,
                    entity.GetEffectiveController(),
                    entity.Entity,
                    Helper,
                    //null,
                    new {
                        DeckId = whizbangDeckId,
                    }),
                true,
                node) };
        }

        public List<GameEventProvider> CreateFromPlayerEntity(Node node)
        {
            var playerEntity = node.Object as PlayerEntity;
            // Old tag, which we don't want to show for the opponent
            var whizbangDeckId = playerEntity.PlayerId == Helper.OpponentPlayer.PlayerId 
                ? -1 
                : playerEntity.GetTag(GameTag.WHIZBANG_DECK_ID);
            if (whizbangDeckId == -1)
            {
                // In this case, this gives the card ID (like TOY_700t2)
                var splendiferousCardId = playerEntity.GetTag(GameTag.WHIZBANG_SPLENDIFEROUS_DECK_ID);
                if (splendiferousCardId != -1)
                {
                    whizbangDeckId = GetSplendiferousDeckId(splendiferousCardId);
                }
            }
            if (whizbangDeckId == -1)
            {
                return null;
            }

            return new List<GameEventProvider> { GameEventProvider.Create(
                playerEntity.TimeStamp,
                "WHIZBANG_DECK_ID",
                GameEvent.CreateProvider(
                    "WHIZBANG_DECK_ID",
                    null,
                    playerEntity.GetEffectiveController(),
                    playerEntity.Id,
                    Helper,
                    //null,
                    new {
                        DeckId = whizbangDeckId,
                    }),
                true,
                node) };
        }

        private int GetSplendiferousDeckId(int splendiferousCardId)
        {
            switch (splendiferousCardId)
            {
                // Manually map a card id with a deck from the DECK.json DBF
                case 106243: return 5342; // Priest
                case 106244: return 5343; // Death Knight Rainbow
                case 106245: return 5345; // Rogue
                case 106246: return 5344; // Warlock
                //case 106247: return ; // Copycat
                case 106248: return 5385; // Mage
                case 106249: return 5346; // Druid
                case 106252: return 5381; // Paladin
                case 106253: return 5382; // Hunter
                case 106251: return 5383; // DH
                case 106250: return 5384; // Shaman
                case 108932: return 5410; // Warrior
                //case 106244: return 5317; // DK_DH
                //case 106244: return 5318; // Rogue_Hunter
                //case 106244: return 5319; // Paladin_DK
                //case 106244: return 5336; // ??? d4
                //case 106244: return 5320; // Warlock_Priest
                //case 106244: return 5337; // ??? d5
                //case 106244: return 5321; // Druid_Warrior
                //case 106244: return 5322; // Shaman_Mage
                //case 106244: return 5327; // ??? d1
                //case 106244: return 5328; // ??? d2
                //case 106244: return 5329; // ??? d3
                //case 106244: return 5322; // Shaman_Mage
                default: return -1;
            }
        }

        private int GetSplendiferousDeckId(string splendiferousCardId)
        {
            switch (splendiferousCardId)
            {
                // Manually map a card id with a deck from the DECK.json DBF
                case "TOY_700t1": return 5342; // Priest
                case "TOY_700t2": return 5343; // Death Knight Rainbow
                case "TOY_700t3": return 5345; // Rogue
                case "TOY_700t4": return 5344; // Warlock
                //case 106247: return ; // Copycat
                case "TOY_700t6": return 5385; // Mage
                case "TOY_700t7": return 5346; // Druid
                case "TOY_700t10": return 5381; // Paladin
                case "TOY_700t11": return 5382; // Hunter
                case "TOY_700t9": return 5383; // DH
                case "TOY_700t8": return 5384; // Shaman
                case "TOY_700t12": return 5410; // Warrior
                //case 106244: return 5317; // DK_DH
                //case 106244: return 5318; // Rogue_Hunter
                //case 106244: return 5319; // Paladin_DK
                //case 106244: return 5336; // ??? d4
                //case 106244: return 5320; // Warlock_Priest
                //case 106244: return 5337; // ??? d5
                //case 106244: return 5321; // Druid_Warrior
                //case 106244: return 5322; // Shaman_Mage
                //case 106244: return 5327; // ??? d1
                //case 106244: return 5328; // ??? d2
                //case 106244: return 5329; // ??? d3
                //case 106244: return 5322; // Shaman_Mage
                default: return -1;
            }
        }
    }
}
