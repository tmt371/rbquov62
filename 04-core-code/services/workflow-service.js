// File: 04-core-code/services/workflow-service.js

/**
 * @fileoverview A dedicated service for coordinating complex, multi-step user workflows.
 * This service takes complex procedural logic out of the AppController.
 */
export class WorkflowService {
    constructor({ eventAggregator, stateService, uiService, quoteService }) {
        this.eventAggregator = eventAggregator;
        this.stateService = stateService;
        this.uiService = uiService;
        this.quoteService = quoteService;
        console.log("WorkflowService Initialized.");
    }

    handleRemoteDistribution() {
        const { ui } = this.stateService.getState();
        const totalRemoteCount = ui.driveRemoteCount || 0;

        const initial1ch = ui.f1.remote_1ch_qty;
        const initial16ch = (ui.f1.remote_16ch_qty === null) ? totalRemoteCount - initial1ch : ui.f1.remote_16ch_qty;

        this.eventAggregator.publish('showConfirmationDialog', {
            message: `Total remotes: ${totalRemoteCount}. Please distribute them.`,
            layout: [
                [
                    { type: 'text', text: '1-Ch Qty:', className: 'dialog-label' },
                    { type: 'input', id: 'dialog-input-1ch', value: initial1ch },
                    { type: 'text', text: '16-Ch Qty:', className: 'dialog-label' },
                    { type: 'input', id: 'dialog-input-16ch', value: initial16ch }
                ],
                [
                    {
                        type: 'button',
                        text: 'Confirm',
                        className: 'primary-confirm-button',
                        colspan: 2,
                        callback: () => {
                            const qty1ch = parseInt(document.getElementById('dialog-input-1ch').value, 10);
                            const qty16ch = parseInt(document.getElementById('dialog-input-16ch').value, 10);

                            if (isNaN(qty1ch) || isNaN(qty16ch) || qty1ch < 0 || qty16ch < 0) {
                                this.eventAggregator.publish('showNotification', { message: 'Quantities must be positive numbers.', type: 'error' });
                                return false;
                            }

                            if (qty1ch + qty16ch !== totalRemoteCount) {
                                this.eventAggregator.publish('showNotification', {
                                    message: `Total must equal ${totalRemoteCount}. Current total: ${qty1ch + qty16ch}.`,
                                    type: 'error'
                                });
                                return false;
                            }

                            this.uiService.setF1RemoteDistribution(qty1ch, qty16ch);
                            return true;
                        }
                    },
                    { type: 'button', text: 'Cancel', className: 'secondary', colspan: 2, callback: () => {} }
                ]
            ],
            onOpen: () => {
                const input1ch = document.getElementById('dialog-input-1ch');
                const input16ch = document.getElementById('dialog-input-16ch');

                input1ch.addEventListener('input', () => {
                    const qty1ch = parseInt(input1ch.value, 10);
                    if (!isNaN(qty1ch) && qty1ch >= 0 && qty1ch <= totalRemoteCount) {
                        input16ch.value = totalRemoteCount - qty1ch;
                    }
                });

                input16ch.addEventListener('input', () => {
                    const qty16ch = parseInt(input16ch.value, 10);
                    if (!isNaN(qty16ch) && qty16ch >= 0 && qty16ch <= totalRemoteCount) {
                        input1ch.value = totalRemoteCount - qty16ch;
                    }
                });

                setTimeout(() => {
                    input1ch.focus();
                    input1ch.select();
                }, 0);
            },
            closeOnOverlayClick: false
        });
    }

    handleDualDistribution() {
        const { quoteData, ui } = this.stateService.getState();
        const items = quoteData.products[quoteData.currentProduct].items;
        const totalDualPairs = Math.floor(items.filter(item => item.dual === 'D').length / 2);
    
        const initialCombo = (ui.f1.dual_combo_qty === null) ? totalDualPairs : ui.f1.dual_combo_qty;
        const initialSlim = (ui.f1.dual_slim_qty === null) ? 0 : ui.f1.dual_slim_qty;
    
        this.eventAggregator.publish('showConfirmationDialog', {
            message: `Total Dual pairs: ${totalDualPairs}. Please distribute them.`,
            layout: [
                [
                    { type: 'text', text: 'Combo Qty:', className: 'dialog-label' },
                    { type: 'input', id: 'dialog-input-combo', value: initialCombo },
                    { type: 'text', text: 'Slim Qty:', className: 'dialog-label' },
                    { type: 'input', id: 'dialog-input-slim', value: initialSlim }
                ],
                [
                    {
                        type: 'button',
                        text: 'Confirm',
                        className: 'primary-confirm-button',
                        colspan: 2,
                        callback: () => {
                            const qtyCombo = parseInt(document.getElementById('dialog-input-combo').value, 10);
                            const qtySlim = parseInt(document.getElementById('dialog-input-slim').value, 10);
    
                            if (isNaN(qtyCombo) || isNaN(qtySlim) || qtyCombo < 0 || qtySlim < 0) {
                                this.eventAggregator.publish('showNotification', { message: 'Quantities must be positive numbers.', type: 'error' });
                                return false;
                            }
    
                            if (qtyCombo + qtySlim !== totalDualPairs) {
                                this.eventAggregator.publish('showNotification', {
                                    message: `Total must equal ${totalDualPairs}. Current total: ${qtyCombo + qtySlim}.`,
                                    type: 'error'
                                });
                                return false;
                            }
    
                            this.uiService.setF1DualDistribution(qtyCombo, qtySlim);
                            return true;
                        }
                    },
                    { type: 'button', text: 'Cancel', className: 'secondary', colspan: 2, callback: () => {} }
                ]
            ],
            onOpen: () => {
                const inputCombo = document.getElementById('dialog-input-combo');
                const inputSlim = document.getElementById('dialog-input-slim');
    
                inputSlim.addEventListener('input', () => {
                    const qtySlim = parseInt(inputSlim.value, 10);
                    if (!isNaN(qtySlim) && qtySlim >= 0 && qtySlim <= totalDualPairs) {
                        inputCombo.value = totalDualPairs - qtySlim;
                    }
                });
    
                inputCombo.addEventListener('input', () => {
                    const qtyCombo = parseInt(inputCombo.value, 10);
                    if (!isNaN(qtyCombo) && qtyCombo >= 0 && qtyCombo <= totalDualPairs) {
                        inputSlim.value = totalDualPairs - qtyCombo;
                    }
                });
    
                setTimeout(() => {
                    inputSlim.focus();
                    inputSlim.select();
                }, 0);
            },
            closeOnOverlayClick: false
        });
    }
}