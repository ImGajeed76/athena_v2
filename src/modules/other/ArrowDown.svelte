<script>
    import { onMount } from 'svelte';

    let svgRef;

    onMount(() => {
        let lastTimestamp = null;

        const drawWave = (timestamp) => {
            if (!lastTimestamp) {
                lastTimestamp = timestamp;
            }

            svgRef.innerHTML = ''; // Clear previous SVG content

            const drawPath = timestamp - lastTimestamp;
            let d = `M ${svgRef.clientWidth / 2} 0 `;

            for (let i = 0; i < svgRef.clientHeight; i++) {
                let amplitude = 10 - i / 10;
                amplitude = Math.min(amplitude, 3.5);
                const sine = amplitude * Math.sin(0.25 * i + 0.005 * drawPath);
                d += ` L ${svgRef.clientWidth / 2 + sine} ${i}`;
            }

            d += ` M ${svgRef.clientWidth / 2 - 9} ${
                svgRef.clientHeight - 9
            } L ${svgRef.clientWidth / 2} ${svgRef.clientHeight} L ${
                svgRef.clientWidth / 2 + 9
            } ${svgRef.clientHeight - 9}`;

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", d);
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", "currentColor");
            path.setAttribute("stroke-width", "1.5");

            svgRef.appendChild(path);
            requestAnimationFrame(drawWave);
        };

        requestAnimationFrame(drawWave);
    });
</script>

<style>
    .animated-wave {
        display: block;
        margin: 0 auto;
    }
</style>

<svg bind:this={svgRef} class="animated-wave" width="20" height="100"></svg>
