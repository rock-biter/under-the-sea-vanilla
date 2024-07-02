varying float dist;
varying vec3 vColor;

void main() {

  float strenght = distance(gl_PointCoord,vec2(0.5));
  strenght *= 2.;
  strenght = smoothstep(0.,1.,1. - strenght);

  gl_FragColor = vec4(vColor,strenght * dist * 0.3);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  
}