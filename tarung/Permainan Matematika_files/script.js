// ============================================
// IMAGE PRELOADING & CACHING
// ============================================

// Daftar semua gambar yang perlu di-preload
const imagesToPreload = [
    'character.png',
    'icon_home.png',
    'icon_tarik.png',
    'icon_panjat.png',
    'icon_balap_karung.png',
    'panjat_pinang/tiang.png',
    'panjat_pinang/standleft.png',
    'panjat_pinang/standright.png',
    'panjat_pinang/climbleft.png',
    'panjat_pinang/climbright.png',
    'balap_karung/track.png',
    'balap_karung/blue_stand.png',
    'balap_karung/blue_hop.png',
    'balap_karung/red_stand.png',
    'balap_karung/red_hop.png'
];

// Object untuk menyimpan gambar yang sudah dimuat
const preloadedImages = {};
let imagesLoaded = 0;
let totalImages = imagesToPreload.length;

// Fungsi untuk preload gambar
function preloadImages() {
    console.log('🖼️ Preloading images...');
    
    imagesToPreload.forEach(src => {
        const img = new Image();
        
        img.onload = () => {
            preloadedImages[src] = img;
            imagesLoaded++;
            console.log(`✅ Loaded: ${src} (${imagesLoaded}/${totalImages})`);
            
            // Semua gambar sudah dimuat
            if (imagesLoaded === totalImages) {
                console.log('🎉 All images preloaded successfully!');
            }
        };
        
        img.onerror = () => {
            console.error(`❌ Failed to load: ${src}`);
            imagesLoaded++;
        };
        
        img.src = src;
    });
}

// Preload semua gambar saat halaman dimuat
window.addEventListener('load', () => {
    preloadImages();
});

// ============================================
// GAME STATE
// ============================================

// Inisialisasi game state
const gameState = {
    leftPlayer: {
        answer: '',
        score: 0,
        climbPosition: 0, // untuk panjat pinang (0-7)
        racePosition: 0,   // untuk balap karung (0-10)
        lastQuestion: ''   // soal terakhir untuk mencegah duplikat
    },
    rightPlayer: {
        answer: '',
        score: 0,
        climbPosition: 0, // untuk panjat pinang (0-7)
        racePosition: 0,   // untuk balap karung (0-10)
        lastQuestion: ''   // soal terakhir untuk mencegah duplikat
    },
    ropePosition: 50, // posisi tali (50 = tengah, 0 = kiri menang, 100 = kanan menang)
    currentGameType: 'tarik-tambang', // 'tarik-tambang', 'panjat-pinang', or 'balap-karung'
    currentMode: 'addition', // 'addition', 'subtraction', 'multiplication', or 'division'
    currentLevel: 'beginner' // 'beginner', 'amateur', 'pro'
};

// Fungsi untuk mengupdate jawaban player
function updateAnswer(player, value) {
    let gameScreen;
    if (gameState.currentGameType === 'tarik-tambang') {
        gameScreen = '#gameScreenTarikTambang';
    } else if (gameState.currentGameType === 'panjat-pinang') {
        gameScreen = '#gameScreenPanjatPinang';
    } else {
        gameScreen = '#gameScreenBalapKarung';
    }
    
    const answerBox = document.querySelector(`${gameScreen} .${player}-player .answer-box`);
    if (player === 'left') {
        gameState.leftPlayer.answer = value;
    } else {
        gameState.rightPlayer.answer = value;
    }
    answerBox.textContent = value;
}

// Fungsi untuk mengecek jawaban
function checkAnswer(player) {
    let gameScreen;
    if (gameState.currentGameType === 'tarik-tambang') {
        gameScreen = '#gameScreenTarikTambang';
    } else if (gameState.currentGameType === 'panjat-pinang') {
        gameScreen = '#gameScreenPanjatPinang';
    } else {
        gameScreen = '#gameScreenBalapKarung';
    }
    
    const questionBox = document.querySelector(`${gameScreen} .${player}-player .question-box`);
    const answerBox = document.querySelector(`${gameScreen} .${player}-player .answer-box`);
    const question = questionBox.textContent.split('=')[0].trim();
    
    // Calculate correct answer without eval
    const correctAnswer = calculateAnswer(question);
    const playerAnswer = player === 'left' ? 
        parseFloat(gameState.leftPlayer.answer) : 
        parseFloat(gameState.rightPlayer.answer);

    if (playerAnswer === correctAnswer) {
        // Jawaban benar
        answerBox.classList.remove('wrong');
        answerBox.classList.add('correct');
        
        setTimeout(() => {
            answerBox.classList.remove('correct');
        }, 300);
        
        if (gameState.currentGameType === 'tarik-tambang') {
            // Logic untuk Tarik Tambang
            if (player === 'left') {
                gameState.ropePosition -= 10;
            } else {
                gameState.ropePosition += 10;
            }
            updateRopePosition();
            
            setTimeout(() => {
                generateNewQuestion(player);
            }, 300);
            
            // Cek kemenangan Tarik Tambang
            if (gameState.ropePosition <= 0) {
                setTimeout(() => {
                    showWinnerModal('Pemain Kiri', 'Selamat! Anda berhasil menarik tali ke garis akhir!');
                }, 400);
            } else if (gameState.ropePosition >= 100) {
                setTimeout(() => {
                    showWinnerModal('Pemain Kanan', 'Selamat! Anda berhasil menarik tali ke garis akhir!');
                }, 400);
            }
        } else if (gameState.currentGameType === 'panjat-pinang') {
            // Logic untuk Panjat Pinang - Jawaban BENAR
            if (player === 'left') {
                gameState.leftPlayer.climbPosition++;
            } else {
                gameState.rightPlayer.climbPosition++;
            }
            updateClimberPosition(player);
            updateScoreDisplay(player); // Update tampilan score
            
            setTimeout(() => {
                generateNewQuestion(player);
            }, 500);
            
            // Cek kemenangan Panjat Pinang
            const WINNING_STEPS = 7; // EDIT: Jumlah step untuk menang
            if (gameState.leftPlayer.climbPosition >= WINNING_STEPS) {
                setTimeout(() => {
                    showWinnerModal('Pemain Kiri', 'Selamat! Anda berhasil mencapai puncak tiang pinang!');
                }, 600);
            } else if (gameState.rightPlayer.climbPosition >= WINNING_STEPS) {
                setTimeout(() => {
                    showWinnerModal('Pemain Kanan', 'Selamat! Anda berhasil mencapai puncak tiang pinang!');
                }, 600);
            }
        } else if (gameState.currentGameType === 'balap-karung') {
            // Logic untuk Balap Karung - Jawaban BENAR
            if (player === 'left') {
                gameState.leftPlayer.racePosition++;
            } else {
                gameState.rightPlayer.racePosition++;
            }
            updateRacerPosition(player);
            updateScoreDisplay(player); // Update tampilan score
            
            setTimeout(() => {
                generateNewQuestion(player);
            }, 500);
            
            // Cek kemenangan Balap Karung
            const WINNING_HOPS = 10; // 10 lompatan untuk menang
            if (gameState.leftPlayer.racePosition >= WINNING_HOPS) {
                setTimeout(() => {
                    showWinnerModal('Pemain Kiri', 'Selamat! Anda berhasil mencapai garis finish!');
                }, 600);
            } else if (gameState.rightPlayer.racePosition >= WINNING_HOPS) {
                setTimeout(() => {
                    showWinnerModal('Pemain Kanan', 'Selamat! Anda berhasil mencapai garis finish!');
                }, 600);
            }
        }
        
        return true;
    } else {
        // Jawaban salah - tampilkan animasi error
        answerBox.classList.add('wrong');
        setTimeout(() => {
            answerBox.classList.remove('wrong');
        }, 500);
        
        // Logic untuk Panjat Pinang - Jawaban SALAH
        if (gameState.currentGameType === 'panjat-pinang') {
            const currentPosition = player === 'left' ? 
                gameState.leftPlayer.climbPosition : 
                gameState.rightPlayer.climbPosition;
            
            // Hanya kurangi jika posisi > 0 (sudah mulai memanjat)
            if (currentPosition > 0) {
                if (player === 'left') {
                    gameState.leftPlayer.climbPosition--;
                } else {
                    gameState.rightPlayer.climbPosition--;
                }
                updateClimberPosition(player); // Turunkan posisi
                updateScoreDisplay(player);    // Update tampilan score
            }
        }
        
        // Logic untuk Balap Karung - Jawaban SALAH (Shake animation)
        if (gameState.currentGameType === 'balap-karung') {
            const racerClass = player === 'left' ? '.left-racer' : '.right-racer';
            const racerContainer = document.querySelector(`#gameScreenBalapKarung ${racerClass}`);
            
            // Trigger shake animation
            racerContainer.classList.add('shaking');
            
            // Remove shake class setelah animasi selesai
            setTimeout(() => {
                racerContainer.classList.remove('shaking');
            }, 500);
        }
        
        return false;
    }
}

// Fungsi untuk menghitung jawaban tanpa eval (lebih aman)
function calculateAnswer(question) {
    // Remove spaces and parse the question
    question = question.trim();
    
    // Check for division
    if (question.includes('÷')) {
        const parts = question.split('÷').map(p => parseFloat(p.trim()));
        const result = parts[0] / parts[1];
        // Round to 1 decimal place untuk konsistensi
        const rounded = Math.round(result * 10) / 10;
        // Hilangkan trailing zero: 20.0 → 20, tapi 19.5 tetap 19.5
        return parseFloat(rounded.toFixed(1));
    }
    // Check for multiplication
    else if (question.includes('×')) {
        const parts = question.split('×').map(p => parseInt(p.trim()));
        return parts[0] * parts[1];
    }
    // Check for addition
    else if (question.includes('+')) {
        const parts = question.split('+').map(p => parseInt(p.trim()));
        return parts[0] + parts[1];
    }
    // Check for subtraction
    else if (question.includes('-')) {
        // Handle negative numbers
        const parts = question.split('-').filter(p => p.trim() !== '');
        if (question.startsWith('-')) {
            // First number is negative
            return -parseInt(parts[0]) - parseInt(parts[1]);
        }
        const nums = question.split('-').map(p => parseInt(p.trim()));
        return nums[0] - nums[1];
    }
    
    return 0;
}

// Fungsi untuk mengupdate posisi tali dan pemain
function updateRopePosition() {
    const scene = document.querySelector('.tug-of-war-scene');
    const gameContainer = document.querySelector('#gameScreenTarikTambang');
    
    if (!scene || !gameContainer) return;
    
    // Get actual widths for boundary calculation
    const leftSection = gameContainer.querySelector('.left-player');
    const rightSection = gameContainer.querySelector('.right-player');
    const centerSection = gameContainer.querySelector('.center-section');
    
    // Calculate safe boundaries (don't overlap with keypad areas)
    const leftBoundary = leftSection ? leftSection.offsetWidth : 340;
    const rightBoundary = rightSection ? rightSection.offsetWidth : 340;
    const centerWidth = centerSection ? centerSection.offsetWidth : 500;
    
    // Calculate maximum safe movement in pixels
    const maxLeftMove = Math.min(centerWidth * 0.4, leftBoundary * 0.3);  // Max 40% of center or 30% of keypad width
    const maxRightMove = Math.min(centerWidth * 0.4, rightBoundary * 0.3);
    
    // Calculate position based on game state (0-100 scale)
    let offset = 0;
    if (gameState.ropePosition < 50) {
        // Moving left (left player winning)
        const leftProgress = (50 - gameState.ropePosition) / 50; // 0 to 1
        offset = -leftProgress * maxLeftMove;
    } else if (gameState.ropePosition > 50) {
        // Moving right (right player winning)
        const rightProgress = (gameState.ropePosition - 50) / 50; // 0 to 1
        offset = rightProgress * maxRightMove;
    }
    
    scene.style.left = `${offset}px`;
}

// Fungsi untuk update tampilan score
function updateScoreDisplay(player) {
    let gameScreen;
    if (gameState.currentGameType === 'tarik-tambang') {
        gameScreen = '#gameScreenTarikTambang';
    } else if (gameState.currentGameType === 'panjat-pinang') {
        gameScreen = '#gameScreenPanjatPinang';
    } else {
        gameScreen = '#gameScreenBalapKarung';
    }
    
    const scoreElement = document.querySelector(`${gameScreen} .${player}-player .score-value`);
    
    if (scoreElement && gameState.currentGameType === 'panjat-pinang') {
        const score = player === 'left' ? 
            gameState.leftPlayer.climbPosition : 
            gameState.rightPlayer.climbPosition;
        scoreElement.textContent = `${score}/7`;
    } else if (scoreElement && gameState.currentGameType === 'balap-karung') {
        const score = player === 'left' ? 
            gameState.leftPlayer.racePosition : 
            gameState.rightPlayer.racePosition;
        scoreElement.textContent = `${score}/10`;
    }
}

// Fungsi untuk mengupdate posisi pemanjat
function updateClimberPosition(player) {
    const climberClass = player === 'left' ? '.left-climber' : '.right-climber';
    const climberContainer = document.querySelector(`#gameScreenPanjatPinang ${climberClass}`);
    const standImage = climberContainer.querySelector('.stand');
    const climbImage = climberContainer.querySelector('.climb');
    
    // Update posisi vertikal (setiap jawaban benar naik)
    const climbPosition = player === 'left' ? 
        gameState.leftPlayer.climbPosition : 
        gameState.rightPlayer.climbPosition;
    
    // ============================================
    // PENGATURAN PANJAT PINANG (EDIT DI SINI)
    // ============================================
    const TOTAL_STEPS = 7;           // Jumlah jawaban benar untuk menang
    const MAX_HEIGHT_PERCENT = 75;   // Tinggi maksimal (% dari tiang)
    
    // Hitung persentase ketinggian
    const heightPercentage = (climbPosition / TOTAL_STEPS) * MAX_HEIGHT_PERCENT;
    
    // Cek posisi dan ganti gambar sesuai
    if (climbPosition === 0) {
        // Posisi 0: Kembali ke stand
        climbImage.style.display = 'none';
        standImage.style.display = 'block';
        climberContainer.style.bottom = '0%';
    } else if (climbPosition === 1) {
        // Posisi 1: Ganti dari stand ke climb (pertama kali memanjat)
        standImage.style.display = 'none';
        climbImage.style.display = 'block';
        
        // Force reflow
        void climberContainer.offsetHeight;
        
        // Update posisi vertikal dengan animasi
        setTimeout(() => {
            climberContainer.style.bottom = `${heightPercentage}%`;
        }, 50);
    } else {
        // Posisi 2-7: Hanya update posisi vertikal (tetap climb)
        climberContainer.style.bottom = `${heightPercentage}%`;
    }
}

// Fungsi untuk mengupdate posisi racer (Balap Karung)
function updateRacerPosition(player) {
    const racerClass = player === 'left' ? '.left-racer' : '.right-racer';
    const racerContainer = document.querySelector(`#gameScreenBalapKarung ${racerClass}`);
    const standImage = racerContainer.querySelector('.stand');
    const hopImage = racerContainer.querySelector('.hop');
    
    // Get track actual width for pixel calculation
    const raceTrack = document.querySelector('#gameScreenBalapKarung .race-track');
    const trackWidth = raceTrack ? raceTrack.offsetWidth : 900;
    
    // Update posisi horizontal (setiap jawaban benar maju)
    const racePosition = player === 'left' ? 
        gameState.leftPlayer.racePosition : 
        gameState.rightPlayer.racePosition;
    
    // ============================================
    // PENGATURAN BALAP KARUNG (3D PERSPECTIVE)
    // ============================================
    const TOTAL_HOPS = 10;          // Jumlah hop untuk menang
    
    // Different track lengths for 3D perspective
    // Player di jalur atas (merah/right) memiliki jarak lebih pendek karena perspective
    let START_PIXEL, FINISH_PIXEL, HOP_DISTANCE;
    
    if (player === 'left') {
        // Blue player - jalur bawah (lebih panjang)
        START_PIXEL = trackWidth * 0.035;      // 4% dari kiri (dimundurkan)
        // Finish line di 82%
        FINISH_PIXEL = trackWidth * 0.82;     // 82% - finish line
        
        // Bagi merata untuk 10 hop
        HOP_DISTANCE = (FINISH_PIXEL - START_PIXEL) / 10;
    } else {
        // Red player - jalur atas (lebih pendek karena perspective)
        START_PIXEL = trackWidth * 0.065;     // 6.5% dari kiri
        // Finish line dengan perspective (lebih dekat)
        FINISH_PIXEL = trackWidth * 0.78;     // 78% - finish line perspective (lebih pendek)
        
        // Bagi merata untuk 10 hop
        HOP_DISTANCE = (FINISH_PIXEL - START_PIXEL) / 10;
    }
    
    // Calculate current position in pixels - simple linear progression
    const currentPixelPosition = START_PIXEL + (racePosition * HOP_DISTANCE);
    
    // PERBAIKAN: Ganti gambar LANGSUNG dari stand ke hop (tanpa delay)
    standImage.style.display = 'none';
    hopImage.style.display = 'block';
    
    // Tambahkan class hopping untuk trigger animasi parabola
    racerContainer.classList.add('hopping');
    
    // Update posisi horizontal menggunakan PIXELS (bergerak sambil hop)
    racerContainer.style.left = `${currentPixelPosition}px`;
    
    // Vertical position (bottom) sudah diatur di CSS dengan responsive values
    // Tidak perlu diubah di JavaScript agar tetap responsive saat fullscreen
    
    // Setelah animasi hop selesai (500ms), langsung ganti ke stand
    setTimeout(() => {
        // Langsung ganti gambar hop ke stand
        hopImage.style.display = 'none';
        standImage.style.display = 'block';
        
        // Hapus class hopping
        racerContainer.classList.remove('hopping');
        
        // Maintain scale based on player lane
        if (player === 'left') {
            racerContainer.style.transform = 'scale(1)';  // Front lane
        } else {
            racerContainer.style.transform = 'scale(0.9)';  // Back lane
        }
    }, 500);
}

// Fungsi untuk membuat confetti
function createConfetti() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 3;

        for (let i = 0; i < particleCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = randomInRange(0, 100) + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDuration = randomInRange(2, 4) + 's';
            document.body.appendChild(confetti);

            setTimeout(() => {
                confetti.remove();
            }, 4000);
        }
    }, 50);
}

// Fungsi untuk menampilkan modal pemenang
function showWinnerModal(winner, message) {
    createConfetti();
    
    const modal = document.getElementById('winnerModal');
    const winnerText = document.getElementById('winnerText');
    const winnerMessage = document.getElementById('winnerMessage');
    winnerText.innerHTML = `<span>🎉</span><span>${winner} Menang!</span><span>🎉</span>`;
    winnerMessage.textContent = message;
    modal.style.display = 'flex';
    
    // Hide tombol Home dan Fullscreen ketika modal muncul
    const homeBtn = document.getElementById('homeBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (homeBtn) homeBtn.style.display = 'none';
    if (fullscreenBtn) fullscreenBtn.style.display = 'none';
}

// Fungsi untuk menutup modal dan restart game dengan countdown
function closeModal() {
    const modal = document.getElementById('winnerModal');
    modal.style.display = 'none';
    
    // Show kembali tombol Home dan Fullscreen ketika modal ditutup
    const homeBtn = document.getElementById('homeBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (homeBtn) homeBtn.style.display = 'flex';
    if (fullscreenBtn) fullscreenBtn.style.display = 'flex';
    
    // Tampilkan countdown sebelum restart game
    showCountdown();
}

// Helper function untuk generate angka berdasarkan mode dan level
function generateQuestionNumbers() {
    let num1, num2;
    
    if (gameState.currentMode === 'addition') {
        switch(gameState.currentLevel) {
            case 'beginner':
                // 1 digit (1-9)
                num1 = Math.floor(Math.random() * 9) + 1;
                num2 = Math.floor(Math.random() * 9) + 1;
                break;
            case 'amateur':
                // Mixed: 1 digit + 2 digits OR 2 digits + 1 digit
                if (Math.random() < 0.5) {
                    // 1 digit + 2 digits
                    num1 = Math.floor(Math.random() * 9) + 1;
                    num2 = Math.floor(Math.random() * 90) + 10;
                } else {
                    // 2 digits + 1 digit
                    num1 = Math.floor(Math.random() * 90) + 10;
                    num2 = Math.floor(Math.random() * 9) + 1;
                }
                break;
            case 'pro':
                // 2 digits (10-99)
                num1 = Math.floor(Math.random() * 90) + 10;
                num2 = Math.floor(Math.random() * 90) + 10;
                break;
        }
        return { num1, num2, operator: '+' };
    } else if (gameState.currentMode === 'subtraction') {
        switch(gameState.currentLevel) {
            case 'beginner':
                // 1 digit - 1 digit (1-9)
                num1 = Math.floor(Math.random() * 9) + 1;
                num2 = Math.floor(Math.random() * 9) + 1;
                break;
            case 'amateur':
                // Mixed: 2 digit - 1 digit OR 1 digit - 2 digit
                if (Math.random() < 0.5) {
                    // 2 digit - 1 digit
                    num1 = Math.floor(Math.random() * 90) + 10;
                    num2 = Math.floor(Math.random() * 9) + 1;
                } else {
                    // 1 digit - 2 digit
                    num1 = Math.floor(Math.random() * 9) + 1;
                    num2 = Math.floor(Math.random() * 90) + 10;
                }
                break;
            case 'pro':
                // 2 digits - 2 digits (10-99)
                num1 = Math.floor(Math.random() * 90) + 10;
                num2 = Math.floor(Math.random() * 90) + 10;
                break;
        }
        return { num1, num2, operator: '-' };
    } else if (gameState.currentMode === 'multiplication') {
        switch(gameState.currentLevel) {
            case 'beginner':
                // 1 digit × 1 digit (1-9)
                num1 = Math.floor(Math.random() * 9) + 1;
                num2 = Math.floor(Math.random() * 9) + 1;
                break;
            case 'amateur':
                // 1 digit × 2 digits (1-9 × 10-99)
                num1 = Math.floor(Math.random() * 9) + 1;
                num2 = Math.floor(Math.random() * 90) + 10;
                break;
            case 'pro':
                // 2 digits × 2 digits (10-99 × 10-99)
                num1 = Math.floor(Math.random() * 90) + 10;
                num2 = Math.floor(Math.random() * 90) + 10;
                break;
        }
        return { num1, num2, operator: '×' };
    } else if (gameState.currentMode === 'division') {
        switch(gameState.currentLevel) {
            case 'beginner':
                // Hasil bulat (1-20 ÷ 1-5)
                num2 = Math.floor(Math.random() * 5) + 1; // pembagi 1-5
                const result1 = Math.floor(Math.random() * 4) + 1; // hasil 1-4
                num1 = num2 * result1; // jaminan hasil bulat
                break;
            case 'amateur':
                // Hasil bulat (10-99 ÷ 1-9)
                num2 = Math.floor(Math.random() * 9) + 1; // pembagi 1-9
                const result2 = Math.floor(Math.random() * 11) + 1; // hasil 1-11
                num1 = num2 * result2; // jaminan hasil bulat (max 99)
                break;
            case 'pro':
                // Campuran: 50% bulat, 50% desimal (.5 atau .2/.4/.6/.8)
                if (Math.random() < 0.5) {
                    // Hasil BULAT (seperti amateur tapi lebih besar)
                    num2 = Math.floor(Math.random() * 9) + 2; // pembagi 2-10
                    const result3 = Math.floor(Math.random() * 15) + 5; // hasil 5-19
                    num1 = num2 * result3; // jaminan hasil bulat
                } else {
                    // Hasil DESIMAL - pilih random antara pembagi 2 (hasil .5) atau pembagi 5 (hasil .2/.4/.6/.8)
                    if (Math.random() < 0.5) {
                        // Pembagi 2 → hasil .5
                        num2 = 2;
                        const result4 = Math.floor(Math.random() * 40) + 10; // hasil 10-49
                        num1 = num2 * result4 + 1; // +1 agar hasil .5 (contoh: 2×10+1=21, 21÷2=10.5)
                    } else {
                        // Pembagi 5 → hasil .2, .4, .6, .8
                        num2 = 5;
                        const result5 = Math.floor(Math.random() * 18) + 2; // hasil 2-19
                        const remainder = [1, 2, 3, 4][Math.floor(Math.random() * 4)]; // sisa 1,2,3,4 (bukan 0 atau 5)
                        num1 = num2 * result5 + remainder; // (contoh: 5×4+2=22, 22÷5=4.4)
                    }
                }
                break;
        }
        return { num1, num2, operator: '÷' };
    }
    
    // Default fallback
    return { num1: 1, num2: 1, operator: '+' };
}

// Fungsi untuk generate soal baru
function generateNewQuestion(player) {
    let gameScreen;
    if (gameState.currentGameType === 'tarik-tambang') {
        gameScreen = '#gameScreenTarikTambang';
    } else if (gameState.currentGameType === 'panjat-pinang') {
        gameScreen = '#gameScreenPanjatPinang';
    } else {
        gameScreen = '#gameScreenBalapKarung';
    }
    const questionBox = document.querySelector(`${gameScreen} .${player}-player .question-box`);
    
    // Get last question untuk player ini
    const lastQuestion = player === 'left' ? 
        gameState.leftPlayer.lastQuestion : 
        gameState.rightPlayer.lastQuestion;
    
    // Generate soal baru, pastikan tidak sama dengan soal sebelumnya
    let questionText = '';
    let maxRetries = 20; // Max 20 kali retry untuk safety
    let retryCount = 0;
    
    do {
        const { num1, num2, operator } = generateQuestionNumbers();
        questionText = `${num1} ${operator} ${num2} = ?`;
        retryCount++;
        
        // Jika sudah 20 kali retry dan masih sama, break (untuk avoid infinite loop)
        if (retryCount >= maxRetries) {
            break;
        }
    } while (questionText === lastQuestion && lastQuestion !== '');
    
    // Update UI dan state
    questionBox.textContent = questionText;
    
    // Simpan soal ini sebagai lastQuestion untuk player ini
    if (player === 'left') {
        gameState.leftPlayer.lastQuestion = questionText;
    } else {
        gameState.rightPlayer.lastQuestion = questionText;
    }
    
    updateAnswer(player, '');
}

// Fungsi untuk reset game
function resetGame() {
    gameState.ropePosition = 50;
    gameState.leftPlayer.answer = '';
    gameState.rightPlayer.answer = '';
    gameState.leftPlayer.score = 0;
    gameState.rightPlayer.score = 0;
    gameState.leftPlayer.climbPosition = 0;
    gameState.rightPlayer.climbPosition = 0;
    gameState.leftPlayer.racePosition = 0;
    gameState.rightPlayer.racePosition = 0;
    gameState.leftPlayer.lastQuestion = '';
    gameState.rightPlayer.lastQuestion = '';
    
    if (gameState.currentGameType === 'tarik-tambang') {
        updateRopePosition();
    } else if (gameState.currentGameType === 'panjat-pinang') {
        // Reset climber positions
        document.querySelectorAll('.climber-container').forEach(container => {
            container.style.bottom = '0';
            const standImage = container.querySelector('.stand');
            const climbImage = container.querySelector('.climb');
            standImage.style.display = 'block';
            climbImage.style.display = 'none';
        });
        
        // Update score display untuk reset ke 0/7
        updateScoreDisplay('left');
        updateScoreDisplay('right');
    } else if (gameState.currentGameType === 'balap-karung') {
        // Reset racer positions - kembali ke posisi awal menggunakan pixels
        const leftRacer = document.querySelector('#gameScreenBalapKarung .left-racer');
        const rightRacer = document.querySelector('#gameScreenBalapKarung .right-racer');
        const raceTrack = document.querySelector('#gameScreenBalapKarung .race-track');
        const trackWidth = raceTrack ? raceTrack.offsetWidth : 900;
        
        if (leftRacer) {
            const startPixelLeft = trackWidth * 0.035;  // 4% - dimundurkan
            leftRacer.style.left = `${startPixelLeft}px`;
            // Bottom position sudah diatur di CSS dengan responsive values (clamp)
            leftRacer.style.transform = 'scale(1)';  // Normal size for front lane
            leftRacer.classList.remove('hopping');
            leftRacer.classList.remove('shaking');
            const standImage = leftRacer.querySelector('.stand');
            const hopImage = leftRacer.querySelector('.hop');
            standImage.style.display = 'block';
            hopImage.style.display = 'none';
        }
        
        if (rightRacer) {
            const startPixelRight = trackWidth * 0.065;  // 6.5% - mundur sedikit saja dari 7%
            rightRacer.style.left = `${startPixelRight}px`;
            // Bottom position sudah diatur di CSS dengan responsive values (clamp)
            rightRacer.style.transform = 'scale(0.9)';  // Smaller for back lane (perspective)
            rightRacer.classList.remove('hopping');
            rightRacer.classList.remove('shaking');
            const standImage = rightRacer.querySelector('.stand');
            const hopImage = rightRacer.querySelector('.hop');
            standImage.style.display = 'block';
            hopImage.style.display = 'none';
        }
        
        // Update score display untuk reset ke 0/10
        updateScoreDisplay('left');
        updateScoreDisplay('right');
    }
    
    generateNewQuestion('left');
    generateNewQuestion('right');
    
    let gameScreen;
    if (gameState.currentGameType === 'tarik-tambang') {
        gameScreen = '#gameScreenTarikTambang';
    } else if (gameState.currentGameType === 'panjat-pinang') {
        gameScreen = '#gameScreenPanjatPinang';
    } else {
        gameScreen = '#gameScreenBalapKarung';
    }
    document.querySelectorAll(`${gameScreen} .answer-box`).forEach(box => box.textContent = '');
}

// Setup event listeners for both game screens
function setupEventListeners(gameScreenId) {
    const gameScreen = document.getElementById(gameScreenId);
    
    gameScreen.querySelectorAll('.player-section').forEach(section => {
        const player = section.classList.contains('left-player') ? 'left' : 'right';
    
    // Number buttons - Use touchstart for faster response on mobile
    section.querySelectorAll('.number-btn').forEach(btn => {
        // Prevent double-tap zoom and delay
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        const handleClick = () => {
            // Use requestAnimationFrame for smooth UI updates
            requestAnimationFrame(() => {
                const currentAnswer = player === 'left' ? 
                    gameState.leftPlayer.answer : 
                    gameState.rightPlayer.answer;
            
            // Limit answer length based on mode and level
            let maxLength = 2;
            
            if (gameState.currentMode === 'addition') {
                if (gameState.currentLevel === 'beginner') maxLength = 2;  // max: 9+9=18
                else if (gameState.currentLevel === 'amateur') maxLength = 3;  // max: 99+9=108 or 9+99=108
                else if (gameState.currentLevel === 'pro') maxLength = 3;  // max: 99+99=198
            } else if (gameState.currentMode === 'subtraction') {
                if (gameState.currentLevel === 'beginner') maxLength = 3; // max -8 atau 8 (minus + 1 digit)
                else if (gameState.currentLevel === 'amateur') maxLength = 4; // max -99 atau 99 (minus + 2 digit)
                else if (gameState.currentLevel === 'pro') maxLength = 4; // max -89 atau 89 (minus + 2 digit)
            } else if (gameState.currentMode === 'multiplication') {
                if (gameState.currentLevel === 'beginner') maxLength = 2; // max 81
                else if (gameState.currentLevel === 'amateur') maxLength = 3; // max 891 (9×99)
                else if (gameState.currentLevel === 'pro') maxLength = 4; // max 9801 (99×99)
            } else if (gameState.currentMode === 'division') {
                if (gameState.currentLevel === 'beginner') maxLength = 2; // max 20÷5=4 (hasil bulat)
                else if (gameState.currentLevel === 'amateur') maxLength = 2; // max 99÷9=11 (hasil bulat)
                else if (gameState.currentLevel === 'pro') maxLength = 4; // max 99÷2=49.5 (desimal: 2 digit + titik + 1 desimal)
            }
            
                if (currentAnswer.length < maxLength) {
                    updateAnswer(player, currentAnswer + btn.textContent);
                }
            });
        };
        
        // Add both click and touchend for better compatibility
        btn.addEventListener('click', handleClick);
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleClick();
        }, { passive: false });
    });
    
    // Helper function for button handlers with touch optimization
    const addOptimizedListener = (selector, handler) => {
        const btn = section.querySelector(selector);
        if (!btn) return;
        
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        const optimizedHandler = () => {
            requestAnimationFrame(handler);
        };
        
        btn.addEventListener('click', optimizedHandler);
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            optimizedHandler();
        }, { passive: false });
    };
    
    // Minus button - Toggle functionality
    addOptimizedListener('.minus-btn', () => {
        const currentAnswer = player === 'left' ? 
            gameState.leftPlayer.answer : 
            gameState.rightPlayer.answer;
        
        // Toggle minus at the beginning
        if (currentAnswer.startsWith('-')) {
            // Remove minus if it exists
            updateAnswer(player, currentAnswer.substring(1));
        } else {
            // Add minus at the beginning
            updateAnswer(player, '-' + currentAnswer);
        }
    });
    
    // Decimal button - Add decimal point (only once)
    addOptimizedListener('.decimal-btn', () => {
        const currentAnswer = player === 'left' ? 
            gameState.leftPlayer.answer : 
            gameState.rightPlayer.answer;
        
        // Only add decimal if:
        // 1. Not already present
        // 2. There's at least one digit before it
        // 3. Not at max length
        if (!currentAnswer.includes('.') && currentAnswer.length > 0 && currentAnswer.length < 4) {
            updateAnswer(player, currentAnswer + '.');
        }
    });
    
    // Clear button
    addOptimizedListener('.clear-btn', () => {
        updateAnswer(player, '');
    });
    
    // Go button
    addOptimizedListener('.go-btn', () => {
        checkAnswer(player);
    });
    
    // Go button alternative (for subtraction mode)
    addOptimizedListener('.go-btn-alt', () => {
        checkAnswer(player);
    });
    });
}

// Setup event listeners for all game screens
setupEventListeners('gameScreenTarikTambang');
setupEventListeners('gameScreenPanjatPinang');
setupEventListeners('gameScreenBalapKarung');

// Fungsi untuk menampilkan menu game type (Tarik Tambang / Panjat Pinang / Balap Karung)
function showGameTypeMenu() {
    document.getElementById('gameTypeMenu').style.display = 'flex';
    document.getElementById('mathModeMenuTarikTambang').style.display = 'none';
    document.getElementById('mathModeMenuPanjatPinang').style.display = 'none';
    document.getElementById('mathModeMenuBalapKarung').style.display = 'none';
    document.getElementById('levelMenuAddition').style.display = 'none';
    document.getElementById('levelMenuSubtraction').style.display = 'none';
    document.getElementById('levelMenuMultiplication').style.display = 'none';
    document.getElementById('levelMenuDivision').style.display = 'none';
    document.getElementById('gameScreenTarikTambang').style.display = 'none';
    document.getElementById('gameScreenPanjatPinang').style.display = 'none';
    document.getElementById('gameScreenBalapKarung').style.display = 'none';
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) homeBtn.style.display = 'none';
}

// Fungsi untuk memilih game type
function selectGameType(gameType) {
    gameState.currentGameType = gameType;
    if (gameType === 'tarik-tambang') {
        showMathModeMenu('tarik-tambang');
    } else if (gameType === 'panjat-pinang') {
        showMathModeMenu('panjat-pinang');
    } else if (gameType === 'balap-karung') {
        showMathModeMenu('balap-karung');
    }
}

// Fungsi untuk menampilkan menu math mode
function showMathModeMenu(gameType) {
    document.getElementById('gameTypeMenu').style.display = 'none';
    document.getElementById('levelMenuAddition').style.display = 'none';
    document.getElementById('levelMenuSubtraction').style.display = 'none';
    document.getElementById('levelMenuMultiplication').style.display = 'none';
    document.getElementById('levelMenuDivision').style.display = 'none';
    document.getElementById('gameScreenTarikTambang').style.display = 'none';
    document.getElementById('gameScreenPanjatPinang').style.display = 'none';
    document.getElementById('gameScreenBalapKarung').style.display = 'none';
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) homeBtn.style.display = 'none';
    
    if (gameType === 'tarik-tambang') {
        document.getElementById('mathModeMenuTarikTambang').style.display = 'flex';
        document.getElementById('mathModeMenuPanjatPinang').style.display = 'none';
        document.getElementById('mathModeMenuBalapKarung').style.display = 'none';
    } else if (gameType === 'panjat-pinang') {
        document.getElementById('mathModeMenuTarikTambang').style.display = 'none';
        document.getElementById('mathModeMenuPanjatPinang').style.display = 'flex';
        document.getElementById('mathModeMenuBalapKarung').style.display = 'none';
    } else if (gameType === 'balap-karung') {
        document.getElementById('mathModeMenuTarikTambang').style.display = 'none';
        document.getElementById('mathModeMenuPanjatPinang').style.display = 'none';
        document.getElementById('mathModeMenuBalapKarung').style.display = 'flex';
    }
}

// Fungsi untuk memilih math mode
function selectMathMode(mode) {
    gameState.currentMode = mode;
    if (mode === 'addition') {
        showLevelMenu('addition');
    } else if (mode === 'subtraction') {
        showLevelMenu('subtraction');
    } else if (mode === 'multiplication') {
        showLevelMenu('multiplication');
    } else if (mode === 'division') {
        showLevelMenu('division');
    }
}

// Fungsi untuk menampilkan menu level
function showLevelMenu(mode) {
    document.getElementById('gameTypeMenu').style.display = 'none';
    document.getElementById('mathModeMenuTarikTambang').style.display = 'none';
    document.getElementById('mathModeMenuPanjatPinang').style.display = 'none';
    document.getElementById('mathModeMenuBalapKarung').style.display = 'none';
    document.getElementById('levelMenuAddition').style.display = 'none';
    document.getElementById('levelMenuSubtraction').style.display = 'none';
    document.getElementById('levelMenuMultiplication').style.display = 'none';
    document.getElementById('levelMenuDivision').style.display = 'none';
    document.getElementById('gameScreenTarikTambang').style.display = 'none';
    document.getElementById('gameScreenPanjatPinang').style.display = 'none';
    document.getElementById('gameScreenBalapKarung').style.display = 'none';
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) homeBtn.style.display = 'none';
    
    if (mode === 'addition') {
        document.getElementById('levelMenuAddition').style.display = 'flex';
    } else if (mode === 'subtraction') {
        document.getElementById('levelMenuSubtraction').style.display = 'flex';
    } else if (mode === 'multiplication') {
        document.getElementById('levelMenuMultiplication').style.display = 'flex';
    } else if (mode === 'division') {
        document.getElementById('levelMenuDivision').style.display = 'flex';
    }
}

// Fungsi untuk memilih level dan mulai game
function selectLevel(level) {
    gameState.currentLevel = level;
    showCountdown();
}

// Fungsi untuk menampilkan countdown
function showCountdown() {
    const overlay = document.getElementById('countdownOverlay');
    
    // Hide tombol Home dan Fullscreen saat countdown berjalan
    const homeBtn = document.getElementById('homeBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (homeBtn) homeBtn.style.display = 'none';
    if (fullscreenBtn) fullscreenBtn.style.display = 'none';
    
    // Show overlay
    overlay.classList.add('show');
    
    const countdownSequence = [
        { number: '3', text: 'Bersiap...' },
        { number: '2', text: 'Konsentrasi...' },
        { number: '1', text: 'Fokus...' },
        { number: 'Mulai!', text: 'Gasskan!!!...', isStart: true }
    ];
    
    function updateCountdown(index) {
        if (index >= countdownSequence.length) {
            // Countdown selesai, sembunyikan overlay dan mulai game
            setTimeout(() => {
                overlay.classList.remove('show');
                startGame();
            }, 500);
            return;
        }
        
        const current = countdownSequence[index];
        
        // Query element setiap kali (karena setelah replaceWith, reference lama jadi invalid)
        const numberEl = document.getElementById('countdownNumber');
        const textEl = document.getElementById('countdownText');
        
        // Update content
        numberEl.textContent = current.number;
        textEl.textContent = current.text;
        
        // Tambah/hapus class khusus untuk "Mulai!"
        if (current.isStart) {
            numberEl.classList.add('start');
            textEl.classList.add('start');
        } else {
            numberEl.classList.remove('start');
            textEl.classList.remove('start');
        }
        
        // Trigger reflow untuk restart animation
        numberEl.style.animation = 'none';
        textEl.style.animation = 'none';
        void numberEl.offsetHeight; // Trigger reflow
        numberEl.style.animation = '';
        textEl.style.animation = '';
        
        // Schedule next countdown
        if (index < countdownSequence.length - 1) {
            setTimeout(() => updateCountdown(index + 1), 1000);
        } else {
            // "Mulai!" - tahan lebih lama sebelum mulai game
            setTimeout(() => updateCountdown(index + 1), 800);
        }
    }
    
    // Mulai countdown
    updateCountdown(0);
}

// Fungsi untuk memulai game
function startGame() {
    document.getElementById('gameTypeMenu').style.display = 'none';
    document.getElementById('mathModeMenuTarikTambang').style.display = 'none';
    document.getElementById('mathModeMenuPanjatPinang').style.display = 'none';
    document.getElementById('mathModeMenuBalapKarung').style.display = 'none';
    document.getElementById('levelMenuAddition').style.display = 'none';
    document.getElementById('levelMenuSubtraction').style.display = 'none';
    document.getElementById('levelMenuMultiplication').style.display = 'none';
    document.getElementById('levelMenuDivision').style.display = 'none';
    const homeBtn = document.getElementById('homeBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (homeBtn) homeBtn.style.display = 'flex';
    if (fullscreenBtn) fullscreenBtn.style.display = 'flex';
    
    // Show the appropriate game screen
    if (gameState.currentGameType === 'tarik-tambang') {
        document.getElementById('gameScreenTarikTambang').style.display = 'flex';
        document.getElementById('gameScreenPanjatPinang').style.display = 'none';
        document.getElementById('gameScreenBalapKarung').style.display = 'none';
    } else if (gameState.currentGameType === 'panjat-pinang') {
        document.getElementById('gameScreenTarikTambang').style.display = 'none';
        document.getElementById('gameScreenPanjatPinang').style.display = 'flex';
        document.getElementById('gameScreenBalapKarung').style.display = 'none';
    } else if (gameState.currentGameType === 'balap-karung') {
        document.getElementById('gameScreenTarikTambang').style.display = 'none';
        document.getElementById('gameScreenPanjatPinang').style.display = 'none';
        document.getElementById('gameScreenBalapKarung').style.display = 'flex';
    }
    
    // Show/hide minus button based on mode
    updateKeypadLayout();
    
    resetGame();
}

// Fungsi untuk update keypad layout based on mode
function updateKeypadLayout() {
    const minusButtons = document.querySelectorAll('.minus-btn');
    const decimalButtons = document.querySelectorAll('.decimal-btn');
    const goButtons = document.querySelectorAll('.go-btn');
    const row5s = document.querySelectorAll('.keypad-row-5');
    const row4s = document.querySelectorAll('.keypad-row-4');
    
    if (gameState.currentMode === 'subtraction') {
        // Subtraction mode: [−] [0] [C] then [Go] below
        minusButtons.forEach(btn => btn.classList.add('visible'));
        decimalButtons.forEach(btn => btn.classList.remove('visible'));
        goButtons.forEach(btn => btn.classList.add('hidden'));
        row5s.forEach(row => row.classList.add('visible'));
        row4s.forEach(row => {
            row.classList.add('subtraction-mode');
            row.classList.remove('division-mode');
        });
    } else if (gameState.currentMode === 'division') {
        // Division mode: [.] [0] [C] then [Go] below
        minusButtons.forEach(btn => btn.classList.remove('visible'));
        decimalButtons.forEach(btn => btn.classList.add('visible'));
        goButtons.forEach(btn => btn.classList.add('hidden'));
        row5s.forEach(row => row.classList.add('visible'));
        row4s.forEach(row => {
            row.classList.remove('subtraction-mode');
            row.classList.add('division-mode');
        });
    } else {
        // Addition/Multiplication mode: [C] [0] [Go]
        minusButtons.forEach(btn => btn.classList.remove('visible'));
        decimalButtons.forEach(btn => btn.classList.remove('visible'));
        goButtons.forEach(btn => btn.classList.remove('hidden'));
        row5s.forEach(row => row.classList.remove('visible'));
        row4s.forEach(row => {
            row.classList.remove('subtraction-mode');
            row.classList.remove('division-mode');
        });
    }
}

// Fungsi untuk kembali ke menu game type
function backToGameTypeMenu() {
    showGameTypeMenu();
}

// Fungsi untuk kembali ke menu utama (dari level selection)
function backToMainMenu() {
    showMathModeMenu(gameState.currentGameType);
}

// Initialize - tampilkan menu game type
showGameTypeMenu();

// ============================================
// FIT TO SCREEN HANDLING - IMPROVED
// ============================================

// Prevent zoom on double-tap (mobile) - only register once
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, { passive: false });

// Prevent pinch zoom on mobile
document.addEventListener('touchmove', (event) => {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

// Function to detect device type and resolution
function getDeviceInfo() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    const screenWidth = screen.width;
    const screenHeight = screen.height;
    
    // Detect Interactive Flat Panel (high resolution, large screen)
    const isInteractivePanel = (screenWidth >= 3840 || screenHeight >= 2160) ||
                              (width >= 3840 || height >= 2160);
    
    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                    (width <= 768 && 'ontouchstart' in window);
    
    // Detect tablet
    const isTablet = (width >= 768 && width <= 1024) && 'ontouchstart' in window;
    
    return {
        width,
        height,
        dpr,
        screenWidth,
        screenHeight,
        isInteractivePanel,
        isMobile,
        isTablet,
        aspectRatio: width / height
    };
}

// Function to optimize layout based on device
function optimizeLayout() {
    const deviceInfo = getDeviceInfo();
    
    // Set custom CSS variables based on device
    if (deviceInfo.isInteractivePanel) {
        // Interactive Flat Panel optimizations
        document.documentElement.style.setProperty('--custom-scale', '1.5');
        document.documentElement.style.setProperty('--custom-font-scale', '1.6');
        console.log('📺 Interactive Flat Panel detected - applying optimizations');
    } else if (deviceInfo.isMobile) {
        // Mobile optimizations
        document.documentElement.style.setProperty('--custom-scale', '0.8');
        document.documentElement.style.setProperty('--custom-font-scale', '0.9');
        console.log('📱 Mobile device detected');
    } else if (deviceInfo.isTablet) {
        // Tablet optimizations
        document.documentElement.style.setProperty('--custom-scale', '0.9');
        document.documentElement.style.setProperty('--custom-font-scale', '1');
        console.log('📱 Tablet device detected');
    }
    
    // Handle aspect ratio
    if (deviceInfo.aspectRatio > 2) {
        // Ultra-wide displays
        document.body.classList.add('ultra-wide');
    } else if (deviceInfo.aspectRatio < 0.6) {
        // Very tall displays (portrait phones)
        document.body.classList.add('tall-display');
    }
    
    console.log('📊 Device Info:', deviceInfo);
}

// Function to force fit to screen and prevent scroll
function forceFitToScreen() {
    // Prevent any scrolling
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    
    // Force viewport units
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    
    // Set CSS variables for dynamic viewport
    document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`);
    document.documentElement.style.setProperty('--vw', `${vw * 0.01}px`);
    
    // Prevent pull-to-refresh
    document.body.style.overscrollBehavior = 'none';
    document.body.style.overscrollBehaviorY = 'none';
    document.body.style.touchAction = 'none';
    
    // Optimize layout based on device
    optimizeLayout();
    
    // Update rope position if in tarik tambang game
    if (gameState.currentGameType === 'tarik-tambang' && 
        document.getElementById('gameScreenTarikTambang').style.display === 'flex') {
        updateRopePosition();
    }
}

// Call on load
window.addEventListener('load', () => {
    forceFitToScreen();
    
    // Set initial viewport meta tag for better mobile support
    let viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    }
});

// Handle window resize/orientation change
let resizeTimeout;
window.addEventListener('resize', () => {
    // Debounce resize for performance
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        forceFitToScreen();
        
        // Recalculate Balap Karung positions on resize
        if (gameState.currentGameType === 'balap-karung' && 
            document.getElementById('gameScreenBalapKarung').style.display === 'flex') {
            recalculateRacerPositions();
        }
        
        // Recalculate Tarik Tambang position on resize
        if (gameState.currentGameType === 'tarik-tambang' && 
            document.getElementById('gameScreenTarikTambang').style.display === 'flex') {
            updateRopePosition();
        }
    }, 100);
});

// Function to recalculate racer positions after resize
function recalculateRacerPositions() {
    const raceTrack = document.querySelector('#gameScreenBalapKarung .race-track');
    if (!raceTrack) return;
    
    const trackWidth = raceTrack.offsetWidth;
    
    // Recalculate left racer position (blue - jalur bawah)
    const leftRacer = document.querySelector('#gameScreenBalapKarung .left-racer');
    if (leftRacer) {
        const START_LEFT = trackWidth * 0.035;    // Sama dengan updateRacerPosition (4%)
        const FINISH_LEFT = trackWidth * 0.82;   // Finish line di 82%
        const HOP_DISTANCE_LEFT = (FINISH_LEFT - START_LEFT) / 10;
        
        const leftPosition = START_LEFT + (gameState.leftPlayer.racePosition * HOP_DISTANCE_LEFT);
        leftRacer.style.left = `${leftPosition}px`;
        leftRacer.style.transform = 'scale(1)';  // Maintain scale for front lane
    }
    
    // Recalculate right racer position (red - jalur atas)
    const rightRacer = document.querySelector('#gameScreenBalapKarung .right-racer');
    if (rightRacer) {
        const START_RIGHT = trackWidth * 0.065;  // Sama dengan updateRacerPosition
        const FINISH_RIGHT = trackWidth * 0.78;  // Finish line perspective (78%)
        const HOP_DISTANCE_RIGHT = (FINISH_RIGHT - START_RIGHT) / 10;
        
        const rightPosition = START_RIGHT + (gameState.rightPlayer.racePosition * HOP_DISTANCE_RIGHT);
        rightRacer.style.left = `${rightPosition}px`;
        rightRacer.style.transform = 'scale(0.9)';  // Maintain scale for back lane
    }
}

// Handle orientation change (mobile devices)
window.addEventListener('orientationchange', () => {
    // Delay to ensure new dimensions are available
    setTimeout(() => {
        forceFitToScreen();
        // Force a re-render
        document.body.style.display = 'none';
        document.body.offsetHeight; // Trigger reflow
        document.body.style.display = '';
    }, 300);
});

// Also handle visual viewport changes (mobile browser address bar)
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
        forceFitToScreen();
    });
    
    window.visualViewport.addEventListener('scroll', () => {
        // Reset scroll position
        window.scrollTo(0, 0);
    });
}

// Prevent default touch behaviors
document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });

// ============================================
// FULLSCREEN FUNCTIONALITY - ENHANCED
// ============================================

// Function to toggle fullscreen mode
function toggleFullscreen() {
    if (!document.fullscreenElement && 
        !document.mozFullScreenElement && 
        !document.webkitFullscreenElement && 
        !document.msFullscreenElement) {
        // Enter fullscreen
        const elem = document.documentElement;
        
        // Try to request fullscreen with navigation UI hidden (for mobile)
        const fullscreenOptions = {
            navigationUI: 'hide'
        };
        
        if (elem.requestFullscreen) {
            elem.requestFullscreen(fullscreenOptions).then(() => {
                console.log('✅ Entered fullscreen mode');
                forceFitToScreen();
            }).catch(err => {
                console.error('❌ Error entering fullscreen:', err);
            });
        } else if (elem.mozRequestFullScreen) { // Firefox
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { // Chrome, Safari, Opera
            // For iOS Safari
            if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.webkitEnterFullscreen) {
                elem.webkitEnterFullscreen();
            }
        } else if (elem.msRequestFullscreen) { // IE/Edge
            elem.msRequestFullscreen();
        }
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen().then(() => {
                console.log('✅ Exited fullscreen mode');
                forceFitToScreen();
            });
        } else if (document.mozCancelFullScreen) { // Firefox
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { // Chrome, Safari, Opera
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // IE/Edge
            document.msExitFullscreen();
        }
    }
}

// Listen for fullscreen changes to update the icon
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);

function handleFullscreenChange() {
    if (document.fullscreenElement || 
        document.mozFullScreenElement || 
        document.webkitFullscreenElement || 
        document.msFullscreenElement) {
        // In fullscreen mode
        document.body.classList.add('fullscreen');
        console.log('🔳 Fullscreen mode: ON');
    } else {
        // Not in fullscreen mode
        document.body.classList.remove('fullscreen');
        console.log('🔲 Fullscreen mode: OFF');
    }
    
    // Re-optimize layout after fullscreen change
    setTimeout(() => {
        forceFitToScreen();
    }, 100);
}

// Auto-enter fullscreen on first user interaction (optional)
let hasInteracted = false;
function tryAutoFullscreen() {
    if (!hasInteracted) {
        hasInteracted = true;
        const deviceInfo = getDeviceInfo();
        
        // Auto fullscreen for Interactive Panels and tablets
        if (deviceInfo.isInteractivePanel || deviceInfo.isTablet) {
            console.log('🎯 Auto-requesting fullscreen for optimal experience');
            // Small delay to ensure user gesture is registered
            setTimeout(() => {
                toggleFullscreen();
            }, 100);
        }
    }
}

// Add listeners for first interaction
document.addEventListener('click', tryAutoFullscreen, { once: true });
document.addEventListener('touchstart', tryAutoFullscreen, { once: true });
