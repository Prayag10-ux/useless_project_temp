"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    RotateCcw,
    Trophy,
    Users,
    Zap,
} from "lucide-react";

import {
    createAuraBattle,
    type AuraBattle,
    type AuraBattleState,
} from "./battle-api";

const GREEN = "#00ff88";
const CYAN = "#00d9ff";

function getPhaseLabel(phase: AuraBattleState["phase"]) {
    switch (phase) {
        case "IDLE":
            return "SYSTEM STANDBY";
        case "INITIALIZING":
            return "INITIALIZING ARENA";
        case "WAITING_FOR_SUBJECTS":
            return "WAITING FOR FIGHTERS";
        case "WAITING_FOR_OPPONENT":
            return "OPPONENT REQUIRED";
        case "READY":
            return "READY";
        case "SCANNING":
            return "AURA EXTRACTION";
        case "COMPLETE":
            return "SCAN COMPLETE";
        case "ERROR":
            return "SYSTEM ERROR";
        default:
            return "UNKNOWN";
    }
}

function getInstruction(state: AuraBattleState) {
    switch (state.phase) {
        case "WAITING_FOR_SUBJECTS":
            return "STEP INTO THE ARENA";
        case "WAITING_FOR_OPPONENT":
            return "WAITING FOR SECOND FIGHTER";
        case "READY":
            return "LOCKED // BEGINNING SCAN";
        case "SCANNING":
            return "SIGNATURES BEING EXTRACTED";
        case "COMPLETE":
            return "AURA SIGNATURES LOCKED";
        case "ERROR":
            return state.error || "UNABLE TO CONTINUE";
        default:
            return "PREPARING BATTLE SYSTEM";
    }
}

function metricValue(
    value: number | null | undefined,
    fallback = 0
) {
    if (typeof value !== "number" || Number.isNaN(value)) {
        return fallback;
    }

    return Math.max(0, Math.min(100, value));
}

function PlayerCard({
    player,
    measurement,
    active,
    winner,
}: {
    player: "01" | "02";
    measurement: any;
    active: boolean;
    winner: boolean;
}) {
    const isOne = player === "01";
    const accent = isOne ? GREEN : CYAN;

    const movement = metricValue(measurement?.movement);
    const stability = metricValue(measurement?.stability);
    const brightness = metricValue(measurement?.brightness);

    const power = Math.round(
        (movement + stability + brightness) / 3
    );

    return (
        <div
            className={`arena-player ${isOne ? "arena-player-one" : "arena-player-two"
                } ${active ? "arena-player-active" : ""} ${winner ? "arena-player-winner" : ""
                }`}
            style={
                {
                    "--player-accent": accent,
                } as React.CSSProperties
            }
        >
            <div className="arena-player-glow" />

            <div className="arena-player-top">
                <div>
                    <div className="arena-player-number">
                        PLAYER {player}
                    </div>

                    <div className="arena-player-name">
                        SUBJECT {player}
                    </div>
                </div>

                <div className="arena-player-live">
                    <span />
                    LIVE
                </div>
            </div>

            <div className="arena-power">
                <div className="arena-power-label">
                    <span>AURA POWER</span>
                    <strong>{power}%</strong>
                </div>

                <div className="arena-power-track">
                    <div
                        className="arena-power-fill"
                        style={{ width: `${power}%` }}
                    />
                </div>
            </div>

            <div className="arena-metrics">
                <div className="arena-metric">
                    <span>MOVEMENT</span>
                    <strong>{Math.round(movement)}</strong>
                </div>

                <div className="arena-metric">
                    <span>STABILITY</span>
                    <strong>{Math.round(stability)}</strong>
                </div>

                <div className="arena-metric">
                    <span>BRIGHTNESS</span>
                    <strong>{Math.round(brightness)}</strong>
                </div>
            </div>

            {winner && (
                <div className="arena-winner-badge">
                    <Trophy size={13} />
                    AURA DOMINANT
                </div>
            )}
        </div>
    );
}

function ResultScreen({
    state,
    onReplay,
}: {
    state: AuraBattleState;
    onReplay: () => void;
}) {
    const result: any = state.result;

    const playerOneScore =
        result?.playerOne?.score ??
        result?.playerOneScore ??
        result?.scores?.playerOne ??
        0;

    const playerTwoScore =
        result?.playerTwo?.score ??
        result?.playerTwoScore ??
        result?.scores?.playerTwo ??
        0;

    const playerOneClass =
        result?.playerOne?.classification ??
        result?.playerOneClassification ??
        result?.classifications?.playerOne ??
        "UNKNOWN";

    const playerTwoClass =
        result?.playerTwo?.classification ??
        result?.playerTwoClassification ??
        result?.classifications?.playerTwo ??
        "UNKNOWN";

    const winner =
        result?.winner ??
        (playerOneScore > playerTwoScore
            ? "PLAYER 01"
            : playerTwoScore > playerOneScore
                ? "PLAYER 02"
                : "DRAW");

    const isDraw = winner === "DRAW";

    return (
        <div className="battle-result-screen">
            <div className="result-noise" />

            <div className="result-kicker">
                AURASCAN // BATTLE COMPLETE
            </div>

            <div className="result-title">
                {isDraw ? "SIGNATURE CLASH" : "AURA DOMINANT"}
            </div>

            <div className="result-winner">
                {winner}
            </div>

            <div className="result-vs-row">
                <div className="result-player">
                    <span>PLAYER 01</span>
                    <strong>{playerOneScore}</strong>
                    <small>{playerOneClass}</small>
                </div>

                <div className="result-versus">VS</div>

                <div className="result-player">
                    <span>PLAYER 02</span>
                    <strong>{playerTwoScore}</strong>
                    <small>{playerTwoClass}</small>
                </div>
            </div>

            <div className="result-divider" />

            <div className="result-status">
                TWO SUBJECT PROTOCOL COMPLETE
                <span> // SIGNATURES ARCHIVED</span>
            </div>

            <div className="result-actions">
                <button onClick={onReplay}>
                    <RotateCcw size={16} />
                    REMATCH
                </button>

                <Link href="/leaderboard">
                    <Trophy size={16} />
                    LEADERBOARD
                </Link>
            </div>
        </div>
    );
}

export default function BattlePage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const battleRef = useRef<AuraBattle | null>(null);

    const [state, setState] = useState<AuraBattleState>({
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

    const [starting, setStarting] = useState(true);

    async function initializeBattle() {
        if (!videoRef.current || !canvasRef.current) return;

        try {
            setStarting(true);

            const battle = await createAuraBattle(
                videoRef.current,
                canvasRef.current,
                (nextState) => {
                    setState(nextState);
                }
            );

            battleRef.current = battle;
            battle.start();
        } catch (error) {
            console.error(error);

            setState((previous) => ({
                ...previous,
                phase: "ERROR",
                error:
                    error instanceof Error
                        ? error.message
                        : "CAMERA INITIALIZATION FAILED",
            }));
        } finally {
            setStarting(false);
        }
    }

    useEffect(() => {
        initializeBattle();

        return () => {
            battleRef.current?.destroy();
            battleRef.current = null;
        };
    }, []);

    function replay() {
        battleRef.current?.stop();
        battleRef.current = null;

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

        setTimeout(() => {
            initializeBattle();
        }, 150);
    }

    const scanning =
        state.phase === "READY" ||
        state.phase === "SCANNING";

    const complete =
        state.phase === "COMPLETE" &&
        Boolean(state.result);

    const playerOne =
        state.measurements?.playerOne;

    const playerTwo =
        state.measurements?.playerTwo;

    if (complete) {
        return (
            <main className="battle-page">
                <ResultScreen
                    state={state}
                    onReplay={replay}
                />

                <style jsx global>{battleStyles}</style>
            </main>
        );
    }

    return (
        <main className="battle-page">
            <div className="battle-bg-grid" />
            <div className="battle-scanlines" />

            <header className="battle-nav">
                <Link href="/" className="battle-back">
                    <ArrowLeft size={15} />
                    EXIT
                </Link>

                <div className="battle-logo">
                    AURASCAN<span>™</span>
                </div>

                <div className="battle-nav-right">
                    <span className="protocol">
                        AB-02
                    </span>

                    <span
                        className={`system-dot ${state.phase === "ERROR"
                            ? "system-dot-error"
                            : ""
                            }`}
                    />

                    <span>
                        {getPhaseLabel(state.phase)}
                    </span>
                </div>
            </header>

            <section className="battle-heading">
                <div className="heading-eyebrow">
                    <Zap size={13} />
                    LIVE AURA COMBAT PROTOCOL
                </div>

                <h1>
                    AURA
                    <span>BATTLE</span>
                </h1>

                <p>
                    TWO SIGNATURES ENTER. ONE AURA DOMINATES.
                </p>
            </section>

            <section className="battle-arena">
                <PlayerCard
                    player="01"
                    measurement={playerOne}
                    active={scanning}
                    winner={
                        Boolean(state.result) &&
                        state.result?.winner === "PLAYER_ONE"
                    }
                />

                <div className="arena-center">
                    <div className="arena-vs">
                        <span>VS</span>
                    </div>

                    <div className="arena-camera">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="arena-video"
                        />

                        <canvas
                            ref={canvasRef}
                            className="arena-canvas"
                        />

                        <div className="camera-grid" />

                        <div className="camera-scan-beam" />

                        <div className="camera-crosshair">
                            <i />
                            <i />
                            <i />
                            <i />
                        </div>

                        <div className="camera-corner tl" />
                        <div className="camera-corner tr" />
                        <div className="camera-corner bl" />
                        <div className="camera-corner br" />

                        <div className="camera-top-label">
                            <span>●</span>
                            LIVE FEED
                        </div>

                        <div className="camera-bottom-label">
                            <span>
                                SUBJECTS: {state.faceCount}
                            </span>

                            <span>
                                AB-02 // OPTICAL
                            </span>
                        </div>

                        {starting && (
                            <div className="camera-loading">
                                <div className="loading-ring" />
                                <span>
                                    INITIALIZING
                                    <br />
                                    CAMERA SYSTEM
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="arena-status">
                        <div className="status-icon">
                            <span />
                        </div>

                        <div>
                            <strong>
                                {getInstruction(state)}
                            </strong>

                            <small>
                                {state.phase === "SCANNING"
                                    ? `${Math.round(
                                        state.progress
                                    )}% AURA SIGNATURE CAPTURED`
                                    : "OPTICAL SUBJECT ACQUISITION"}
                            </small>
                        </div>
                    </div>

                    <div className="arena-progress">
                        <div
                            className="arena-progress-fill"
                            style={{
                                width: `${Math.min(
                                    100,
                                    Math.max(0, state.progress)
                                )}%`,
                            }}
                        />
                    </div>

                    <div className="arena-clock">
                        <span>SCAN TIME</span>

                        <strong>
                            {(state.elapsedMs / 1000)
                                .toFixed(2)
                                .padStart(5, "0")}
                        </strong>
                    </div>
                </div>

                <PlayerCard
                    player="02"
                    measurement={playerTwo}
                    active={scanning}
                    winner={
                        Boolean(state.result) &&
                        state.result?.winner === "PLAYER_TWO"
                    }
                />
            </section>

            <section className="battle-bottom">
                <div className="battle-protocol">
                    <Users size={15} />

                    <div>
                        <strong>TWO SUBJECT PROTOCOL</strong>
                        <span>
                            EXACTLY TWO FACES REQUIRED
                        </span>
                    </div>
                </div>

                <div className="battle-progress-copy">
                    {scanning
                        ? "EXTRACTING AURA SIGNATURES..."
                        : "AWAITING SUBJECT LOCK"}
                </div>

                <button
                    className="battle-reset"
                    onClick={replay}
                >
                    <RotateCcw size={14} />
                    RESET
                </button>
            </section>

            {state.faceCount >= 3 && (
                <div className="battle-warning">
                    <strong>⚠ MULTIPLE SUBJECTS DETECTED</strong>
                    <span>
                        REMOVE ADDITIONAL SUBJECTS FROM FRAME
                    </span>
                </div>
            )}

            {state.error && (
                <div className="battle-error">
                    <strong>SYSTEM ERROR</strong>
                    <span>{state.error}</span>
                </div>
            )}

            <footer className="battle-footer">
                <span>
                    AURASCAN™ // CLASSIFIED AURA RESEARCH DIVISION
                </span>

                <span>
                    BATTLE ENGINE ONLINE
                </span>
            </footer>

            <style jsx global>{battleStyles}</style>
        </main>
    );
}

const battleStyles = `
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    background: #010403;
  }

  .battle-page {
    min-height: 100vh;
    position: relative;
    overflow: hidden;
    color: #f4fff9;
    background:
      radial-gradient(
        ellipse at 50% 48%,
        rgba(0, 255, 136, 0.055),
        transparent 42%
      ),
      radial-gradient(
        ellipse at 50% 100%,
        rgba(0, 217, 255, 0.035),
        transparent 48%
      ),
      #010403;
    font-family:
      var(--font-mono),
      "Courier New",
      monospace;
  }

  .battle-bg-grid {
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: .17;
    background-image:
      linear-gradient(
        rgba(255,255,255,.045) 1px,
        transparent 1px
      ),
      linear-gradient(
        90deg,
        rgba(255,255,255,.045) 1px,
        transparent 1px
      );
    background-size: 52px 52px;
    mask-image:
      linear-gradient(
        to bottom,
        transparent,
        black 18%,
        black 82%,
        transparent
      );
  }

  .battle-scanlines {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 50;
    opacity: .035;
    background:
      repeating-linear-gradient(
        to bottom,
        transparent 0,
        transparent 3px,
        rgba(255,255,255,.5) 4px
      );
  }

  .battle-nav {
    height: 68px;
    padding: 0 34px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(255,255,255,.1);
    position: relative;
    z-index: 10;
    background: rgba(1,4,3,.72);
    backdrop-filter: blur(14px);
  }

  .battle-back {
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(255,255,255,.52);
    text-decoration: none;
    font-size: 10px;
    letter-spacing: .16em;
    transition: color .2s;
  }

  .battle-back:hover {
    color: #fff;
  }

  .battle-logo {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: 14px;
    font-weight: 900;
    letter-spacing: .3em;
  }

  .battle-logo span {
    font-size: 7px;
    color: ${GREEN};
    vertical-align: top;
  }

  .battle-nav-right {
    display: flex;
    align-items: center;
    gap: 10px;
    color: rgba(255,255,255,.5);
    font-size: 9px;
    letter-spacing: .13em;
  }

  .protocol {
    color: rgba(255,255,255,.25);
  }

  .system-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${GREEN};
    box-shadow: 0 0 12px ${GREEN};
    animation: systemPulse 1.3s infinite;
  }

  .system-dot-error {
    background: #ff5050;
    box-shadow: 0 0 12px #ff5050;
  }

  @keyframes systemPulse {
    50% {
      opacity: .35;
    }
  }

  .battle-heading {
    text-align: center;
    position: relative;
    z-index: 5;
    padding: 42px 20px 28px;
  }

  .heading-eyebrow {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: ${GREEN};
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .22em;
    margin-bottom: 13px;
  }

  .battle-heading h1 {
    margin: 0;
    font-size: clamp(42px, 6vw, 76px);
    line-height: .9;
    letter-spacing: -.05em;
    font-weight: 900;
  }

  .battle-heading h1 span {
    display: block;
    color: transparent;
    -webkit-text-stroke: 1px rgba(255,255,255,.6);
  }

  .battle-heading p {
    margin: 17px 0 0;
    color: rgba(255,255,255,.28);
    font-size: 9px;
    letter-spacing: .28em;
  }

  .battle-arena {
    width: min(1420px, calc(100% - 50px));
    margin: 0 auto;
    display: grid;
    grid-template-columns: minmax(220px, 1fr) minmax(440px, 1.65fr) minmax(220px, 1fr);
    gap: 20px;
    align-items: center;
    position: relative;
    z-index: 5;
  }

  .arena-player {
    min-height: 300px;
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,.12);
    background:
      linear-gradient(
        145deg,
        rgba(255,255,255,.045),
        rgba(255,255,255,.008)
      );
    padding: 24px;
    transition:
      transform .35s ease,
      border-color .35s ease,
      box-shadow .35s ease;
  }

  .arena-player-one {
    --player-accent: ${GREEN};
  }

  .arena-player-two {
    --player-accent: ${CYAN};
  }

  .arena-player-active {
    transform: translateY(-5px);
    border-color: color-mix(
      in srgb,
      var(--player-accent) 65%,
      transparent
    );
    box-shadow:
      0 0 45px
      color-mix(
        in srgb,
        var(--player-accent) 10%,
        transparent
      ),
      inset 0 0 45px
      color-mix(
        in srgb,
        var(--player-accent) 5%,
        transparent
      );
  }

  .arena-player-winner {
    transform: translateY(-7px) scale(1.025);
    border-color: var(--player-accent);
    box-shadow:
      0 0 60px
      color-mix(
        in srgb,
        var(--player-accent) 18%,
        transparent
      );
  }

  .arena-player-glow {
    position: absolute;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    right: -100px;
    top: -100px;
    background: var(--player-accent);
    filter: blur(80px);
    opacity: .08;
    pointer-events: none;
  }

  .arena-player-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .arena-player-number {
    color: var(--player-accent);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .2em;
  }

  .arena-player-name {
    margin-top: 8px;
    font-size: 21px;
    font-weight: 900;
    letter-spacing: .08em;
  }

  .arena-player-live {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 8px;
    color: rgba(255,255,255,.38);
    letter-spacing: .14em;
  }

  .arena-player-live span {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--player-accent);
    box-shadow: 0 0 9px var(--player-accent);
  }

  .arena-power {
    margin-top: 55px;
  }

  .arena-power-label {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 9px;
  }

  .arena-power-label span {
    font-size: 8px;
    letter-spacing: .16em;
    color: rgba(255,255,255,.34);
  }

  .arena-power-label strong {
    color: var(--player-accent);
    font-size: 20px;
    text-shadow: 0 0 15px var(--player-accent);
  }

  .arena-power-track {
    height: 6px;
    background: rgba(255,255,255,.06);
    overflow: hidden;
  }

  .arena-power-fill {
    height: 100%;
    position: relative;
    background: var(--player-accent);
    box-shadow: 0 0 18px var(--player-accent);
    transition: width .25s linear;
  }

  .arena-power-fill::after {
    content: "";
    position: absolute;
    right: 0;
    top: 0;
    width: 40px;
    height: 100%;
    background: #fff;
    filter: blur(8px);
    opacity: .7;
  }

  .arena-metrics {
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 10px;
    margin-top: 32px;
    padding-top: 20px;
    border-top: 1px solid rgba(255,255,255,.08);
  }

  .arena-metric span {
    display: block;
    font-size: 7px;
    color: rgba(255,255,255,.3);
    letter-spacing: .1em;
    margin-bottom: 7px;
  }

  .arena-metric strong {
    font-size: 14px;
    color: rgba(255,255,255,.78);
  }

  .arena-winner-badge {
    position: absolute;
    left: 24px;
    bottom: 22px;
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--player-accent);
    font-size: 8px;
    font-weight: 900;
    letter-spacing: .14em;
    animation: winnerPulse 1s infinite;
  }

  @keyframes winnerPulse {
    50% {
      opacity: .45;
    }
  }

  .arena-center {
    min-width: 0;
    position: relative;
  }

  .arena-vs {
    position: absolute;
    z-index: 20;
    left: 50%;
    top: -27px;
    transform: translateX(-50%);
    width: 70px;
    height: 54px;
    display: grid;
    place-items: center;
    background: #010403;
    border: 1px solid rgba(255,255,255,.2);
    clip-path: polygon(
      12% 0,
      88% 0,
      100% 50%,
      88% 100%,
      12% 100%,
      0 50%
    );
  }

  .arena-vs span {
    color: #fff;
    font-size: 15px;
    font-weight: 900;
    font-style: italic;
    letter-spacing: .08em;
  }

  .arena-camera {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    min-height: 330px;
    overflow: hidden;
    background: #000;
    border: 1px solid rgba(255,255,255,.2);
    box-shadow:
      0 0 0 1px rgba(255,255,255,.025),
      0 0 80px rgba(0,255,136,.07),
      inset 0 0 80px rgba(0,0,0,.8);
  }

  .arena-video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scaleX(-1);
    filter:
      brightness(.72)
      contrast(1.08)
      saturate(.75);
  }

  .arena-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 5;
  }

  .camera-grid {
    position: absolute;
    inset: 0;
    z-index: 6;
    pointer-events: none;
    opacity: .28;
    background-image:
      linear-gradient(
        rgba(0,255,136,.09) 1px,
        transparent 1px
      ),
      linear-gradient(
        90deg,
        rgba(0,255,136,.09) 1px,
        transparent 1px
      );
    background-size: 42px 42px;
  }

  .camera-scan-beam {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 2px;
    z-index: 8;
    background: ${GREEN};
    box-shadow:
      0 0 12px ${GREEN},
      0 0 35px rgba(0,255,136,.65);
    opacity: .5;
    animation: cameraScan 3s linear infinite;
  }

  @keyframes cameraScan {
    from {
      top: 4%;
    }
    to {
      top: 96%;
    }
  }

  .camera-crosshair {
    position: absolute;
    z-index: 9;
    left: 50%;
    top: 50%;
    width: 95px;
    height: 95px;
    transform: translate(-50%,-50%);
    border: 1px solid rgba(255,255,255,.18);
    border-radius: 50%;
    box-shadow:
      0 0 30px rgba(0,255,136,.08);
    animation: crosshairPulse 2s infinite;
  }

  .camera-crosshair::before,
  .camera-crosshair::after {
    content: "";
    position: absolute;
    background: rgba(255,255,255,.3);
  }

  .camera-crosshair::before {
    width: 1px;
    height: 125%;
    left: 50%;
    top: -12.5%;
  }

  .camera-crosshair::after {
    height: 1px;
    width: 125%;
    top: 50%;
    left: -12.5%;
  }

  @keyframes crosshairPulse {
    50% {
      transform:
        translate(-50%,-50%)
        scale(1.08);
      opacity: .7;
    }
  }

  .camera-corner {
    position: absolute;
    z-index: 10;
    width: 32px;
    height: 32px;
    border-color: rgba(255,255,255,.65);
    border-style: solid;
  }

  .camera-corner.tl {
    left: 18px;
    top: 18px;
    border-width: 2px 0 0 2px;
  }

  .camera-corner.tr {
    right: 18px;
    top: 18px;
    border-width: 2px 2px 0 0;
  }

  .camera-corner.bl {
    left: 18px;
    bottom: 18px;
    border-width: 0 0 2px 2px;
  }

  .camera-corner.br {
    right: 18px;
    bottom: 18px;
    border-width: 0 2px 2px 0;
  }

  .camera-top-label,
  .camera-bottom-label {
    position: absolute;
    z-index: 15;
    left: 20px;
    right: 20px;
    display: flex;
    justify-content: space-between;
    color: rgba(255,255,255,.48);
    font-size: 8px;
    letter-spacing: .16em;
  }

  .camera-top-label {
    top: 17px;
  }

  .camera-top-label span {
    color: ${GREEN};
    text-shadow: 0 0 10px ${GREEN};
  }

  .camera-bottom-label {
    bottom: 17px;
  }

  .camera-loading {
    position: absolute;
    inset: 0;
    z-index: 30;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 14px;
    background: rgba(0,0,0,.72);
    backdrop-filter: blur(3px);
    text-align: center;
    color: rgba(255,255,255,.6);
    font-size: 8px;
    letter-spacing: .18em;
    line-height: 1.7;
  }

  .loading-ring {
    width: 34px;
    height: 34px;
    border: 1px solid rgba(255,255,255,.12);
    border-top-color: ${GREEN};
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .arena-status {
    margin-top: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    text-align: left;
  }

  .status-icon {
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(0,255,136,.25);
  }

  .status-icon span {
    width: 7px;
    height: 7px;
    background: ${GREEN};
    box-shadow: 0 0 13px ${GREEN};
    animation: systemPulse 1s infinite;
  }

  .arena-status strong {
    display: block;
    color: rgba(255,255,255,.85);
    font-size: 9px;
    letter-spacing: .16em;
  }

  .arena-status small {
    display: block;
    margin-top: 4px;
    color: rgba(255,255,255,.25);
    font-size: 7px;
    letter-spacing: .12em;
  }

  .arena-progress {
    height: 3px;
    margin-top: 15px;
    background: rgba(255,255,255,.06);
    overflow: hidden;
  }

  .arena-progress-fill {
    height: 100%;
    background:
      linear-gradient(
        90deg,
        ${GREEN},
        ${CYAN}
      );
    box-shadow:
      0 0 15px ${GREEN};
    transition: width .15s linear;
  }

  .arena-clock {
    display: flex;
    justify-content: center;
    align-items: baseline;
    gap: 9px;
    margin-top: 12px;
  }

  .arena-clock span {
    color: rgba(255,255,255,.23);
    font-size: 7px;
    letter-spacing: .15em;
  }

  .arena-clock strong {
    color: rgba(255,255,255,.65);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  .battle-bottom {
    width: min(1420px, calc(100% - 50px));
    margin: 24px auto 0;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    align-items: center;
    gap: 20px;
    padding: 15px 18px;
    border-top: 1px solid rgba(255,255,255,.09);
    border-bottom: 1px solid rgba(255,255,255,.09);
    position: relative;
    z-index: 5;
  }

  .battle-protocol {
    display: flex;
    align-items: center;
    gap: 10px;
    color: rgba(255,255,255,.5);
  }

  .battle-protocol svg {
    color: ${GREEN};
  }

  .battle-protocol strong,
  .battle-protocol span {
    display: block;
  }

  .battle-protocol strong {
    font-size: 8px;
    letter-spacing: .14em;
  }

  .battle-protocol span {
    margin-top: 4px;
    color: rgba(255,255,255,.2);
    font-size: 7px;
    letter-spacing: .1em;
  }

  .battle-progress-copy {
    text-align: center;
    color: ${GREEN};
    font-size: 8px;
    letter-spacing: .18em;
    animation: systemPulse 1.4s infinite;
  }

  .battle-reset {
    justify-self: end;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 9px 13px;
    border: 1px solid rgba(255,255,255,.13);
    background: rgba(255,255,255,.025);
    color: rgba(255,255,255,.45);
    font-family: inherit;
    font-size: 8px;
    letter-spacing: .14em;
    cursor: pointer;
    transition: all .2s;
  }

  .battle-reset:hover {
    color: #fff;
    border-color: rgba(255,255,255,.35);
  }

  .battle-warning,
  .battle-error {
    position: fixed;
    left: 50%;
    bottom: 80px;
    transform: translateX(-50%);
    z-index: 40;
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 12px 18px;
    background: rgba(20,8,2,.95);
    border: 1px solid rgba(255,150,50,.4);
    box-shadow: 0 0 35px rgba(255,120,0,.08);
  }

  .battle-warning strong,
  .battle-error strong {
    color: #ffae55;
    font-size: 8px;
    letter-spacing: .14em;
  }

  .battle-warning span,
  .battle-error span {
    color: rgba(255,255,255,.4);
    font-size: 7px;
    letter-spacing: .1em;
  }

  .battle-error {
    background: rgba(25,2,2,.95);
    border-color: rgba(255,70,70,.4);
  }

  .battle-error strong {
    color: #ff6464;
  }

  .battle-footer {
    position: relative;
    z-index: 5;
    width: min(1420px, calc(100% - 50px));
    margin: 18px auto 0;
    padding-bottom: 18px;
    display: flex;
    justify-content: space-between;
    color: rgba(255,255,255,.14);
    font-size: 7px;
    letter-spacing: .12em;
  }

  /* =========================
     RESULT SCREEN
     ========================= */

  .battle-result-screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    padding: 40px 20px;
    text-align: center;
    background:
      radial-gradient(
        circle at center,
        rgba(0,255,136,.09),
        transparent 35%
      ),
      #010403;
  }

  .result-noise {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: .12;
    background:
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 3px,
        rgba(255,255,255,.08) 4px
      );
  }

  .result-kicker {
    color: ${GREEN};
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .28em;
    animation: resultAppear .7s ease both;
  }

  .result-title {
    margin-top: 25px;
    font-size: clamp(36px, 7vw, 88px);
    line-height: .9;
    font-weight: 900;
    letter-spacing: -.05em;
    animation: resultAppear .8s .1s ease both;
  }

  .result-winner {
    margin-top: 12px;
    color: ${GREEN};
    font-size: clamp(18px, 3vw, 30px);
    font-weight: 900;
    letter-spacing: .22em;
    text-shadow: 0 0 25px rgba(0,255,136,.45);
    animation: winnerReveal 1s .25s ease both;
  }

  .result-vs-row {
    display: grid;
    grid-template-columns: minmax(120px,220px) 90px minmax(120px,220px);
    align-items: center;
    gap: 20px;
    margin-top: 65px;
    animation: resultAppear .8s .4s ease both;
  }

  .result-player {
    padding: 25px;
    border: 1px solid rgba(255,255,255,.12);
    background: rgba(255,255,255,.025);
  }

  .result-player span {
    display: block;
    color: rgba(255,255,255,.35);
    font-size: 8px;
    letter-spacing: .16em;
  }

  .result-player strong {
    display: block;
    margin: 9px 0;
    color: #fff;
    font-size: 45px;
    line-height: 1;
  }

  .result-player small {
    color: ${GREEN};
    font-size: 8px;
    letter-spacing: .13em;
  }

  .result-versus {
    color: rgba(255,255,255,.2);
    font-size: 17px;
    font-weight: 900;
    font-style: italic;
  }

  .result-divider {
    width: min(500px,80%);
    height: 1px;
    margin-top: 45px;
    background:
      linear-gradient(
        90deg,
        transparent,
        rgba(255,255,255,.2),
        transparent
      );
  }

  .result-status {
    margin-top: 18px;
    color: rgba(255,255,255,.3);
    font-size: 8px;
    letter-spacing: .16em;
  }

  .result-status span {
    color: rgba(0,255,136,.45);
  }

  .result-actions {
    display: flex;
    gap: 10px;
    margin-top: 35px;
  }

  .result-actions button,
  .result-actions a {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-width: 150px;
    padding: 13px 18px;
    border: 1px solid rgba(255,255,255,.16);
    background: rgba(255,255,255,.035);
    color: rgba(255,255,255,.7);
    text-decoration: none;
    font-family: inherit;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: .15em;
    cursor: pointer;
    transition: all .2s;
  }

  .result-actions button:first-child {
    background: ${GREEN};
    border-color: ${GREEN};
    color: #00150b;
  }

  .result-actions button:hover,
  .result-actions a:hover {
    transform: translateY(-2px);
    color: #fff;
    border-color: rgba(255,255,255,.4);
  }

  .result-actions button:first-child:hover {
    color: #00150b;
  }

  @keyframes resultAppear {
    from {
      opacity: 0;
      transform: translateY(15px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes winnerReveal {
    from {
      opacity: 0;
      transform: scale(.7);
      filter: blur(12px);
    }
    to {
      opacity: 1;
      transform: scale(1);
      filter: blur(0);
    }
  }

  @media (max-width: 1050px) {
    .battle-arena {
      grid-template-columns: 1fr 1.7fr 1fr;
      gap: 10px;
    }

    .arena-player {
      padding: 17px;
    }

    .arena-player-name {
      font-size: 16px;
    }

    .arena-power {
      margin-top: 35px;
    }
  }

  @media (max-width: 820px) {
    .battle-nav {
      padding: 0 18px;
    }

    .battle-nav-right {
      display: none;
    }

    .battle-heading {
      padding-top: 30px;
    }

    .battle-arena {
      width: calc(100% - 24px);
      grid-template-columns: 1fr 1fr;
    }

    .arena-center {
      grid-column: 1 / -1;
      grid-row: 1;
    }

    .arena-player {
      grid-row: 2;
      min-height: 190px;
    }

    .arena-power {
      margin-top: 22px;
    }

    .arena-metrics {
      margin-top: 18px;
    }

    .battle-bottom {
      width: calc(100% - 24px);
      grid-template-columns: 1fr;
      text-align: center;
    }

    .battle-protocol {
      justify-content: center;
    }

    .battle-reset {
      justify-self: center;
    }

    .battle-footer {
      width: calc(100% - 24px);
    }
  }

  @media (max-width: 520px) {
    .battle-heading h1 {
      font-size: 43px;
    }

    .battle-heading p {
      font-size: 7px;
      letter-spacing: .16em;
    }

    .arena-camera {
      min-height: 230px;
    }

    .arena-player {
      min-height: 165px;
      padding: 13px;
    }

    .arena-player-name {
      font-size: 12px;
    }

    .arena-player-live {
      font-size: 6px;
    }

    .arena-metric span {
      font-size: 6px;
    }

    .arena-metric strong {
      font-size: 11px;
    }

    .result-vs-row {
      grid-template-columns: 1fr 35px 1fr;
      gap: 6px;
    }

    .result-player {
      padding: 16px 8px;
    }

    .result-player strong {
      font-size: 32px;
    }

    .result-actions {
      width: 100%;
      flex-direction: column;
    }

    .result-actions button,
    .result-actions a {
      width: 100%;
    }

    .battle-footer {
      flex-direction: column;
      gap: 7px;
      text-align: center;
    }
  }
`;