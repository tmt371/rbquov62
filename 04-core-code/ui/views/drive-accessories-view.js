// File: 04-core-code/ui/views/drive-accessories-view.js

import { EVENTS } from '../../config/constants.js';

/**
 * @fileoverview A dedicated sub-view for handling all logic related to the Drive/Accessories tab.
 */
export class DriveAccessoriesView {
    constructor({ quoteService, uiService, calculationService, eventAggregator, publishStateChangeCallback }) {
        this.quoteService = quoteService;
        this.uiService = uiService;
        this.calculationService = calculationService;
        this.eventAggregator = eventAggregator;
        this.publish = publishStateChangeCallback;
        console.log("DriveAccessoriesView Initialized.");
    }

    activate() {
        this.uiService.setVisibleColumns(['sequence', 'fabricTypeDisplay', 'location', 'winder', 'motor']);
    }

    handleModeChange({ mode }) {
        const currentMode = this.uiService.getState().driveAccessoryMode;
        const newMode = currentMode === mode ? null : mode;

        if (currentMode === 'winder') {
            const isValid = this._validateWinderSelection();
            if (!isValid) {
                return; 
            }
        }

        if (currentMode) {
            this.recalculateAllDriveAccessoryPrices();
        }
        
        this.uiService.setDriveAccessoryMode(newMode);

        if (newMode) {
            if (newMode === 'remote' || newMode === 'charger') {
                const items = this.quoteService.getItems();
                const hasMotor = items.some(item => !!item.motor);
                const state = this.uiService.getState();
                const currentCount = newMode === 'remote' ? state.driveRemoteCount : state.driveChargerCount;

                if (hasMotor && (currentCount === 0 || currentCount === null)) {
                    this.uiService.setDriveAccessoryCount(newMode, 1);
                }
            }

            const message = this._getHintMessage(newMode);
            this.eventAggregator.publish(EVENTS.SHOW_NOTIFICATION, { message });
        }

        this.publish();
    }

    handleTableCellClick({ rowIndex, column }) {
        const { driveAccessoryMode } = this.uiService.getState();
        if (!driveAccessoryMode || (column !== 'winder' && column !== 'motor')) return;

        const items = this.quoteService.getItems();
        const item = items[rowIndex];
        if (!item) return;

        const isLastRow = rowIndex === items.length - 1;
        if (isLastRow) return;

        const isActivatingWinder = driveAccessoryMode === 'winder' && column === 'winder';
        const isActivatingMotor = driveAccessoryMode === 'motor' && column === 'motor';

        if (isActivatingWinder) {
            if (item.motor) {
                this.eventAggregator.publish(EVENTS.SHOW_CONFIRMATION_DIALOG, {
                    message: 'This blind is set to Motor. Are you sure you want to change it to HD Winder?',
                    layout: [
                        [
                            { type: 'button', text: 'Confirm', callback: () => this._toggleWinder(rowIndex) },
                            { type: 'button', text: 'Cancel', className: 'secondary', callback: () => {} }
                        ]
                    ]
                });
            } else {
                this._toggleWinder(rowIndex);
            }
        } else if (isActivatingMotor) {
            if (item.winder) {
                this.eventAggregator.publish(EVENTS.SHOW_CONFIRMATION_DIALOG, {
                    message: 'This blind is set to HD Winder. Are you sure you want to change it to Motor?',
                    layout: [
                        [
                            { type: 'button', text: 'Confirm', callback: () => this._toggleMotor(rowIndex) },
                            { type: 'button', text: 'Cancel', className: 'secondary', callback: () => {} }
                        ]
                    ]
                });
            } else {
                this._toggleMotor(rowIndex);
            }
        }
    }
    
    handleCounterChange({ accessory, direction }) {
        const state = this.uiService.getState();
        const counts = {
            remote: state.driveRemoteCount,
            charger: state.driveChargerCount,
            cord: state.driveCordCount
        };
        let currentCount = counts[accessory];
        const newCount = direction === 'add' ? currentCount + 1 : Math.max(0, currentCount - 1);

        if (newCount === 0) {
            const items = this.quoteService.getItems();
            const hasMotor = items.some(item => !!item.motor);
            if (hasMotor && (accessory === 'remote' || accessory === 'charger')) {
                const accessoryName = accessory === 'remote' ? 'Remote' : 'Charger';
                this.eventAggregator.publish(EVENTS.SHOW_CONFIRMATION_DIALOG, {
                    message: `Motors are present in the quote. Are you sure you want to set the ${accessoryName} quantity to 0?`,
                    layout: [
                        [
                            { type: 'button', text: 'Confirm', callback: () => {
                                this.uiService.setDriveAccessoryCount(accessory, 0);
                                this.publish();
                            }},
                            { type: 'button', text: 'Cancel', className: 'secondary', callback: () => {} }
                        ]
                    ]
                });
                return; 
            }
        }
        
        this.uiService.setDriveAccessoryCount(accessory, newCount);
        this.publish();
    }

    _toggleWinder(rowIndex) {
        const item = this.quoteService.getItems()[rowIndex];
        const newValue = item.winder ? '' : 'HD';
        this.quoteService.updateWinderMotorProperty(rowIndex, 'winder', newValue);
        this.publish();
    }

    _toggleMotor(rowIndex) {
        const item = this.quoteService.getItems()[rowIndex];
        const newValue = item.motor ? '' : 'Motor';
        this.quoteService.updateWinderMotorProperty(rowIndex, 'motor', newValue);
        this.publish();
    }
    
    _validateWinderSelection() {
        const items = this.quoteService.getItems();
        const selectedIndexes = items.reduce((acc, item, index) => {
            if (item.winder === 'HD') {
                acc.push(index);
            }
            return acc;
        }, []);

        const winderCount = selectedIndexes.length;

        if (winderCount > 0 && winderCount % 2 !== 0) {
            this.eventAggregator.publish(EVENTS.SHOW_NOTIFICATION, {
                message: 'The total count of HD Winders must be an even number. Please correct the selection.',
                type: 'error'
            });
            return false;
        }

        for (let i = 0; i < winderCount; i += 2) {
            if (selectedIndexes[i+1] !== selectedIndexes[i] + 1) {
                this.eventAggregator.publish(EVENTS.SHOW_NOTIFICATION, {
                    message: 'HD Winders must be set on adjacent items. Please check your selection.',
                    type: 'error'
                });
                return false;
            }
        }
        
        return true;
    }

    recalculateAllDriveAccessoryPrices() {
        const items = this.quoteService.getItems();
        const state = this.uiService.getState();
        const productType = this.quoteService.getCurrentProductType();
        const summaryData = {};
        let grandTotal = 0;

        const winderCount = items.filter(item => item.winder === 'HD').length;
        const winderPrice = this.calculationService.calculateAccessorySalePrice(productType, 'winder', { count: winderCount });
        this.uiService.setDriveAccessoryTotalPrice('winder', winderPrice);
        summaryData.winder = { count: winderCount, price: winderPrice };
        grandTotal += winderPrice;

        const motorCount = items.filter(item => !!item.motor).length;
        const motorPrice = this.calculationService.calculateAccessorySalePrice(productType, 'motor', { count: motorCount });
        this.uiService.setDriveAccessoryTotalPrice('motor', motorPrice);
        summaryData.motor = { count: motorCount, price: motorPrice };
        grandTotal += motorPrice;
        
        const remoteCount = state.driveRemoteCount;
        const remotePrice = this.calculationService.calculateAccessorySalePrice(productType, 'remote', { 
            count: remoteCount
        });
        this.uiService.setDriveAccessoryTotalPrice('remote', remotePrice);
        summaryData.remote = { type: 'standard', count: remoteCount, price: remotePrice };
        grandTotal += remotePrice;

        const chargerCount = state.driveChargerCount;
        const chargerPrice = this.calculationService.calculateAccessorySalePrice(productType, 'charger', { count: chargerCount });
        this.uiService.setDriveAccessoryTotalPrice('charger', chargerPrice);
        summaryData.charger = { count: chargerCount, price: chargerPrice };
        grandTotal += chargerPrice;

        const cordCount = state.driveCordCount;
        const cordPrice = this.calculationService.calculateAccessorySalePrice(productType, 'cord', { count: cordCount });
        this.uiService.setDriveAccessoryTotalPrice('cord', cordPrice);
        summaryData.cord3m = { count: cordCount, price: cordPrice };
        grandTotal += cordPrice;

        this.uiService.setDriveGrandTotal(grandTotal);
        this.quoteService.updateAccessorySummary({
            winderCostSum: winderPrice,
            motorCostSum: motorPrice,
            remoteCostSum: remotePrice,
            chargerCostSum: chargerPrice,
            cordCostSum: cordPrice
        });
    }

    _getHintMessage(mode) {
        const hints = {
            winder: 'Click a cell under the Winder column to set HD.',
            motor: 'Click a cell under the Motor column to set Motor.',
            remote: 'Click + or - to increase or decrease the quantity of remotes.',
            charger: 'Click + or - to increase or decrease the quantity of chargers.',
            cord: 'Click + or - to increase or decrease the quantity of extension cords.'
        };
        return hints[mode] || 'Please make your selection.';
    }
}