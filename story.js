// GreenDay - Cinematic Scrollytelling Animation Controller

// On-screen Debug Panel (Disabled for production release)
function debugLog(msg) {
  // console.log(msg);
}

document.addEventListener('DOMContentLoaded', () => {
  debugLog("DOM Content Loaded. Initializing story flow...");
  initStoryFlow();
});

let storyImages = [];
const TOTAL_FRAMES = 240;
let lastFrameIndex = -1;
let isLoaded = false;
let rafId = null;

function initStoryFlow() {
  const storyWrapper = document.getElementById('story-wrapper');
  if (!storyWrapper) return;

  // Force show on reload for testing/reviewing
  localStorage.removeItem('greenday_intro_completed');

  // Start preloading images
  preloadStoryImages();

  // Bind watch story link in sidebar
  setTimeout(bindSidebarWatchStory, 500);
}

function bindSidebarWatchStory() {
  const watchStoryBtn = document.getElementById('nav-watch-story');
  if (watchStoryBtn) {
    watchStoryBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showStoryMode();
    });
  }
}

// Preload all 240 images
function preloadStoryImages() {
  if (isLoaded) {
    onLoadingComplete();
    return;
  }

  debugLog(`Preloading ${TOTAL_FRAMES} frames...`);

  const loaderBar = document.getElementById('loader-bar-fill');
  const loaderPercent = document.getElementById('loader-percentage');
  const loader = document.getElementById('story-loader');
  
  let loadedCount = 0;
  let failedCount = 0;
  
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    const frameNum = String(i).padStart(5, '0');
    img.src = `${frameNum}.jpg`;
    
    img.onload = () => {
      loadedCount++;
      const progress = (loadedCount / TOTAL_FRAMES) * 100;
      
      if (loaderBar) loaderBar.style.width = `${progress}%`;
      if (loaderPercent) loaderPercent.innerText = `${Math.round(progress)}%`;
      
      if (loadedCount === TOTAL_FRAMES) {
        isLoaded = true;
        debugLog(`Preload done. Successes: ${TOTAL_FRAMES - failedCount}, Failures: ${failedCount}`);
        setTimeout(() => {
          if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => {
              loader.style.display = 'none';
            }, 500);
          }
          onLoadingComplete();
        }, 300);
      }
    };
    
    img.onerror = () => {
      loadedCount++;
      failedCount++;
      if (failedCount <= 5) {
        debugLog(`<span style="color: #f87171;">Failed to load frame ${frameNum}.jpg</span>`);
      } else if (failedCount === 6) {
        debugLog(`<span style="color: #f87171;">Multiple frame failures (suppressing future logs)...</span>`);
      }
      
      if (loadedCount === TOTAL_FRAMES) {
        isLoaded = true;
        debugLog(`Preload done with errors. Successes: ${TOTAL_FRAMES - failedCount}, Failures: ${failedCount}`);
        onLoadingComplete();
      }
    };
    
    storyImages.push(img);
  }
}

function onLoadingComplete() {
  debugLog("Preloader finished. Setting up scroll timeline...");
  setupScrollAnimation();
  
  // Resize handler
  window.addEventListener('resize', handleCanvasResize);
  
  // Trigger initial draw
  handleCanvasResize();
  drawFrame(0);
}

// Resize canvas and maintain aspect ratio
function handleCanvasResize() {
  const canvas = document.getElementById('story-canvas');
  if (!canvas) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  
  canvas.width = width;
  canvas.height = height;
  
  // Redraw current frame
  const storyWrapper = document.getElementById('story-wrapper');
  if (storyWrapper) {
    const scrollTop = storyWrapper.scrollTop;
    const maxScroll = storyWrapper.scrollHeight - storyWrapper.clientHeight;
    if (maxScroll > 0) {
      const scrollPercent = scrollTop / maxScroll;
      const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.floor(scrollPercent * TOTAL_FRAMES));
      drawFrame(frameIndex);
    }
  }
}

// Render a specific frame on canvas with object-fit: cover implementation
function drawFrame(index) {
  const canvas = document.getElementById('story-canvas');
  if (!canvas) {
    debugLog("<span style='color: #ef4444;'>Canvas element not found.</span>");
    return;
  }
  
  const ctx = canvas.getContext('2d');
  const img = storyImages[index];
  if (!img) {
    debugLog(`<span style='color: #f59e0b;'>Image at index ${index} is undefined!</span>`);
    return;
  }
  if (!img.complete) {
    // If not complete, try again in a bit
    return;
  }
  if (img.naturalWidth === 0) {
    debugLog(`<span style='color: #f87171;'>Image ${index + 1} has width 0 (broken link).</span>`);
    return;
  }
  
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const imgWidth = img.naturalWidth;
  const imgHeight = img.naturalHeight;
  
  const imgRatio = imgWidth / imgHeight;
  const canvasRatio = canvasWidth / canvasHeight;
  
  let drawWidth, drawHeight, drawX, drawY;
  
  if (canvasRatio > imgRatio) {
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgRatio;
    drawX = 0;
    drawY = (canvasHeight - drawHeight) / 2;
  } else {
    drawWidth = canvasHeight * imgRatio;
    drawHeight = canvasHeight;
    drawX = (canvasWidth - drawWidth) / 2;
    drawY = 0;
  }
  
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  lastFrameIndex = index;
}

// Setup Scroll Handlers
function setupScrollAnimation() {
  const storyWrapper = document.getElementById('story-wrapper');
  const btnSkip = document.getElementById('btn-skip-story');
  const btnEnter = document.getElementById('btn-enter-app');
  const dots = document.querySelectorAll('.story-dot');
  
  if (!storyWrapper) return;

  // Handle skip and enter actions
  btnSkip.addEventListener('click', exitStoryMode);
  btnEnter.addEventListener('click', exitStoryMode);
  
  // Scroll event listener
  storyWrapper.addEventListener('scroll', () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(updateScrollState);
  });

  // Dots navigation
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      const maxScroll = storyWrapper.scrollHeight - storyWrapper.clientHeight;
      if (maxScroll <= 0) return;
      
      // Target percents for each slide
      const targets = [0.0, 0.25, 0.50, 0.75, 1.0];
      const targetPercent = targets[index];
      
      storyWrapper.scrollTo({
        top: targetPercent * maxScroll,
        behavior: 'smooth'
      });
    });
  });
  
  // Initial state call
  updateScrollState();
}

function updateScrollState() {
  const storyWrapper = document.getElementById('story-wrapper');
  if (!storyWrapper) return;
  
  const scrollTop = storyWrapper.scrollTop;
  const maxScroll = storyWrapper.scrollHeight - storyWrapper.clientHeight;
  
  if (maxScroll <= 0) return;
  
  const scrollPercent = scrollTop / maxScroll;
  
  // 1. Draw corresponding image frame
  const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.floor(scrollPercent * TOTAL_FRAMES));
  if (frameIndex !== lastFrameIndex) {
    drawFrame(frameIndex);
  }
  
  // 2. Animate and toggle slide text overlays
  updateSlidesOpacity(scrollPercent);
  
  // 3. Toggle Scroll mouse vs Enter App button
  const scrollIndicator = document.getElementById('scroll-indicator');
  const btnEnter = document.getElementById('btn-enter-app');
  
  if (scrollPercent > 0.92) {
    if (scrollIndicator) scrollIndicator.classList.add('fade-out');
    if (btnEnter) btnEnter.classList.add('visible');
  } else {
    if (scrollIndicator) scrollIndicator.classList.remove('fade-out');
    if (btnEnter) btnEnter.classList.remove('visible');
  }
}

// Fade overlays in and out based on relative scroll position
function updateSlidesOpacity(percent) {
  const slides = document.querySelectorAll('.story-slide');
  const dots = document.querySelectorAll('.story-dot');
  if (slides.length === 0) return;

  // Active ranges for the 5 slides
  const ranges = [
    { start: 0.0, end: 0.16, fadeOut: 0.20 },
    { fadeIn: 0.18, start: 0.22, end: 0.36, fadeOut: 0.40 },
    { fadeIn: 0.38, start: 0.42, end: 0.56, fadeOut: 0.60 },
    { fadeIn: 0.58, start: 0.62, end: 0.76, fadeOut: 0.80 },
    { fadeIn: 0.78, start: 0.82, end: 1.0 }
  ];
  
  slides.forEach((slide, index) => {
    const range = ranges[index];
    let opacity = 0;
    let translateY = 20; // Initial slide-up transform offset (pixels)
    
    if (index === 0) {
      if (percent <= range.end) {
        opacity = 1;
        translateY = 0;
      } else if (percent > range.end && percent <= range.fadeOut) {
        // Fade out transition
        const t = (percent - range.end) / (range.fadeOut - range.end);
        opacity = 1 - t;
        translateY = -t * 20;
      }
    } else if (index === ranges.length - 1) {
      if (percent >= range.start) {
        opacity = 1;
        translateY = 0;
      } else if (percent >= range.fadeIn && percent < range.start) {
        // Fade in transition
        const t = (percent - range.fadeIn) / (range.start - range.fadeIn);
        opacity = t;
        translateY = 20 - (t * 20);
      }
    } else {
      if (percent >= range.start && percent <= range.end) {
        opacity = 1;
        translateY = 0;
      } else if (percent >= range.fadeIn && percent < range.start) {
        // Fade in transition
        const t = (percent - range.fadeIn) / (range.start - range.fadeIn);
        opacity = t;
        translateY = 20 - (t * 20);
      } else if (percent > range.end && percent <= range.fadeOut) {
        // Fade out transition
        const t = (percent - range.end) / (range.fadeOut - range.end);
        opacity = 1 - t;
        translateY = -t * 20;
      }
    }
    
    // Apply calculated styles
    slide.style.opacity = opacity;
    slide.style.transform = `translateY(${translateY}px)`;
    slide.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';
    
    // Highlight corresponding pagination dot
    if (opacity > 0.5) {
      slide.classList.add('active');
      if (dots[index]) dots[index].classList.add('active');
    } else {
      slide.classList.remove('active');
      if (dots[index]) dots[index].classList.remove('active');
    }
  });
}

// Fade out and close the story experience to launch the main app
function exitStoryMode() {
  const storyWrapper = document.getElementById('story-wrapper');
  if (!storyWrapper) return;
  
  storyWrapper.classList.add('fade-out');
  
  // Save status to localStorage to avoid automatic prompt on reload
  localStorage.setItem('greenday_intro_completed', 'true');
  
  setTimeout(() => {
    storyWrapper.style.display = 'none';
    
    // If onboarding hasn't been completed, show calculator onboarding modal
    const savedState = localStorage.getItem('ecostep_state');
    let hasCalculated = false;
    if (savedState) {
      try {
        const stateObj = JSON.parse(savedState);
        hasCalculated = stateObj.hasCalculated;
      } catch (e) {
        console.error(e);
      }
    }
    
    // If app has its own showCalculatorModal, open it
    if (!hasCalculated && typeof showCalculatorModal === 'function') {
      showCalculatorModal();
    }
  }, 800);
}

// Re-open and show the story experience from the dashboard
function showStoryMode() {
  const storyWrapper = document.getElementById('story-wrapper');
  if (!storyWrapper) return;

  // Make wrapper block and visible
  storyWrapper.style.display = 'block';
  setTimeout(() => {
    storyWrapper.classList.remove('fade-out');
    storyWrapper.scrollTop = 0;
    
    // Trigger images preload if not done (failsafe)
    preloadStoryImages();
    
    // Reset indicators
    updateScrollState();
    handleCanvasResize();
  }, 50);
}
