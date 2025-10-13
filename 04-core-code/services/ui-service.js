// File: 04-core-code/services/ui-service.js

/**
 * @fileoverview A dedicated service for managing all UI-related state.
 * It is now a stateless logic processor that dispatches updates to the StateService.
 */
import { initialState } from '../config/initial-state.js';

export class UIService {
    constructor({ stateService }) {
        this.stateService = stateService;
        this._initializeUIState();
        console.log("UIService refactored to be a stateless logic processor.");
    }

    _initializeUIState() {
        const currentState = this.stateService.getState();
        let { ui } = currentState;
        let needsUpdate = false;

        const defaults = initialState.ui;

        for (const key in defaults) {
            if (ui[key] === undefined) {
                ui[key] = defaults[key];
                needsUpdate = true;
            }
        }
        if (ui.f1 === undefined) {
            ui.f1 = defaults.f1;
            needsUpdate = true;
        }
        if (ui.f2 === undefined) {
            ui.f2 = defaults.f2;
            needsUpdate = true;
        }

        if (needsUpdate) {
            this.stateService.updateState({ ...currentState, ui });
        }
    }

    _updateUiState(updateFn) {
        const currentState = this.stateService.getState();
        const newUiState = updateFn({ ...currentState.ui });
        this.stateService.updateState({ ...currentState, ui: newUiState });
    }

    getState() {
        const { ui } = this.stateService.getState();
        return ui;
    }

    reset() {
        this._updateUiState(ui => JSON.parse(JSON.stringify(initialState.ui)));
    }

    setWelcomeDialogShown(wasShown) {
        this._updateUiState(ui => ({ ...ui, welcomeDialogShown: wasShown }));
    }

    setActiveCell(rowIndex, column) {
        this._updateUiState(ui => ({ ...ui, activeCell: { rowIndex, column }, inputMode: column }));
    }

    setInputValue(value) {
        this._updateUiState(ui => ({ ...ui, inputValue: String(value || '') }));
    }

    appendInputValue(key) {
        this._updateUiState(ui => ({ ...ui, inputValue: ui.inputValue + key }));
    }

    deleteLastInputChar() {
        this._updateUiState(ui => ({ ...ui, inputValue: ui.inputValue.slice(0, -1) }));
    }

    clearInputValue() {
        this._updateUiState(ui => ({ ...ui, inputValue: '' }));
    }

    toggleRowSelection(rowIndex) {
        this._updateUiState(ui => ({ ...ui, selectedRowIndex: (ui.selectedRowIndex === rowIndex) ? null : rowIndex }));
    }

    clearRowSelection() {
        this._updateUiState(ui => ({ ...ui, selectedRowIndex: null }));
    }

    toggleMultiSelectMode() {
        let isEnteringMode;
        this._updateUiState(ui => {
            isEnteringMode = !ui.isMultiSelectMode;
            const newSelectedIndexes = isEnteringMode && ui.selectedRowIndex !== null ? [ui.selectedRowIndex] : [];
            return { ...ui, isMultiSelectMode: isEnteringMode, multiSelectSelectedIndexes: newSelectedIndexes, selectedRowIndex: null };
        });
        return isEnteringMode;
    }
    
    toggleMultiSelectSelection(rowIndex) {
        this._updateUiState(ui => {
            const selectedIndexes = new Set(ui.multiSelectSelectedIndexes);
            if (selectedIndexes.has(rowIndex)) {
                selectedIndexes.delete(rowIndex);
            } else {
                selectedIndexes.add(rowIndex);
            }
            return { ...ui, multiSelectSelectedIndexes: Array.from(selectedIndexes) };
        });
    }

    clearMultiSelectSelection() {
        this._updateUiState(ui => ({ ...ui, multiSelectSelectedIndexes: [] }));
    }

    setSumOutdated(isOutdated) {
        this._updateUiState(ui => ({ ...ui, isSumOutdated: isOutdated }));
    }

    setCurrentView(viewName) {
        this._updateUiState(ui => ({ ...ui, currentView: viewName }));
    }

    setVisibleColumns(columns) {
        this._updateUiState(ui => ({ ...ui, visibleColumns: columns }));
    }
    
    setActiveTab(tabId) {
        this._updateUiState(ui => ({ ...ui, activeTabId: tabId }));
    }

    setLocationInputValue(value) {
        this._updateUiState(ui => ({ ...ui, locationInputValue: value }));
    }

    setTargetCell(cell) {
        this._updateUiState(ui => ({ ...ui, targetCell: cell }));
    }

    setActiveEditMode(mode) {
        this._updateUiState(ui => ({ ...ui, activeEditMode: mode }));
    }

    toggleLFSelection(rowIndex) {
        this._updateUiState(ui => {
            const selectedIndexes = new Set(ui.lfSelectedRowIndexes);
            if (selectedIndexes.has(rowIndex)) {
                selectedIndexes.delete(rowIndex);
            } else {
                selectedIndexes.add(rowIndex);
            }
            return { ...ui, lfSelectedRowIndexes: Array.from(selectedIndexes) };
        });
    }

    clearLFSelection() {
        this._updateUiState(ui => ({ ...ui, lfSelectedRowIndexes: [] }));
    }
    
    setDualChainMode(mode) {
        this._updateUiState(ui => ({ ...ui, dualChainMode: mode }));
    }

    setDualChainInputValue(value) {
        this._updateUiState(ui => ({ ...ui, dualChainInputValue: String(value || '') }));
    }
    
    clearDualChainInputValue() {
        this._updateUiState(ui => ({ ...ui, dualChainInputValue: '' }));
    }
    
    setDualPrice(price) {
        this._updateUiState(ui => ({ ...ui, dualPrice: price }));
    }

    setDriveAccessoryMode(mode) {
        this._updateUiState(ui => ({ ...ui, driveAccessoryMode: mode }));
    }
    
    setDriveAccessoryCount(accessory, count) {
        if (count < 0) return;
        this._updateUiState(ui => {
            const newUi = { ...ui };
            switch(accessory) {
                case 'remote': newUi.driveRemoteCount = count; break;
                case 'charger': newUi.driveChargerCount = count; break;
                case 'cord': newUi.driveCordCount = count; break;
            }
            return newUi;
        });
    }

    setDriveAccessoryTotalPrice(accessory, price) {
        this._updateUiState(ui => {
            const newUi = { ...ui };
            switch(accessory) {
                case 'winder': newUi.driveWinderTotalPrice = price; break;
                case 'motor': newUi.driveMotorTotalPrice = price; break;
                case 'remote': newUi.driveRemoteTotalPrice = price; break;
                case 'charger': newUi.driveChargerTotalPrice = price; break;
                case 'cord': newUi.driveCordTotalPrice = price; break;
            }
            return newUi;
        });
    }

    setDriveGrandTotal(price) {
        this._updateUiState(ui => ({ ...ui, driveGrandTotal: price }));
    }

    setSummaryWinderPrice(value) { this._updateUiState(ui => ({ ...ui, summaryWinderPrice: value })); }
    setSummaryMotorPrice(value) { this._updateUiState(ui => ({ ...ui, summaryMotorPrice: value })); }
    setSummaryRemotePrice(value) { this._updateUiState(ui => ({ ...ui, summaryRemotePrice: value })); }
    setSummaryChargerPrice(value) { this._updateUiState(ui => ({ ...ui, summaryChargerPrice: value })); }
    setSummaryCordPrice(value) { this._updateUiState(ui => ({ ...ui, summaryCordPrice: value })); }
    setSummaryAccessoriesTotal(value) { this._updateUiState(ui => ({ ...ui, summaryAccessoriesTotal: value })); }

    setF1RemoteDistribution(qty1, qty16) {
        this._updateUiState(ui => ({ ...ui, f1: { ...ui.f1, remote_1ch_qty: qty1, remote_16ch_qty: qty16 } }));
    }

    setF1DualDistribution(comboQty, slimQty) {
        this._updateUiState(ui => ({ ...ui, f1: { ...ui.f1, dual_combo_qty: comboQty, dual_slim_qty: slimQty } }));
    }

    setF1DiscountPercentage(percentage) {
        this._updateUiState(ui => ({ ...ui, f1: { ...ui.f1, discountPercentage: percentage } }));
    }

    setF2Value(key, value) {
        this._updateUiState(ui => {
            if (ui.f2.hasOwnProperty(key)) {
                return { ...ui, f2: { ...ui.f2, [key]: value } };
            }
            return ui;
        });
    }

    toggleF2FeeExclusion(feeType) {
        const key = `${feeType}FeeExcluded`;
        this._updateUiState(ui => {
            if (ui.f2.hasOwnProperty(key)) {
                return { ...ui, f2: { ...ui.f2, [key]: !ui.f2[key] } };
            }
            return ui;
        });
    }
}