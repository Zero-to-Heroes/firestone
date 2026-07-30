using HearthstoneReplays.Parser.ReplayData;
using HearthstoneReplays.Parser.ReplayData.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HearthstoneReplays.Parser
{
    public class StateFacade
    {
        private CombinedState State;

        private string _lastProcessedGSLine;
        private string _lastProcessedPTLLine;
        private string _updateToRootAfterLine;

        public StateFacade(CombinedState combined)
        {
            this.State = combined;
        }

        public Player LocalPlayer
        {
            get
            {
                return State?.GSState?.LocalPlayer;
            }
        }

        public Player OpponentPlayer
        {
            get
            {
                return State?.GSState?.OpponentPlayer;
            }
        }

        public bool Spectating
        {
            get
            {
                return State?.GSState?.Spectating ?? false;
            }
        }

        public int ScenarioID
        {
            get
            {
                return State.GSState.CurrentGame.ScenarioID;
            }
        }

        public HearthstoneReplay GSReplay
        {
            get
            {
                return State.GSState.Replay;
            }
        }

        public string LastProcessedGSLine
        {
            set
            {
                var isLastLineToBeConsidered = value != null
                    && !(value.Contains("BuildNumber=") && Regexes.BuildNumber.Match(value).Success)
                    && !(value.Contains("GameType=") && Regexes.GameType.Match(value).Success)
                    && !(value.Contains("FormatType=") && Regexes.FormatType.Match(value).Success)
                    && !(value.Contains("ScenarioID=") && Regexes.ScenarioID.Match(value).Success)
                    && !(value.Contains("PlayerID=") && value.Contains("PlayerName=") && Regexes.PlayerNameAssignment.Match(value).Success);
                if (isLastLineToBeConsidered)
                {
                    this._lastProcessedGSLine = value;
                }
            }
        }

        public string LastProcessedPTLLine
        {
            set
            {
                this._lastProcessedPTLLine = value;
            }
        }

        public ParserState PtlState
        {
            get
            {
                return State?.PTLState;
            }
        }
        public ParserState GsState
        {
            get
            {
                return State?.GSState;
            }
        }

        internal bool HasMetaData()
        {
            return State.GSState.CurrentGame.FormatType != -1 && State.GSState.CurrentGame.GameType != -1 && LocalPlayer != null;
        }

        internal GameMetaData GetMetaData()
        {
            return new GameMetaData()
            {
                BuildNumber = State.GSState.CurrentGame.BuildNumber,
                FormatType = State.GSState.CurrentGame.FormatType,
                GameType = State.GSState.CurrentGame.GameType,
                ScenarioID = State.GSState.CurrentGame.ScenarioID,
            };
        }

        internal bool IsBattlegrounds()
        {
            return State.GSState.IsBattlegrounds();
        }

        internal bool IsBattlegroundsDuos()
        {
            return State.GSState.IsBattlegroundsDuos();
        }

        internal bool InRecruitPhase()
        {
            return State.PTLState.InRecruitPhase();
        }

        internal List<PlayerEntity> GetPlayers()
        {
            return State.GSState.getPlayers();
        }

        internal void NotifyUpdateToRootNeeded()
        {
            // Sometimes the situation is that the GS blocks are over, the PTL block is over BUT doesn't contain the BLOCK_END info, 
            // and the GS.options lines arrive that trigger an update to root.
            // In that case, 
            if (this._lastProcessedPTLLine != null && this._lastProcessedPTLLine.Trim() == this._lastProcessedGSLine?.Trim())
            {
                UpdatePTLToRoot();
            }
            else if (this._lastProcessedGSLine?.Trim() == "BLOCK_END")
            {
                this._updateToRootAfterLine = this._lastProcessedGSLine?.Trim();
            }
        }

        // TODO: handle the case of the format between GS and PTR being different (eg entity name, card id)
        internal bool ShouldUpdateToRoot(string data)
        {
            // TODO: maybe don't update to root after BLOCK_END? 
            return this._updateToRootAfterLine != null && this._updateToRootAfterLine.Equals(data?.Trim());
        }

        internal void UpdatePTLToRoot()
        {
            // Acts as a BLOCK_END
            this.State.PTLState.EndAction();
            this.State.PTLState.UpdateCurrentNode(typeof(Game));
            this._updateToRootAfterLine = null;
        }
    }
}
