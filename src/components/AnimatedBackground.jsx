import React, { useEffect, useRef } from 'react';
import styles from './AnimatedBackground.module.scss';

const AnimatedBackground = ({
    density = 50, // 1 to 100 where 100 is max particles
    speed = 50,   // 1 to 100 where 100 is fastest
    glowOpacity = 50, // 0 to 100 opacity of aurora
    interactive = true,
    variant = 'plexus' // 'plexus', 'particles', 'geometry', 'aurora'
}) => {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: null, y: null, radius: 150 });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let particles = [];

        // Map settings to actual values
        const baseAreaPerParticle = variant === 'geometry' ? 20000 : 10000;
        const densityFactor = Math.max(0.1, (101 - density) / 50);
        const mappedArea = baseAreaPerParticle * densityFactor;

        const maxVelocity = (speed / 50) * 0.5;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = variant === 'geometry' ? Math.random() * 8 + 4 : Math.random() * 1.5 + 0.5;
                this.shape = variant === 'geometry' ? (Math.random() > 0.5 ? 'triangle' : 'square') : 'circle';
                this.rotation = Math.random() * 360;
                this.rotationSpeed = (Math.random() - 0.5) * 2;
                this.baseX = this.x;
                this.baseY = this.y;
                this.density = (Math.random() * 30) + 1;
                this.velocity = {
                    x: (Math.random() - 0.5) * maxVelocity,
                    y: (Math.random() - 0.5) * maxVelocity
                };
            }

            draw() {
                // Check light mode state
                const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';
                const opacityMultiplier = isLightMode ? 2 : 1; // Double opacity in light mode for better contrast

                const geoOpacity = Math.min(0.15 * opacityMultiplier, 0.4);
                const circleOpacity = Math.min(0.4 * opacityMultiplier, 0.8);
                const strokeOpacity = Math.min(0.3 * opacityMultiplier, 0.7);

                ctx.fillStyle = variant === 'geometry' ? `rgba(108, 99, 255, ${geoOpacity})` : `rgba(108, 99, 255, ${circleOpacity})`;
                ctx.strokeStyle = `rgba(108, 99, 255, ${strokeOpacity})`;
                ctx.lineWidth = isLightMode ? 1.5 : 1;

                if (this.shape === 'circle') {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.fill();
                } else {
                    // Geometry shapes
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.rotation * Math.PI / 180);
                    ctx.beginPath();

                    if (this.shape === 'square') {
                        ctx.rect(-this.size / 2, -this.size / 2, this.size, this.size);
                    } else if (this.shape === 'triangle') {
                        ctx.moveTo(0, -this.size);
                        ctx.lineTo(this.size, this.size);
                        ctx.lineTo(-this.size, this.size);
                        ctx.closePath();
                    }

                    ctx.stroke();
                    ctx.fill();
                    ctx.restore();
                }
            }

            update() {
                this.x += this.velocity.x;
                this.y += this.velocity.y;
                this.rotation += this.rotationSpeed * (speed / 50);

                if (this.x > canvas.width + this.size) this.x = -this.size;
                else if (this.x < -this.size) this.x = canvas.width + this.size;
                if (this.y > canvas.height + this.size) this.y = -this.size;
                else if (this.y < -this.size) this.y = canvas.height + this.size;

                if (interactive && mouseRef.current.x !== null) {
                    let dx = mouseRef.current.x - this.x;
                    let dy = mouseRef.current.y - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    let forceDirectionX = dx / distance;
                    let forceDirectionY = dy / distance;
                    let maxDistance = mouseRef.current.radius;
                    let force = (maxDistance - distance) / maxDistance;
                    let directionX = forceDirectionX * force * this.density;
                    let directionY = forceDirectionY * force * this.density;

                    if (distance < mouseRef.current.radius) {
                        this.x -= directionX;
                        this.y -= directionY;
                    }
                }
            }
        }

        const initParticles = () => {
            particles = [];
            if (variant === 'aurora') return; // pure CSS background, no canvas particles needed

            const numberOfParticles = (canvas.width * canvas.height) / mappedArea;
            for (let i = 0; i < numberOfParticles; i++) {
                particles.push(new Particle());
            }
        };

        const connectPlexus = () => {
            let opacityValue = 1;

            // Check light mode state directly from the document HTML attribute
            const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';
            const connectColor = '108, 99, 255'; // Keep primary brand color
            // Use darker opacities for light mode since the background is white
            const mouseLineOpacityMultiplier = isLightMode ? 0.7 : 0.4;
            const particleLineOpacityMultiplier = isLightMode ? 0.3 : 0.15;

            for (let a = 0; a < particles.length; a++) {
                // Connect particles to the mouse
                if (interactive && mouseRef.current.x !== null) {
                    let dxMouse = particles[a].x - mouseRef.current.x;
                    let dyMouse = particles[a].y - mouseRef.current.y;
                    let distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

                    if (distanceMouse < mouseRef.current.radius) {
                        opacityValue = 1 - (distanceMouse / mouseRef.current.radius);
                        ctx.strokeStyle = `rgba(${connectColor}, ${opacityValue * mouseLineOpacityMultiplier})`;
                        ctx.lineWidth = isLightMode ? 1.5 : 1.2;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
                        ctx.stroke();
                    }
                }

                // Connect particles to each other
                for (let b = a; b < particles.length; b++) {
                    let dx = particles[a].x - particles[b].x;
                    let dy = particles[a].y - particles[b].y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        opacityValue = 1 - (distance / 150);
                        ctx.strokeStyle = `rgba(${connectColor}, ${opacityValue * particleLineOpacityMultiplier})`;
                        ctx.lineWidth = isLightMode ? 1.2 : 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (variant !== 'aurora') {
                for (let i = 0; i < particles.length; i++) {
                    particles[i].update();
                    particles[i].draw();
                }

                if (variant === 'plexus') {
                    connectPlexus();
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);

        const onMouseMove = (e) => {
            mouseRef.current.x = e.clientX;
            mouseRef.current.y = e.clientY;
        };

        const onMouseOut = () => {
            mouseRef.current.x = null;
            mouseRef.current.y = null;
        };

        if (interactive) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseout', onMouseOut);
        }

        // Watch for theme changes to trigger a redraw with new opacities
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    // Force a re-render of particles logic with new light/dark mode assumptions
                    initParticles();
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        resize();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            if (interactive) {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseout', onMouseOut);
            }
            observer.disconnect();
            cancelAnimationFrame(animationFrameId);
        };
    }, [density, speed, interactive, variant]);

    return (
        <div className={styles.backgroundWrapper}>
            <div className={styles.glowLayer} style={{ opacity: glowOpacity / 100 }}>
                <div className={styles.glowPrimary} />
                <div className={styles.glowSecondary} />
            </div>
            {variant !== 'aurora' && <canvas ref={canvasRef} className={styles.canvas} />}
            <div className={styles.noise} />
        </div>
    );
};

export default AnimatedBackground;
