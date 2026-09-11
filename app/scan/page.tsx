"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Camera,
    Crosshair,
    ScanLine,
    ShieldCheck,
} from "lucide-react";
import { createAuraScan } from "@/lib/aurascan";
import type { AuraScan } from "@/lib/aurascan";

type ScanPhase =
    | "IDLE"
    | "INITIALIZING"
    | "SCANNING"
    | "COMPLETE"
    | "ERROR";

export default function ScanPage() {
    const router = useRouter();

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const scanRef = useRef<AuraScan | null>(null);

    const [time, setTime] = useState("");
    const [phase, setPhase] = useState<ScanPhase>("IDLE");
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");

    useEffect(() => {
        const updateTime = () => {
            setTime(
                new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                }),
            );
        };

        updateTime();

        const interval = setInterval(updateTime, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        return () => {
            scanRef.current?.destroy();
            scanRef.current = null;
        };
    }, []);

    const initializeScan = async () => {
        if (phase === "SCANNING") return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) {
            setError("SCANNER HARDWARE INTERFACE UNAVAILABLE.");
            setPhase("ERROR");
            return;
        }

        setError("");
        setProgress(0);
        setPhase("IDLE");

        try {
            scanRef.current?.destroy();
            scanRef.current = null;

            const scan = await createAuraScan(
                video,
                canvas,
                (state) => {
                    setPhase(state.phase);
                    setProgress(state.progress);

                    if (state.phase === "ERROR") {
                        setError(state.error ?? "AURA SCAN FAILED.");
                    }

                    if (state.phase === "COMPLETE" && state.result) {
                        setProgress(100);

                        setTimeout(() => {
                            router.push("/result");
                        }, 500);
                    }
                },
            );

            scanRef.current = scan;
            scan.start();
        } catch (scanError) {
            console.error("AURASCAN initialization failed:", scanError);

            setPhase("ERROR");

            if (
                scanError instanceof DOMException &&
                scanError.name === "NotAllowedError"
            ) {
                setError(
                    "CAMERA ACCESS DENIED. AUTHORIZE CAMERA INPUT AND RETRY.",
                );
            } else {
                setError(
                    scanError instanceof Error
                        ? scanError.message.toUpperCase()
                        : "CAMERA INITIALIZATION FAILED.",
                );
            }
        }
    };

    const stopScan = () => {
        scanRef.current?.stop();
        scanRef.current = null;
        setPhase("IDLE");
        setProgress(0);
    };

    const isScanning = phase === "SCANNING";
    const isComplete = phase === "COMPLETE";
    const hasError = phase === "ERROR";

    const buttonLabel = isScanning
        ? `SCANNING // ${Math.round(progress)}%`
        : isComplete
            ? "SCAN COMPLETE"
            : hasError
                ? "RETRY SCAN"
                : "INITIALIZE SCAN";

    const opticalStatus = isScanning
        ? "ACTIVE"
        : isComplete
            ? "COMPLETE"
            : "READY";

    const signalStatus = isScanning
        ? `${Math.round(progress)}%`
        : isComplete
            ? "LOCKED"
            : hasError
                ? "ERROR"
                : "WAITING";

    return (
        <main className="min-h-screen overflow-hidden bg-[#020604] text-[#e8fff2]">
            {/* BACKGROUND */}
            <div className="pointer-events-none fixed inset-0">
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        backgroundImage: `
              linear-gradient(rgba(98,255,154,0.045) 1px, transparent 1px),
              linear-gradient(90deg, rgba(98,255,154,0.045) 1px, transparent 1px)
            `,
                        backgroundSize: "52px 52px",
                    }}
                />

                <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#39ff7a]/[0.025] blur-[100px]" />

                <div
                    className="absolute inset-0 opacity-[0.035]"
                    style={{
                        backgroundImage:
                            "repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(255,255,255,0.15) 4px)",
                    }}
                />
            </div>

            {/* TOP HEADER */}
            <header className="relative z-20 flex h-[82px] items-center justify-between border-b border-[#62ff9a]/10 px-6 md:px-10">
                <Link
                    href="/"
                    className="group flex items-center gap-3 text-[11px] font-bold tracking-[0.18em]"
                >
                    <span className="text-[#62ff9a] transition-transform group-hover:rotate-45">
                        ◈
                    </span>

                    <span>AURASCAN™</span>
                </Link>

                <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-3 border border-[#62ff9a]/15 bg-[#06100a]/70 px-4 py-2 text-[9px] tracking-[0.18em] text-[#bfffd2]/60 md:flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#62ff9a] shadow-[0_0_12px_#62ff9a]" />
                    SYSTEM ONLINE
                </div>

                <div className="flex items-center gap-5 text-[9px] tracking-[0.15em] text-[#bfffd2]/35">
                    <span className="hidden md:block">
                        SCAN // AS-001
                    </span>
                    <span>{time}</span>
                </div>
            </header>

            {/* MAIN */}
            <section className="relative z-10 flex min-h-[calc(100vh-82px)] flex-col items-center px-5 py-10 md:py-14">
                {/* TOP LABELS */}
                <div className="mb-8 flex w-full max-w-[1100px] items-center justify-between">
                    <div className="flex items-center gap-3 text-[9px] tracking-[0.2em] text-[#62ff9a]/60">
                        <span className="text-[#62ff9a]">01</span>
                        SUBJECT ACQUISITION
                    </div>

                    <div className="text-[8px] tracking-[0.18em] text-[#bfffd2]/25">
                        CLASSIFIED // AURA RESEARCH DIVISION
                    </div>
                </div>

                {/* TITLE */}
                <div className="mb-10 text-center">
                    <p className="mb-4 text-[9px] tracking-[0.28em] text-[#62ff9a]/55">
                        AURASCAN™ // BIOMETRIC FIELD INTERFACE
                    </p>

                    <h1 className="font-sans text-[clamp(42px,7vw,92px)] font-black leading-[0.85] tracking-[-0.055em]">
                        PREPARE
                        <span className="block text-[#62ff9a]">
                            THE SUBJECT.
                        </span>
                    </h1>

                    <p className="mx-auto mt-6 max-w-[570px] text-[10px] leading-7 tracking-[0.08em] text-[#c8ded0]/40 md:text-[11px]">
                        Position yourself inside the observation field.
                        AURASCAN will establish a baseline before the
                        measurement sequence begins.
                    </p>
                </div>

                {/* SCANNER */}
                <div className="relative w-full max-w-[920px]">
                    <div className="relative aspect-[16/8.5] min-h-[380px] overflow-hidden border border-[#62ff9a]/20 bg-[#030a06]/80 shadow-[0_0_100px_rgba(55,255,120,0.035)] md:min-h-[470px]">
                        {/* CAMERA */}
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${isScanning || isComplete
                                ? "opacity-55"
                                : "opacity-0"
                                }`}
                        />

                        <canvas
                            ref={canvasRef}
                            className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
                        />

                        {/* CORNER BRACKETS */}
                        <div className="absolute left-0 top-0 h-12 w-12 border-l border-t border-[#62ff9a]/70" />
                        <div className="absolute right-0 top-0 h-12 w-12 border-r border-t border-[#62ff9a]/70" />
                        <div className="absolute bottom-0 left-0 h-12 w-12 border-b border-l border-[#62ff9a]/70" />
                        <div className="absolute bottom-0 right-0 h-12 w-12 border-b border-r border-[#62ff9a]/70" />

                        {/* TOP TELEMETRY */}
                        <div className="absolute left-5 right-5 top-4 flex justify-between text-[7px] tracking-[0.18em] text-[#bfffd2]/30 md:left-7 md:right-7">
                            <span className="flex items-center gap-2">
                                <Camera size={11} />
                                OPTICAL ARRAY // {opticalStatus}
                            </span>

                            <span>REF: AS-001</span>
                        </div>

                        {/* BOTTOM TELEMETRY */}
                        <div className="absolute bottom-4 left-5 right-5 flex justify-between text-[7px] tracking-[0.16em] text-[#bfffd2]/30 md:left-7 md:right-7">
                            <span>
                                CALIBRATION: 100%
                            </span>

                            <span className="text-[#62ff9a]/60">
                                {isScanning
                                    ? `FIELD LOCKED // ${Math.round(progress)}%`
                                    : isComplete
                                        ? "FIELD COMPLETE"
                                        : hasError
                                            ? "FIELD ERROR"
                                            : "AWAITING SUBJECT"}
                            </span>
                        </div>

                        {/* CENTER SCANNING AREA */}
                        <div className="absolute inset-[12%] flex items-center justify-center">
                            <div className="absolute left-0 right-0 top-1/2 h-px bg-[#62ff9a]/10" />

                            <div className="absolute bottom-0 left-1/2 top-0 w-px bg-[#62ff9a]/10" />

                            <div className="absolute left-[12%] top-[14%] h-7 w-7 border-l border-t border-[#62ff9a]/40" />
                            <div className="absolute right-[12%] top-[14%] h-7 w-7 border-r border-t border-[#62ff9a]/40" />
                            <div className="absolute bottom-[14%] left-[12%] h-7 w-7 border-b border-l border-[#62ff9a]/40" />
                            <div className="absolute bottom-[14%] right-[12%] h-7 w-7 border-b border-r border-[#62ff9a]/40" />

                            <div
                                className={`absolute h-[min(55vw,290px)] w-[min(55vw,290px)] max-h-[290px] max-w-[290px] rounded-full border border-[#62ff9a]/15 ${isScanning
                                    ? "shadow-[0_0_35px_rgba(98,255,154,0.12)]"
                                    : ""
                                    }`}
                            />

                            <div className="absolute h-[min(43vw,225px)] w-[min(43vw,225px)] max-h-[225px] max-w-[225px] rounded-full border border-dashed border-[#62eaff]/15" />

                            <div className="absolute h-[min(30vw,155px)] w-[min(30vw,155px)] max-h-[155px] max-w-[155px] rounded-full border border-[#ffc56b]/15" />

                            <div
                                className={`absolute h-[min(55vw,290px)] w-[min(55vw,290px)] max-h-[290px] max-w-[290px] rounded-full border border-transparent border-t-[#62ff9a]/45 border-r-[#62ff9a]/10 ${isScanning
                                    ? "animate-[spin_4s_linear_infinite]"
                                    : "animate-[spin_18s_linear_infinite]"
                                    }`}
                            />

                            {/* CENTER */}
                            <div className="relative flex h-20 w-20 flex-col items-center justify-center border border-[#62ff9a]/25 bg-[#06110a]/80 shadow-[0_0_45px_rgba(98,255,154,0.06)]">
                                <Crosshair
                                    size={25}
                                    strokeWidth={1}
                                    className={`mb-1 ${isScanning
                                        ? "animate-pulse text-[#62ff9a]"
                                        : "text-[#62ff9a]/70"
                                        }`}
                                />

                                <span className="text-[7px] tracking-[0.2em] text-[#62ff9a]/50">
                                    FIELD
                                </span>

                                <strong className="mt-1 text-[9px] tracking-[0.18em] text-[#e8fff2]/70">
                                    {isScanning
                                        ? `${Math.round(progress)}%`
                                        : isComplete
                                            ? "LOCKED"
                                            : "READY"}
                                </strong>
                            </div>

                            {/* SCAN LINE */}
                            <div
                                className={`absolute left-[8%] right-[8%] h-px bg-[#62ff9a]/60 shadow-[0_0_15px_rgba(98,255,154,0.7)] ${isScanning
                                    ? "animate-[scanline_1.8s_ease-in-out_infinite]"
                                    : "top-1/2"
                                    }`}
                            />

                            <span className="absolute left-[3%] top-1/2 -translate-y-1/2 text-[7px] text-[#62ff9a]/30">
                                X 000
                            </span>

                            <span className="absolute right-[3%] top-1/2 -translate-y-1/2 text-[7px] text-[#62ff9a]/30">
                                X 999
                            </span>
                        </div>

                        {/* SIDE DATA */}
                        <div className="absolute left-5 top-1/2 hidden -translate-y-1/2 flex-col gap-5 text-[7px] tracking-[0.15em] text-[#bfffd2]/25 md:flex">
                            <span>OPTICAL</span>
                            <span>FIELD</span>
                            <span>SIGNAL</span>
                            <span>BIOMETRIC</span>
                        </div>

                        <div className="absolute right-5 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-5 text-[7px] tracking-[0.15em] text-[#bfffd2]/25 md:flex">
                            <span>000.00</span>
                            <span>{isScanning ? `${progress.toFixed(2)}` : "001.72"}</span>
                            <span>--.--</span>
                            <span>
                                {isScanning ? "ACTIVE" : "STANDBY"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* STATUS ROW */}
                <div className="mt-6 flex w-full max-w-[920px] flex-wrap justify-center gap-px border border-[#62ff9a]/10 bg-[#62ff9a]/5">
                    <div className="flex min-w-[120px] flex-1 flex-col gap-2 border-r border-[#62ff9a]/10 px-5 py-4">
                        <span className="text-[7px] tracking-[0.18em] text-[#bfffd2]/25">
                            OPTICAL ARRAY
                        </span>
                        <span className="text-[10px] tracking-[0.12em] text-[#62ff9a]/70">
                            {opticalStatus}
                        </span>
                    </div>

                    <div className="flex min-w-[120px] flex-1 flex-col gap-2 border-r border-[#62ff9a]/10 px-5 py-4">
                        <span className="text-[7px] tracking-[0.18em] text-[#bfffd2]/25">
                            FIELD SENSOR
                        </span>
                        <span className="text-[10px] tracking-[0.12em] text-[#62ff9a]/70">
                            {isScanning
                                ? `${Math.round(progress)}%`
                                : "100%"}
                        </span>
                    </div>

                    <div className="flex min-w-[120px] flex-1 flex-col gap-2 border-r border-[#62ff9a]/10 px-5 py-4">
                        <span className="text-[7px] tracking-[0.18em] text-[#bfffd2]/25">
                            SIGNAL
                        </span>
                        <span className="text-[10px] tracking-[0.12em] text-[#bfffd2]/40">
                            {signalStatus}
                        </span>
                    </div>

                    <div className="flex min-w-[120px] flex-1 flex-col gap-2 px-5 py-4">
                        <span className="text-[7px] tracking-[0.18em] text-[#bfffd2]/25">
                            PRIVACY
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] tracking-[0.12em] text-[#62ff9a]/60">
                            <ShieldCheck size={11} />
                            LOCAL
                        </span>
                    </div>
                </div>

                {/* ERROR */}
                {error && (
                    <div className="mt-5 w-full max-w-[920px] border border-[#ff6262]/25 bg-[#ff3030]/[0.035] px-5 py-4 text-center text-[8px] tracking-[0.16em] text-[#ff9b9b]/70">
                        {error}
                    </div>
                )}

                {/* CTA */}
                <div className="mt-8 flex flex-col items-center gap-5">
                    <button
                        type="button"
                        onClick={isScanning ? stopScan : initializeScan}
                        disabled={isComplete}
                        className={`group relative flex items-center gap-5 border px-7 py-4 text-[9px] font-bold tracking-[0.2em] transition-all duration-200 ${isComplete
                            ? "cursor-default border-[#62ff9a]/30 bg-[#62ff9a]/5 text-[#62ff9a]/70"
                            : "border-[#62ff9a]/40 bg-[#62ff9a]/[0.045] text-[#e8fff2] hover:border-[#62ff9a]/80 hover:bg-[#62ff9a]/10 hover:shadow-[0_0_35px_rgba(98,255,154,0.08)]"
                            }`}
                    >
                        <span className="text-[#62ff9a]">
                            <ScanLine size={16} />
                        </span>

                        <span>{buttonLabel}</span>

                        <ArrowRight
                            size={15}
                            className="transition-transform group-hover:translate-x-1"
                        />
                    </button>

                    <p className="text-center text-[7px] tracking-[0.18em] text-[#bfffd2]/20">
                        {isScanning
                            ? "SUBJECT ACQUISITION ACTIVE // MEASUREMENT IN PROGRESS"
                            : isComplete
                                ? "AURA PROFILE GENERATED // REDIRECTING TO ANALYSIS"
                                : hasError
                                    ? "SYSTEM ERROR // VERIFY CAMERA ACCESS AND RETRY"
                                    : "NO BIOLOGICAL DATA STORED // EXPERIMENTAL SYSTEM"}
                    </p>
                </div>

                {/* BACK */}
                <Link
                    href="/"
                    className="mt-10 flex items-center gap-2 text-[8px] tracking-[0.16em] text-[#bfffd2]/25 transition-colors hover:text-[#62ff9a]/70"
                >
                    <ArrowLeft size={13} />
                    RETURN TO SYSTEM
                </Link>
            </section>

            {/* FOOTER */}
            <footer className="relative z-10 flex flex-col gap-3 border-t border-[#62ff9a]/10 px-6 py-6 text-[7px] tracking-[0.16em] text-[#bfffd2]/20 md:flex-row md:items-center md:justify-between">
                <span>AURASCAN™</span>
                <span>
                    EXPERIMENTAL BIOMETRIC INTERPRETATION SYSTEM
                </span>
                <span>CLASSIFICATION // UNVERIFIED</span>
            </footer>
        </main>
    );
}