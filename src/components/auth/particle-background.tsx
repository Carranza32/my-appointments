"use client";

import { useEffect, useRef } from "react";

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const activeCanvas: HTMLCanvasElement = canvas;
    const ctx = activeCanvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const mouse = {
      x: null as number | null,
      y: null as number | null,
      radius: 120, // Interaction radius
    };

    // Responsive Canvas sizing
    const resizeCanvas = () => {
      activeCanvas.width = window.innerWidth;
      activeCanvas.height = window.innerHeight;
      initParticles();
    };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      baseSize: number;
      density: number;
      alpha: number;

      constructor() {
        this.x = Math.random() * activeCanvas.width;
        this.y = Math.random() * activeCanvas.height;
        // Slow frost drift velocity
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.baseSize = Math.random() * 2 + 1; // 1px to 3px
        this.size = this.baseSize;
        this.density = Math.random() * 30 + 10;
        this.alpha = Math.random() * 0.4 + 0.1; // 10% to 50% opacity
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        // Soft lavender-blue circular particles
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(26, 115, 232, ${this.alpha})`;
        ctx.fill();
      }

      update() {
        // Normal drift
        this.x += this.vx;
        this.y += this.vy;

        // Bounce on boundaries
        if (this.x < 0 || this.x > activeCanvas.width) this.vx = -this.vx;
        if (this.y < 0 || this.y > activeCanvas.height) this.vy = -this.vy;

        // Mouse interaction (repel effect)
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.hypot(dx, dy);

          if (distance < mouse.radius) {
            // Calculate force relative to distance
            const force = (mouse.radius - distance) / mouse.radius;
            const directionX = dx / distance;
            const directionY = dy / distance;

            // Push particles away
            const pushX = directionX * force * 2;
            const pushY = directionY * force * 2;

            this.x -= pushX;
            this.y -= pushY;
            this.size = this.baseSize * 1.5; // Swell slightly when active
          } else {
            if (this.size > this.baseSize) {
              this.size -= 0.1;
            }
          }
        }
      }
    }

    const initParticles = () => {
      particles = [];
      // Dynamic count based on screen area (perfect balance of rich visuals & high performance)
      const count = Math.floor((activeCanvas.width * activeCanvas.height) / 11000);
      for (let i = 0; i < Math.min(count, 120); i++) {
        particles.push(new Particle());
      }
    };

    // Draw thin frosted links between nearby nodes
    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.hypot(dx, dy);

          if (distance < 90) {
            const opacity = (1 - distance / 90) * 0.08;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(26, 115, 232, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    // Loop
    const animate = () => {
      ctx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
      
      // Update & Draw
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      drawConnections();

      animationFrameId = requestAnimationFrame(animate);
    };

    // Window Events
    window.addEventListener("resize", resizeCanvas);
    
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    // Initial setup
    resizeCanvas();
    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-20 pointer-events-none bg-gradient-to-br from-white to-[#E8EFFE] dark:from-slate-950 dark:to-slate-900 transition-colors duration-300"
    />
  );
}
