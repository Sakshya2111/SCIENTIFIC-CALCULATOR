// QuantumCalc Pro - Main Application Controller
// Orchestrator for Calculator logic, UI events, History, Categorized Favorites, Grapher & Themes

class QuantumCalcApp {
    constructor() {
        this.expression = '';
        this.isCalculated = false;
        this.isSecond = false;
        this.activeMode = 'scientific';
        this.selectedFavCategory = 'All';
        this.editingFavId = null;

        this.dom = {};
        this.grapher = null;

        this.init();
    }

    init() {
        this.cacheDom();
        this.loadSettings();
        this.initIcons();
        this.bindEvents();
        this.renderPinnedMacros();
        this.updateDisplay();
        this.renderHistoryList();
        this.renderFavoritesList();
        this.initConverterUI();
        this.renderBitSwitches();

        // Listen for storage changes
        window.addEventListener('quantum_calc_data_changed', (e) => {
            if (e.detail.type === 'history') {
                this.renderHistoryList();
            } else if (e.detail.type === 'favorites') {
                this.renderFavoritesList();
                this.renderPinnedMacros();
            }
            this.updateBadges();
        });

        this.updateBadges();
    }

    cacheDom() {
        // Displays
        this.dom.displayPrimary = document.getElementById('displayPrimary');
        this.dom.displaySecondary = document.getElementById('displaySecondary');
        this.dom.livePreviewResult = document.getElementById('livePreviewResult');
        this.dom.angleModeToggle = document.getElementById('angleModeToggle');
        this.dom.btnKeyAngle = document.getElementById('btnKeyAngle');
        this.dom.memStatusBadge = document.getElementById('memStatusBadge');
        this.dom.secondModeBadge = document.getElementById('secondModeBadge');
        this.dom.btnStarCurrent = document.getElementById('btnStarCurrent');
        this.dom.btnCopyDisplay = document.getElementById('btnCopyDisplay');
        this.dom.macroChipsContainer = document.getElementById('macroChipsContainer');
        this.dom.scientificKeypad = document.getElementById('scientificKeypad');

        // Header controls
        this.dom.themeSelect = document.getElementById('themeSelect');
        this.dom.btnSoundToggle = document.getElementById('btnSoundToggle');
        this.dom.soundIcon = document.getElementById('soundIcon');
        this.dom.btnShortcuts = document.getElementById('btnShortcuts');
        this.dom.btnOpenFavorites = document.getElementById('btnOpenFavorites');
        this.dom.btnOpenHistory = document.getElementById('btnOpenHistory');
        this.dom.favCountBadge = document.getElementById('favCountBadge');
        this.dom.histCountBadge = document.getElementById('histCountBadge');

        // Mode views & tabs
        this.dom.tabBtns = document.querySelectorAll('.tab-btn');
        this.dom.modeViews = document.querySelectorAll('.mode-view');

        // Drawers & Modals
        this.dom.drawerBackdrop = document.getElementById('drawerBackdrop');
        this.dom.historyDrawer = document.getElementById('historyDrawer');
        this.dom.favoritesDrawer = document.getElementById('favoritesDrawer');
        this.dom.historyListContainer = document.getElementById('historyListContainer');
        this.dom.favoritesListContainer = document.getElementById('favoritesListContainer');
        this.dom.favCategoryFilterChips = document.getElementById('favCategoryFilterChips');
        this.dom.historySearchInput = document.getElementById('historySearchInput');
        this.dom.favSearchInput = document.getElementById('favSearchInput');

        // Edit favorite modal
        this.dom.editFavoriteModal = document.getElementById('editFavoriteModal');
        this.dom.shortcutsModal = document.getElementById('shortcutsModal');
        this.dom.favEditId = document.getElementById('favEditId');
        this.dom.favTitleInput = document.getElementById('favTitleInput');
        this.dom.favExprInput = document.getElementById('favExprInput');
        this.dom.favCategoryInput = document.getElementById('favCategoryInput');
        this.dom.favNotesInput = document.getElementById('favNotesInput');
        this.dom.favPinMacroCheckbox = document.getElementById('favPinMacroCheckbox');
        this.dom.favModalTitle = document.getElementById('favModalTitle');

        // Toast container
        this.dom.toastContainer = document.getElementById('toastContainer');
    }

    initIcons() {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    loadSettings() {
        // Theme
        const savedTheme = localStorage.getItem('quantum_calc_theme') || 'cyber-neon';
        document.documentElement.setAttribute('data-theme', savedTheme);
        if (this.dom.themeSelect) {
            this.dom.themeSelect.value = savedTheme;
        }

        // Angle Mode
        const savedAngle = localStorage.getItem('quantum_calc_angle_mode') || 'DEG';
        window.mathEngine.setAngleMode(savedAngle);
        this.updateAngleModeUI();

        // Sound icon state
        this.updateSoundIcon();
    }

    updateAngleModeUI() {
        const mode = window.mathEngine.angleMode;
        if (this.dom.angleModeToggle) {
            this.dom.angleModeToggle.textContent = mode;
        }
        if (this.dom.btnKeyAngle) {
            this.dom.btnKeyAngle.textContent = mode;
        }
    }

    updateSoundIcon() {
        if (!this.dom.soundIcon) return;
        if (window.soundCtrl.enabled) {
            this.dom.soundIcon.setAttribute('data-lucide', 'volume-2');
        } else {
            this.dom.soundIcon.setAttribute('data-lucide', 'volume-x');
        }
        this.initIcons();
    }

    bindEvents() {
        // --- Mode Switcher Tabs ---
        this.dom.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.getAttribute('data-mode');
                this.switchMode(mode);
            });
        });

        // --- Theme Switcher ---
        if (this.dom.themeSelect) {
            this.dom.themeSelect.addEventListener('change', (e) => {
                const newTheme = e.target.value;
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('quantum_calc_theme', newTheme);
                window.soundCtrl.playKeySound('func');
                if (this.grapher) this.grapher.draw();
            });
        }

        // --- Sound Toggle ---
        if (this.dom.btnSoundToggle) {
            this.dom.btnSoundToggle.addEventListener('click', () => {
                window.soundCtrl.toggleSound();
                this.updateSoundIcon();
                this.showToast(window.soundCtrl.enabled ? 'Sound FX Enabled' : 'Sound FX Muted');
            });
        }

        // --- Shortcuts Modal ---
        if (this.dom.btnShortcuts) {
            this.dom.btnShortcuts.addEventListener('click', () => {
                this.openModal(this.dom.shortcutsModal);
            });
        }
        document.getElementById('btnCloseShortcuts')?.addEventListener('click', () => {
            this.closeModal(this.dom.shortcutsModal);
        });

        // --- Angle Mode Toggle ---
        const toggleAngleHandler = () => {
            const current = window.mathEngine.angleMode;
            const next = current === 'DEG' ? 'RAD' : 'DEG';
            window.mathEngine.setAngleMode(next);
            localStorage.setItem('quantum_calc_angle_mode', next);
            this.updateAngleModeUI();
            this.updateLivePreview();
            window.soundCtrl.playKeySound('func');
            this.showToast(`Angle Mode: ${next}`);
        };
        this.dom.angleModeToggle?.addEventListener('click', toggleAngleHandler);
        this.dom.btnKeyAngle?.addEventListener('click', toggleAngleHandler);

        // --- Copy Display Result ---
        this.dom.btnCopyDisplay?.addEventListener('click', () => {
            const textToCopy = this.expression || '0';
            navigator.clipboard.writeText(textToCopy).then(() => {
                window.soundCtrl.playKeySound('func');
                this.showToast('Copied to clipboard!');
            }).catch(() => {
                this.showToast('Unable to copy', 'error');
            });
        });

        // --- Star Current Calculation ---
        this.dom.btnStarCurrent?.addEventListener('click', () => {
            this.openAddFavoriteModal();
        });

        // --- Keypad Buttons Interaction ---
        if (this.dom.scientificKeypad) {
            this.dom.scientificKeypad.addEventListener('click', (e) => {
                const btn = e.target.closest('.key-btn');
                if (!btn) return;

                const insert = btn.getAttribute('data-insert');
                const action = btn.getAttribute('data-action');

                if (insert) {
                    this.handleInsert(insert);
                    if (btn.classList.contains('key-num')) {
                        window.soundCtrl.playKeySound('number');
                    } else if (btn.classList.contains('key-op')) {
                        window.soundCtrl.playKeySound('operator');
                    } else {
                        window.soundCtrl.playKeySound('func');
                    }
                } else if (action) {
                    this.handleAction(action);
                }
            });
        }

        // --- Drawers Open/Close ---
        this.dom.btnOpenHistory?.addEventListener('click', () => this.openDrawer(this.dom.historyDrawer));
        this.dom.btnOpenFavorites?.addEventListener('click', () => this.openDrawer(this.dom.favoritesDrawer));
        document.getElementById('btnCloseHistory')?.addEventListener('click', () => this.closeDrawer(this.dom.historyDrawer));
        document.getElementById('btnCloseFavorites')?.addEventListener('click', () => this.closeDrawer(this.dom.favoritesDrawer));
        this.dom.drawerBackdrop?.addEventListener('click', () => {
            this.closeDrawer(this.dom.historyDrawer);
            this.closeDrawer(this.dom.favoritesDrawer);
            this.closeModal(this.dom.editFavoriteModal);
            this.closeModal(this.dom.shortcutsModal);
        });

        // --- History Search & Clear ---
        this.dom.historySearchInput?.addEventListener('input', (e) => {
            this.renderHistoryList(e.target.value);
        });

        document.getElementById('btnClearHistory')?.addEventListener('click', () => {
            if (confirm('Clear all calculation history?')) {
                window.historyFavsManager.clearHistory();
                window.soundCtrl.playKeySound('clear');
                this.showToast('History cleared');
            }
        });

        document.getElementById('btnExportHistoryCSV')?.addEventListener('click', () => {
            const csv = window.historyFavsManager.exportHistoryCSV();
            this.downloadFile('quantum_calc_history.csv', 'text/csv', csv);
            this.showToast('History exported as CSV');
        });

        document.getElementById('btnExportHistoryJSON')?.addEventListener('click', () => {
            const data = window.historyFavsManager.exportAllData();
            this.downloadFile('quantum_calc_data.json', 'application/json', data);
            this.showToast('Data exported as JSON');
        });

        // --- Favorites Search & Category Filter ---
        this.dom.favSearchInput?.addEventListener('input', (e) => {
            this.renderFavoritesList(e.target.value, this.selectedFavCategory);
        });

        document.getElementById('btnAddNewFavorite')?.addEventListener('click', () => {
            this.openAddFavoriteModal();
        });

        document.getElementById('btnBackupFavs')?.addEventListener('click', () => {
            const data = window.historyFavsManager.exportAllData();
            this.downloadFile('quantum_calc_backup.json', 'application/json', data);
            this.showToast('Backup downloaded');
        });

        document.getElementById('btnRestoreFavs')?.addEventListener('click', () => {
            document.getElementById('restoreFileInput').click();
        });

        document.getElementById('restoreFileInput')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const res = window.historyFavsManager.importData(event.target.result);
                if (res.success) {
                    this.showToast(`Restored ${res.count} favorites!`);
                    this.renderFavoritesList();
                    this.renderPinnedMacros();
                } else {
                    this.showToast('Import failed: ' + res.error, 'error');
                }
            };
            reader.readAsText(file);
        });

        // --- Favorite Edit Modal Form ---
        document.getElementById('btnSaveFavModal')?.addEventListener('click', () => {
            this.saveFavoriteFromModal();
        });

        document.getElementById('btnCancelFavModal')?.addEventListener('click', () => {
            this.closeModal(this.dom.editFavoriteModal);
        });

        document.getElementById('btnCloseFavModal')?.addEventListener('click', () => {
            this.closeModal(this.dom.editFavoriteModal);
        });

        // --- Global Keyboard Listener ---
        window.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // --- Grapher Controls ---
        document.getElementById('btnPlotGraph')?.addEventListener('click', () => {
            this.plotGraphInputs();
        });

        document.querySelectorAll('.graph-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const f1 = btn.getAttribute('data-f1') || '';
                const f2 = btn.getAttribute('data-f2') || '';
                document.getElementById('graphInputF1').value = f1;
                document.getElementById('graphInputF2').value = f2;
                this.plotGraphInputs();
                window.soundCtrl.playKeySound('func');
            });
        });

        document.getElementById('btnZoomIn')?.addEventListener('click', () => this.grapher?.zoom(1));
        document.getElementById('btnZoomOut')?.addEventListener('click', () => this.grapher?.zoom(-1));
        document.getElementById('btnResetView')?.addEventListener('click', () => this.grapher?.resetView());

        // --- Programmer Keypad & Base Rows ---
        document.querySelectorAll('.prog-row').forEach(row => {
            row.addEventListener('click', () => {
                document.querySelectorAll('.prog-row').forEach(r => r.classList.remove('active'));
                row.classList.add('active');
                window.solverAndConverter.progActiveBase = row.getAttribute('data-base');
                window.soundCtrl.playKeySound('func');
            });
        });

        document.getElementById('progWordSizeSelect')?.addEventListener('change', (e) => {
            window.solverAndConverter.setProgWordSize(e.target.value);
            this.renderBitSwitches();
            this.updateProgrammerUI();
        });

        document.getElementById('programmerKeypad')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.key-btn');
            if (!btn) return;

            const input = btn.getAttribute('data-prog-input');
            const op = btn.getAttribute('data-prog-op');
            const act = btn.getAttribute('data-prog-action');

            if (input) {
                this.handleProgrammerInput(input);
            } else if (op) {
                window.solverAndConverter.executeBitwiseOp(op);
                this.updateProgrammerUI();
                window.soundCtrl.playKeySound('operator');
            } else if (act === 'clear') {
                window.solverAndConverter.progValue = 0n;
                this.updateProgrammerUI();
                window.soundCtrl.playKeySound('clear');
            } else if (act === 'backspace') {
                this.handleProgrammerBackspace();
            }
        });

        // --- Solvers ---
        document.getElementById('btnSolveQuad')?.addEventListener('click', () => {
            this.handleSolveQuadratic();
        });

        document.getElementById('btnSolveLinear')?.addEventListener('click', () => {
            this.handleSolveLinearSystem();
        });
    }

    switchMode(mode) {
        this.activeMode = mode;
        this.dom.tabBtns.forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-mode') === mode);
        });
        this.dom.modeViews.forEach(v => {
            v.classList.remove('active');
        });

        const targetView = document.getElementById(`view${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
        if (targetView) {
            targetView.classList.add('active');
        }

        window.soundCtrl.playKeySound('func');

        if (mode === 'grapher') {
            if (!this.grapher) {
                this.grapher = new FunctionGrapher('graphCanvas');
            }
            setTimeout(() => {
                this.grapher.resize();
                this.plotGraphInputs();
            }, 50);
        } else if (mode === 'programmer') {
            this.updateProgrammerUI();
        }
    }

    // --- Keypad & Input Handling ---

    handleInsert(str) {
        if (this.isCalculated && !'+-*/^%'.includes(str)) {
            this.expression = '';
        }
        this.isCalculated = false;

        // Modify insert if 2nd function active
        if (this.isSecond) {
            if (str === '^2') str = '^3';
            else if (str === 'sqrt(') str = 'cbrt(';
            else if (str === 'ln(') str = 'exp(';
            else if (str === 'log10(') str = '10^(';
            else if (str === 'sin(') str = 'asin(';
            else if (str === 'cos(') str = 'acos(';
            else if (str === 'tan(') str = 'atan(';
            else if (str === 'sinh(') str = 'asinh(';
            else if (str === 'cosh(') str = 'acosh(';
            else if (str === '!') str = 'nCr(';
        }

        this.expression += str;
        this.updateDisplay();
    }

    handleAction(action) {
        switch (action) {
            case 'calculate':
                this.executeCalculation();
                break;

            case 'clear':
                this.expression = '';
                this.isCalculated = false;
                this.dom.displaySecondary.textContent = '0';
                this.updateDisplay();
                window.soundCtrl.playKeySound('clear');
                break;

            case 'backspace':
                if (this.expression.length > 0) {
                    this.expression = this.expression.slice(0, -1);
                    this.updateDisplay();
                    window.soundCtrl.playKeySound('operator');
                }
                break;

            case 'toggle-second':
                this.isSecond = !this.isSecond;
                this.dom.scientificKeypad.classList.toggle('is-second', this.isSecond);
                if (this.dom.secondModeBadge) {
                    this.dom.secondModeBadge.style.display = this.isSecond ? 'inline-block' : 'none';
                }
                window.soundCtrl.playKeySound('func');
                break;

            case 'toggle-angle':
                this.dom.angleModeToggle.click();
                break;

            case 'negate':
                if (this.expression.startsWith('-')) {
                    this.expression = this.expression.substring(1);
                } else {
                    this.expression = '-' + this.expression;
                }
                this.updateDisplay();
                window.soundCtrl.playKeySound('operator');
                break;

            // Memory Actions
            case 'mem-clear':
                window.mathEngine.memoryClear();
                this.updateMemoryBadge();
                this.showToast('Memory Cleared (MC)');
                window.soundCtrl.playKeySound('func');
                break;

            case 'mem-recall':
                this.handleInsert(String(window.mathEngine.memoryRecall()));
                this.showToast(`Recalled M = ${window.mathEngine.memoryRecall()}`);
                window.soundCtrl.playKeySound('func');
                break;

            case 'mem-add':
                try {
                    const val = window.mathEngine.evaluate(this.expression || '0');
                    window.mathEngine.memoryAdd(val);
                    this.updateMemoryBadge();
                    this.showToast(`Added to Memory (M = ${window.mathEngine.memoryRecall()})`);
                    window.soundCtrl.playKeySound('func');
                } catch (e) {
                    this.showToast('Error in expression', 'error');
                }
                break;

            case 'mem-sub':
                try {
                    const val = window.mathEngine.evaluate(this.expression || '0');
                    window.mathEngine.memorySubtract(val);
                    this.updateMemoryBadge();
                    this.showToast(`Subtracted from Memory (M = ${window.mathEngine.memoryRecall()})`);
                    window.soundCtrl.playKeySound('func');
                } catch (e) {
                    this.showToast('Error in expression', 'error');
                }
                break;
        }
    }

    updateMemoryBadge() {
        if (this.dom.memStatusBadge) {
            this.dom.memStatusBadge.style.display = window.mathEngine.memoryRecall() !== 0 ? 'inline-block' : 'none';
        }
    }

    executeCalculation() {
        if (!this.expression.trim()) return;

        try {
            const rawResult = window.mathEngine.evaluate(this.expression);
            const formattedResult = window.mathEngine.formatResult(rawResult);

            // Record to secondary line
            this.dom.displaySecondary.textContent = `${this.expression} =`;

            // Save to history
            const histItem = window.historyFavsManager.addHistoryItem(
                this.expression,
                rawResult,
                formattedResult,
                window.mathEngine.angleMode
            );

            // Update primary display with result
            this.expression = formattedResult;
            this.isCalculated = true;
            this.updateDisplay(false);

            // Play success chord
            window.soundCtrl.playKeySound('equals');

            // Check if current expression is favorited and update star icon
            this.checkCurrentStarState(histItem.expression);
        } catch (err) {
            window.soundCtrl.playErrorBeep();
            this.dom.displaySecondary.textContent = 'Error';
            this.showToast(err.message || 'Syntax Error', 'error');
        }
    }

    updateDisplay(checkPreview = true) {
        const expr = this.expression || '0';
        this.dom.displayPrimary.innerHTML = window.mathEngine.highlightExpression(expr);

        if (checkPreview && !this.isCalculated) {
            this.updateLivePreview();
        } else {
            this.dom.livePreviewResult.textContent = '';
        }

        this.checkCurrentStarState(this.expression);
    }

    updateLivePreview() {
        if (!this.expression || this.isCalculated) {
            this.dom.livePreviewResult.textContent = '';
            return;
        }
        try {
            const res = window.mathEngine.evaluate(this.expression);
            if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
                this.dom.livePreviewResult.textContent = `= ${window.mathEngine.formatResult(res)}`;
            } else {
                this.dom.livePreviewResult.textContent = '';
            }
        } catch (e) {
            this.dom.livePreviewResult.textContent = '';
        }
    }

    checkCurrentStarState(expr) {
        if (!expr) {
            this.dom.btnStarCurrent.classList.remove('starred');
            return;
        }
        const favs = window.historyFavsManager.getFavorites();
        const isFav = favs.some(f => f.expression === expr.trim());
        this.dom.btnStarCurrent.classList.toggle('starred', isFav);
    }

    handleKeyboard(e) {
        // Prevent key capture if typing inside form inputs
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

        const key = e.key;

        if (/[0-9.]/.test(key)) {
            e.preventDefault();
            this.handleInsert(key);
            window.soundCtrl.playKeySound('number');
        } else if (['+', '-', '*', '/'].includes(key)) {
            e.preventDefault();
            this.handleInsert(key);
            window.soundCtrl.playKeySound('operator');
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            this.handleAction('calculate');
        } else if (key === 'Backspace') {
            e.preventDefault();
            this.handleAction('backspace');
        } else if (key === 'Escape' || key.toLowerCase() === 'c') {
            e.preventDefault();
            this.handleAction('clear');
        } else if (key === '(' || key === ')') {
            e.preventDefault();
            this.handleInsert(key);
            window.soundCtrl.playKeySound('func');
        } else if (key === '^') {
            e.preventDefault();
            this.handleInsert('^');
            window.soundCtrl.playKeySound('func');
        } else if (key === '!') {
            e.preventDefault();
            this.handleInsert('!');
            window.soundCtrl.playKeySound('func');
        } else if (key.toLowerCase() === 's') {
            e.preventDefault();
            this.handleInsert('sin(');
            window.soundCtrl.playKeySound('func');
        } else if (key.toLowerCase() === 'o') {
            e.preventDefault();
            this.handleInsert('cos(');
            window.soundCtrl.playKeySound('func');
        } else if (key.toLowerCase() === 't') {
            e.preventDefault();
            this.handleInsert('tan(');
            window.soundCtrl.playKeySound('func');
        } else if (key.toLowerCase() === 'r') {
            e.preventDefault();
            this.handleInsert('sqrt(');
            window.soundCtrl.playKeySound('func');
        } else if (key.toLowerCase() === 'p') {
            e.preventDefault();
            this.handleInsert('pi');
            window.soundCtrl.playKeySound('func');
        } else if (key.toLowerCase() === 'e') {
            e.preventDefault();
            this.handleInsert('e');
            window.soundCtrl.playKeySound('func');
        } else if (key.toLowerCase() === 'l') {
            e.preventDefault();
            this.handleInsert('ln(');
            window.soundCtrl.playKeySound('func');
        }
    }

    // --- History & Favorites Rendering ---

    updateBadges() {
        const histCount = window.historyFavsManager.getHistory().length;
        const favCount = window.historyFavsManager.getFavorites().length;

        if (this.dom.histCountBadge) this.dom.histCountBadge.textContent = histCount;
        if (this.dom.favCountBadge) this.dom.favCountBadge.textContent = favCount;
    }

    renderHistoryList(searchQuery = '') {
        const list = window.historyFavsManager.searchHistory(searchQuery);
        const container = this.dom.historyListContainer;
        if (!container) return;

        if (list.length === 0) {
            container.innerHTML = `
                <div class="drawer-empty-state">
                    <i data-lucide="clock" style="width: 36px; height: 36px; opacity: 0.4;"></i>
                    <p>No calculation history yet.<br>Start calculating to see records here.</p>
                </div>
            `;
            this.initIcons();
            return;
        }

        container.innerHTML = list.map(item => `
            <div class="item-card" data-id="${item.id}">
                <div class="item-header">
                    <span class="tag-badge">${item.mode}</span>
                    <span>${this.formatTimeAgo(item.timestamp)}</span>
                </div>
                <div class="item-expr">${item.expression}</div>
                <div class="item-result">= ${item.formattedResult}</div>
                <div class="item-actions">
                    <button class="icon-btn btn-xs btn-star-item ${item.isStarred ? 'starred' : ''}" data-hist-id="${item.id}" title="Star as Favorite">
                        <i data-lucide="star"></i>
                    </button>
                    <button class="icon-btn btn-xs btn-insert-item" data-expr="${item.expression}" title="Insert into calculator">
                        <i data-lucide="arrow-up-left"></i> Insert
                    </button>
                    <button class="icon-btn btn-xs btn-copy-item" data-val="${item.formattedResult}" title="Copy Result">
                        <i data-lucide="copy"></i>
                    </button>
                    <button class="icon-btn btn-xs key-danger btn-del-item" data-id="${item.id}" title="Delete">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Attach action listeners
        container.querySelectorAll('.btn-star-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const histId = btn.getAttribute('data-hist-id');
                const res = window.historyFavsManager.toggleStarHistoryItem(histId);
                if (res?.starred) {
                    this.showToast('Saved to Favorites!');
                } else {
                    this.showToast('Removed from Favorites');
                }
                this.renderHistoryList(this.dom.historySearchInput?.value || '');
                this.renderFavoritesList();
                this.renderPinnedMacros();
            });
        });

        container.querySelectorAll('.btn-insert-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const expr = btn.getAttribute('data-expr');
                this.expression = expr;
                this.isCalculated = false;
                this.updateDisplay();
                this.closeDrawer(this.dom.historyDrawer);
                this.showToast('Expression loaded into calculator');
                window.soundCtrl.playKeySound('func');
            });
        });

        container.querySelectorAll('.btn-copy-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const val = btn.getAttribute('data-val');
                navigator.clipboard.writeText(val);
                this.showToast(`Copied ${val}`);
                window.soundCtrl.playKeySound('func');
            });
        });

        container.querySelectorAll('.btn-del-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                window.historyFavsManager.deleteHistoryItem(id);
                this.renderHistoryList(this.dom.historySearchInput?.value || '');
            });
        });

        this.initIcons();
    }

    renderFavoritesList(searchQuery = '', category = this.selectedFavCategory) {
        this.renderCategoryChips();
        const list = window.historyFavsManager.searchFavorites(searchQuery, category);
        const container = this.dom.favoritesListContainer;
        if (!container) return;

        if (list.length === 0) {
            container.innerHTML = `
                <div class="drawer-empty-state">
                    <i data-lucide="star" style="width: 36px; height: 36px; opacity: 0.4; color: #fbbf24;"></i>
                    <p>No favorites found in category "${category}".<br>Click 'New Favorite' or star calculations to save them here.</p>
                </div>
            `;
            this.initIcons();
            return;
        }

        container.innerHTML = list.map(item => `
            <div class="item-card" data-fav-id="${item.id}">
                <div class="item-header">
                    <div class="item-tags">
                        <span class="tag-badge">${item.category || 'General'}</span>
                        ${item.isPinnedMacro ? '<span class="tag-badge" style="background: rgba(251, 191, 36, 0.15); color: #fbbf24;">📌 Pinned</span>' : ''}
                    </div>
                    <span>${this.formatTimeAgo(item.createdAt)}</span>
                </div>
                <div class="item-title">${item.title}</div>
                <div class="item-expr">${item.expression}</div>
                <div class="item-result">= ${item.formattedResult || item.result}</div>
                ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ''}
                <div class="item-actions">
                    <button class="icon-btn btn-xs btn-pin-fav ${item.isPinnedMacro ? 'starred' : ''}" data-id="${item.id}" title="Pin/Unpin as Keypad Macro">
                        <i data-lucide="pin"></i>
                    </button>
                    <button class="icon-btn btn-xs btn-load-fav" data-expr="${item.expression}" title="Load Expression">
                        <i data-lucide="arrow-up-left"></i> Load
                    </button>
                    <button class="icon-btn btn-xs btn-edit-fav" data-id="${item.id}" title="Edit Favorite Details">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button class="icon-btn btn-xs key-danger btn-del-fav" data-id="${item.id}" title="Delete Favorite">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Action Listeners
        container.querySelectorAll('.btn-pin-fav').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const isPinned = window.historyFavsManager.togglePinMacro(id);
                this.showToast(isPinned ? 'Pinned to Keypad Macros' : 'Unpinned from Keypad');
                this.renderFavoritesList();
                this.renderPinnedMacros();
            });
        });

        container.querySelectorAll('.btn-load-fav').forEach(btn => {
            btn.addEventListener('click', () => {
                const expr = btn.getAttribute('data-expr');
                this.expression = expr;
                this.isCalculated = false;
                this.updateDisplay();
                this.closeDrawer(this.dom.favoritesDrawer);
                this.showToast('Formula loaded!');
                window.soundCtrl.playKeySound('func');
            });
        });

        container.querySelectorAll('.btn-edit-fav').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                this.openEditFavoriteModal(id);
            });
        });

        container.querySelectorAll('.btn-del-fav').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                window.historyFavsManager.removeFavorite(id);
                this.showToast('Favorite removed');
                this.renderFavoritesList();
                this.renderPinnedMacros();
            });
        });

        this.initIcons();
    }

    renderCategoryChips() {
        const categories = window.historyFavsManager.getCategories();
        const container = this.dom.favCategoryFilterChips;
        if (!container) return;

        container.innerHTML = categories.map(cat => `
            <span class="cat-chip ${this.selectedFavCategory === cat ? 'active' : ''}" data-cat="${cat}">${cat}</span>
        `).join('');

        container.querySelectorAll('.cat-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this.selectedFavCategory = chip.getAttribute('data-cat');
                this.renderFavoritesList(this.dom.favSearchInput?.value || '', this.selectedFavCategory);
            });
        });
    }

    renderPinnedMacros() {
        const pinned = window.historyFavsManager.getPinnedFavorites();
        const container = this.dom.macroChipsContainer;
        if (!container) return;

        if (pinned.length === 0) {
            container.innerHTML = '<span style="font-size:0.75rem; color: var(--text-subtle);">No pinned formulas. Star and pin formulas from the Favorites drawer.</span>';
            return;
        }

        container.innerHTML = pinned.map(item => `
            <button class="macro-chip btn-pinned-macro" data-expr="${item.expression}" title="${item.title}: ${item.expression}">
                <i data-lucide="zap" style="width: 12px; height: 12px; color: #fbbf24;"></i>
                <span>${item.title.length > 20 ? item.title.substr(0, 18) + '...' : item.title}</span>
            </button>
        `).join('');

        container.querySelectorAll('.btn-pinned-macro').forEach(chip => {
            chip.addEventListener('click', () => {
                const expr = chip.getAttribute('data-expr');
                this.expression = expr;
                this.isCalculated = false;
                this.updateDisplay();
                window.soundCtrl.playKeySound('func');
                this.showToast(`Loaded: ${expr}`);
            });
        });

        this.initIcons();
    }

    // --- Modal Management ---

    openDrawer(drawerEl) {
        if (!drawerEl) return;
        this.dom.drawerBackdrop.classList.add('open');
        drawerEl.classList.add('open');
        window.soundCtrl.playKeySound('func');
    }

    closeDrawer(drawerEl) {
        if (!drawerEl) return;
        drawerEl.classList.remove('open');
        this.dom.drawerBackdrop.classList.remove('open');
    }

    openModal(modalEl) {
        if (!modalEl) return;
        this.dom.drawerBackdrop.classList.add('open');
        modalEl.classList.add('open');
        window.soundCtrl.playKeySound('func');
    }

    closeModal(modalEl) {
        if (!modalEl) return;
        modalEl.classList.remove('open');
        this.dom.drawerBackdrop.classList.remove('open');
    }

    openAddFavoriteModal() {
        this.editingFavId = null;
        this.dom.favModalTitle.textContent = 'Save Calculation to Favorites';
        this.dom.favEditId.value = '';
        this.dom.favTitleInput.value = this.expression || '';
        this.dom.favExprInput.value = this.expression || '';
        this.dom.favCategoryInput.value = 'General';
        this.dom.favNotesInput.value = '';
        this.dom.favPinMacroCheckbox.checked = true;

        this.openModal(this.dom.editFavoriteModal);
    }

    openEditFavoriteModal(id) {
        const fav = window.historyFavsManager.getFavoriteById(id);
        if (!fav) return;

        this.editingFavId = id;
        this.dom.favModalTitle.textContent = 'Edit Favorite Details';
        this.dom.favEditId.value = fav.id;
        this.dom.favTitleInput.value = fav.title || '';
        this.dom.favExprInput.value = fav.expression || '';
        this.dom.favCategoryInput.value = fav.category || 'General';
        this.dom.favNotesInput.value = fav.notes || '';
        this.dom.favPinMacroCheckbox.checked = Boolean(fav.isPinnedMacro);

        this.openModal(this.dom.editFavoriteModal);
    }

    saveFavoriteFromModal() {
        const title = this.dom.favTitleInput.value.trim();
        const expr = this.dom.favExprInput.value.trim();
        const category = this.dom.favCategoryInput.value.trim() || 'General';
        const notes = this.dom.favNotesInput.value.trim();
        const isPinned = this.dom.favPinMacroCheckbox.checked;

        if (!expr) {
            this.showToast('Please enter an expression', 'error');
            return;
        }

        let evaluatedRes = 0;
        try {
            evaluatedRes = window.mathEngine.evaluate(expr);
        } catch (e) {}

        if (this.editingFavId) {
            window.historyFavsManager.updateFavorite(this.editingFavId, {
                title,
                expression: expr,
                category,
                notes,
                result: evaluatedRes,
                formattedResult: window.mathEngine.formatResult(evaluatedRes),
                isPinnedMacro: isPinned
            });
            this.showToast('Favorite updated successfully!');
        } else {
            window.historyFavsManager.addFavorite({
                title,
                expression: expr,
                category,
                notes,
                result: evaluatedRes,
                formattedResult: window.mathEngine.formatResult(evaluatedRes),
                isPinnedMacro: isPinned
            });
            this.showToast('Added to Favorites!');
        }

        this.closeModal(this.dom.editFavoriteModal);
        this.renderFavoritesList();
        this.renderPinnedMacros();
        this.checkCurrentStarState(this.expression);
    }

    // --- 2D Grapher Helper ---

    plotGraphInputs() {
        if (!this.grapher) return;
        const f1 = document.getElementById('graphInputF1').value;
        const f2 = document.getElementById('graphInputF2').value;

        this.grapher.setFunction('f1', f1, Boolean(f1.trim()));
        this.grapher.setFunction('f2', f2, Boolean(f2.trim()));
        this.showToast('Graph updated');
    }

    // --- Programmer Mode UI ---

    renderBitSwitches() {
        const container = document.getElementById('bitSwitchesContainer');
        if (!container) return;

        const wordSize = window.solverAndConverter.progWordSize;
        document.getElementById('bitCountDisplay').textContent = `${wordSize} Bits`;

        let html = '';
        for (let i = wordSize - 1; i >= 0; i--) {
            html += `
                <div class="bit-toggle" data-bit="${i}" id="bitToggle_${i}">
                    <span class="bit-idx">${i}</span>
                    <span class="bit-val">0</span>
                </div>
            `;
        }
        container.innerHTML = html;

        container.querySelectorAll('.bit-toggle').forEach(el => {
            el.addEventListener('click', () => {
                const bitIdx = parseInt(el.getAttribute('data-bit'), 10);
                window.solverAndConverter.toggleBit(bitIdx);
                this.updateProgrammerUI();
                window.soundCtrl.playKeySound('func');
            });
        });

        this.updateProgrammerUI();
    }

    updateProgrammerUI() {
        const vals = window.solverAndConverter.getProgValues();
        document.getElementById('progValHex').textContent = vals.hex || '0';
        document.getElementById('progValDec').textContent = vals.dec || '0';
        document.getElementById('progValOct').textContent = vals.oct || '0';
        document.getElementById('progValBin').textContent = vals.binFormatted || '0000';

        // Update bit toggles
        const bn = vals.rawBigInt;
        const wordSize = window.solverAndConverter.progWordSize;

        for (let i = 0; i < wordSize; i++) {
            const bitEl = document.getElementById(`bitToggle_${i}`);
            if (bitEl) {
                const isBitSet = ((bn >> BigInt(i)) & 1n) === 1n;
                bitEl.classList.toggle('on', isBitSet);
                bitEl.querySelector('.bit-val').textContent = isBitSet ? '1' : '0';
            }
        }
    }

    handleProgrammerInput(char) {
        const currentVals = window.solverAndConverter.getProgValues();
        const base = window.solverAndConverter.progActiveBase;

        let str = '';
        if (base === 'HEX') str = currentVals.hex === '0' ? char : currentVals.hex + char;
        else if (base === 'DEC') str = currentVals.dec === '0' ? char : currentVals.dec + char;
        else if (base === 'OCT') str = currentVals.oct === '0' ? char : currentVals.oct + char;
        else if (base === 'BIN') str = currentVals.bin === '0' ? char : currentVals.bin + char;

        window.solverAndConverter.setProgValueFromBase(str, base);
        this.updateProgrammerUI();
        window.soundCtrl.playKeySound('number');
    }

    handleProgrammerBackspace() {
        const currentVals = window.solverAndConverter.getProgValues();
        const base = window.solverAndConverter.progActiveBase;

        let str = '';
        if (base === 'HEX') str = currentVals.hex.slice(0, -1) || '0';
        else if (base === 'DEC') str = currentVals.dec.slice(0, -1) || '0';
        else if (base === 'OCT') str = currentVals.oct.slice(0, -1) || '0';
        else if (base === 'BIN') str = currentVals.bin.slice(0, -1) || '0';

        window.solverAndConverter.setProgValueFromBase(str, base);
        this.updateProgrammerUI();
        window.soundCtrl.playKeySound('operator');
    }

    // --- Solvers UI ---

    handleSolveQuadratic() {
        const a = document.getElementById('quadA').value;
        const b = document.getElementById('quadB').value;
        const c = document.getElementById('quadC').value;
        const container = document.getElementById('quadSteps');

        try {
            const res = window.solverAndConverter.solveQuadratic(a, b, c);
            container.innerHTML = res.steps.map(s => `<div>▶ ${s}</div>`).join('');
            window.soundCtrl.playKeySound('equals');
        } catch (e) {
            container.innerHTML = `<div style="color:var(--danger);">${e.message}</div>`;
            window.soundCtrl.playErrorBeep();
        }
    }

    handleSolveLinearSystem() {
        const a1 = document.getElementById('linA1').value;
        const b1 = document.getElementById('linB1').value;
        const c1 = document.getElementById('linC1').value;
        const a2 = document.getElementById('linA2').value;
        const b2 = document.getElementById('linB2').value;
        const c2 = document.getElementById('linC2').value;
        const container = document.getElementById('linearSteps');

        try {
            const res = window.solverAndConverter.solveLinearSystem2x2(a1, b1, c1, a2, b2, c2);
            container.innerHTML = res.steps.map(s => `<div>▶ ${s}</div>`).join('');
            window.soundCtrl.playKeySound('equals');
        } catch (e) {
            container.innerHTML = `<div style="color:var(--danger);">${e.message}</div>`;
            window.soundCtrl.playErrorBeep();
        }
    }

    // --- Converter UI ---

    initConverterUI() {
        const catSelect = document.getElementById('unitCatSelect');
        const fromSelect = document.getElementById('unitFromSelect');
        const toSelect = document.getElementById('unitToSelect');
        const fromInput = document.getElementById('unitFromInput');
        const toOutput = document.getElementById('unitToOutput');

        if (!catSelect || !fromSelect || !toSelect) return;

        const populateUnits = () => {
            const cat = catSelect.value;
            const unitsObj = window.solverAndConverter.unitCategories[cat]?.units || {};
            const keys = Object.keys(unitsObj);

            fromSelect.innerHTML = keys.map(k => `<option value="${k}">${unitsObj[k].name}</option>`).join('');
            toSelect.innerHTML = keys.map((k, idx) => `<option value="${k}" ${idx === 1 ? 'selected' : ''}>${unitsObj[k].name}</option>`).join('');
            runConvert();
        };

        const runConvert = () => {
            const cat = catSelect.value;
            const from = fromSelect.value;
            const to = toSelect.value;
            const val = fromInput.value;
            const res = window.solverAndConverter.convertUnits(cat, from, to, val);
            toOutput.value = isNaN(res) ? '0' : Number(res.toFixed(6)).toString();
        };

        catSelect.addEventListener('change', populateUnits);
        fromSelect.addEventListener('change', runConvert);
        toSelect.addEventListener('change', runConvert);
        fromInput.addEventListener('input', runConvert);

        populateUnits();
    }

    // --- Toast & Utility Helpers ---

    showToast(message, type = 'info') {
        const container = this.dom.toastContainer;
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        if (type === 'error') {
            toast.style.borderColor = 'var(--danger)';
            toast.style.color = 'var(--danger)';
        }

        toast.innerHTML = `
            <i data-lucide="${type === 'error' ? 'alert-triangle' : 'check-circle-2'}" style="width: 16px; height: 16px;"></i>
            <span>${message}</span>
        `;
        container.appendChild(toast);
        this.initIcons();

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.25s ease';
            setTimeout(() => toast.remove(), 250);
        }, 2600);
    }

    formatTimeAgo(timestamp) {
        if (!timestamp) return 'Recently';
        const diff = Date.now() - timestamp;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    downloadFile(filename, mimeType, content) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
    window.calcApp = new QuantumCalcApp();
});
