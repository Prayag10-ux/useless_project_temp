"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Activity,
    Clock3,
    Fingerprint,
    ShieldAlert,
    Zap,
} from "lucide-react";

import { getAuraResult } from "@/lib/aura-session";
import type { AuraResult } from "@/lib/aura-types";

export default function ResultPage() {
    const router = useRouter();

    const [result, setResult] = useState<AuraResult | null>(null);
    const [time, setTime] = useState("");

    useEffect(() => {
        const storedResult = getAuraResult();

        if (!storedResult) {
            router.replace("/scan");
            return;
        }

        setResult(storedResult);

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

        const interval = window.setInterval(updateClock, 1000);

        return () => window.clearInterval(interval);
    }, [router]);

    if (!result) {
        return (
            <main className="result-page result-loading">
                <div className="result-loading-text">
                    RETRIEVING AURA DATA...
                </div>
            </main>
        );
    }

    const metrics = [
        {
            label: "MAIN CHARACTER",
            value: result.metrics.mainCharacter,
        },
        {
            label: "SOCIAL GRAVITY",
            value: result.metrics.socialGravity,
        },
        {
            label: "VIBE DENSITY",
            value: result.metrics.vibeDensity,
        },
        {
            label: "CONFIDENCE FLUX",
            value: result.metrics.confidenceFlux,
        },
        {
            label: "NPC RESISTANCE",
            value: result.metrics.npcResistance,
        },
        {
            label: "COSMIC ALIGNMENT",
            value: result.metrics.cosmicAlignment,
        },
    ];

    const durationSeconds = (
        result.scanMetadata.durationMs / 1000
    ).toFixed(1);

    const scanDate = new Date(
        result.scanMetadata.timestamp,
    ).toLocaleString();

    return (
        <main className="result-page">
            <div className="result-grid" />
            <div className="result-scanlines" />

            <header className="result-header">
                <Link href="/" className="result-brand">
                    AURASCAN<span>™</span>
                </Link>

                <div className="result-system-status">
                    <span className="result-status-dot" />
                    SYSTEM ONLINE
                </div>

                <div className="result-clock">
                    {time}
                </div>
            </header>

            <div className="result-content">
                <div className="result-topline">
                    <span>ANALYSIS COMPLETE</span>
                    <span>SCAN ID: {result.scanMetadata.scanId}</span>
                </div>

                <section className="result-hero">
                    <div className="result-aura-section">
                        <div className="result-section-label">
                            <Activity size={13} />
                            AURA SIGNATURE
                        </div>

                        <div
                            className="result-aura-ring"
                            style={
                                {
                                    "--aura-color": result.color,
                                } as React.CSSProperties
                            }
                        >
                            <div className="result-aura-ring-outer" />
                            <div className="result-aura-ring-middle" />
                            <div className="result-aura-ring-inner" />

                            <div className="result-aura-core">
                                <div className="result-score">
                                    {result.score}
                                </div>

                                <div className="result-score-unit">
                                    AURA UNITS
                                </div>
                            </div>

                            <div className="result-crosshair horizontal" />
                            <div className="result-crosshair vertical" />
                        </div>

                        <div
                            className="result-color-readout"
                            style={{ color: result.color }}
                        >
                            {result.color}
                        </div>
                    </div>

                    <div className="result-classification">
                        <div className="result-section-label">
                            <Fingerprint size={13} />
                            SUBJECT CLASSIFICATION
                        </div>

                        <div className="result-classification-box">
                            <div className="result-classification-code">
                                CLASSIFICATION / 01
                            </div>

                            <h1>{result.classification}</h1>

                            <div className="result-personality">
                                {result.personality}
                            </div>

                            <div className="result-threat">
                                <ShieldAlert size={15} />

                                <span>THREAT LEVEL</span>

                                <strong>{result.threatLevel}</strong>
                            </div>
                        </div>

                        {result.specialMessage && (
                            <div className="result-special-message">
                                <Zap size={14} />
                                <span>{result.specialMessage}</span>
                            </div>
                        )}
                    </div>
                </section>

                <section className="result-metrics-section">
                    <div className="result-section-label">
                        <Activity size={13} />
                        AURA METRICS
                    </div>

                    <div className="result-metrics">
                        {metrics.map((metric) => (
                            <div
                                className="result-metric"
                                key={metric.label}
                            >
                                <div className="result-metric-header">
                                    <span>{metric.label}</span>
                                    <strong>{metric.value}</strong>
                                </div>

                                <div className="result-meter">
                                    <div
                                        className="result-meter-fill"
                                        style={{
                                            width: `${Math.min(
                                                100,
                                                Math.max(0, metric.value),
                                            )}%`,
                                            backgroundColor: result.color,
                                            boxShadow: `0 0 10px ${result.color}`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="result-data-section">
                    <div className="result-section-label">
                        <Clock3 size={13} />
                        SCAN TELEMETRY
                    </div>

                    <div className="result-telemetry">
                        <div>
                            <span>SCAN ID</span>
                            <strong>{result.scanMetadata.scanId}</strong>
                        </div>

                        <div>
                            <span>DURATION</span>
                            <strong>{durationSeconds}s</strong>
                        </div>

                        <div>
                            <span>TIMESTAMP</span>
                            <strong>{scanDate}</strong>
                        </div>
                    </div>
                </section>

                <div className="result-actions">
                    <Link href="/scan" className="result-button secondary">
                        <ArrowLeft size={15} />
                        SCAN AGAIN
                    </Link>

                    <Link href="/battle" className="result-button primary">
                        AURA BATTLE
                        <ArrowRight size={15} />
                    </Link>
                </div>
            </div>

            <footer className="result-footer">
                <span>AURASCAN™ // CLASSIFIED AURA RESEARCH DIVISION</span>
                <span>MEASURE WHAT CANNOT BE MEASURED.</span>
            </footer>
        </main>
    );
}