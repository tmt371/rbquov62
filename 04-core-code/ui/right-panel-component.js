/**
 * @fileoverview A dedicated component for managing and rendering the Right Panel UI.
 */
import { EVENTS, DOM_IDS } from '../config/constants.js';

export class RightPanelComponent {
    constructor(panelElement, eventAggregator, calculationService) {
        if (!panelElement) {
            throw new Error("Panel element is required for RightPanelComponent.");
        }
        this.panelElement = panelElement;
        this.eventAggregator = eventAggregator;
        this.calculationService = calculationService;
        this.state = null; 

        this.tabContainer = this.panelElement.querySelector('.tab-container');
        this.tabButtons = this.panelElement.querySelectorAll('.tab-button');
        this.tabContents = this.panelElement.querySelectorAll('.tab-content');

        this._cacheF1Elements();
        this._cacheF2Elements();
        this._cacheF4Elements();
        this.initialize();
        console.log("RightPanelComponent Initialized for F1 Cost Display.");
    }

    initialize() {
        if (this.tabContainer) {
            this.tabContainer.addEventListener('click', (event) => {
                const target = event.target.closest('.tab-button');
                if (target && !target.disabled) {
                    this._setActiveTab(target);
                }
            });
        }

        const panelToggle = document.getElementById(DOM_IDS.FUNCTION_PANEL_TOGGLE);
        if (panelToggle) {
            panelToggle.addEventListener('click', () => {
                this.panelElement.classList.toggle('is-expanded');
            });
        }
        
        if (this.f1.rbDiscountInput) {
            this.f1.rbDiscountInput.addEventListener('change', (e) => {
                const percentage = parseFloat(e.target.value);
                if (!isNaN(percentage)) {
                    this.eventAggregator.publish(EVENTS.F1_DISCOUNT_CHANGED, { percentage });
                }
            });
        }
    }

    _cacheF1Elements() {
        this.f1 = {
            qtyWinder: document.getElementById(DOM_IDS.F1_QTY_WINDER),
            priceWinder: document.getElementById(DOM_IDS.F1_PRICE_WINDER),
            qtyMotor: document.getElementById(DOM_IDS.F1_QTY_MOTOR),
            priceMotor: document.getElementById(DOM_IDS.F1_PRICE_MOTOR),
            qtyRemote1ch: document.getElementById(DOM_IDS.F1_QTY_REMOTE_1CH),
            priceRemote1ch: document.getElementById(DOM_IDS.F1_PRICE_REMOTE_1CH),
            qtyRemote16ch: document.getElementById(DOM_IDS.F1_QTY_REMOTE_16CH),
            priceRemote16ch: document.getElementById(DOM_IDS.F1_PRICE_REMOTE_16CH),
            qtyCharger: document.getElementById(DOM_IDS.F1_QTY_CHARGER),
            priceCharger: document.getElementById(DOM_IDS.F1_PRICE_CHARGER),
            qty3mCord: document.getElementById(DOM_IDS.F1_QTY_3M_CORD),
            price3mCord: document.getElementById(DOM_IDS.F1_PRICE_3M_CORD),
            qtyDualCombo: document.getElementById(DOM_IDS.F1_QTY_DUAL_COMBO),
            priceDualCombo: document.getElementById(DOM_IDS.F1_PRICE_DUAL_COMBO),
            qtySlim: document.getElementById(DOM_IDS.F1_QTY_SLIM),
            priceSlim: document.getElementById(DOM_IDS.F1_PRICE_SLIM),
            priceTotal: document.getElementById(DOM_IDS.F1_PRICE_TOTAL),
            
            rbRetail: document.getElementById(DOM_IDS.F1_RB_RETAIL),
            rbDiscountInput: document.getElementById(DOM_IDS.F1_RB_DISCOUNT_INPUT),
            rbPrice: document.getElementById(DOM_IDS.F1_RB_PRICE),

            subTotal: document.getElementById(DOM_IDS.F1_SUB_TOTAL),
            gst: document.getElementById(DOM_IDS.F1_GST),
            finalTotal: document.getElementById(DOM_IDS.F1_FINAL_TOTAL),
        };
    }

    _cacheF2Elements() {
        this.f2 = {
            b10_wifiQty: document.getElementById('f2-b10-wifi-qty'),
            c10_wifiSum: document.getElementById('f2-c10-wifi-sum'),
            b13_deliveryQty: document.getElementById('f2-b13-delivery-qty'),
            c13_deliveryFee: document.getElementById('f2-c13-delivery-fee'),
            b14_installQty: document.getElementById('f2-b14-install-qty'),
            c14_installFee: document.getElementById('f2-c14-install-fee'),
            b15_removalQty: document.getElementById('f2-b15-removal-qty'),
            c15_removalFee: document.getElementById('f2-c15-removal-fee'),
            b17_mulTimes: document.getElementById('f2-b17-mul-times'),
            b18_discount: document.getElementById('f2-b18-discount'),
            b20_singleprofit: document.getElementById('f2-b20-singleprofit'),
            c17_1stRbPrice: document.getElementById('f2-c17-1st-rb-price'),
            b21_rbProfit: document.getElementById('f2-b21-rb-profit'),
            b22_sumprice: document.getElementById('f2-b22-sumprice'),
            b23_sumprofit: document.getElementById('f2-b23-sumprofit'),
            b24_gst: document.getElementById('f2-b24-gst'),
            b25_netprofit: document.getElementById('f2-b25-netprofit'),
        };

        const feeToggles = this.panelElement.querySelectorAll('.fee-toggle');
        feeToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const feeType = toggle.dataset.feeType;
                if (feeType) {
                    this.eventAggregator.publish(EVENTS.TOGGLE_FEE_EXCLUSION, { feeType });
                }
            });
        });

        const f2Inputs = this.panelElement.querySelectorAll('.f2-summary-grid .grid-cell-input');
        f2Inputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.eventAggregator.publish(EVENTS.F2_VALUE_CHANGED, { id: e.target.id, value: e.target.value });
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.eventAggregator.publish(EVENTS.F2_INPUT_ENTER_PRESSED, { id: e.target.id });
                }
            });
        });
    }

    _cacheF4Elements() {
        this.f4 = {
            saveButton: document.getElementById('f1-key-save'),
            loadButton: document.getElementById('f1-key-load'),
            exportCsvButton: document.getElementById('f1-key-export-csv'),
            resetButton: document.getElementById('f1-key-reset'),
            remoteDistButton: document.getElementById('f1-key-remote-dist'),
            dualDistButton: document.getElementById('f1-key-dual-dist'),
        };

        this.f4.saveButton.addEventListener('click', () => this.eventAggregator.publish(EVENTS.USER_REQUESTED_SAVE));
        this.f4.loadButton.addEventListener('click', () => this.eventAggregator.publish(EVENTS.USER_REQUESTED_LOAD));
        this.f4.exportCsvButton.addEventListener('click', () => this.eventAggregator.publish(EVENTS.USER_REQUESTED_EXPORT_CSV));
        this.f4.resetButton.addEventListener('click', () => this.eventAggregator.publish(EVENTS.USER_REQUESTED_RESET));
        this.f4.remoteDistButton.addEventListener('click', () => this.eventAggregator.publish(EVENTS.USER_REQUESTED_REMOTE_DISTRIBUTION));
        this.f4.dualDistButton.addEventListener('click', () => this.eventAggregator.publish(EVENTS.USER_REQUESTED_DUAL_DISTRIBUTION));
    }

    render(state) {
        this.state = state;
        const activeTabContentId = this.tabContainer.querySelector('.active')?.dataset.tabTarget;
        
        if (activeTabContentId === '#f1-content') {
            this._renderF1();
        } else if (activeTabContentId === '#f2-content') {
            this._renderF2();
        }
    }

    _renderF1() {
        const { quoteData, ui } = this.state;
        const items = quoteData.products.rollerBlind.items;

        const formatPrice = (value) => (value != null) ? `$${value.toFixed(2)}` : '';
        const formatQty = (value) => (value != null && value > 0) ? value : '';
        
        const winderCount = items.filter(item => item.winder === 'HD').length;
        const winderPrice = this.calculationService.calculateAccessorySalePrice('rollerBlind', 'winder', { count: winderCount });
        this.f1.qtyWinder.textContent = formatQty(winderCount);
        this.f1.priceWinder.textContent = formatPrice(winderPrice);

        const motorCount = items.filter(item => !!item.motor).length;
        const motorPrice = this.calculationService.calculateAccessorySalePrice('rollerBlind', 'motor', { count: motorCount });
        this.f1.qtyMotor.textContent = formatQty(motorCount);
        this.f1.priceMotor.textContent = formatPrice(motorPrice);

        const remote1chQty = ui.f1.remote_1ch_qty;
        const remote16chQty = ui.f1.remote_16ch_qty ?? (ui.driveRemoteCount - remote1chQty);
        const remote1chPrice = this.calculationService.calculateAccessorySalePrice('rollerBlind', 'remote-1ch', { count: remote1chQty });
        const remote16chPrice = this.calculationService.calculateAccessorySalePrice('rollerBlind', 'remote-16ch', { count: remote16chQty });
        this.f1.qtyRemote1ch.textContent = formatQty(remote1chQty);
        this.f1.priceRemote1ch.textContent = formatPrice(remote1chPrice);
        this.f1.qtyRemote16ch.textContent = formatQty(remote16chQty);
        this.f1.priceRemote16ch.textContent = formatPrice(remote16chPrice);

        const chargerCount = ui.driveChargerCount;
        const chargerPrice = this.calculationService.calculateAccessorySalePrice('rollerBlind', 'charger', { count: chargerCount });
        this.f1.qtyCharger.textContent = formatQty(chargerCount);
        this.f1.priceCharger.textContent = formatPrice(chargerPrice);

        const cordCount = ui.driveCordCount;
        const cordPrice = this.calculationService.calculateAccessorySalePrice('rollerBlind', 'cord', { count: cordCount });
        this.f1.qty3mCord.textContent = formatQty(cordCount);
        this.f1.price3mCord.textContent = formatPrice(cordPrice);
        
        const dualComboQty = ui.f1.dual_combo_qty ?? Math.floor(items.filter(i => i.dual === 'D').length / 2);
        const dualSlimQty = ui.f1.dual_slim_qty ?? 0;
        const dualComboPrice = this.calculationService.calculateAccessorySalePrice('rollerBlind', 'dual-combo', { count: dualComboQty });
        const dualSlimPrice = this.calculationService.calculateAccessorySalePrice('rollerBlind', 'slim', { count: dualSlimQty });
        this.f1.qtyDualCombo.textContent = formatQty(dualComboQty);
        this.f1.priceDualCombo.textContent = formatPrice(dualComboPrice);
        this.f1.qtySlim.textContent = formatQty(dualSlimQty);
        this.f1.priceSlim.textContent = formatPrice(dualSlimPrice);

        const componentTotal = winderPrice + motorPrice + remote1chPrice + remote16chPrice + chargerPrice + cordPrice + dualComboPrice + dualSlimPrice;
        this.f1.priceTotal.textContent = formatPrice(componentTotal);
        
        const retailTotal = quoteData.products.rollerBlind.summary.totalSum || 0;
        this.f1.rbRetail.textContent = formatPrice(retailTotal);

        const discountPercentage = ui.f1.discountPercentage || 0;
        if (document.activeElement !== this.f1.rbDiscountInput) {
            this.f1.rbDiscountInput.value = discountPercentage > 0 ? discountPercentage : '';
        }

        const discountedPrice = retailTotal * (1 - (discountPercentage / 100));
        this.f1.rbPrice.textContent = formatPrice(discountedPrice);

        const subTotal = componentTotal + discountedPrice;
        const gst = subTotal * 0.10;
        const finalTotal = subTotal + gst;

        this.f1.subTotal.textContent = formatPrice(subTotal);
        this.f1.gst.textContent = formatPrice(gst);
        this.f1.finalTotal.textContent = formatPrice(finalTotal);
    }

    _renderF2() {
        const { quoteData, ui } = this.state;
        const f2State = ui.f2;
        
        const formatValue = (value) => (value != null) ? value : '';
        const formatPrice = (value) => (value != null) ? `$${value.toFixed(2)}` : '';

        this.f2.c10_wifiSum.textContent = formatPrice(f2State.wifiSum);
        this.f2.c13_deliveryFee.textContent = formatPrice(f2State.deliveryFee);
        this.f2.c14_installFee.textContent = formatPrice(f2State.installFee);
        this.f2.c15_removalFee.textContent = formatPrice(f2State.removalFee);
        this.f2.b20_singleprofit.textContent = formatPrice(f2State.singleprofit);
        this.f2.c17_1stRbPrice.textContent = formatPrice(f2State.firstRbPrice);
        this.f2.b21_rbProfit.textContent = formatPrice(f2State.rbProfit);
        this.f2.b22_sumprice.textContent = formatPrice(f2State.sumPrice);
        this.f2.b23_sumprofit.textContent = formatPrice(f2State.sumProfit);
        this.f2.b24_gst.textContent = formatPrice(f2State.gst);
        this.f2.b25_netprofit.textContent = formatPrice(f2State.netProfit);

        if (document.activeElement !== this.f2.b10_wifiQty) this.f2.b10_wifiQty.value = formatValue(f2State.wifiQty);
        if (document.activeElement !== this.f2.b13_deliveryQty) this.f2.b13_deliveryQty.value = formatValue(f2State.deliveryQty);
        if (document.activeElement !== this.f2.b14_installQty) this.f2.b14_installQty.value = formatValue(f2State.installQty);
        if (document.activeElement !== this.f2.b15_removalQty) this.f2.b15_removalQty.value = formatValue(f2State.removalQty);
        if (document.activeElement !== this.f2.b17_mulTimes) this.f2.b17_mulTimes.value = formatValue(f2State.mulTimes);
        if (document.activeElement !== this.f2.b18_discount) this.f2.b18_discount.value = formatValue(f2State.discount);

        this.f2.c13_deliveryFee.classList.toggle('is-excluded', f2State.deliveryFeeExcluded);
        this.f2.c14_installFee.classList.toggle('is-excluded', f2State.installFeeExcluded);
        this.f2.c15_removalFee.classList.toggle('is-excluded', f2State.removalFeeExcluded);
    }

    _setActiveTab(clickedButton) {
        const targetContentId = clickedButton.dataset.tabTarget;

        this.tabButtons.forEach(button => {
            button.classList.toggle('active', button === clickedButton);
        });

        this.tabContents.forEach(content => {
            content.classList.toggle('active', `#${content.id}` === targetContentId);
        });

        if (targetContentId === '#f1-content') {
            this.eventAggregator.publish(EVENTS.F1_TAB_ACTIVATED);
        } else if (targetContentId === '#f2-content') {
            this.eventAggregator.publish(EVENTS.F2_TAB_ACTIVATED);
        }
    }
}