/// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.20;

error NotTicketOwner();
error NotAWinner();
error AlreadyClaimed();

contract MockJackpot {
    struct Game {
        uint256 totalReward; ///  Total accumulated reward per game
        uint256 numOfTickets; ///  Number of purchased tickets
        uint256 wonTicketId; ///  Won TicketId of the game
        bool claimed; ///  Reward's status (true = claimed; false = unclaimed)
    }

    struct Ticket {
        uint256 gameId; /// GameId
        address owner; /// Address of a ticket's owner
    }

    uint256 private constant MOCK_PRIZE = 1_000 ether;

    /// Store a mapping of Game info (gameId => Game)
    mapping(uint256 => Game) public games;

    /// Store a mapping of Ticket info (ticketId => Ticket)
    mapping(uint256 => Ticket) public tickets;

    /**
        - @dev Event emitted when `msg.sender` successfully claimed a reward
        - Related function: claim()
    */
    event Claimed(
        address indexed winner,
        uint256 indexed gameId,
        uint256 amount
    );

    function setWinningTicket(uint256 gameId, uint256 ticketId) external {
        games[gameId].wonTicketId = ticketId;
    }

    function purchase(
        uint256 gameId,
        uint256 ticketId,
        address ticketOwner
    ) external {
        tickets[ticketId] = Ticket({gameId: gameId, owner: ticketOwner});
        games[gameId].numOfTickets++;
    }

    function claim(uint256 ticketId) external {
        address winner = msg.sender;
        uint256 gameId = tickets[ticketId].gameId;
        Game memory game = games[gameId];
        if (tickets[ticketId].owner != winner) revert NotTicketOwner();
        if (game.wonTicketId != ticketId) revert NotAWinner();
        if (game.claimed) revert AlreadyClaimed();

        /// update storage status
        games[gameId].claimed = true;

        emit Claimed(winner, gameId, MOCK_PRIZE);
    }
}
