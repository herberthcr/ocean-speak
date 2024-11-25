// Source: http://glslsandbox.com/e#39712.0

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
            uniform sampler2D uMainSampler;
            varying vec2 outTexCoord;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    // Adjust the UV coordinates to create a wave effect
    uv.y += sin(uv.x * 10.0 + time * 2.0) * 0.02; // Horizontal waves
    uv.x += cos(uv.y * 10.0 + time * 2.0) * 0.02; // Vertical waves

    // Create a gradient background for the water effect
    vec3 color = vec3(0.0, 0.5 + 0.5 * uv.y, 1.0); // Blue gradient

    gl_FragColor = vec4(color, 1.0);
}
