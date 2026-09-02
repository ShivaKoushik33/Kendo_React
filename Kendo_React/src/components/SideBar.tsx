import { type ReactNode } from 'react'
import { Drawer, DrawerContent } from '@progress/kendo-react-layout'
import { useNavigate, useLocation } from 'react-router-dom'

// we are using drawer component
const navigationItems = [
  { text: 'DashBoard', route: '/' },
  { text: 'Employees', route: '/employees' },
  { text: 'Employees (Virtual)', route: '/employees-virtualized' },
  { text: 'Projects', route: '/projects' },
  { text: 'Attendance', route: '/attendance' },
  { text: 'Performance', route: '/performance' },
  { text: 'Salary', route: '/salary' },
  { text: 'Leaves', route: '/leaves' },
  { text: 'Organization', route: '/organization' },
  { text: 'Reports', route: '/reports' },
  { text: 'Settings', route: '/settings' },
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
