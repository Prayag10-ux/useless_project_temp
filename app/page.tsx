"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Crosshair,
  ScanLine,
  Activity,
} from "lucide-react";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    updateTime();

    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 25,
    mass: 0.2,
  });

  /*
   * ==========================================================
   * HERO
   * ==========================================================
   */

  const heroOpacity = useTransform(
    progress,
    [0, 0.12, 0.22],
    [1, 1, 0]
  );

  const heroY = useTransform(
    progress,
    [0, 0.22],
    ["0vh", "-12vh"]
  );

  const heroScale = useTransform(
    progress,
    [0, 0.22],
    [1, 0.94]
  );

  /*
   * ==========================================================
   * SCANNER
   * ==========================================================
   */

  const scannerOpacity = useTransform(
    progress,
    [0.12, 0.25, 0.43, 0.52],
    [0, 1, 1, 0]
  );

  const scannerY = useTransform(
    progress,
    [0.12, 0.28, 0.52],
    ["12vh", "0vh", "-10vh"]
  );

  const scannerScale = useTransform(
    progress,
    [0.12, 0.3, 0.52],
    [0.9, 1, 0.96]
  );

  /*
   * ==========================================================
   * ANALYSIS
   * ==========================================================
   */

  const analysisOpacity = useTransform(
    progress,
    [0.35, 0.48, 0.63, 0.72],
    [0, 1, 1, 0]
  );

  const analysisY = useTransform(
    progress,
    [0.35, 0.5, 0.72],
    ["12vh", "0vh", "-10vh"]
  );

  const analysisScale = useTransform(
    progress,
    [0.35, 0.5, 0.72],
    [0.94, 1, 0.96]
  );

  /*
   * ==========================================================
   * RESULT
   * ==========================================================
   */

  const resultOpacity = useTransform(
    progress,
    [0.58, 0.7, 0.88],
    [0, 1, 1]
  );

  const resultY = useTransform(
    progress,
    [0.58, 0.72, 0.9],
    ["12vh", "0vh", "-5vh"]
  );

  const resultScale = useTransform(
    progress,
    [0.58, 0.72],
    [0.94, 1]
  );

  /*
   * ==========================================================
   * SCAN LINE
   * ==========================================================
   */

  const scanLineY = useTransform(
    progress,
    [0.1, 0.52],
    ["-40vh", "40vh"]
  );

  /*
   * ==========================================================
   * ANALYSIS BARS
   * ==========================================================
   */

  const bar1 = useTransform(
    progress,
    [0.38, 0.55],
    ["5%", "96%"]
  );

  const bar2 = useTransform(
    progress,
    [0.38, 0.58],
    ["5%", "89%"]
  );

  const bar3 = useTransform(
    progress,
    [0.38, 0.6],
    ["5%", "94%"]
  );

  /*
   * ==========================================================
   * BACKGROUND
   * ==========================================================
   */

  const gridOpacity = useTransform(
    progress,
    [0, 1],
    [0.7, 0.35]
  );

  return (
    <main className="aura-page">

      {/* =====================================================
          TOP SYSTEM BAR
          ===================================================== */}

      <header className="aura-header">

        <div className="aura-brand">
          <span className="aura-brand-symbol">◇</span>
          <span>AURASCAN™</span>
        </div>

        <div className="aura-system-status">
          <span className="aura-status-light" />
          SYSTEM ONLINE
        </div>

        <div className="aura-clock">
          {time}
        </div>

      </header>


      {/* =====================================================
          SCROLL EXPERIENCE
          ===================================================== */}

      <section
        ref={containerRef}
        className="aura-scroll-container"
      >

        {/* POINTER-EVENT FIX:
            The sticky visual layer should not block clicks.
        */}

        <div className="aura-sticky pointer-events-none">

          {/* BACKGROUND GRID */}

          <motion.div
            className="aura-grid"
            style={{
              opacity: gridOpacity,
            }}
          />

          <div className="aura-glow aura-glow-one" />
          <div className="aura-glow aura-glow-two" />

          <div className="aura-scanlines" />


          {/* =================================================
              DECORATIVE HUD
              ================================================= */}

          <div className="aura-hud aura-hud-tl">
            <span>AS // 001</span>
            <span>CLASSIFIED</span>
          </div>

          <div className="aura-hud aura-hud-tr">
            <span>FIELD: ACTIVE</span>
            <span>VER. 4.7.1</span>
          </div>

          <div className="aura-hud aura-hud-bl">
            NO BIOLOGICAL DATA STORED
          </div>

          <div className="aura-hud aura-hud-br">
            EXPERIMENTAL SYSTEM
          </div>


          {/* =================================================
              CENTRAL ORBIT
              ================================================= */}

          <div className="aura-orbit aura-orbit-large" />
          <div className="aura-orbit aura-orbit-medium" />
          <div className="aura-orbit aura-orbit-small" />

          <div className="aura-crosshair">
            <Crosshair size={25} strokeWidth={1} />
          </div>


          {/* =================================================
              HERO
              ================================================= */}

          <motion.section
            className="aura-stage aura-hero-stage"
            style={{
              opacity: heroOpacity,
              y: heroY,
              scale: heroScale,
            }}
          >

            <div className="aura-content">

              <div className="aura-classified">
                CLASSIFIED // AURA RESEARCH DIVISION // AS-001
              </div>

              <div className="aura-stage-label">
                01 / SYSTEM INITIALIZATION
              </div>

              <h1 className="aura-title">
                <span>AURA</span>
                <span className="aura-title-outline">
                  SCAN
                </span>
              </h1>

              <div className="aura-tagline">
                MEASURE WHAT CANNOT BE MEASURED.
              </div>

              <p className="aura-description">
                AURASCAN™ is an experimental biometric
                interpretation system designed to detect,
                quantify and classify the invisible properties
                of human presence.
              </p>

              <div className="aura-hero-meta">
                <span>
                  <i />
                  SYSTEM READY
                </span>

                <span>
                  OBSERVATION FIELD // 01
                </span>
              </div>

            </div>

          </motion.section>


          {/* =================================================
              SCANNER
              ================================================= */}

          <motion.section
            className="aura-stage"
            style={{
              opacity: scannerOpacity,
              y: scannerY,
              scale: scannerScale,
            }}
          >

            <div className="aura-content">

              <div className="aura-stage-label">
                02 / SUBJECT ACQUISITION
              </div>

              <div className="aura-scanner">

                <div className="scanner-corner scanner-tl" />
                <div className="scanner-corner scanner-tr" />
                <div className="scanner-corner scanner-bl" />
                <div className="scanner-corner scanner-br" />

                <div className="scanner-top">
                  <span>LIVE SENSOR FEED</span>
                  <span>REF // AS-001</span>
                </div>

                <div className="scanner-bottom">
                  <span>CALIBRATION: 100%</span>
                  <span>AWAITING SUBJECT</span>
                </div>

                <div className="scanner-axis-x" />
                <div className="scanner-axis-y" />

                <div className="scanner-ring scanner-ring-1" />
                <div className="scanner-ring scanner-ring-2" />
                <div className="scanner-ring scanner-ring-3" />

                <div className="scanner-center">

                  <div className="scanner-center-inner">
                    <Activity size={25} strokeWidth={1} />
                  </div>

                  <span>FIELD</span>

                  <strong>
                    READY
                  </strong>

                </div>

                <motion.div
                  className="scanner-sweep"
                  style={{
                    y: scanLineY,
                  }}
                />

              </div>

              <div className="scanner-caption">
                <span>SUBJECT DETECTION ARRAY</span>
                <span>POSITION WITHIN FIELD</span>
              </div>

            </div>

          </motion.section>


          {/* =================================================
              ANALYSIS
              ================================================= */}

          <motion.section
            className="aura-stage"
            style={{
              opacity: analysisOpacity,
              y: analysisY,
              scale: analysisScale,
            }}
          >

            <div className="aura-content aura-analysis-content">

              <div className="aura-stage-label">
                03 / BIOMETRIC INTERPRETATION
              </div>

              <h2 className="aura-heading">
                THE SYSTEM
                <span>IS LISTENING.</span>
              </h2>

              <p className="aura-description">
                Human presence detected within the
                observation field. Beginning biometric
                interpretation.
              </p>

              <div className="analysis-panel">

                <div className="analysis-panel-header">
                  <span>
                    LIVE FIELD ANALYSIS
                  </span>

                  <span className="processing">
                    <i />
                    PROCESSING
                  </span>
                </div>


                <div className="analysis-row">

                  <span>OPTICAL ARRAY</span>

                  <div className="analysis-track">
                    <motion.i
                      style={{
                        width: bar1,
                      }}
                    />
                  </div>

                  <strong>96%</strong>

                </div>


                <div className="analysis-row">

                  <span>FIELD STABILITY</span>

                  <div className="analysis-track">
                    <motion.i
                      style={{
                        width: bar2,
                      }}
                    />
                  </div>

                  <strong>89%</strong>

                </div>


                <div className="analysis-row">

                  <span>PRESENCE SIGNAL</span>

                  <div className="analysis-track">
                    <motion.i
                      style={{
                        width: bar3,
                      }}
                    />
                  </div>

                  <strong>94%</strong>

                </div>


                <div className="analysis-footer">

                  <span>
                    SENSOR STATUS
                    <strong>ACTIVE</strong>
                  </span>

                  <span>
                    SIGNAL
                    <strong>STABLE</strong>
                  </span>

                  <span>
                    ERROR
                    <strong>0.00%</strong>
                  </span>

                </div>

              </div>

            </div>

          </motion.section>


          {/* =================================================
              RESULT
              ================================================= */}

          <motion.section
            className="aura-stage"
            style={{
              opacity: resultOpacity,
              y: resultY,
              scale: resultScale,
            }}
          >

            <div className="aura-content aura-result-content">

              <div className="aura-stage-label">
                04 / FINAL CLASSIFICATION
              </div>

              <div className="result-status">
                <i />
                BIOMETRIC INTERPRETATION // COMPLETE
              </div>

              <h2 className="aura-heading">
                TRANSLATING
                <span>THE INVISIBLE.</span>
              </h2>


              <div className="result-data">

                <div className="result-stat">
                  <span>ENERGY</span>
                  <strong>847</strong>
                  <small>AU</small>
                </div>

                <div className="result-stat">
                  <span>CHAOS</span>
                  <strong>73</strong>
                  <small>%</small>
                </div>

                <div className="result-stat">
                  <span>PRESENCE</span>
                  <strong>94</strong>
                  <small>%</small>
                </div>

              </div>


              <div className="result-classification">

                <span>PRIMARY CLASSIFICATION</span>

                <strong>
                  MAIN CHARACTER
                </strong>

              </div>


              {/* POINTER-EVENT FIX:
                  This CTA is explicitly clickable.
              */}

              <Link
                href="/scan"
                className="aura-cta pointer-events-auto"
              >

                <ScanLine size={18} />

                <span>
                  INITIATE FULL SCAN
                </span>

                <ArrowRight size={18} />

              </Link>

            </div>

          </motion.section>


          {/* =================================================
              SCROLL INDICATOR
              ================================================= */}

          <motion.div
            className="aura-scroll-indicator"
            style={{
              opacity: useTransform(
                progress,
                [0, 0.08],
                [1, 0]
              ),
            }}
          >

            <span>
              SCROLL TO INITIALIZE
            </span>

            <ArrowDown size={15} />

          </motion.div>


          {/* =================================================
              PROGRESS
              ================================================= */}

          <div className="aura-progress">

            <div className="aura-progress-line">

              <motion.div
                style={{
                  scaleY: progress,
                }}
              />

            </div>

            <span>
              AS / 001
            </span>

          </div>

        </div>

      </section>


      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="aura-footer">

        <span>AURASCAN™</span>

        <span>
          EXPERIMENTAL BIOMETRIC INTERPRETATION SYSTEM
        </span>

        <span>
          CLASSIFICATION // UNVERIFIED
        </span>

      </footer>

    </main>
  );
}