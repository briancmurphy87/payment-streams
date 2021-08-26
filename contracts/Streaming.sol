// SPDX-License-Identifier: MIT

pragma solidity ^0.8.3;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";


/**
 * Basic Skeleton - Functions
 * Tests - Sender, Few requires
 * Tests - CreateStream Impln
 * Implement other functions w/o tests
 * Import - all tests should pass
 * Other concepts
 *  - Mapping (isEntity - key does not exist)
 *  - Visiblity, View
 *  - Memory keyword
 *  - Concept of "Now" - use BlockTimestamp
 * - Libraries
 *     - SafeMath
 *     - Added Counters from OZ
 * - Modifiers
 * - Events
 *      - Indexed
 * - Types & Interface
 * - Show ABI
 
 **/

contract Streaming {
    using SafeMath for uint256;
    using Counters for Counters.Counter;

    address public owner;
    
    /**
     * @dev The stream objects identifiable by their unsigned integer ids.
     */
    mapping(uint256 => Stream) private streams;
    
    /**
     * @notice Counter for new stream ids.
     */
    Counters.Counter public streamIdCounter;
    
    /**
     * @dev Throws if the caller is not the sender of the recipient of the stream.
     */
    modifier onlySenderOrRecipient(uint256 streamId) {
        require(
            msg.sender == streams[streamId].sender || msg.sender == streams[streamId].recipient,
            "caller is not the sender or the recipient of the stream"
        );
        _;
    }

    /**
     * @dev Throws if the id does not point to a valid stream.
     */
    modifier streamExists(uint256 streamId) {
        require(streams[streamId].isEntity, "stream does not exist");
        _;
    }
    
    struct Stream {
        address recipient;
        address sender;
        uint256 deposit;
        uint256 startTime;
        uint256 stopTime;
        uint256 rate;
        uint256 balance;
        bool isEntity;
    }
    
    /**
     * @notice Emits when a stream is successfully created.
     */
    event CreateStream(
        uint256 indexed streamId,
        address indexed sender,
        address indexed recipient,
        uint256 deposit,
        uint256 startTime,
        uint256 stopTime
    );

    /**
     * @notice Emits when the recipient of a stream withdraws a portion or all their pro rata share of the stream.
     */
    event WithdrawFromStream(uint256 indexed streamId, address indexed recipient);

    /**
     * @notice Emits when a stream is successfully cancelled and tokens are transferred back on a pro rata basis.
     */
    event CancelStream(
        uint256 indexed streamId,
        address indexed sender,
        address indexed recipient,
        uint256 senderBalance,
        uint256 recipientBalance
    );
    
    constructor() {
        owner  = msg.sender;
    }
    
    
    function balanceOf( uint256 streamId, address who)  public view streamExists(streamId) returns (uint256 balance) {
        Stream memory stream = streams[streamId];
        uint256 elapsedTime = elapsedTimeFor(streamId);
        uint256 due = elapsedTime.mul(stream.rate);
        
        if (who == stream.recipient) {
            return due;
        } else if (who == stream.sender) {
            return stream.balance.sub(due);
        } else {
            return 0;
        }
    }
        
        
    function elapsedTimeFor(uint256 streamId) private view returns (uint256 delta) {
        Stream memory stream = streams[streamId];
        
        // Before the start of the stream
        if (block.timestamp <= stream.startTime) return 0;
        
        // During the stream
        if (block.timestamp < stream.stopTime) return block.timestamp - stream.startTime;
        
        // After the end of the stream
        return stream.stopTime - stream.startTime;
    }    
    
    
    /**
     * @notice Creates a new stream funded by `msg.sender` and paid towards `recipient`.
     * @dev Throws if paused.
     *  Throws if the recipient is the zero address, the contract itself or the caller.
     *  Throws if the deposit is 0.
     *  Throws if the start time is before `block.timestamp`.
     *  Throws if the stop time is before the start time.
     *  Throws if the deposit is smaller than the duration.
     *  Throws if the deposit is not a multiple of the duration.
     *  Throws if the contract is not allowed to transfer enough tokens.
     *  Throws if there is a token transfer failure.
     * @param recipient The address towards which the money is streamed.
     * @param deposit The amount of money to be streamed.
     * @param startTime The unix timestamp for when the stream starts.
     * @param stopTime The unix timestamp for when the stream stops.
     * @return streamId The uint256 id of the newly created stream.
     */    
     function createStream(
            address recipient,
            uint256 deposit,
            uint256 startTime,
            uint256 stopTime
    ) external payable returns (uint256 streamId) {
        
        // Requires
        require(deposit == msg.value, "Deposit not received"); 
        require(recipient != address(0x00), "Stream to the zero address");
        require(recipient != address(this), "Stream to the contract itself");
        require(recipient != msg.sender, "Stream to the caller");
        require(deposit > 0, "Deposit is less that or equal to zero");
        require(startTime >= block.timestamp, "Start time before block timestamp");
        require(stopTime > startTime, "Stop time before start time");
        
        uint256 duration = stopTime.sub(startTime);
        
        require(deposit >= duration, "Deposit smaller than duration");
        require(deposit.mod(duration) == 0, "Deposit is not a multiple of time delta");
        
        streamIdCounter.increment();    
        uint256 currentStreamId = streamIdCounter.current();
        
        // Rate Per second
        uint256 rate = deposit.div(duration);
        
        streams[currentStreamId] = Stream({
           balance: deposit,
           deposit: deposit,
           rate: rate,
           recipient: recipient,
           sender: msg.sender,
           startTime: startTime,
           stopTime: stopTime,
           isEntity: true
        });
        
        emit CreateStream(currentStreamId, msg.sender, recipient, deposit, startTime, stopTime);
        return currentStreamId;
    }
    
    /**
     *  @notice Withdraws from the contract to the recipient's account.
     *  @dev Throws if the id does not point to a valid stream.
     *  Throws if the calelr is not the sender or the recipient of the stream.
     *  Throws if there is a token transfer failure.
     *  @param streamId The id of the stream to withdraw tokens from.  
     */
    function withdrawFromStream(
            uint256 streamId
    )  external 
        streamExists(streamId)
        onlySenderOrRecipient(streamId) {
        
        Stream memory stream = streams[streamId];
        uint256 balance = balanceOf(streamId, stream.recipient);
        require(balance > 0, "Available balance is 0");
        
        (bool success, ) = payable(stream.recipient).call{value: balance, gas: 100000}("");
        require(success, "Transaction failed");
        
        streams[streamId].balance = 0;
        
        emit WithdrawFromStream(streamId, stream.recipient);
    }
    
    /**
     * @notice Cancels the stream and transfers the tokens back on a pro rata basis.
     * @dev Throws if the id does not point to a valid stream.
     *  Throws if the caller is not the sender or the recipient of the stream.
     *  Throws if there is a token transfer failure.
     * @param streamId The id of the stream to cancel.
     */
    function cancelStream( uint256 streamId)  external 
        streamExists(streamId)
        onlySenderOrRecipient(streamId) {
        
        Stream memory stream = streams[streamId];
        uint256 senderBalance = balanceOf(streamId, stream.sender);
        uint256 recipientBalance = balanceOf(streamId, stream.recipient);
        delete streams[streamId];
        if (recipientBalance > 0) {
            (bool success, ) = payable(stream.recipient).call{value: recipientBalance, gas: 100000}("");
            require(success, "Transaction failed");
        }
        if (senderBalance > 0) {
            (bool success, ) = payable(stream.sender).call{value: senderBalance, gas: 100000}("");
            require(success, "Transaction failed");
        }
        
        emit CancelStream(streamId, stream.sender, stream.recipient, senderBalance, recipientBalance);
    } 

    /**
     * @notice Returns the stream with all its properties.
     * @dev Throws if the id does not point to a valid stream.
     * @param streamId The id of the stream to query.
     * @return sender , recipient, deposit, startTime, stopTime, rate The stream object.
     */
    function getStream(uint256 streamId)
        external
        view
        streamExists(streamId)
        returns (
            address sender,
            address recipient,
            uint256 deposit,
            uint256 startTime,
            uint256 stopTime,
            uint256 rate
        )
    {
        sender = streams[streamId].sender;
        recipient = streams[streamId].recipient;
        deposit = streams[streamId].deposit;
        startTime = streams[streamId].startTime;
        stopTime = streams[streamId].stopTime;
        rate = streams[streamId].rate;
    }
    
}