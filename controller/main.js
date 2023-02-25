const getLastMove = (myLastMove, opponentLastMove) => {
  if (
    myLastMove.numberOfMoves === null &&
    opponentLastMove.numberOfMoves === null
  )
    return;
  if (
    myLastMove.numberOfMoves !== null &&
    opponentLastMove.numberOfMoves !== null
  )
      if (
          myLastMove.numberOfMoves > opponentLastMove.numberOfMoves ||
          (myLastMove.userColor === "blue" && myLastMove.numberOfMoves === opponentLastMove.numberOfMoves)) {
          return myLastMove;
      } else {
          return opponentLastMove;
      }
  if (
    myLastMove.numberOfMoves !== null &&
    opponentLastMove.numberOfMoves === null
  )
    return myLastMove;
  if (
    opponentLastMove.numberOfMoves !== null &&
    myLastMove.numberOfMoves === null
  )
    return myLastMove;
};