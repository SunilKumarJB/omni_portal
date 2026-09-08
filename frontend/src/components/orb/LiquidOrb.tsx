import { Mesh, Program, Renderer, Triangle, Vec3 } from 'ogl';
import { useEffect, useRef, useState } from 'react';
import { frag, vert } from './shaders';

/** One WebGL triangle; no frame-by-frame React updates. */
export default function LiquidOrb() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: Renderer;
    try {
      renderer = new Renderer({
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        dpr: Math.min(window.devicePixelRatio || 1, 1.5),
        powerPreference: 'low-power',
      });
    } catch {
      return; // The static CSS orb stays visible when WebGL is unavailable.
    }
    const gl = renderer.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    gl.clearColor(0, 0, 0, 0);
    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vert,
      fragment: frag,
      uniforms: {
        iTime: { value: 3 },
        iResolution: { value: new Vec3(1, 1, 1) },
        hue: { value: 0 },
        hover: { value: 0.5 },
        rot: { value: 0 },
        hoverIntensity: { value: 0.45 },
        backgroundColor: { value: new Vec3(0, 0, 0) },
      },
      depthTest: false,
      depthWrite: false,
    });
    if (!gl.getProgramParameter(program.program, gl.LINK_STATUS)) {
      program.remove();
      geometry.remove();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return;
    }
    const mesh = new Mesh(gl, { geometry, program });
    host.appendChild(canvas);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let lastFrame = 0;
    let visible = true;
    let lost = false;
    let hovered = false;
    let time = 3;

    const render = () => {
      if (lost) return;
      program.uniforms.iTime.value = time;
      program.uniforms.rot.value = Math.sin(time * 0.1) * 0.18;
      renderer.render({ scene: mesh });
    };
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const delta = now - lastFrame;
      if (delta < 1000 / 30) return;
      time += Math.min(delta, 80) * 0.00065;
      lastFrame = now;
      program.uniforms.hover.value += ((hovered ? 1 : 0.45) - program.uniforms.hover.value) * 0.08;
      render();
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (lost || document.hidden || !visible) return;
      render();
      if (!motion.matches) {
        lastFrame = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    const resize = () => {
      if (!host.clientWidth || !host.clientHeight) return;
      renderer.setSize(host.clientWidth, host.clientHeight);
      program.uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
      sync();
    };
    const enter = () => {
      hovered = true;
    };
    const leave = () => {
      hovered = false;
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      cancelAnimationFrame(frame);
      setReady(false);
    };
    const resizeObserver = new ResizeObserver(resize);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    resizeObserver.observe(host);
    visibilityObserver.observe(host);
    document.addEventListener('visibilitychange', sync);
    motion.addEventListener('change', sync);
    host.addEventListener('pointerenter', enter);
    host.addEventListener('pointerleave', leave);
    canvas.addEventListener('webglcontextlost', contextLost);
    resize();
    setReady(true);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', sync);
      motion.removeEventListener('change', sync);
      host.removeEventListener('pointerenter', enter);
      host.removeEventListener('pointerleave', leave);
      canvas.removeEventListener('webglcontextlost', contextLost);
      geometry.remove();
      program.remove();
      canvas.remove();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return <div ref={hostRef} className={`liquid-orb-canvas ${ready ? 'is-ready' : ''}`} />;
}
