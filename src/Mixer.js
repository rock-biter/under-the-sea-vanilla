import gsap from 'gsap'
import { Audio, AudioListener, AudioLoader } from 'three'

export default class Mixer {
	paused = true
	playlist = []
	controls = {
		play: null,
		pause: null,
		next: null,
		prev: null,
		repeat: null,
		context: null,
	}
	currentTrack = null

	domElement = null
	domTracksListWrapper = null
	domCurrentTrackInfo = null
	contextOpen = false

	constructor({ sounds = [], loadingManager, camera }) {
		this.sounds = sounds

		this.loader = new AudioLoader(loadingManager)
		this.listener = new AudioListener()

		if (camera) {
			this.camera = camera
			camera.add(this.listener)
		}

		this.init()

		// setInterval(() => {
		// 	if (this.currentTrack) {
		// 		console.log(
		// 			this.currentTrack.audio.context.currentTime,
		// 			this.currentTrack.audio.context
		// 		)
		// 	}
		// }, 1000)
	}

	pause() {
		if (this.currentTrack && this.currentTrack.audio.isPlaying) {
			this.currentTrack.audio.pause()
			this.updatePlayingTrackUi(false)
			//update ui
		}
	}

	next() {
		let i = this.playlist.indexOf(this.currentTrack)
		if (i > -1) {
			i++

			i = i % this.playlist.length
			this.pause()
			this.play(this.playlist[i])
		} else {
			this.play(this.playlist[0])
		}
	}

	prev() {
		let i = this.playlist.indexOf(this.currentTrack)
		if (i > -1) {
			i--

			if (i < 0) {
				i = this.playlist.length - 1
			}
			this.pause()
			this.play(this.playlist[i])
		} else {
			this.play(this.playlist[0])
		}
	}

	updatePlayingTrackUi(setPlay = true) {
		const { play } = this.controls

		if (setPlay) {
			play.classList.remove('pause')
			play.classList.add('play')
		} else {
			play.classList.remove('play')
			play.classList.add('pause')
		}
	}

	play(track) {
		if (track === this.currentTrack && track.audio.isPlaying) return
		if (track === this.currentTrack) {
			track.audio.play()
			this.updatePlayingTrackUi()
		}

		// console.log(this.currentTrack, track)
		if (!this.currentTrack || this.currentTrack !== track) {
			this.currentTrack = track
			track.audio.play()
			this.updatePlayingTrackUi()
			track.domElement.classList.add('active')

			this.domCurrentTrackInfo.innerHTML = `
      <div class="grow">
        <h3 class="text-white text-xs">${track.name}</h3>
        <p>${track.author}</p>
      </div>
      <div class="text-xs">${this.getFormattedDuration(track)}</div>
      `
		} else if (this.currentTrack.audio.isPlaying) {
			// console.log('stop')
			this.currentTrack.audio.stop()
			this.currentTrack.domElement.classList.remove('active')
			// update ui
			this.currentTrack = null
			this.play(track)
		}
	}

	getFormattedDuration(track) {
		// console.log('track', track)
		const duration = track.audio.buffer.duration

		let s = Math.floor(duration % 60)
		const m = Math.floor(duration / 60)

		if (s < 10) {
			s = `0${s}`
		}

		return `${m}:${s}`
	}

	async init() {
		await this.loadAll()
		// console.log(this.playlist)
		this.initHTML()

		gsap.fromTo(
			['#pixabay', '#player'],
			{
				autoAlpha: 0,
				y: 100,
			},
			{
				autoAlpha: 1,
				duration: 0.5,
				y: 0,
				stagger: {
					each: 0.3,
					from: 'end',
				},
			}
		)

		// window.addEventListener('click', () => {
		// 	this.playlist[this.currentTrack].audio.play()
		// })
	}

	initHTML() {
		this.domElement = document.getElementById('audio-player')
		this.domTracksListWrapper = document.getElementById('tracks-list')
		this.domCurrentTrackInfo = document.getElementById('current-track-info')

		this.controls.play = document.getElementById('play')
		this.controls.pause = this.controls.play
		this.controls.next = document.getElementById('next')
		this.controls.prev = document.getElementById('prev')
		this.controls.repeat = document.getElementById('repeat')
		this.controls.context = document.getElementById('context')

		// console.log(this.controls)
		this.domTracksListWrapper.innerHTML = ''

		this.playlist.forEach((track) => {
			this.domTracksListWrapper.append(track.domElement)

			track.audio.onEnded = () => {
				if (!track.audio.getLoop()) {
					this.next()
				}
			}

			track.domElement.addEventListener('click', () => {
				// console.log('click on track')
				this.pause()
				this.play(track)
			})
		})

		this.domCurrentTrackInfo.innerHTML = `
      <div class="grow">
        <h3 class="text-white text-xs">${this.playlist[0].name}</h3>
        <p>${this.playlist[0].author}</p>
      </div>
      <div class="text-xs">${this.getFormattedDuration(this.playlist[0])}</div>
      `

		this.initControls()
	}

	getTrackDomElement(track, audio) {
		const li = document.createElement('li')
		li.className =
			'flex gap-4 items-center py-4 px-4 last:rounded-b-lg first:rounded-t-lg hover:bg-white/5 cursor-pointer'
		li.innerHTML = `
    <div
      class="w-7 flex items-center justify-center hover:text-gray-300 cursor-pointer"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="currentColor"
      >
        <path
          d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z"
        />
      </svg>
    </div>
    <div class="grow">
      <h3 class="text-white text-xs">${track.name}</h3>
      <p>${track.author || ''}</p>
    </div>
    <div class="text-xs">${this.getFormattedDuration({ audio })}</div>
    `

		return li
	}

	async loadAll() {
		const audioBuffers = await Promise.all(
			this.sounds.map(async ({ src }) => await this.load(src))
		).catch((err) => {
			// console.log('load all error', err)
		})

		this.playlist = audioBuffers?.map((buffer, i) => {
			const audio = new Audio(this.listener)
			audio.setBuffer(buffer)
			if (this.camera) {
				this.camera.add(audio)
			}
			return {
				audio,
				name: this.sounds[i].name,
				domElement: this.getTrackDomElement(this.sounds[i], audio),
			}
		})

		this.currentTrack = this.playlist[0]
	}

	async load(src) {
		return new Promise((resolve, reject) => {
			this.loader.load(
				src,
				(audioBuffer) => {
					// console.log('buffer', audioBuffer)
					return resolve(audioBuffer)
				},
				() => {},
				(err) => {
					// console.log('load error', err)
					return reject()
				}
			)
		})
	}

	initControls() {
		const { play, pause, next, prev, repeat, context } = this.controls

		// console.log(play, pause, next, prev, repeat)

		repeat.addEventListener('click', () => {
			repeat.classList.toggle('!text-blue-300')

			this.playlist.forEach(({ audio }) => {
				audio.setLoop(!audio.getLoop())
			})
		})

		play.addEventListener('click', () => {
			// console.log(this.currentTrack)
			if (this.currentTrack && this.currentTrack.audio.isPlaying) {
				this.pause()
			} else {
				this.play(this.currentTrack)
			}
		})

		next.addEventListener('click', () => {
			this.next()
		})

		prev.addEventListener('click', () => {
			this.prev()
		})

		// const tweenClose = gsap.to(this.domTracksListWrapper, {
		// 	autoAlpha: 0,
		// 	duration: 1,
		// 	y: -50,
		// 	ease: 'power3.in',
		// })

		this.domTracksListWrapper.addEventListener('mouseleave', () => {
			gsap.to(this.domTracksListWrapper, {
				autoAlpha: 0,
				duration: 0.15,
				y: -50,
				ease: 'power3.out',
			})
			this.contextOpen = !this.contextOpen
		})

		context.addEventListener('click', () => {
			// console.log('click context')
			if (this.contextOpen) {
				gsap.to(this.domTracksListWrapper, {
					autoAlpha: 0,
					duration: 0.15,
					y: -50,
					ease: 'power3.out',
				})
			} else {
				gsap.fromTo(
					this.domTracksListWrapper,
					{
						autoAlpha: 0,
						y: -50,
					},
					{
						autoAlpha: 1,
						duration: 0.3,
						y: 0,
						ease: 'power3.out',
					}
				)
			}

			this.contextOpen = !this.contextOpen
		})
	}

	onLoading = function () {}
}
