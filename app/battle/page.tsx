"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Crosshair,
    Crown,
    FlaskConical,
    RotateCcw,
    Swords,
    Trophy,
    Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { getAuraResult } from "@/lib/aura-session";
import { battleAura } from "@/lib/aura-battle";
import { generateDemoAura } from "@/lib/aura-demo";
import type { AuraResult } from "@/lib/aura-types";
import type { AuraDemoMode } from "@/lib/aura-demo";

const DEMO_MODES: AuraDemoMode[] = [
    "LOW_AURA",
    "DEMONIC",
    "ILLEGAL",
    "INSECURITY",
    "MANIPULATION",
];

export default function BattlePage() {
    const router = useRouter();

    const [playerOne, setPlayerOne] = useState<AuraResult | null>(null);
    const [playerTwo, setPlayerTwo] = useState<AuraResult | null>(null);
    const [battleResult, setBattleResult] = useState<ReturnType<
        typeof battleAura
    > | null>(null);

    const [revealing, setRevealing] = useState(false);
    const [selectedDemo, setSelectedDemo] =
        useState<AuraDemoMode>("ILLEGAL");

    useEffect(() => {
        const result = getAuraResult();

        if (!result) {
            router.replace("/scan");
            return;
        }

        setPlayerOne(result);
    }, [router]);

    function loadDemoOpponent(mode: AuraDemoMode) {
        const demo = generateDemoAura(mode);

        setSelectedDemo(mode);
        setPlayerTwo(demo);
        setBattleResult(null);
        setRevealing(false);
    }

    function startBattle() {
        if (!playerOne || !playerTwo) {
            return;
        }

        setBattleResult(null);
        setRevealing(true);

        window.setTimeout(() => {
            const result = battleAura(playerOne, playerTwo);

            setBattleResult(result);
            setRevealing(false);
        }, 1100);
    }

    function resetBattle() {
        setPlayerTwo(null);
        setBattleResult(null);
        setRevealing(false);
    }

    if (!playerOne) {
        return (
            <main className="battle-page battle-loading">
                <div className="battle-loading-text">
                    INITIALIZING AURA COMBAT SYSTEM...
                </div>
            </main>
        );
    }

    const playerOneWins =
        battleResult?.winner === "PLAYER_ONE";

    const playerTwoWins =
        battleResult?.winner === "PLAYER_TWO";

    const tie =
        battleResult?.winner === "TIE";

    return (
        <main className="battle-page">
            <div className="battle-grid" />
            <div className="battle-scanlines" />

            <header className="battle-header">
                <Link href="/" className="battle-brand">
                    AURASCAN<span>™</span>
                </Link>

                <div className="battle-status">
                    <span className="battle-status-dot" />
                    COMBAT SYSTEM ONLINE
                </div>

                <div className="battle-code">
                    BATTLE // 001
                </div>
            </header>

            <div className="battle-content">
                <div className="battle-topline">
                    <span>AURA COMBAT SIMULATION</span>
                    <span>NON-PHYSICAL // EXTREMELY SERIOUS</span>
                </div>

                <section className="battle-title">
                    <div>
                        <div className="battle-kicker">
                            <Swords size={14} />
                            AURA BATTLE PROTOCOL
                        </div>

                        <h1>
                            AURA
                            <span>BATTLE</span>
                        </h1>

                        <p>
                            TWO AURAS ENTER.
                            <br />
                            ONE AURA LEAVES WITH ITS DIGNITY.
                        </p>
                    </div>

                    <div className="battle-warning">
                        <Zap size={15} />
                        <span>
                            WARNING: AURA DAMAGE MAY BE
                            PSYCHOLOGICAL
                        </span>
                    </div>
                </section>

                <section className="battle-arena">
                    <BattlePlayer
                        label="PLAYER 01"
                        result={playerOne}
                        winner={playerOneWins}
                        loser={playerTwoWins}
                    />

                    <div className="battle-vs">
                        <div className="battle-vs-line" />
                        <motion.div
                            className="battle-vs-core"
                            animate={
                                revealing
                                    ? {
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 3, -3, 0],
                                    }
                                    : undefined
                            }
                            transition={{
                                duration: 0.5,
                                repeat: revealing
                                    ? Infinity
                                    : 0,
                            }}
                        >
                            <span>VS</span>
                        </motion.div>
                        <div className="battle-vs-line" />
                    </div>

                    <BattlePlayer
                        label="PLAYER 02"
                        result={playerTwo}
                        winner={playerTwoWins}
                        loser={playerOneWins}
                        empty={!playerTwo}
                    />
                </section>

                {!playerTwo && (
                    <section className="battle-opponent-panel">
                        <div className="battle-panel-heading">
                            <FlaskConical size={14} />
                            SELECT OPPONENT
                        </div>

                        <div className="battle-demo-label">
                            DEMO / TEST SUBJECTS
                        </div>

                        <div className="battle-demo-grid">
                            {DEMO_MODES.map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    className={`battle-demo-button ${selectedDemo === mode
                                            ? "active"
                                            : ""
                                        }`}
                                    onClick={() =>
                                        loadDemoOpponent(mode)
                                    }
                                >
                                    <span>{mode}</span>
                                    <ArrowRight size={13} />
                                </button>
                            ))}
                        </div>

                        <div className="battle-scan-opponent">
                            <Crosshair size={14} />
                            <span>
                                REAL OPPONENT SCANNING
                                AVAILABLE IN NEXT PROTOCOL
                            </span>
                        </div>
                    </section>
                )}

                {playerTwo && !battleResult && !revealing && (
                    <section className="battle-ready-panel">
                        <div>
                            <span>OPPONENT LOCKED</span>
                            <strong>
                                {playerTwo.classification}
                            </strong>
                        </div>

                        <button
                            type="button"
                            className="battle-launch-button"
                            onClick={startBattle}
                        >
                            INITIATE BATTLE
                            <Swords size={16} />
                        </button>
                    </section>
                )}

                {revealing && (
                    <motion.section
                        className="battle-reveal-panel"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <motion.div
                            className="battle-reveal-line"
                            animate={{
                                scaleX: [0, 1, 0],
                            }}
                            transition={{
                                duration: 1,
                                ease: "easeInOut",
                            }}
                        />

                        <motion.div
                            className="battle-reveal-text"
                            animate={{
                                opacity: [0.3, 1, 0.3],
                            }}
                            transition={{
                                duration: 0.45,
                                repeat: 2,
                            }}
                        >
                            CALCULATING AURA DOMINANCE...
                        </motion.div>
                    </motion.section>
                )}

                <AnimatePresence>
                    {battleResult && !revealing && (
                        <motion.section
                            className="battle-result-panel"
                            initial={{
                                opacity: 0,
                                y: 30,
                                scale: 0.97,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                scale: 1,
                            }}
                            transition={{
                                duration: 0.55,
                                ease: "easeOut",
                            }}
                        >
                            <div className="battle-result-kicker">
                                <Trophy size={15} />
                                BATTLE COMPLETE
                            </div>

                            <div className="battle-result-title">
                                {tie && "AURA EQUILIBRIUM"}
                                {playerOneWins &&
                                    "PLAYER 01 DOMINATES"}
                                {playerTwoWins &&
                                    "PLAYER 02 DOMINATES"}
                            </div>

                            <div className="battle-result-score">
                                <div
                                    className={
                                        playerOneWins
                                            ? "winner"
                                            : ""
                                    }
                                >
                                    <span>PLAYER 01</span>
                                    <strong>
                                        {battleResult.playerOne.score}
                                    </strong>
                                </div>

                                <div className="difference">
                                    <span>AURA DIFFERENCE</span>
                                    <strong>
                                        {battleResult.auraDifference}
                                    </strong>
                                </div>

                                <div
                                    className={
                                        playerTwoWins
                                            ? "winner"
                                            : ""
                                    }
                                >
                                    <span>PLAYER 02</span>
                                    <strong>
                                        {battleResult.playerTwo.score}
                                    </strong>
                                </div>
                            </div>

                            <div className="battle-result-message">
                                <Zap size={16} />
                                <span>
                                    {battleResult.message}
                                </span>
                            </div>

                            <div className="battle-result-actions">
                                <button
                                    type="button"
                                    onClick={resetBattle}
                                    className="battle-action secondary"
                                >
                                    <RotateCcw size={14} />
                                    NEW BATTLE
                                </button>

                                <Link
                                    href="/leaderboard"
                                    className="battle-action primary"
                                >
                                    LEADERBOARD
                                    <ArrowRight size={14} />
                                </Link>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>

                <div className="battle-navigation">
                    <Link href="/result">
                        <ArrowLeft size={14} />
                        RETURN TO RESULT
                    </Link>

                    <Link href="/leaderboard">
                        VIEW LEADERBOARD
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </div>

            <footer className="battle-footer">
                <span>
                    AURASCAN™ // CLASSIFIED AURA RESEARCH DIVISION
                </span>

                <span>
                    MEASURE WHAT CANNOT BE MEASURED.
                </span>
            </footer>
        </main>
    );
}

function BattlePlayer({
    label,
    result,
    winner,
    loser,
    empty = false,
}: {
    label: string;
    result: AuraResult | null;
    winner: boolean;
    loser: boolean;
    empty?: boolean;
}) {
    if (empty || !result) {
        return (
            <div className="battle-player battle-player-empty">
                <div className="battle-player-label">
                    {label}
                </div>

                <div className="battle-empty-ring">
                    <Crosshair size={34} />
                </div>

                <div className="battle-empty-text">
                    AWAITING OPPONENT
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className={`battle-player ${winner ? "battle-player-winner" : ""
                } ${loser ? "battle-player-loser" : ""}`}
            style={
                {
                    "--player-aura": result.color,
                } as React.CSSProperties
            }
            animate={
                winner
                    ? {
                        y: [0, -4, 0],
                    }
                    : undefined
            }
            transition={{
                duration: 1.5,
                repeat: winner ? Infinity : 0,
            }}
        >
            <div className="battle-player-label">
                {label}

                {winner && (
                    <span className="battle-winner-tag">
                        <Crown size={10} />
                        WINNER
                    </span>
                )}
            </div>

            <div className="battle-aura-display">
                <div className="battle-aura-ring outer" />
                <div className="battle-aura-ring middle" />
                <div className="battle-aura-ring inner" />

                <div className="battle-aura-core">
                    <strong>{result.score}</strong>
                    <span>AU</span>
                </div>

                <div className="battle-crosshair horizontal" />
                <div className="battle-crosshair vertical" />
            </div>

            <div
                className="battle-player-color"
                style={{ color: result.color }}
            >
                {result.color}
            </div>

            <div className="battle-player-classification">
                <span>CLASSIFICATION</span>
                <strong>{result.classification}</strong>
            </div>

            <div className="battle-player-personality">
                {result.personality}
            </div>
        </motion.div>
    );
}