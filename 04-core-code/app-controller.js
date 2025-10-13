// File: 04-core-code/app-controller.js

import { initialState } from './config/initial-state.js';

const AUTOSAVE_STORAGE_KEY = 'quoteAutoSaveData';
const AUTOSAVE_INTERVAL_MS = 60000;

export class AppController {
    constructor({ eventAggregator, stateService, uiService, quoteService, fileService, quickQuoteView, detailConfigView, calculationService, productFactory, workflowService }) {
        this.eventAggregator = eventAggregator;
        this.stateService = stateService;
        this.uiService = uiService;
        this.quoteService = quoteService;
        this.fileService = fileService;
        this.quickQuoteView = quickQuoteView;
        this.detailConfigView = detailConfigView;
        this.calculationService = calculationService;
        this.productFactory = productFactory;
        this.workflowService = workflowService;

        this.f2InputSequence = [
            'f2-b10-wifi-qty', 'f2-b13-delivery-qty', 'f2-b14-install-qty',
            'f2-b15-removal-qty', 'f2-b17-mul-times', 'f2-b18-discount'
        ];

        this.autoSaveTimerId = null;
        console.log("AppController (Refactored with grouped subscriptions) Initialized.");
        this.initialize();
    }

    initialize() {
        this._subscribeQuickQuoteEvents();
        this._subscribeDetailViewEvents();
        this._subscribeGlobalEvents();
        this._subscribeF1Events();
        this._subscribeF2Events();
        
        // This is the core of the reactive state update.
        // Any service that updates the state via StateService will trigger this,
        // which in turn re-renders the UI.
        this.eventAggregator.subscribe('_internalStateUpdated', (newState) => {
            this.eventAggregator.publish('stateChanged', newState);
        });

        this._startAutoSave();
    }
    
    _subscribeQuickQuoteEvents() {
        const delegate = (handlerName, ...args) => this.quickQuoteView[handlerName](...args);

        this.eventAggregator.subscribe('numericKeyPressed', (data) => delegate('handleNumericKeyPress', data));
        this.eventAggregator.subscribe('userRequestedInsertRow', () => delegate('handleInsertRow'));
        this.eventAggregator.subscribe('userRequestedDeleteRow', () => delegate('handleDeleteRow'));
        this.eventAggregator.subscribe('userRequestedSave', () => delegate('handleSaveToFile'));
        this.eventAggregator.subscribe('userRequestedExportCSV', () => delegate('handleExportCSV'));
        this.eventAggregator.subscribe('userRequestedReset', () => delegate('handleReset', initialState.ui));
        this.eventAggregator.subscribe('userRequestedClearRow', () => delegate('handleClearRow'));
        this.eventAggregator.subscribe('userMovedActiveCell', (data) => delegate('handleMoveActiveCell', data));
        this.eventAggregator.subscribe('userRequestedCycleType', () => delegate('handleCycleType'));
        this.eventAggregator.subscribe('userRequestedCalculateAndSum', () => delegate('handleCalculateAndSum'));
        this.eventAggregator.subscribe('userToggledMultiSelectMode', () => delegate('handleToggleMultiSelectMode'));
        this.eventAggregator.subscribe('userChoseSaveThenLoad', () => delegate('handleSaveThenLoad'));
        this.eventAggregator.subscribe('typeCellLongPressed', (data) => delegate('handleTypeCellLongPress', data));
        this.eventAggregator.subscribe('typeButtonLongPressed', (data) => delegate('handleTypeButtonLongPress', data));
        this.eventAggregator.subscribe('userRequestedMultiTypeSet', () => delegate('handleMultiTypeSet'));
    }

    _subscribeDetailViewEvents() {
        const delegate = (handlerName, data) => {
            const { ui } = this.stateService.getState();
            if (ui.currentView === 'DETAIL_CONFIG') {
                this.detailConfigView[handlerName](data);
            }
        };
        
        this.eventAggregator.subscribe('tableCellClicked', (data) => {
            const { ui } = this.stateService.getState();
            if (ui.currentView === 'QUICK_QUOTE') {
                this.quickQuoteView.handleTableCellClick(data);
            } else {
                this.detailConfigView.handleTableCellClick(data);
            }
        });
         this.eventAggregator.subscribe('sequenceCellClicked', (data) => {
            const { ui } = this.stateService.getState();
            if (ui.currentView === 'QUICK_QUOTE') {
                this.quickQuoteView.handleSequenceCellClick(data);
            } else {
                this.detailConfigView.handleSequenceCellClick(data);
            }
        });

        // Detail Config View Specific Events
        this.eventAggregator.subscribe('userRequestedFocusMode', (data) => delegate('handleFocusModeRequest', data));
        this.eventAggregator.subscribe('panelInputEnterPressed', (data) => delegate('handlePanelInputEnter', data));
        this.eventAggregator.subscribe('panelInputBlurred', (data) => delegate('handlePanelInputBlur', data));
        this.eventAggregator.subscribe('locationInputEnterPressed', (data) => delegate('handleLocationInputEnter', data));
        this.eventAggregator.subscribe('userRequestedLFEditMode', () => delegate('handleLFEditRequest'));
        this.eventAggregator.subscribe('userRequestedLFDeleteMode', () => delegate('handleLFDeleteMode'));
        this.eventAggregator.subscribe('userToggledK3EditMode', () => delegate('handleToggleK3EditMode'));
        this.eventAggregator.subscribe('userRequestedBatchCycle', (data) => delegate('handleBatchCycle', data));
        
        this.eventAggregator.subscribe('dualChainModeChanged', (data) => delegate('handleDualChainModeChange', data));
        this.eventAggregator.subscribe('chainEnterPressed', (data) => delegate('handleChainEnterPressed', data));
        this.eventAggregator.subscribe('driveModeChanged', (data) => delegate('handleDriveModeChange', data));
        this.eventAggregator.subscribe('accessoryCounterChanged', (data) => delegate('handleAccessoryCounterChange', data));
    }

    _subscribeGlobalEvents() {
        this.eventAggregator.subscribe('userNavigatedToDetailView', () => this._handleNavigationToDetailView());
        this.eventAggregator.subscribe('userNavigatedToQuickQuoteView', () => this._handleNavigationToQuickQuoteView());
        this.eventAggregator.subscribe('userSwitchedTab', (data) => this._handleTabSwitch(data));
        this.eventAggregator.subscribe('userRequestedLoad', () => this._handleUserRequestedLoad());
        this.eventAggregator.subscribe('userChoseLoadDirectly', () => this._handleLoadDirectly());
        this.eventAggregator.subscribe('fileLoaded', (data) => this._handleFileLoad(data));
    }

    _subscribeF1Events() {
        this.eventAggregator.subscribe('f1TabActivated', () => this._handleF1TabActivation());
        this.eventAggregator.subscribe('f1DiscountChanged', (data) => this._handleF1DiscountChange(data));
        this.eventAggregator.subscribe('userRequestedRemoteDistribution', () => this._handleRemoteDistributionRequest());
        this.eventAggregator.subscribe('userRequestedDualDistribution', () => this._handleDualDistributionRequest());
    }

    _subscribeF2Events() {
        this.eventAggregator.subscribe('f2TabActivated', () => this._handleF2TabActivation());
        this.eventAggregator.subscribe('f2ValueChanged', (data) => this._handleF2ValueChange(data));
        this.eventAggregator.subscribe('f2InputEnterPressed', (data) => this._focusNextF2Input(data.id));
        this.eventAggregator.subscribe('toggleFeeExclusion', (data) => this._handleToggleFeeExclusion(data));
    }

    _handleF1TabActivation() {
        this.workflowService.handleF1TabActivation();
    }

    _handleF1DiscountChange({ percentage }) {
        this.uiService.setF1DiscountPercentage(percentage);
        this.eventAggregator.publish('stateChanged', this.stateService.getState());
    }
    
    _handleToggleFeeExclusion({ feeType }) {
        this.uiService.toggleF2FeeExclusion(feeType);
        this._calculateF2Summary();
    }

    _handleF2ValueChange({ id, value }) {
        const numericValue = value === '' ? null : parseFloat(value);
        let keyToUpdate = null;

        switch (id) {
            case 'f2-b10-wifi-qty': keyToUpdate = 'wifiQty'; break;
            case 'f2-b13-delivery-qty': keyToUpdate = 'deliveryQty'; break;
            case 'f2-b14-install-qty': keyToUpdate = 'installQty'; break;
            case 'f2-b15-removal-qty': keyToUpdate = 'removalQty'; break;
            case 'f2-b17-mul-times': keyToUpdate = 'mulTimes'; break;
            case 'f2-b18-discount': keyToUpdate = 'discount'; break;
        }

        if (keyToUpdate) {
            this.uiService.setF2Value(keyToUpdate, numericValue);
            this._calculateF2Summary();
        }
    }

    _focusNextF2Input(currentId) {
        const currentIndex = this.f2InputSequence.indexOf(currentId);
        if (currentIndex > -1) {
            const nextIndex = (currentIndex + 1) % this.f2InputSequence.length;
            const nextElementId = this.f2InputSequence[nextIndex];
            this.eventAggregator.publish('focusElement', { elementId: nextElementId });
        }
    }
    
    _handleF2TabActivation() {
        this.workflowService.handleF2TabActivation();
    }

    _calculateF2Summary() {
        const { quoteData, ui } = this.stateService.getState();
        const summaryValues = this.calculationService.calculateF2Summary(quoteData, ui);

        for (const key in summaryValues) {
            this.uiService.setF2Value(key, summaryValues[key]);
        }
    }
    
    _handleNavigationToDetailView() {
        const { ui } = this.stateService.getState();
        if (ui.currentView === 'QUICK_QUOTE') {
            this.uiService.setCurrentView('DETAIL_CONFIG');
            this.detailConfigView.activateTab('k1-tab'); 
        } else {
            this.uiService.setCurrentView('QUICK_QUOTE');
            this.uiService.setVisibleColumns(initialState.ui.visibleColumns);
        }
    }

    _handleNavigationToQuickQuoteView() {
        this.uiService.setCurrentView('QUICK_QUOTE');
        this.uiService.setVisibleColumns(initialState.ui.visibleColumns);
    }

    _handleTabSwitch({ tabId }) {
        this.detailConfigView.activateTab(tabId);
    }

    _handleUserRequestedLoad() {
        if (this.quoteService.hasData()) {
            this.eventAggregator.publish('showLoadConfirmationDialog');
        } else {
            this.eventAggregator.publish('triggerFileLoad');
        }
    }

    _handleLoadDirectly() {
        this.eventAggregator.publish('triggerFileLoad');
    }

    _handleFileLoad({ fileName, content }) {
        const result = this.fileService.parseFileContent(fileName, content);
        if (result.success) {
            const currentState = this.stateService.getState();
            this.stateService.updateState({
                ...currentState,
                quoteData: result.data,
                ui: { ...initialState.ui, isSumOutdated: true }
            });
            this.eventAggregator.publish('showNotification', { message: result.message });
        } else {
            this.eventAggregator.publish('showNotification', { message: result.message, type: 'error' });
        }
    }
    
    _getFullState() {
        return this.stateService.getState();
    }
    
    publishInitialState() {
        this.eventAggregator.publish('stateChanged', this._getFullState());
    }

    _handleRemoteDistributionRequest() {
        this.workflowService.handleRemoteDistribution();
    }

    _handleDualDistributionRequest() {
        this.workflowService.handleDualDistribution();
    }

    _startAutoSave() {
        if (this.autoSaveTimerId) { clearInterval(this.autoSaveTimerId); }
        this.autoSaveTimerId = setInterval(() => this._handleAutoSave(), AUTOSAVE_INTERVAL_MS);
    }

    _handleAutoSave() {
        try {
            const { quoteData } = this.stateService.getState();
            const items = quoteData.products[quoteData.currentProduct].items;
            if (!items) return;
            const hasContent = items.length > 1 || (items.length === 1 && (items[0].width || items[0].height));
            if (hasContent) {
                const dataToSave = JSON.stringify(quoteData);
                localStorage.setItem(AUTOSAVE_STORAGE_KEY, dataToSave);
            }
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }
}