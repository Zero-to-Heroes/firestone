using HearthstoneReplays.Parser;
using HearthstoneReplays.Enums;

namespace HearthstoneReplays.Events.Parsers
{
    public class CorposesSpentThisGameParser : AbstractBasicTagChangeParser
    {
        public CorposesSpentThisGameParser(ParserState ParserState, StateFacade facade) 
            : base(ParserState, facade, GameTag.CORPSES_SPENT_THIS_GAME, "CORPSES_SPENT_THIS_GAME_CHANGED")
        {
        }
    }
}
