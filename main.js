window.addEventListener('DOMContentLoaded', function load() {
	// VARIABLES AND HELPERS

	const w = this,
		wWidth = () => w.innerWidth,
		// wHeight = () => w.innerHeight,

		d = document,

		// query selectors
		qS = d.querySelector.bind(document),
		qSA = selector => [...d.querySelectorAll(selector)],

		// random int generator
		randInt = max => Math.floor(Math.random() * (max || 0)),

		// general purpose audio player
		playAudio = (audioElem, callback) => {
			audioElem.play();
			audioElem.addEventListener('ended', function () {
				this.pause();
				this.currentTime = 0;
			});

			if (callback) {
				audioElem.addEventListener('ended', callback);
			}
		};

	// DOM SELECTIONS & METHODS/PROPS

	// backgrounds
	const backgroundPopcorn = qS('.background.popcorn'),

		// player uis
		coordXs = qSA('input.x'),
		coordYs = qSA('input.y'),
		throwKernBtns = qSA('button.throw-kern'),

		// the cups
		cups = qSA('.cup'),

		// the land
		regions = qSA('.region'),

		// audio elements
		audioSplat = qS('audio.audio-splat'),
		audioExplosion = qS('audio.audio-explosion'),
		audioPopcorn = qS('audio.audio-popcorn'),

		// toasty effects
		toasty = qS('img.toasty'),
		audioToasty = qS('audio.audio-toasty');

	// kernel count used to bust cache
	let kernelCount = 0;

	// set up functionality for Players' Kern buttons
	throwKernBtns.forEach((btn, i) => {
		btn.addEventListener('click', () => {
			const x = parseInt(coordXs[i].value),
				y = parseInt(coordYs[i].value);

			if (x && y) {
				cups[i].throwKernel(x, y);

				// reset inputs
				coordXs[i].value = null;
				coordYs[i].value = null;
			}
		});
	});

	// add cup methods
	cups.forEach(cup => {
		// throw kernel method
		cup.throwKernel = (x, y) => {
			const kernel = document.createElement('DIV');
			kernel.className = 'kernel';
			kernel.style.top = `${cup.top()}px`;
			kernel.style.left = `${cup.left()}px`;

			document.body.appendChild(kernel);

			setTimeout(() => {
				playAudio(audioSplat);

				kernel.style.top = `${y}px`;
				kernel.style.left = `${x}px`;

				kernel.addEventListener('transitionend', function () {
					// the conditional allows for 'debouncing' of removeChild call
					if ([...document.body.childNodes].includes(kernel)) {
						const boom = document.createElement('DIV');
						boom.className = 'boom';
						// kernel count used to cache bust
						boom.style.background = `url('images/explosion.gif?bust=${kernelCount++}') no-repeat center / contain`;

						const kTop = parseInt(kernel.style.top),
							kLeft = parseInt(kernel.style.left),
							kBottom = parseInt(kernel.getBoundingClientRect().bottom);

						boom.style.top = `${kTop}px`;
						boom.style.left = `${kLeft}px`;

						// explosion animation
						playAudio(audioExplosion);
						document.body.appendChild(boom);
						setTimeout(() => {
							document.body.removeChild(boom);
						}, 333);

						// logic to detect a hit
						cups.forEach(cup => {
							if (
								kTop > cup.top() && kBottom < cup.bottom() &&
								kLeft > cup.left() && kLeft < cup.right()
							) {
								backgroundPopcorn.style.display = 'block';
								cup.style.display = 'none';

								playAudio(audioPopcorn, function () {
									// this code will run when the audio stops
									backgroundPopcorn.style.display = 'none';
									cup.style.display = 'block';
									init();
								});
							}
						});

						// kernel removed from dom
						document.body.removeChild(kernel);
					}
				});
			}, 100);

			// toasty!
			const randToast = [...'0123456789'][randInt(10)];
			if (randToast === '7') {
				playAudio(audioToasty);
				toasty.style.transform = `translateX(0)`;
				setTimeout(() => {
					toasty.style.transform = `translateX(-100%)`;
				}, 1000);
			}
		};

		// helpers used to dynamically get cups' top, right, & left bounding rects
		cup.top = () => parseInt(cup.getBoundingClientRect().top);
		cup.right = () => parseInt(cup.getBoundingClientRect().right);
		cup.bottom = () => parseInt(cup.getBoundingClientRect().bottom);
		cup.left = () => parseInt(cup.getBoundingClientRect().left);
	});

	// helper used to determine if an element falls within (i.e., overlaps) a region
	regions.forEach(region => region.overlaps = elem => {
		const regionLeft = region.getBoundingClientRect().left,
			regionRight = region.getBoundingClientRect().right,
			elemLeft = elem.getBoundingClientRect().left,
			elemRight = elem.getBoundingClientRect().right;

		return regionLeft < elemLeft && regionRight > elemRight;
	});

	// GAME SETUP (CALLED FROM init())

	function drawLandscape() {
		const flexes = [1, 2, 3, 4];

		regions.forEach(region => {
			region.style.flex = flexes.splice(randInt(flexes.length), 1);
			region.style.height = `${randInt(200) + 200}px`;
		});
	}

	function placeCups() {
		cups.forEach(cup => {
			(function loop() {
				cup.style.left = `${randInt(wWidth() - 100)}px`;
				cup.overlaps = null;

				regions.forEach(region => {
					if (region.overlaps(cup)) {
						cup.overlappingRegion = region.className;
					}
				});

				// will be used to determine overlapping cups
				const cup0Right = cups[0].right(),
					cup0Left = cups[0].left(),
					cup1Right = cups[1].right(),
					cup1Left = cups[1].left();

				if (
					// cups can only be in one region
					!cup.overlappingRegion ||
					(
						// cups can't overlap
						cup0Right < cup1Right && cup0Right > cup1Left ||
						cup0Left > cup1Left && cup0Left < cup1Right ||
						cup1Right < cup0Right && cup1Right > cup0Left ||
						cup1Left > cup0Left && cup1Left < cup0Right
					)
				) {
					loop();
				} else {
					cup.style.bottom = `${qS(`.${cup.overlappingRegion.replace(/\s/g, '.')}`).style.height}`;
				}
			})();
		});
	}

	// INIT
	function init() {
		drawLandscape();
		placeCups();
	}
	init();

	// resize handler
	window.addEventListener('resize', () => {
		init();
	});
});