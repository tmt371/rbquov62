// /04-core-code/config-manager.js
import { f2Config } from './config/f2-config.js';
import { paths } from './config/paths.js';
import { EVENTS } from './config/constants.js';

export class ConfigManager {
    constructor(eventAggregator) {
        this.eventAggregator = eventAggregator;
        this.priceMatrices = null;
        this.accessories = null;
        this.f2Config = f2Config || {};
        this.fabricTypeSequence = null;
        this.businessRules = null; 
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            const response = await fetch(paths.data.priceMatrix);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.priceMatrices = data.matrices;
            this.accessories = data.accessories;
            this.fabricTypeSequence = data.fabricTypeSequence || [];
            this.businessRules = data.businessRules || {}; 
            this.isInitialized = true;
            console.log("ConfigManager initialized and price matrices loaded successfully.");

        } catch (error) {
            console.error("Failed to load price matrices:", error);
            this.eventAggregator.publish(EVENTS.SHOW_NOTIFICATION, {
                message: "Error: Could not load critical price data. The application may not function correctly.",
                type: 'error'
            });
        }
    }

    getPriceMatrix(fabricType) {
        if (!this.isInitialized || !this.priceMatrices) {
            console.error("ConfigManager not initialized or matrices not loaded.");
            return null;
        }
        const matrix = this.priceMatrices[fabricType];
        if (matrix && matrix.aliasFor) {
            return this.priceMatrices[matrix.aliasFor];
        }
        return matrix || null;
    }

    getAccessoryPrice(accessoryKey) {
        if (!this.isInitialized || !this.accessories) {
            console.error("ConfigManager not initialized or accessories not loaded.");
            return null;
        }
        const accessory = this.accessories[accessoryKey];
        if (accessory && typeof accessory.price === 'number') {
            return accessory.price;
        }
        console.error(`Accessory price for '${accessoryKey}' not found.`);
        return null;
    }

    getFabricTypeSequence() {
        if (!this.isInitialized || !this.fabricTypeSequence) {
            console.error("ConfigManager not initialized or fabricTypeSequence not loaded.");
            return [];
        }
        return this.fabricTypeSequence;
    }

    getF2Config() {
        return this.f2Config;
    }

    getValidationRules(productType) {
        if (!this.isInitialized || !this.businessRules) return null;
        return this.businessRules.validation?.[productType] || null;
    }

    getLogicThresholds() {
        if (!this.isInitialized || !this.businessRules) return null;
        return this.businessRules.logic || null;
    }

    getAccessoryMappings() {
        if (!this.isInitialized || !this.businessRules) return { accessoryPriceKeyMap: {}, accessoryMethodNameMap: {} };
        return this.businessRules.mappings || { accessoryPriceKeyMap: {}, accessoryMethodNameMap: {} };
    }
}