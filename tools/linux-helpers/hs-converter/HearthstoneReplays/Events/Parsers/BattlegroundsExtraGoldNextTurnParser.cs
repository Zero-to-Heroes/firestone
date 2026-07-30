using HearthstoneReplays.Parser;
using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.GameActions;
using System.Linq;
using HearthstoneReplays.Enums;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System.Collections.Generic;
using static HearthstoneReplays.Events.CardIds;
using System;
using Action = HearthstoneReplays.Parser.ReplayData.GameActions.Action;
using System.ComponentModel;

namespace HearthstoneReplays.Events.Parsers
{
    // Deactivated
    public class BattlegroundsExtraGoldNextTurnParser : ActionParser
    {
        private GameState GameState { get; set; }
        private ParserState ParserState { get; set; }
        private StateFacade StateFacade { get; set; }

        public BattlegroundsExtraGoldNextTurnParser(ParserState ParserState, StateFacade stateFacade)
        {
            this.ParserState = ParserState;
            this.GameState = ParserState.GameState;
            this.StateFacade = stateFacade;
        }

        public bool AppliesOnNewNode(Node node, StateType stateType)
        {
            //return false;
            var correctMode = stateType == StateType.PowerTaskList && StateFacade.IsBattlegrounds() && node.Type == typeof(TagChange);
            if (!correctMode)
            {
                return false;
            }

            if (!StateFacade.InRecruitPhase())
            {
                return false;
            }

            var tagChange = (node.Object as TagChange);
            //var isExtraGoldNextTurn = tagChange.Name == (int)GameTag.TAG_SCRIPT_DATA_NUM_1
            //    && GameState.CurrentEntities.GetValueOrDefault(tagChange.Entity)?.CardId == CardIds.SouthseaBusker_ExtraGoldNextTurnDntEnchantment;
            //var isExtraGoldNextTurnRemoved = tagChange.Name == (int)GameTag.ZONE
            //    && tagChange.Value == (int)Zone.GRAVEYARD
            //    && GameState.CurrentEntities.GetValueOrDefault(tagChange.Entity)?.CardId == CardIds.SouthseaBusker_ExtraGoldNextTurnDntEnchantment;
            //var isOverconfidence = tagChange.Name == (int)GameTag.ZONE
            //    //&& tagChange.Value == (int)Zone.PLAY
            //    && GameState.CurrentEntities.GetValueOrDefault(tagChange.Entity)?.CardId == CardIds.Overconfidence_OverconfidentDntEnchantment_BG28_884e;
            var isNewTurn = tagChange.Name == (int)GameTag.BOARD_VISUAL_STATE;
            //var isCardUpdated = tagChange.Name == (int)GameTag.ZONE 
            //    && GameState.CurrentEntities.GetValueOrDefault(tagChange.Entity)?.GetController() == StateFacade.LocalPlayer.PlayerId;
            //return isExtraGoldNextTurn || isOverconfidence || isExtraGoldNextTurnRemoved || isNewTurn;
            return isNewTurn;
        }

        public bool AppliesOnCloseNode(Node node, StateType stateType)
        {
            return false;
        }

        public List<GameEventProvider> CreateGameEventProviderFromNew(Node node)
        {
            var tagChange = node.Object as TagChange;
            var entity = GameState.CurrentEntities.GetValueOrDefault(tagChange.Entity);
            var controllerId = entity.GetController();

            //var extraGoldNextTurnValue = entity.CardId == CardIds.SouthseaBusker_ExtraGoldNextTurnDntEnchantment && tagChange.Name == (int)GameTag.TAG_SCRIPT_DATA_NUM_1
            //    ? tagChange.Value
            //    : entity.CardId == CardIds.SouthseaBusker_ExtraGoldNextTurnDntEnchantment && tagChange.Name == (int)GameTag.ZONE && tagChange.Value == (int)Zone.GRAVEYARD
            //    ? 0
            //    : GameState.CurrentEntities.Values
            //        .Where(e => e.CardId == CardIds.SouthseaBusker_ExtraGoldNextTurnDntEnchantment)
            //        .Where(e => e.IsInPlay())
            //        .FirstOrDefault()
            //        ?.GetTag(GameTag.TAG_SCRIPT_DATA_NUM_1)
            //        ?? 0;

            //var overconfidentEnchantments = GameState.CurrentEntities.Values
            //    .Where(e => e.CardId == CardIds.Overconfidence_OverconfidentDntEnchantment_BG28_884e)
            //    .Where(e => e.IsInPlay(tagChange))
            //    .ToList();

            var boardAndEnchantments = BuildBoardAndEnchantmentCardIds(tagChange);

            return new List<GameEventProvider> { GameEventProvider.Create(
                tagChange.TimeStamp,
                "BATTLEGROUNDS_EXTRA_GOLD_NEXT_TURN",
                GameEvent.CreateProvider(
                "BATTLEGROUNDS_EXTRA_GOLD_NEXT_TURN",
                    null,
                    controllerId,
                    tagChange.Entity,
                    StateFacade,
                    //null,
                    new {
                        //ExtraGoldNextTurn = extraGoldNextTurnValue,
                        //Overconfidences = overconfidentEnchantments.Count(),
                        BoardAndEnchantments = boardAndEnchantments,
                    }),
                true,
                node) };
        }

        private List<string> BuildBoardAndEnchantmentCardIds(TagChange tagChange)
        {

            var board = GameState.CurrentEntities.Values
                .Where(e => e.GetEffectiveController() == StateFacade.LocalPlayer.PlayerId)
                .Where(e => e.GetZone(tagChange) == (int)Zone.PLAY)
                .Where(e => e.TakesBoardSpace())
                .ToList();
            var boardEntityIds = board.Select(e => e.Entity).ToList();
            var enchantmentCardIds = GameState.CurrentEntities.Values
                .Where(entity => boardEntityIds.Contains(entity.GetTag(GameTag.ATTACHED)))
                .Where(entity => entity.GetTag(GameTag.ZONE) != (int)Zone.REMOVEDFROMGAME)
                .Select(e => e.CardId == PolarizingBeatboxer_PolarizedEnchantment
                    ? "" + GameState.CurrentEntities
                        .GetValueOrDefault(e.GetTag(GameTag.CREATOR))
                        ?.GetTag(GameTag.ENTITY_AS_ENCHANTMENT)
                    : e.CardId)
                .ToList();
            var boardCardIds = board.Select(e => e.CardId).ToList();
            boardCardIds.AddRange(enchantmentCardIds);
            return boardCardIds
                //.Where(id => new List<string>() {
                //    AccordOTron_BG26_147,
                //    AccordOTron_AccordOTronEnchantment_BG26_147e,
                //    AccordOTron_BG26_147_G,
                //    AccordOTron_AccordOTronEnchantment_BG26_147_Ge,
                //    RecordSmuggler_BG26_812,
                //    RecordSmuggler_BG26_812_G
                //}.Contains(id))
                .ToList();
        }

        public List<GameEventProvider> CreateGameEventProviderFromClose(Node node)
        {
            return null;
        }
    }
}
