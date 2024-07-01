import './style.css'
import * as THREE from 'three'
import Stats from 'stats.js'
import sand_project_vertex from './src/shaders/sand/project_vertex.glsl'
import sand_common from './src/shaders/sand/common.glsl'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
// __controls_import__
// __gui_import__

// const stats = new Stats()
// stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
// document.body.appendChild(stats.dom)

const glftLoader = new GLTFLoader()

// sea star

// let fishMixer, fish
// glftLoader.load('/models/fish.glb', (gltf) => {
// 	console.log('fish', gltf)

// 	const model = gltf.scene

// 	model.scale.setScalar(0.5)
// 	// model.rotation.y = Math.PI * 0.5
// 	fish = model
// 	scene.add(model)

// 	fishMixer = new THREE.AnimationMixer(model)
// 	const swim = fishMixer.clipAction(gltf.animations[0])

// 	swim.play()
// })

let turtleMixer, turtle

glftLoader.load('/models/turtle.glb', (gltf) => {
	console.log(gltf.scene)

	const model = gltf.scene
	model.scale.setScalar(0.04)
	// model.position.y = 3
	model.position.x = -1
	model.position.z = -1
	model.rotation.y = Math.PI * -0.75
	model.rotation.order = 'YXZ'

	turtle = model

	const meshes = []

	// model.castShadow = true

	model.traverse((el) => {
		if (el.material) {
			meshes.push(el)
		}
	})

	// console.log(meshes)

	meshes.forEach(({ material }) => {
		material.onBeforeCompile = (shader) => {
			shader.uniforms.uTime = globalUniforms.uTime

			shader.vertexShader = shader.vertexShader.replace(
				'#include <common>',
				sand_common
			)

			shader.fragmentShader = shader.fragmentShader.replace(
				'#include <common>',
				sand_common
			)

			let token = '#include <project_vertex>'

			shader.vertexShader = shader.vertexShader.replace(
				token,
				/*glsl */ `
				vec4 mvPosition = vec4( transformed, 1.0 );

#ifdef USE_BATCHING

	mvPosition = batchingMatrix * mvPosition;

#endif

#ifdef USE_INSTANCING

	mvPosition = instanceMatrix * mvPosition;

#endif

mvPosition = modelMatrix * mvPosition;

// mvPosition.y += sand_noise(mvPosition.xz * 0.1);
// modelPosition.y += sand_noise(uv);
vUv = mvPosition.xz * 0.4;


mvPosition = viewMatrix * mvPosition;

gl_Position = projectionMatrix * mvPosition;
				`
			)

			token = '#include <normal_fragment_maps>'

			shader.fragmentShader = shader.fragmentShader.replace(
				token,
				/*glsl */ `
		#include <normal_fragment_maps>

		// float d3 = 1. - worley(vec3(vUv * 3. + vec2(sin(vUv.x),cos(vUv.y)) + uTime * 0.4,uTime * 0.4) );

		// reduce duoble calc

		float d3 = 1. - worley(vec3(vUv * 5. + vec2(sin(vUv.y * 20.) * 0.05,cos(vUv.x * 20.) * 0.05) - uTime * 0.05 ,uTime * 0.5) );
		float d4 = 1. - worley(vec3(vUv * 5. + vec2(sin(vUv.y * 20.) * 0.05,cos(vUv.x * 20.) * 0.05) - uTime * 0.05 + 0.05 ,uTime * 0.5) );

		float i = max(dot(normal,vec3(0,1,0)),0.);

		diffuseColor.rgb += vec3(0.2,0.6,0.8) * d3 * 0.9 * i;

		vec3 lightsColor = vec3(0.9,0.8,0.8);
		d3 *= d3 * d3 ;
		d4 *= d4 * d4 ;

		diffuseColor.rgb += vec3(0.9,0.5,0.5) * d4 * 0.7 * i;
		diffuseColor.rgb += vec3(0.5,0.7,0.5) * d3 * 1. * i;

	`
			)

			// console.log(shader.fragmentShader)
		}
	})

	scene.add(model)

	turtleMixer = new THREE.AnimationMixer(gltf.scene)
	const swim = turtleMixer.clipAction(gltf.animations[0])

	swim.play()
})

const textureLoader = new THREE.TextureLoader()

const spokeTexture = textureLoader.load('/textures/spoke-02.png')

const voroniNoise = textureLoader.load('/textures/voronoi-03.png')
voroniNoise.wrapS = THREE.RepeatWrapping
voroniNoise.wrapT = THREE.RepeatWrapping

const sandNoise = textureLoader.load('/textures/gabor-04.png')
sandNoise.wrapS = THREE.RepeatWrapping
sandNoise.wrapT = THREE.RepeatWrapping

const sandNormalTexture = textureLoader.load('/textures/sand-normal.jpg')
sandNormalTexture.wrapS = THREE.RepeatWrapping
sandNormalTexture.wrapT = THREE.RepeatWrapping
sandNormalTexture.repeat.y = -1

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as dat from 'lil-gui'
import { GLTFLoader, ShaderPass } from 'three/examples/jsm/Addons.js'
import { vec3 } from 'three/examples/jsm/nodes/Nodes.js'

/**
 * Debug
 */
// __gui__
const configs = {
	example: 5,
	sandColor: 0x686885,
	height: 0.75,
}
// const gui = new dat.GUI()
// gui.add(configs, 'example', 0, 10, 0.1).onChange((val) => console.log(val))
// gui
// 	.add(configs, 'height', 0, 1, 0.01)
// 	.onChange((val) => (globalUniforms.uHeight.value = val))
// gui.addColor(configs, 'sandColor').onChange((val) => {
// 	sandMaterial.color.set(val)
// })

const sandColor = new THREE.Color(configs.sandColor)

/**
 * Scene
 */
const scene = new THREE.Scene()
// scene.background = new THREE.Color(0xdedede)

// __box__
/**
 * BOX
 */
// const material = new THREE.MeshNormalMaterial()
const material = new THREE.MeshStandardMaterial({ color: 'coral' })
const geometry = new THREE.BoxGeometry(1, 1, 1)
const mesh = new THREE.Mesh(geometry, material)
mesh.position.y += 0.5
mesh.position.x = 10
// scene.add(mesh)

scene.fog = new THREE.Fog(0x111144, -3, 20)
scene.background = new THREE.Color(0x111144)

// __floor__
/**
 * Sand
 */
const sandMaterial = new THREE.MeshStandardMaterial({
	color: sandColor,
	// flatShading: true,
	// wireframe: true,
})
const tile = 15
const sandGeometry = new THREE.PlaneGeometry(tile, tile, tile * 25, tile * 25)
sandGeometry.rotateX(-Math.PI * 0.5)

// const planeG = new THREE.PlaneGeometry(10, 10)
// const planeM = new THREE.MeshStandardMaterial({ color: 'white' })
// scene.add(new THREE.Mesh(planeG, planeM))

const globalUniforms = {
	uTime: { value: 0 },
	uHeight: { value: 1 },
	uResolution: { value: new THREE.Vector2(0, 0) },
}

sandMaterial.onBeforeCompile = (shader) => {
	// console.log(shader.fragmentShader)

	shader.uniforms.uSandNoise = new THREE.Uniform(sandNoise)
	shader.uniforms.uSandNormalTexture = new THREE.Uniform(sandNormalTexture)
	shader.uniforms.uTime = globalUniforms.uTime
	shader.uniforms.uHeight = globalUniforms.uHeight
	shader.uniforms.uVoronoiNoise = new THREE.Uniform(voroniNoise)

	let token = '#include <project_vertex>'

	shader.vertexShader = shader.vertexShader.replace(
		'#include <common>',
		sand_common
	)
	shader.vertexShader = shader.vertexShader.replace(token, sand_project_vertex)

	shader.fragmentShader = shader.fragmentShader.replace(
		'#include <common>',
		sand_common
	)
	// edit normals
	token = '#include <normal_fragment_maps>'

	shader.fragmentShader = shader.fragmentShader.replace(
		token,
		/*glsl*/ `
		
		#include <normal_fragment_maps>


		float sandNoise = sand_noise(vUv);
		float delta = 0.01;
		vec3 pos = vec3(vUv.x,sandNoise * 0.1, vUv.y);
		vec3 posA = vec3(pos.x + delta,0.,pos.z);
		vec3 posB = vec3(pos.x,0.,pos.z + delta);

		vec2 vUvA = vec2(vUv.x + delta, vUv.y);
		vec2 vUvB = vec2(vUv.x, vUv.y + delta);
		posA.y += sand_noise(vUvA) * 0.1;
		posB.y += sand_noise(vUvB) * 0.1;

		vec3 toA = normalize(posA - pos);
		vec3 toB = normalize(posB - pos);
		normal = cross(toB,toA) * 1.5;
		// normal += normalize(texture2D( uSandNormalTexture, vUv * 10. ).xyz * 2.0 - 1.0);
		// normal = normalize(normal);

		normal = normalize( vec4(viewMatrix * vec4(normal,0)).xyz );
		// normal = mix(texture2D( uSandNormalTexture, vUv * 10. ).xyz * 2.0 - 1.0,normal,0.5);
		// normal = normalize(normal);
		`
	)

	token = '#include <color_fragment>'

	shader.fragmentShader = shader.fragmentShader.replace(
		token,
		/*glsl */ `
		#include <color_fragment>

		// float d3 = 1. - worley(vec3(vUv * 3. + vec2(sin(vUv.x),cos(vUv.y)) + uTime * 0.4,uTime * 0.4) );

		// reduce duoble calc

		float d3 = 1. - worley(vec3(vUv * 5. + vec2(sin(vUv.y * 20.) * 0.05,cos(vUv.x * 20.) * 0.05) - uTime * 0.05 ,uTime * 0.5) );
		float d4 = 1. - worley(vec3(vUv * 5. + vec2(sin(vUv.y * 20.) * 0.05,cos(vUv.x * 20.) * 0.05) - uTime * 0.05 + 0.05 ,uTime * 0.5) );

		diffuseColor.rgb += vec3(0.2,0.6,0.8) * d3 * 0.6;

		vec3 lightsColor = vec3(0.9,0.8,0.8);
		d3 *= d3 * d3;
		d4 *= d4 * d4;

		diffuseColor.rgb += vec3(0.9,0.5,0.5) * d4 * 0.4;
		diffuseColor.rgb += vec3(0.5,0.7,0.5) * d3 * 0.8;

		float shadow = length(rotate2D(vUv.xy,-3.14 * 0.25) * 10. * vec2(0.75,1.) - vec2(-0.5,-0.5));
		diffuseColor.rgb = mix(diffuseColor.rgb,vec3(0.,0.,0.),1. - smoothstep(0.5,4.,shadow));

	`
	)
}

// ground.position.y = 0.5
// ground.matrixAutoUpdate = true
const size = 3

for (let i = 0; i < size; i++) {
	for (let j = 0; j < size; j++) {
		const x = i * tile - size * tile * 0.5 + 5
		const z = j * tile - size * tile * 0.5 + 5

		const sandChunk = new THREE.Mesh(sandGeometry, sandMaterial)
		sandChunk.position.x = x
		sandChunk.position.z = z

		// sandChunk.receiveShadow = true

		console.log(sandChunk.position)

		// sandChunk.add(new THREE.AxesHelper(3))

		scene.add(sandChunk)
	}
}

/**
 * render sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
}

/**
 * Camera
 */
const fov = 60
const camera = new THREE.PerspectiveCamera(fov, sizes.width / sizes.height, 0.1)
camera.position.set(4, 6, 4)
camera.lookAt(new THREE.Vector3(0, 2.5, 0))

/**
 * Show the axes of coordinates system
 */
// __helper_axes__
const axesHelper = new THREE.AxesHelper(3)
// scene.add(axesHelper)
axesHelper.position.y = 2

/**
 * renderer
 */
const renderer = new THREE.WebGLRenderer({
	antialias: window.devicePixelRatio < 2,
	logarithmicDepthBuffer: true,
})

// renderer.shadowMap.enabled = true
document.body.appendChild(renderer.domElement)

/**
 * Post processing
 */
const effectComposer = new EffectComposer(renderer)
effectComposer.setSize(sizes.width, sizes.height)
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const renderPass = new RenderPass(scene, camera)
effectComposer.addPass(renderPass)

const godRayShader = {
	uniforms: {
		// uTexture: new Te
		uSpokeTexture: new THREE.Uniform(spokeTexture),
		tDiffuse: { value: null },
		uResolution: globalUniforms.uResolution,
		uTime: globalUniforms.uTime,
		uCameraPosition: { value: camera.position },
		uDeviceRatio: { value: 1 },
	},
	vertexShader: /*glsl */ `
        varying vec2 vUv;

        void main()
        {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

            vUv = uv;
        }
    `,
	fragmentShader: /*glsl */ `
        uniform sampler2D tDiffuse;
				uniform sampler2D uSpokeTexture;
				uniform vec2 uResolution;
				uniform vec3 uCameraPosition;
				uniform float uTime;
				uniform float uDeviceRatio;

        varying vec2 vUv;

        void main()
        {

						vec2 st = gl_FragCoord.xy / (uResolution.xy * uDeviceRatio);

            vec4 color = texture2D(tDiffuse, vUv);
						vec2 center = vec2(0.5,0.5);
						float dist = distance(vUv,center) + 0.3;

						float godRayAlpha = texture(uSpokeTexture, vUv ).r * 0.2;

						vec2 godPoint = vec2(0.5,3.9);
						vec2 pos = godPoint - st;
						
						float r = length(pos)*0.520;
						float a = atan(pos.y,pos.x);

						float t = uTime + uCameraPosition.x * uCameraPosition.y * uCameraPosition.z * 0.01;

						float f1 = abs(cos(a*90. + t * 2.)*sin(a*120. + t))*.8+.1;
						float f2 = abs(cos(a*150. + t)* sin(a*250. + t))*.8+.1;
						vec3 godRayColor1 = vec3(0.9,0.9,0.9 );
						vec3 godRayColor2 = vec3(0.1,0.5,0.9 );

						vec3 cornerColor = vec3(0.01,0.01,0.05);
            // gl_FragColor = color + vec4(rayColor,dist);
						gl_FragColor = mix(color, vec4(godRayColor1,1.),0.3 - smoothstep(f1,f1+0.9,r) * 0.3);
						gl_FragColor = mix(gl_FragColor, vec4(godRayColor2,1.),0.2 - smoothstep(f2,f2+0.9,r) * 0.2);
            gl_FragColor = mix(gl_FragColor, vec4(cornerColor,1.),dist);


						#include <tonemapping_fragment>
    				#include <colorspace_fragment>
        }
    `,
}

const godRayPass = new ShaderPass(godRayShader)
effectComposer.addPass(godRayPass)

handleResize()

/**
 * OrbitControls
 */
// __controls__
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.enablePan = false
controls.autoRotate = true
controls.minPolarAngle = Math.PI * 0.15
controls.maxPolarAngle = Math.PI * 0.5
controls.target.y = 2

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 1)
const directionalLight = new THREE.DirectionalLight(0xffffff, 10)
directionalLight.position.set(-4, 4, 4)
scene.add(ambientLight, directionalLight)

/**
 * Three js Clock
 */
// __clock__
const clock = new THREE.Clock()
let time = 0

/**
 * frame loop
 */
function tic() {
	// stats.begin()
	/**
	 * tempo trascorso dal frame precedente
	 */
	// const deltaTime = clock.getDelta()
	/**
	 * tempo totale trascorso dall'inizio
	 */
	const delta = clock.getElapsedTime() - time
	time = time + delta

	// __controls_update__
	controls.update()

	globalUniforms.uTime.value = time
	godRayPass.uniforms.uTime.value = time
	godRayPass.uniforms.uCameraPosition.value.set(...camera.position)

	// renderer.render(scene, camera)
	effectComposer.render()

	if (turtleMixer) {
		turtleMixer.update(delta)
	}

	// if (fishMixer) {
	// 	fishMixer.update(delta)
	// }
	if (turtle) {
		turtle.position.y = 3 + Math.sin(time * 0.7) * 0.3
		turtle.rotation.z = Math.PI * 0.05 * Math.sin(time * 0.7)
		turtle.rotation.x = Math.PI * 0.07 * Math.cos(time * 0.7)
	}

	// if (fish) {
	// 	let nextPos = new THREE.Vector3(
	// 		+Math.sin(time * 2 * 0.05) * 10 + Math.cos(time * 0.5 * 0.05) * 5 - 3,
	// 		0.5 + Math.sin(time * 0.7) * 0.3,
	// 		-Math.sin(time * 0.5 * 0.05) * 5 + Math.cos(time * 2.5 * 0.05) * 10 + 0
	// 	)
	// 	fish.lookAt(nextPos)
	// 	fish.position.copy(nextPos)

	// 	// fish.rotation.y = -Math.PI * 0.5 // + (fish.position.x - prevX) * 0.1 * Math.PI

	// 	// fish.position.z = -5 + Math.sin(time * 0.25) * 5 + Math.cos(time * 0.7) * 8
	// }
	// directionalLight.position.x = Math.sin(time) * 3

	// stats.end()

	requestAnimationFrame(tic)
}

requestAnimationFrame(tic)

window.addEventListener('resize', handleResize)

function handleResize() {
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight

	camera.aspect = sizes.width / sizes.height

	// camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix()

	const pixelRatio = Math.min(window.devicePixelRatio, 2)

	godRayPass.uniforms.uResolution.value.x = sizes.width
	godRayPass.uniforms.uResolution.value.y = sizes.height
	godRayPass.uniforms.uDeviceRatio.value = pixelRatio

	effectComposer.setSize(sizes.width, sizes.height)
	effectComposer.setPixelRatio(pixelRatio)

	renderer.setSize(sizes.width, sizes.height)

	renderer.setPixelRatio(pixelRatio)
}
