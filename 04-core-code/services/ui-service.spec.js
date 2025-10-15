// File: 04-core-code/services/ui-service.spec.js

import { UIService } from './ui-service.js';
import { initialState } from '../config/initial-state.js';

describe('UIService', () => {
    let uiService;
    let mockStateService;
    let currentState;

    beforeEach(() => {
        // Arrange: Create a deep copy of the initial state for each test to ensure isolation.
        currentState = JSON.parse(JSON.stringify(initialState));

        // Arrange: Mock the StateService
        mockStateService = {
            getState: jest.fn(() => currentState),
            updateState: jest.fn((newState) => {
                // Simulate the state update for subsequent calls within the same test
                currentState = newState;
            }),
        };

        // Arrange: Instantiate the UIService with the mock StateService
        uiService = new UIService({ stateService: mockStateService });
    });

    describe('setActiveCell', () => {
        it('should call updateState with the new active cell and input mode', () => {
            // Arrange
            const rowIndex = 3;
            const column = 'height';

            // Act
            uiService.setActiveCell(rowIndex, column);

            // Assert
            expect(mockStateService.updateState).toHaveBeenCalledTimes(1);
            const newState = mockStateService.updateState.mock.calls[0][0];
            expect(newState.ui.activeCell).toEqual({ rowIndex: 3, column: 'height' });
            expect(newState.ui.inputMode).toBe('height');
        });
    });

    describe('toggleMultiSelectMode', () => {
        it('should enable multi-select mode and capture the selected row index', () => {
            // Arrange
            currentState.ui.selectedRowIndex = 5; // Simulate a row being selected

            // Act
            uiService.toggleMultiSelectMode();

            // Assert
            expect(mockStateService.updateState).toHaveBeenCalledTimes(1);
            const newState = mockStateService.updateState.mock.calls[0][0];
            expect(newState.ui.isMultiSelectMode).toBe(true);
            expect(newState.ui.multiSelectSelectedIndexes).toEqual([5]);
            expect(newState.ui.selectedRowIndex).toBeNull();
        });

        it('should disable multi-select mode', () => {
            // Arrange
            currentState.ui.isMultiSelectMode = true;
            currentState.ui.multiSelectSelectedIndexes = [1, 2];

            // Act
            uiService.toggleMultiSelectMode();

            // Assert
            expect(mockStateService.updateState).toHaveBeenCalledTimes(1);
            const newState = mockStateService.updateState.mock.calls[0][0];
            expect(newState.ui.isMultiSelectMode).toBe(false);
            expect(newState.ui.multiSelectSelectedIndexes).toEqual([]);
        });
    });

    describe('setF1DiscountPercentage', () => {
        it('should update the discountPercentage in the f1 state object', () => {
            // Act
            uiService.setF1DiscountPercentage(15);
    
            // Assert
            expect(mockStateService.updateState).toHaveBeenCalledTimes(1);
            const newState = mockStateService.updateState.mock.calls[0][0];
            expect(newState.ui.f1.discountPercentage).toBe(15);
        });
    });

    describe('setF2Value', () => {
        it('should update a specific value in the f2 state object', () => {
            // Act
            uiService.setF2Value('wifiQty', 2);
    
            // Assert
            expect(mockStateService.updateState).toHaveBeenCalledTimes(1);
            const newState = mockStateService.updateState.mock.calls[0][0];
            expect(newState.ui.f2.wifiQty).toBe(2);
        });
    });
});