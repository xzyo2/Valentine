const ASSETS = {
    images: {
        main: 'img/main.gif', no1: 'img/no1.gif', no2: 'img/no2.gif',
        no3: 'img/no3.gif', no4: 'img/no4.gif', no5: 'img/no5.gif', yes: 'img/yes1.gif'
    },
    sounds: {
        hover: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
        click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
        success: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3'
    }
};

const loadedAudios = {};

const UI = {
    screens: { loading: document.getElementById('loading-screen'), error: document.getElementById('error-screen'), main: document.getElementById('main-screen') },
    elements: {
        gif: document.getElementById('main-gif'), text: document.getElementById('main-text'),
        btnYes: document.getElementById('btn-yes'), btnNo: document.getElementById('btn-no'),
        loadingText: document.getElementById('loading-text'), container: document.getElementById('btn-container')
    },
    switchScreen(screenName) {
        Object.values(this.screens).forEach(s => s.classList.add('hidden'));
        this.screens[screenName].classList.remove('hidden');
    }
};

function playSound(type) {
    if (loadedAudios[type]) {
        loadedAudios[type].currentTime = 0;
        loadedAudios[type].play().catch(() => {});
    }
}

function vibrate() {
    if (navigator.vibrate) navigator.vibrate(100);
}

function shakeScreen() {
    document.body.classList.remove('shake-anim');
    void document.body.offsetWidth; 
    document.body.classList.add('shake-anim');
}

function updateContentSmoothly(newText, newGifKey) {
    UI.elements.text.classList.add('fade-out');
    UI.elements.gif.classList.add('fade-out');
    
    setTimeout(() => {
        UI.elements.text.innerHTML = newText;
        UI.elements.gif.src = ASSETS.images[newGifKey];
        
        UI.elements.text.classList.remove('fade-out');
        UI.elements.gif.classList.remove('fade-out');
    }, 300); 
}

async function preloadAll() {
    let loaded = 0;
    const imgKeys = Object.keys(ASSETS.images);
    const total = imgKeys.length; 

    const updateProgress = () => { loaded++; UI.elements.loadingText.innerText = `Loading love... ${Math.round((loaded / total) * 100)}%`; };
    const loadPromises = [];

    imgKeys.forEach(key => {
        loadPromises.push(new Promise((resolve, reject) => {
            const img = new Image(); img.src = ASSETS.images[key];
            img.onload = () => { updateProgress(); resolve(); };
            img.onerror = () => reject(`Image failed`);
        }));
    });

    Object.keys(ASSETS.sounds).forEach(key => {
        const audio = new Audio(ASSETS.sounds[key]);
        audio.oncanplaythrough = () => { loadedAudios[key] = audio; };
        audio.load();
    });

    try {
        await Promise.all(loadPromises);
        setTimeout(initApp, 500); 
    } catch (err) { UI.switchScreen('error'); }
}

let idleTimer;
function resetIdleTimer() {
    clearTimeout(idleTimer);
    UI.elements.gif.classList.remove('wiggle-anim');
    idleTimer = setTimeout(() => { UI.elements.gif.classList.add('wiggle-anim'); }, 4000); 
}

function initApp() {
    UI.switchScreen('main'); UI.elements.gif.src = ASSETS.images.main;
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('touchstart', () => playSound('click'), {passive: true});
        btn.addEventListener('click', () => playSound('click'));
    });
    document.addEventListener('touchstart', resetIdleTimer, {passive: true});
    resetIdleTimer(); setupStoryline();
}

// Added the angry flag to the very last step!
const STORY = [
    { text: "Ohm, wot", gif: "no1" },
    { text: "I see what you're clicking", gif: "no2" },
    { text: "HEY", gif: "no3" },
    { text: "Misclick?", gif: "no4" },
    { text: "Yanna, seriously.", gif: "no5" },
    { text: "Are you doing this on purpose?", gif: "no1" },
    { text: "Please just click Yes...", gif: "no2" },
    { text: "I am begging you", gif: "no3", clone: true },
    { text: "WILL YOU BE MY VALENTINE?", gif: "no4", shrink: true },
    { text: "WILL YOUUUUUUUUUUUU?", gif: "no5", runaway: true, angry: true }
];

let noClickCount = 0;
let yesScale = 1;

function dodgeButton(btn) {
    const maxX = window.innerWidth - btn.clientWidth - 20;
    const maxY = window.innerHeight - btn.clientHeight - 20;
    btn.style.position = "fixed";
    btn.style.left = Math.max(20, Math.random() * maxX) + "px";
    btn.style.top = Math.max(20, Math.random() * maxY) + "px";
}

function createFakeNoButton() {
    const fakeBtn = document.createElement('button');
    fakeBtn.innerText = "No";
    fakeBtn.style.position = "fixed";
    
    const maxX = window.innerWidth - 120; 
    const maxY = window.innerHeight - 60; 
    fakeBtn.style.left = Math.max(20, Math.random() * maxX) + "px";
    fakeBtn.style.top = Math.max(20, Math.random() * maxY) + "px";
    
    fakeBtn.style.zIndex = 4;
    fakeBtn.classList.add('pop-in'); 
    
    const dropFunc = function(e) {
        e.preventDefault();
        vibrate();
        this.classList.add('drop-anim');
    };
    
    fakeBtn.addEventListener('touchstart', dropFunc);
    fakeBtn.addEventListener('click', dropFunc); 
    
    document.body.appendChild(fakeBtn);
}

function handleNoClick(e) {
    if (e) e.preventDefault(); 
    vibrate(); shakeScreen();

    if (noClickCount < STORY.length) {
        const state = STORY[noClickCount];
        updateContentSmoothly(state.text, state.gif);

        // Apply angry class if true, remove if not
        if (state.angry) {
            UI.elements.text.classList.add('angry-text');
        } else {
            UI.elements.text.classList.remove('angry-text');
        }

        yesScale += 0.2;
        UI.elements.btnYes.style.transform = `scale(${yesScale})`;

        if (state.clone) {
            for(let i=0; i<6; i++) setTimeout(createFakeNoButton, i * 200);
            
            // Now the REAL button detaches and randomizes too!
            UI.elements.btnNo.style.position = "fixed";
            dodgeButton(UI.elements.btnNo);
        }

        if (state.runaway) {
            UI.elements.btnNo.style.transition = "none"; 
            dodgeButton(UI.elements.btnNo);
        }
        noClickCount++;
    } else {
        UI.elements.btnYes.style.transform = `scale(1)`;
        UI.elements.btnYes.classList.add('giant-yes');
        UI.elements.btnYes.innerHTML = "YOU HAVE NO CHOICE!<br><span>YES</span>";
        UI.elements.btnNo.classList.add('hidden');
    }
}

function setupStoryline() {
    UI.elements.btnNo.addEventListener('touchstart', handleNoClick);
    UI.elements.btnNo.addEventListener('click', handleNoClick); 

    const handleYesClick = (e) => {
        if (e) e.preventDefault();
        playSound('success');
        
        // Remove the angry text styling just in case it carries over
        UI.elements.text.classList.remove('angry-text');
        
        updateContentSmoothly("YAAAAYYYY!<span>Happy Valentine's Day!</span>", "yes");
        
        UI.elements.btnNo.classList.add('hidden');
        UI.elements.btnYes.style.display = "none";
        UI.elements.gif.classList.add('zoom-anim');

        document.querySelectorAll('button').forEach(b => b.style.display = 'none');
        setInterval(createParticle, 250);
    };

    UI.elements.btnYes.addEventListener('touchstart', handleYesClick);
    UI.elements.btnYes.addEventListener('click', handleYesClick);
}

function createParticle() {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    
    if (Math.random() > 0.6) {
        const messages = ["I love you", "Cutie", "My favorite", "So pretty", "Best GF"];
        const textNode = document.createElement('div');
        textNode.classList.add('float-text');
        textNode.innerText = messages[Math.random() * messages.length | 0];
        particle.appendChild(textNode);
    } else {
        const heart = document.createElement('div');
        heart.classList.add('css-heart');
        const colors = ['#ff85a2', '#ff6b8f', '#d63384'];
        heart.style.backgroundColor = colors[Math.random() * colors.length | 0];
        particle.appendChild(heart);
    }
    
    particle.style.left = Math.random() * 100 + "vw";
    particle.style.animationDuration = (Math.random() * 2 + 3) + "s";
    
    document.getElementById('particles').appendChild(particle);
    setTimeout(() => particle.remove(), 5000);
}

window.onload = preloadAll;