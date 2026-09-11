"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Camera,
    Crosshair,
    ShieldAlert,
    Trophy,
    Users,
    Activity,
    RotateCcw,
    AlertTriangle,
} from "lucide-react";

import {
    createAuraBattle,
    type AuraBattle,
    type AuraBattleState,
} from "./battle-api";

type BattlePhase =
    | "IDLE"
    | "INITIALIZING"
    | "WAITING_FOR_SUBJECTS"
    | "WAITING_FOR_OPPONENT"
    | "READY"
    | "SCANNING"
    | "COMPLETE"
    | "ERROR";

type PlayerMeasurement = {
    movement: number;
    faceStability: number;
    brightness: number;
};

function getStatusText(state: AuraBattleState) {
    switch (state.phase) {
        case "INITIALIZING":
            return "INITIALIZING BATTLE SYSTEM";

        case "WAITING_FOR_SUBJECTS":
            return "WAITING FOR SUBJECTS";

        case "WAITING_FOR_OPPONENT":
            return "WAITING FOR OPPONENT";

        case "READY":
            return "TWO SUBJECTS LOCKED";

        case "SCANNING":
            return "AURA BATTLE IN PROGRESS";

        case "COMPLETE":
            return "BATTLE ANALYSIS COMPLETE";

        case "ERROR":
            return "BATTLE SYSTEM ERROR";

        default:
            return "BATTLE SYSTEM READY";
    }
}

function getFaceInstruction(state: AuraBattleState) {
    switch (state.phase) {
        case "WAITING_FOR_SUBJECTS":
            return "STEP INTO THE SCANNER";

        case "WAITING_FOR_OPPONENT":
            return "SECOND SUBJECT REQUIRED";

        case "READY":
            return "SUBJECTS LOCKED // BEGINNING SCAN";

        case "SCANNING":
            return "HOLD POSITION // AURA ACQUISITION ACTIVE";

        case "COMPLETE":
            return "AURA SIGNATURES ACQUIRED";

        case "ERROR":
            return state.error ?? "UNKNOWN BATTLE ERROR";

        default:
            return "POSITION TWO SUBJECTS IN FRAME";
    }
}

function PlayerPanel({
    player,
    measurement,
    side,
    active,
    winner,
}: {
    player: "PLAYER 01" | "PLAYER 02";
    measurement: PlayerMeasurement | null;
    side: "left" | "right";
    active: boolean;
    winner: boolean;
}) {
    const auraColor =
        player === "PLAYER 01"
            ? "#00FF88"
            : "#00D9FF";

    return (
        <div
            className={`battle-player-panel battle-player-${side} ${active ? "battle-player-active" : ""
                } ${winner ? "battle-player-winner" : ""}`}
            style={
                {
                    "--player-color": auraColor,
                } as React.CSSProperties
            }
        >
            <div className="battle-player-panel-top">
                <div className="battle-player-index">
                    {player}
                </div>

                <div className="battle-player-status">
                    <span
                        className={`battle-player-status-dot ${measurement ? "active" : ""
                            }`}
                    />
                    {measurement ? "LOCKED" : "SEARCHING"}
                </div>
            </div>

            <div className="battle-player-title">
                <span>AURA SUBJECT</span>

                <strong>
                    {side === "left" ? "LEFT SIGNATURE" : "RIGHT SIGNATURE"}
                </strong>
            </div>

            <div className="battle-player-readout">
                <div className="battle-mini-metric">
                    <span>MOVEMENT</span>
                    <strong>
                        {measurement
                            ? Math.round(measurement.movement)
                            : "--"}
                    </strong>
                </div>

                <div className="battle-mini-metric">
                    <span>STABILITY</span>
                    <strong>
                        {measurement
                            ? Math.round(measurement.faceStability)
                            : "--"}
                    </strong>
                </div>

                <div className="battle-mini-metric">
                    <span>BRIGHTNESS</span>
                    <strong>
                        {measurement
                            ? Math.round(measurement.brightness)
                            : "--"}
                    </strong>
                </div>
            </div>

            <div className="battle-player-meter">
                <div
                    className="battle-player-meter-fill"
                    style={{
                        width: measurement
                            ? `${Math.min(
                                100,
                                Math.max(0, measurement.faceStability),
                            )}%`
                            : "0%",
                    }}
                />
            </div>

            {winner && (
                <div className="battle-winner-tag">
                    <Trophy size={12} />
                    WINNER
                </div>
            )}
        </div>
    );
}

function BattleResult({
    state,
    onReplay,
}: {
    state: AuraBattleState;
    onReplay: () => void;
}) {
    const result = state.result;

    if (!result) {
        return null;
    }

    const playerOneWon =
        result.winner === "PLAYER_ONE";

    const playerTwoWon =
        result.winner === "PLAYER_TWO";

    const tie =
        result.winner === "TIE";

    return (
        <div className="battle-result-overlay">
            <div className="battle-result-panel">
                <div className="battle-result-kicker">
                    <Trophy size={14} />
                    FINAL AURA ANALYSIS
                </div>

                <div className="battle-result-title">
                    {tie ? (
                        <>
                            AURA
                            <span>EQUILIBRIUM</span>
                        </>
                    ) : (
                        <>
                            PLAYER
                            <span>
                                {playerOneWon ? "01 WINS" : "02 WINS"}
                            </span>
                        </>
                    )}
                </div>

                <div className="battle-result-scores">
                    <div
                        className={`battle-result-player ${playerOneWon ? "winning" : ""
                            }`}
                    >
                        <span>PLAYER 01</span>
                        <strong>{result.playerOne.score}</strong>
                        <small>AURA UNITS</small>
                    </div>

                    <div className="battle-result-vs">
                        <span>VS</span>
                        <strong>{result.auraDifference}</strong>
                        <small>DIFFERENCE</small>
                    </div>

                    <div
                        className={`battle-result-player ${playerTwoWon ? "winning" : ""
                            }`}
                    >
                        <span>PLAYER 02</span>
                        <strong>{result.playerTwo.score}</strong>
                        <small>AURA UNITS</small>
                    </div>
                </div>

                <div className="battle-result-message">
                    {result.message}
                </div>

                <div className="battle-result-classifications">
                    <div>
                        <span>PLAYER 01</span>
                        <strong>
                            {result.playerOne.classification}
                        </strong>
                    </div>

                    <div>
                        <span>PLAYER 02</span>
                        <strong>
                            {result.playerTwo.classification}
                        </strong>
                    </div>
                </div>

                <div className="battle-result-actions">
                    <button
                        type="button"
                        className="battle-result-replay"
                        onClick={onReplay}
                    >
                        <RotateCcw size={15} />
                        BATTLE AGAIN
                    </button>

                    <Link
                        href="/leaderboard"
                        className="battle-result-leaderboard"
                    >
                        LEADERBOARD
                        <ArrowRight size={15} />
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function BattlePage() {
    const router = useRouter();

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const battleRef = useRef<AuraBattle | null>(null);

    const [state, setState] =
        useState<AuraBattleState>({
            phase: "IDLE",
            progress: 0,
            elapsedMs: 0,
            faceCount: 0,
            measurements: {
                playerOne: null,
                playerTwo: null,
                faceStatus: "NO_SUBJECTS",
                faceCount: 0,
            },
            result: null,
            error: null,
        });

    const [time, setTime] = useState("");
    const [cameraError, setCameraError] = useState("");

    useEffect(() => {
        const updateClock = () => {
            setTime(
                new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                }),
            );
        };

        updateClock();

        const interval = window.setInterval(
            updateClock,
            1000,
        );

        return () => {
            window.clearInterval(interval);
        };
    }, []);

    async function initializeBattle() {
        if (!videoRef.current || !canvasRef.current) {
            return;
        }

        setCameraError("");

        try {
            const battle = await createAuraBattle(
                videoRef.current,
                canvasRef.current,
                (nextState) => {
                    setState(nextState);
                },
            );

            battleRef.current = battle;

            battle.start();
        } catch (error) {
            setCameraError(
                error instanceof Error
                    ? error.message
                    : "AURA BATTLE CAMERA INITIALIZATION FAILED.",
            );

            setState((current) => ({
                ...current,
                phase: "ERROR",
                error:
                    error instanceof Error
                        ? error.message
                        : "AURA BATTLE CAMERA INITIALIZATION FAILED.",
            }));
        }
    }

    useEffect(() => {
        void initializeBattle();

        return () => {
            battleRef.current?.destroy();
            battleRef.current = null;
        };
    }, []);

    function handleReplay() {
        battleRef.current?.stop();

        setCameraError("");

        setState({
            phase: "IDLE",
            progress: 0,
            elapsedMs: 0,
            faceCount: 0,
            measurements: {
                playerOne: null,
                playerTwo: null,
                faceStatus: "NO_SUBJECTS",
                faceCount: 0,
            },
            result: null,
            error: null,
        });

        window.setTimeout(() => {
            void initializeBattle();
        }, 100);
    }

    const isScanning =
        state.phase === "READY" ||
        state.phase === "SCANNING";

    const isComplete =
        state.phase === "COMPLETE" &&
        state.result !== null;

    const tooManySubjects =
        state.faceCount > 2 ||
        state.measurements.faceStatus ===
        "TOO_MANY_SUBJECTS";

    const playerOneWinner =
        state.result?.winner === "PLAYER_ONE";

    const playerTwoWinner =
        state.result?.winner === "PLAYER_TWO";

    return (
        <main className="battle-page">
            <div className="battle-grid" />
            <div className="battle-scanlines" />

            <header className="battle-header">
                <Link
                    href="/"
                    className="battle-brand"
                >
                    AURASCAN<span>™</span>
                </Link>

                <div className="battle-header-center">
                    <span className="battle-status-dot" />
                    BATTLE SYSTEM ONLINE
                </div>

                <div className="battle-clock">
                    {time}
                </div>
            </header>

            <div className="battle-content">
                <div className="battle-topline">
                    <span>
                        AURA BATTLE // TWO SUBJECT PROTOCOL
                    </span>

                    <span>
                        SINGLE CAMERA // LIVE ANALYSIS
                    </span>
                </div>

                <section className="battle-title-section">
                    <div>
                        <div className="battle-kicker">
                            <Users size={14} />
                            REAL-TIME AURA COMPARISON
                        </div>

                        <h1>
                            AURA
                            <span>BATTLE</span>
                        </h1>

                        <p>
                            TWO SUBJECTS. ONE CAMERA. ONE WINNER.
                        </p>
                    </div>

                    <div className="battle-face-counter">
                        <span>DETECTED SUBJECTS</span>
                        <strong>
                            {String(state.faceCount).padStart(2, "0")}
                        </strong>
                    </div>
                </section>

                <section className="battle-scanner-section">
                    <div className="battle-player-column">
                        <PlayerPanel
                            player="PLAYER 01"
                            measurement={
                                state.measurements.playerOne
                            }
                            side="left"
                            active={
                                state.measurements.playerOne !== null
                            }
                            winner={playerOneWinner}
                        />
                    </div>

                    <div className="battle-camera-frame">
                        <video
                            ref={videoRef}
                            className="battle-video"
                            autoPlay
                            muted
                            playsInline
                        />

                        <canvas
                            ref={canvasRef}
                            className="battle-canvas"
                            aria-hidden="true"
                        />

                        <div className="battle-camera-overlay" />

                        <div className="battle-camera-grid" />

                        <div className="battle-camera-crosshair">
                            <Crosshair size={46} />
                        </div>

                        <div className="battle-camera-corner battle-camera-corner-tl" />
                        <div className="battle-camera-corner battle-camera-corner-tr" />
                        <div className="battle-camera-corner battle-camera-corner-bl" />
                        <div className="battle-camera-corner battle-camera-corner-br" />

                        <div className="battle-camera-label battle-camera-label-tl">
                            <Camera size={12} />
                            LIVE OPTICAL FEED
                        </div>

                        <div className="battle-camera-label battle-camera-label-tr">
                            CAM-01
                        </div>

                        <div className="battle-camera-bottom-readout">
                            <span>FACE STATUS</span>
                            <strong>
                                {state.measurements.faceStatus.replaceAll(
                                    "_",
                                    " ",
                                )}
                            </strong>
                        </div>

                        <div className="battle-scanner-status">
                            <span className="battle-scanner-status-dot" />
                            {getStatusText(state)}
                        </div>

                        <div className="battle-scanner-instruction">
                            {getFaceInstruction(state)}
                        </div>

                        {isScanning && (
                            <div className="battle-scan-progress">
                                <div className="battle-scan-progress-header">
                                    <span>
                                        AURA ACQUISITION
                                    </span>

                                    <strong>
                                        {state.progress}%
                                    </strong>
                                </div>

                                <div className="battle-scan-progress-track">
                                    <div
                                        className="battle-scan-progress-fill"
                                        style={{
                                            width: `${state.progress}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {tooManySubjects && (
                            <div className="battle-too-many">
                                <AlertTriangle size={18} />
                                <strong>
                                    TOO MANY SUBJECTS
                                </strong>
                                <span>
                                    EXACTLY TWO HUMANS REQUIRED
                                </span>
                            </div>
                        )}

                        {cameraError && (
                            <div className="battle-camera-error">
                                <ShieldAlert size={17} />
                                {cameraError}
                            </div>
                        )}
                    </div>

                    <div className="battle-player-column">
                        <PlayerPanel
                            player="PLAYER 02"
                            measurement={
                                state.measurements.playerTwo
                            }
                            side="right"
                            active={
                                state.measurements.playerTwo !== null
                            }
                            winner={playerTwoWinner}
                        />
                    </div>
                </section>

                <section className="battle-telemetry">
                    <div className="battle-telemetry-title">
                        <Activity size={13} />
                        LIVE BATTLE TELEMETRY
                    </div>

                    <div className="battle-telemetry-grid">
                        <div>
                            <span>PROTOCOL</span>
                            <strong>AB-02</strong>
                        </div>

                        <div>
                            <span>SUBJECTS</span>
                            <strong>
                                {state.faceCount}/2
                            </strong>
                        </div>

                        <div>
                            <span>PROGRESS</span>
                            <strong>
                                {state.progress}%
                            </strong>
                        </div>

                        <div>
                            <span>ELAPSED</span>
                            <strong>
                                {(state.elapsedMs / 1000).toFixed(1)}s
                            </strong>
                        </div>

                        <div>
                            <span>CAMERA</span>
                            <strong>ACTIVE</strong>
                        </div>
                    </div>
                </section>

                <div className="battle-actions">
                    <Link
                        href="/"
                        className="battle-action secondary"
                    >
                        <ArrowLeft size={14} />
                        EXIT BATTLE
                    </Link>

                    <Link
                        href="/leaderboard"
                        className="battle-action secondary"
                    >
                        LEADERBOARD
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </div>

            <footer className="battle-footer">
                <span>
                    AURASCAN™ // CLASSIFIED AURA RESEARCH DIVISION
                </span>

                <span>
                    TWO SUBJECT PROTOCOL // AB-02
                </span>
            </footer>

            {isComplete && (
                <BattleResult
                    state={state}
                    onReplay={handleReplay}
                />
            )}
        </main>
    );
}