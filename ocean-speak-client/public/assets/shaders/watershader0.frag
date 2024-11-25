// Source: http://glslsandbox.com/e#39712.0

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
            uniform sampler2D uMainSampler;
            varying vec2 outTexCoord;

void main( void ) {
                vec2 uv = outTexCoord;
                uv.y += (sin((uv.x + (time * 0.5)) * 5.0) * 0.1) + (sin((uv.x + (time * 0.7)) * 10.0) * 0.01);
                vec4 texColor = texture2D(uMainSampler, uv);
                gl_FragColor = texColor;
    
}

