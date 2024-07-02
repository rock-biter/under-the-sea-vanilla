attribute vec3 color;
uniform float uTime;
varying float dist;
varying vec3 vColor;

void main() {
  vColor = color;

  vec4 mvPosition = vec4(position,1.);
  vec4 mwPosition = modelMatrix * mvPosition;

  float speed = 2.;
  mwPosition.xyz += vec3(-uTime * speed,0,-uTime * speed);
  float dy = sin((uTime + mwPosition.x + mwPosition.y) * 0.2);
  float dx = sin((uTime + mwPosition.x + mwPosition.y) * 5.) * 0.1;
  mwPosition.y += dy;
  mwPosition.x -= dx;
  mwPosition.z += dx;
  mwPosition.xz = mod(mwPosition.xz + vec2(45.*0.5),vec2(45)) - vec2(45.*0.5);

  mvPosition = projectionMatrix * viewMatrix * mwPosition;

  gl_Position = mvPosition;
  dist = smoothstep(40.,0.,length(mwPosition.xyz));
  gl_PointSize = 5. * dist;

}