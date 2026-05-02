document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatWindow = document.getElementById('chat-window');
    const autocompleteDropdown = document.getElementById('autocomplete-suggestions');
    const themeToggle = document.getElementById('theme-toggle');
    const languageSelect = document.getElementById('language-select');
    const loadQuizBtn = document.getElementById('load-quiz-btn');
    const quizContainer = document.getElementById('quiz-container');

    // Web Worker for text formatting (Markdown parsing simulation)
    const worker = new Worker('/static/js/worker.js');

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
        msgDiv.innerHTML = `<p>${text}</p>`; // Basic formatting
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

    function renderQuiz(quizData) {
        quizContainer.innerHTML = '';
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
                    // Disable all buttons in this question
                    const allBtns = optionsDiv.querySelectorAll('button');
                    allBtns.forEach(b => b.disabled = true);
                    
                    if (opt === item.answer) {
                        btn.classList.add('correct');
                    } else {
                        btn.classList.add('incorrect');
                        // Highlight correct
                        Array.from(allBtns).find(b => b.textContent === item.answer).classList.add('correct');
                    }
                };
                optionsDiv.appendChild(btn);
            });
            
            qDiv.appendChild(optionsDiv);
            quizContainer.appendChild(qDiv);
        });
    }
});
