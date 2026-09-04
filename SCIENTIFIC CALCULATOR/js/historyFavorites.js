// QuantumCalc Pro - History & Favorites Data Management System
// Persistent storage for calculations, custom-tagged favorites, notes, and pinned formula macros

class HistoryFavoritesManager {
    constructor() {
        this.HISTORY_KEY = 'quantum_calc_history_v1';
        this.FAVORITES_KEY = 'quantum_calc_favorites_v1';
        this.PINNED_KEY = 'quantum_calc_pinned_macros_v1';

        this.history = [];
        this.favorites = [];
        this.pinnedMacros = [];

        this.init();
    }

    init() {
        try {
            const savedHistory = localStorage.getItem(this.HISTORY_KEY);
            this.history = savedHistory ? JSON.parse(savedHistory) : [];

            const savedFavs = localStorage.getItem(this.FAVORITES_KEY);
            this.favorites = savedFavs ? JSON.parse(savedFavs) : this.getDefaultFavorites();

            const savedPinned = localStorage.getItem(this.PINNED_KEY);
            this.pinnedMacros = savedPinned ? JSON.parse(savedPinned) : this.getDefaultPinnedMacros();
        } catch (e) {
            console.error('Error loading history/favorites from storage:', e);
            this.history = [];
            this.favorites = this.getDefaultFavorites();
            this.pinnedMacros = this.getDefaultPinnedMacros();
        }
    }

    getDefaultFavorites() {
        return [
            {
                id: 'fav_preset_1',
                title: 'Euler\'s Identity Relation',
                expression: 'e^(pi * 0) + 1',
                result: 2,
                formattedResult: '2',
                category: 'Math',
                notes: 'Fundamental mathematical identity linking fundamental constants.',
                isPinnedMacro: true,
                createdAt: Date.now() - 3600000 * 24
            },
            {
                id: 'fav_preset_2',
                title: 'Kinetic Energy (m=15kg, v=20m/s)',
                expression: '0.5 * 15 * (20^2)',
                result: 3000,
                formattedResult: '3000 Joules',
                category: 'Physics',
                notes: 'Formula: E_k = 0.5 * m * v^2',
                isPinnedMacro: true,
                createdAt: Date.now() - 3600000 * 12
            },
            {
                id: 'fav_preset_3',
                title: 'Hypotenuse (Pythagorean Theorem)',
                expression: 'sqrt(3^2 + 4^2)',
                result: 5,
                formattedResult: '5',
                category: 'Geometry',
                notes: 'Classic 3-4-5 right triangle calculation: c = sqrt(a^2 + b^2)',
                isPinnedMacro: true,
                createdAt: Date.now() - 3600000 * 6
            }
        ];
    }

    getDefaultPinnedMacros() {
        return ['fav_preset_1', 'fav_preset_2', 'fav_preset_3'];
    }

    saveHistory() {
        try {
            // Keep maximum 150 items
            if (this.history.length > 150) {
                this.history = this.history.slice(0, 150);
            }
            localStorage.setItem(this.HISTORY_KEY, JSON.stringify(this.history));
            this.dispatchUpdate('history');
        } catch (e) {
            console.error('Failed to save history', e);
        }
    }

    saveFavorites() {
        try {
            localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(this.favorites));
            localStorage.setItem(this.PINNED_KEY, JSON.stringify(this.pinnedMacros));
            this.dispatchUpdate('favorites');
        } catch (e) {
            console.error('Failed to save favorites', e);
        }
    }

    dispatchUpdate(type) {
        const event = new CustomEvent('quantum_calc_data_changed', { detail: { type } });
        window.dispatchEvent(event);
    }

    // --- History Operations ---

    addHistoryItem(expression, result, formattedResult, mode = 'DEG') {
        const id = 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const item = {
            id,
            expression: expression.trim(),
            result,
            formattedResult: formattedResult || String(result),
            mode,
            timestamp: Date.now(),
            isStarred: false
        };

        // Check if matching favorite already exists
        const matchingFav = this.favorites.find(f => f.expression === item.expression);
        if (matchingFav) {
            item.isStarred = true;
            item.favoriteId = matchingFav.id;
        }

        this.history.unshift(item);
        this.saveHistory();
        return item;
    }

    getHistory() {
        return this.history;
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
    }

    deleteHistoryItem(id) {
        this.history = this.history.filter(h => h.id !== id);
        this.saveHistory();
    }

    searchHistory(query) {
        if (!query) return this.history;
        const q = query.toLowerCase().trim();
        return this.history.filter(h => 
            h.expression.toLowerCase().includes(q) || 
            String(h.result).toLowerCase().includes(q) ||
            h.formattedResult.toLowerCase().includes(q)
        );
    }

    // --- Favorites Operations ---

    addFavorite({ title, expression, result, formattedResult, category = 'General', notes = '', isPinnedMacro = false }) {
        const id = 'fav_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const newFav = {
            id,
            title: title ? title.trim() : (expression || 'Saved Formula'),
            expression: (expression || '').trim(),
            result: result !== undefined ? result : 0,
            formattedResult: formattedResult || String(result),
            category: category.trim() || 'General',
            notes: notes.trim(),
            isPinnedMacro: Boolean(isPinnedMacro),
            createdAt: Date.now()
        };

        this.favorites.unshift(newFav);

        if (newFav.isPinnedMacro && !this.pinnedMacros.includes(id)) {
            this.pinnedMacros.push(id);
        }

        // Update star state in history
        this.history.forEach(h => {
            if (h.expression === newFav.expression) {
                h.isStarred = true;
                h.favoriteId = id;
            }
        });

        this.saveFavorites();
        this.saveHistory();
        return newFav;
    }

    updateFavorite(id, updatedData) {
        const index = this.favorites.findIndex(f => f.id === id);
        if (index !== -1) {
            this.favorites[index] = {
                ...this.favorites[index],
                ...updatedData,
                updatedAt: Date.now()
            };

            if (updatedData.isPinnedMacro !== undefined) {
                if (updatedData.isPinnedMacro && !this.pinnedMacros.includes(id)) {
                    this.pinnedMacros.push(id);
                } else if (!updatedData.isPinnedMacro) {
                    this.pinnedMacros = this.pinnedMacros.filter(pId => pId !== id);
                }
            }

            this.saveFavorites();
            return this.favorites[index];
        }
        return null;
    }

    removeFavorite(id) {
        const removed = this.favorites.find(f => f.id === id);
        this.favorites = this.favorites.filter(f => f.id !== id);
        this.pinnedMacros = this.pinnedMacros.filter(pId => pId !== id);

        // Update history item star status
        if (removed) {
            this.history.forEach(h => {
                if (h.favoriteId === id || h.expression === removed.expression) {
                    h.isStarred = false;
                    delete h.favoriteId;
                }
            });
            this.saveHistory();
        }

        this.saveFavorites();
    }

    toggleStarHistoryItem(historyId) {
        const hItem = this.history.find(h => h.id === historyId);
        if (!hItem) return null;

        if (hItem.isStarred) {
            // Unstar and remove favorite
            const fav = this.favorites.find(f => f.id === hItem.favoriteId || f.expression === hItem.expression);
            if (fav) {
                this.removeFavorite(fav.id);
            }
            hItem.isStarred = false;
            delete hItem.favoriteId;
            this.saveHistory();
            return { starred: false };
        } else {
            // Star and add favorite
            const fav = this.addFavorite({
                title: hItem.expression,
                expression: hItem.expression,
                result: hItem.result,
                formattedResult: hItem.formattedResult,
                category: 'Quick Saved',
                notes: `Saved from calculation on ${new Date(hItem.timestamp).toLocaleString()}`,
                isPinnedMacro: false
            });
            hItem.isStarred = true;
            hItem.favoriteId = fav.id;
            this.saveHistory();
            return { starred: true, favorite: fav };
        }
    }

    getFavorites() {
        return this.favorites;
    }

    getFavoriteById(id) {
        return this.favorites.find(f => f.id === id);
    }

    getCategories() {
        const cats = new Set(['All']);
        this.favorites.forEach(f => {
            if (f.category) cats.add(f.category);
        });
        return Array.from(cats);
    }

    getFavoritesByCategory(category) {
        if (!category || category === 'All') return this.favorites;
        return this.favorites.filter(f => f.category.toLowerCase() === category.toLowerCase());
    }

    getPinnedFavorites() {
        return this.favorites.filter(f => this.pinnedMacros.includes(f.id) || f.isPinnedMacro);
    }

    togglePinMacro(favoriteId) {
        const fav = this.favorites.find(f => f.id === favoriteId);
        if (!fav) return false;

        fav.isPinnedMacro = !fav.isPinnedMacro;
        if (fav.isPinnedMacro) {
            if (!this.pinnedMacros.includes(favoriteId)) {
                this.pinnedMacros.push(favoriteId);
            }
        } else {
            this.pinnedMacros = this.pinnedMacros.filter(id => id !== favoriteId);
        }
        this.saveFavorites();
        return fav.isPinnedMacro;
    }

    searchFavorites(query, category = 'All') {
        let list = this.getFavoritesByCategory(category);
        if (!query) return list;
        const q = query.toLowerCase().trim();
        return list.filter(f => 
            (f.title && f.title.toLowerCase().includes(q)) ||
            (f.expression && f.expression.toLowerCase().includes(q)) ||
            (f.notes && f.notes.toLowerCase().includes(q)) ||
            (f.category && f.category.toLowerCase().includes(q)) ||
            String(f.result).toLowerCase().includes(q)
        );
    }

    // --- Export / Import ---

    exportAllData() {
        const data = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            history: this.history,
            favorites: this.favorites,
            pinnedMacros: this.pinnedMacros
        };
        return JSON.stringify(data, null, 2);
    }

    exportHistoryCSV() {
        const header = ['Timestamp', 'Date', 'Expression', 'Result', 'Mode'];
        const rows = this.history.map(h => [
            h.timestamp,
            `"${new Date(h.timestamp).toISOString()}"`,
            `"${h.expression.replace(/"/g, '""')}"`,
            `"${h.formattedResult}"`,
            h.mode
        ]);
        return [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    importData(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            if (parsed.favorites && Array.isArray(parsed.favorites)) {
                this.favorites = parsed.favorites;
            }
            if (parsed.history && Array.isArray(parsed.history)) {
                this.history = parsed.history;
            }
            if (parsed.pinnedMacros && Array.isArray(parsed.pinnedMacros)) {
                this.pinnedMacros = parsed.pinnedMacros;
            }
            this.saveFavorites();
            this.saveHistory();
            return { success: true, count: this.favorites.length };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }
}

window.historyFavsManager = new HistoryFavoritesManager();
