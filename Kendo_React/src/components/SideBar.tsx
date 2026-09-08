import { type ReactNode } from 'react'
import { Drawer, DrawerContent } from '@progress/kendo-react-layout'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  dashboardIcon,
  usersIcon,
  gridIcon,
  chartBarClusteredIcon,
  calendarDateIcon
} from '@progress/kendo-svg-icons'

// we are using drawer component
const navigationItems = [
  { text: 'DashBoard', route: '/', svgIcon: dashboardIcon },
  { text: 'Employees', route: '/employees', svgIcon: usersIcon },
  { text: 'Employees (Virtual)', route: '/employees-virtualized', svgIcon: gridIcon },
  { text: 'Projects', route: '/projects', svgIcon: chartBarClusteredIcon },
  { text: 'Attendance', route: '/attendance', svgIcon: calendarDateIcon },
  
]

type SidebarProps = {
  expanded: boolean
  children?: ReactNode
}

function SideBar({ expanded, children }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const items = navigationItems.map((item) => ({
    ...item,
    selected: location.pathname === item.route,
  }))

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      <Drawer
        expanded={expanded}
        position={'start'}
        mode={'push'}
        mini={true}
        items={items}
        onSelect={(e) => {
          const route = e.itemTarget?.props?.route
          if (route) {
            navigate(route)
          }
        }}
      />
      <DrawerContent>
        <div style={{ flex: 1, padding: '1rem' }}>{children}</div>
      </DrawerContent>
    </div>
  )
}

export default SideBar
