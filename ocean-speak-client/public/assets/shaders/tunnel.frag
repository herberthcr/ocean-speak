// Source: http://glslsandbox.com/e#39712.0

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

void main( void ) {
    vec2 pos1=gl_FragCoord.xy/resolution.x-vec2(0.50,resolution.y/resolution.x/2.0);
    float l1=length(pos1);
    float l2=step(0.5,fract(1.0/l1+time/1.8));
    float a=step(0.5,fract(0.1*sin(20.*l1+time*1.)/l1+atan(pos1.x,pos1.y)*3.));
        vec2 uv = gl_FragCoord.xy / resolution.xy;

    // Adjust the UV coordinates to create a wave effect
    uv.y += sin(uv.x * 10.0 + time * 2.0) * 0.02; // Horizontal waves
    uv.x += cos(uv.y * 10.0 + time * 2.0) * 0.02; // Vertical waves
    
    if(a!=l2 && l1>0.05){
           vec3 color = vec3(0.0, 0.5 + 0.5 * uv.y, 1.0); // Blue gradient
           gl_FragColor = vec4(color, 1.0);
    }
}