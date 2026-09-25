"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }, []);

  return null;
}
