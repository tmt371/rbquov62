// File: 04-core-code/services/ui-service.js

/**
 * @fileoverview A dedicated service for dispatching all UI-related state change actions.
 * It is now a stateless dispatcher that sends actions to the StateService.
 */
import * as uiActions from '../actions/ui-actions.js';

export class UIService {
    constructor({ stateService }) {
        this.stateService = stateService;
        console.log("UIService refactored to be a stateless action dispatcher.");
    }

    // This is now just a pass-through and could be refactored away later.
    _dispatch(action) {
        this.stateService.dispatch(action);
    }

    // --- View & Navigation ---
    setCurrentView(viewName) { this._dispatch(uiActions.setCurrentView(viewName)); }
    setVisibleColumns(columns) { this._dispatch(uiActions.setVisibleColumns(columns)); }
    setActiveTab(tabId) { this._dispatch(uiActions.setActiveTab(tabId)); }

    // --- Input & Selection ---
    setActiveCell(rowIndex, column) { this._dispatch(uiActions.setActiveCell(rowIndex, column)); }
    setInputValue(value) { this._dispatch(uiActions.setInputValue(value)); }
    appendInputValue(key) { this._dispatch(uiActions.appendInputValue(key)); }
    deleteLastInputChar() { this._dispatch(uiActions.deleteLastInputChar()); }
    clearInputValue() { this._dispatch(uiActions.clearInputValue()); }
    toggleMultiSelectMode() { this._dispatch(uiActions.toggleMultiSelectMode()); }
    toggleMultiSelectSelection(rowIndex) { this._dispatch(uiActions.toggleMultiSelectSelection(rowIndex)); }
    clearMultiSelectSelection() { this._dispatch(uiActions.clearMultiSelectSelection()); }

    // --- Left Panel Edit Modes ---
    setActiveEditMode(mode) { this._dispatch(uiActions.setActiveEditMode(mode)); }
    setTargetCell(cell) { this._dispatch(uiActions.setTargetCell(cell)); }
    setLocationInputValue(value) { this._dispatch(uiActions.setLocationInputValue(value)); }

    // --- K2 (Fabric/LF) State ---
    toggleLFSelection(rowIndex) { this._dispatch(uiActions.toggleLFSelection(rowIndex)); }
    clearLFSelection() { this._dispatch(uiActions.clearLFSelection()); }

    // --- K4 & K5 State ---
    setDualChainMode(mode) { this._dispatch(uiActions.setDualChainMode(mode)); }
    setDriveAccessoryMode(mode) { this._dispatch(uiActions.setDriveAccessoryMode(mode)); }
    setDriveAccessoryCount(accessory, count) { this._dispatch(uiActions.setDriveAccessoryCount(accessory, count)); }
    setDriveAccessoryTotalPrice(accessory, price) { this._dispatch(uiActions.setDriveAccessoryTotalPrice(accessory, price)); }
    setDriveGrandTotal(price) { this._dispatch(uiActions.setDriveGrandTotal(price)); }

    // --- F1/F2 State ---
    setF1RemoteDistribution(qty1, qty16) { this._dispatch(uiActions.setF1RemoteDistribution(qty1, qty16)); }
    setF1DualDistribution(comboQty, slimQty) { this._dispatch(uiActions.setF1DualDistribution(comboQty, slimQty)); }
    setF1DiscountPercentage(percentage) { this._dispatch(uiActions.setF1DiscountPercentage(percentage)); }
    setF2Value(key, value) { this._dispatch(uiActions.setF2Value(key, value)); }
    toggleF2FeeExclusion(feeType) { this._dispatch(uiActions.toggleF2FeeExclusion(feeType)); }

    // --- Global UI State ---
    setSumOutdated(isOutdated) { this._dispatch(uiActions.setSumOutdated(isOutdated)); }
    reset() { this._dispatch(uiActions.resetUi()); }

    // --- Read-only access ---
    getState() {
        const { ui } = this.stateService.getState();
        return ui;
    }
}