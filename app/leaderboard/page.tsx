"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    Crown,
    Medal,
    Trophy,
} from "lucide-react";

import { getAuraResult } from "@/lib/aura-session";
import {
    addToLeaderboard,
    getLeaderboardTop,
    getPlayerRank,
} from "@/lib/aura-leaderboard";
import type { LeaderboardEntry } from "@/lib/aura-leaderboard";
import type { AuraResult } from "@/lib/aura-types";

export default function LeaderboardPage() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [result, setResult] = useState<AuraResult | null>(null);
    const [playerName, setPlayerName] = useState("");
    const [playerRank, setPlayerRank] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        setEntries(getLeaderboardTop(10));
        setResult(getAuraResult());
    }, []);

    function refreshLeaderboard() {
        const top = getLeaderboardTop(10);
        setEntries(top);

        if (result) {
            setPlayerRank(getPlayerRank(result.scanMetadata.scanId));
        }
    }

    function handleSubmit() {
        if (!result) {
            return;
        }

        const entry = addToLeaderboard(playerName, result);

        setPlayerName("");
        setSubmitted(true);

        const top = getLeaderboardTop(10);
        setEntries(top);
        setPlayerRank(getPlayerRank(entry.id));
    }

    return (
        <main className="leaderboard-page">
            <div className="leaderboard-grid" />
            <div className="leaderboard-scanlines" />

            <header className="leaderboard-header">
                <Link href="/" className="leaderboard-brand">
                    AURASCAN<span>™</span>
                </Link>

                <div className="leaderboard-system-status">
                    <span className="leaderboard-status-dot" />
                    SYSTEM ONLINE
                </div>

                <div className="leaderboard-code">
                    LB // 001
                </div>
            </header>

            <div className="leaderboard-content">
                <div className="leaderboard-topline">
                    <span>GLOBAL AURA RANKING SYSTEM</span>
                    <span>LOCAL STORAGE // ACTIVE</span>
                </div>

                <section className="leaderboard-title-section">
                    <div>
                        <div className="leaderboard-kicker">
                            <Trophy size={14} />
                            AURA RANKING DATABASE
                        </div>

                        <h1>
                            AURA
                            <span>LEADERBOARD</span>
                        </h1>

                        <p>
                            THE MOST POWERFUL AURAS CURRENTLY DETECTED
                            BY THE SYSTEM.
                        </p>
                    </div>

                    {playerRank !== null && (
                        <div className="leaderboard-rank-readout">
                            <span>YOUR CURRENT RANK</span>
                            <strong>#{playerRank}</strong>
                        </div>
                    )}
                </section>

                {result && (
                    <section className="leaderboard-submit">
                        <div className="leaderboard-submit-info">
                            <span>SUBMIT CURRENT SCAN</span>
                            <strong>
                                {result.score} AU // {result.classification}
                            </strong>
                        </div>

                        <div className="leaderboard-submit-controls">
                            <input
                                value={playerName}
                                onChange={(event) =>
                                    setPlayerName(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        handleSubmit();
                                    }
                                }}
                                maxLength={24}
                                placeholder="ENTER SUBJECT NAME"
                                aria-label="Leaderboard name"
                            />

                            <button
                                type="button"
                                onClick={handleSubmit}
                            >
                                SUBMIT AURA
                                <ArrowRight size={15} />
                            </button>
                        </div>

                        {submitted && (
                            <div className="leaderboard-submit-success">
                                ✓ AURA SIGNATURE REGISTERED
                            </div>
                        )}
                    </section>
                )}

                {!result && (
                    <section className="leaderboard-no-result">
                        <span>NO CURRENT AURA SIGNATURE DETECTED.</span>

                        <Link href="/scan">
                            RUN A SCAN
                            <ArrowRight size={14} />
                        </Link>
                    </section>
                )}

                <section className="leaderboard-table-section">
                    <div className="leaderboard-table-header">
                        <div>RANK</div>
                        <div>SUBJECT</div>
                        <div>CLASSIFICATION</div>
                        <div>AURA SCORE</div>
                    </div>

                    <div className="leaderboard-rows">
                        {entries.map((entry, index) => {
                            const isCurrentPlayer =
                                result?.scanMetadata.scanId === entry.id;

                            return (
                                <div
                                    className={`leaderboard-row ${isCurrentPlayer
                                            ? "leaderboard-row-current"
                                            : ""
                                        }`}
                                    key={entry.id}
                                >
                                    <div className="leaderboard-rank">
                                        {index === 0 && (
                                            <Crown size={15} />
                                        )}

                                        {index === 1 && (
                                            <Medal size={15} />
                                        )}

                                        {index === 2 && (
                                            <Medal size={15} />
                                        )}

                                        <strong>
                                            #{index + 1}
                                        </strong>
                                    </div>

                                    <div className="leaderboard-player">
                                        <span
                                            className="leaderboard-aura-dot"
                                            style={{
                                                backgroundColor: entry.color,
                                                boxShadow: `0 0 12px ${entry.color}`,
                                            }}
                                        />

                                        <strong>{entry.playerName}</strong>

                                        {isCurrentPlayer && (
                                            <span className="leaderboard-you">
                                                YOU
                                            </span>
                                        )}
                                    </div>

                                    <div className="leaderboard-classification">
                                        {entry.classification}
                                    </div>

                                    <div className="leaderboard-score">
                                        <strong>{entry.score}</strong>
                                        <span>AU</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <div className="leaderboard-actions">
                    <Link
                        href="/result"
                        className="leaderboard-action secondary"
                    >
                        <ArrowLeft size={14} />
                        RETURN TO RESULT
                    </Link>

                    <Link
                        href="/battle"
                        className="leaderboard-action primary"
                    >
                        AURA BATTLE
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </div>

            <footer className="leaderboard-footer">
                <span>
                    AURASCAN™ // AURA RESEARCH DIVISION
                </span>

                <span>
                    RANKINGS STORED LOCALLY
                </span>
            </footer>
        </main>
    );
}