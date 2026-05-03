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
        const hash = window.location.hash || '#home';
        document.querySelectorAll('.route-view').forEach(view => {
            view.style.display = 'none';
        });
        const targetView = document.getElementById(`route-${hash.substring(1)}`);
        if (targetView) {
            targetView.style.display = 'block';
        } else {
            document.getElementById('route-home').style.display = 'block'; // Fallback
        }
        window.scrollTo(0, 0);
    }
    window.addEventListener('hashchange', handleRouting);
    handleRouting(); // Initial call

    // Global helpers for chips and external actions
    window.askQuestion = (text) => {
        console.log('VOTY: askQuestion called with:', text);
        if (!chatInput || !chatForm) {
            console.error('VOTY Error: chatInput or chatForm not found!');
            return;
        }
        chatInput.value = text;
        chatForm.dispatchEvent(new Event('submit'));
    };

    window.navigateAndAsk = (route, text) => {
        console.log('VOTY: navigating to', route, 'then asking:', text);
        window.location.hash = route;
        setTimeout(() => window.askQuestion(text), 100);
    };

    // Atomic Persistence Check
    const resetBtn = document.getElementById('reset-settings-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            localStorage.clear();
            sessionStorage.clear();
            alert('All settings have been securely reset.');
            window.location.reload();
        });
    }

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

    // ── Dynamic i18n Engine ──────────────────────────────────────────────────
    // Collects all [data-i18n] original English strings on first run,
    // then batch-translates via Gemini API and caches per language in localStorage.

    const originalUIStrings = {};   // key → original English text
    const uiTranslationCache = {};  // lang → { key: translatedText }

    // Populate cache from localStorage (instant on repeat visits)
    try {
        const stored = JSON.parse(localStorage.getItem('vw_ui_translations') || '{}');
        Object.assign(uiTranslationCache, stored);
    } catch(e) {}

    // Collect originals ONCE on load
    function collectOriginals() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (!originalUIStrings[key]) {
                originalUIStrings[key] = el.innerText.trim() || el.textContent.trim();
            }
        });
    }

    // Apply a translation map { key: translatedText } to the DOM
    function applyTranslationMap(map, lang) {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (map[key]) el.textContent = map[key];
        });
        // Update chat input placeholder
        const placeholderMap = {
            hi: 'अपना प्रश्न पूछें...',  bn: 'আপনার প্রশ্ন জিজ্ঞাসা করুন...',
            ta: 'உங்கள் கேள்வியை கேளுங்கள்...', te: 'మీ ప్రశ్న అడగండి...',
            mr: 'तुमचा प्रश्न विचारा...', gu: 'તમારો પ્રશ્ન પૂછો...',
            kn: 'ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಕೇಳಿ...', pa: 'ਆਪਣਾ ਸਵਾਲ ਪੁੱਛੋ...',
            ml: 'നിങ്ങളുടെ ചോദ്യം ചോദിക്കൂ...', ur: 'اپنا سوال پوچھیں...'
        };
        if (chatInput) chatInput.placeholder = placeholderMap[lang] || 'Ask a question...';
    }

    // Main translation function — called on every language change
    async function applyTranslations(lang) {
        collectOriginals();

        // English: restore originals
        if (lang === 'en') {
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (originalUIStrings[key]) el.textContent = originalUIStrings[key];
            });
            if (chatInput) chatInput.placeholder = 'Ask a question...';
            return;
        }

        // Cached: apply instantly
        if (uiTranslationCache[lang]) {
            applyTranslationMap(uiTranslationCache[lang], lang);
            return;
        }

        // Batch-translate all strings via Gemini API
        const keys = Object.keys(originalUIStrings);
        const texts = keys.map(k => originalUIStrings[k]);
        if (texts.length === 0) return;

        try {
            showToast('🌐 Translating interface...');
            const res = await fetch('/api/translate-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texts, lang })
            });
            const data = await res.json();
            if (data.translations && data.translations.length === texts.length) {
                const map = {};
                keys.forEach((k, i) => { map[k] = data.translations[i]; });
                uiTranslationCache[lang] = map;
                // Persist to localStorage
                try { localStorage.setItem('vw_ui_translations', JSON.stringify(uiTranslationCache)); } catch(e) {}
                applyTranslationMap(map, lang);
                showToast('✅ Interface translated!');
            }
        } catch(e) {
            console.error('UI translation failed:', e);
            showToast('⚠️ Translation failed, retrying...');
        }
    }

    const flashcardsData = {
        current: [
            { category: "Current Leaders", q: "Narendra Modi (Current PM)\n\nServing since May 2014. BJP. 17th and 18th Lok Sabha PM. Known for Digital India, Make in India, GST, and Chandrayaan-3.", a: "Tap Next to see more leaders", d: "", score: 88 },
            { category: "Current Leaders", q: "Who is the current President of India?", a: "Droupadi Murmu", d: "15th President. First person from a tribal community and second woman to hold the office.", score: 82 },
            { category: "Current Leaders", q: "Who is the Chief Election Commissioner?", a: "Rajiv Kumar", d: "25th CEC of India. Responsible for ensuring free and fair elections across the country.", score: 78 },
            { category: "Current Leaders", q: "Who is the current Vice President?", a: "Jagdeep Dhankhar", d: "14th Vice President of India. Former Governor of West Bengal. Rajya Sabha Chairperson.", score: 75 },
            { category: "Current Leaders", q: "Who is India's Chief Justice (CJI)?", a: "Sanjiv Khanna", d: "51st Chief Justice of India. Appointed in 2024. Known for landmark verdicts on electoral bonds and Article 370.", score: 80 }
        ],
        pm: [
            { category:"Prime Ministers", q:"Jawaharlal Nehru", a:"1st PM · 1947–1964 · INC", d:"17 years in office. Founded IITs, AIIMS, IIMs, ISRO. Led Non-Aligned Movement. Panchsheel, Five-Year Plans, mixed-economy model.", score:92 },
            { category:"Prime Ministers", q:"Gulzarilal Nanda (Acting)", a:"Acting PM · 1964 & 1966 · INC", d:"Served twice as acting PM after deaths of Nehru and Shastri. Senior Congress leader and labour rights champion.", score:62 },
            { category:"Prime Ministers", q:"Lal Bahadur Shastri", a:"2nd PM · 1964–1966 · INC", d:"Led India to victory in 1965 Indo-Pak War. Coined 'Jai Jawan Jai Kisan'. Launched Green Revolution & White Revolution. Died in Tashkent 1966.", score:85 },
            { category:"Prime Ministers", q:"Indira Gandhi", a:"3rd & 6th PM · 1966–77, 1980–84 · INC", d:"Only female PM. 1971 war—creation of Bangladesh. Pokhran-I nuclear test 1974. Nationalized 14 banks. Emergency 1975-77. Assassinated 1984.", score:89 },
            { category:"Prime Ministers", q:"Morarji Desai", a:"4th PM · 1977–1979 · Janata Party", d:"First non-Congress PM. Led Janata Party after Emergency. Rolled back 42nd Amendment excesses. Awarded Pakistan's Nishan-e-Pakistan.", score:68 },
            { category:"Prime Ministers", q:"Charan Singh", a:"5th PM · 1979–1980 · Janata Party (S)", d:"Farmer leader from UP. Shortest serving PM—never faced Parliament. Resigned before confidence vote. Champion of agrarian reforms.", score:58 },
            { category:"Prime Ministers", q:"Rajiv Gandhi", a:"7th PM · 1984–1989 · INC", d:"Youngest PM at 40. Launched India's IT revolution, computerized Railways, lowered voting age 21→18. Indo-Sri Lanka Accord. Assassinated 1991.", score:82 },
            { category:"Prime Ministers", q:"V. P. Singh", a:"8th PM · 1989–1990 · Janata Dal", d:"Implemented Mandal Commission—27% OBC reservations. Led National Front minority govt. Resigned after confidence vote lost.", score:70 },
            { category:"Prime Ministers", q:"Chandra Shekhar", a:"9th PM · 1990–1991 · SJP", d:"Led Samajwadi Janata Party. Minority govt supported by Congress. Managed 1991 BOP crisis by pledging gold. Served only 7 months.", score:56 },
            { category:"Prime Ministers", q:"P. V. Narasimha Rao", a:"10th PM · 1991–1996 · INC", d:"Father of Indian economic reforms. Launched LPG reforms with FM Manmohan Singh. Look East Policy. Managed Babri Masjid aftermath.", score:86 },
            { category:"Prime Ministers", q:"H. D. Deve Gowda", a:"11th PM · 1996–1997 · Janata Dal", d:"JD leader from Karnataka. Led United Front coalition. Focused on rural development. Resigned after Congress withdrew support.", score:55 },
            { category:"Prime Ministers", q:"I. K. Gujral", a:"12th PM · 1997–1998 · Janata Dal", d:"Gujral Doctrine—India gives without reciprocity to neighbours. Former foreign minister. Led minority govt, resigned after Jain Commission report.", score:62 },
            { category:"Prime Ministers", q:"Atal Bihari Vajpayee", a:"13th PM · 1998–2004 · BJP", d:"First non-Congress PM to complete full term. Pokhran-II 1998. Won Kargil War. Golden Quadrilateral highways. PMGSY rural roads. Sarva Shiksha Abhiyan.", score:91 },
            { category:"Prime Ministers", q:"Manmohan Singh", a:"14th PM · 2004–2014 · INC", d:"First Sikh PM. Oxford-Cambridge economist. NREGA, RTI Act, Aadhaar, US-India Nuclear Deal, Bharat Nirman. Architect of 1991 LPG reforms.", score:87 },
            { category:"Prime Ministers", q:"Narendra Modi", a:"15th PM · 2014–Present · BJP", d:"Former Gujarat CM 2001-14. First PM born after Independence. Jan Dhan, Make in India, GST, Chandrayaan-3, Article 370 revocation, ₹78L cr infra spend. Historic third term 2024.", score:88 }
        ],
        cm: [
            { category:"Chief Ministers", q:"Yogi Adityanath", a:"Uttar Pradesh (2017–Present)", d:"UP now India's 2nd largest GDP state. Expressway network, UP Defence Corridor, Noida Film City. Anti-mafia crackdown, Women Safety Mission.", score:84 },
            { category:"Chief Ministers", q:"Mamata Banerjee", a:"West Bengal (2011–Present)", d:"Ended 34-yr Left rule. Kanyashree Prakalpa (UNESCO award), Lakshmir Bhandar, Duare Sarkar service delivery.", score:78 },
            { category:"Chief Ministers", q:"M. K. Stalin", a:"Tamil Nadu (2021–Present)", d:"Dravidian Model governance. Free breakfast scheme, Naan Mudhalvan skill training, record Global Investors Meet commitments.", score:79 },
            { category:"Chief Ministers", q:"Nitish Kumar", a:"Bihar (Multiple terms)", d:"JD(U) leader. Jal Jeevan Hariyali, improved law & order, massive road construction, 50% women reservation in panchayats.", score:74 },
            { category:"Chief Ministers", q:"Bhupendra Patel", a:"Gujarat (2021–Present)", d:"Continued Gujarat development model. Semiconductor hub investments, GIFT City expansion, Semicon India. Led BJP to historic 156/182 seats in 2022.", score:80 },
            { category:"Chief Ministers", q:"N. Chandrababu Naidu", a:"Andhra Pradesh (2024–Present)", d:"IT CM. Created Hyderabad's tech hub in 1990s. Returned to power 2024. Pushing Amaravati capital, digital governance, PERT/CPM administration.", score:82 },
            { category:"Chief Ministers", q:"Pinarayi Vijayan", a:"Kerala (2016–Present)", d:"K-Rail, Life Mission housing, Kerala Fibre Optic Network. Led pandemic response with 'Kerala Model'. CPI-M strongman.", score:77 },
            { category:"Chief Ministers", q:"Siddaramaiah", a:"Karnataka (2023–Present)", d:"Congress veteran. Guarantees: Gruha Jyoti free power, Gruha Lakshmi ₹2000/month, Anna Bhagya food, Shakti free bus travel for women.", score:76 }
        ],
        statecm: [
            { category:"State CMs 2024", q:"Narendra Modi (Centre)", a:"PM of India", d:"Heads Central Govt. All state CMs coordinate with PM on national schemes.", score:88 },
            { category:"State CMs 2024", q:"Yogi Adityanath", a:"Uttar Pradesh · BJP", d:"Re-elected 2022. Former Gorakhpur MP. Anti-crime, infrastructure, religious tourism (Ram Mandir).", score:84 },
            { category:"State CMs 2024", q:"Devendra Fadnavis", a:"Maharashtra · BJP", d:"Third time CM. Deputy CM earlier. Mumbai-Nagpur Samruddhi Expressway, metro expansion.", score:79 },
            { category:"State CMs 2024", q:"Mamata Banerjee", a:"West Bengal · TMC", d:"Third consecutive term. Kanyashree, Lakshmir Bhandar, strong anti-BJP stance.", score:78 },
            { category:"State CMs 2024", q:"M. K. Stalin", a:"Tamil Nadu · DMK", d:"Son of Karunanidhi. Dravidian model, free breakfast scheme, record investments.", score:79 },
            { category:"State CMs 2024", q:"Siddaramaiah", a:"Karnataka · INC", d:"Congress comeback 2023. Five guarantee schemes—free power, cash for women, free bus travel.", score:76 },
            { category:"State CMs 2024", q:"Bhupendra Patel", a:"Gujarat · BJP", d:"Re-elected 2022 with record 156/182 seats. GIFT City, Semicon India, green energy.", score:80 },
            { category:"State CMs 2024", q:"Nitish Kumar", a:"Bihar · JD(U)", d:"Multi-term CM. Allied with BJP. Infrastructure push, women empowerment schemes.", score:74 },
            { category:"State CMs 2024", q:"Mohan Yadav", a:"Madhya Pradesh · BJP", d:"CM since Dec 2023. Professor-turned-politician. Continuing Ladli Laxmi, development agenda.", score:72 },
            { category:"State CMs 2024", q:"N. Chandrababu Naidu", a:"Andhra Pradesh · TDP", d:"Returned to power 2024. Focused on Amaravati capital, IT investment, digital governance.", score:82 },
            { category:"State CMs 2024", q:"A. Revanth Reddy", a:"Telangana · INC", d:"Congress ended BRS rule 2023. Rythu Bharosa scheme, Hyderabad metro expansion.", score:74 },
            { category:"State CMs 2024", q:"Pinarayi Vijayan", a:"Kerala · CPI-M)", d:"Two consecutive terms. Kerala Fibre Network, Life Mission housing, strong public health system.", score:77 },
            { category:"State CMs 2024", q:"Mohan Majhi", a:"Odisha · BJP", d:"CM since June 2024. BJP ended 24-year BJD rule. Focus on tribal welfare and coastal development.", score:70 },
            { category:"State CMs 2024", q:"Himanta Biswa Sarma", a:"Assam · BJP", d:"Re-elected 2021. Anti-infiltration, Asom Mala roads, crackdown on child marriages.", score:78 },
            { category:"State CMs 2024", q:"Hemant Soren", a:"Jharkhand · JMM", d:"Re-elected 2024. Tribal rights champion. Maiya Samman scheme for women.", score:72 },
            { category:"State CMs 2024", q:"Vishnu Deo Sai", a:"Chhattisgarh · BJP", d:"CM since Dec 2023. Tribal leader. Focus on Naxal-free CG, rice to poor.", score:71 },
            { category:"State CMs 2024", q:"Nayab Singh Saini", a:"Haryana · BJP", d:"CM since Mar 2024. Re-elected Oct 2024. OBC leader, continuing Antyodaya welfare.", score:72 },
            { category:"State CMs 2024", q:"Sukhvinder Sukhu", a:"Himachal Pradesh · INC", d:"Congress CM since 2022. Himachal's debt crisis management, Old Pension Scheme restored.", score:68 },
            { category:"State CMs 2024", q:"Pushkar Singh Dhami", a:"Uttarakhand · BJP", d:"Re-elected 2022. UCC implementation, Char Dham pilgrimage development.", score:74 },
            { category:"State CMs 2024", q:"Pramod Sawant", a:"Goa · BJP", d:"Re-elected 2022. Tourism revival post-COVID, Mopa Airport, IT sector push.", score:70 },
            { category:"State CMs 2024", q:"Bhagwant Mann", a:"Punjab · AAP", d:"AAP swept Punjab 2022. Free electricity 300 units, Mohalla Clinics, Aam Aadmi Clinics.", score:76 },
            { category:"State CMs 2024", q:"Rekha Gupta", a:"Delhi · BJP", d:"CM since Feb 2025. BJP ended 10-year AAP rule. Purvanchal-friendly agenda.", score:68 },
            { category:"State CMs 2024", q:"Omar Abdullah", a:"J&K (UT) · NC", d:"CM since Oct 2024. First elected govt post Art. 370 removal. Focus on statehood restoration.", score:71 },
            { category:"State CMs 2024", q:"Pema Khandu", a:"Arunachal Pradesh · BJP", d:"Third term. Northeast development, border infra with China, connectivity projects.", score:72 },
            { category:"State CMs 2024", q:"N. Biren Singh", a:"Manipur · BJP", d:"Re-elected 2022. Managing ethnic conflict between Meitei and Kuki communities.", score:65 },
            { category:"State CMs 2024", q:"Conrad Sangma", a:"Meghalaya · NPP", d:"Re-elected 2023. Coalition govt. Tourism & coal mining policy, border talks with Assam.", score:73 },
            { category:"State CMs 2024", q:"Lalduhoma", a:"Mizoram · ZPM", d:"CM since 2023. Anti-corruption platform. Ended MNF's dominance. Myanmar refugee policy.", score:70 },
            { category:"State CMs 2024", q:"Neiphiu Rio", a:"Nagaland · NDPP", d:"Fourth term. Naga Peace Accord talks, Eastern Nagaland autonomy demand.", score:69 },
            { category:"State CMs 2024", q:"Prem Singh Tamang", a:"Sikkim · SKM", d:"Re-elected 2024 unopposed. Organic farming, tourism, sustainable development.", score:74 },
            { category:"State CMs 2024", q:"Manik Saha", a:"Tripura · BJP", d:"Re-elected 2023. Connectivity with Bangladesh, bamboo industry, IT investment.", score:71 }
        ],
        ministers: [
            { category:"Key Union Ministers", q:"Nirmala Sitharaman", a:"Finance Minister", d:"First full-time woman FM. 7 consecutive budgets. PLI schemes, IBC reforms, capital expenditure doubled to ₹10L crore.", score:85 },
            { category:"Key Union Ministers", q:"Amit Shah", a:"Home Minister", d:"BJP President who engineered 2014 & 2019 wins. Art. 370 revocation, CAA, NIA expansion, smart border fencing.", score:83 },
            { category:"Key Union Ministers", q:"Rajnath Singh", a:"Defence Minister", d:"Former UP CM & BJP President. Defence production ₹1.75L cr target, banned 101+ import items, INS Vikrant commissioning.", score:80 },
            { category:"Key Union Ministers", q:"S. Jaishankar", a:"External Affairs Minister", d:"Career diplomat. India's G20 Presidency 2023, Neighbourhood First Policy, Voice of Global South, evacuated 90,000+ Indians from conflict zones.", score:91 },
            { category:"Key Union Ministers", q:"Nitin Gadkari", a:"Road Transport Minister", d:"NH construction tripled (37 km/day). Bharatmala Pariyojana, EV push, Setu Bharatam bridge programme.", score:90 }
        ]
    };

    let translatedFlashcardsData = JSON.parse(JSON.stringify(flashcardsData));
    let currentDeck = 'current';
    let currentCardIdx = 0;

    // ── Bar Chart Renderer (pure Canvas, no external library) ──
    function renderBarChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width = canvas.offsetWidth || canvas.parentElement?.clientWidth || 680;
        const H = canvas.height = 320;
        ctx.clearRect(0, 0, W, H);

        const names = data.map(c => c.q.split(' ').slice(0,2).join(' '));
        const scores = data.map(c => c.score || 75);
        const maxScore = 100;
        const barW = Math.min(60, (W - 80) / names.length - 12);
        const chartH = H - 80;
        const gap = (W - 60 - barW * names.length) / (names.length + 1);

        // Background
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--surface-solid') || '#ffffff';
        ctx.fillRect(0, 0, W, H);

        // Gradient palette
        const palette = ['#4F46E5','#EC4899','#10B981','#F59E0B','#6366F1','#EF4444','#14B8A6','#8B5CF6','#F97316'];

        names.forEach((name, i) => {
            const x = 40 + gap + i * (barW + gap);
            const barH = (scores[i] / maxScore) * chartH;
            const y = H - 60 - barH;

            // Bar gradient
            const grad = ctx.createLinearGradient(x, y, x, y + barH);
            grad.addColorStop(0, palette[i % palette.length]);
            grad.addColorStop(1, palette[i % palette.length] + '88');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(x, y, barW, barH, 6) : ctx.rect(x, y, barW, barH);
            ctx.fill();

            // Score label on bar
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${barW > 45 ? 13 : 11}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(scores[i], x + barW / 2, y + 18);

            // Name label below
            const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#0f172a';
            ctx.fillStyle = textColor;
            ctx.font = `${barW > 45 ? 11 : 9}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            // Wrap long names
            const words = name.split(' ');
            ctx.fillText(words[0], x + barW / 2, H - 38);
            if (words[1]) ctx.fillText(words[1], x + barW / 2, H - 24);
        });

        // Y-axis label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.save();
        ctx.translate(14, H / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Impact Score / 100', 0, 0);
        ctx.restore();

        // Title
        const titleColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#0f172a';
        ctx.fillStyle = titleColor;
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        const titles = { pm: '🏆 PM Impact Comparison', cm: '🏆 CM Impact Comparison', statecm: '🏆 State CM Governance Scores' };
        const titleKey = canvasId.replace('-chart-canvas', '');
        ctx.fillText(titles[titleKey] || '🏆 Impact Score Comparison', W / 2, 22);
    }
    
    function renderFlashcard() {
        const deck = translatedFlashcardsData[currentDeck];
        const card = deck[currentCardIdx];
        const mainCard = document.getElementById('main-flashcard');
        const catEl = document.getElementById('card-category');
        if (catEl) {
            catEl.textContent = card.category;
            document.getElementById('card-question').textContent = card.q;
            document.getElementById('card-answer').textContent = card.a;
            document.getElementById('card-detail').textContent = card.d;
            document.getElementById('card-current').textContent = currentCardIdx + 1;
            document.getElementById('card-total').textContent = deck.length;
            document.getElementById('fc-progress-bar').style.width = `${((currentCardIdx + 1) / deck.length) * 100}%`;
            
            const readBtn = document.getElementById('read-flashcard-btn');
            if (readBtn) {
                readBtn.onclick = (e) => {
                    e.stopPropagation();
                    window.speechSynthesis.cancel();
                    const textToSpeak = `${card.category}. ${card.q}. ${card.a}. ${card.d}`;
                    const utterance = new SpeechSynthesisUtterance(textToSpeak);
                    
                    const langVal = languageSelect.value;
                    if (langVal === 'en') utterance.lang = 'en-IN';
                    else if (langVal === 'hi') utterance.lang = 'hi-IN';
                    else if (langVal === 'bn') utterance.lang = 'bn-IN';
                    else if (langVal === 'ta') utterance.lang = 'ta-IN';
                    else utterance.lang = 'hi-IN';
                    window.speechSynthesis.speak(utterance);
                };
            }
            if (mainCard) mainCard.classList.remove('is-flipped');

            // Tab specific UI toggles
            const flashcardViewer = document.querySelector('.flashcard-viewer');
            const miniCardsGrid = document.querySelector('.mini-cards-grid');
            const sectionTitle = document.querySelector('.section-title');

            const pmCS = document.getElementById('pm-chart-section');
            const cmCS = document.getElementById('cm-chart-section');
            const statecmCS = document.getElementById('statecm-chart-section');
            if (pmCS) pmCS.style.display = currentDeck === 'pm' ? 'block' : 'none';
            if (cmCS) cmCS.style.display = currentDeck === 'cm' ? 'block' : 'none';
            if (statecmCS) statecmCS.style.display = currentDeck === 'statecm' ? 'block' : 'none';

            if (currentDeck === 'pm') {
                if (flashcardViewer) flashcardViewer.style.display = 'none';
                if (miniCardsGrid) miniCardsGrid.style.display = 'none';
                if (sectionTitle) sectionTitle.style.display = 'none';
                
                requestAnimationFrame(() => requestAnimationFrame(() =>
                    renderBarChart('pm-chart-canvas', translatedFlashcardsData.pm)));
                
                const fullList = document.getElementById('full-list-container');
                if (fullList) {
                    fullList.style.display = 'grid';
                    fullList.innerHTML = '';
                    translatedFlashcardsData.pm.forEach(pm => {
                        const cardHTML = `
                            <div class="knowledge-card" style="text-align:left;">
                                <div class="card-icon" style="font-size:2rem; padding: 0.5rem; margin-bottom: 1rem;">🇮🇳</div>
                                <h3 style="margin-bottom:0.5rem; font-size:1.4rem;">${pm.q}</h3>
                                <div class="card-tag" style="background:var(--secondary-color); margin-bottom:1rem; display:inline-block;">${pm.a.split('·')[0] ? pm.a.split('·')[0].trim() : ''}</div>
                                <p style="font-size: 0.95rem; margin-bottom: 0.5rem; color:var(--text-color);"><strong>Term & Party:</strong> ${pm.a.split('·').slice(1).join('·').trim()}</p>
                                <p style="font-size: 0.95rem; opacity: 0.9; line-height:1.5;">${pm.d}</p>
                            </div>
                        `;
                        fullList.insertAdjacentHTML('beforeend', cardHTML);
                    });
                }
            } else {
                if (flashcardViewer) flashcardViewer.style.display = 'block';
                if (miniCardsGrid) miniCardsGrid.style.display = 'flex';
                if (sectionTitle) sectionTitle.style.display = 'block';
                
                const fullList = document.getElementById('full-list-container');
                if (fullList) fullList.style.display = 'none';
                
                if (currentDeck === 'cm') {
                    requestAnimationFrame(() => requestAnimationFrame(() =>
                        renderBarChart('cm-chart-canvas', translatedFlashcardsData.cm)));
                } else if (currentDeck === 'statecm') {
                    const top10 = [...translatedFlashcardsData.statecm]
                        .sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10);
                    requestAnimationFrame(() => requestAnimationFrame(() =>
                        renderBarChart('statecm-chart-canvas', top10)));
                }
            }
        }
    }

    function renderMiniCards() {
        const grid = document.getElementById('mini-cards-grid');
        if (!grid) return;
        grid.innerHTML = '';
        const deck = translatedFlashcardsData[currentDeck];
        deck.forEach((_, idx) => {
            const mCard = document.createElement('div');
            mCard.className = 'mini-card' + (idx === currentCardIdx ? ' active' : '');
            mCard.textContent = idx + 1;
            mCard.onclick = () => {
                currentCardIdx = idx;
                renderFlashcard();
                renderMiniCards();
            };
            grid.appendChild(mCard);
        });
    }

    async function translateFlashcards(lang) {
        if (lang === 'en') {
            translatedFlashcardsData = JSON.parse(JSON.stringify(flashcardsData));
            renderFlashcard();
            renderMiniCards();
            return;
        }
        
        const textsToTranslate = [];
        const mapping = [];
        
        for (let deck in flashcardsData) {
            flashcardsData[deck].forEach((card, idx) => {
                textsToTranslate.push(card.category, card.q, card.a, card.d);
                mapping.push({deck, idx});
            });
        }
        
        try {
            showToast('Translating content...');
            const res = await fetch('/api/translate-batch', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({texts: textsToTranslate, lang: lang})
            });
            const data = await res.json();
            if (data.translations && data.translations.length === textsToTranslate.length) {
                let tIdx = 0;
                mapping.forEach(m => {
                    translatedFlashcardsData[m.deck][m.idx].category = data.translations[tIdx++];
                    translatedFlashcardsData[m.deck][m.idx].q = data.translations[tIdx++];
                    translatedFlashcardsData[m.deck][m.idx].a = data.translations[tIdx++];
                    translatedFlashcardsData[m.deck][m.idx].d = data.translations[tIdx++];
                });
                renderFlashcard();
                renderMiniCards();
            }
        } catch(e) {
            console.error('Translation failed', e);
        }
    }

    document.querySelectorAll('.card-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.card-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentDeck = tab.getAttribute('data-deck');
            currentCardIdx = 0;
            renderFlashcard();
            renderMiniCards();
        });
    });

    // Flashcard flip — listen on the outer wrap so clicks on the full card area register
    const flashcardWrap = document.getElementById('main-flashcard');
    if (flashcardWrap) {
        flashcardWrap.addEventListener('click', (e) => {
            // Don't flip if user clicked the Listen button
            if (e.target.closest('#read-flashcard-btn')) return;
            flashcardWrap.classList.toggle('is-flipped');
        });
    }
    const prevBtn = document.getElementById('prev-card');
    const nextBtn = document.getElementById('next-card');
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentCardIdx > 0) { currentCardIdx--; renderFlashcard(); renderMiniCards(); }
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentCardIdx < translatedFlashcardsData[currentDeck].length - 1) { currentCardIdx++; renderFlashcard(); renderMiniCards(); }
        });
    }
    
    // Silence Period Sentinel Logic
    function checkSilencePeriod() {
        const now = new Date();
        const pollDates = [
            new Date('2026-04-14T00:00:00'),
            new Date('2026-04-23T00:00:00'),
            new Date('2026-04-29T00:00:00')
        ];
        let isSilencePeriod = false;
        for (let date of pollDates) {
            const diffHours = (date - now) / (1000 * 60 * 60);
            if (diffHours >= 0 && diffHours <= 48) {
                isSilencePeriod = true;
                break;
            }
        }
        return isSilencePeriod;
    }
    const isSilencePeriodActive = checkSilencePeriod();


    // BLO Service Map (Simulated PIN Trie Logic)
    if (findBloBtn) {
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
    }

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
            showToast('☀️ Light Mode Activated');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggle.textContent = '☀️';
            showToast('🌙 Dark Mode Activated');
        }
    });

    // Toast notification utility
    function showToast(message) {
        let toast = document.getElementById('voty-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'voty-toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    // Real-time Language Change Handler
    languageSelect.addEventListener('change', async () => {
        const lang = languageSelect.value;
        const selectedText = languageSelect.options[languageSelect.selectedIndex].text;
        await applyTranslations(lang);
        translateFlashcards(lang);
        appendMessage(`Language switched to ${selectedText}. I will now respond in ${selectedText}!`, 'ai');
        localStorage.setItem('lang', lang);
    });

    // Apply saved language on load — collect originals first, then translate
    collectOriginals();
    const savedLang = localStorage.getItem('lang') || 'en';
    if (savedLang !== 'en') {
        languageSelect.value = savedLang;
        applyTranslations(savedLang);
        translateFlashcards(savedLang);
    } else {
        renderFlashcard();
        renderMiniCards();
    }


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
        const botTrapEl = document.getElementById('bot_trap');
        const botTrap = botTrapEl ? botTrapEl.value : '';
        const lang = languageSelect.value;
        
        console.log('VOTY: Form submit triggered. Question:', question);
        
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
            console.log('VOTY: Fetching /api/chat...');
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, lang, bot_trap: botTrap })
            });
            
            console.log('VOTY: Server responded with status:', res.status);
            const data = await res.json();
            removeTypingIndicator();

            if (res.ok) {
                console.log('VOTY: Formatting answer with worker...');
                worker.postMessage({ type: 'format', text: data.answer });
                worker.onmessage = function(e) {
                    appendMessage(e.data.text, 'ai');
                };
            } else if (res.status === 429) {
                appendMessage('⏳ VOTY is receiving too many requests right now. Please wait 15 seconds and try again.', 'ai');
            } else {
                appendMessage(data.error || 'The AI assistant encountered an error.', 'ai');
            }
        } catch (error) {
            console.error('VOTY: Fetch Error:', error);
            removeTypingIndicator();
            appendMessage('Connection error. Please check if your server is running.', 'ai');
        }
    });

    // Quiz functionality
    if (loadQuizBtn) {
        loadQuizBtn.addEventListener('click', async () => {
            const lang = languageSelect.value;
            loadQuizBtn.textContent = 'Loading...';
            loadQuizBtn.disabled = true;

            try {
                const res = await fetch(`/api/generate-quiz?lang=${lang}`);
                const data = await res.json();
                
                if (data.quiz && data.quiz.length > 0) {
                    renderQuiz(data.quiz);
                } else {
                    if (quizContainer) quizContainer.innerHTML = '<p>Failed to load quiz. Please try again.</p>';
                }
            } catch (error) {
                if (quizContainer) quizContainer.innerHTML = '<p>Network error loading quiz.</p>';
            } finally {
                loadQuizBtn.textContent = 'Generate New Quiz';
                loadQuizBtn.disabled = false;
            }
        });
    }

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
        
        // Voice-UI for Quiz Results
        const listenBtn = document.getElementById('listen-score-btn');
        if (listenBtn) {
            listenBtn.onclick = () => {
                window.speechSynthesis.cancel();
                const textToSpeak = `Quiz finished. Your score is ${userScore} out of ${totalQuestions}.`;
                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                
                const langVal = languageSelect.value;
                if (langVal === 'en') utterance.lang = 'en-IN';
                else if (langVal === 'hi') utterance.lang = 'hi-IN';
                else if (langVal === 'bn') utterance.lang = 'bn-IN';
                else if (langVal === 'ta') utterance.lang = 'ta-IN';
                else utterance.lang = 'hi-IN';
                
                window.speechSynthesis.speak(utterance);
            };
        }
    }

    document.getElementById('download-score').addEventListener('click', () => {
        const canvas = document.getElementById('score-canvas');
        const link = document.createElement('a');
        link.download = 'votewise-scorecard.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
});
