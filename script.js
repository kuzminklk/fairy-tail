/**
 * ЯСНА — лесная сказка в стихах
 * ---------------------------------------------------------------------------
 * A scroll-driven photo story in three cooperating parts:
 *
 *   1. STAGE — one fixed, full-viewport photograph behind the whole page.
 *      Each story section points at a stage layer through [data-layer].
 *      Layers cross-fade as the story advances; photographs are loaded lazily
 *      when their section is about to appear (the tiny blurred placeholders
 *      are already painted by CSS, so nothing ever flashes empty).
 *
 *   2. STORY UI — current chapter in the header, reading progress, chapter
 *      rail and the full-screen chapter index.
 *
 *   3. CODA — a horizontal filmstrip of all 17 frames and an accessible
 *      lightbox with keyboard / swipe navigation.
 *
 * Everything degrades gracefully: without JavaScript the verse is fully
 * readable and the LQIP photographs remain as a soft backdrop.
 */
;(() => {
	"use strict"

	/* ---------------------------------------------------------------------- */
	/* Helpers                                                                */
	/* ---------------------------------------------------------------------- */

	const body = document.body
	const html = document.documentElement
	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")

	/** Scroll behaviour that respects the user's motion preference. */
	const scrollBehavior = () => (reduceMotion.matches ? "auto" : "smooth")

	/** The closest section to the viewport's "focus line" (42% from top). */
	const focusLine = () => window.innerHeight * 0.42

	/**
	 * Section that owns the story right now. The body is a linear sequence of
	 * full-viewport chapters, so the last section whose top has crossed the
	 * focus line is the one the reader is looking at.
	 */
	function findActiveSection(sections) {
		let active = sections[0]
		for (const section of sections) {
			if (section.getBoundingClientRect().top <= focusLine()) {
				active = section
			}
		}
		return active
	}

	/* ---------------------------------------------------------------------- */
	/* Stage: lazy full-screen photographs                                    */
	/* ---------------------------------------------------------------------- */

	const layers = Array.from(document.querySelectorAll(".stage__layer"))
	const layerByKey = new Map(layers.map((layer) => [layer.dataset.layer, layer]))

	/* The one landscape frame in the collection. All other photographs are
	   2:3 portraits. Their real pixel widths differ, so width descriptors must
	   be taken from the actual renditions, not from their long-side names. */
	const LANDSCAPE_SLUGS = new Set(["16-dream-face"])

	const isLandscape = (slug) => LANDSCAPE_SLUGS.has(slug)

	/** Actual pixel widths of the generated renditions, keyed by file suffix. */
	function renditionWidths(slug) {
		return isLandscape(slug)
			? { 900: 900, 1800: 1800, 2400: 2400, 3600: 3600, full: 5472 }
			: { 900: 600, 1800: 1200, 2400: 1600, 3600: 2400, full: 3648 }
	}

	/**
	 * WebP candidates go up to the untouched original dimensions, so a wide or
	 * HiDPI screen can pick a file that is not upscaled. JPEG fallbacks stop at
	 * 2400px long side to keep the legacy path reasonable.
	 */
	function webpSrcset(slug) {
		const w = renditionWidths(slug)
		return [
			`assets/photos/${slug}-900.webp ${w[900]}w`,
			`assets/photos/${slug}-1800.webp ${w[1800]}w`,
			`assets/photos/${slug}-2400.webp ${w[2400]}w`,
			`assets/photos/${slug}-3600.webp ${w[3600]}w`,
			`assets/photos/${slug}-full.webp ${w.full}w`,
		].join(", ")
	}

	function jpgSrcset(slug) {
		const w = renditionWidths(slug)
		return [
			`assets/photos/${slug}-900.jpg ${w[900]}w`,
			`assets/photos/${slug}-1800.jpg ${w[1800]}w`,
			`assets/photos/${slug}-2400.jpg ${w[2400]}w`,
		].join(", ")
	}

	/*
	 * The stage photos are sized with 100lvh, which is constant while mobile
	 * browser chrome hides or reappears. Measure that large viewport once with a
	 * hidden probe instead of reading window.innerHeight (which changes).
	 */
	const viewportProbe = document.createElement("div")
	viewportProbe.setAttribute("aria-hidden", "true")
	viewportProbe.style.cssText =
		"position:fixed;top:0;left:0;width:0;height:100vh;height:100lvh;visibility:hidden;pointer-events:none;"
	document.body.appendChild(viewportProbe)

	/**
	 * The stage photo is object-fit: cover. On a portrait phone it is scaled by
	 * the large viewport height, so its rendered width is height × imageRatio —
	 * usually larger than 100vw. Passing that exact width to `sizes` stops the
	 * browser from under-selecting a small file and keeps the landscape view
	 * sharp.
	 */
	function stageSizes(slug) {
		const viewportWidth = window.innerWidth
		const stageHeight = viewportProbe.clientHeight || window.innerHeight
		const imageRatio = isLandscape(slug) ? 3 / 2 : 2 / 3
		const renderedWidth = Math.max(viewportWidth, stageHeight * imageRatio)
		// Floor rather than ceil: a one-pixel rounding-up can push the browser
		// to the next rendition tier and double the decoded memory for no visible
		// gain. A sub-pixel shortfall is imperceptible.
		return `${Math.max(1, Math.floor(renderedWidth))}px`
	}

	/* ---------------------------------------------------------------------- */
	/* Graduated stage photographs                                            */
	/* ---------------------------------------------------------------------- */

	/*
	 * Each layer is loaded in two steps:
	 *
	 *   1. a small preview as soon as the chapter is active or adjacent, so
	 *      scrolling always has something immediately available;
	 *   2. a high-resolution rendition (up to the original file) only after
	 *      scrolling has settled. The preview stays below it and is reused if the
	 *      high-resolution image is released again.
	 *
	 * High-resolution layers are released when the reader moves on. Without this
	 * a fast scroll would decode dozens of 30–80 MB surfaces and exhaust mobile
	 * memory, which was the cause of the stutter.
	 */
	const layerMedia = new Map()

	const HIGH_RES_DELAY = 240
	const STAGE_CLEANUP_DELAY = 1900
	let lastScrollAt = performance.now()
	let highResolutionTimer = 0
	let stageCleanupTimer = 0

	function mediaFor(layer) {
		let media = layerMedia.get(layer)
		if (!media) {
			media = { preview: null, high: null, highRequested: false }
			layerMedia.set(layer, media)
		}
		return media
	}

	function previewFileBase() {
		// Desktop previews are larger because the full-screen crop is wide; phones
		// use the smallest rendition to keep fast scrolling cheap.
		return window.innerWidth > 860 ? "2400" : "900"
	}

	/**
	 * Build a stacked <picture> for one layer. The preview is a single small
	 * file; the high-resolution tier uses the full responsive candidates and is
	 * only requested after an idle period.
	 */
	function buildStagePicture(slug, tier) {
		const picture = document.createElement("picture")
		const source = document.createElement("source")
		const img = document.createElement("img")
		const sizes = stageSizes(slug)

		picture.className = `stage-picture stage-picture--${tier}`
		source.type = "image/webp"
		source.sizes = sizes
		img.sizes = sizes
		img.alt = ""
		img.decoding = "async"
		img.loading = "eager"

		if (tier === "preview") {
			const base = previewFileBase()
			source.srcset = `assets/photos/${slug}-${base}.webp`
			img.src = `assets/photos/${slug}-${base}.jpg`
			img.fetchPriority = "auto"
		} else {
			source.srcset = webpSrcset(slug)
			img.src = `assets/photos/${slug}-2400.jpg`
			img.srcset = jpgSrcset(slug)
			img.fetchPriority = "low"
		}

		img.className = `stage-img stage-img--${tier}`
		picture.append(source, img)
		return { picture, img }
	}

	function loadPreview(layer) {
		if (!layer) return
		const media = mediaFor(layer)
		if (media.preview) return

		const { picture, img } = buildStagePicture(layer.dataset.photo, "preview")
		media.preview = picture

		const reveal = () => img.classList.add("is-visible")
		img.addEventListener("load", reveal, { once: true })

		// A preview always sits below a high-resolution image.
		layer.prepend(picture)
		if (img.complete && img.naturalWidth) reveal()
	}

	function unloadPreview(layer) {
		const media = layerMedia.get(layer)
		if (!media?.preview) return
		media.preview.remove()
		media.preview = null
	}

	function loadHigh(layer) {
		if (!layer) return
		const media = mediaFor(layer)
		if (media.high || media.highRequested) return
		media.highRequested = true

		const { picture, img } = buildStagePicture(layer.dataset.photo, "high")
		media.high = picture

		const reveal = () => {
			img.classList.add("is-visible")
			media.highRequested = false
		}
		const fail = () => {
			media.highRequested = false
			picture.remove()
			media.high = null
		}

		img.addEventListener("load", reveal, { once: true })
		img.addEventListener("error", fail, { once: true })
		layer.append(picture)
		if (img.complete && img.naturalWidth) reveal()
	}

	function unloadHigh(layer) {
		const media = layerMedia.get(layer)
		if (!media?.high) return
		media.high.remove()
		media.high = null
		media.highRequested = false
	}

	function scheduleHighResolution() {
		window.clearTimeout(highResolutionTimer)
		highResolutionTimer = window.setTimeout(() => {
			if (performance.now() - lastScrollAt < 200) {
				scheduleHighResolution()
				return
			}
			if (body.classList.contains("is-coda")) return
			loadHigh(layerByKey.get(activeLayerKey))
		}, HIGH_RES_DELAY)
	}

	function scheduleStageCleanup(index) {
		window.clearTimeout(stageCleanupTimer)
		stageCleanupTimer = window.setTimeout(() => {
			layers.forEach((layer, layerIndex) => {
				if (layer.dataset.layer !== activeLayerKey) unloadHigh(layer)
				if (Math.abs(layerIndex - index) > 1) unloadPreview(layer)
			})
		}, STAGE_CLEANUP_DELAY)
	}

	/** Warm up the current chapter and its neighbours, then plan the upgrade. */
	function updateStageMedia(index) {
		;[sections[index - 1], sections[index], sections[index + 1]].forEach((section) => {
			if (section) loadPreview(layerByKey.get(section.dataset.layer))
		})
		scheduleHighResolution()
		scheduleStageCleanup(index)
	}

	/* ---------------------------------------------------------------------- */
	/* Story sections                                                         */
	/* ---------------------------------------------------------------------- */

	const sections = Array.from(document.querySelectorAll("[data-scene]"))
	const storySections = sections.filter((section) => !section.classList.contains("cover"))

	const headerNumeral = document.querySelector("[data-chapter-numeral]")
	const headerTitle = document.querySelector("[data-chapter-title]")
	const headerCounter = document.querySelector("[data-counter]")
	const rail = document.querySelector("[data-rail]")
	const progressBar = document.querySelector("[data-progress]")
	const header = document.querySelector(".site-header")
	const framesSection = document.querySelector(".frames")

	const pad = (value) => String(value).padStart(2, "0")

	/* ---- Chapter rail (built from the story sections) --------------------- */

	const railButtons = []

	storySections.forEach((section, index) => {
		const button = document.createElement("button")
		button.type = "button"
		button.className = "rail-dot"
		button.setAttribute("aria-label", `Глава ${index + 1}: ${section.dataset.title || section.dataset.chapter}`)

		const label = document.createElement("span")
		label.className = "rail-dot__label"
		label.textContent = section.dataset.title || ""
		button.append(label)

		button.addEventListener("click", () => {
			section.scrollIntoView({ behavior: scrollBehavior(), block: "start" })
		})

		rail?.append(button)
		railButtons.push(button)
	})

	let activeLayerKey = null
	let activeSection = null

	/**
	 * Switch the fixed background, header chapter, counter and rail state.
	 * Also warms up the neighbouring photographs so the next chapter is ready.
	 */
	function setActiveSection(section, index) {
		activeSection = section

		const layerKey = section.dataset.layer
		if (layerKey !== activeLayerKey) {
			activeLayerKey = layerKey
			layers.forEach((layer) => layer.classList.toggle("is-active", layer.dataset.layer === layerKey))

			updateStageMedia(index)
		}

		// Header copy.
		const isCover = section.classList.contains("cover")
		if (headerNumeral) headerNumeral.textContent = section.dataset.chapter || "Пролог"
		if (headerTitle) headerTitle.textContent = section.dataset.title || "На опушке"

		const storyIndex = storySections.indexOf(section)
		if (headerCounter) {
			headerCounter.textContent = isCover ? "—" : `${pad(storyIndex + 1)} / ${pad(storySections.length)}`
		}

		// Rail dots.
		railButtons.forEach((button, i) => {
			const isActive = i === storyIndex
			button.classList.toggle("is-active", isActive)
			if (isActive) button.setAttribute("aria-current", "step")
			else button.removeAttribute("aria-current")
		})
	}

	/* ---------------------------------------------------------------------- */
	/* Scroll orchestration                                                   */
	/* ---------------------------------------------------------------------- */

	let ticking = false

	function updateScrollUI() {
		const active = findActiveSection(sections)
		if (active !== activeSection) {
			setActiveSection(active, sections.indexOf(active))
		}

		// Page progress bar.
		const max = html.scrollHeight - window.innerHeight
		const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
		html.style.setProperty("--progress", progress.toFixed(4))

		// Header gets a little more solid once we leave the cover.
		header?.classList.toggle("is-scrolled", window.scrollY > window.innerHeight * 0.4)

		// When the coda arrives the photographs step aside for the filmstrip.
		if (framesSection) {
			body.classList.toggle("is-coda", framesSection.getBoundingClientRect().top < window.innerHeight * 0.55)
		}

		ticking = false
	}

	function requestScrollUpdate() {
		if (ticking) return
		ticking = true
		requestAnimationFrame(updateScrollUI)
	}

	window.addEventListener(
		"scroll",
		() => {
			lastScrollAt = performance.now()
			requestScrollUpdate()
		},
		{ passive: true },
	)
	window.addEventListener("resize", requestScrollUpdate)

	/* ---------------------------------------------------------------------- */
	/* Reveal the verse as each chapter enters                                */
	/* ---------------------------------------------------------------------- */

	const revealTargets = Array.from(document.querySelectorAll(".scene, .finale"))

	if ("IntersectionObserver" in window) {
		const revealObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add("is-revealed")
						revealObserver.unobserve(entry.target)
					}
				})
			},
			{ rootMargin: "0px 0px -22% 0px", threshold: 0.12 },
		)

		revealTargets.forEach((target) => revealObserver.observe(target))
	} else {
		revealTargets.forEach((target) => target.classList.add("is-revealed"))
	}

	/* ---------------------------------------------------------------------- */
	/* Chapter index dialog                                                   */
	/* ---------------------------------------------------------------------- */

	const chaptersDialog = document.querySelector("#chapters")
	const chaptersOpen = document.querySelector("[data-open-chapters]")

	chaptersOpen?.addEventListener("click", () => {
		if (!chaptersDialog || chaptersDialog.open) return
		chaptersDialog.showModal()
		body.classList.add("is-locked")
	})

	chaptersDialog?.addEventListener("close", () => body.classList.remove("is-locked"))

	document.querySelector("[data-close-chapters]")?.addEventListener("click", () => chaptersDialog?.close())

	// Close the index, then glide to the chosen chapter.
	chaptersDialog?.querySelectorAll('a[href^="#"]').forEach((link) => {
		link.addEventListener("click", (event) => {
			const target = document.querySelector(link.getAttribute("href"))
			if (!target) return
			event.preventDefault()
			chaptersDialog.close()
			requestAnimationFrame(() => target.scrollIntoView({ behavior: scrollBehavior(), block: "start" }))
		})
	})

	/* ---------------------------------------------------------------------- */
	/* Coda: all 17 frames + lightbox                                         */
	/* ---------------------------------------------------------------------- */

	/**
	 * Photo metadata for the filmstrip and the lightbox. `num` is the frame
	 * number in the original photo collection, `caption` is the poetic label.
	 */
	const photos = [
		{
			slug: "01-birch",
			num: "01",
			caption: "Берёза, утро",
			alt: "Девушка с золотистыми волосами касается белого ствола берёзы в высокой траве.",
		},
		{
			slug: "02-birch-side",
			num: "02",
			caption: "Белая кора",
			alt: "Девушка стоит у берёзы в солнечном лесу, вид сбоку.",
		},
		{
			slug: "03-canopy",
			num: "03",
			caption: "Свет сквозь листву",
			alt: "Девушка поднимает лицо к зелёным кронам и солнечному свету.",
		},
		{ slug: "04-away", num: "04", caption: "Шаг вглубь", alt: "Девушка уходит в лес, раскинув руки, вид со спины." },
		{
			slug: "05-path-back",
			num: "05",
			caption: "За спиной",
			alt: "Девушка идёт по лесной тропе, обернувшись через плечо.",
		},
		{
			slug: "06-turning",
			num: "06",
			caption: "Обернулась",
			alt: "Девушка оборачивается к камере в зелёном лесном свете.",
		},
		{ slug: "07-portrait", num: "07", caption: "Тишина", alt: "Портрет девушки, поправляющей волосы, среди деревьев." },
		{
			slug: "08-bending",
			num: "08",
			caption: "Поклон лесу",
			alt: "Девушка наклоняется вперёд, длинные волосы падают на лицо.",
		},
		{
			slug: "09-fern-path",
			num: "09",
			caption: "Тропа",
			alt: "Девушка идёт по тропинке среди папоротников и поваленных стволов.",
		},
		{ slug: "10-walking", num: "10", caption: "В глубину", alt: "Девушка уходит по тропе вглубь леса." },
		{ slug: "11-clearing", num: "11", caption: "Поляна", alt: "Девушка стоит на лесной поляне и смотрит вверх." },
		{
			slug: "12-fallen-log",
			num: "12",
			caption: "Поваленный ствол",
			alt: "Девушка сидит на большом поваленном стволе сосны, опустив глаза.",
		},
		{ slug: "13-pines", num: "13", caption: "Сосны", alt: "Девушка стоит среди высоких сосен в солнечном свете." },
		{
			slug: "14-pine-path",
			num: "14",
			caption: "Сосновая тропа",
			alt: "Девушка идёт по тропе между соснами, неся обувь в руке.",
		},
		{
			slug: "15-dream",
			num: "15",
			caption: "Сон",
			alt: "Девушка лежит в траве с закрытыми глазами, руки сложены на груди.",
		},
		{
			slug: "16-dream-face",
			num: "16",
			caption: "Лицо к небу",
			alt: "Крупный план: лицо девушки, лежащей в траве, обращено к солнцу.",
		},
		{
			slug: "17-overhead",
			num: "17",
			caption: "Над землёй",
			alt: "Вид сверху: девушка лежит в траве и поднимает руку к небу.",
		},
	]

	const track = document.querySelector("[data-frames-track]")
	const framesPrev = document.querySelector("[data-frames-prev]")
	const framesNext = document.querySelector("[data-frames-next]")

	/** Build the filmstrip once, from the metadata above. */
	function buildFrames() {
		if (!track) return

		photos.forEach((photo, index) => {
			const button = document.createElement("button")
			button.type = "button"
			button.className = "frame"
			button.dataset.index = String(index)
			button.setAttribute("aria-label", `Открыть кадр ${photo.num}: ${photo.caption}`)

			const picture = document.createElement("picture")
			const source = document.createElement("source")
			const img = document.createElement("img")

			source.type = "image/webp"
			source.srcset = `assets/photos/${photo.slug}-900.webp`

			img.src = `assets/photos/${photo.slug}-900.jpg`
			img.alt = ""
			img.loading = "lazy"
			img.decoding = "async"
			// Intrinsic size hints prevent layout shift while the strip lazy-loads.
			img.width = 600
			img.height = photo.slug === "16-dream-face" ? 400 : 900

			const markLoaded = () => button.classList.add("is-loaded")
			img.addEventListener("load", markLoaded, { once: true })
			img.addEventListener("error", markLoaded, { once: true })
			if (img.complete) markLoaded()

			const number = document.createElement("span")
			number.className = "frame__num"
			number.textContent = photo.num
			number.setAttribute("aria-hidden", "true")

			if (photo.slug === "16-dream-face") button.classList.add("frame--wide")

			picture.append(source, img)
			button.append(picture, number)
			button.addEventListener("click", () => openLightbox(index))
			track.append(button)
		})
	}

	const stepFrames = (direction) => {
		if (!track) return
		track.scrollBy({ left: direction * track.clientWidth * 0.82, behavior: scrollBehavior() })
	}

	framesPrev?.addEventListener("click", () => stepFrames(-1))
	framesNext?.addEventListener("click", () => stepFrames(1))

	/* ---- Lightbox --------------------------------------------------------- */

	const lightbox = document.querySelector("#lightbox")
	const lightboxPictureSource = lightbox?.querySelector("picture source")
	const lightboxImg = lightbox?.querySelector("img")
	const lightboxCaption = lightbox?.querySelector("[data-lightbox-caption]")
	const lightboxCounter = lightbox?.querySelector("[data-lightbox-counter]")
	const lightboxClose = lightbox?.querySelector("[data-lightbox-close]")
	const lightboxPrev = lightbox?.querySelector("[data-lightbox-prev]")
	const lightboxNext = lightbox?.querySelector("[data-lightbox-next]")
	let lightboxIndex = 0

	function lightboxSizes(slug) {
		const ratio = isLandscape(slug) ? 3 / 2 : 2 / 3
		const maxWidth = Math.min(window.innerWidth * 0.9, 1500)
		const maxHeight = window.innerHeight * 0.74
		return `${Math.max(1, Math.round(Math.min(maxWidth, maxHeight * ratio)))}px`
	}

	function renderLightbox() {
		const photo = photos[lightboxIndex]
		if (!photo || !lightbox || !lightboxImg) return

		const sizes = lightboxSizes(photo.slug)
		lightbox.classList.remove("is-loaded")
		if (lightboxPictureSource) {
			lightboxPictureSource.srcset = webpSrcset(photo.slug)
			lightboxPictureSource.sizes = sizes
		}
		lightboxImg.src = `assets/photos/${photo.slug}-2400.jpg`
		lightboxImg.srcset = jpgSrcset(photo.slug)
		lightboxImg.sizes = sizes
		lightboxImg.alt = photo.alt
		if (lightboxCaption) lightboxCaption.textContent = `${photo.caption}`
		if (lightboxCounter) lightboxCounter.textContent = `${photo.num} / ${photos.length}`

		lightboxImg.addEventListener("load", () => lightbox.classList.add("is-loaded"), { once: true })
		if (lightboxImg.complete) lightbox.classList.add("is-loaded")
	}

	function openLightbox(index) {
		if (!lightbox) return
		lightboxIndex = (index + photos.length) % photos.length
		renderLightbox()
		if (!lightbox.open) {
			lightbox.showModal()
			body.classList.add("is-locked")
		}
	}

	function stepLightbox(direction) {
		openLightbox(lightboxIndex + direction)
	}

	lightboxClose?.addEventListener("click", () => lightbox.close())
	lightboxPrev?.addEventListener("click", () => stepLightbox(-1))
	lightboxNext?.addEventListener("click", () => stepLightbox(1))
	lightbox?.addEventListener("close", () => body.classList.remove("is-locked"))

	// Arrow keys for the lightbox.
	lightbox?.addEventListener("keydown", (event) => {
		if (event.key === "ArrowLeft") {
			event.preventDefault()
			stepLightbox(-1)
		} else if (event.key === "ArrowRight") {
			event.preventDefault()
			stepLightbox(1)
		}
	})

	// Touch swipe for the lightbox (photos are the main content on mobile).
	if (lightbox) {
		let touchStartX = 0
		let touchStartY = 0

		lightbox.addEventListener(
			"touchstart",
			(event) => {
				const touch = event.changedTouches[0]
				touchStartX = touch.clientX
				touchStartY = touch.clientY
			},
			{ passive: true },
		)

		lightbox.addEventListener(
			"touchend",
			(event) => {
				const touch = event.changedTouches[0]
				const dx = touch.clientX - touchStartX
				const dy = touch.clientY - touchStartY
				if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
					stepLightbox(dx > 0 ? -1 : 1)
				}
			},
			{ passive: true },
		)
	}

	/* ---------------------------------------------------------------------- */
	/* Responsive rendition refresh                                           */
	/* ---------------------------------------------------------------------- */

	/**
	 * A phone or tablet can be rotated after the stage photos are already
	 * loaded. Their `sizes` attribute is a fixed pixel value computed for the
	 * old viewport, so it must be recomputed — otherwise the landscape view
	 * keeps showing the portrait-sized file upscaled. Chrome and Safari
	 * re-select a srcset candidate when `sizes` changes, so this is enough.
	 */
	function refreshRenditionSizes() {
		document.querySelectorAll(".stage__layer img").forEach((img) => {
			const layer = img.closest(".stage__layer")
			if (!layer) return
			const sizes = stageSizes(layer.dataset.photo)
			img.sizes = sizes
			const source = img.closest("picture")?.querySelector("source")
			if (source) source.sizes = sizes
		})

		if (lightbox?.open && photos[lightboxIndex]) {
			const sizes = lightboxSizes(photos[lightboxIndex].slug)
			if (lightboxPictureSource) lightboxPictureSource.sizes = sizes
			if (lightboxImg) lightboxImg.sizes = sizes
		}
	}

	let renditionRefreshTimer = 0
	const scheduleRenditionRefresh = () => {
		window.clearTimeout(renditionRefreshTimer)
		renditionRefreshTimer = window.setTimeout(refreshRenditionSizes, 140)
	}

	window.addEventListener("resize", scheduleRenditionRefresh)
	window.addEventListener("orientationchange", scheduleRenditionRefresh)

	/* ---------------------------------------------------------------------- */
	/* Boot                                                                   */
	/* ---------------------------------------------------------------------- */

	// The filmstrip is 17 photographs; build it only when the reader is close
	// to the coda so the story itself stays light.
	if (track && "IntersectionObserver" in window) {
		const framesObserver = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					buildFrames()
					framesObserver.disconnect()
				}
			},
			{ rootMargin: "900px 0px" },
		)
		framesObserver.observe(framesSection || track)
	} else {
		buildFrames()
	}

	// First paint: make the cover photograph visible immediately, then let the
	// scroll manager take over.
	const coverSection = sections[0]
	if (coverSection) {
		setActiveSection(coverSection, 0)
	}

	updateScrollUI()

	// A tiny safety net: if the browser restores an old scroll position, make
	// sure the matching chapter is active after layout settles.
	window.addEventListener("load", requestScrollUpdate, { once: true })
})()
