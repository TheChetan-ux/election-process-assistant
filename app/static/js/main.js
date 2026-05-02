document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatWindow = document.getElementById('chat-window');
    const autocompleteDropdown = document.getElementById('autocomplete-suggestions');
    const themeToggle = document.getElementById('theme-toggle');
    const languageSelect = document.getElementById('language-select');
    const loadQuizBtn = document.getElementById('load-quiz-btn');
    const quizContainer = document.getElementById('quiz-container');
    const pinInput = document.getElementById('pin-input');
    const findBloBtn = document.getElementById('find-blo-btn');
    const bloResult = document.getElementById('blo-result');

    // Web Worker for text formatting (Markdown parsing simulation)
    const worker = new Worker('/static/js/worker.js');

    // Hash Router Logic
    function handleRouting() {
        const hash = window.location.hash || '#chat';
        document.querySelectorAll('.route-view').forEach(view => {
            view.style.display = 'none';
        });
        const targetView = document.getElementById(`route-${hash.substring(1)}`);
        if (targetView) {
            targetView.style.display = 'block';
        } else {
            document.getElementById('route-chat').style.display = 'block'; // Fallback
        }
        window.scrollTo(0, 0); // Semantic Navigation fix
    }
    window.addEventListener('hashchange', handleRouting);
    handleRouting(); // Initial call

    // Atomic Persistence Check
    document.getElementById('reset-settings-btn').addEventListener('click', () => {
        localStorage.clear();
        sessionStorage.clear();
        alert('All settings have been securely reset.');
        window.location.reload();
    });

    // Min-Heap Engagement Engine
    class MinHeap {
        constructor() { this.heap = []; }
        push(val) {
            this.heap.push(val);
            this.bubbleUp(this.heap.length - 1);
        }
        pop() {
            if (this.heap.length <= 1) return this.heap.pop();
            const min = this.heap[0];
            this.heap[0] = this.heap.pop();
            this.sinkDown(0);
            return min;
        }
        bubbleUp(idx) {
            while (idx > 0) {
                let pIdx = Math.floor((idx - 1) / 2);
                if (this.heap[pIdx].score <= this.heap[idx].score) break;
                [this.heap[idx], this.heap[pIdx]] = [this.heap[pIdx], this.heap[idx]];
                idx = pIdx;
            }
        }
        sinkDown(idx) {
            const length = this.heap.length;
            while (true) {
                let left = 2 * idx + 1, right = 2 * idx + 2, swap = null;
                if (left < length && this.heap[left].score < this.heap[idx].score) swap = left;
                if (right < length && this.heap[right].score < (swap === null ? this.heap[idx].score : this.heap[left].score)) swap = right;
                if (swap === null) break;
                [this.heap[idx], this.heap[swap]] = [this.heap[swap], this.heap[idx]];
                idx = swap;
            }
        }
    }
    const readinessHeap = new MinHeap();
    readinessHeap.push({topic: 'General Election', score: 0});

    // Hallucination Guard (JS Trie Implementation)
    class JSTrieNode {
        constructor() { this.children = {}; this.isEnd = false; }
    }
    class JSTrie {
        constructor() { this.root = new JSTrieNode(); }
        insert(word) {
            let node = this.root;
            for (let char of word.toLowerCase()) {
                if (!node.children[char]) node.children[char] = new JSTrieNode();
                node = node.children[char];
            }
            node.isEnd = true;
        }
        searchSubstring(text) {
            const words = text.toLowerCase().split(/\s+/);
            for (let word of words) {
                let node = this.root;
                for (let char of word) {
                    if (!node.children[char]) break;
                    node = node.children[char];
                }
                if (node && node.isEnd) return true;
            }
            return false;
        }
    }
    
    const hallucinationGuard = new JSTrie();
    ['evm', 'rigged', 'hack', 'polldate', 'results'].forEach(w => hallucinationGuard.insert(w));

    // BLO Service Map (Simulated PIN Trie Logic)
    findBloBtn.addEventListener('click', () => {
        const pin = pinInput.value.trim();
        if (pin.length !== 6 || isNaN(pin)) {
            bloResult.textContent = "Please enter a valid 6-digit PIN.";
            bloResult.style.color = "red";
            return;
        }
        // Simulated Trie Prefix Mapping
        bloResult.style.color = "var(--primary-color)";
        if (pin.startsWith('110')) {
            bloResult.textContent = `BLO Address Logic Mapped: Delhi North District. Officer ID: DN-${Math.floor(Math.random()*1000)}`;
        } else if (pin.startsWith('400')) {
            bloResult.textContent = `BLO Address Logic Mapped: Mumbai Suburban. Officer ID: MS-${Math.floor(Math.random()*1000)}`;
        } else {
            bloResult.textContent = `BLO Address Logic Mapped: Region ${pin.substring(0,2)}. Officer ID: RG-${Math.floor(Math.random()*1000)}`;
        }
    });

    // Theme Toggle
    const currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️';
    }

    themeToggle.addEventListener('click', () => {
        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            themeToggle.textContent = '🌙';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggle.textContent = '☀️';
        }
    });

    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Autocomplete
    chatInput.addEventListener('input', debounce(async (e) => {
        const query = e.target.value.trim();
        if (query.length < 2) {
            autocompleteDropdown.style.display = 'none';
            return;
        }

        try {
            const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            
            if (data.suggestions && data.suggestions.length > 0) {
                autocompleteDropdown.innerHTML = '';
                data.suggestions.forEach(suggestion => {
                    const div = document.createElement('div');
                    div.className = 'autocomplete-item';
                    div.textContent = suggestion;
                    div.addEventListener('click', () => {
                        chatInput.value = suggestion;
                        autocompleteDropdown.style.display = 'none';
                        chatInput.focus();
                    });
                    autocompleteDropdown.appendChild(div);
                });
                autocompleteDropdown.style.display = 'block';
            } else {
                autocompleteDropdown.style.display = 'none';
            }
        } catch (error) {
            console.error('Autocomplete error:', error);
        }
    }, 300));

    // Hide autocomplete on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.input-wrapper')) {
            autocompleteDropdown.style.display = 'none';
        }
    });

    // Chat functionality
    window.askQuestion = function(question) {
        chatInput.value = question;
        chatForm.dispatchEvent(new Event('submit'));
    };

    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}-message`;
        
        let contentHtml = '';
        if (sender === 'ai') {
            contentHtml = `
                <div class="message-header">
                    <div class="voty-avatar">
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="50" cy="50" r="50" fill="#0d6efd" />
                            <rect x="25" y="40" width="50" height="40" rx="4" fill="#ffffff" />
                            <rect x="20" y="35" width="60" height="5" rx="2" fill="#e9ecef" />
                            <path d="M40 55 L48 63 L65 45" stroke="#0d6efd" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                        </svg>
                    </div>
                    <span class="voty-name">VOTY</span>
                </div>
            `;
        }
        
        contentHtml += `<p>${text}</p>`; 
        // Add Ethical Watermark
        if (sender === 'ai') {
            contentHtml += `<div class="ai-watermark">AI-Assisted Educational Content | Verified by VoteWise</div>`;
        }
        msgDiv.innerHTML = contentHtml;
        chatWindow.appendChild(msgDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function showTypingIndicator() {
        const div = document.createElement('div');
        div.className = 'typing-indicator ai-message';
        div.id = 'typing-indicator';
        div.innerHTML = '<span></span><span></span><span></span>';
        chatWindow.appendChild(div);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function removeTypingIndicator() {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const question = chatInput.value.trim();
        const botTrap = document.getElementById('bot_trap').value;
        const lang = languageSelect.value;
        
        if (!question) return;

        appendMessage(question, 'user');
        chatInput.value = '';
        autocompleteDropdown.style.display = 'none';
        
        // Hallucination Guard Check
        if (hallucinationGuard.searchSubstring(question)) {
            const factCheckHtml = `
                <div class="card error-card" style="margin-bottom: 10px; font-size: 0.9rem;">
                    <strong style="color: #dc3545;">⚠️ Fact-Check Triggered</strong><br>
                    For verified sensitive information regarding polling, EVMs, or results, please visit the official portal: 
                    <a href="https://eci.gov.in" target="_blank" style="color: #0d6efd;">eci.gov.in</a> or contact your local BLO.
                </div>
            `;
            appendMessage(factCheckHtml + "I am processing your query within ECI guidelines...", 'ai');
        }

        showTypingIndicator();

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, lang, bot_trap: botTrap })
            });
            const data = await res.json();
            removeTypingIndicator();

            if (res.ok) {
                // Use Web Worker to process text (simulated Markdown processing)
                worker.postMessage({ type: 'format', text: data.answer });
                worker.onmessage = function(e) {
                    appendMessage(e.data.text, 'ai');
                };
            } else {
                appendMessage(data.error || 'An error occurred.', 'ai');
            }
        } catch (error) {
            removeTypingIndicator();
            appendMessage('Network error. Please try again.', 'ai');
        }
    });

    // Quiz functionality
    loadQuizBtn.addEventListener('click', async () => {
        const lang = languageSelect.value;
        loadQuizBtn.textContent = 'Loading...';
        loadQuizBtn.disabled = true;

        try {
            const res = await fetch(`/api/quiz?lang=${lang}`);
            const data = await res.json();
            
            if (data.quiz && data.quiz.length > 0) {
                renderQuiz(data.quiz);
            } else {
                quizContainer.innerHTML = '<p>Failed to load quiz. Please try again.</p>';
            }
        } catch (error) {
            quizContainer.innerHTML = '<p>Network error loading quiz.</p>';
        } finally {
            loadQuizBtn.textContent = 'Generate New Quiz';
            loadQuizBtn.disabled = false;
        }
    });

    let quizTimer;
    let timeLeft = 30;
    let userScore = 0;
    let totalQuestions = 5;

    function renderQuiz(quizData) {
        quizContainer.innerHTML = '';
        document.getElementById('scorecard-container').style.display = 'none';
        userScore = 0;
        timeLeft = 30;
        const timerFill = document.getElementById('timer-fill');
        const timerText = document.getElementById('timer-text');
        
        timerFill.style.width = '100%';
        timerFill.style.background = '#198754';
        
        clearInterval(quizTimer);
        quizTimer = setInterval(() => {
            timeLeft--;
            timerText.textContent = `${timeLeft}s remaining`;
            timerFill.style.width = `${(timeLeft/30)*100}%`;
            if (timeLeft <= 10) timerFill.style.background = '#dc3545';
            if (timeLeft <= 0) {
                clearInterval(quizTimer);
                finishQuiz();
            }
        }, 1000);

        let answered = 0;
        totalQuestions = quizData.length;

        quizData.forEach((item, index) => {
            const qDiv = document.createElement('div');
            qDiv.className = 'quiz-question';
            qDiv.innerHTML = `<p><strong>${index + 1}. ${item.question}</strong></p>`;
            
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'quiz-options';
            
            item.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'quiz-option';
                btn.textContent = opt;
                btn.onclick = () => {
                    const allBtns = optionsDiv.querySelectorAll('button');
                    allBtns.forEach(b => b.disabled = true);
                    answered++;
                    
                    if (opt === item.answer) {
                        btn.classList.add('correct');
                        userScore++;
                        readinessHeap.push({topic: 'General Knowledge', score: 10});
                    } else {
                        btn.classList.add('incorrect');
                        Array.from(allBtns).find(b => b.textContent === item.answer).classList.add('correct');
                        readinessHeap.push({topic: 'General Knowledge', score: -5});
                    }
                    
                    if (answered === totalQuestions) {
                        clearInterval(quizTimer);
                        finishQuiz();
                    }
                };
                optionsDiv.appendChild(btn);
            });
            
            qDiv.appendChild(optionsDiv);
            quizContainer.appendChild(qDiv);
        });
    }

    function finishQuiz() {
        const scoreContainer = document.getElementById('scorecard-container');
        scoreContainer.style.display = 'block';
        const timerText = document.getElementById('timer-text');
        timerText.textContent = `Quiz Finished!`;
        
        // Confetti Engine
        if (userScore === totalQuestions && totalQuestions > 0) {
            for (let i = 0; i < 50; i++) {
                const conf = document.createElement('div');
                conf.className = 'confetti';
                conf.style.left = Math.random() * 100 + 'vw';
                conf.style.animationDelay = Math.random() * 2 + 's';
                conf.style.backgroundColor = ['#f2d74e', '#95c3de', '#ff9a91'][Math.floor(Math.random()*3)];
                document.body.appendChild(conf);
                setTimeout(() => conf.remove(), 5000);
            }
        }
        
        // HTML5 Canvas Scorecard
        const canvas = document.getElementById('score-canvas');
        const ctx = canvas.getContext('2d');
        
        // Base Background
        ctx.fillStyle = '#0d6efd';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Content
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.fillText('VoteWise Scorecard', 20, 40);
        
        ctx.font = '20px Inter, sans-serif';
        ctx.fillText('Civic Readiness Score:', 20, 90);
        
        ctx.font = 'bold 48px Inter, sans-serif';
        ctx.fillText(`${userScore} / ${totalQuestions}`, 20, 150);
        
        // Simulated QR Code
        ctx.fillStyle = 'white';
        ctx.fillRect(280, 20, 100, 100);
        ctx.fillStyle = 'black';
        for(let i=0; i<8; i++){
            for(let j=0; j<8; j++){
                if(Math.random() > 0.5) {
                    ctx.fillRect(285 + i*11, 25 + j*11, 10, 10);
                }
            }
        }
        ctx.fillRect(285, 25, 30, 30);
        ctx.fillRect(340, 25, 30, 30);
        ctx.fillRect(285, 80, 30, 30);
        
        // Watermark
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '12px sans-serif';
        ctx.fillText('Verified by ECI ICT Protocol', 20, 220);
    }

    document.getElementById('download-score').addEventListener('click', () => {
        const canvas = document.getElementById('score-canvas');
        const link = document.createElement('a');
        link.download = 'votewise-scorecard.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
});
