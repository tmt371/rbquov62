// File: 04-core-code/reducers/root-reducer.js

/**
 * @fileoverview This will be the single source of truth for all state mutation logic.
 * It contains a root reducer that delegates actions to sub-reducers based on action type prefixes.
 */

// This is a placeholder for now. In the next phase, we will move logic
// from UIService and QuoteService into this file.

import { UI_ACTION_TYPES } from '../config/action-types.js';
import { QUOTE_ACTION_TYPES } from '../config/action-types.js';

// A simple placeholder reducer for now.
function uiReducer(state, action) {
    // In the next phase, we will add switch cases here for UI actions.
    switch (action.type) {
        // Example:
        // case UI_ACTION_TYPES.SET_ACTIVE_CELL:
        //     return { ...state, activeCell: action.payload };
        default:
            return state;
    }
}

// A simple placeholder reducer for now.
function quoteReducer(state, action) {
    // In the next phase, we will add switch cases here for Quote actions.
    switch (action.type) {
        default:
            return state;
    }
}

export function rootReducer(state, action) {
    // Delegate to the appropriate sub-reducer based on the action type prefix.
    if (action.type.startsWith('ui/')) {
        const newUiState = uiReducer(state.ui, action);
        return { ...state, ui: newUiState };
    }

    if (action.type.startsWith('quote/')) {
        const newQuoteState = quoteReducer(state.quoteData, action);
        return { ...state, quoteData: newQuoteState };
    }

    // If the action type doesn't match, return the current state without changes.
    return state;
}