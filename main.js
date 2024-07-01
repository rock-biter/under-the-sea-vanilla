import './style.css'
import * as THREE from 'three'
import Stats from 'stats.js'
import sand_project_vertex from './src/shaders/sand/project_vertex.glsl'
import sand_common from './src/shaders/sand/common.glsl'
// __controls_import__
// __gui_import__

const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

const textureLoader = new THREE.TextureLoader()

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

/**
 * Debug
 */
// __gui__
const configs = {
	example: 5,
	sandColor: 0x686885,
	height: 0.75,
}
const gui = new dat.GUI()
gui.add(configs, 'example', 0, 10, 0.1).onChange((val) => console.log(val))
gui
	.add(configs, 'height', 0, 1, 0.01)
	.onChange((val) => (globalUniforms.uHeight.value = val))
gui.addColor(configs, 'sandColor').onChange((val) => {
	sandMaterial.color.set(val)
})

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

scene.fog = new THREE.Fog(0x111144, 0, 30)
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
const sandGeometry = new THREE.PlaneGeometry(10, 10, 250, 250)
sandGeometry.rotateX(-Math.PI * 0.5)

// const planeG = new THREE.PlaneGeometry(10, 10)
// const planeM = new THREE.MeshStandardMaterial({ color: 'white' })
// scene.add(new THREE.Mesh(planeG, planeM))

const globalUniforms = {
	uTime: { value: 0 },
	uHeight: { value: 1 },
}

sandMaterial.onBeforeCompile = (shader) => {
	console.log(shader.fragmentShader)

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

		float d3 = 1. - worley(vec3(vUv * 5. + vec2(sin(vUv.y * 20.) * 0.05,cos(vUv.x * 20.) * 0.05) - uTime * 0.2 ,uTime * 0.5) );
		float d4 = 1. - worley(vec3(vUv * 5. + vec2(sin(vUv.y * 20.) * 0.05,cos(vUv.x * 20.) * 0.05) - uTime * 0.2 + 0.05 ,uTime * 0.5) );

		diffuseColor.rgb += vec3(0.2,0.6,0.8) * d3 * 0.6;

		vec3 lightsColor = vec3(0.9,0.8,0.8);
		d3 *= d3 * d3;
		d4 *= d4 * d4;

		diffuseColor.rgb += vec3(0.9,0.5,0.5) * d4 * 0.4;
		diffuseColor.rgb += vec3(0.5,0.7,0.5) * d3 * 0.8;

	`
	)
}

// ground.position.y = 0.5
// ground.matrixAutoUpdate = true
const size = 3

for (let i = 0; i < size; i++) {
	for (let j = 0; j < size; j++) {
		const x = i * 10 - size * 10 * 0.5 + 5
		const z = j * 10 - size * 10 * 0.5 + 5

		const sandChunk = new THREE.Mesh(sandGeometry, sandMaterial)
		sandChunk.position.x = x
		sandChunk.position.z = z

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
camera.position.set(-4, 4, 6)
camera.lookAt(new THREE.Vector3(0, 2.5, 0))

/**
 * Show the axes of coordinates system
 */
// __helper_axes__
const axesHelper = new THREE.AxesHelper(3)
// scene.add(axesHelper)

/**
 * renderer
 */
const renderer = new THREE.WebGLRenderer({
	antialias: window.devicePixelRatio < 2,
	logarithmicDepthBuffer: true,
})
document.body.appendChild(renderer.domElement)
handleResize()

/**
 * OrbitControls
 */
// __controls__
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 1)
const directionalLight = new THREE.DirectionalLight(0xffffff, 3)
directionalLight.position.set(-4, 4, 4)
scene.add(ambientLight, directionalLight)

/**
 * Three js Clock
 */
// __clock__
const clock = new THREE.Clock()

/**
 * frame loop
 */
function tic() {
	stats.begin()
	/**
	 * tempo trascorso dal frame precedente
	 */
	// const deltaTime = clock.getDelta()
	/**
	 * tempo totale trascorso dall'inizio
	 */
	const time = clock.getElapsedTime()

	// __controls_update__
	controls.update()

	globalUniforms.uTime.value = time

	renderer.render(scene, camera)

	directionalLight.position.x = Math.sin(time) * 3

	stats.end()

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

	renderer.setSize(sizes.width, sizes.height)

	const pixelRatio = Math.min(window.devicePixelRatio, 2)
	renderer.setPixelRatio(pixelRatio)
}
