import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Plant } from '@/types/models';

interface PlantState {
  selectedPlant: Plant | null;
}

const initialState: PlantState = {
  selectedPlant: null,
};

export const plantSlice = createSlice({
  name: 'plants',
  initialState,
  reducers: {
    setSelectedPlant: (state, action: PayloadAction<Plant | null>) => {
      state.selectedPlant = action.payload;
    },
  },
});

export const { setSelectedPlant } = plantSlice.actions;

export default plantSlice.reducer; 