import * as THREE from 'three'
import vertexShader from './shaders/particles/vertex.glsl'
import fragmentShader from './shaders/particles/fragment.glsl'

export default class Particles extends THREE.Object3D {
	uniforms = {
		uTime: { value: 0 },
	}

	constructor({ numbers, bounds = 30 }) {
		super()
		// Geometry
		const particlesGeometry = new THREE.BufferGeometry()
		const count = numbers

		const positions = new Float32Array(count * 3)
		const colors = new Float32Array(count * 3)

		const colorsArray = [
			new THREE.Color('#fdffdc'),
			new THREE.Color('#092b5b'),
			new THREE.Color('#421809'),
		]

		for (let i = 0; i < count; i++) {
			const j = i * 3
			const x = (Math.random() - 0.5) * bounds
			const z = (Math.random() - 0.5) * bounds
			const y = Math.random() ** 2 * 0.5 * 10

			positions[j] = x
			positions[j + 1] = y
			positions[j + 2] = z

			const color = colorsArray[i % 3]
			const [r, g, b] = color

			console.log(r, g, b)
			colors[j] = r
			colors[j + 1] = g
			colors[j + 2] = b
		}

		particlesGeometry.setAttribute(
			'position',
			new THREE.BufferAttribute(positions, 3)
		)
		particlesGeometry.setAttribute(
			'color',
			new THREE.BufferAttribute(colors, 3)
		)

		const particlesMaterial = new THREE.ShaderMaterial({
			vertexShader,
			fragmentShader,
			uniforms: this.uniforms,
			transparent: true,
			depthWrite: false,
			blendEquation: THREE.AdditiveBlending,
		})

		const pointMaterial = new THREE.PointsMaterial()
		pointMaterial.onBeforeCompile = (shader) => {
			console.log('point material')
			console.log(shader.fragmentShader, shader.vertexShader)
		}

		const particles = new THREE.Points(particlesGeometry, particlesMaterial)
		this.particles = particles
		this.add(particles)
	}
}
