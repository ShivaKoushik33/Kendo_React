import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useDispatch, useSelector } from "react-redux";
import { DropDownList } from "@progress/kendo-react-dropdowns";
import { Button } from "@progress/kendo-react-buttons";
import { Dialog, DialogActionsBar } from "@progress/kendo-react-dialogs";
import { Checkbox, Input } from "@progress/kendo-react-inputs";
import {
    arrowRotateCcwIcon,
    pencilIcon,
    plusIcon,
    starIcon,
    trashIcon,
} from "@progress/kendo-svg-icons";
import ConfirmDialog from "./ConfirmDialog";
import type { AppDispatch, RootState } from "../store/store";
import { applySavedView, resetFilters } from "../filters/filterSlice";
import {
    createSavedView,
    deleteSavedView,
    getDefaultSavedView,
    getSavedViews,
    setDefaultSavedView,
    updateSavedView,
} from "../services/SavedViewService";
import type { SavedView } from "../types/savedView";
import type { ToastType } from "../hooks/useToast";

interface SavedViewsBarProps {
    showToast: (text: string, type: ToastType) => void;
}

// The API returns its 400/404/409 messages as plain strings, so surface those
// to the user and keep the generic text only for network-level failures.
const errorMessage = (error: unknown, fallback: string): string => {
    if (isAxiosError(error) && typeof error.response?.data === "string" && error.response.data) {
        return error.response.data;
    }
    return fallback;
};

// Kendo's DropDownList has no placeholder - an empty entry is modelled as a
// defaultItem instead. The blank id is what marks it as "not a real view".
const NO_VIEW: SavedView = {
    id: "",
    name: "No view selected",
    departmentId: 0,
    employmentTypeId: 0,
    locationId: 0,
    isDefault: false,
    createdAt: "",
    updatedAt: "",
};

const SavedViewsBar = ({ showToast }: SavedViewsBarProps) => {
    const dispatch = useDispatch<AppDispatch>();

    const department = useSelector((state: RootState) => state.filters.department);
    const employmentType = useSelector((state: RootState) => state.filters.employmentType);
    const location = useSelector((state: RootState) => state.filters.location);
    const filtersLoaded = useSelector((state: RootState) => state.filters.loaded);

    const [views, setViews] = useState<SavedView[]>([]);
    const [selectedView, setSelectedView] = useState<SavedView | null>(null);
    const [busy, setBusy] = useState(false);
    const [initialised, setInitialised] = useState(false);

    const [saveOpen, setSaveOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [newIsDefault, setNewIsDefault] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<SavedView | null>(null);

    // What the three dropdowns currently hold, in the id shape the API expects.
    const currentFilters = {
        departmentId: department?.id ?? 0,
        employmentTypeId: employmentType?.id ?? 0,
        locationId: location?.id ?? 0,
    };

    // Set Default flips IsDefault on two rows - the new default on and the old
    // one off - so always re-read the list instead of patching it locally.
    const refreshViews = useCallback(async (): Promise<SavedView[]> => {
        const list = await getSavedViews();
        setViews(list);
        return list;
    }, []);

    // Runs once, and only after the filter options exist - applying a view
    // means resolving its ids against those options.
    useEffect(() => {
        if (!filtersLoaded || initialised) return;

        const loadInitial = async () => {
            try {
                const [list, defaultView] = await Promise.all([
                    getSavedViews(),
                    getDefaultSavedView(),
                ]);

                setViews(list);

                if (defaultView) {
                    setSelectedView(defaultView);
                    dispatch(applySavedView(defaultView));
                }
            } catch (error) {
                console.error("Error loading saved views:", error);
                showToast("Could not load your saved views.", "error");
            } finally {
                setInitialised(true);
            }
        };

        loadInitial();
    }, [filtersLoaded, initialised, dispatch, showToast]);

    // Derived, not stored: the filters have drifted from the selected view.
    const isDirty =
        selectedView !== null &&
        (selectedView.departmentId !== currentFilters.departmentId ||
            selectedView.employmentTypeId !== currentFilters.employmentTypeId ||
            selectedView.locationId !== currentFilters.locationId);

    const handleSelect = (view: SavedView | null) => {
        setSelectedView(view);

        if (view) {
            dispatch(applySavedView(view));
        } else {
            // Picking the empty entry means "stop using a view" - clear back to All.
            dispatch(resetFilters());
        }
    };

    const handleSaveAs = async () => {
        const name = newName.trim();

        if (!name) {
            showToast("Enter a name for the view.", "warning");
            return;
        }

        setBusy(true);
        try {
            const created = await createSavedView({
                name,
                ...currentFilters,
                isDefault: newIsDefault,
            });

            await refreshViews();
            setSelectedView(created);

            setSaveOpen(false);
            setNewName("");
            setNewIsDefault(false);
            showToast(`View "${created.name}" saved.`, "success");
        } catch (error) {
            showToast(errorMessage(error, "Could not save the view."), "error");
        } finally {
            setBusy(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedView) return;

        setBusy(true);
        try {
            // PUT overwrites every column, so carry the name and default flag
            // through unchanged - this button only re-points the filters.
            await updateSavedView(selectedView.id, {
                name: selectedView.name,
                ...currentFilters,
                isDefault: selectedView.isDefault,
            });

            const list = await refreshViews();
            setSelectedView(list.find((item) => item.id === selectedView.id) ?? null);

            showToast(`View "${selectedView.name}" updated.`, "success");
        } catch (error) {
            showToast(errorMessage(error, "Could not update the view."), "error");
        } finally {
            setBusy(false);
        }
    };

    const handleSetDefault = async () => {
        if (!selectedView) return;

        setBusy(true);
        try {
            await setDefaultSavedView(selectedView.id);

            const list = await refreshViews();
            setSelectedView(list.find((item) => item.id === selectedView.id) ?? null);

            showToast(`"${selectedView.name}" is now your default view.`, "success");
        } catch (error) {
            showToast(errorMessage(error, "Could not set the default view."), "error");
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setBusy(true);
        try {
            await deleteSavedView(deleteTarget.id);
            await refreshViews();

            if (selectedView?.id === deleteTarget.id) {
                setSelectedView(null);
                dispatch(resetFilters());
            }

            showToast(`View "${deleteTarget.name}" deleted.`, "success");
            setDeleteTarget(null);
        } catch (error) {
            showToast(errorMessage(error, "Could not delete the view."), "error");
        } finally {
            setBusy(false);
        }
    };


    const filterSummary = [
        { label: "Employment Type", value: employmentType?.name ?? "All Types" },
        { label: "Department", value: department?.name ?? "All Departments" },
        { label: "Location", value: location?.name ?? "All Locations" },
    ];

    return (
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Saved View</span>

                    <DropDownList
                        style={{ width: 240 }}
                        data={views}
                        value={selectedView ?? NO_VIEW}
                        defaultItem={NO_VIEW}
                        dataItemKey="id"
                        textField="name"
                        disabled={busy || views.length === 0}
                        onChange={(e) => {
                            const view = e.value as SavedView;
                            handleSelect(view?.id ? view : null);
                        }}
                    />
                </div>

                {selectedView?.isDefault && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        Default
                    </span>
                )}

                {isDirty && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        Unsaved changes
                    </span>
                )}

                {views.length === 0 && (
                    <span className="text-xs text-gray-500">
                        No views yet - set your filters, then Save As.
                    </span>
                )}

                <div className="ml-auto flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        themeColor="primary"
                        svgIcon={plusIcon}
                        disabled={busy}
                        onClick={() => setSaveOpen(true)}
                    >
                        Save As
                    </Button>

                    <Button
                        type="button"
                        fillMode="outline"
                        svgIcon={pencilIcon}
                        title="Point this view at the current filters"
                        disabled={busy || !selectedView || !isDirty}
                        onClick={handleUpdate}
                    >
                        Update
                    </Button>

                    <Button
                        type="button"
                        fillMode="outline"
                        svgIcon={starIcon}
                        title="Load this view automatically on sign in"
                        disabled={busy || !selectedView || selectedView.isDefault}
                        onClick={handleSetDefault}
                    >
                        Set Default
                    </Button>

                    <Button
                        type="button"
                        fillMode="outline"
                        themeColor="error"
                        svgIcon={trashIcon}
                        title="Delete this view"
                        disabled={busy || !selectedView}
                        onClick={() => setDeleteTarget(selectedView)}
                    >
                        Delete
                    </Button>

                    <Button
                        type="button"
                        fillMode="flat"
                        svgIcon={arrowRotateCcwIcon}
                        title="Clear filters back to All"
                        disabled={busy}
                        onClick={() => handleSelect(null)}
                    >
                        Reset
                    </Button>
                </div>
            </div>

            {saveOpen && (
                <Dialog title="Save current filters as a view" width={420} onClose={() => setSaveOpen(false)}>
                    <p className="mb-1 text-sm font-medium">Name</p>

                    <Input
                        value={newName}
                        placeholder="e.g. Hyderabad Engineering"
                        style={{ width: "100%" }}
                        onChange={(e) => setNewName(String(e.value ?? ""))}
                    />

                    {/* Spell out what is about to be stored - the filters live in three
                        separate dropdowns above, and it is easy to save the wrong set. */}
                    <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3">
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                            Filters being saved
                        </p>

                        {filterSummary.map((item) => (
                            <div key={item.label} className="flex justify-between gap-4 py-0.5 text-sm">
                                <span className="text-gray-600">{item.label}</span>
                                <span className="font-medium">{item.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-3">
                        <Checkbox
                            label="Make this my default view"
                            value={newIsDefault}
                            onChange={(e) => setNewIsDefault(Boolean(e.value))}
                        />
                    </div>

                    <DialogActionsBar>
                        <Button type="button" disabled={busy} onClick={() => setSaveOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" themeColor="primary" disabled={busy} onClick={handleSaveAs}>
                            {busy ? "Saving..." : "Save"}
                        </Button>
                    </DialogActionsBar>
                </Dialog>
            )}

            {deleteTarget && (
                <ConfirmDialog
                    title="Delete saved view"
                    message={`Delete the view "${deleteTarget.name}"? This cannot be undone.`}
                    busy={busy}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
        </div>
    );
};

export default SavedViewsBar;
