import { useState } from 'react'
import Navbar from '../components/Navbar';
import SideBar from '../components/SideBar';
import { Outlet } from 'react-router-dom';
function MainLayout() {
    const[sideBarExpanded,setsideBarExpanded]=useState(true);

  return (
        <>
        <Navbar onMenuClick={()=>setsideBarExpanded((previous)=>!previous)}/>
        <SideBar expanded={sideBarExpanded}>
            <main>
              <Outlet/>
            </main>
        </SideBar>
    </>
  )
}

export default MainLayout