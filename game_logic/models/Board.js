import {
    LaserActionTypesEnum,
    LaserDirectionsEnum,
    LaserEventsEnum,
    MovementTypesEnum,
    PieceTypesEnum,
    PlayerTypesEnum,
    SquareTypesEnum
} from "./Enums.js";
import Location from "./Location.js";
import {PieceUtils} from "./Piece.js";
import {SquareUtils} from "./Square.js";
import SN from "../utils/SN.js";
import LHAN from "../utils/LHAN.js";
import {flatMap, toLower, toUpper} from "lodash";
import Movement from "./Movement.js";
import LaserPath from "./LaserPath.js";


/**
 * @constant
 * Ace
 */
export const BOARD_SNs = {
    "Ace": "l++3d++kd++b+++2/2b7/3B+6/b++1B1ss+1b+++1B+/b+++1B+1S+S1b++1B/6b+++3/7B++2/2B+DKD3L",
    "Curiosity": "l++3d++kd++s+++2/19/3B+2b++3/b++B2B+++s+2b+++B+/b+++B+2S+b+2b++B/3B2b+++3/19/2S+DKD3L",
    "Grail": "l++3bd++b+++3/5k4/b++3bd++s+3/b+++1s1B+1B+++3/3b+1b+++1S1B+/3S+DB++3B/4K5/3B+DB++3L",
    "Mercury": "l+3bkb+++2S+/5d++b+++3/b+++2s+1d++4/b++3B+3B1/1b++3b+++3B/4D1S+2B+/3B+D5/s+2B+KB++3L+++",
    "Sophie": "l++3kB+b+++3/3d++1d+3B/b++3bb+++1S+1B+/7s2/2S7/b+++1s+1B+B++3B/b++3D+++1D3/3B+b+++K3L",
}

/**
 * @constant
 * @type {Object}
 * 
 * Lookup object of individual piece scores.
 */
const PIECE_TO_SCORE = {
    d: 2, // Defender
    b: 1, // Deflector
    s: 0, // Switch
    l: 0 // Laser
    // k: -1000, // King. We ignore adding king's score, because when the king is not present, a default of -1000 will be given and the game is already over.
};


class Board {
    /**
     * @description
     * Intantiate a new board class.
     * 
     * @param {Object} options Use either {@param options.squares} or {@param options.setupNotation}. 
     *                         - Please only pass one of the options. Not both.
     *                         - If both are passed, options.squares will take priority and options.setupNotation will be ignored.
     *                         - If no options object is passed, will initialize the board with the default Ace Board Setup Notation.
     * @param {Array} options.squares Create a new instance of the board class using an already parsed board squares. You may use {@see SN#parse} method to do so.
     * @param {String} options.setupNotation Create a new instance of the board class using a setupNotation
     */
    constructor(options) {
        // Parse the options
        options = options || {};
        if (options.squares) {
            // If squares is provided, prioritize this
            this.squares = options.squares;
        } else if (options.setupNotation) {
            // If setupNotation is provided parse it and set the parsed squares.
            this.squares = SN.parse(options.setupNotation);
        } else {
            // If opts.squares nor opts.setupNotation is provided, use the default (ace) setup notation
            this.squares = SN.parse(this.getRandomSN());
        }

        this.winner = null;
    }

    getRandomSN() {
        const sns = ["Ace", "Curiosity", "Grail", "Mercury", "Sophie"]
        const random_sns_id = Math.floor(Math.random() * 5)
        const random_sns = sns[random_sns_id]
        return BOARD_SNs[random_sns]
    }

    /**
     * Get a square from the the current board that is at the specified location
     * ? TODO: validate location
     * 
     * @param {Location} location the location of the square on the board.
     * @returns {Square} the square or null if no square was found on the specified location.
     */
    getSquare(location) {
        let row = this.squares[location.rowIndex];
        if (row) {
            return row[location.colIndex];
        }
        return null;
    }


    /**
     * Get all the squares that contains pieces of the specified player only.
     * 
     * @param {PlayerTypesEnum} player
     * @returns {Array}
     */
    getPlayerSquares(player) {
        // flatten all rows into a single array
        const flattenedSquares = flatMap(this.squares);
        return flattenedSquares.filter((square) => {
            // Filter out the squares with no pieces in it.
            // And only return the pieces of the specified color
            return SquareUtils.hasPiece(square) && square.piece.color === player;
        });
    }


    /**
     * Evaluate a score based on the current board state and pieces available on it for the specified player.
     * @see PIECE_TO_SCORE for the weights of playable piece, used on the evaluation here.
     * 
     * @param {PlayerTypesEnum} playerType the player of whom we want to evaluate the score
     * @returns {number} the score. If game over, return -100.
     */
    getPlayerScore(playerType) {
        let playerScore = 0;
        const squaresOfPlayer = this.getPlayerSquares(playerType);

        // Track the king, to make sure it is is on the board
        let isKingAvailable = false; // we will update this check bellow when we loop through all the pieces on the board

        /**
         * Loop through all of the pieces of this player, and compute the scores 
         * based on our lookup object above 
         * @see PIECE_TO_SCORE the lookup object constant
         */
        squaresOfPlayer.forEach(square => {
            if (square.piece.type === PieceTypesEnum.KING) {
                isKingAvailable = true;
            } else {
                playerScore += PIECE_TO_SCORE[square.piece.type];
            }
        });


        // If the king piece of this color is not in the board.
        // then game over.
        if (!isKingAvailable) {
            return -1000;
        } else {
            return playerScore;
        }
    }


    /**
     * Get the route that the laser will travel when enabled for the specified playerType
     *
     * @param {PlayerTypesEnum} playerType the player who will applying the laser
     */
    getLaserRoute(playerType) {
        const completeRoute = []; // holds the laser path!

        // Get the laser of the player on the move
        // Starting from the laser, start scanning squares in the direction where laser is pointing.
        const an = (playerType === PlayerTypesEnum.BLUE) ? "j1" : "a8"; // We know exactly where the laser for each player is! As those are immovable pieces.
        const laserSquareLocation = Location.fromAN(an);
        const laserSquare = this.getSquare(laserSquareLocation);
        if (SquareUtils.hasPiece(laserSquare)) {
            // Begin!
            // Get the starting laser beam's direction based on the laser piece's orientation
            const laserPiece = laserSquare.piece;
            let direction = SquareUtils.getLaserBeamDirection(laserPiece);

            let colIndex = laserSquareLocation.colIndex;
            let rowIndex = laserSquareLocation.rowIndex;

            // Start scanning in the pointing direction of the laser beam
            let eventType = LaserEventsEnum.START;
            let actionType = LaserActionTypesEnum.NOTHING;

            completeRoute.push(new LaserPath(eventType, direction, actionType, laserSquareLocation.serialize()).serialize()); // start from the player's laser piece.
            while (eventType !== LaserEventsEnum.END) {
                eventType = LaserEventsEnum.CENTRAL;

                let dx, dy;
                if (direction === LaserDirectionsEnum.TOP) {
                    dx = 0;
                    dy = -1;

                } else if (direction === LaserDirectionsEnum.RIGHT) {
                    dx = 1;
                    dy = 0;

                } else if (direction === LaserDirectionsEnum.BOTTOM) {
                    dx = 0;
                    dy = 1;

                } else if (direction === LaserDirectionsEnum.LEFT) {
                    dx = -1;
                    dy = 0;

                }
                colIndex += dx;
                rowIndex += dy;

                // Make sure the indexes are not out of bound from the board.
                if ((rowIndex < 0 || rowIndex > 7) || (colIndex < 0 || colIndex > 9)) {
                    // If it is out of bound. Stop the laser right here
                    eventType = LaserEventsEnum.END;
                    completeRoute.push(new LaserPath(eventType, null, actionType, new Location(colIndex, rowIndex).serialize()).serialize());
                    continue;
                }

                // Get the square in the scanning location!
                const nextScanningSquareLocation = new Location(colIndex, rowIndex);
                const nextScanningSquare = this.getSquare(nextScanningSquareLocation);

                // Check if it has a piece in this square
                if (SquareUtils.hasPiece(nextScanningSquare)) {
                    // If piece was found, check what we have to do, based on the Laser Hit Action Notation of the piece in the scanning square
                    const action = LHAN.getHitAction(direction, nextScanningSquare.piece);
                    if (action.type === LaserActionTypesEnum.KILL) {
                        // The piece in this square should be killed/eaten/captured.
                        eventType = LaserEventsEnum.END; // end the scanning, we reached the limit for this laser beam.

                    } else if (action.type === LaserActionTypesEnum.DEFLECT) {
                        // The piece in this square changes the direction of my laser beam.
                        direction = action.newDirection;
                    } else if (action.type === LaserActionTypesEnum.NOTHING) {
                        // The piece in this square is probably (1) another laser or (2) a defender
                        // So, do nothing! Stop the laser now.
                        eventType = LaserEventsEnum.END;
                    }
                    actionType = action.type;

                } else {
                    // Continue if no piece in the scanning square.
                    // Did nothing.
                    actionType = LaserActionTypesEnum.NOTHING;
                }

                completeRoute.push(new LaserPath(eventType, direction, actionType, nextScanningSquareLocation.serialize()).serialize());
            }
        }
        return completeRoute;
    }


    /**
     * Returns all moves for all of the pieces of the specified player.
     * 
     * @param {PlayerTypesEnum} playerType
     * @returns {Movement[]}
     */
    getMovesForPlayer(playerType) {
        const moves = [];
        const squaresOfPlayer = this.getPlayerSquares(playerType);
        squaresOfPlayer.forEach(square => {
            const movesForPiece = this.getMovesForPieceAtLocation(square.location);
            if (movesForPiece.length !== 0) {
                // append if there are any moves available for said piece
                moves.push(...movesForPiece);
            }
        });
        return moves;
    }


    /**
     * Get all moves for a particular piece at the specified location
     * 
     * @param {Location} location the location on which the piece to get the moves is.
     * @returns {Movement[]} a list of all Movement possible for the piece in that location
     */
    getMovesForPieceAtLocation(location) {
        const moves = [];

        const srcX = location.colIndex;
        const srcY = location.rowIndex;
        /**
         * Every piece, except for Laser, has a maximum of 10 possible moves (to it's neighbor squares and rotating) on it's turn: 
         * - TOP_LEFT, TOP, TOP_RIGHT, RIGHT, BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT, LEFT, ROTATION_CLOCKWISE, ROTATION_C_CLOCKWISE
         * The Laser pieces are immovable throughout the entire game.
         * 
         * -------------
         * |TL| |T| |TR|
         * -------------
         * |L|  |x|  |R|
         * -------------
         * |BL| |B| |BR|
         * -------------
         * Where X is our srcLocation (where the piece we are moving is originally located).
         */
        const possibilities = [
            [srcX - 1, srcY - 1], // TL
            [srcX + 0, srcY - 1], // T
            [srcX + 1, srcY - 1], // TR
            [srcX + 1, srcY + 0], // R
            [srcX + 1, srcY + 1], // BR
            [srcX + 0, srcY + 1], // B
            [srcX - 1, srcY + 1], // BL
            [srcX - 1, srcY + 0], // L
        ];

        possibilities.forEach(([dx, dy]) => {
            // Make sure that dx and dy are inside the bounds of the board
            const dxIsInsideTheBoard = (dx >= 0 && dx < 10); // 10 is the maximum number of cols (actually it's 9 in array because of 0-based-index, hence why we are using less-than sign)
            const dyIsInsideTheBoard = (dy >= 0 && dy < 8); // 8 is the maximum number of rows (actually it's 7 in array because of 0-based-index, hence why we are using less-than sign)
            if (!(dxIsInsideTheBoard && dyIsInsideTheBoard)) {
                return; // skip to next itteration, because this dx or dy is outside the bound of the board.
            }

            const possibleDestLocation = new Location(dx, dy);
            const movePossibility = this.checkMovePossibility(location, possibleDestLocation);

            if (movePossibility.type !== MovementTypesEnum.INVALID) {
                // Only return moves that are possible
                moves.push(movePossibility);
            }
        });

        // TODO: add rotation possibility as well
        return moves;
    }

    /**
     * Checks if a specific movement is possible into that square.
     * Allows special move for Switch piece.
     * 
     * TODO: add rotation possibility as well
     *
     * @param {Location} srcLocation the square from where we are moving from.
     * @param {Location} destLocation the square to where we are moving.
     * @returns {Movement} which can contain a type of MovementTypesEnum#INVALID when the move is not possible
     */
    checkMovePossibility(srcLocation, destLocation) {
        const squareAtSrc = this.getSquare(srcLocation);
        const squareAtDest = this.getSquare(destLocation);

        // todo: remove the last OR statement, and add draggable={piece is not laser} instead in BoardPiece
        if ((squareAtDest === null) || (squareAtSrc === null) || (squareAtSrc.piece.type === PieceTypesEnum.LASER)) {
            // Invalid destLocation, as it has no square there. Most likely this is out of bound.
            // Or, we are trying to move a Laser Piece, which is not a possible move according to the rules of the game.
            // Return as not possible to move.
            return new Movement(MovementTypesEnum.INVALID, srcLocation, destLocation);
        }

        const pieceTypeAtSrc = squareAtSrc.piece.type;
        const pieceTypeAtDest = squareAtDest.piece ? squareAtDest.piece.type : null;
        const pieceColorAtSrc = squareAtSrc.piece.color;

        if (squareAtDest.type === SquareTypesEnum.RESERVED_BLUE && pieceColorAtSrc !== PlayerTypesEnum.BLUE) {
            // Trying to make a movement to a square reserved for blue player pieces only,
            // with a red player's piece.
            return new Movement(MovementTypesEnum.INVALID, srcLocation, destLocation);

        } else if (squareAtDest.type === SquareTypesEnum.RESERVED_RED && pieceColorAtSrc !== PlayerTypesEnum.RED) {
            // Trying to make a movement to a square reserved for red player pieces only,
            // with a blue player's piece.
            return new Movement(MovementTypesEnum.INVALID, srcLocation, destLocation);
        }

        // Special Move (swap)
        if ((pieceTypeAtSrc === PieceTypesEnum.SWITCH) &&
            (pieceTypeAtDest === PieceTypesEnum.DEFENDER || pieceTypeAtDest === PieceTypesEnum.DEFLECTOR)) {
            // If the piece is a switch, 
            // allow swap if the destination piece is either a defender or deflector of any color!
            return new Movement(MovementTypesEnum.SPECIAL, srcLocation, destLocation);

        } else {
            // Normal movement (to an empty neighbor square)

            // Check if we are moving to a reserved square, and make sure only the correct color can go there.
            if (SquareUtils.hasPiece(squareAtDest)) {
                // Trying to move into a square which already has a piece (and is not a valid swap).
                // Invalid move
                return new Movement(MovementTypesEnum.INVALID, srcLocation, destLocation);

            } else {
                return new Movement(MovementTypesEnum.NORMAL, srcLocation, destLocation);
            }
        }
    }


    // Setters

    /**
     * Apply a movement to this board
     * @param {Movement} movement the movement to be applied on the board
     */
    applyMovement(movement) {
        const squareAtSrc = this.getSquare(movement.srcLocation);
        // Check what type of move is being performed
        if (movement.type === MovementTypesEnum.NORMAL) { // dislocate
            // Normal movement (from one square to an empty one)
            const squareAtDest = this.squares[movement.destLocation.rowIndex][movement.destLocation.colIndex];
            // Move the piece from the src to dest.
            squareAtDest.piece = squareAtSrc.piece;
            squareAtSrc.piece = null;

        } else if (movement.type === MovementTypesEnum.ROTATION_CLOCKWISE) {
            // Rotation movement (clockwise)
            const clockwise = true;
            PieceUtils.applyRotation(squareAtSrc.piece, clockwise);

        } else if (movement.type === MovementTypesEnum.ROTATION_C_CLOCKWISE) {
            // Rotation movement (counter-clockwise)
            const c_clockwise = false;
            PieceUtils.applyRotation(squareAtSrc.piece, c_clockwise);

        } else if (movement.type === MovementTypesEnum.SPECIAL) {
            // Special movement (Switch piece is swapping places with either a Deflector or Defender piece)
            const squareAtDest = this.getSquare(movement.destLocation);

            // Swap the pieces.
            const squareAtSrcPiece = squareAtSrc.piece;
            squareAtSrc.piece = squareAtDest.piece;
            squareAtDest.piece = squareAtSrcPiece;
        }
    }


    /**
     * Applies the laser hit action notation in the current board.
     *
     * @param {PlayerTypesEnum} playerType the player whose laser is being switched on.
     * @returns {number[][]} the
     */
    applyLaser(playerType) {
        if (!playerType) {
            throw new Error("applyLaser - Please specify the player whose laser is being switched on.");
        }

        // Compute the laser beam route, and do actions on the necessary pieces.
        const laserRoute = this.getLaserRoute(playerType);
        const finalLaserPath = laserRoute[laserRoute.length - 1];

        // handle the laser hit
        if (finalLaserPath.actionType === LaserActionTypesEnum.KILL) {
            const squareAtHit = this.squares[finalLaserPath.location.rowIndex][finalLaserPath.location.colIndex];
            // Check if we killed the King!
            if (squareAtHit.piece.type === 'k') {
                // Oh lord, the king is dead, I repeat, the king is dead!
                // Check which king is dead and declare the winner! 🏴‍☠️
                this.winner = squareAtHit.piece.color === PlayerTypesEnum.BLUE ? PlayerTypesEnum.RED : PlayerTypesEnum.BLUE;
            }
            // Remove the piece from the square.
            squareAtHit.piece = null;
        }
    }


    /**
     * Returns a new board from move without modifying current board.
     * @param {Movement} movement the movement being performed on the board
     * @param {PlayerTypesEnum} playerType the player that is moving
     */
    newBoardFromMovement(movement, playerType) {
        const newBoard = new Board({setupNotation: this.toSN()}); // clone this board
        newBoard.applyMovement(movement);
        newBoard.applyLaser(playerType);
        return newBoard;
    }


    /**
     * Converts the current board into Setup Notation string.
     * @returns {string} SN string
     */
    toSN() {
        let sn = "";
        let emptySquaresCount = 0;

        this.squares.forEach((row, rowIndex) => {
            row.forEach((square, colIndex) => {
                if (SquareUtils.hasPiece(square)) {
                    if (emptySquaresCount > 0) {
                        sn += `${emptySquaresCount}`;
                        emptySquaresCount = 0;
                    }

                    // type?
                    if (square.piece.color === PlayerTypesEnum.BLUE) {
                        // Blue uses upper case letters for piece type representation (L D B K S)
                        sn += toUpper(square.piece.type);

                    } else {
                        // Red uses lower case letter for piece type representation (l d b k s);
                        sn += toLower(square.piece.type);
                    }

                    // orientation?
                    const orientation = square.piece.orientation;
                    sn += _.repeat("+", orientation / 90);

                } else {
                    emptySquaresCount += 1;
                }
            });

            if (emptySquaresCount > 0) {
                sn += `${emptySquaresCount === 10 ? "*" : emptySquaresCount}`; // on 10 empty spaces show "*" instead of (10)
                emptySquaresCount = 0; // reset
            }

            // Append / to sepparate rows, but not at the end of the notation.
            if (rowIndex !== 7) {
                sn += "/"; // separates the rows
            }
        });
        return sn;
    }


    /**
     * Serializes the Board object into an Object.
     * @returns {Object} plain object, representing this instance
     */
    serialize() {
        return {
            winner: this.winner,
            squares: this.squares,
            sn: this.toSN() // setup notation
        };
    }


    // CLI Related (dev only)

    /**
     * Logs a prettier version of SN into the CLI
     */
    _viewInCLI() {
        let sn = "";
        let emptySquaresCount = 0;

        this.squares.forEach((row, rowIndex) => {
            row.forEach((square, colIndex) => {
                if (SquareUtils.hasPiece(square)) {

                    if (emptySquaresCount > 0) {
                        sn += `${emptySquaresCount}`;
                        emptySquaresCount = 0;
                    }

                    // type?
                    if (square.piece.color === PlayerTypesEnum.BLUE) {
                        // Blue uses upper case letters for piece type representation (L D B K S)
                        sn += toUpper(square.piece.type);

                    } else {
                        // Red uses lower case letter for piece type representation (l d b k s);
                        sn += toLower(square.piece.type);
                    }

                    sn += " ";

                    // orientation?
                    // const orientation = square.piece.orientation;
                    // sn += _.repeat("+", orientation / 90);

                } else {
                    sn += ". ";
                }
            });

            // Append / to sepparate rows, but not at the end of the notation.
            if (rowIndex !== 7) {
                sn += "\n"; // separates the rows
            }
        });
    }

    /**
     * Get flattened xy points from the laser route, that is used in the board's laser drawing.
     * 
     * @param {LaserPath[]} route the route travelled by the laser. Use { #getLaserRoute() }
     * @param {number} cellSize the size of indidual cells of the board.
     * @returns {number[]} a flattened array of the x,y coordinates for the laser to be drawn in the board.
     */
    static linePointsFromLaserRoute(laserRoute, cellSize) {
        const points = laserRoute.map(path => {
            let x, y;
            if ((path.eventType === LaserEventsEnum.START) || (path.eventType === LaserEventsEnum.END)) {
                // Start from the middle of the laser piece,
                y = path.location.rowIndex * cellSize + (cellSize / 2);
                x = path.location.colIndex * cellSize + (cellSize / 2);

            } else if (path.eventType === LaserEventsEnum.CENTRAL) {
                // Laser is going ways....
                if (path.direction === LaserDirectionsEnum.TOP) {
                    // going top
                    if (path.actionType === LaserActionTypesEnum.DEFLECT) {
                        x = path.location.colIndex * cellSize + (cellSize / 2);
                        y = path.location.rowIndex * cellSize + (cellSize / 2);

                    } else if (path.actionType === LaserActionTypesEnum.NOTHING) {
                        x = path.location.colIndex * cellSize + (cellSize / 2);
                        y = path.location.rowIndex * cellSize;
                    }

                } else if (path.direction === LaserDirectionsEnum.LEFT) {
                    // going left
                    if (path.actionType === LaserActionTypesEnum.DEFLECT) {
                        x = path.location.colIndex * cellSize + (cellSize / 2);
                        y = path.location.rowIndex * cellSize + (cellSize / 2);

                    } else if (path.actionType === LaserActionTypesEnum.NOTHING) {
                        x = path.location.colIndex * cellSize;
                        y = path.location.rowIndex * cellSize + (cellSize / 2);
                    }

                } else if (path.direction === LaserDirectionsEnum.RIGHT) {
                    // going right
                    if (path.actionType === LaserActionTypesEnum.DEFLECT) {
                        x = path.location.colIndex * cellSize + (cellSize / 2);
                        y = path.location.rowIndex * cellSize + (cellSize / 2);

                    } else if (path.actionType === LaserActionTypesEnum.NOTHING) {
                        x = path.location.colIndex * cellSize + cellSize;
                        y = path.location.rowIndex * cellSize + (cellSize / 2);
                    }

                } else if (path.direction === LaserDirectionsEnum.BOTTOM) {
                    // going bottom
                    if (path.actionType === LaserActionTypesEnum.DEFLECT) {
                        x = path.location.colIndex * cellSize + (cellSize / 2);
                        y = path.location.rowIndex * cellSize + (cellSize / 2);

                    } else if (path.actionType === LaserActionTypesEnum.NOTHING) {
                        x = path.location.colIndex * cellSize + (cellSize / 2);
                        y = path.location.rowIndex * cellSize + cellSize;
                    }
                }
            }
            return [x, y];
        });

        return flatMap(points);
    }
}

export default Board;