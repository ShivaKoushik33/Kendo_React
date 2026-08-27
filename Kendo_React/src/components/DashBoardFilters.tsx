import { useEffect } from 'react'
import { ComboBox, DropDownList, MultiSelect, } from '@progress/kendo-react-dropdowns'
import { useDispatch, useSelector, } from 'react-redux'
import type { RootState, AppDispatch } from '../store/store'
import { setDepartment, setEmploymentType, setLocation, setSelectedSkills, fetchFilterOptions } from '../filters/filterSlice'



function DashBoardFilters() {

    const dispatch = useDispatch<AppDispatch>();
    const department = useSelector((state: RootState) => state.filters.department)
    const employmentType = useSelector((state: RootState) => state.filters.employmentType);
    const location = useSelector((state: RootState) => state.filters.location);
    const selectedSkills = useSelector((state: RootState) => state.filters.selectedSkills);
    const departments = useSelector((state: RootState) => state.filters.departments);
    const employmentTypes = useSelector((state: RootState) => state.filters.employmentTypes);
    const locations = useSelector((state: RootState) => state.filters.locations);
    const skills = useSelector((state: RootState) => state.filters.skills);

    useEffect(() => {
        dispatch(fetchFilterOptions());
    }, [dispatch]);

    return (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="min-w-0">
                <p className="mb-2 text-sm font-medium">
                    Employment Type
                </p>

                <DropDownList
                    className="w-full"
                    data={employmentTypes}
                    value={employmentType}
                    dataItemKey="id"
                    textField="name"
                    defaultValue="Select Employment"
                    onChange={(e) => {
                        dispatch(setEmploymentType(e.value))
                    }}
                />
            </div>

            <div className="min-w-0">
                <p className="mb-2 text-sm font-medium">
                    Departments
                </p>

                <ComboBox
                    className="w-full"
                    data={departments}
                    value={department}
                    dataItemKey="id"
                    textField="name"
                    placeholder="Select Department"
                    onChange={(e) => {
                        dispatch(setDepartment(e.value))
                    }}
                />
            </div>

            <div className="min-w-0">
                <p className="mb-2 text-sm font-medium">
                    Locations
                </p>

                <DropDownList
                    className="w-full"
                    data={locations}
                    value={location}
                    dataItemKey="id"
                    textField="name"
                    defaultValue="Location"
                    onChange={(e) => {
                        dispatch(setLocation(e.value))
                    }}
                />
            </div>

            <div className="min-w-0">
                <p className="mb-2 text-sm font-medium">
                    Skills
                </p>

                <MultiSelect
                    className="w-full"
                    data={skills}
                    value={selectedSkills}
                    dataItemKey="id"
                    textField="name"
                    placeholder="Select Skills"
                    onChange={(e) => {
                        dispatch(setSelectedSkills(e.value))
                    }}
                />
            </div>
        </div>
    )
}

export default DashBoardFilters
