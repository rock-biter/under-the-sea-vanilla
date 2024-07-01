#include <common>
		
uniform float uTime;
uniform float uHeight;
uniform sampler2D uSandNoise;
uniform sampler2D uSandNormalTexture;
uniform sampler2D uVoronoiNoise;
varying vec2 vUv;
varying vec3 modelPosition;

#ifndef RANDOM_SCALE
#ifdef RANDOM_HIGHER_RANGE
#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)
#else
#define RANDOM_SCALE vec4(443.897, 441.423, .0973, .1099)
#endif
#endif

// root
float smin( float a, float b, float k )
{
    k *= 2.0;
    float x = b-a;
    return 0.5*( a+b-sqrt(x*x+k*k) );
}

float sand_noise(vec2 iUv) {
  float t =  uTime * .1;
  iUv += t;
  float sinVal = iUv.x * 40. + iUv.y * 40. + cos(iUv.y * 7.) * 2.;
  float sandNoise = sin(sinVal - abs(sin(sinVal)) * 0.4);
  sandNoise *= sandNoise;
  sandNoise += sin(iUv.x * 5.) + cos(iUv.y * 5.);
  // sandNoise *= sandNoise;
  // sandNoise = smin(sandNoise, uHeight,0.3);
  
  float textureNoise = texture(uSandNoise,iUv * 0.7).r * 0.08;

  sandNoise *= 0.07;

  return sandNoise + textureNoise;
}

vec3 random3(float p) {
    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.xxy + p3.yzz) * p3.zyx); 
}

vec3 random3(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);
    p3 += dot(p3, p3.yxz + 19.19);
    return fract((p3.xxy + p3.yzz) * p3.zyx);
}

vec3 random3(vec3 p) {
    p = fract(p * RANDOM_SCALE.xyz);
    p += dot(p, p.yxz + 19.19);
    return fract((p.xxy + p.yzz) * p.zyx);
}

#ifndef FNC_WORLEY
#define FNC_WORLEY

// float worley(vec2 p){
//     vec2 n = floor( p );
//     vec2 f = fract( p );

//     float dis = 1.0;
//     for( int j= -1; j <= 1; j++ )
//         for( int i=-1; i <= 1; i++ ) {  
//                 vec2  g = vec2(i,j);
//                 vec2  o = random2( n + g );
//                 vec2  delta = g + o - f;
//                 float d = length(delta);
//                 dis = min(dis,d);
//     }

//     return 1.0-dis;
// }

float worley(vec3 p) {
    vec3 n = floor( p );
    vec3 f = fract( p );

    float dis = 1.0;
    for( int k = -1; k <= 1; k++ )
        for( int j= -1; j <= 1; j++ )
            for( int i=-1; i <= 1; i++ ) {  
                vec3  g = vec3(i,j,k);
                vec3  o = random3( n + g );
                vec3  delta = g+o-f;
                float d = length(delta);
                dis = min(dis,d);
    }

    return 1.0-dis;
}

#endif