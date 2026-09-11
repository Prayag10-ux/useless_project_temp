"use client";

import * as React from "react";
import { motion } from "framer-motion";

type HudButtonProps = {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
};

export function HudButton({
    children,
    onClick,
    className = "",
    disabled = false,
}: HudButtonProps) {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            disabled={disabled}
            whileHover={disabled ? undefined : { scale: 1.015 }}
            whileTap={disabled ? undefined : { scale: 0.985 }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
            }}
            className={`hud-button ${className}`}
        >
            <span className="hud-button-corner hud-button-corner-tl" />
            <span className="hud-button-corner hud-button-corner-br" />

            <span className="hud-button-accent" />

            <span className="hud-button-content">
                {children}
            </span>

            <span className="hud-button-arrow">→</span>
        </motion.button>
    );
}