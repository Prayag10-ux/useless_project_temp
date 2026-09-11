"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, Crosshair, ScanLine } from "lucide-react";
import Link from "next/link";

type Stage = {
    id: string;
    number: string;
    label: string;
    title: string;
    description: string;
};

const stages: Stage[] = [
    {
        id: "boot",
        number: "01",
        label: "SYSTEM INITIALIZATION",
        title: "THE SIGNAL\nIS ALREADY THERE.",
        description:
            "AURASCAN detects patterns that conventional instruments were never designed to measure.",
    },
    {
        id: "acquisition",
        number: "02",
        label: "SUBJECT ACQUISITION",
        title: "IDENTIFY\nTHE SUBJECT.",
        description:
            "Position yourself inside the scanning field. The system establishes a baseline before measurement begins.",
    },
    {
        id: "field",
        number: "03",
        label: "AURA FIELD",
        title: "THE FIELD\nEMERGES.",
        description:
            "Movement, stability and visual energy are converted into a classified aura signature.",
    },
    {
        id: "analysis",
        number: "04",
        label: "DEEP ANALYSIS",
        title: "MEASUREMENT\nIN PROGRESS.",
        description:
            "Multiple aura metrics are evaluated against the AURASCAN classification matrix.",
    },
    {
        id: "classification",
        number: "05",
        label: "FINAL CLASSIFICATION",
        title: "MEASURE WHAT\nCANNOT BE MEASURED.",
        description:
            "Your aura profile is ready. Enter the scanner and discover what the system thinks you are.",
    },
];

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function lerp(a: number, b: number, amount: number) {
    return a + (b - a) * amount;
}

export function AuraScrollHero() {
    const sectionRef = useRef<HTMLElement | null>(null);
    const sceneRef = useRef<HTMLDivElement | null>(null);

    const targetScroll = useRef(0);
    const currentScroll = useRef(0);

    const targetMouseX = useRef(0);
    const targetMouseY = useRef(0);

    const mouseX = useRef(0);
    const mouseY = useRef(0);

    const rafRef = useRef<number | null>(null);

    const [activeStage, setActiveStage] = useState(0);
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        );

        const handleMotionPreference = () => {
            setReducedMotion(mediaQuery.matches);
        };

        handleMotionPreference();

        mediaQuery.addEventListener("change", handleMotionPreference);

        return () => {
            mediaQuery.removeEventListener(
                "change",
                handleMotionPreference,
            );
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            targetScroll.current = window.scrollY;
        };

        const handleMouseMove = (event: MouseEvent) => {
            targetMouseX.current =
                event.clientX / window.innerWidth - 0.5;

            targetMouseY.current =
                event.clientY / window.innerHeight - 0.5;
        };

        window.addEventListener("scroll", handleScroll, {
            passive: true,
        });

        window.addEventListener("mousemove", handleMouseMove);

        handleScroll();

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    useEffect(() => {
        const animate = () => {
            const section = sectionRef.current;
            const scene = sceneRef.current;

            if (!section || !scene) {
                rafRef.current = requestAnimationFrame(animate);
                return;
            }

            if (!reducedMotion) {
                currentScroll.current = lerp(
                    currentScroll.current,
                    targetScroll.current,
                    0.075,
                );

                mouseX.current = lerp(
                    mouseX.current,
                    targetMouseX.current,
                    0.08,
                );

                mouseY.current = lerp(
                    mouseY.current,
                    targetMouseY.current,
                    0.08,
                );
            } else {
                currentScroll.current = targetScroll.current;
                mouseX.current = 0;
                mouseY.current = 0;
            }

            const rect = section.getBoundingClientRect();

            const scrollDistance = Math.max(
                section.offsetHeight - window.innerHeight,
                1,
            );

            const localScroll = clamp(
                -rect.top,
                0,
                scrollDistance,
            );

            const progress = clamp(
                localScroll / scrollDistance,
                0,
                1,
            );

            const stageProgress =
                progress * (stages.length - 1);

            const stageIndex = clamp(
                Math.round(stageProgress),
                0,
                stages.length - 1,
            );

            setActiveStage((previous) =>
                previous === stageIndex ? previous : stageIndex,
            );

            const mouseTiltX = mouseY.current * -3;
            const mouseTiltY = mouseX.current * 3;

            scene.style.transform = `
        perspective(1400px)
        rotateX(${mouseTiltX}deg)
        rotateY(${mouseTiltY}deg)
      `;

            stages.forEach((_, index) => {
                const element = document.querySelector(
                    `[data-aura-stage="${index}"]`,
                ) as HTMLElement | null;

                if (!element) return;

                const distance = index - stageProgress;
                const absoluteDistance = Math.abs(distance);

                const translateZ = clamp(
                    -absoluteDistance * 260,
                    -850,
                    0,
                );

                const translateY = distance * 115;

                const rotateX = clamp(
                    distance * -12,
                    -28,
                    28,
                );

                const scale = clamp(
                    1 - absoluteDistance * 0.16,
                    0.68,
                    1,
                );

                const opacity = clamp(
                    1 - absoluteDistance * 0.65,
                    0,
                    1,
                );

                const blur = clamp(
                    absoluteDistance * 2.5,
                    0,
                    7,
                );

                element.style.transform = `
          translate3d(0, ${translateY}px, ${translateZ}px)
          rotateX(${rotateX}deg)
          scale(${scale})
        `;

                element.style.opacity = `${opacity}`;

                element.style.filter = `blur(${blur}px)`;

                element.style.zIndex = `${100 - Math.round(
                    absoluteDistance * 10,
                )}`;

                element.style.pointerEvents =
                    absoluteDistance < 0.45 ? "auto" : "none";
            });

            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [reducedMotion]);

    return (
        <main className="aura-scroll-page">
            <section
                ref={sectionRef}
                className="aura-scroll-section"
            >
                <div className="aura-scroll-sticky">
                    <div className="aura-grid" />
                    <div className="aura-noise" />

                    <div className="aura-corner aura-corner-tl">
                        <span>AS // 001</span>
                        <span>CLASSIFIED</span>
                    </div>

                    <div className="aura-corner aura-corner-tr">
                        <span>FIELD: ACTIVE</span>
                        <span>VER. 4.7.1</span>
                    </div>

                    <div className="aura-corner aura-corner-bl">
                        <span>NO BIOLOGICAL DATA STORED</span>
                    </div>

                    <div className="aura-corner aura-corner-br">
                        <span>
                            0{activeStage + 1} / 0{stages.length}
                        </span>
                    </div>

                    <div className="aura-status">
                        <span className="aura-status-dot" />
                        AURASCAN SYSTEM ONLINE
                    </div>

                    <div
                        ref={sceneRef}
                        className="aura-stage-scene"
                    >
                        <div className="aura-orbit aura-orbit-one" />
                        <div className="aura-orbit aura-orbit-two" />
                        <div className="aura-orbit aura-orbit-three" />

                        <div className="aura-center-core">
                            <div className="aura-core-inner">
                                <Crosshair size={22} strokeWidth={1} />
                            </div>
                        </div>

                        {stages.map((stage, index) => (
                            <article
                                key={stage.id}
                                data-aura-stage={index}
                                className={`aura-stage-card ${activeStage === index
                                        ? "aura-stage-active"
                                        : ""
                                    }`}
                            >
                                <div className="aura-stage-card-header">
                                    <span>
                                        <span className="aura-stage-index">
                                            {stage.number}
                                        </span>

                                        {stage.label}
                                    </span>

                                    <span className="aura-stage-live">
                                        {activeStage === index
                                            ? "ACTIVE"
                                            : "STANDBY"}
                                    </span>
                                </div>

                                <div className="aura-stage-card-body">
                                    <div className="aura-stage-copy">
                                        <div className="aura-stage-eyebrow">
                                            AURASCAN // PROTOCOL{" "}
                                            {stage.number}
                                        </div>

                                        <h1>
                                            {stage.title
                                                .split("\n")
                                                .map((line, lineIndex) => (
                                                    <span key={lineIndex}>
                                                        {line}
                                                        <br />
                                                    </span>
                                                ))}
                                        </h1>

                                        <p>{stage.description}</p>

                                        {index === stages.length - 1 && (
                                            <Link
                                                href="/scan"
                                                className="aura-scan-button"
                                            >
                                                <span className="aura-button-icon">
                                                    <ScanLine size={17} />
                                                </span>

                                                <span>INITIALIZE SCAN</span>

                                                <ArrowRight size={17} />
                                            </Link>
                                        )}
                                    </div>

                                    <div className="aura-diagnostic">
                                        <div className="aura-diagnostic-title">
                                            FIELD TELEMETRY
                                        </div>

                                        <div className="aura-bars">
                                            {Array.from({ length: 18 }).map(
                                                (_, barIndex) => (
                                                    <span
                                                        key={barIndex}
                                                        style={{
                                                            height: `${18 +
                                                                ((barIndex * 17 +
                                                                    index * 13) %
                                                                    62)
                                                                }%`,
                                                        }}
                                                    />
                                                ),
                                            )}
                                        </div>

                                        <div className="aura-diagnostic-values">
                                            <span>
                                                FLUX
                                                <strong>
                                                    {(78 + index * 4)
                                                        .toString()
                                                        .padStart(2, "0")}
                                                </strong>
                                            </span>

                                            <span>
                                                FIELD
                                                <strong>
                                                    {(
                                                        0.72 +
                                                        index * 0.04
                                                    ).toFixed(2)}
                                                </strong>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="aura-scroll-hint">
                        <ArrowDown size={15} />
                        <span>SCROLL TO ANALYZE</span>
                    </div>

                    <div className="aura-progress">
                        <div className="aura-progress-track">
                            <div
                                className="aura-progress-fill"
                                style={{
                                    height: `${((activeStage + 1) /
                                            stages.length) *
                                        100
                                        }%`,
                                }}
                            />
                        </div>

                        <span>
                            {String(activeStage + 1).padStart(2, "0")}
                        </span>
                    </div>
                </div>
            </section>
        </main>
    );
}