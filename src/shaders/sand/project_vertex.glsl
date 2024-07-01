vec4 mvPosition = vec4( transformed, 1.0 );

#ifdef USE_BATCHING

	mvPosition = batchingMatrix * mvPosition;

#endif

#ifdef USE_INSTANCING

	mvPosition = instanceMatrix * mvPosition;

#endif

mvPosition = modelMatrix * mvPosition;

mvPosition.y += sand_noise(mvPosition.xz * 0.1);
// modelPosition.y += sand_noise(uv);
vUv = mvPosition.xz * 0.1;


mvPosition = viewMatrix * mvPosition;

gl_Position = projectionMatrix * mvPosition;