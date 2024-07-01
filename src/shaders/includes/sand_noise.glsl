float sand_noise(vec2 iUv) {
  float sandNoise = sin(iUv.x);
  sandNoise += texture(uSandNoise,iUv).r;
  // sandNoise = sandNoise * 2. - 1.;
  // sandNoise *= 0.05;

  return sandNoise;
}