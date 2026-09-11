import type { AuraResult } from "./aura-types";

export type AuraBattleResult = {
  playerOne: AuraResult;
  playerTwo: AuraResult;
  winner: "PLAYER_ONE" | "PLAYER_TWO" | "TIE";
  auraDifference: number;
  message: string;
};

export function battleAura(
  playerOne: AuraResult,
  playerTwo: AuraResult
): AuraBattleResult {
  const auraDifference = Math.abs(playerOne.score - playerTwo.score);

  if (playerOne.score === playerTwo.score) {
    return {
      playerOne,
      playerTwo,
      winner: "TIE",
      auraDifference: 0,
      message: "AURA EQUILIBRIUM DETECTED. NOBODY WON. EVERYONE IS CONFUSED.",
    };
  }

  const playerOneWins = playerOne.score > playerTwo.score;

  const winner = playerOneWins ? "PLAYER_ONE" : "PLAYER_TWO";

  const winningScore = playerOneWins
    ? playerOne.score
    : playerTwo.score;

  let message: string;

  if (auraDifference >= 300) {
    message = `ABSOLUTE AURA DOMINATION. ${winningScore} AU HAS ENTERED THE CHAT.`;
  } else if (auraDifference >= 150) {
    message = "CRITICAL AURA DIFFERENTIAL. THE LOSER MAY NEVER RECOVER.";
  } else if (auraDifference >= 50) {
    message = "CLEAR AURA ADVANTAGE DETECTED.";
  } else {
    message = "EXTREMELY CLOSE. AURA SCIENTISTS ARE SWEATING.";
  }

  return {
    playerOne,
    playerTwo,
    winner,
    auraDifference,
    message,
  };
}