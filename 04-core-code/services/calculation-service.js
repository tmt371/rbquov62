// /04-core-code/services/calculation-service.js

/**
 * @fileoverview Service for handling all price and sum calculations.
 * Acts as a generic executor that delegates product-specific logic to a strategy.
 */
export class CalculationService {
    constructor({ stateService, productFactory, configManager }) {
        this.stateService = stateService;
        this.productFactory = productFactory;
        this.configManager = configManager;
        console.log("CalculationService Initialized.");
    }

    /**
     * Calculates line prices for all valid items and the total sum using a provided product strategy.
     */
    calculateAndSum(quoteData, productStrategy) {
        if (!productStrategy) {
            console.error("CalculationService: productStrategy is required for calculateAndSum.");
            return { quoteData, firstError: { message: "Product strategy not provided." } };
        }

        const currentProductKey = quoteData.currentProduct;
        const currentProductData = quoteData.products[currentProductKey];
        
        let firstError = null;

        const newItems = currentProductData.items.map((item, index) => {
            const newItem = { ...item, linePrice: null };
            if (item.width && item.height && item.fabricType) {
                const priceMatrix = this.configManager.getPriceMatrix(item.fabricType);
                const result = productStrategy.calculatePrice(item, priceMatrix);
                
                if (result.price !== null) {
                    newItem.linePrice = result.price;
                } else if (!firstError) {
                    firstError = { ...result.error, rowIndex: index };
                }
            }
            return newItem;
        });

        const totalSum = newItems.reduce((sum, item) => sum + (item.linePrice || 0), 0);

        const updatedProductData = {
            ...currentProductData,
            items: newItems,
            summary: { ...currentProductData.summary, totalSum }
        };

        const updatedQuoteData = {
            ...quoteData,
            products: { ...quoteData.products, [currentProductKey]: updatedProductData }
        };

        return { updatedQuoteData, firstError };
    }

    calculateAccessorySalePrice(productType, accessoryName, data) {
        const productStrategy = this.productFactory.getProductStrategy(productType);
        if (!productStrategy) {
            console.error(`Strategy not found for product type: ${productType}`);
            return 0;
        }

        const { accessoryPriceKeyMap, accessoryMethodNameMap } = this.configManager.getAccessoryMappings();
        const priceKey = accessoryPriceKeyMap[accessoryName];
        const methodName = accessoryMethodNameMap[accessoryName];

        if (!priceKey || !methodName || typeof productStrategy[methodName] !== 'function') {
            console.error(`No sale price key or method found for accessory: ${accessoryName}`);
            return 0;
        }

        const pricePerUnit = this.configManager.getAccessoryPrice(priceKey) || 0;
        return productStrategy[methodName](data.items || data.count, pricePerUnit);
    }
    
    calculateAccessoryCost(productType, accessoryName, data) {
        const { costKey } = data;
        if (!costKey) {
            console.error(`Cost calculation for '${accessoryName}' requires a 'costKey' in the data payload.`);
            return 0;
        }

        const productStrategy = this.productFactory.getProductStrategy(productType);
        if (!productStrategy) {
            console.error(`Strategy not found for product type: ${productType}`);
            return 0;
        }

        const { accessoryMethodNameMap } = this.configManager.getAccessoryMappings();
        const methodName = accessoryMethodNameMap[accessoryName];
        
        if (!methodName || typeof productStrategy[methodName] !== 'function') {
            console.error(`No cost method found for accessory: ${accessoryName}`);
            return 0;
        }
        
        const costPerUnit = this.configManager.getAccessoryPrice(costKey) || 0;
        return productStrategy[methodName](data.count, costPerUnit);
    }

    calculateF1ComponentPrice(accessory, quantity) {
        const pricePerUnit = this.configManager.getAccessoryPrice(accessory) || 0;
        return quantity * pricePerUnit;
    }
    
    calculateF2Summary(quoteData, uiState) {
        const f2Config = this.configManager.getF2Config();
        const f2State = uiState.f2;
        const f1State = uiState.f1;
        
        const items = quoteData.products[quoteData.currentProduct].items;
        const totalSumFromQuickQuote = quoteData.products.rollerBlind.summary.totalSum || 0;

        const wifiSum = (f2State.wifiQty || 0) * f2Config.unitPrices.wifi;
        const deliveryFee = (f2State.deliveryQty || 0) * f2Config.unitPrices.delivery;
        const installFee = (f2State.installQty || 0) * f2Config.unitPrices.install;
        const removalFee = (f2State.removalQty || 0) * f2Config.unitPrices.removal;

        let totalSurcharge = wifiSum;
        if (!f2State.deliveryFeeExcluded) totalSurcharge += deliveryFee;
        if (!f2State.installFeeExcluded) totalSurcharge += installFee;
        if (!f2State.removalFeeExcluded) totalSurcharge += removalFee;

        const mulTimes = f2State.mulTimes || 1;
        const disVal = f2State.discount || 0;
        const disRbPrice = (totalSumFromQuickQuote * mulTimes) - disVal;
        const sumPrice = disRbPrice + totalSurcharge;
        
        const firstRbPrice = items.find(item => typeof item.linePrice === 'number' && item.linePrice > 0)?.linePrice || 0;

        const remote1chQtyF1 = f1State.remote_1ch_qty || 0;
        const remote16chQtyF1 = f1State.remote_16ch_qty ?? 0;
        const comboQtyF1 = f1State.dual_combo_qty ?? 0;
        const slimQtyF1 = f1State.dual_slim_qty ?? 0;
        
        const f1ComponentTotal =
            this.calculateF1ComponentPrice('winderHD', items.filter(item => item.winder === 'HD').length) +
            this.calculateF1ComponentPrice('motorStandard', items.filter(item => !!item.motor).length) +
            this.calculateF1ComponentPrice('remoteStandard', remote1chQtyF1) +
            this.calculateF1ComponentPrice('remoteStandard', remote16chQtyF1) +
            this.calculateF1ComponentPrice('chargerStandard', uiState.driveChargerCount || 0) +
            this.calculateF1ComponentPrice('cord3m', uiState.driveCordCount || 0) +
            this.calculateF1ComponentPrice('comboBracket', comboQtyF1) +
            this.calculateF1ComponentPrice('slimBracket', slimQtyF1);

        const f1DiscountPercentage = f1State.discountPercentage || 0;
        const retailTotalFromF1 = quoteData.products.rollerBlind.summary.totalSum || 0;
        const f1_rb_price = retailTotalFromF1 * (1 - (f1DiscountPercentage / 100));
        
        const f1SubTotal = f1ComponentTotal + f1_rb_price;
        const f1Gst = f1SubTotal * 0.10;
        const f1_final_total = f1SubTotal + f1Gst;

        const rbProfit = disRbPrice - f1_rb_price;
        const validItemCount = items.filter(item => typeof item.linePrice === 'number' && item.linePrice > 0).length;
        const singleprofit = validItemCount > 0 ? rbProfit / validItemCount : 0;
        
        const sumProfit = sumPrice - f1_final_total;
        const gst = sumPrice * 0.1;
        const netProfit = sumProfit - gst;

        return {
            totalSumForRbTime: totalSumFromQuickQuote,
            wifiSum,
            deliveryFee,
            installFee,
            removalFee,
            surchargeFee: totalSurcharge,
            disRbPrice,
            sumPrice,
            singleprofit,
            firstRbPrice,
            rbProfit,
            sumProfit,
            gst,
            netProfit
        };
    }
}