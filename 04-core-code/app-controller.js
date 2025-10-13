// File: 04-core-code/app-controller.js

import { initialState } from './config/initial-state.js';

const AUTOSAVE_STORAGE_KEY = 'quoteAutoSaveData';
const AUTOSAVE_INTERVAL_MS = 60000;

export class AppController {
    constructor({ eventAggregator, stateService, quickQuoteView, detailConfigView, workflowService }) {
        this.eventAggregator = eventAggregator;
        this.stateService = stateService; // Still needed for _getFullState and _handleAutoSave
        this.quickQuoteView = quickQuoteView;
        this.detailConfigView = detailConfigView;
        this.workflowService = workflowService;

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
        this.eventAggregator.subscribe('userNavigatedToDetailView', () => this.workflowService.handleNavigationToDetailView());
        this.eventAggregator.subscribe('userNavigatedToQuickQuoteView', () => this.workflowService.handleNavigationToQuickQuoteView());
        this.eventAggregator.subscribe('userSwitchedTab', (data) => this.workflowService.handleTabSwitch(data));
        this.eventAggregator.subscribe('userRequestedLoad', () => this.workflowService.handleUserRequestedLoad());
        this.eventAggregator.subscribe('userChoseLoadDirectly', () => this.workflowService.handleLoadDirectly());
        this.eventAggregator.subscribe('fileLoaded', (data) => this.workflowService.handleFileLoad(data));
    }

    _subscribeF1Events() {
        this.eventAggregator.subscribe('f1TabActivated', () => this.workflowService.handleF1TabActivation());
        this.eventAggregator.subscribe('f1DiscountChanged', (data) => this.workflowService.handleF1DiscountChange(data));
        this.eventAggregator.subscribe('userRequestedRemoteDistribution', () => this.workflowService.handleRemoteDistribution());
        this.eventAggregator.subscribe('userRequestedDualDistribution', () => this.workflowService.handleDualDistribution());
    }

    _subscribeF2Events() {
        this.eventAggregator.subscribe('f2TabActivated', () => this.workflowService.handleF2TabActivation());
        this.eventAggregator.subscribe('f2ValueChanged', (data) => this.workflowService.handleF2ValueChange(data));
        this.eventAggregator.subscribe('f2InputEnterPressed', (data) => this.workflowService.focusNextF2Input(data.id));
        this.eventAggregator.subscribe('toggleFeeExclusion', (data) => this.workflowService.handleToggleFeeExclusion(data));
    }
    
    // This is a special method used by AppContext to publish state, it needs access to stateService.
    _getFullState() {
        return this.stateService.getState();
    }
    
    publishInitialState() {
        this.eventAggregator.publish('stateChanged', this._getFullState());
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