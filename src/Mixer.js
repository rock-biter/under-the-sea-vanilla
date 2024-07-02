import { Audio, AudioListener, AudioLoader } from 'three'

export default class Mixer {
	paused = true
	playlist = []
	// controls = {
	// 	play: null,
	// 	pause: null,
	// 	next: null,
	// 	prev: null,
	// 	repeat: null,
	// 	context: null,
	// }

	// domElement = null

	constructor({ sounds = [], loadingManager, camera }) {
		this.sounds = sounds

		this.loader = new AudioLoader(loadingManager)
		this.listener = new AudioListener()

		if (camera) {
			this.camera = camera
			camera.add(this.listener)
		}

		this.init()
	}

	async init() {
		await this.loadAll()
		// console.log(this.playlist)
		// this.initHTML()

		window.addEventListener('click', () => {
			this.playlist[this.currentTrack].audio.play()
		})
	}

	initHTML() {
		this.domElement = document.getElementById('audio-player')

		this.controls.play = document.getElementById('play')
		this.controls.pause = this.controls.play
		this.controls.next = document.getElementById('next')
		this.controls.prev = document.getElementById('prev')
		this.controls.repeat = document.getElementById('repeat')
		this.controls.context = document.getElementById('context')

		console.log(this.controls)
	}

	async loadAll() {
		const audioBuffers = await Promise.all(
			this.sounds.map(async ({ src }) => await this.load(src))
		).catch((err) => {
			console.log('load all error', err)
		})

		this.playlist = audioBuffers?.map((buffer, i) => {
			const audio = new Audio(this.listener)
			audio.setBuffer(buffer)
			if (this.camera) {
				this.camera.add(audio)
			}
			return { audio, name: this.sounds[i].name }
		})

		this.currentTrack = 0
	}

	async load(src) {
		return new Promise((resolve, reject) => {
			this.loader.load(
				src,
				(audioBuffer) => {
					console.log('buffer', audioBuffer)
					return resolve(audioBuffer)
				},
				() => {},
				(err) => {
					console.log('load error', err)
					return reject()
				}
			)
		})
	}

	onLoading = function () {}
}
