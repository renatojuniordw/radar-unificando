"use client";

import { useState, useEffect } from "react";
import { ROTATING_WORDS } from "@/lib/constants/home";

export function RotatingText() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % ROTATING_WORDS.length);
        setVisible(true);
      }, 200);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className={visible ? "hero-word" : ""}
      style={{
        color: "#ccff00",
        fontWeight: 900,
        display: "inline-block",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s",
      }}
    >
      {ROTATING_WORDS[index]}
    </span>
  );
}
