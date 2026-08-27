import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { getFilters } from "../services/FilterService";
import type { FilterOption } from "../types/filters";
import type { RootState } from "../store/store";

const ALL_DEPARTMENTS: FilterOption = { id: 0, name: "All Departments" };
const ALL_LOCATIONS: FilterOption = { id: 0, name: "All Locations" };
const ALL_TYPES: FilterOption = { id: 0, name: "All Types" };

interface FilterState {
    departments: FilterOption[];
    locations: FilterOption[];
    employmentTypes: FilterOption[];
    skills: FilterOption[];
    department: FilterOption | null;
    employmentType: FilterOption | null;
    location: FilterOption | null;
    selectedSkills: FilterOption[];
    loading: boolean;
    loaded: boolean;
}

const initialState: FilterState = {
    departments: [ALL_DEPARTMENTS],
    locations: [ALL_LOCATIONS],
    employmentTypes: [ALL_TYPES],
    skills: [],
    department: ALL_DEPARTMENTS,
    employmentType: ALL_TYPES,
    location: ALL_LOCATIONS,
    selectedSkills: [],
    loading: false,
    loaded: false,
};

export const fetchFilterOptions = createAsyncThunk(
    "filters/fetchOptions",
    async () => {
        return await getFilters();
    },
    {
        // Filter options are static reference data. Skip the request if we
        // already have them, or if one is already in flight.
        condition: (_, { getState }) => {
            const { loading, loaded } = (getState() as RootState).filters;
            return !loading && !loaded;
        },
    }
);

const filterSlice = createSlice({
    name: "filters",
    initialState,
    reducers: {
        setDepartment: (state, action: PayloadAction<FilterOption | null>) => {
            state.department = action.payload;
        },
        setEmploymentType: (state, action: PayloadAction<FilterOption | null>) => {
            state.employmentType = action.payload;
        },
        setLocation: (state, action: PayloadAction<FilterOption | null>) => {
            state.location = action.payload;
        },
        setSelectedSkills: (state, action: PayloadAction<FilterOption[]>) => {
            state.selectedSkills = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchFilterOptions.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchFilterOptions.fulfilled, (state, action) => {
                state.loading = false;
                state.loaded = true;
                state.departments = [ALL_DEPARTMENTS, ...action.payload.departments];
                state.locations = [ALL_LOCATIONS, ...action.payload.locations];
                state.employmentTypes = [ALL_TYPES, ...action.payload.employmentTypes];
                state.skills = action.payload.skills;
            })
            .addCase(fetchFilterOptions.rejected, (state) => {
                state.loading = false;
            });
    },
});

export const { setDepartment, setLocation, setEmploymentType, setSelectedSkills } = filterSlice.actions;
export default filterSlice.reducer;
