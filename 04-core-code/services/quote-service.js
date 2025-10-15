// File: 04-core-code/services/quote-service.js

/**
 * @fileoverview A dedicated service for dispatching all quoteData-related state change actions.
 * It is now a stateless dispatcher that sends actions to the StateService.
 */
import * as quoteActions from '../actions/quote-actions.js';

export class QuoteService {
    constructor({ stateService }) {
        this.stateService = stateService;
        console.log("QuoteService refactored to be a stateless action dispatcher.");
    }

    // This is now just a pass-through and could be refactored away later.
    _dispatch(action) {
        this.stateService.dispatch(action);
    }

    // --- Quote Data Root ---
    setQuoteData(newQuoteData) { this._dispatch(quoteActions.setQuoteData(newQuoteData)); }
    reset() { this._dispatch(quoteActions.resetQuoteData()); }

    // --- Item Array Operations ---
    insertRow(selectedIndex) { this._dispatch(quoteActions.insertRow(selectedIndex)); }
    deleteRow(selectedIndex) { this._dispatch(quoteActions.deleteRow(selectedIndex)); }
    clearRow(selectedIndex) { this._dispatch(quoteActions.clearRow(selectedIndex)); }
    deleteMultipleRows(indexesToDelete) { this._dispatch(quoteActions.deleteMultipleRows(indexesToDelete)); }

    // --- Individual Item Properties ---
    updateItemValue(rowIndex, column, value) { this._dispatch(quoteActions.updateItemValue(rowIndex, column, value)); }
    updateItemProperty(rowIndex, property, value) { this._dispatch(quoteActions.updateItemProperty(rowIndex, property, value)); }
    updateWinderMotorProperty(rowIndex, property, value) { this._dispatch(quoteActions.updateWinderMotorProperty(rowIndex, property, value)); }
    cycleK3Property(rowIndex, column) { this._dispatch(quoteActions.cycleK3Property(rowIndex, column)); }
    cycleItemType(rowIndex) { this._dispatch(quoteActions.cycleItemType(rowIndex)); } // [FIX] Re-add the method as an action dispatcher.
    setItemType(rowIndex, newType) { this._dispatch(quoteActions.setItemType(rowIndex, newType)); }

    // --- Batch Item Updates ---
    batchUpdateProperty(property, value) { this._dispatch(quoteActions.batchUpdateProperty(property, value)); }
    batchUpdatePropertyByType(type, property, value, indexesToExclude) { this._dispatch(quoteActions.batchUpdatePropertyByType(type, property, value, indexesToExclude)); }
    batchUpdateFabricType(newType) { this._dispatch(quoteActions.batchUpdateFabricType(newType)); }
    batchUpdateFabricTypeForSelection(selectedIndexes, newType) { this._dispatch(quoteActions.batchUpdateFabricTypeForSelection(selectedIndexes, newType)); }
    batchUpdateLFProperties(rowIndexes, fabricName, fabricColor) { this._dispatch(quoteActions.batchUpdateLFProperties(rowIndexes, fabricName, fabricColor)); }
    removeLFProperties(rowIndexes) { this._dispatch(quoteActions.removeLFProperties(rowIndexes)); }

    // --- Summary & Metadata ---
    updateAccessorySummary(data) { this._dispatch(quoteActions.updateAccessorySummary(data)); }
    addLFModifiedRows(rowIndexes) { this._dispatch(quoteActions.addLFModifiedRows(rowIndexes)); }
    removeLFModifiedRows(rowIndexes) { this._dispatch(quoteActions.removeLFModifiedRows(rowIndexes)); }

    // --- Read-only access methods ---
    getQuoteData() {
        const { quoteData } = this.stateService.getState();
        return quoteData;
    }

    getItems() {
        const { quoteData } = this.stateService.getState();
        const productKey = quoteData.currentProduct;
        return quoteData.products[productKey] ? quoteData.products[productKey].items : [];
    }

    getCurrentProductType() {
        const { quoteData } = this.stateService.getState();
        return quoteData.currentProduct;
    }

    hasData() {
        const items = this.getItems();
        if (!items) return false;
        return items.length > 1 || (items.length === 1 && (items[0].width || items[0].height));
    }
}